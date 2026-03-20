import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-slate-600 text-white mt-16">

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          {/* Brand */}
          <div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3">JobHunt</h3>
            <p className="text-gray-200 text-sm leading-relaxed">
              Find your next job opportunity with JobHunt. Explore thousands of
              positions from top companies.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-3 text-base sm:text-lg">
              Quick Links
            </h4>

            <ul className="space-y-2 text-sm">

              <li>
                <Link
                  href="/"
                  className="text-gray-300 hover:text-white transition"
                >
                  Home
                </Link>
              </li>

              <li>
                <Link
                  href="/jobs"
                  className="text-gray-300 hover:text-white transition"
                >
                  Browse Jobs
                </Link>
              </li>

              <li>
                <Link
                  href="/about"
                  className="text-gray-300 hover:text-white transition"
                >
                  About
                </Link>
              </li>

              <li>
                <Link
                  href="/contact"
                  className="text-gray-300 hover:text-white transition"
                >
                  Contact
                </Link>
              </li>

            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold mb-3 text-base sm:text-lg">
              Categories
            </h4>

            <ul className="space-y-2 text-sm">

              <li>
                <Link
                  href="/category/technology"
                  className="text-gray-300 hover:text-white transition"
                >
                  Technology
                </Link>
              </li>

              <li>
                <Link
                  href="/category/marketing"
                  className="text-gray-300 hover:text-white transition"
                >
                  Marketing
                </Link>
              </li>

              <li>
                <Link
                  href="/category/finance"
                  className="text-gray-300 hover:text-white transition"
                >
                  Finance
                </Link>
              </li>

            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold mb-3 text-base sm:text-lg">
              Legal
            </h4>

            <ul className="space-y-2 text-sm">

              <li>
                <Link
                  href="/privacy-policy"
                  className="text-gray-300 hover:text-white transition"
                >
                  Privacy Policy
                </Link>
              </li>

              <li>
                <Link
                  href="/terms"
                  className="text-gray-300 hover:text-white transition"
                >
                  Terms & Conditions
                </Link>
              </li>

              <li>
                <Link
                  href="/contact"
                  className="text-gray-300 hover:text-white transition"
                >
                  Contact Us
                </Link>
              </li>

            </ul>
          </div>

        </div>

      

        {/* Copyright */}
        <div className="border-t border-slate-700 pt-6 text-center text-sm text-gray-200">
          © {new Date().getFullYear()} JobHunt. All rights reserved.
        </div>

      </div>

    </footer>
  );

    // {/* Ad Section */}
    //     <div className="border-t border-slate-700 pt-6 mb-6">
    //       <div className="bg-slate-800 rounded p-4 text-center text-gray-400 text-sm">
    //         {/* AdSense Slot */}
    //       </div>
    //     </div>

}