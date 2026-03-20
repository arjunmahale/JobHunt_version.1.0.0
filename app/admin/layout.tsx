export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware handles authentication redirects
  // This layout is just a wrapper for all /admin routes
  return <>{children}</>;
}