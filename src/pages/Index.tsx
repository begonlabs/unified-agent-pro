
import React from 'react';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import Navigation from '@/components/home/Navigation';
import HeroSection from '@/components/home/HeroSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import PricingSection from '@/components/home/PricingSection';
import CTASection from '@/components/home/CTASection';
import Footer from '@/components/home/Footer';

const Index = () => {
  useSmoothScroll();

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navigation />
      <main>
        <HeroSection />
        <FeaturesSection />
        <TestimonialsSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
