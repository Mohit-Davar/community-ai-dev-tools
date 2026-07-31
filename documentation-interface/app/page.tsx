import { MainLayout } from "@/components/main-layout";
import { HeroSection } from "@/app/components/hero-section";
import { Audiences } from "@/app/components/audiences";
import { Products } from "@/app/components/products";

export default async function Home() {
  return (
    <MainLayout showRightSidebar={false}>
      <HeroSection />
      <Audiences />
      <Products />
    </MainLayout>
  );
}
