"use client";

import React from "react";
import { Carousel, Card } from "@/app/components/products/carousel";
import { projectData } from "@/app/components/products/constants";

export function Products() {
  const cards = projectData.map((project, index) => {
    const contentWithProps = React.cloneElement(project.content, {
      category: project.category,
      title: project.title,
    });
    const cardWithNewContent = { ...project, content: contentWithProps };
    return (
      <Card
        key={project.title}
        card={cardWithNewContent}
        index={index}
        layout={true}
      />
    );
  });

  return (
    <div className="h-full w-full px-4 py-12 sm:px-6 sm:py-16 md:px-8 md:py-20">
      <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Open Source Projects
        </p>

        <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Explore the projects in the Mifos ecosystem
        </h2>

        <p className="mt-4 text-sm sm:text-base leading-8 text-muted-foreground">
          The Mifos community builds a range of tools and applications for core
          banking, payments, mobile access, and digital financial services.
          Browse the projects below to see how these solutions connect and grow
          together.
        </p>
      </div>
      <Carousel items={cards} />
    </div>
  );
}