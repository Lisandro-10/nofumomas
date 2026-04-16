'use client';

import { useEffect, useRef } from "react";
import Link from "next/link";

const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5492612345678";

const NAV_LINKS = [
  { href: "#tecnicas", label: "Técnicas" },
  { href: "#precios", label: "Precios" },
  { href: "#nosotros", label: "Expertos" },
  { href: "#testimonios", label: "Testimonios" },
];

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Save trigger and move focus into drawer on open
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      closeButtonRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      triggerRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Focus trap
  const handleTabKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const focusable = e.currentTarget.querySelectorAll<HTMLElement>(
      'a[href], button, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const handleLinkClick = (href: string) => {
    onClose();
    // Give drawer time to close before scrolling
    setTimeout(() => {
      const el = document.querySelector(href);
      el?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity duration-200 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className={`fixed top-0 right-0 h-full w-72 bg-white z-50 md:hidden flex flex-col shadow-2xl transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onKeyDown={handleTabKey}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-navy/10">
          <span className="text-navy font-extrabold text-lg tracking-tight">No Fumo Más</span>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Cerrar menú"
            className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-navy/5 transition-colors"
          >
            <span className="material-symbols-outlined text-navy">close</span>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-6 py-8 flex flex-col gap-2">
          {NAV_LINKS.map(({ href, label }) => (
            <button
              key={href}
              onClick={() => handleLinkClick(href)}
              className="text-left w-full px-4 py-3 rounded-xl text-navy font-bold text-base hover:bg-navy/5 transition-colors"
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="px-6 pb-8 flex flex-col gap-3 border-t border-navy/10 pt-6">
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-green-vitality font-bold text-sm hover:bg-green-vitality/5 transition-colors"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              chat
            </span>
            WhatsApp
          </a>
          <a
            href="tel:+5492617497523"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-navy/60 font-bold text-sm hover:bg-navy/5 transition-colors"
          >
            <span className="material-symbols-outlined">call</span>
            +54 261 749-7523
          </a>
          <Link
            href="/checkout"
            onClick={onClose}
            className="mt-2 w-full text-center rounded-pill border-2 border-orange text-orange px-6 py-3 text-sm font-bold uppercase tracking-action hover:bg-orange hover:text-white transition-colors"
          >
            EMPEZAR AHORA
          </Link>
        </div>
      </div>
    </>
  );
}
