import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 -z-10">
        <div className="bg-primary/5 absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />
        <div className="bg-grid-black/[0.02] dark:bg-grid-white/[0.02] absolute inset-0" />
      </div>

      <div className="mx-auto max-w-lg text-center">
        <div className="border-border bg-muted/50 mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border">
          <SearchX className="text-primary h-11 w-11" />
        </div>
        <p className="text-primary mb-2 text-sm font-medium tracking-[0.3em] uppercase">
          Error 404
        </p>
        <h1 className="text-foreground text-5xl font-bold tracking-tight sm:text-6xl">
          Page not found
        </h1>
        <p className="text-muted-foreground mt-5 text-lg leading-relaxed">
          Sorry, we couldn't find the page you're looking for. It may have been
          moved, deleted, or the URL might be incorrect.
        </p>
      </div>
    </main>
  );
}
