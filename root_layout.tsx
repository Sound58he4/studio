// RootLayout.tsx
"use client";

import { Inter } from 'next/font/google'
import './globals.css'
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/context/AuthContext'; // Updated import path

const inter = Inter({ subsets: ['latin'] })

// export const metadata = {
//   title: 'Bago - AI Fitness',
//   description: 'Your AI partner for fitness transformation.',
// }

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  const pathname = usePathname();
  const [showHeaderFooter, setShowHeaderFooter] = useState(true);

  useEffect(() => {
    // List of paths where you don't want to show the header and footer
    const noHeaderFooterPaths = ['/login', '/sign-up', '/authorize']; // Added /authorize

    setShowHeaderFooter(!noHeaderFooterPaths.includes(pathname));
  }, [pathname]);

  function LayoutContent({ children }: { children: React.ReactNode }) {
    useEffect(() => {
      // Necessary client-side logic, e.g., context initialization
      console.log("LayoutContent mounted on the client");
    }, []);

    return (
      <div className="flex flex-col min-h-screen">
        {showHeaderFooter && (
          <header className="bg-card/90 text-card-foreground py-3 px-4 md:px-6 shadow-md sticky top-0 z-50 border-b backdrop-blur-lg">
            {/* Header Content */}
          </header>
        )}
        <main className={`flex-grow w-full ${showHeaderFooter ? 'pt-4 pb-8 md:pt-6 md:pb-12' : ''} px-2 sm:px-4`}>
          {children}
        </main>
        <Toaster />
        {showHeaderFooter && (
          <footer className="text-center p-4 text-muted-foreground text-xs border-t mt-auto bg-card/70 backdrop-blur-sm">
             © {new Date().getFullYear()} Bago Fitness AI. All rights reserved.
          </footer>
        )}
      </div>
    );
  }
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Bago - AI Fitness</title>
        <meta name="description" content="Your AI partner for fitness transformation." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      {/* Ensure AuthProvider wraps the entire body content */}
       <body> {/* Added body tag */}
            <AuthProvider>
                <LayoutContent>{children}</LayoutContent>
            </AuthProvider>
       </body>
    </html>
  );
}