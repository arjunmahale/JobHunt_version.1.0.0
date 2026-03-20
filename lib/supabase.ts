import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client-side Supabase instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase instance with service role
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey);

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
          created_at: string;
          updated_at: string;
         how_to_apply: string | null;
          
        };
        Insert: Omit<Database['public']['Tables']['jobs']['Row'], 'id' | 'created_at' | 'updated_at' > & { how_to_apply: string };
        Update: Partial<Database['public']['Tables']['jobs']['Row']>;
      };
    };
  };
};