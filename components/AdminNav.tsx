'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function AdminNav() {
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    router.push('/admin/login');
  };

  return (
    <nav className="bg-primary text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-secondary">
            JobHunt Admin
          </Link>
          <div className="flex gap-6 items-center">
            <Link href="/admin" className="hover:text-secondary transition">
              Dashboard
            </Link>
            <Link href="/admin/jobs" className="hover:text-secondary transition">
              Manage Jobs
            </Link>
            <Link href="/admin/jobs/new" className="hover:text-secondary transition">
              New Job
            </Link>
            {/* <Link
  href="/admin/messages"
  className="text-gray-600 hover:text-blue-600"
>
  Messages
</Link> */}
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}