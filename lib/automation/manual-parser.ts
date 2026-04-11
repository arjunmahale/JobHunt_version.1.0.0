import { ExtractedJobData, RawFetchedJob } from './types';

const DEFAULT_APPLY_LINK = (() => {
  const configuredUrl = String(process.env.NEXT_PUBLIC_APP_URL || '').trim();
  if (!configuredUrl) {
    return 'https://jobhuntportal.vercel.app';
  }

  try {
    return new URL(configuredUrl).toString().replace(/\/+$/, '');
  } catch {
    return 'https://jobhuntportal.vercel.app';
  }
})();

const TITLE_PATTERNS = [
  /^(?:job\s*title|title|role|position|opening)\s*[:\-]\s*(.+)$/i,
  /^(?:hiring\s+for|we\s+are\s+hiring\s+for)\s*[:\-]?\s*(.+)$/i,
];

const COMPANY_PATTERNS = [
  /^(?:company|organization|employer)\s*[:\-]\s*(.+)$/i,
  /(?:\bat\s+)([A-Z][A-Za-z0-9&.,'\- ]{1,60})$/,
];

const LOCATION_PATTERNS = [
  /^(?:location|job\s*location|based\s+in)\s*[:\-]\s*(.+)$/i,
  /\bbased\s+in\s+([A-Za-z ]{2,50})/i,
];

const SALARY_PATTERNS = [
  /(?:\u20B9|Rs\.?)\s?\d[\d,]*(?:\.\d+)?\s*(?:-|to)\s*(?:\u20B9|Rs\.?)?\s?\d[\d,]*(?:\.\d+)?\s*(?:LPA|lpa)?/i,
  /(?:\u20B9|Rs\.?)\s?\d[\d,]*(?:\.\d+)?\s*(?:LPA|lpa)/i,
  /\b\d{1,2}(?:\.\d+)?\s*(?:LPA|lpa)\b/i,
  /(?:\u20B9|Rs\.?)\s?\d[\d,]*(?:,\d{3})+/i,
];

const RANGE_EXPERIENCE_PATTERNS = [
  /(\d{1,2})\s*(?:-|to)\s*(\d{1,2})\s*(?:years?|yrs?)/i,
  /(\d{1,2})\s*[- ]\s*(\d{1,2})\s*(?:years?|yrs?)/i,
];

const SINGLE_EXPERIENCE_PATTERN = /(\d{1,2})\s*\+?\s*(?:years?|yrs?)/i;

const FRESHER_PATTERNS = [
  /\bfresher\b/i,
  /\bfreshers\b/i,
  /\bentry[- ]?level\b/i,
  /\bnew grad\b/i,
  /\bcampus\b/i,
  /\b0\s*(?:-|to)\s*2\s*(?:years?|yrs?)\b/i,
  /\b0\s*(?:-|to)\s*1\s*(?:years?|yrs?)\b/i,
  /\b1\s*(?:-|to)\s*2\s*(?:years?|yrs?)\b/i,
];

const SKILL_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'Java', pattern: /\bjava\b/i },
  { label: 'Spring', pattern: /\bspring\b/i },
  { label: 'Spring Boot', pattern: /\bspring\s*boot\b/i },
  { label: 'React', pattern: /\breact(?:\.js)?\b/i },
  { label: 'Angular', pattern: /\bangular\b/i },
  { label: 'Node.js', pattern: /\bnode(?:\.js)?\b/i },
  { label: 'Python', pattern: /\bpython\b/i },
  { label: 'AWS', pattern: /\baws\b|amazon web services/i },
  { label: 'Docker', pattern: /\bdocker\b/i },
  { label: 'SQL', pattern: /\bsql\b/i },
  { label: 'TypeScript', pattern: /\btypescript\b/i },
  { label: 'JavaScript', pattern: /\bjavascript\b/i },
  { label: 'PostgreSQL', pattern: /\bpostgresql\b|\bpostgres\b/i },
  { label: 'MySQL', pattern: /\bmysql\b/i },
  { label: 'MongoDB', pattern: /\bmongodb\b/i },
  { label: 'Kubernetes', pattern: /\bkubernetes\b|\bk8s\b/i },
  { label: 'Git', pattern: /\bgit\b/i },
  { label: 'REST API', pattern: /\brest(?:ful)?\s*api\b/i },
  { label: 'GraphQL', pattern: /\bgraphql\b/i },
  { label: 'HTML', pattern: /\bhtml\b/i },
  { label: 'CSS', pattern: /\bcss\b/i },
];

