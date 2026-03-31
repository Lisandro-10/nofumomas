import type { Metadata } from "next";
import NavBar from "@/components/landing/NavBar";
import HeroSplit from "@/components/landing/HeroSplit";
import HeroStats from "@/components/landing/HeroStats";
import TechniquesGrid from "@/components/landing/TechniquesGrid";
import DifferentialsSection from "@/components/landing/DifferentialsSection";
import PricingPlans from "@/components/landing/PricingPlans";
import TestimonialsCarousel from "@/components/landing/TestimonialsCarousel";
import ExpertsSection from "@/components/landing/ExpertsSection";
import ScienceBaseGrid from "@/components/landing/ScienceBaseGrid";
import FAQ from "@/components/landing/FAQ";
import ContactLeadForm from "@/components/landing/ContactLeadForm";
import StickyMobileCta from "@/components/landing/StickyMobileCta";
import FloatingWhatsapp from "@/components/landing/FloatingWhatsapp";
import FooterMinimal from "@/components/landing/FooterMinimal";

export const metadata: Metadata = {
  title: "No Fumo Más — El mejor tratamiento online para dejar de fumar",
  description:
    "Método revolucionario basado en neurociencia y psicología profunda. Sin parches ni sustitutos. 90% de efectividad. Sesión única de 6 horas.",
};

export default function LandingPage() {
  return (
    <div className="bg-canvas">
      <NavBar />
      <HeroSplit />
      <HeroStats />
      <TechniquesGrid />
      <DifferentialsSection />
      <PricingPlans />
      <TestimonialsCarousel />
      <ExpertsSection />
      <ScienceBaseGrid />
      <FAQ />

      {/* Contact section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="text-4xl font-extrabold text-navy mb-6">
              Solicitá información personalizada
            </h2>
            <p className="text-navy/60 mb-12 leading-relaxed">
              Si tenés dudas sobre cuál plan es mejor para vos o si tu caso es particular,
              escribinos. Un asesor especializado te responderá en minutos.
            </p>
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-green-vitality/20 rounded-2xl flex items-center justify-center shrink-0">
                <span
                  className="material-symbols-outlined text-green-vitality"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  chat
                </span>
              </div>
              <div>
                <p className="font-bold text-lg text-navy">WhatsApp Directo</p>
                <p className="text-orange font-bold">+54 261 749-7523</p>
              </div>
            </div>
          </div>
          <ContactLeadForm />
        </div>
      </section>

      <FooterMinimal />
      {/* Fixed UI — rendered last so z-index stacking is correct */}
      <StickyMobileCta />
      <FloatingWhatsapp />
    </div>
  );
}