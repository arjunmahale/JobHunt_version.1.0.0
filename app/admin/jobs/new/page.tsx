'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateUniqueSlug } from '@/lib/slugify';

export default function NewJobPage() {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    description: '',
    apply_link: '',
    category: 'Technology',
    job_type: 'Full Time',
    experience_level: '',
    roles_responsibilities: '',
    eligibility_criteria: '',
    required_skills: '',
    slug: '',
    // NEW FIELDS
  application_deadline: '',
  work_mode: '',
  number_of_openings: '',
  about_company: '',
  how_to_apply: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // const handleChange = (
  //   e: React.ChangeEvent<
  //     HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  //   >
  // ) => {
  //   const { name, value } = e.target;
  //   setFormData((prev) => ({
  //     ...prev,
  //     [name]: value,
  //     // Auto-generate slug from title
  //     ...(name === 'title' && { slug: generateUniqueSlug(value) }),
  //   }));
  // };

const handleChange = async (e:any) => {

  const { name, value } = e.target;

  if (name === 'title') {

    const res = await fetch('/api/jobs?limit=100');
    const data = await res.json();

    const existingSlugs = data.jobs.map((job:any) => job.slug);

    const slug = generateUniqueSlug(value, existingSlugs);

    setFormData(prev => ({
      ...prev,
      title: value,
      slug
    }));

    return;
  }

  setFormData(prev => ({
    ...prev,
    [name]: value
  }));

};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
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
        throw new Error('Failed to create job');
      }

      // Success - redirect to jobs list
      router.push('/admin/jobs');
    } catch (err) {
      console.error('Failed to create job:', err);
      setError('Failed to create job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold text-primary mb-8">Create New Job</h1>

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
            Job Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            placeholder="e.g., Senior Frontend Developer"
          />
        </div>

        {/* Company */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Company Name *
          </label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            placeholder="e.g., Tech Company Inc"
          />
        </div>
<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    About Company
  </label>
  <textarea
    name="about_company"
    value={formData.about_company}
    onChange={handleChange}
    rows={5}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
    placeholder="Describe the company..."
  ></textarea>
</div>
        {/* Location */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Location *
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            placeholder="e.g., New York, NY"
          />
        </div>

        {/* Salary */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Salary Range *
          </label>
          <input
            type="text"
            name="salary"
            value={formData.salary}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            placeholder="e.g., $80,000 - $120,000"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
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
            Job Type *
          </label>
          <select
            name="job_type"
            value={formData.job_type}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
          >
            <option>Full Time</option>
            <option>Part Time</option>
            <option>Contract</option>
            <option>Internship</option>
            <option>Freelance</option>
          </select>
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Experience Level *
          </label>
          <input
            type="text"
            name="experience_level"
            value={formData.experience_level}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            placeholder="e.g., 0-1 year, 1-3 years, 3+ years"
          />
        </div>

<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Application Deadline
  </label>
  <input
    type="date"
    name="application_deadline"
    value={formData.application_deadline}
    onChange={handleChange}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
  />
</div>
<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Work Mode
  </label>
  <select
    name="work_mode"
    value={formData.work_mode}
    onChange={handleChange}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
  >
    <option value="">Select</option>
    <option>Remote</option>
    <option>Hybrid</option>
    <option>On-site</option>
  </select>
</div>

<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Number of Openings
  </label>
  <input
    type="number"
    name="number_of_openings"
    value={formData.number_of_openings}
    onChange={handleChange}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
    placeholder="e.g., 5"
  />
</div>



        {/* Slug */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            URL Slug *
          </label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            placeholder="auto-generated-from-title"
          />
          <p className="text-xs text-gray-500 mt-1">
            URL: /jobs/{formData.slug}
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Job Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={10}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            placeholder="Enter detailed job description..."
          ></textarea>
        </div>

        {/* Apply Link */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Application URL *
          </label>
          <input
            type="url"
            name="apply_link"
            value={formData.apply_link}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            placeholder="https://example.com/apply"
          />
        </div>

        {/* Roles & Responsibilities */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Roles & Responsibilities *
          </label>
          <textarea
            name="roles_responsibilities"
            value={formData.roles_responsibilities}
            onChange={handleChange}
            required
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            placeholder="List key responsibilities and duties (each on a new line or use bullet points)"
          ></textarea>
        </div>

        {/* Eligibility Criteria */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Eligibility Criteria *
          </label>
          <textarea
            name="eligibility_criteria"
            value={formData.eligibility_criteria}
            onChange={handleChange}
            required
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            placeholder="List educational qualifications and requirements"
          ></textarea>
        </div>

        {/* Required Skills */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Required Skills *
          </label>
          <textarea
            name="required_skills"
            value={formData.required_skills}
            onChange={handleChange}
            required
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            placeholder="List technical and soft skills required (each on a new line or use bullet points)"
          ></textarea>
        </div>
 <div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    How to Apply
  </label>
  <textarea
    name="how_to_apply"
    value={formData.how_to_apply}
    onChange={handleChange}
    rows={6}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
    placeholder="Steps to apply (each step on a new line)"
  ></textarea>
</div>
        {/* Submit Button */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-secondary hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Creating Job...' : 'Create Job'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 rounded-lg transition"
          >
            Cancel
          </button>
        </div>

       
      </form>
    </div>
  );
}