'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function AdminNav() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <nav className="bg-primary text-white shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/admin" className="text-2xl font-bold text-secondary">
          JobHunt Admin
        </Link>

        <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base">
          <Link href="/admin" className="hover:text-secondary transition">
            Dashboard
          </Link>
          <Link href="/admin/jobs" className="hover:text-secondary transition">
            Manage Jobs
          </Link>
          <Link href="/admin/published-jobs" className="hover:text-secondary transition">
            Published Jobs
          </Link>
          <Link href="/admin/jobs/new" className="hover:text-secondary transition">
            New Job
          </Link>
          <Link href="/admin/automation" className="hover:text-secondary transition">
            Automation
          </Link>
          <Link href="/admin/manual-jobs" className="hover:text-secondary transition">
            Manual Upload
          </Link>
          <Link href="/admin/messages" className="hover:text-secondary transition">
            Messages
          </Link>
          <button
            onClick={handleLogout}
            className="rounded bg-red-600 px-4 py-2 transition hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
