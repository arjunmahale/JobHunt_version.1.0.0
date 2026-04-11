import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: string;
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
          how_to_apply: string | null;
          application_deadline: string | null;
          work_mode: string | null;
          number_of_openings: number | null;
          about_company: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          company: string;
          location: string;
          salary: string;
          description: string;
          apply_link: string;
          category: string;
          slug: string;
          job_type?: string;
          experience_level?: string;
          roles_responsibilities?: string;
          eligibility_criteria?: string;
          required_skills?: string;
          how_to_apply?: string | null;
          application_deadline?: string | null;
          work_mode?: string | null;
          number_of_openings?: number | null;
          about_company?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>;
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          subject: string | null;
          message: string;
          status: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          subject?: string | null;
          message: string;
          status?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['contact_messages']['Insert']>;
        Relationships: [];
      };
      automation_settings: {
        Row: {
          id: string;
          review_required: boolean;
          auto_post_enabled: boolean;
          whatsapp_enabled: boolean;
          telegram_enabled: boolean;
          schedule_cron: string;
          max_jobs_per_run: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          review_required?: boolean;
          auto_post_enabled?: boolean;
          whatsapp_enabled?: boolean;
          telegram_enabled?: boolean;
          schedule_cron?: string;
          max_jobs_per_run?: number;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['automation_settings']['Insert']>;
        Relationships: [];
      };
      automation_runs: {
        Row: {
          id: string;
          trigger: string;
          status: string;
          sources_total: number;
          fetched_total: number;
          processed_total: number;
          pending_total: number;
          published_total: number;
          failed_total: number;
          notes: string | null;
          started_at: string;
          finished_at: string | null;
        };
        Insert: {
          id?: string;
          trigger: string;
          status?: string;
          sources_total?: number;
          fetched_total?: number;
          processed_total?: number;
          pending_total?: number;
          published_total?: number;
          failed_total?: number;
          notes?: string | null;
          started_at?: string;
          finished_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['automation_runs']['Insert']>;
        Relationships: [];
      };
      automation_jobs: {
        Row: {
          id: string;
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
          location: string | null;
          salary: string | null;
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
          work_mode: string | null;
          number_of_openings: number | null;
          about_company: string | null;
          whatsapp_message: string | null;
          telegram_message: string | null;
          review_status: string;
          publish_status: string;
          failure_reason: string | null;
          duplicate_of_job_id: string | null;
          published_job_id: string | null;
          ai_model: string | null;
          source_hash: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
          reviewed_at: string | null;
          published_at: string | null;
          last_attempt_at: string | null;
          scheduled_publish_at: string | null;
        };
        Insert: {
          id?: string;
          source_name: string;
          source_type: string;
          source_url: string;
          external_id?: string | null;
          raw_title?: string | null;
          raw_company?: string | null;
          raw_location?: string | null;
          raw_payload?: Json;
          description_raw?: string | null;
          extracted_payload?: Json;
          normalized_payload?: Json;
          title: string;
          company: string;
          location?: string | null;
          salary?: string | null;
          description: string;
          apply_link: string;
          category?: string;
          slug: string;
          job_type?: string;
          experience_level?: string;
          roles_responsibilities?: string;
          eligibility_criteria?: string;
          required_skills?: string;
          how_to_apply?: string;
          application_deadline?: string | null;
          work_mode?: string | null;
          number_of_openings?: number | null;
          about_company?: string | null;
          whatsapp_message?: string | null;
          telegram_message?: string | null;
          review_status?: string;
          publish_status?: string;
          failure_reason?: string | null;
          duplicate_of_job_id?: string | null;
          published_job_id?: string | null;
          ai_model?: string | null;
          source_hash: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          reviewed_at?: string | null;
          published_at?: string | null;
          last_attempt_at?: string | null;
          scheduled_publish_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['automation_jobs']['Insert']>;
        Relationships: [];
      };
      automation_job_events: {
        Row: {
          id: string;
          automation_job_id: string | null;
          run_id: string | null;
          level: string;
          step: string;
          message: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          automation_job_id?: string | null;
          run_id?: string | null;
          level?: string;
          step: string;
          message: string;
          payload?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['automation_job_events']['Insert']>;
        Relationships: [];
      };
      automation_delivery_logs: {
        Row: {
          id: string;
          automation_job_id: string;
          channel: string;
          recipient: string;
          provider: string;
          status: string;
          provider_message_id: string | null;
          response_payload: Json;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          automation_job_id: string;
          channel: string;
          recipient: string;
          provider: string;
          status: string;
          provider_message_id?: string | null;
          response_payload?: Json;
          error_message?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['automation_delivery_logs']['Insert']>;
        Relationships: [];
      };
    };
  };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey);
