/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          900: "#0f1116",
          800: "#171a22",
          700: "#222633",
          600: "#2a2f3d",
          500: "#a5adcb",
          300: "#e6e9f2",
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        dark: {
          "primary": "#7aa2f7",
          "primary-focus": "#5a7dd7",
          "secondary": "#e5c07b",
          "success": "#98c379",
          "warning": "#e5c07b",
          "error": "#e06c75",
          "base-100": "#0f1116",
          "base-200": "#171a22",
          "base-300": "#222633",
          "base-content": "#e6e9f2",
        },
      },
    ],
  },
};
