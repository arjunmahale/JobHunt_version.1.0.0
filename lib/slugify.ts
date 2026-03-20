export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateUniqueSlug(text: string, existingSlugs: string[] = []): string {
  let slug = slugify(text);
  let counter = 1;
  
  while (existingSlugs.includes(slug)) {
    slug = `${slugify(text)}-${counter}`;
    counter++;
  }
  
  return slug;
}