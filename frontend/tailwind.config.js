/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#2F6B4F", dark: "#1F4A36", tint: "#E4EFE8" },
        bone: { DEFAULT: "#F7F5EF", deep: "#F0ECE1" },
        ink: { DEFAULT: "#23231F", soft: "#6B6B63" },
        gold: { DEFAULT: "#C89B3C", tint: "#F6ECD3" },
      },
      fontFamily: {
        serif: ["Fraunces", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: { xl2: "28px" },
      boxShadow: {
        soft: "0 12px 32px rgba(31,74,54,0.08)",
        lift: "0 18px 44px rgba(31,74,54,0.14)",
      },
    },
  },
  plugins: [],
}
