import { createHash } from 'crypto';
import { Json } from '@/lib/supabase';

export const DEFAULT_REQUEST_HEADERS: Record<string, string> = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  accept: 'text/html,application/json,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

export function cleanText(value: string | null | undefined) {
  return (value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripHtml(value: string | null | undefined) {
  return cleanText(value);
}

export function buildAbsoluteUrl(baseUrl: string, value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}

export function getValueByPath(record: unknown, path: string | undefined) {
  if (!record || !path) {
    return undefined;
  }

  return path.split('.').reduce<unknown>((currentValue, key) => {
    if (currentValue && typeof currentValue === 'object' && key in currentValue) {
      return (currentValue as Record<string, unknown>)[key];
    }
    return undefined;
  }, record);
}

export function hashText(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function uniqueBy<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function normalizeUrl(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  try {
    return new URL(value).toString();
  } catch {
    return fallback;
  }
}

export function toIsoDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString().slice(0, 10);
}

export function splitList(input: string[] | string | null | undefined) {
  if (Array.isArray(input)) {
    return input.map((item) => cleanText(item)).filter(Boolean);
  }

  return String(input || '')
    .split(/\n|,|;|\u2022|\-/)
    .map((item) => cleanText(item))
    .filter(Boolean);
}

export function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? {})) as Json;
}
