import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#5A5CE4", // Example color for buttons and highlights
        background: "#F8FAFC", // Light background color
        heading: "#0F172A", // Dark heading color
        text: "#475569", // Subtle text color
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      spacing: {
        "128": "32rem",
        "144": "36rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
