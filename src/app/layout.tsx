// src/app/layout.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Lexend as FontSans } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Settings, Menu, User, History as HistoryIcon, BarChart2, Bot, Users, Activity, ClipboardList, ListChecks, LayoutDashboard, Star } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { auth, db } from '@/lib/firebase/exports';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import BottomNavigationBar from '@/components/layout/BottomNavigationBar';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedWrapper from '@/components/ui/animated-wrapper';
import { RoutePreloader } from '@/lib/route-preloader';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ["400", "500", "700", "900"]
});

const LOCAL_STORAGE_PROFILE_KEY_PREFIX = 'bago-user-profile-';

function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { toast } = useToast();
  const router = useRouter();
  const { user, userId } = useAuth();
  const [themeApplied, setThemeApplied] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const firebaseLogoUrl = "https://firebasestorage.googleapis.com/v0/b/nutritransform-ai.firebasestorage.app/o/WhatsApp%20Image%202025-05-12%20at%205.56.15%20PM.jpeg?alt=media&token=cbc230df-adcd-48e4-b7dd-4706a96b32f5";

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const applyThemeFromFirestore = async () => {
      if (!isClient || !userId) {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add('light'); // Default to light theme
        setThemeApplied(true);
        if (!userId) console.log("[Layout] User not logged in, applying default light theme.");
        return;
      }

      try {
        console.log("[Layout] Fetching settings for user:", userId);
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);

        let theme = 'light';
        if (userDocSnap.exists() && userDocSnap.data()?.settings?.theme) {
          const rawTheme = userDocSnap.data()?.settings.theme;
          // Convert legacy 'system' theme to 'light' for compatibility
          theme = rawTheme === 'system' ? 'light' : rawTheme;
          console.log("[Layout] Found theme in Firestore:", theme);
        } else {
          console.log("[Layout] User document or settings.theme not found, using default theme 'light'.");
          if (userDocSnap.exists()) {
            if (!userDocSnap.data()?.settings?.theme) {
                 await updateDoc(userDocRef, { 
                   settings: { 
                     theme: 'light' 
                   } 
                 });
                 console.log("[Layout] Settings field updated with default theme 'light'.");
            }
          } else {
            console.warn("[Layout] User document does not exist. Cannot save theme settings.");
          }
        }

        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        console.log(`[Layout] Applied theme: ${theme}`);
        setThemeApplied(true);
      } catch (error) {
        console.error("[Layout] Error fetching/applying theme from Firestore:", error);
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add('light'); // Default to light theme on error
        setThemeApplied(true);
      }
    };

    applyThemeFromFirestore();
  }, [userId, isClient]);

  const showHeaderFooter = !pathname.startsWith('/authorize') && !!user;
  const applyMainPadding = showHeaderFooter && !['/friends', '/ai-assistant'].includes(pathname);


  const handleLogout = async () => {
    console.log("[Layout] handleLogout called.");
    const currentUserId = userId;
    try {
      await auth.signOut();
      console.log("[Layout] Firebase sign-out successful.");
      document.cookie = 'isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      console.log("[Layout] Cleared isLoggedIn cookie.");

      if (isClient) {
        if (currentUserId) {
            localStorage.removeItem(`${LOCAL_STORAGE_PROFILE_KEY_PREFIX}${currentUserId}`);
            console.log(`[Layout] Cleared cached profile for user: ${currentUserId}`);
        } else {
            console.warn("[Layout] Could not clear cached profile on logout: userId was null before operation.");
        }

        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
        console.log(`[Layout] Reset theme to system default: ${systemTheme}`);
      }

      toast({ title: "Logged Out" });
      router.replace('/authorize');
    } catch (error) {
      console.error("[Layout] Error during logout:", error);
      toast({ title: "Logout Error", description: "Could not log out.", variant: "destructive" });
    }
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Activity },
    { href: "/overview", label: "Overview", icon: LayoutDashboard }, // Added Overview
    { href: "/profile", label: "Profile", icon: User },
    { href: "/log", label: "Log Food", icon: ClipboardList },
    { href: "/quick-log", label: "Quick Log", icon: ListChecks },
    { href: "/workout-plans", label: "Workout Plans", icon: ClipboardList },
    { href: "/ai-assistant", label: "AI Assistant", icon: Bot },
    { href: "/friends", label: "Friends", icon: Users },
    { href: "/points", label: "Your Points", icon: Star },
    { href: "/report", label: "Report", icon: BarChart2 },
    { href: "/history", label: "History", icon: HistoryIcon },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  useEffect(() => {
    if (isClient) {
      const headerElement = document.querySelector('header');
      const footerElement = document.querySelector('footer.md\\:block');

      const headerHeight = headerElement ? `${headerElement.offsetHeight}px` : '0px';
      document.documentElement.style.setProperty('--header-height', headerHeight);
      document.documentElement.style.setProperty('--header-height-md', headerHeight);

      const footerHeightMd = footerElement ? `${(footerElement as HTMLElement).offsetHeight}px` : '0px';
      document.documentElement.style.setProperty('--footer-height-md', footerHeightMd);
      document.documentElement.style.setProperty('--footer-height', '0px');

      const isMobile = window.innerWidth < 768;
      if (isMobile && showHeaderFooter) {
          document.documentElement.style.setProperty('--bottom-nav-height', '4rem');
      } else {
          document.documentElement.style.setProperty('--bottom-nav-height', '0px');
      }
    }
  }, [isClient, showHeaderFooter, pathname]);

  return (
    <motion.div 
      className={cn(
        "min-h-screen flex flex-col transition-opacity duration-300",
        !themeApplied ? 'opacity-0' : 'opacity-100'
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: themeApplied ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="wait">
        {showHeaderFooter && (
          <motion.header 
            className="bg-card/90 text-card-foreground py-3 px-4 md:px-6 shadow-md sticky top-0 z-50 border-b backdrop-blur-lg transition-all duration-300"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.6
            }}
          >
            <div className="container mx-auto flex justify-between items-center max-w-7xl px-2 sm:px-4 lg:px-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-primary hover:opacity-80 transition-opacity duration-200 group">
                  <motion.div
                    whileHover={{ 
                      scale: 1.1, 
                      rotate: -5,
                      transition: { type: "spring", stiffness: 300 }
                    }}
                  >
                    <Image
                      src={firebaseLogoUrl}
                      alt="Bago AI Logo"
                      width={32}
                      height={32}
                      className="rounded-sm"
                      priority
                      unoptimized={true}
                    />
                  </motion.div>
                  <motion.span
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Bago
                  </motion.span>
                </Link>
              </motion.div>

              <nav className="hidden md:flex items-center gap-1">
                <motion.div 
                  className="flex items-center gap-1"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: 0.3,
                    staggerChildren: 0.1,
                    delayChildren: 0.4
                  }}
                >
                  {navLinks.map((link, index) => {
                    const isActive = pathname === link.href || (pathname.startsWith(link.href) && !['/dashboard', '/overview'].includes(link.href) && pathname.startsWith(link.href) );
                    // More specific active check for dashboard and overview
                    if (link.href === '/dashboard' && pathname !== '/dashboard' && pathname !== '/overview') {
                        // isActive = false;
                    }
                    if (link.href === '/overview' && pathname !== '/overview') {
                        // isActive = false;
                    }

                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Link href={link.href}>
                          <Button
                            variant={isActive ? "secondary" : "ghost"}
                            size="sm"
                            className={cn(
                              "text-sm font-medium transition-all duration-200 ease-out group relative overflow-hidden",
                              isActive ? "text-primary font-semibold bg-primary/10" : "hover:bg-accent/50 hover:text-accent-foreground",
                              "transform hover:scale-105"
                            )}
                          >
                            {isActive && (
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5"
                                layoutId="activeTab"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              />
                            )}
                            <motion.div className="flex items-center relative z-10">
                              <motion.div
                                whileHover={{ 
                                  scale: 1.1,
                                  rotate: -3,
                                  transition: { type: "spring", stiffness: 400 }
                                }}
                              >
                                <link.icon className="mr-1.5 h-4 w-4" />
                              </motion.div>
                              {link.label}
                            </motion.div>
                          </Button>
                        </Link>
                      </motion.div>
                    )
                  })}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleLogout} 
                    title="Logout" 
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full ml-2 transition-colors duration-200 group relative overflow-hidden"
                  >
                    <motion.div
                      whileHover={{ 
                        rotate: -3,
                        scale: 1.1,
                        transition: { type: "spring", stiffness: 400 }
                      }}
                    >
                      <LogOut className="h-5 w-5" />
                    </motion.div>
                  </Button>
                </motion.div>
              </nav>
              <div className="md:hidden">
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>
      
      <motion.main 
        className={cn(
          "flex-grow w-full relative",
          applyMainPadding ? 'pt-4 pb-8 md:pt-6 md:pb-12 px-2 sm:px-4' : '',
          (pathname === '/friends' || pathname === '/ai-assistant') ? 'p-0' :
          (showHeaderFooter && !applyMainPadding ? `pb-[var(--bottom-nav-height)] md:pb-8 px-2 sm:px-4` : '')
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          delay: showHeaderFooter ? 0.3 : 0,
          duration: 0.6,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ 
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-accent/5 to-primary/5 rounded-full blur-3xl"
            animate={{ 
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ 
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ 
              duration: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className="relative z-10 h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.main>
      
      <Toaster />
      <RoutePreloader />
      
      <AnimatePresence>
        {showHeaderFooter && (
          <>
            <motion.footer 
              className="hidden md:block text-center p-4 text-muted-foreground text-xs border-t mt-auto bg-card/70 backdrop-blur-sm transition-colors duration-300"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ 
                delay: 0.5,
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                © {new Date().getFullYear()} Bago Fitness AI. All rights reserved.
              </motion.div>
            </motion.footer>
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ 
                delay: 0.4,
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
            >
              <BottomNavigationBar
                navLinks={navLinks}
                handleLogout={handleLogout}
                isSheetOpen={isMobileMenuOpen}
                setIsSheetOpen={setIsMobileMenuOpen}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
         <title>Bago - AI Fitness</title>
        <meta name="description" content="Your AI partner for fitness transformation." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#008080" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Bago AI" />
      </head>
      <body className={cn(
        "min-h-screen bg-background antialiased",
        fontSans.variable
      )}>
        <AuthProvider>
            <MainLayout>{children}</MainLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
