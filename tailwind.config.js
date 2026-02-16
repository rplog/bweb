/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                term: {
                    bg: '#0a0a0a',
                    text: '#00ff00',
                    dim: '#6272a4',
                    accent: '#bd93f9',
                }
            },
            fontFamily: {
                mono: ['"Fira Code"', 'Consolas', 'Monaco', 'monospace'],
            }
        },
    },
    plugins: [],
}
