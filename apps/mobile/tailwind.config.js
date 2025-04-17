/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(240 10% 3.9%)',
        foreground: 'hsl(0 0% 98%)',
        primary: 'hsl(142.1 70.6% 45.3%)',
        secondary: 'hsl(240 3.7% 15.9%)',
        muted: 'hsl(240 3.7% 15.9%)',
        accent: 'hsl(240 3.7% 15.9%)',
        destructive: 'hsl(0 62.8% 30.6%)',
        border: 'hsl(240 3.7% 15.9%)',
        input: 'hsl(240 3.7% 15.9%)',
        ring: 'hsl(142.1 76.2% 36.3%)',
      },
    },
  },
  plugins: [],
} 