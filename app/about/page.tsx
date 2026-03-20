
import Link from "next/link";

export default function AboutPage() {

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "JobHunt",
    url: "https://yourdomain.com",
    logo: "https://yourdomain.com/logo.png",
    description:
      "JobHunt is a modern job discovery platform helping job seekers explore job opportunities from top companies.",
    sameAs: [
      "https://twitter.com/yourprofile",
      "https://linkedin.com/company/yourprofile",
      "https://facebook.com/yourprofile"
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@yourdomain.com"
    }
  };

  return (
    <>
      {/* SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">
            About JobHunt
          </h1>

          <p className="text-gray-900 text-lg max-w-2xl mx-auto">
            JobHunt is a modern job discovery platform designed to help
            job seekers find the best opportunities from top companies.
          </p>
        </div>

        {/* Mission */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-primary mb-4">
            Our Mission
          </h2>

          <p className="text-gray-900 leading-relaxed">
            Our mission is to simplify the job search process by providing
            a centralized platform where job seekers can explore thousands
            of opportunities across multiple industries.
          </p>
        </section>

        {/* CTA */}
        <section className="text-center bg-white shadow-md rounded-lg p-10"
       style={{
  backgroundImage: 'url("/education-banner-vector.jpg")',
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
}}
        >
          <h2 className="text-2xl font-bold text-white mb-4 pb-4">
            Start Your Job Search Today
          </h2>

          <Link
            href="/jobs"
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
          >
            Browse Jobs

          </Link>

        </section>

      </div>
    </>
  );
}