import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-cloud p-6 text-ink">
      <section className="card max-w-md p-8 text-center">
        <p className="text-sm font-black uppercase tracking-wide text-moss">404</p>
        <h1 className="mt-2 text-3xl font-black">Page not found</h1>
        <p className="mt-3 text-sm font-semibold text-slate-500">
          This demo route does not exist. Head back to ResellSync and keep the listing engine humming.
        </p>
        <Link className="btn-primary mt-6" href="/">
          Back to app
        </Link>
      </section>
    </main>
  );
}
