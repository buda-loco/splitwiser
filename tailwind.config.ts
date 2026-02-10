import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      padding: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",
      },
      colors: {
        ios: {
          blue: "#007AFF",
          green: "#34C759",
          red: "#FF3B30",
          gray: "#8E8E93",
          gray2: "#AEAEB2",
          gray3: "#C7C7CC",
          gray4: "#D1D1D6",
          gray5: "#E5E5EA",
          gray6: "#F2F2F7",
          // Dark mode specific grays
          darkGray: "#1C1C1E",
          darkGray2: "#2C2C2E",
          darkGray3: "#3A3A3C",
          darkGray4: "#48484A",
          darkGray5: "#636366",
          darkGray6: "#8E8E93",
          // Semantic color mappings
          surface: {
            DEFAULT: "#FFFFFF",
            dark: "#1C1C1E",
          },
          card: {
            DEFAULT: "#F2F2F7",
            dark: "#2C2C2E",
          },
          border: {
            DEFAULT: "#C7C7CC",
            dark: "#48484A",
          },
          text: {
            primary: {
              DEFAULT: "#000000",
              dark: "#FFFFFF",
            },
            secondary: {
              DEFAULT: "#8E8E93",
              dark: "#8E8E93",
            },
          },
        },
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
      },
    },
  },
  plugins: [],
};
export default config;
