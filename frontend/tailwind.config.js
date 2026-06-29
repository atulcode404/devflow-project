/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4f46e5", // Indigo 600
        secondary: "#10b981", // Emerald 500
        dark: "#111827", // Gray 900
        light: "#f3f4f6", // Gray 100
        brand: {
          bg: "#050B1F",
          card: "#0B1736",
          primary: "#6366F1",
          accent: "#8B5CF6",
          border: "rgba(255,255,255,0.08)",
        }
      }
    },
  },
  plugins: [],
}
