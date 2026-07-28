"use client";

import { PointerHighlight } from "@/app/components/hero-section/highlight";
import Link from "next/link";
import { Avatars } from "@/app/components/hero-section/avatar";
import { avatars } from "@/app/components/hero-section/constants";

export function HeroSection() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 p-6 lg:flex-row lg:gap-12">
          <div className="flex-1 space-y-8">
            {/* Headline */}
            <h1 className="text-foreground max-w-3xl text-4xl font-extrabold md:text-5xl lg:text-6xl">
              Everything you need to use and contribute to{" "}
              <PointerHighlight
                containerClassName="inline-block"
                rectangleClassName="border-primary"
                pointerClassName="text-primary"
              >
                <span className="text-primary relative z-10 px-1">
                  OpenMF Projects
                </span>
              </PointerHighlight>
            </h1>

            <p className="text-muted-foreground max-w-2xl text-base leading-8 md:text-lg">
              Everything you need to use, integrate, and contribute to the
              OpenMF ecosystem. Explore our guides, docs, and resources below.
            </p>

            {/* CTAs */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/docs"
                className="bg-primary text-primary-foreground ring-primary ring-offset-background hover:ring-accent inline-flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold ring ring-offset-2 transition-all duration-200 sm:w-auto"
              >
                Browse Documentation
              </Link>

              <Link
                href="https://github.com/openMF"
                target="_blank"
                rel="noopener noreferrer"
                className="border-border bg-card text-foreground hover:bg-secondary hover:border-primary inline-flex w-full items-center justify-center rounded-lg border px-5 py-2.5 text-sm font-semibold transition-all duration-200 sm:w-auto"
              >
                View GitHub
              </Link>
            </div>

            {/* Community */}
            <div className="flex flex-wrap-reverse items-center gap-3">
              <Avatars numPeople={230} avatarUrls={avatars} />
              <span className="text-muted-foreground text-sm">
                Built and used by people worldwide.
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
