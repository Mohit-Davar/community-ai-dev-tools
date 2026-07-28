import React from "react";

export function ProjectContent({
  eyebrow,
  body,
  stats,
}: {
  eyebrow: string;
  body: React.ReactNode;
  stats: { label: string; value: string }[];
  category?: string;
  title?: string;
}) {
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Eyebrow Tag */}
      {eyebrow && (
        <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/20">
          {eyebrow}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Overview */}
        <div className="md:col-span-2 space-y-2">
          <h4 className="text-foreground text-sm sm:text-base font-semibold">
            Overview
          </h4>
          <div className="text-muted-foreground leading-relaxed text-xs sm:text-sm md:text-base">
            {body}
          </div>
        </div>

        {/* Key Information 2-column on mobile */}
        {stats && stats.length > 0 && (
          <div className="col-span-1 space-y-2">
            <h4 className="text-foreground text-sm sm:text-base font-semibold">
              Key Information
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-border/60 bg-muted/40 p-2.5 space-y-0.5"
                >
                  <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-xs sm:text-sm text-foreground leading-tight">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}