"use client";

import { useState } from "react";
import { MainLayout } from "@/components/main-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { documentations, products } from "@/lib/mock-data";
import { getRelatedDocumentations } from "@/lib/search";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ThumbsUp,
  Share2,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Clock,
  Info,
  AlertTriangle,
  Lightbulb,
  Check,
  Copy,
  ChevronRight,
} from "lucide-react";
import { useParams } from "next/navigation";

// ---------------------------------------------------------------------------
// Small presentational helpers, local to this page
// ---------------------------------------------------------------------------

const DIFFICULTY_STYLES: Record<string, string> = {
  Beginner: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Intermediate: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Advanced: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

function CalloutBox({
  type,
  content,
}: {
  type: "info" | "warning" | "tip";
  content: string;
}) {
  const config = {
    info: {
      icon: Info,
      classes: "border-sky-500/30 bg-sky-500/[0.06] text-sky-900 dark:text-sky-200",
      iconClasses: "text-sky-600",
      label: "Note",
    },
    warning: {
      icon: AlertTriangle,
      classes:
        "border-amber-500/30 bg-amber-500/[0.06] text-amber-900 dark:text-amber-200",
      iconClasses: "text-amber-600",
      label: "Warning",
    },
    tip: {
      icon: Lightbulb,
      classes:
        "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-900 dark:text-emerald-200",
      iconClasses: "text-emerald-600",
      label: "Tip",
    },
  }[type];

  const Icon = config.icon;

  return (
    <div className={`flex gap-3 rounded-lg border px-4 py-3 text-sm leading-relaxed ${config.classes}`}>
      <Icon className={`size-4 shrink-0 mt-0.5 ${config.iconClasses}`} />
      <div>
        <span className="font-semibold">{config.label}: </span>
        {content}
      </div>
    </div>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

  return (
    <Card className="my-6 overflow-hidden border-border bg-[#0d1117] py-0 gap-0">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="font-mono text-xs font-medium text-white/50">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-white/50 transition-colors hover:bg-white/10 hover:text-white/90"
        >
          {copied ? (
            <>
              <Check className="size-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <CardContent className="overflow-x-auto p-4">
        <pre className="font-mono text-sm leading-relaxed text-white/90">
          <code>{code}</code>
        </pre>
      </CardContent>
    </Card>
  );
}

export default function DocPage() {
  const params = useParams();
  const docId = params.id as string;

  const doc = documentations.find((d) => d.id === docId);
  const relatedDocs = getRelatedDocumentations(docId, 4);

  if (!doc) {
    return (
      <MainLayout showRightSidebar={false}>
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <Card className="p-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Documentation Not Found</CardTitle>
              <CardDescription>
                The documentation article you&apos;re looking for doesn&apos;t exist or has been moved.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Link href="/">
                <Button className="gap-2">
                  <ArrowLeft className="size-4" />
                  Return Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const product = products.find((p) => p.id === doc.productId);

  // Siblings within the same product, ordered, for prev/next navigation
  const siblings = documentations
    .filter((d) => d.productId === doc.productId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const currentIndex = siblings.findIndex((d) => d.id === doc.id);
  const prevDoc = currentIndex > 0 ? siblings[currentIndex - 1] : null;
  const nextDoc =
    currentIndex >= 0 && currentIndex < siblings.length - 1
      ? siblings[currentIndex + 1]
      : null;

  const tocItems = doc.sections.map((section) => ({
    id: section.id,
    title: section.title,
    level: "h2" as const,
  }));

  return (
    <MainLayout rightSidebarItems={tocItems}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col"
      >
        {/* Breadcrumb */}
        <div className="border-border bg-card/40 border-b px-4 py-3 md:px-8">
          <div className="mx-auto flex max-w-4xl items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">
              Docs
            </Link>
            {product && (
              <>
                <ChevronRight className="size-3.5" />
                <Link
                  href={`/product/${product.id}`}
                  className="transition-colors hover:text-foreground"
                >
                  {product.name}
                </Link>
              </>
            )}
            <ChevronRight className="size-3.5" />
            <span className="text-foreground font-medium">{doc.title}</span>
          </div>
        </div>

        {/* Document Header Banner */}
        <div className="border-border bg-card/60 border-b p-6 md:p-10">
          <div className="mx-auto max-w-4xl space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="default">{doc.source}</Badge>
                <Badge variant="outline">{doc.audience}</Badge>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="size-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </div>

            <h1 className="text-foreground text-3xl font-bold tracking-tight md:text-4xl">
              {doc.title}
            </h1>

            <p className="text-muted-foreground text-base md:text-lg">
              {doc.description}
            </p>

            <div className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                Updated {doc.lastUpdated.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {doc.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8 md:py-12 space-y-12">
          {/* Sections */}
          <article className="space-y-12">
            {doc.sections.map((section, sIdx) => (
              <section key={section.id} id={section.id} className="scroll-mt-20 space-y-4">
                <div className="flex items-baseline gap-3 border-b border-border pb-2.5">
                  <span className="font-mono text-sm text-muted-foreground/60">
                    {String(sIdx + 1).padStart(2, "0")}
                  </span>
                  <h2 className="text-foreground text-2xl font-bold tracking-tight">
                    {section.title}
                  </h2>
                </div>

                <p className="text-foreground/90 text-base leading-relaxed">
                  {section.content}
                </p>

                {/* Callouts */}
                {section.callouts?.map((callout, i) => (
                  <CalloutBox key={i} type={callout.type} content={callout.content} />
                ))}

                {/* Subsections */}
                {section.subsections?.map((subsection) => (
                  <div
                    key={subsection.id}
                    id={subsection.id}
                    className="scroll-mt-20 space-y-2 border-l-2 border-primary/30 py-1 pl-4"
                  >
                    <h3 className="text-foreground text-lg font-semibold">
                      {subsection.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {subsection.content}
                    </p>
                  </div>
                ))}

                {/* Code Examples */}
                {section.codeExamples?.map((example, i) => (
                  <CodeBlock key={i} language={example.language} code={example.code} />
                ))}
              </section>
            ))}

            {/* Additional Content */}
            {doc.content && (
              <div className="border-border border-t pt-6">
                <p className="text-foreground/90 leading-relaxed">{doc.content}</p>
              </div>
            )}
          </article>

          {/* Page Feedback */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">
                Was this documentation page helpful?
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button variant="outline" size="sm" className="gap-2">
                <ThumbsUp className="size-4" />
                Yes
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <ThumbsUp className="size-4 rotate-180" />
                No
              </Button>
            </CardContent>
          </Card>

          {/* Prev / Next Navigation */}
          {(prevDoc || nextDoc) && (
            <div className="grid gap-4 border-t border-border pt-8 sm:grid-cols-2">
              {prevDoc ? (
                <Link href={`/doc/${prevDoc.id}`} className="group">
                  <Card className="h-full border-border transition-all hover:border-primary/50 hover:shadow-sm">
                    <CardContent className="flex items-center gap-3 p-4">
                      <ArrowLeft className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">Previous</div>
                        <div className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                          {prevDoc.title}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ) : (
                <div />
              )}
              {nextDoc && (
                <Link href={`/doc/${nextDoc.id}`} className="group">
                  <Card className="h-full border-border transition-all hover:border-primary/50 hover:shadow-sm">
                    <CardContent className="flex items-center justify-end gap-3 p-4 text-right">
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">Next</div>
                        <div className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                          {nextDoc.title}
                        </div>
                      </div>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>
          )}

          {/* Related Documentation Cards */}
          {relatedDocs.length > 0 && (
            <div className="space-y-4 border-t border-border pt-8">
              <h3 className="text-foreground text-xl font-bold tracking-tight">
                Related Documentation
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {relatedDocs.map((relatedDoc) => (
                  <Link key={relatedDoc.id} href={`/doc/${relatedDoc.id}`} className="group">
                    <Card className="h-full transition-all hover:border-primary/50 hover:shadow-sm cursor-pointer">
                      <CardHeader className="p-4">
                        <CardTitle className="text-base font-semibold transition-colors group-hover:text-primary">
                          {relatedDoc.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-xs">
                          {relatedDoc.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </MainLayout>
  );
}
