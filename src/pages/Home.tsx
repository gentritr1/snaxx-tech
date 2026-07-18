import { Navigation } from '@/components/Navigation';
import { Hero } from '@/sections/Hero';
import { Marquee } from '@/sections/Marquee';
import { About } from '@/sections/About';
import { Services } from '@/sections/Services';
import { Portfolio } from '@/sections/Portfolio';
import { Testimonials } from '@/sections/Testimonials';
import { CTA } from '@/sections/CTA';
import { Footer } from '@/sections/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {/* Navigation */}
      <Navigation />
      
      {/* Main Content */}
      <main id="main-content" data-route-focus tabIndex={-1} className="focus:outline-none">
        <Hero />
        <Marquee />
        <Portfolio />
        <About />
        <Services />
        <Testimonials />
        <CTA />
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