const COMPANY_NAME_HINTS = [
  'Google',
  'Microsoft',
  'Amazon',
  'Apple',
  'Meta',
  'Netflix',
  'Adobe',
  'Oracle',
  'Salesforce',
  'Infosys',
  'TCS',
  'Wipro',
  'Accenture',
  'Cognizant',
  'HCL',
  'Capgemini',
  'Flipkart',
  'Paytm',
  'Zoho',
  'Freshworks',
];

const INDIAN_CITIES = [
  'Bangalore',
  'Bengaluru',
  'Pune',
  'Hyderabad',
  'Mumbai',
  'Chennai',
  'Gurgaon',
  'Gurugram',
  'Noida',
  'Delhi',
  'Navi Mumbai',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
  'Kochi',
  'Trivandrum',
];

type SectionKey = 'skills' | 'responsibilities' | 'eligibility' | 'about' | 'how_to_apply';

const SECTION_PATTERNS: Record<SectionKey, RegExp[]> = {
  skills: [/^skills?$/i, /^required skills?$/i, /^technologies$/i, /^tech stack$/i, /^stack$/i],
  responsibilities: [
    /^responsibilities$/i,
    /^role responsibilities$/i,
    /^what you will do$/i,
    /^in this role you will$/i,
    /^job duties$/i,
  ],
  eligibility: [
    /^qualifications?$/i,
    /^requirements?$/i,
    /^eligibility$/i,
    /^who can apply$/i,
    /^minimum qualifications?$/i,
  ],
  about: [/^about company$/i, /^about us$/i, /^about the company$/i, /^company overview$/i],
  how_to_apply: [/^how to apply$/i, /^application process$/i, /^apply$/i, /^how do i apply$/i],
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeWhitespace(value: string) {
  return value
    .replace(/\r/g, '')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function stripHtmlKeepLines(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|h1|h2|h3|h4|h5|h6)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, ' ');
}

function cleanLine(value: string) {
  return value
    .replace(/^[\s\-*.\u2022\d)]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function extractFirstUrl(text: string) {
  const match = text.match(/https?:\/\/[^\s<>"')]+/i);
  return match?.[0] || null;
}

function extractFromPatterns(lines: string[], patterns: RegExp[]) {
  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match?.[1]) {
        return cleanLine(match[1]);
      }
    }
  }

  return '';
}

function isLikelyHeading(line: string) {
  if (!line) {
    return false;
  }

  const trimmed = line.trim();
  if (trimmed.endsWith(':')) {
    return true;
  }

  return /^[A-Z][A-Z\s/&-]{2,40}$/.test(trimmed);
}

function detectSectionHeading(line: string): { key: SectionKey; inlineValue: string } | null {
  const normalized = line.trim().replace(/:+$/, '');
  const lower = normalized.toLowerCase();

  for (const key of Object.keys(SECTION_PATTERNS) as SectionKey[]) {
    for (const pattern of SECTION_PATTERNS[key]) {
      if (pattern.test(lower)) {
        return { key, inlineValue: '' };
      }
    }
  }

  const parts = line.split(':');
  if (parts.length >= 2) {
    const heading = parts[0].trim().toLowerCase();
    const rest = cleanLine(parts.slice(1).join(':'));

    for (const key of Object.keys(SECTION_PATTERNS) as SectionKey[]) {
      for (const pattern of SECTION_PATTERNS[key]) {
        if (pattern.test(heading)) {
          return { key, inlineValue: rest };
        }
      }
    }
  }

  return null;
}

