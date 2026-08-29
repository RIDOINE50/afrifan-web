/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        foreground: "#FFFFFF",
        primary: "#8B5CF6",
        "primary-hover": "#7C3AED",
        card: "#1A1A1A",
        border: "#2A2A2A",
        "text-muted": "#9CA3AF",
      },
    },
  },
  plugins: [],
};