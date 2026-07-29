/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "on-surface-variant": "#c1c6d7",
        "surface-container-low": "#131b2e",
        "surface-container-highest": "#2d3449",
        "background": "#0b1326",
        "surface-container-high": "#222a3d",
        "slate-900": "#0F172A",
        "slate-800": "#1E293B",
        "on-surface": "#dae2fd",
        "electric-blue": "#00D4FF",
        "surface-container-lowest": "#060e20",
        "surface": "#0b1326",
        "emerald-glow": "#34D399",
        "coral-vibe": "#FF6B6B",
        "primary": "#adc6ff",
        "primary-container": "#004391",
        "surface-container": "#1d2538",
        "glass-stroke": "rgba(255, 255, 255, 0.1)"
      },
      fontFamily: {
        "body-lg": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "label-mono": ["JetBrains Mono", "monospace"],
        "headline-md": ["Inter", "sans-serif"],
        "display-lg": ["Inter", "sans-serif"]
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