function parseSections(lines: string[]) {
  const sections: Record<SectionKey, string[]> = {
    skills: [],
    responsibilities: [],
    eligibility: [],
    about: [],
    how_to_apply: [],
  };

  let index = 0;
  while (index < lines.length) {
    const heading = detectSectionHeading(lines[index]);
    if (!heading) {
      index += 1;
      continue;
    }

    if (heading.inlineValue) {
      sections[heading.key].push(heading.inlineValue);
    }

    let pointer = index + 1;
    while (pointer < lines.length) {
      const candidate = lines[pointer];
      if (!candidate) {
        pointer += 1;
        continue;
      }

      if (detectSectionHeading(candidate)) {
        break;
      }

      if (isLikelyHeading(candidate) && !candidate.startsWith('-')) {
        break;
      }

      sections[heading.key].push(cleanLine(candidate));
      pointer += 1;
    }

    index = pointer;
  }

  return {
    skills: uniqueStrings(sections.skills),
    responsibilities: uniqueStrings(sections.responsibilities),
    eligibility: uniqueStrings(sections.eligibility),
    about: uniqueStrings(sections.about),
    howToApply: uniqueStrings(sections.how_to_apply),
  };
}

function normalizeCompanyName(value: string) {
  const cleaned = value
    .replace(/\s+(hiring|jobs?|careers?)$/i, '')
    .replace(/\s*\|\s*.*/g, '')
    .trim();

  if (!cleaned) {
    return '';
  }

  return cleaned
    .split(' ')
    .map((part) => {
      if (/^[A-Z0-9&.-]{2,}$/.test(part)) {
        return part;
      }

      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(' ');
}

function extractCompany(lines: string[], text: string, fallbackTitle: string) {
  const labeled = extractFromPatterns(lines, COMPANY_PATTERNS);
  if (labeled) {
    return normalizeCompanyName(labeled);
  }

  const titleAtMatch = fallbackTitle.match(/\bat\s+([A-Z][A-Za-z0-9&.,'\- ]{1,60})$/);
  if (titleAtMatch?.[1]) {
    return normalizeCompanyName(titleAtMatch[1]);
  }

  for (const company of COMPANY_NAME_HINTS) {
    if (new RegExp(`\\b${escapeRegex(company)}\\b`, 'i').test(text)) {
      return company;
    }
  }

  const hiringMatch = text.match(/\b(?:at|with|join)\s+([A-Z][A-Za-z0-9&.,'\- ]{1,60})(?:\s|,|\.|$)/);
  if (hiringMatch?.[1]) {
    return normalizeCompanyName(hiringMatch[1]);
  }

  return 'Unknown Company';
}

function normalizeLocation(value: string) {
  const cleaned = value
    .replace(/\b(?:location|based in)\b[:\-]*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return '';
  }

  return cleaned
    .split(',')
    .map((part) =>
      part
        .trim()
        .split(' ')
        .map((word) => {
          if (!word) {
            return word;
          }

          if (word.length <= 3 && word === word.toUpperCase()) {
            return word;
          }

          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ')
    )
    .join(', ');
}

function extractLocation(lines: string[], text: string) {
  const labeled = extractFromPatterns(lines, LOCATION_PATTERNS);
  if (labeled) {
    return normalizeLocation(labeled);
  }

  const basedIn = text.match(/\bbased in\s+([A-Za-z ]{2,50})/i);
  if (basedIn?.[1]) {
    return normalizeLocation(basedIn[1]);
  }

  const matchedCities = INDIAN_CITIES.filter((city) =>
    new RegExp(`\\b${escapeRegex(city)}\\b`, 'i').test(text)
  );

  if (matchedCities.length > 0) {
    return matchedCities[0];
  }

  if (/\bremote\b|\bwork from home\b|\bwfh\b/i.test(text)) {
    return 'Remote, India';
  }

  return 'India';
}

function normalizeExperience(experienceText: string, fullText: string) {
  if (!experienceText && FRESHER_PATTERNS.some((pattern) => pattern.test(fullText))) {
    return '0-2 Years';
  }

  for (const pattern of RANGE_EXPERIENCE_PATTERNS) {
    const match = experienceText.match(pattern) || fullText.match(pattern);
    if (match?.[1] && match?.[2]) {
      const start = Number.parseInt(match[1], 10);
      const end = Number.parseInt(match[2], 10);
      if (Number.isFinite(start) && Number.isFinite(end)) {
        if (end <= 2) {
          return '0-2 Years';
        }

        return `${Math.min(start, end)}-${Math.max(start, end)} Years`;
      }
    }
  }

  const singleMatch =
    experienceText.match(SINGLE_EXPERIENCE_PATTERN) || fullText.match(SINGLE_EXPERIENCE_PATTERN);
  if (singleMatch?.[1]) {
    const value = Number.parseInt(singleMatch[1], 10);
    if (Number.isFinite(value)) {
      if (value <= 2) {
        return '0-2 Years';
      }

      if (/\+/.test(singleMatch[0])) {
        return `${value}+ Years`;
      }

      return `${value} Years`;
    }
  }

  return '0-2 Years';
}

function extractExperience(lines: string[], text: string) {
  const labeled = extractFromPatterns(lines, [/^(?:experience|exp|experience level)\s*[:\-]\s*(.+)$/i]);
  return normalizeExperience(labeled, text);
}

function normalizeSalary(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/lpa/gi, 'LPA')
    .replace(/Rs\.\s+/gi, 'Rs.')
    .replace(/\u20B9\s+/g, '\u20B9')
    .trim();
}

function extractSalary(lines: string[], text: string) {
  const labeled = extractFromPatterns(lines, [/^(?:salary|ctc|compensation)\s*[:\-]\s*(.+)$/i]);
  const candidate = labeled || text;

  for (const pattern of SALARY_PATTERNS) {
    const match = candidate.match(pattern);
    if (match?.[0]) {
      return normalizeSalary(match[0]);
    }
  }

  return 'Not Disclosed';
}

function extractWorkMode(text: string) {
  if (/\bhybrid\b/i.test(text)) {
    return 'Hybrid';
  }

  if (/\bremote\b|\bwork from home\b|\bwfh\b/i.test(text)) {
    return 'Remote';
  }

  if (/\bonsite\b|\bon-site\b|\bin office\b|\boffice based\b/i.test(text)) {
    return 'Onsite';
  }

  return null;
}

function extractJobType(text: string) {
  if (/\binternship\b|\bintern\b/i.test(text)) {
    return 'Internship';
  }

  if (/\bpart[- ]time\b/i.test(text)) {
    return 'Part Time';
  }

  if (/\bcontract\b/i.test(text)) {
    return 'Contract';
  }

  return 'Full Time';
}

function splitSkillTokens(value: string) {
  return value
    .split(/,|\/|\||;|\u2022|\n/)
    .map((item) => cleanLine(item))
    .filter(Boolean);
}

function mapSkillToken(value: string) {
  for (const skill of SKILL_PATTERNS) {
    if (skill.pattern.test(value)) {
      return skill.label;
    }
  }

  return '';
}

function detectSkills(text: string, lines: string[], skillSection: string[]) {
  const fromPatterns = SKILL_PATTERNS.filter((item) => item.pattern.test(text)).map((item) => item.label);

  const skillHintLines = lines.filter((line) => /\bskills?\b|\btechnologies\b|\bstack\b/i.test(line));
  const fromTokens = [...skillSection, ...skillHintLines]
    .flatMap((line) => splitSkillTokens(line))
    .map((token) => mapSkillToken(token))
    .filter(Boolean);

  return uniqueStrings([...fromPatterns, ...fromTokens]).slice(0, 20);
}

function extractTitle(lines: string[], text: string) {
  const labeled = extractFromPatterns(lines, TITLE_PATTERNS);
  if (labeled) {
    return labeled.replace(/\bat\s+[A-Z][A-Za-z0-9&.,'\- ]{1,60}$/i, '').trim();
  }

  const roleSentence = text.match(
    /\b(?:hiring|opening|opportunity)\s+(?:for|as)\s+([A-Za-z0-9()\/+\- ]{3,80})/i
  );
  if (roleSentence?.[1]) {
    return cleanLine(roleSentence[1]);
  }

  const firstMeaningful = lines.find((line) => {
    if (line.length < 4 || line.length > 100) {
      return false;
    }

    if (detectSectionHeading(line)) {
      return false;
    }

    return !/\b(job description|apply|responsibilities|requirements|qualifications)\b/i.test(line);
  });

  return firstMeaningful || 'Untitled Role';
}

function extractResponsibilities(text: string, lines: string[], sectionLines: string[]) {
  if (sectionLines.length > 0) {
    return uniqueStrings(sectionLines);
  }

  const sentenceMatch = text.match(
    /(?:responsibilities include|you will|responsible for)\s*[:\-]?\s*([^.]+(?:\.[^.]+){0,2})/i
  );
  if (sentenceMatch?.[1]) {
    return uniqueStrings(
      sentenceMatch[1]
        .split(/\.|;|,/)
        .map((item) => cleanLine(item))
        .filter(Boolean)
    );
  }

  const bulletFallback = lines
    .filter((line) => /\bbuild|develop|design|implement|maintain|collaborate|test|deploy\b/i.test(line))
    .slice(0, 6);

  return uniqueStrings(bulletFallback);
}

function extractEligibility(text: string, lines: string[], sectionLines: string[]) {
  if (sectionLines.length > 0) {
    return uniqueStrings(sectionLines);
  }

  const candidateLines = lines
    .filter((line) =>
      /\b(bachelor|b\.?e\.?|btech|degree|qualification|requirements?|cgpa|eligible)\b/i.test(line)
    )
    .slice(0, 8);

  if (candidateLines.length > 0) {
    return uniqueStrings(candidateLines);
  }

  const sentenceMatch = text.match(/(?:qualifications?|requirements?)\s*[:\-]?\s*([^.]+(?:\.[^.]+){0,2})/i);
  if (sentenceMatch?.[1]) {
    return uniqueStrings(
      sentenceMatch[1]
        .split(/\.|;|,/)
        .map((item) => cleanLine(item))
        .filter(Boolean)
    );
  }

  return [];
}

function extractAboutCompany(text: string, company: string, sectionLines: string[]) {
  if (sectionLines.length > 0) {
    return uniqueStrings(sectionLines).join(' ');
  }

  const companyPattern = new RegExp(`\\b${escapeRegex(company)}\\b[^.]{0,220}`, 'i');
  const companySentence = text.match(companyPattern);
  if (companySentence?.[0] && /\b(is|are|provides|builds|leading|global)\b/i.test(companySentence[0])) {
    return cleanLine(companySentence[0]);
  }

  return '';
}

function extractHowToApply(sectionLines: string[], applyLink: string) {
  if (sectionLines.length > 0) {
    return uniqueStrings(sectionLines);
  }

  return applyLink ? [`Apply using: ${applyLink}`] : [];
}

function extractDeadline(lines: string[], text: string) {
  const labeled = extractFromPatterns(lines, [/^(?:application deadline|last date|apply by)\s*[:\-]\s*(.+)$/i]);
  if (labeled) {
    return labeled;
  }

  const inline = text.match(/\b(?:application deadline|last date|apply by)\s*[:\-]?\s*([A-Za-z0-9, ]{4,30})/i);
  return inline?.[1]?.trim() || null;
}

function extractOpenings(lines: string[], text: string) {
  const labeled = extractFromPatterns(lines, [/^(?:openings?|vacancies)\s*[:\-]\s*(\d{1,3})$/i]);
  if (labeled) {
    const parsed = Number.parseInt(labeled, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  const inline = text.match(/\b(\d{1,3})\s+(?:openings?|vacancies)\b/i);
  if (inline?.[1]) {
    const parsed = Number.parseInt(inline[1], 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
}

function pickFirstValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (key in record) {
      return record[key];
    }
  }

  return undefined;
}

function toStringValue(value: unknown) {
  if (typeof value === 'string') {
    return cleanLine(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '';
}

function toListValue(value: unknown) {
  if (Array.isArray(value)) {
    return uniqueStrings(
      value
        .map((item) => toStringValue(item))
        .filter(Boolean)
    );
  }

  if (typeof value === 'string') {
    return uniqueStrings(splitSkillTokens(value));
  }

  return [];
}

function normalizeSalaryValue(value: string) {
  const normalized = value
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return '';
  }

  if (/\bLPA\b/i.test(normalized) || /\u20B9|Rs\.?/i.test(normalized)) {
    return normalizeSalary(normalized);
  }

  if (/^\d{1,2}(?:\.\d+)?\s*(?:-|to)\s*\d{1,2}(?:\.\d+)?$/i.test(normalized)) {
    return normalizeSalary(`${normalized} LPA`);
  }

  if (/^\d{1,2}(?:\.\d+)?$/i.test(normalized)) {
    return normalizeSalary(`${normalized} LPA`);
  }

  return normalizeSalary(normalized);
}

function extractJsonCandidate(rawText: string) {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return '';
  }

  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const unfenced = fencedMatch?.[1]?.trim() || trimmed;

  if (unfenced.startsWith('{') || unfenced.startsWith('[')) {
    return unfenced;
  }

  const firstObjectStart = unfenced.indexOf('{');
  const lastObjectEnd = unfenced.lastIndexOf('}');
  if (firstObjectStart >= 0 && lastObjectEnd > firstObjectStart) {
    return unfenced.slice(firstObjectStart, lastObjectEnd + 1).trim();
  }

  const firstArrayStart = unfenced.indexOf('[');
  const lastArrayEnd = unfenced.lastIndexOf(']');
  if (firstArrayStart >= 0 && lastArrayEnd > firstArrayStart) {
    return unfenced.slice(firstArrayStart, lastArrayEnd + 1).trim();
  }

  return '';
}

function parseJsonRecord(rawText: string) {
  const jsonCandidate = extractJsonCandidate(rawText);
  if (!jsonCandidate) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonCandidate) as unknown;

    if (Array.isArray(parsed) && parsed[0] && typeof parsed[0] === 'object') {
      return parsed[0] as Record<string, unknown>;
    }

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const parsedRecord = parsed as Record<string, unknown>;
    const nestedCandidate = pickFirstValue(parsedRecord, ['job', 'data', 'payload']);
    if (nestedCandidate && typeof nestedCandidate === 'object' && !Array.isArray(nestedCandidate)) {
      return nestedCandidate as Record<string, unknown>;
    }

    return parsedRecord;
  } catch {
    return null;
  }
}

function hasStructuredJobShape(record: Record<string, unknown>) {
  const keys = Object.keys(record).map((item) => item.toLowerCase());
  return (
    keys.includes('title') ||
    keys.includes('role') ||
    keys.includes('job_title') ||
    keys.includes('company') ||
    keys.includes('apply_link') ||
    keys.includes('description')
  );
}

export function isStructuredManualJsonInput(rawText: string) {
  const parsedRecord = parseJsonRecord(rawText.trim());
  return Boolean(parsedRecord && hasStructuredJobShape(parsedRecord));
}

function extractStructuredFromJson(rawText: string, rawJob: RawFetchedJob): ExtractedJobData | null {
  const parsedRecord = parseJsonRecord(rawText.trim());
  if (!parsedRecord || !hasStructuredJobShape(parsedRecord)) {
    return null;
  }

  const title = toStringValue(pickFirstValue(parsedRecord, ['title', 'role', 'job_title', 'position'])) || 'Untitled Role';
  const company = toStringValue(
    pickFirstValue(parsedRecord, ['company', 'company_name', 'organization', 'employer'])
  ) || 'Unknown Company';
  const location = toStringValue(pickFirstValue(parsedRecord, ['location', 'city'])) || 'India';
  const description =
    toStringValue(
      pickFirstValue(parsedRecord, ['description', 'job_description', 'details', 'overview'])
    ) || normalizeWhitespace(rawText);
  const applyLink =
    toStringValue(
      pickFirstValue(parsedRecord, ['apply_link', 'apply_url', 'application_url', 'url', 'apply'])
    ) ||
    extractFirstUrl(rawText) ||
    rawJob.applyLink ||
    rawJob.detailUrl ||
    DEFAULT_APPLY_LINK;
  const salaryRaw = toStringValue(
    pickFirstValue(parsedRecord, ['salary', 'salary_range_lpa', 'salary_range', 'ctc', 'compensation'])
  );
  const salary = normalizeSalaryValue(salaryRaw) || 'Not Disclosed';
  const jobType =
    toStringValue(pickFirstValue(parsedRecord, ['job_type', 'employment_type', 'type'])) || 'Full Time';
  const providedWorkMode = toStringValue(pickFirstValue(parsedRecord, ['work_mode', 'mode', 'work_type']));
  const workMode = providedWorkMode || extractWorkMode(`${description}\n${location}`) || null;
  const experienceRaw =
    toStringValue(pickFirstValue(parsedRecord, ['experience_level', 'experience', 'exp'])) || '';
  const experience = normalizeExperience(experienceRaw, `${title} ${description}`);
  const skills = uniqueStrings(
    toListValue(
      pickFirstValue(parsedRecord, ['required_skills', 'skills', 'technologies', 'stack'])
    )
  );
  const responsibilities = uniqueStrings(
    toListValue(
      pickFirstValue(parsedRecord, [
        'roles_responsibilities',
        'roles_and_responsibilities',
        'responsibilities',
        'role_responsibilities',
      ])
    )
  );
  const eligibility = uniqueStrings(
    toListValue(
      pickFirstValue(parsedRecord, ['eligibility_criteria', 'eligibility', 'requirements', 'qualifications'])
    )
  );
  const aboutCompany =
    toStringValue(pickFirstValue(parsedRecord, ['about_company', 'about', 'company_overview'])) || null;
  const howToApply = uniqueStrings(
    toListValue(pickFirstValue(parsedRecord, ['how_to_apply', 'application_process']))
  );
  const deadline = toStringValue(
    pickFirstValue(parsedRecord, ['application_deadline', 'deadline', 'last_date'])
  );
  const openingsValue = pickFirstValue(parsedRecord, ['number_of_openings', 'openings', 'vacancies']);
  const openingsParsed = Number.parseInt(toStringValue(openingsValue), 10);

  return {
    title,
    company,
    location,
    experience,
    skills,
    apply_link: applyLink,
    description,
    salary,
    job_type: jobType,
    category: 'Technology',
    work_mode: workMode,
    about_company: aboutCompany,
    roles_responsibilities: responsibilities,
    eligibility_criteria: eligibility,
    how_to_apply: howToApply.length > 0 ? howToApply : [`Apply using: ${applyLink}`],
    application_deadline: deadline || null,
    number_of_openings: Number.isFinite(openingsParsed) && openingsParsed > 0 ? openingsParsed : null,
  };
}

function buildStructuredText(rawText: string) {
  const withEntities = decodeEntities(rawText);
  const htmlProcessed = stripHtmlKeepLines(withEntities);
  const normalized = normalizeWhitespace(htmlProcessed);
  const lines = normalized
    .split('\n')
    .map((line) => cleanLine(line))
    .filter(Boolean);

  return {
    normalized,
    lines,
  };
}

export function extractStructuredManualJob(rawJob: RawFetchedJob) {
  const rawText = String(rawJob.description || rawJob.rawHtml || '').trim();
  const structuredFromJson = extractStructuredFromJson(rawText, rawJob);
  if (structuredFromJson) {
    return {
      extracted: structuredFromJson,
      model: 'manual_json_input_v1',
    };
  }

  const { normalized, lines } = buildStructuredText(rawText);
  const sections = parseSections(lines);

  const applyLink =
    extractFirstUrl(normalized) || rawJob.applyLink || rawJob.detailUrl || DEFAULT_APPLY_LINK;
  const title = extractTitle(lines, normalized);
  const company = extractCompany(lines, normalized, title);
  const location = extractLocation(lines, normalized);
  const experience = extractExperience(lines, normalized);
  const salary = extractSalary(lines, normalized);
  const workMode = extractWorkMode(normalized);
  const jobType = extractJobType(normalized);
  const skills = detectSkills(normalized, lines, sections.skills);
  const responsibilities = extractResponsibilities(normalized, lines, sections.responsibilities);
  const eligibility = extractEligibility(normalized, lines, sections.eligibility);
  const aboutCompany = extractAboutCompany(normalized, company, sections.about);
  const howToApply = extractHowToApply(sections.howToApply, applyLink);

  const extracted: ExtractedJobData = {
    title,
    company,
    location,
    experience,
    skills,
    apply_link: applyLink,
    description: normalized || null,
    salary,
    job_type: jobType,
    category: 'Technology',
    work_mode: workMode,
    about_company: aboutCompany || null,
    roles_responsibilities: responsibilities,
    eligibility_criteria: eligibility,
    how_to_apply: howToApply,
    application_deadline: extractDeadline(lines, normalized),
    number_of_openings: extractOpenings(lines, normalized),
  };

  return {
    extracted,
    model: 'rule_based_manual_parser_v1',
  };
}
