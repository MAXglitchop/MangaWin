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
        "background": "#200f0d",
        "surface-tint": "#ffb4ab",
        "outline-variant": "#5e3f3b",
        "secondary-container": "#fabd00",
        "on-primary-fixed-variant": "#93000a",
        "surface-dim": "#200f0d",
        "on-secondary-fixed-variant": "#5b4300",
        "primary-fixed": "#ffdad6",
        "on-secondary-fixed": "#261a00",
        "secondary": "#ffdf9e",
        "surface-container": "#2e1a18",
        "on-tertiary-fixed": "#001e2c",
        "tertiary": "#77d1ff",
        "on-primary-container": "#5c0004",
        "primary-fixed-dim": "#ffb4ab",
        "on-surface-variant": "#e8bcb7",
        "tertiary-fixed-dim": "#77d1ff",
        "error-container": "#93000a",
        "inverse-surface": "#fedad6",
        "surface-variant": "#452f2d",
        "on-primary-fixed": "#410002",
        "on-error": "#690005",
        "on-tertiary-container": "#002d3f",
        "on-secondary": "#3f2e00",
        "primary-container": "#ff5449",
        "tertiary-container": "#269bcb",
        "on-error-container": "#ffdad6",
        "inverse-primary": "#c00011",
        "on-secondary-container": "#6a4e00",
        "surface": "#200f0d",
        "on-tertiary": "#003549",
        "surface-container-low": "#291714",
        "surface-container-highest": "#452f2d",
        "surface-container-lowest": "#1a0908",
        "secondary-fixed": "#ffdf9e",
        "surface-container-high": "#3a2522",
        "secondary-fixed-dim": "#fabd00",
        "tertiary-fixed": "#c2e8ff",
        "inverse-on-surface": "#412b28",
        "outline": "#af8783",
        "on-surface": "#fedad6",
        "surface-bright": "#4a3431",
        "primary": "#ffb4ab",
        "error": "#ffb4ab",
        "on-tertiary-fixed-variant": "#004d68",
        "on-primary": "#690005",
        "on-background": "#fedad6",
        "bios-warning": "#FFC107",
        "bios-charcoal": "#121212",
        "bios-gunmetal": "#4A4A4A",
        "bios-white": "#F4F4F5"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "unit": "4px",
        "gutter": "16px",
        "margin": "24px",
        "container-max": "1440px"
      },
      fontFamily: {
        "body-lg": ["JetBrains Mono"],
        "label-sm": ["JetBrains Mono"],
        "headline-sm": ["Share Tech Mono"],
        "body-md": ["JetBrains Mono"],
        "headline-md": ["Share Tech Mono"],
        "button-text": ["Share Tech Mono"],
        "display-lg": ["Share Tech Mono"]
      },
      fontSize: {
        "body-lg": ["16px", { "lineHeight": "1.5", "fontWeight": "400" }],
        "label-sm": ["12px", { "lineHeight": "1.4", "letterSpacing": "0.02em", "fontWeight": "500" }],
        "headline-sm": ["18px", { "lineHeight": "1.2", "fontWeight": "400" }],
        "body-md": ["14px", { "lineHeight": "1.5", "fontWeight": "400" }],
        "headline-md": ["24px", { "lineHeight": "1.2", "fontWeight": "400" }],
        "button-text": ["14px", { "lineHeight": "1", "fontWeight": "700" }],
        "display-lg": ["32px", { "lineHeight": "1.1", "letterSpacing": "0.05em", "fontWeight": "700" }]
      },
      keyframes: {
        'bounce-slow': {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(5%)' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        'slide': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        }
      },
      animation: {
        'bounce-slow': 'bounce-slow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'slide': 'slide 1.5s ease-in-out infinite'
      }
    },
  },
  plugins: [],
}

