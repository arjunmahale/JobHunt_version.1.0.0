export interface SEOData {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

export function generateMetaTags(seo: SEOData) {
  return {
    title: seo.title,
    description: seo.description,
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: seo.type || 'website',
      url: seo.url,
      images: seo.image ? [{ url: seo.image }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: seo.image ? [seo.image] : [],
    },
  };
}

export function generateStructuredData(job: any) {
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",

    title: job.title,

    description: job.description,

    identifier: {
      "@type": "PropertyValue",
      name: job.company,
      value: job.id
    },

    datePosted: job.created_at,

    employmentType: job.job_type,

    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      sameAs: process.env.NEXT_PUBLIC_APP_URL,
      logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`
    },

    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        addressCountry: "IN"
      }
    },

    baseSalary: {
      "@type": "MonetaryAmount",
      currency: "INR",
      value: {
        "@type": "QuantitativeValue",
        value: job.salary
      }
    },

    applicantLocationRequirements: {
      "@type": "Country",
      name: "India"
    },

    directApply: true
  };
}

// export function generateStructuredData(job: any) {
//   return {
//     '@context': 'https://schema.org',
//     '@type': 'JobPosting',
//     title: job.title,
//     description: job.description,
//     hiringOrganization: {
//       '@type': 'Organization',
//       name: job.company,
//     },
//     jobLocation: {
//       '@type': 'Place',
//       address: {
//         '@type': 'PostalAddress',
//         addressLocality: job.location,
//       },
//     },
//     baseSalary: {
//       '@type': 'PriceSpecification',
//       priceCurrency: 'USD',
//       price: job.salary,
//     },
//     datePosted: new Date(job.created_at).toISOString(),
//   };
// }