import { supabaseServer } from './supabase';

export interface Job {
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
  application_deadline: string | null;
  work_mode: string | null;
  number_of_openings: number | null;
  about_company: string | null;
}

export async function getJobs(limit = 20, offset = 0) {
  const { data, error, count } = await supabaseServer
    .from('jobs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { jobs: data as Job[], total: count || 0 };
}

// export async function getJobBySlug(slug: string): Promise<Job | null> {
//   const { data, error } = await supabaseServer
//     .from('jobs')
//     .select('*')
//     .eq('slug', slug)
//     .single();

//   if (error) return null;
//   return data as Job;
// }
export async function getJobBySlug(slug: string): Promise<Job | null> {
  const { data, error } = await supabaseServer
    .from('jobs')
    .select(`
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
    `)
    .eq('slug', slug)
    .single();

  if (error || !data) return null;

  return data as Job;
}
// export async function getJobBySlug(slug: string): Promise<Job | null> {
//   // First query: get main job data
//   const { data: jobData, error: jobError } = await supabaseServer
//     .from('jobs')
//     .select('*')
//     .eq('slug', slug)
//     .single();

//   if (jobError || !jobData) return null;

//   // Second query: get how_to_apply separately
//   const { data: applyData } = await supabaseServer
//     .from('jobs')
//     .select('how_to_apply')
//     .eq('slug', slug)
//     .single();

//   return {
//     ...jobData,
//     how_to_apply: applyData?.how_to_apply || null,
//   } as Job;
// }
// export async function getJobBySlug(slug: string): Promise<Job | null> {
//   const { data, error } = await supabaseServer
//     .from('jobs')
//     .select('slug, how_to_apply')
//     .eq('slug', slug)
//     .single();

//   console.log("SUPABASE RESULT:", data);

//   if (error) return null;
//   return data as Job;
// }

export async function getJobsByCategory(category: string, limit = 20, offset = 0) {
  // Trim the input category and add wildcards to match values with leading/trailing spaces
  const trimmedCategory = category.trim();
  const { data, error, count } = await supabaseServer
    .from('jobs')
    .select('*', { count: 'exact' })
    .ilike('category', `%${trimmedCategory}%`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { jobs: data as Job[], total: count || 0 };
}

export async function searchJobs(query: string, limit = 20, offset = 0) {
  const { data, error, count } = await supabaseServer
    .from('jobs')
    .select('*', { count: 'exact' })
    .or(`title.ilike.%${query}%,company.ilike.%${query}%,description.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { jobs: data as Job[], total: count || 0 };
}

export async function getCategories() {
  const { data, error } = await supabaseServer
    .from('jobs')
    .select('category');

  if (error) throw error;
  
  const categories = (data as { category: string }[])
    .map(j => j.category?.trim())
    .filter((cat): cat is string => !!cat);
  
  return [...new Set(categories)];
}

export async function createJob(jobData: Omit<Job, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabaseServer
    .from('jobs')
    .insert([jobData])
    .select()
    .single();

  if (error) throw error;
  return data as Job;
}

export async function updateJob(id: string, updates: Partial<Job>) {
  const { data, error } = await supabaseServer
    .from('jobs')
    .update(updates)
    .eq('id', id)
    .select()
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