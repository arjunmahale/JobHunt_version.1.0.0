export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Login page doesn't need authentication check
  return <>{children}</>;
}
