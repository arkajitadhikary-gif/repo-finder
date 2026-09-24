import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl">🛸</p>
      <h1 className="mt-6 text-3xl font-bold">Page not found</h1>
      <p className="mt-3 max-w-md text-sm text-zinc-400">
        The repository you are looking for doesn&apos;t exist, is private,
        or was removed from GitHub.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:opacity-90"
      >
        Back to search
      </Link>
    </div>
  );
}
