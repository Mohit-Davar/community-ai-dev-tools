"use client";

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
import { documentations } from "@/lib/mock-data";
import { getRelatedDocumentations } from "@/lib/search";
import Link from "next/link";
import { motion } from "framer-motion";
import { ThumbsUp, Share2, Calendar, ArrowLeft } from "lucide-react";
import { useParams } from "next/navigation";

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
        {/* Document Header Banner */}
        <div className="border-border bg-card/60 border-b p-6 md:p-10">
          <div className="mx-auto max-w-4xl space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="default">{doc.source}</Badge>
                <Badge variant="secondary">v{doc.version}</Badge>
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

            <div className="text-muted-foreground flex items-center gap-2 pt-2 text-xs">
              <Calendar className="size-4" />
              <span>Updated {doc.lastUpdated.toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8 md:py-12 space-y-12">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {doc.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>

          {/* Sections */}
          <article className="space-y-10">
            {doc.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-20 space-y-4">
                <h2 className="text-foreground text-2xl font-bold tracking-tight border-b border-border pb-2">
                  {section.title}
                </h2>
                <p className="text-foreground/90 text-base leading-relaxed">
                  {section.content}
                </p>

                {/* Subsections */}
                {section.subsections?.map((subsection) => (
                  <div
                    key={subsection.id}
                    id={subsection.id}
                    className="scroll-mt-20 space-y-2 pl-4 border-l-2 border-primary/30 my-4"
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
                  <Card key={i} className="my-6 overflow-hidden border-border bg-muted/40">
                    <div className="bg-muted px-4 py-2 text-xs font-mono font-medium text-muted-foreground border-b border-border">
                      {example.language}
                    </div>
                    <CardContent className="p-4 font-mono text-sm overflow-x-auto">
                      <pre className="text-foreground/90">
                        <code>{example.code}</code>
                      </pre>
                    </CardContent>
                  </Card>
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
              <CardTitle className="text-base font-medium">Was this documentation page helpful?</CardTitle>
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

          {/* Related Documentation Cards */}
          {relatedDocs.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-foreground text-xl font-bold tracking-tight">
                Related Documentation
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {relatedDocs.map((relatedDoc) => (
                  <Link key={relatedDoc.id} href={`/doc/${relatedDoc.id}`}>
                    <Card className="h-full transition-all hover:border-primary/50 hover:shadow-sm cursor-pointer">
                      <CardHeader className="p-4">
                        <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
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
