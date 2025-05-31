import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: { // Keeping sidebar colors if needed elsewhere
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
            'gradient-flow': {
                '0%, 100%': { backgroundPosition: '0% 50%' },
                '50%': { backgroundPosition: '100% 50%' },
            },
            'subtle-pulse': {
                '0%, 100%': { opacity: '1', transform: 'scale(1)' },
                '50%': { opacity: '0.85', transform: 'scale(0.98)' },
            },
            'pulse-opacity': {
              '0%, 100%': { opacity: '1' },
              '50%': { opacity: '0.65' }, // More noticeable dip
            },
            'shimmer': {
                 '0%': { backgroundPosition: '-1000px 0' },
                 '100%': { backgroundPosition: '1000px 0' },
            },
            'fade-in-scale': {
                '0%': { opacity: '0', transform: 'scale(0.95)' },
                '100%': { opacity: '1', transform: 'scale(1)' },
            },
            'slide-in-fade-up': {
                 '0%': { opacity: '0', transform: 'translateY(10px)' },
                 '100%': { opacity: '1', transform: 'translateY(0)' },
            },
            'button-press': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(0.97)' },
            },
            'icon-rotate': {
                 '0%': { transform: 'rotate(0deg)' },
                 '100%': { transform: 'rotate(15deg)' },
            },
            'text-flow-kf': {
                 '0%, 100%': { backgroundPosition: '0% 50%' },
                 '50%': { backgroundPosition: '100% 50%' },
            },
            'water-wave-effect': {
              '0%, 100%': { transform: 'scale(1)', opacity: '0.7' },
              '50%': { transform: 'scale(1.05)', opacity: '0.5' },
            },
            'border-glow-pulse': {
              '0%, 100%': { borderColor: 'hsl(var(--primary) / 0.5)', boxShadow: '0 0 5px hsl(var(--primary) / 0.3)' },
              '50%': { borderColor: 'hsl(var(--accent) / 0.7)', boxShadow: '0 0 10px hsl(var(--accent) / 0.5)' },
            },
            'glowing-blue-flow': {
              '0%': { backgroundPosition: '0% 0%' },
              '50%': { backgroundPosition: '100% 100%' },
              '100%': { backgroundPosition: '0% 0%' },
            },
            'hero-opacity-pulse': {
              '0%, 100%': { opacity: '0.6' }, // Base glow opacity
              '50%': { opacity: '1.0' },    // Peak glow opacity
            }
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
            'gradient-flow': 'gradient-flow 15s ease infinite',
            'subtle-pulse': 'subtle-pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            'pulse-opacity': 'pulse-opacity 1.8s ease-in-out infinite', // Slightly faster and more distinct
            'shimmer': 'shimmer 2s linear infinite',
            'fade-in-scale': 'fade-in-scale 0.4s ease-out forwards',
            'slide-in-fade-up': 'slide-in-fade-up 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
            'button-press': 'button-press 0.15s ease-out forwards',
            'icon-rotate': 'icon-rotate 0.2s ease-out forwards',
            'text-flow': 'text-flow-kf 5s ease infinite',
            'water-wave': 'water-wave-effect 3s infinite ease-in-out',
            'border-glow-pulse': 'border-glow-pulse 2s infinite alternate ease-in-out',
            'glowing-blue-flow': 'glowing-blue-flow 15s ease infinite alternate',
            'hero-opacity-pulse': 'hero-opacity-pulse 3s ease-in-out infinite alternate', // Adjusted duration and iteration
  		},
          backgroundSize: {
             '200%': '200% 200%',
             '300%': '300% 300%',
             '400%': '400% 400%',
          },
          transitionTimingFunction: {
             'out-bounce': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
             'in-out-quad': 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
             'ease-out-quad': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Added for smooth progress bar animation
          },
          boxShadow: {
             'glow-primary': '0 0 15px 3px hsl(var(--primary) / 0.4)',
             'glow-accent': '0 0 12px 2px hsl(var(--accent) / 0.3)',
             'inner-lg': 'inset 0 2px 10px 0 rgb(0 0 0 / 0.1)',
          },
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
