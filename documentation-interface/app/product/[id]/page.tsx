"use client";

import { useMemo, useState } from "react";
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
import { products, documentations } from "@/lib/mock-data";
import Link from "next/link";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Star,
  Users,
  ChevronRight,
  Package,
  Server,
  CreditCard,
  Cloud,
  Smartphone,
  Globe,
  Boxes,
  type LucideIcon,
  BookOpen,
  Wrench,
  Code2,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Package,
  Server,
  CreditCard,
  Cloud,
  Smartphone,
  Globe,
  Boxes,
};

const DIFFICULTY_STYLES: Record<string, string> = {
  Beginner: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Intermediate: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Advanced: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

const AUDIENCE_TABS = [
  { key: "All", label: "All Docs", icon: BookOpen },
  { key: "Users", label: "Users", icon: Users },
  { key: "Implementers", label: "Implementers", icon: Wrench },
  { key: "Contributors", label: "Contributors", icon: Code2 },
] as const;

export default function ProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const [audienceFilter, setAudienceFilter] =
    useState<(typeof AUDIENCE_TABS)[number]["key"]>("All");

  const product = products.find((p) => p.id === productId);
  const productDocs = useMemo(
    () =>
      documentations
        .filter((d) => d.productId === productId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [productId],
  );

  const filteredDocs =
    audienceFilter === "All"
      ? productDocs
      : productDocs.filter((d) => d.audience === audienceFilter);

  if (!product) {
    return (
      <MainLayout showRightSidebar={false}>
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <Card className="p-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Product Not Found</CardTitle>
              <CardDescription>
                The requested product documentation module does not exist.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Link href="/">
                <Button className="gap-2">
                  <ArrowLeft className="size-4" />
                  Go Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const Icon = ICON_MAP[product.icon] ?? Package;

  return (
    <MainLayout showRightSidebar={false}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col"
      >
        {/* Breadcrumb */}
        <div className="border-border bg-card/40 border-b px-4 py-3 md:px-8">
          <div className="mx-auto flex max-w-5xl items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">
              Docs
            </Link>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground font-medium">{product.name}</span>
          </div>
        </div>

        {/* Product Hero Header */}
        <div className="border-border bg-card/60 border-b p-6 md:p-10">
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex items-center gap-4">
                <div
                  className={`h-14 w-14 shrink-0 rounded-xl ${product.color} flex items-center justify-center text-white shadow-xs`}
                >
                  <Icon className="size-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-foreground text-3xl font-bold tracking-tight md:text-4xl">
                      {product.name}
                    </h1>
                  </div>
                </div>
              </div>
            </div>

            <p className="max-w-3xl text-muted-foreground text-base md:text-lg">
              {product.description}
            </p>
          </div>
        </div>

        {/* Product Content Sections */}
        <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12 space-y-12">
          {/* Key Features Section */}
          <section className="space-y-4">
            <h2 className="text-foreground text-2xl font-bold tracking-tight">
              Key Features
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                "Comprehensive integration documentation",
                "REST API references and code samples",
                "Community driven updates & support",
                "Security & compliance best practices",
                "Scalable deployment configuration",
                "Performance optimization guides",
              ].map((feature, i) => (
                <Card key={i} className="border-border bg-card">
                  <CardContent className="flex items-center gap-3 p-4">
                    <CheckCircle2 className="size-5 shrink-0 text-primary" />
                    <span className="text-foreground/90 text-sm font-medium">{feature}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Documentation Section */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-foreground text-2xl font-bold tracking-tight">
                Documentation
              </h2>
              <Badge variant="outline">{filteredDocs.length} of {productDocs.length} Articles</Badge>
            </div>

            {/* Audience filter tabs */}
            <div className="flex flex-wrap gap-2 border-b border-border pb-4">
              {AUDIENCE_TABS.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = audienceFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setAudienceFilter(tab.key)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                  >
                    <TabIcon className="size-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-4">
              {filteredDocs.length === 0 ? (
                <Card className="border-dashed border-border bg-transparent">
                  <CardContent className="p-8 text-center text-sm text-muted-foreground">
                    No articles for this audience yet.
                  </CardContent>
                </Card>
              ) : (
                filteredDocs.map((doc) => (
                  <Link key={doc.id} href={`/doc/${doc.id}`} className="group">
                    <Card className="transition-all hover:border-primary/50 hover:shadow-sm cursor-pointer">
                      <CardHeader className="p-5 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <CardTitle className="text-lg font-semibold transition-colors group-hover:text-primary">
                            {doc.title}
                          </CardTitle>
                          <ArrowRight className="size-4 shrink-0 mt-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                        </div>
                        <CardDescription className="text-sm line-clamp-2">
                          {doc.description}
                        </CardDescription>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <Badge variant="secondary" className="text-xs">
                            {doc.audience}
                          </Badge>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </motion.div>
    </MainLayout>
  );
}
