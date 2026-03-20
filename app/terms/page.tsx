export const metadata = {
  title: "Terms & Conditions | JobHunt",
  description:
    "Read the terms and conditions for using the JobHunt job search platform.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">

      <h1 className="text-4xl font-bold text-primary mb-8">
        Terms & Conditions
      </h1>

      <p className="text-gray-700 mb-6">
        Welcome to JobHunt. By accessing this website, you agree to comply with
        and be bound by the following terms and conditions. If you do not agree
        with any part of these terms, please do not use our website.
      </p>

      {/* Use of Website */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">
          Use of the Website
        </h2>

        <p className="text-gray-700">
          JobHunt provides job listings and career-related information for
          informational purposes only. We do not guarantee employment or job
          placement. Users should verify job details directly with the hiring
          companies.
        </p>
      </section>

      {/* Accuracy of Information */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">
          Accuracy of Information
        </h2>

        <p className="text-gray-700">
          While we strive to keep the job information accurate and up to date,
          JobHunt makes no warranties about the completeness, reliability, or
          accuracy of the job listings.
        </p>
      </section>

      {/* External Links */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">
          External Links
        </h2>

        <p className="text-gray-700">
          Our website may contain links to third-party websites such as company
          career pages. We do not control or take responsibility for the content
          or policies of these external sites.
        </p>
      </section>

      {/* Intellectual Property */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">
          Intellectual Property
        </h2>

        <p className="text-gray-700">
          All content on this website, including text, graphics, and design, is
          the property of JobHunt unless otherwise stated. Unauthorized use or
          reproduction is prohibited.
        </p>
      </section>

      {/* Limitation of Liability */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">
          Limitation of Liability
        </h2>

        <p className="text-gray-700">
          JobHunt will not be liable for any losses or damages resulting from
          the use of this website or reliance on the information provided.
        </p>
      </section>

      {/* Changes to Terms */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">
          Changes to These Terms
        </h2>

        <p className="text-gray-700">
          We may update these Terms & Conditions at any time. Continued use of
          the website after changes means you accept the updated terms.
        </p>
      </section>

    </div>
  );
}