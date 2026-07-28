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
import { products, documentations } from "@/lib/mock-data";
import Link from "next/link";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { ArrowRight, FileText, Search, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ProductPage() {
  const params = useParams();
  const productId = params.id as string;

  const product = products.find((p) => p.id === productId);
  const productDocs = documentations.filter((d) => d.productId === productId);

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

  return (
    <MainLayout showRightSidebar={false}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col"
      >
        {/* Product Hero Header */}
        <div className="border-border bg-card/60 border-b p-6 md:p-10">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex items-center gap-4">
              <div
                className={`h-14 w-14 shrink-0 rounded-xl ${product.color} flex items-center justify-center text-2xl font-bold text-white shadow-xs`}
              >
                {product.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-foreground text-3xl font-bold tracking-tight md:text-4xl">
                  {product.name}
                </h1>
                <Badge variant="secondary" className="mt-1">
                  {product.shortName}
                </Badge>
              </div>
            </div>

            <p className="text-muted-foreground text-base md:text-lg">
              {product.description}
            </p>
          </div>
        </div>

        {/* Product Content Sections */}
        <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8 md:py-12 space-y-10">
          {/* Overview Section */}
          <section className="space-y-4">
            <h2 className="text-foreground text-2xl font-bold tracking-tight">
              Overview
            </h2>
            <Card className="border-border bg-card/50">
              <CardContent className="p-6 text-foreground/90 leading-relaxed text-base">
                {product.description} Explore detailed guides, implementation resources, and API documentation below.
              </CardContent>
            </Card>
          </section>

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
            <div className="flex items-center justify-between">
              <h2 className="text-foreground text-2xl font-bold tracking-tight">
                Documentation Articles
              </h2>
              <Badge variant="outline">{productDocs.length} Articles</Badge>
            </div>

            <div className="grid gap-4">
              {productDocs.map((doc) => (
                <Link key={doc.id} href={`/doc/${doc.id}`}>
                  <Card className="transition-all hover:border-primary/50 hover:shadow-sm cursor-pointer">
                    <CardHeader className="p-5 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle className="text-lg font-semibold hover:text-primary transition-colors">
                          {doc.title}
                        </CardTitle>
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {doc.audience}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm line-clamp-2">
                        {doc.description}
                      </CardDescription>
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                        <span>Source: {doc.source}</span>
                        <span>Version {doc.version}</span>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </motion.div>
    </MainLayout>
  );
}
