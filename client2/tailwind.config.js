module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#63b3ed',
          DEFAULT: '#4299e1',
          dark: '#3182ce',
        },
        secondary: {
          light: '#ff6b6b',
          DEFAULT: '#ff5252',
          dark: '#ff3838',
        },
      },
    },
  },
  plugins: [],
}

