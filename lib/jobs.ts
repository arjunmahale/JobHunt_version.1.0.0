import { supabaseServer, Database } from './supabase';

export type Job = Database['public']['Tables']['jobs']['Row'];
export type JobInsert = Database['public']['Tables']['jobs']['Insert'];
export type JobUpdate = Database['public']['Tables']['jobs']['Update'];

const JOB_SELECT = `
  id,
  title,
  company,
  location,
  salary,
  description,
  apply_link,
  category,
  slug,
  job_type,
  experience_level,
  roles_responsibilities,
  eligibility_criteria,
  required_skills,
  how_to_apply,
  application_deadline,
  work_mode,
  number_of_openings,
  about_company,
  created_at,
  updated_at
`;

export async function getJobs(limit = 20, offset = 0) {
  const { data, error, count } = await supabaseServer
    .from('jobs')
    .select(JOB_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { jobs: (data || []) as Job[], total: count || 0 };
}

export async function getJobBySlug(slug: string): Promise<Job | null> {
  const { data, error } = await supabaseServer
    .from('jobs')
    .select(JOB_SELECT)
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data as Job;
}

export async function getJobById(id: string): Promise<Job | null> {
  const { data, error } = await supabaseServer
    .from('jobs')
    .select(JOB_SELECT)
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Job;
}

export async function getJobsByCategory(category: string, limit = 20, offset = 0) {
  const trimmedCategory = category.trim();
  const { data, error, count } = await supabaseServer
    .from('jobs')
    .select(JOB_SELECT, { count: 'exact' })
    .ilike('category', `%${trimmedCategory}%`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { jobs: (data || []) as Job[], total: count || 0 };
}

export async function searchJobs(query: string, limit = 20, offset = 0) {
  const safeQuery = query.trim();
  const { data, error, count } = await supabaseServer
    .from('jobs')
    .select(JOB_SELECT, { count: 'exact' })
    .or(`title.ilike.%${safeQuery}%,company.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { jobs: (data || []) as Job[], total: count || 0 };
}

export async function getCategories() {
  const { data, error } = await supabaseServer
    .from('jobs')
    .select('category');

  if (error) throw error;

  const categories = (data || [])
    .map((job) => job.category?.trim())
    .filter((category): category is string => Boolean(category));

  return [...new Set(categories)];
}

export async function getExistingSlugs() {
  const { data, error } = await supabaseServer
    .from('jobs')
    .select('slug');

  if (error) throw error;
  return (data || []).map((job) => job.slug).filter(Boolean);
}

export async function findJobByTitleAndCompany(title: string, company: string) {
  const normalizedTitle = title.trim();
  const normalizedCompany = company.trim();

  const { data, error } = await supabaseServer
    .from('jobs')
    .select(JOB_SELECT)
    .ilike('title', normalizedTitle)
    .ilike('company', normalizedCompany)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data || null) as Job | null;
}

export async function createJob(jobData: JobInsert) {
  const { data, error } = await supabaseServer
    .from('jobs')
    .insert([jobData])
    .select(JOB_SELECT)
    .single();

  if (error) throw error;
  return data as Job;
}

export async function updateJob(id: string, updates: JobUpdate) {
  const { data, error } = await supabaseServer
    .from('jobs')
    .update(updates)
    .eq('id', id)
    .select(JOB_SELECT)
    .single();

  if (error) throw error;
  return data as Job;
}

export async function deleteJob(id: string) {
  const { error } = await supabaseServer
    .from('jobs')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}
