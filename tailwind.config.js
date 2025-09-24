const withMT = require("@material-tailwind/react/utils/withMT");
module.exports = withMT({
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  plugins: [require("@tailwindcss/typography")],

  theme: {
    extend: {
      colors: {
        blueColor: "#002D5D",
        blueColorDull: "#1A456F",
        lightBlueColor: "#002d5d25",
        lightBlueColorDull: "#1A456F40",

        orangeColor: "#E94E1B",
        orangeColorDull: "#D04A22",

        yellowColor: "#FFC629",
        yellowColorDull: "#E5B226",

        redColor: "#CE0E2D",
        redColorDull: "#B21C38",
        blackColor: "#121212",
        blackColorDull: "#2A2A2A",

        textPrimary: "#4A4A4A",
        textMuted: "#6A6A6A",
        blueText: "#1F567D",
        orangeText: "#D65C33",
        dark: {
          bg: "#0D1B2A", // deep navy background
          surface: "#182534", // balanced navy slate, separates nicely from bg
          surfaceHover: "#213346", // hover with depth, modern & subtle
          text: "#E6F1FA", // soft white-blue
          textMuted: "#94A8BC", // muted blue-gray
          border: "#1E3A56", // blue-gray border
        },
      },
      fontFamily: {
        customFont_outline_light: ['"customFont_outline_light"', "sans-serif"],
        customFont_extrabold: ['"customFont_extrabold"', "sans-serif"],
        customFont_outline_bold: ['"customFont_outline_bold"', "sans-serif"],
        customFont_outline_regular: [
          '"customFont_outline_regular"',
          "sans-serif",
        ],
        customFont_outline_extrabold: [
          '"customFont_outline_extrabold"',
          "sans-serif",
        ],
        customFont_outline_medium: [
          '"customFont_outline_medium"',
          "sans-serif",
        ],
        customFont_regular: ['"customFont_regular"', "sans-serif"],
        customFont_thin: ['"customFont_thin"', "sans-serif"],
        customFont_outline_thin: ['"customFont_outline_thin"', "sans-serif"],
        customFont_medium: ['"customFont_medium"', "sans-serif"],
        customFont_outline_black: ['"customFont_outline_black"', "sans-serif"],
        customFont_black: ['"customFont_black"', "sans-serif"],
        customFont_light: ['"customFont_light"', "sans-serif"],
        customFont_bold: ['"customFont_bold"', "sans-serif"],
      },
    },
  },
});
