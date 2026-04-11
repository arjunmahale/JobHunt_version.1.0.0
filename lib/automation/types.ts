import { Database, Json } from '@/lib/supabase';

export type AutomationSettingsRow = Database['public']['Tables']['automation_settings']['Row'];
export type AutomationSettingsInsert = Database['public']['Tables']['automation_settings']['Insert'];
export type AutomationRunRow = Database['public']['Tables']['automation_runs']['Row'];
export type AutomationJobRow = Database['public']['Tables']['automation_jobs']['Row'];
export type AutomationJobInsert = Database['public']['Tables']['automation_jobs']['Insert'];
export type AutomationJobEventInsert = Database['public']['Tables']['automation_job_events']['Insert'];
export type AutomationDeliveryInsert = Database['public']['Tables']['automation_delivery_logs']['Insert'];

export type AutomationSourceType =
  | 'json'
  | 'html'
  | 'greenhouse'
  | 'lever'
  | 'linkedin'
  | 'indeed'
  | 'naukri';

export type AutomationReviewStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'failed';

export type AutomationPublishStatus =
  | 'draft'
  | 'queued'
  | 'published'
  | 'failed'
  | 'skipped';

export interface JobSourceConfig {
  id: string;
  name: string;
  type: AutomationSourceType;
  url: string;
  enabled?: boolean;
  category?: string;
  company?: string;
  location?: string;
  maxItems?: number;
  method?: 'GET' | 'POST';
  body?: string;
  headers?: Record<string, string>;
  itemPath?: string;
  mapping?: Record<string, string>;
  selectors?: Record<string, string>;
  detailSelectors?: Record<string, string>;
  fetchDetails?: boolean;
  metadata?: Record<string, string | number | boolean>;
}

export interface RawFetchedJob {
  sourceId: string;
  sourceName: string;
  sourceType: AutomationSourceType;
  sourceUrl: string;
  externalId?: string | null;
  title?: string | null;
  company?: string | null;
  location?: string | null;
  detailUrl?: string | null;
  applyLink?: string | null;
  description?: string | null;
  rawHtml?: string | null;
  rawPayload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ExtractedJobData {
  title: string | null;
  company: string | null;
  location: string | null;
  experience: string | null;
  skills: string[];
  apply_link: string | null;
  description: string | null;
  salary: string | null;
  job_type: string | null;
  category: string | null;
  work_mode: string | null;
  about_company: string | null;
  roles_responsibilities: string[];
  eligibility_criteria: string[];
  how_to_apply: string[];
  application_deadline: string | null;
  number_of_openings: number | null;
}

export interface NormalizedAutomationJob {
  source_name: string;
  source_type: string;
  source_url: string;
  external_id: string | null;
  raw_title: string | null;
  raw_company: string | null;
  raw_location: string | null;
  raw_payload: Json;
  description_raw: string | null;
  extracted_payload: Json;
  normalized_payload: Json;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  apply_link: string;
  category: string;
  slug: string;
  job_type: string;
  experience_level: string;
  roles_responsibilities: string;
  eligibility_criteria: string;
  required_skills: string;
  how_to_apply: string;
  application_deadline: string | null;
  work_mode: string;
  number_of_openings: number;
  about_company: string;
  whatsapp_message: string;
  telegram_message: string;
  ai_model: string | null;
  source_hash: string;
  metadata: Json;
}

export interface AutomationRuntimeConfig {
  appUrl: string;
  automationApiSecret: string | null;
  openaiApiKey: string | null;
  openaiModel: string;
  reviewRequired: boolean;
  autoPostEnabled: boolean;
  whatsappEnabled: boolean;
  telegramEnabled: boolean;
  scheduleCron: string;
  maxJobsPerRun: number;
  whatsappRecipients: string[];
  telegramChatIds: string[];
  twilioAccountSid: string | null;
  twilioAuthToken: string | null;
  twilioWhatsappFrom: string | null;
  telegramBotToken: string | null;
  sourceConfigs: JobSourceConfig[];
}

export interface PipelineRunOptions {
  trigger: string;
  dryRun?: boolean;
}

export interface PipelineRunResult {
  runId: string | null;
  dryRun: boolean;
  sourcesProcessed: number;
  fetched: number;
  processed: number;
  pending: number;
  published: number;
  failed: number;
  skipped: number;
  errors: string[];
}

export interface ManualJobUploadResult {
  success: boolean;
  processed: number;
  skipped: number;
  reasons?: Array<{
    input_index: number;
    reason: string;
  }>;
}

export interface DeliveryAttemptResult {
  channel: 'whatsapp' | 'telegram';
  recipient: string;
  provider: string;
  status: 'sent' | 'failed' | 'skipped';
  providerMessageId?: string | null;
  responsePayload?: unknown;
  errorMessage?: string | null;
}
