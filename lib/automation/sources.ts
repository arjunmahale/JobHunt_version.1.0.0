import { load } from 'cheerio';
import { JobSourceConfig, RawFetchedJob } from './types';
import { buildAbsoluteUrl, cleanText, DEFAULT_REQUEST_HEADERS, getValueByPath, uniqueBy } from './utils';

async function fetchSourceUrl(source: JobSourceConfig, url = source.url) {
  const response = await fetch(url, {
    method: source.method || 'GET',
    headers: {
      ...DEFAULT_REQUEST_HEADERS,
      ...(source.headers || {}),
    },
    body: source.method === 'POST' ? source.body : undefined,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch source "${source.name}" (${response.status})`);
  }

  return response;
}

function extractJobPostingFromJsonLd(html: string, url: string) {
  const $ = load(html);
  const scripts = $('script[type="application/ld+json"]')
    .map((_, element) => $(element).html() || '')
    .get();

  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script) as Record<string, unknown> | Record<string, unknown>[];
      const queue = Array.isArray(parsed) ? parsed : [parsed];

      for (const entry of queue) {
        const graph = Array.isArray(entry['@graph']) ? (entry['@graph'] as Record<string, unknown>[]) : [entry];
        for (const node of graph) {
          if (node?.['@type'] === 'JobPosting') {
            const hiringOrganization = node.hiringOrganization as Record<string, unknown> | undefined;
            const jobLocation = node.jobLocation as Record<string, unknown> | undefined;
            const address = jobLocation?.address as Record<string, unknown> | undefined;

            return {
              title: cleanText(String(node.title || '')),
              company: cleanText(String(hiringOrganization?.name || '')),
              location: cleanText(String(address?.addressLocality || '')),
              description: cleanText(String(node.description || '')),
              applyLink: buildAbsoluteUrl(url, String(node.url || '')) || url,
            };
          }
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

async function enrichWithDetailPage(rawJob: RawFetchedJob, source: JobSourceConfig) {
  if (source.fetchDetails === false || !rawJob.detailUrl) {
    return rawJob;
  }

  try {
    const response = await fetchSourceUrl(source, rawJob.detailUrl);
    const html = await response.text();
    const $ = load(html);
    const jsonLd = extractJobPostingFromJsonLd(html, rawJob.detailUrl);
    const detailSelectors = source.detailSelectors || {};

    return {
      ...rawJob,
      title:
        rawJob.title ||
        jsonLd?.title ||
        cleanText($(detailSelectors.title || '').first().text()) ||
        null,
      company:
        rawJob.company ||
        jsonLd?.company ||
        cleanText($(detailSelectors.company || '').first().text()) ||
        null,
      location:
        rawJob.location ||
        jsonLd?.location ||
        cleanText($(detailSelectors.location || '').first().text()) ||
        null,
      applyLink:
        rawJob.applyLink ||
        jsonLd?.applyLink ||
        buildAbsoluteUrl(rawJob.detailUrl, $(detailSelectors.applyLink || '').first().attr('href')) ||
        rawJob.detailUrl,
      description:
        rawJob.description ||
        jsonLd?.description ||
        cleanText($(detailSelectors.description || '').first().html() || $(detailSelectors.description || '').first().text()) ||
        null,
      rawHtml: html,
    };
  } catch {
    return rawJob;
  }
}

async function fetchGenericJsonJobs(source: JobSourceConfig): Promise<RawFetchedJob[]> {
  const response = await fetchSourceUrl(source);
  const payload = (await response.json()) as Record<string, unknown>;
  const itemPath = source.itemPath || 'jobs';
  const rawItems = getValueByPath(payload, itemPath);
  const items = Array.isArray(rawItems) ? rawItems : [];
  const mapping = source.mapping || {};

  return items.slice(0, source.maxItems || 20).map((item, index) => {
    const record = item as Record<string, unknown>;
    const detailUrl =
      buildAbsoluteUrl(source.url, String(getValueByPath(record, mapping.link || 'url') || '')) ||
      source.url;

    return {
      sourceId: source.id,
      sourceName: source.name,
      sourceType: source.type,
      sourceUrl: source.url,
      externalId: String(getValueByPath(record, mapping.externalId || 'id') || `${source.id}-${index}`),
      title: cleanText(String(getValueByPath(record, mapping.title || 'title') || '')) || null,
      company:
        cleanText(String(getValueByPath(record, mapping.company || 'company') || '')) ||
        source.company ||
        null,
      location:
        cleanText(String(getValueByPath(record, mapping.location || 'location') || '')) ||
        source.location ||
        null,
      detailUrl,
      applyLink:
        buildAbsoluteUrl(source.url, String(getValueByPath(record, mapping.applyLink || 'apply_link') || '')) ||
        detailUrl,
      description:
        cleanText(String(getValueByPath(record, mapping.description || 'description') || '')) || null,
      rawPayload: record,
      metadata: source.metadata,
    };
  });
}

async function fetchGreenhouseJobs(source: JobSourceConfig): Promise<RawFetchedJob[]> {
  const response = await fetchSourceUrl(source);
  const payload = (await response.json()) as { jobs?: Record<string, unknown>[] };
  const jobs = payload.jobs || [];

  return jobs.slice(0, source.maxItems || 20).map((job) => ({
    sourceId: source.id,
    sourceName: source.name,
    sourceType: source.type,
    sourceUrl: source.url,
    externalId: String(job.id || ''),
    title: cleanText(String(job.title || '')) || null,
    company: source.company || null,
    location: cleanText(String((job.location as Record<string, unknown> | undefined)?.name || '')) || null,
    detailUrl: buildAbsoluteUrl(source.url, String(job.absolute_url || '')) || source.url,
    applyLink: buildAbsoluteUrl(source.url, String(job.absolute_url || '')) || source.url,
    description: cleanText(String(job.content || '')) || null,
    rawPayload: job,
    metadata: source.metadata,
  }));
}

async function fetchLeverJobs(source: JobSourceConfig): Promise<RawFetchedJob[]> {
  const response = await fetchSourceUrl(source);
  const payload = (await response.json()) as Record<string, unknown>[];

  return payload.slice(0, source.maxItems || 20).map((job) => ({
    sourceId: source.id,
    sourceName: source.name,
    sourceType: source.type,
    sourceUrl: source.url,
    externalId: String(job.id || ''),
    title: cleanText(String(job.text || '')) || null,
    company: source.company || null,
    location: cleanText(String((job.categories as Record<string, unknown> | undefined)?.location || '')) || null,
    detailUrl: buildAbsoluteUrl(source.url, String(job.hostedUrl || '')) || source.url,
    applyLink: buildAbsoluteUrl(source.url, String(job.applyUrl || job.hostedUrl || '')) || source.url,
    description: cleanText(String(job.descriptionPlain || job.description || '')) || null,
    rawPayload: job,
    metadata: source.metadata,
  }));
}

async function fetchGenericHtmlJobs(
  source: JobSourceConfig,
  overrides?: Partial<JobSourceConfig['selectors']>
): Promise<RawFetchedJob[]> {
  const response = await fetchSourceUrl(source);
  const html = await response.text();
  const $ = load(html);
  const selectors = {
    card: source.selectors?.card || 'a[href]',
    title: source.selectors?.title || 'h2, h3, a',
    company: source.selectors?.company || '',
    location: source.selectors?.location || '',
    description: source.selectors?.description || '',
    link: source.selectors?.link || 'a',
    externalId: source.selectors?.externalId || '',
    ...(overrides || {}),
  };

  const cards = $(selectors.card).slice(0, source.maxItems || 20).toArray();

  const jobs = await Promise.all(
    cards.map(async (card, index) => {
      const element = $(card);
      const linkElement =
        selectors.link === ':self' ? element : element.find(selectors.link).first();
      const detailUrl =
        buildAbsoluteUrl(source.url, linkElement.attr('href')) ||
        buildAbsoluteUrl(source.url, element.attr('href')) ||
        source.url;

      const rawJob: RawFetchedJob = {
        sourceId: source.id,
        sourceName: source.name,
        sourceType: source.type,
        sourceUrl: source.url,
        externalId:
          cleanText(element.find(selectors.externalId).first().text()) ||
          element.attr('data-id') ||
          `${source.id}-${index}`,
        title:
          cleanText(element.find(selectors.title).first().text()) ||
          cleanText(element.text()) ||
          null,
        company:
          cleanText(element.find(selectors.company).first().text()) ||
          source.company ||
          null,
        location:
          cleanText(element.find(selectors.location).first().text()) ||
          source.location ||
          null,
        detailUrl,
        applyLink: detailUrl,
        description:
          cleanText(element.find(selectors.description).first().text()) || null,
        rawPayload: {
          html: $.html(card),
        },
        metadata: source.metadata,
      };

      return enrichWithDetailPage(rawJob, source);
    })
  );

  return uniqueBy(jobs, (job) => job.detailUrl || `${job.title}-${job.company}`);
}

async function fetchLinkedInJobs(source: JobSourceConfig) {
  return fetchGenericHtmlJobs(source, {
    card: source.selectors?.card || '.base-card',
    title: source.selectors?.title || 'h3.base-search-card__title',
    company: source.selectors?.company || 'h4.base-search-card__subtitle',
    location: source.selectors?.location || '.job-search-card__location',
    link: source.selectors?.link || 'a.base-card__full-link',
    description: source.selectors?.description || '.base-search-card__metadata',
  });
}

async function fetchIndeedJobs(source: JobSourceConfig) {
  return fetchGenericHtmlJobs(source, {
    card: source.selectors?.card || '[data-testid="slider_item"]',
    title: source.selectors?.title || 'a[data-jk], h2.jobTitle',
    company: source.selectors?.company || '[data-testid="company-name"]',
    location: source.selectors?.location || '[data-testid="text-location"]',
    link: source.selectors?.link || 'a[data-jk]',
    description: source.selectors?.description || '.job-snippet',
  });
}

async function fetchNaukriJobs(source: JobSourceConfig) {
  return fetchGenericHtmlJobs(source, {
    card: source.selectors?.card || 'article.jobTuple',
    title: source.selectors?.title || 'a.title',
    company: source.selectors?.company || '.comp-name',
    location: source.selectors?.location || '.locWdth',
    link: source.selectors?.link || 'a.title',
    description: source.selectors?.description || '.job-desc',
  });
}

export async function fetchJobsFromSource(source: JobSourceConfig) {
  switch (source.type) {
    case 'greenhouse':
      return fetchGreenhouseJobs(source);
    case 'lever':
      return fetchLeverJobs(source);
    case 'json':
      return fetchGenericJsonJobs(source);
    case 'linkedin':
      return fetchLinkedInJobs(source);
    case 'indeed':
      return fetchIndeedJobs(source);
    case 'naukri':
      return fetchNaukriJobs(source);
    case 'html':
    default:
      return fetchGenericHtmlJobs(source);
  }
}
