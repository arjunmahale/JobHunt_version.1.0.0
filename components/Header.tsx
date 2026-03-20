import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-white shadow-lg">

      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent">
            JobHunt
          </h1>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4 sm:gap-6">

          <Link
            href="/"
            className="text-gray-600 hover:text-blue-600 text-sm sm:text-base font-medium transition"
          >
            Home
          </Link>

          <Link
            href="/jobs"
            className="text-gray-600 hover:text-blue-600 text-sm sm:text-base font-medium transition"
          >
            Jobs
          </Link>

          <Link
            href="/about"
            className="text-gray-600 hover:text-blue-600 text-sm sm:text-base font-medium transition"
          >
            About
          </Link>

          <Link
            href="/contact"
            className="text-gray-600 hover:text-blue-600 text-sm sm:text-base font-medium transition"
          >
            Contact
          </Link>

          {/* <Link
            href="/admin/login"
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-blue-700 transition"
          >
            Admin
          </Link> */}

        </nav>

      </div>

    </header>
  );
}