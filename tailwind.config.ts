import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design system: No Fumo Mas
        orange:  "#FF7A18", // Spark of Life — primary actions, CTAs
        navy:    "#1E3A5F", // Authoritative Navy — headlines, footer
        canvas:  "#F7F9FC", // Breathable Canvas — app background
        green: {
          vitality: "#2E8B57", // Vitality Green — success states
          whatsapp: "#25D366", // WhatsApp actions
        },
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "sans-serif"],
      },
      borderRadius: {
        card: "2rem",   // 32px — cards & containers
        pill: "9999px", // buttons & inputs
      },
      boxShadow: {
        card: "0 4px 24px 0 rgba(30, 58, 95, 0.07)", // whisper-soft diffused
      },
      letterSpacing: {
        action: "0.08em", // action button text
      },
    },
  },
  plugins: [],
};
export default config;
