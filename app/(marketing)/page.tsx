import { Nav } from "@/components/marketing/Nav";
import { Hero } from "@/components/marketing/Hero";
import { Trust } from "@/components/marketing/Trust";
import { Features } from "@/components/marketing/Features";
import { POSHighlight } from "@/components/marketing/POSHighlight";
import { Pricing } from "@/components/marketing/Pricing";
import { CTA } from "@/components/marketing/CTA";
import { Footer } from "@/components/marketing/Footer";

export default function MarketingPage() {
  return (
    <>
      <Nav />
      <Hero />
      <Trust />
      <Features />
      <POSHighlight />
      <Pricing />
      <CTA />
      <Footer />
    </>
  );
}
