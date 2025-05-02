import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import HeroSection from "@/components/landing/hero-section";
import { AboutSection } from "@/components/landing/about-section";
import FeaturesSection from "@/components/landing/features-section";
import { HeroScrollDemo } from "@/components/landing/showcase-sectiom";
import PricingSection from "@/components/landing/pricing-section";
import { ReviewsSection } from "@/components/landing/reviews-section";
import { ShowcaseSection } from "@/components/landing/showcase-section";
import CTASection from "@/components/landing/cta-section";

export default function HomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Redirect to dashboard if user is already logged in
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Apply smooth scrolling behavior
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "A" &&
        target.getAttribute("href")?.startsWith("#")
      ) {
        e.preventDefault();
        const id = target.getAttribute("href")?.substring(1);
        const element = document.getElementById(id as string);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);
    return () => document.removeEventListener("click", handleAnchorClick);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar transparent={true} />
      <main className="flex-grow">
        <HeroSection />
        <FeaturesSection />
        <AboutSection />
        <HeroScrollDemo />
        <PricingSection />
        <ReviewsSection />
        <ShowcaseSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
