import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate"
import typography from "@tailwindcss/typography"

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [animate, typography],
} satisfies Config
