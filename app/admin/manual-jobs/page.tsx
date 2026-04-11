'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ManualJobUploadResult } from '@/lib/automation/types';

type JobInput = {
  id: number;
  value: string;
};

const MIN_JOB_LENGTH = 50;

function createJobInput(id: number): JobInput {
  return {
    id,
    value: '',
  };
}

function extractJsonCandidate(rawValue: string) {
  const trimmedValue = rawValue.trim();
  if (!trimmedValue) {
    return '';
  }

  const fencedMatch = trimmedValue.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const unfenced = fencedMatch?.[1]?.trim() || trimmedValue;

  if (unfenced.startsWith('{') || unfenced.startsWith('[')) {
    return unfenced;
  }

  const objectStart = unfenced.indexOf('{');
  const objectEnd = unfenced.lastIndexOf('}');
  if (objectStart >= 0 && objectEnd > objectStart) {
    return unfenced.slice(objectStart, objectEnd + 1).trim();
  }

  const arrayStart = unfenced.indexOf('[');
  const arrayEnd = unfenced.lastIndexOf(']');
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return unfenced.slice(arrayStart, arrayEnd + 1).trim();
  }

  return '';
}

function isStructuredJsonInput(value: string) {
  const jsonCandidate = extractJsonCandidate(value);
  if (!jsonCandidate) {
    return false;
  }

  try {
    const parsed = JSON.parse(jsonCandidate) as unknown;
    const directCandidate =
      Array.isArray(parsed) && parsed[0] && typeof parsed[0] === 'object'
        ? (parsed[0] as Record<string, unknown>)
        : parsed && typeof parsed === 'object'
          ? (parsed as Record<string, unknown>)
          : null;

    const nestedCandidate =
      directCandidate &&
      typeof directCandidate.job === 'object' &&
      directCandidate.job !== null &&
      !Array.isArray(directCandidate.job)
        ? (directCandidate.job as Record<string, unknown>)
        : directCandidate &&
            typeof directCandidate.data === 'object' &&
            directCandidate.data !== null &&
            !Array.isArray(directCandidate.data)
          ? (directCandidate.data as Record<string, unknown>)
          : directCandidate &&
              typeof directCandidate.payload === 'object' &&
              directCandidate.payload !== null &&
              !Array.isArray(directCandidate.payload)
            ? (directCandidate.payload as Record<string, unknown>)
            : directCandidate;

    if (!nestedCandidate) {
      return false;
    }

    const keys = Object.keys(nestedCandidate).map((item) => item.toLowerCase());
    return (
      keys.includes('title') ||
      keys.includes('role') ||
      keys.includes('job_title') ||
      keys.includes('company') ||
      keys.includes('description') ||
      keys.includes('apply_link')
    );
  } catch {
    return false;
  }
}

function getValidationMessage(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return '';
  }

  if (isStructuredJsonInput(trimmedValue)) {
    return '';
  }

  if (trimmedValue.length < MIN_JOB_LENGTH) {
    return `Minimum ${MIN_JOB_LENGTH} characters required for text input, or paste structured JSON.`;
  }

  return '';
}

