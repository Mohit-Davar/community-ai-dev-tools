import { AudienceCard } from "@/app/components/audiences/card";
import { audiences } from "@/app/components/audiences/constant";

export function Audiences() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary sm:text-sm">
          Documentation by Audience
        </p>

        <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          Find the right guidance for your role
        </h2>

        <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
          Mifos is an open-source platform that helps financial service providers
          deliver responsible financial services to underserved communities.
          Choose the path that fits your role and explore the documentation that
          matters most to you.
        </p>
      </div>

      <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
        {audiences.map((audience) => (
          <AudienceCard key={audience.title} {...audience} />
        ))}
      </div>
    </section>
  );
}
