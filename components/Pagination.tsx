import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  query?: Record<string, string>;
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  query = {},
}: PaginationProps) {
  const getUrl = (page: number) => {
    const params = new URLSearchParams(query);
    params.set('page', page.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <div className="flex justify-center items-center gap-2 my-8">
      {currentPage > 1 && (
        <Link
          href={getUrl(currentPage - 1)}
          className="px-4 py-2 bg-secondary text-white rounded hover:bg-blue-600 transition"
        >
          ← Previous
        </Link>
      )}

      <div className="flex gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Link
            key={page}
            href={getUrl(page)}
            className={`px-3 py-2 rounded font-semibold transition ${
              page === currentPage
                ? 'bg-secondary text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {page}
          </Link>
        ))}
      </div>

      {currentPage < totalPages && (
        <Link
          href={getUrl(currentPage + 1)}
          className="px-4 py-2 bg-secondary text-white rounded hover:bg-blue-600 transition"
        >
          Next →
        </Link>
      )}
    </div>
  );
}