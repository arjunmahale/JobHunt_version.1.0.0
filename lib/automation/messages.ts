import { NormalizedAutomationJob } from './types';

function buildSkillsPreview(skills: string) {
  return skills
    .split('\n')
    .map((skill) => skill.trim())
    .filter(Boolean)
    .slice(0, 5)
    .join(', ');
}

export function buildWhatsAppMessage(job: NormalizedAutomationJob) {
  return [
    `🚀 ${job.title}`,
    `🏢 ${job.company}`,
    `📍 ${job.location}`,
    `💼 ${job.experience_level || 'Experience details in link'}`,
    `🛠 Skills: ${buildSkillsPreview(job.required_skills) || 'See job description'}`,
    `🔗 Apply: ${job.apply_link}`,
    '',
    'Apply early and share with your network.',
  ].join('\n');
}

export function buildTelegramMessage(job: NormalizedAutomationJob) {
  return [
    `🚀 ${job.title}`,
    `🏢 Company: ${job.company}`,
    `📍 Location: ${job.location}`,
    `💼 Experience: ${job.experience_level || 'See job description'}`,
    `🛠 Skills: ${buildSkillsPreview(job.required_skills) || 'See job description'}`,
    `🔗 Apply here: ${job.apply_link}`,
    '',
    'Tap the link, apply now, and forward this to someone who needs it.',
  ].join('\n');
}