export default function ManualJobsPage() {
  const router = useRouter();
  const [jobInputs, setJobInputs] = useState<JobInput[]>([createJobInput(1)]);
  const [nextId, setNextId] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [skipReasons, setSkipReasons] = useState<Array<{ input_index: number; reason: string }>>(
    []
  );

  const nonEmptyCount = jobInputs.filter((jobInput) => jobInput.value.trim()).length;
  const invalidCount = jobInputs.filter(
    (jobInput) => Boolean(getValidationMessage(jobInput.value))
  ).length;

  const addJobInput = () => {
    setJobInputs((currentInputs) => [...currentInputs, createJobInput(nextId)]);
    setNextId((currentId) => currentId + 1);
  };

  const removeJobInput = (id: number) => {
    setJobInputs((currentInputs) => currentInputs.filter((jobInput) => jobInput.id !== id));
  };

  const updateJobInput = (id: number, value: string) => {
    setJobInputs((currentInputs) =>
      currentInputs.map((jobInput) => (jobInput.id === id ? { ...jobInput, value } : jobInput))
    );
  };

  const resetForm = () => {
    setJobInputs([createJobInput(nextId)]);
    setNextId((currentId) => currentId + 1);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSkipReasons([]);

    const jobs = jobInputs
      .map((jobInput) => jobInput.value.trim())
      .filter(Boolean);

    if (jobs.length === 0) {
      setError('Add at least one job description before processing.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/manual-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobs }),
      });

      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = (await response.json()) as ManualJobUploadResult & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process manual jobs.');
      }

      setSkipReasons(data.reasons || []);
      setMessage(
        data.skipped > 0
          ? `${data.processed} jobs processed successfully. ${data.skipped} skipped.`
          : `${data.processed} jobs processed successfully`
      );
      resetForm();
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Failed to process manual jobs.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-8 shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary">Manual Job Upload</h1>
            <p className="mt-3 max-w-3xl text-gray-600">
              Paste raw job descriptions or structured JSON job objects here and send them through
              the same automation pipeline used by source ingestion. Empty inputs are ignored and
              accepted jobs appear in the automation review queue.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/automation"
              className="rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-slate-50"
            >
              View Automation Queue
            </Link>
            <button
              type="button"
              onClick={addJobInput}
              className="rounded-full bg-secondary px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + Add Job Description
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-gray-500">Input Boxes</p>
            <p className="mt-2 text-3xl font-bold text-primary">{jobInputs.length}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-gray-500">Ready to Submit</p>
            <p className="mt-2 text-3xl font-bold text-primary">{nonEmptyCount}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-gray-500">Need Attention</p>
            <p className="mt-2 text-3xl font-bold text-red-600">{invalidCount}</p>
          </div>
        </div>

        {error && <div className="rounded-2xl bg-red-100 px-4 py-3 text-red-700">{error}</div>}
        {message && (
          <div className="rounded-2xl bg-green-100 px-4 py-3 text-green-700">{message}</div>
        )}
        {skipReasons.length > 0 && (
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-amber-800">
            <p className="text-sm font-semibold">Skip reasons</p>
            <ul className="mt-2 list-disc pl-5 text-sm">
              {skipReasons.map((reasonItem, index) => (
                <li key={`${reasonItem.input_index}-${index}`}>
                  Input {reasonItem.input_index}: {reasonItem.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {jobInputs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-primary">No job descriptions added yet.</p>
            <p className="mt-2 text-gray-600">
              Use the add button to create your first manual upload entry.
            </p>
          </div>
        ) : null}

        {jobInputs.map((jobInput, index) => {
          const validationMessage = getValidationMessage(jobInput.value);

          return (
            <section key={jobInput.id} className="rounded-3xl bg-white p-6 shadow-lg">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <label
                    htmlFor={`job-description-${jobInput.id}`}
                    className="text-xl font-bold text-primary"
                  >
                    Job Description {index + 1}
                  </label>
                  <p className="mt-1 text-sm text-gray-500">
                    Paste raw job text or a structured JSON job object.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeJobInput(jobInput.id)}
                  className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Remove
                </button>
              </div>

              <textarea
                id={`job-description-${jobInput.id}`}
                value={jobInput.value}
                onChange={(event) => updateJobInput(jobInput.id, event.target.value)}
                className={`min-h-[150px] w-full rounded-2xl border px-4 py-3 text-sm text-gray-800 outline-none transition focus:ring-2 ${
                  validationMessage
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-gray-200 focus:border-secondary focus:ring-blue-100'
                }`}
                placeholder="Paste raw job description here..."
              />

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-500">
                  {jobInput.value.trim().length > 0
                    ? isStructuredJsonInput(jobInput.value.trim())
                      ? 'Structured JSON detected'
                      : `${jobInput.value.trim().length} characters`
                    : `Minimum ${MIN_JOB_LENGTH} characters for text, or paste structured JSON`}
                </p>
                {validationMessage && (
                  <p className="text-sm font-medium text-red-600">{validationMessage}</p>
                )}
              </div>
            </section>
          );
        })}

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-primary">Submit</h2>
              <p className="mt-2 text-sm text-gray-600">
                Jobs are extracted, normalized, filtered, messaged, and saved through the existing
                automation workflow.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={addJobInput}
                className="rounded-full border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                + Add Job Description
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-primary px-6 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  'Process Jobs'
                )}
              </button>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
