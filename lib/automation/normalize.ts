import { ExtractedJobData, JobSourceConfig, NormalizedAutomationJob, RawFetchedJob } from './types';
import { cleanText, hashText, normalizeUrl, splitList, toIsoDate, toJson } from './utils';

const KNOWN_SKILLS = [
  'javascript',
  'typescript',
  'react',
  'next.js',
  'node.js',
  'java',
  'python',
  'sql',
  'postgresql',
  'mysql',
  'mongodb',
  'aws',
  'azure',
  'gcp',
  'docker',
  'kubernetes',
  'git',
  'rest api',
  'graphql',
  'html',
  'css',
  'tailwind',
  'spring boot',
  '.net',
];

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => cleanText(value)).filter(Boolean))];
}

function inferSkills(description: string) {
  const lowerDescription = description.toLowerCase();

  return KNOWN_SKILLS.filter((skill) => lowerDescription.includes(skill)).map((skill) =>
    skill
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  );
}

function inferExperience(description: string) {
  const matches = description.match(/(\d+\+?\s*(?:to\s*\d+\+?\s*)?(?:years?|yrs?))/i);
  return matches?.[1] || '';
}

function normalizeExperienceLabel(value: string) {
  const cleaned = cleanText(value)
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\bto\b/gi, '-')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return '';
  }

  const rangeMatch = cleaned.match(/(\d{1,2})-(\d{1,2})/);
  if (rangeMatch) {
    const start = Number.parseInt(rangeMatch[1], 10);
    const end = Number.parseInt(rangeMatch[2], 10);
    if (Number.isFinite(start) && Number.isFinite(end)) {
      return `${Math.min(start, end)}-${Math.max(start, end)} Years`;
    }
  }

  const plusMatch = cleaned.match(/(\d{1,2})\s*\+/);
  if (plusMatch) {
    const value = Number.parseInt(plusMatch[1], 10);
    if (Number.isFinite(value)) {
      return `${value}+ Years`;
    }
  }

  const singleMatch = cleaned.match(/(\d{1,2})/);
  if (singleMatch) {
    const value = Number.parseInt(singleMatch[1], 10);
    if (Number.isFinite(value)) {
      return `${value} Years`;
    }
  }

  return cleaned;
}

function normalizeParagraph(text: string | null | undefined, fallback: string) {
  const normalizedText = cleanText(text);
  return normalizedText || fallback;
}

export function buildSourceHash(rawJob: RawFetchedJob) {
  return hashText(
    [
      rawJob.sourceId,
      rawJob.externalId || '',
      rawJob.detailUrl || rawJob.applyLink || rawJob.sourceUrl,
      cleanText(rawJob.title),
      cleanText(rawJob.company),
    ].join('::')
  );
}

export function normalizeExtractedJob(
  extracted: ExtractedJobData,
  rawJob: RawFetchedJob,
  source: JobSourceConfig,
  slug: string,
  aiModel: string | null
): NormalizedAutomationJob {
  const description = normalizeParagraph(
    extracted.description || rawJob.description,
    'Visit the apply link for the full job description.'
  );
  const skills = uniqueStrings([...splitList(extracted.skills), ...inferSkills(description)]);
  const roles = uniqueStrings(splitList(extracted.roles_responsibilities));
  const eligibility = uniqueStrings(splitList(extracted.eligibility_criteria));
  const howToApply = uniqueStrings(splitList(extracted.how_to_apply));

  const normalizedPayload = {
    title: cleanText(extracted.title || rawJob.title) || 'Untitled Role',
    company: cleanText(extracted.company || rawJob.company || source.company) || 'Unknown Company',
    location: cleanText(extracted.location || rawJob.location || source.location) || 'India',
    experience_level:
      normalizeExperienceLabel(
        cleanText(extracted.experience) || inferExperience(description) || '0-2 Years'
      ) || '0-2 Years',
    required_skills: skills,
    apply_link: normalizeUrl(
      extracted.apply_link || rawJob.applyLink || rawJob.detailUrl,
      rawJob.sourceUrl
    ),
    description,
    salary: cleanText(extracted.salary) || 'Not Disclosed',
    job_type: cleanText(extracted.job_type) || 'Full Time',
    category: cleanText(extracted.category || source.category) || 'Technology',
    work_mode: cleanText(extracted.work_mode) || '',
    about_company: normalizeParagraph(extracted.about_company, ''),
    qualification: 'CS/IT Graduate',
    roles_responsibilities: roles,
    eligibility_criteria: eligibility,
    how_to_apply: howToApply,
    application_deadline: toIsoDate(extracted.application_deadline),
    number_of_openings:
      extracted.number_of_openings && extracted.number_of_openings > 0
        ? extracted.number_of_openings
        : 1,
  };

  return {
    source_name: rawJob.sourceName,
    source_type: rawJob.sourceType,
    source_url: rawJob.sourceUrl,
    external_id: rawJob.externalId || null,
    raw_title: rawJob.title || null,
    raw_company: rawJob.company || null,
    raw_location: rawJob.location || null,
    raw_payload: toJson(rawJob.rawPayload || {}),
    description_raw: rawJob.description || null,
    extracted_payload: toJson(extracted),
    normalized_payload: toJson(normalizedPayload),
    title: normalizedPayload.title,
    company: normalizedPayload.company,
    location: normalizedPayload.location,
    salary: normalizedPayload.salary,
    description: normalizedPayload.description,
    apply_link: normalizedPayload.apply_link,
    category: normalizedPayload.category,
    slug,
    job_type: normalizedPayload.job_type,
    experience_level: normalizedPayload.experience_level,
    roles_responsibilities: normalizedPayload.roles_responsibilities.join('\n'),
    eligibility_criteria: normalizedPayload.eligibility_criteria.join('\n'),
    required_skills: normalizedPayload.required_skills.join('\n'),
    how_to_apply: normalizedPayload.how_to_apply.join('\n'),
    application_deadline: normalizedPayload.application_deadline,
    work_mode: normalizedPayload.work_mode,
    number_of_openings: normalizedPayload.number_of_openings,
    about_company: normalizedPayload.about_company,
    whatsapp_message: '',
    telegram_message: '',
    ai_model: aiModel,
    source_hash: buildSourceHash(rawJob),
    metadata: toJson(rawJob.metadata || {}),
  };
}
