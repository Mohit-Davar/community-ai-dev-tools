import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

type AudienceCardProps = {
  title: string;
  description: string;
  image: string;
  href: string;
};

export function AudienceCard({
  title,
  description,
  image,
  href,
}: AudienceCardProps) {
  return (
    <Link href={href} className="block h-full">
      <Card className="flex h-full flex-col overflow-hidden pt-0 transition-shadow duration-300 hover:shadow-lg dark:hover:shadow-primary/20">
        <CardContent className="p-0">
          <Image
            width={500}
            height={500}
            src={image}
            alt={title}
            className="aspect-video w-full object-cover"
          />
        </CardContent>

        <CardHeader className="flex-1">
          <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>

          <CardDescription className="text-sm leading-6 sm:text-base sm:leading-7">
            {description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}