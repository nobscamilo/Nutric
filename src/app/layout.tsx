import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://sb-302iewmpzlth.vercel.run'),
  title: '🍎 Calculadora Glucémica - PWA Web',
  description: 'Calculadora glucémica PWA — perfil, modal selector, scanner, EAN mapping, export CSV/PDF. Control nutricional inteligente para manejo de índice glucémico y carga glucémica.',
  keywords: 'calculadora glucémica, índice glucémico, carga glucémica, diabetes, nutrición, PWA',
  authors: [{ name: 'Sarmiento' }],
  creator: 'Sarmiento',
  publisher: 'Sarmiento',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Calculadora Glucémica',
    startupImage: [
      {
        url: '/apple-touch-icon.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: '/',
    siteName: 'Calculadora Glucémica',
    title: 'Calculadora Glucémica - Control Nutricional Inteligente',
    description: 'Herramienta profesional para calcular índice y carga glucémica de alimentos. Ideal para diabéticos y control nutricional.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Calculadora Glucémica',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calculadora Glucémica - Control Nutricional',
    description: 'Calcula índice y carga glucémica de alimentos de forma inteligente',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add verification codes if needed
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#2e8b57',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Calculadora Glucémica" />
        
        {/* Icons */}
        <link rel="icon" href="data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2016%2016'%3E%3Ctext%20y='14'%20font-size='14'%3E%F0%9F%8D%9E%3C/text%3E%3C/svg%3E" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* External Libraries */}
        <script src="https://unpkg.com/quagga@0.12.1/dist/quagga.min.js" async></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" async></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js" async></script>
        
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://world.openfoodfacts.org" />
        <link rel="preconnect" href="https://images.openfoodfacts.org" />
      </head>
      <body className={inter.className}>
        {/* Skip to main content for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-green-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:no-underline"
        >
          Saltar al contenido principal
        </a>
        
        <div id="root">
          {children}
        </div>

        {/* Service Worker Registration Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('✓ Service Worker registrado:', registration.scope);
                    })
                    .catch(function(error) {
                      console.log('Service Worker error:', error);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}