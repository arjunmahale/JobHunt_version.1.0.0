export const metadata = {
  title: "Privacy Policy | JobHunt",
  description:
    "Learn how JobHunt collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">

      <h1 className="text-4xl font-bold text-primary mb-8">
        Privacy Policy
      </h1>

      <p className="text-gray-700 mb-6">
        At JobHunt, accessible from our website, protecting the privacy of our
        visitors is one of our main priorities. This Privacy Policy document
        outlines the types of information that are collected and recorded by
        JobHunt and how we use it.
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">Information We Collect</h2>

        <p className="text-gray-700">
          We may collect personal information such as your name, email address,
          and other details when you contact us or interact with our website.
          We also collect non-personal information such as browser type,
          referring pages, and time spent on the site.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">How We Use Your Information</h2>

        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>To operate and maintain our website</li>
          <li>To improve the user experience</li>
          <li>To analyze website traffic and usage</li>
          <li>To communicate with users</li>
          <li>To prevent fraud and maintain security</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">Cookies</h2>

        <p className="text-gray-700">
          JobHunt uses cookies to store information about visitors’
          preferences and to optimize the user experience by customizing
          web page content based on visitors' browser type or other
          information.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">Google AdSense</h2>

        <p className="text-gray-700">
          We may use Google AdSense to display advertisements. Google uses
          cookies, including the DART cookie, to serve ads based on users’
          visits to our site and other websites on the internet.
        </p>

        <p className="text-gray-700 mt-3">
          Users may opt out of the use of the DART cookie by visiting the
          Google Ad and Content Network Privacy Policy.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">Third Party Privacy Policies</h2>

        <p className="text-gray-700">
          JobHunt’s Privacy Policy does not apply to other advertisers or
          websites. We advise you to consult the respective Privacy Policies
          of third-party ad servers for more detailed information.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Consent</h2>

        <p className="text-gray-700">
          By using our website, you hereby consent to our Privacy Policy and
          agree to its terms.
        </p>
      </section>

    </div>
  );
}