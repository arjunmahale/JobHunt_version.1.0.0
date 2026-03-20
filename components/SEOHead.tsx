import { Metadata } from 'next';
import { generateMetaTags, type SEOData } from '@/lib/seo';

export function generateSEOMetadata(seo: SEOData): Metadata {
  const tags = generateMetaTags(seo);
  return {
    title: tags.title,
    description: tags.description,
    openGraph: tags.openGraph as any,
    twitter: tags.twitter as any,
  };
}

interface SEOHeadProps {
  structuredData?: any;
}

export function SEOHead({ structuredData }: SEOHeadProps) {
  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
    </>
  );
}