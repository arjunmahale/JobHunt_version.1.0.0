import OpenAI from 'openai';
import { AutomationRuntimeConfig, ExtractedJobData, RawFetchedJob } from './types';
import { cleanText, splitList } from './utils';

const EXTRACTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: ['string', 'null'] },
    company: { type: ['string', 'null'] },
    location: { type: ['string', 'null'] },
    experience: { type: ['string', 'null'] },
    skills: {
      type: 'array',
      items: { type: 'string' },
    },
    apply_link: { type: ['string', 'null'] },
    description: { type: ['string', 'null'] },
    salary: { type: ['string', 'null'] },
    job_type: { type: ['string', 'null'] },
    category: { type: ['string', 'null'] },
    work_mode: { type: ['string', 'null'] },
    about_company: { type: ['string', 'null'] },
    roles_responsibilities: {
      type: 'array',
      items: { type: 'string' },
    },
    eligibility_criteria: {
      type: 'array',
      items: { type: 'string' },
    },
    how_to_apply: {
      type: 'array',
      items: { type: 'string' },
    },
    application_deadline: { type: ['string', 'null'] },
    number_of_openings: { type: ['number', 'null'] },
  },
  required: [
    'title',
    'company',
    'location',
    'experience',
    'skills',
    'apply_link',
    'description',
    'salary',
    'job_type',
    'category',
    'work_mode',
    'about_company',
    'roles_responsibilities',
    'eligibility_criteria',
    'how_to_apply',
    'application_deadline',
    'number_of_openings',
  ],
} as const;

const SYSTEM_PROMPT = `You extract structured job-posting data for an IT jobs automation pipeline.
Return only normalized job information from the provided raw content.
If a field is missing, use null.
Keep skills concise and deduplicated.
Prefer the direct apply URL when present.
Assume the audience is Indian tech job seekers unless the text clearly indicates another market.`;

function extractStructuredFallback(rawJob: RawFetchedJob): ExtractedJobData {
  const description = cleanText(rawJob.description);

  return {
    title: cleanText(rawJob.title) || null,
    company: cleanText(rawJob.company) || null,
    location: cleanText(rawJob.location) || null,
    experience: description.match(/(\d+\+?\s*(?:years?|yrs?))/i)?.[1] || null,
    skills: splitList(description).slice(0, 8),
    apply_link: rawJob.applyLink || rawJob.detailUrl || rawJob.sourceUrl,
    description: description || null,
    salary: null,
    job_type: null,
    category: 'Technology',
    work_mode: description.match(/remote|hybrid|on-site|onsite/i)?.[0] || null,
    about_company: null,
    roles_responsibilities: [],
    eligibility_criteria: [],
    how_to_apply: [],
    application_deadline: null,
    number_of_openings: null,
  };
}

function parseResponseOutput(response: unknown) {
  if (response && typeof response === 'object' && 'output_text' in response) {
    return (response as { output_text?: string }).output_text || '';
  }

  return '';
}

export async function extractStructuredJob(
  rawJob: RawFetchedJob,
  runtimeConfig: AutomationRuntimeConfig
) {
  if (!runtimeConfig.openaiApiKey) {
    return {
      extracted: extractStructuredFallback(rawJob),
      model: null,
    };
  }

  const client = new OpenAI({ apiKey: runtimeConfig.openaiApiKey });

  try {
    const response = await client.responses.create({
      model: runtimeConfig.openaiModel,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: SYSTEM_PROMPT }],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: JSON.stringify(
                {
                  source: {
                    name: rawJob.sourceName,
                    type: rawJob.sourceType,
                    url: rawJob.sourceUrl,
                  },
                  job: rawJob,
                },
                null,
                2
              ),
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'job_extraction',
          schema: EXTRACTION_SCHEMA,
          strict: true,
        },
      },
    } as never);

    const outputText = parseResponseOutput(response);
    if (!outputText) {
      return {
        extracted: extractStructuredFallback(rawJob),
        model: runtimeConfig.openaiModel,
      };
    }

    const parsedOutput = JSON.parse(outputText) as ExtractedJobData;
    return {
      extracted: parsedOutput,
      model: runtimeConfig.openaiModel,
    };
  } catch (error) {
    console.error('OpenAI extraction failed, using fallback extraction:', error);
    return {
      extracted: extractStructuredFallback(rawJob),
      model: runtimeConfig.openaiModel,
    };
  }
}
