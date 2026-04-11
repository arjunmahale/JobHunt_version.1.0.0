'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Job } from '@/lib/jobs';

export default function EditJobPage() {
  const params = useParams();
  const jobId = params.id as string;
  const [formData, setFormData] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);

        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }

        if (res.status === 404) {
          setError('Job not found');
          return;
        }

        if (!res.ok) {
          throw new Error('Failed to fetch job');
        }

        const data = await res.json();
        setFormData(data as Job);
      } catch (err) {
        console.error('Failed to fetch job:', err);
        setError('Failed to load job');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId, router]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) =>
      prev ? { ...prev, [name]: value } : null
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to update job');
      }

      router.push('/admin/jobs');
    } catch (err) {
      console.error('Failed to update job:', err);
      setError('Failed to update job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading job...</p>
      </div>
    );
  }

  if (error && !formData) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded">
        {error}
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded">
        Job not found
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold text-primary mb-8">Edit Job</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
          {error}
        </div>
      )}
<form
  onSubmit={handleSubmit}
  className="bg-white rounded-lg shadow-lg p-8 space-y-6"
>

{/* Title */}
<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">
Job Title
</label>
<input
type="text"
name="title"
value={formData.title}
onChange={handleChange}
className="w-full px-4 py-2 border border-gray-300 rounded-lg"
/>
</div>

{/* Company */}
<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">
Company Name
</label>
<input
type="text"
name="company"
value={formData.company}
onChange={handleChange}
className="w-full px-4 py-2 border border-gray-300 rounded-lg"
/>
</div>

{/* Location */}
<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">
Location
</label>
<input
type="text"
name="location"
value={formData.location}
onChange={handleChange}
className="w-full px-4 py-2 border border-gray-300 rounded-lg"
/>
</div>

{/* Salary */}
<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">
Salary Range
</label>
<input
type="text"
name="salary"
value={formData.salary}
onChange={handleChange}
className="w-full px-4 py-2 border border-gray-300 rounded-lg"
/>
</div>

{/* Category */}
<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">
Category
</label>
<select
name="category"
value={formData.category}
onChange={handleChange}
className="w-full px-4 py-2 border border-gray-300 rounded-lg"
>
<option>Technology</option>
<option>Marketing</option>
<option>Sales</option>
<option>Design</option>
<option>Business</option>
<option>HR</option>
<option>Finance</option>
<option>Operations</option>
</select>
</div>

{/* Job Type */}
<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">
Job Type
</label>
<select
name="job_type"
value={formData.job_type}
onChange={handleChange}
className="w-full px-4 py-2 border border-gray-300 rounded-lg"
>
<option>Full Time</option>
<option>Part Time</option>
<option>Contract</option>
<option>Internship</option>
<option>Freelance</option>
</select>
</div>

{/* Experience */}
<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">
Experience Level
</label>
<input
type="text"
name="experience_level"
value={formData.experience_level}
onChange={handleChange}
className="w-full px-4 py-2 border border-gray-300 rounded-lg"
/>
</div>

{/* Application Deadline */}
<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">
Application Deadline
</label>
<input
type="date"
name="application_deadline"
value={formData.application_deadline || ''}
onChange={handleChange}
className="w-full px-4 py-2 border border-gray-300 rounded-lg"
/>
</div>

{/* Work Mode */}
<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">
Work Mode
</label>
<select
name="work_mode"
value={formData.work_mode || ''}
onChange={handleChange}
className="w-full px-4 py-2 border border-gray-300 rounded-lg"
>
<option value="">Select</option>
<option>Remote</option>
<option>Hybrid</option>
<option>On-site</option>
</select>
</div>

{/* Number of Openings */}
<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">
Number of Openings
</label>
<input
type="number"
name="number_of_openings"
value={formData.number_of_openings || ''}
onChange={handleChange}
className="w-full px-4 py-2 border border-gray-300 rounded-lg"
/>
</div>

{/* About Company */}
<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">
About Company
</label>
<textarea
name="about_company"
value={formData.about_company || ''}
onChange={handleChange}
rows={5}
className="w-full px-4 py-2 border border-gray-300 rounded-lg"
/>
</div>

{/* Description */}
<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">
Job Description
</label>
<textarea
name="description"
value={formData.description}
onChange={handleChange}
rows={10}
className="w-full px-4 py-2 border border-gray-300 rounded-lg"
/>
</div>

{/* Roles */}
<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">
Roles & Responsibilities
</label>
<textarea
name="roles_responsibilities"
value={formData.roles_responsibilities}
onChange={handleChange}
rows={6}
className="w-full px-4 py-2 border border-gray-300 rounded-lg"
/>
</div>

{/* Eligibility */}
<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">
Eligibility Criteria
</label>
<textarea
name="eligibility_criteria"
value={formData.eligibility_criteria}
onChange={handleChange}
rows={6}
className="w-full px-4 py-2 border border-gray-300 rounded-lg"
/>
</div>

{/* Skills */}
<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">
Required Skills
</label>
<textarea
name="required_skills"
value={formData.required_skills}
onChange={handleChange}
rows={6}
className="w-full px-4 py-2 border border-gray-300 rounded-lg"
/>
</div>

{/* How to Apply */}
<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">
How to Apply
</label>
<textarea
name="how_to_apply"
value={formData.how_to_apply || ''}
onChange={handleChange}
rows={6}
className="w-full px-4 py-2 border border-gray-300 rounded-lg"
/>
</div>

{/* Apply Link */}
<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">
Application URL
</label>
<input
type="url"
name="apply_link"
value={formData.apply_link}
onChange={handleChange}
className="w-full px-4 py-2 border border-gray-300 rounded-lg"
/>
</div>

{/* Slug */}
<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">
Slug
</label>
<input
type="text"
name="slug"
value={formData.slug}
readOnly
onChange={handleChange}
className="w-full px-4 py-2 border border-gray-300 rounded-lg"
/>
</div>

{/* Submit */}
<div className="flex gap-4 pt-6">
<button
type="submit"
disabled={submitting}
className="flex-1 bg-blue-600 hover:bg-blue-900 text-white font-bold py-3 rounded-lg"
>
{submitting ? 'Updating Job...' : 'Update Job'}
</button>

<button
type="button"
onClick={() => router.back()}
className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 rounded-lg"
>
Cancel
</button>
</div>

</form>
    </div>
  );
}
