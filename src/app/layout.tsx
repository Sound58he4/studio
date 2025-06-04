// src/app/layout.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Lexend as FontSans } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Settings, Menu, User, History as HistoryIcon, BarChart2, Bot, Users, Activity, ClipboardList, ListChecks, LayoutDashboard, Star, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { auth, db } from '@/lib/firebase/exports';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import BottomNavigationBar from '@/components/layout/BottomNavigationBar';
import TopNavigationBar from '@/components/layout/TopNavigationBar';
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
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [shouldHideBottomNav, setShouldHideBottomNav] = useState(false);
  const [forceShowBottomNav, setForceShowBottomNav] = useState(false);
  const [isNavbarMinimized, setIsNavbarMinimized] = useState(false);
  const [isBottomNavMinimized, setIsBottomNavMinimized] = useState(false);
  const [bottomNavDragY, setBottomNavDragY] = useState(0);
  const [isDraggingBottomNav, setIsDraggingBottomNav] = useState(false);

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
  const isChatPage = ['/friends', '/ai-assistant'].includes(pathname);


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
    { href: "/overview", label: "Overview", icon: LayoutDashboard },
    { href: "/log", label: "Log Food", icon: ClipboardList },
    { href: "/ai-assistant", label: "AI Assistant", icon: Bot },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/quick-log", label: "Quick Log", icon: ListChecks },
    { href: "/workout-plans", label: "Workout Plans", icon: ClipboardList },
    { href: "/points", label: "Your Points", icon: Star },
    { href: "/friends", label: "Friends", icon: Users },
    { href: "/report", label: "Report", icon: BarChart2 },
    { href: "/history", label: "History", icon: HistoryIcon },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  // Determine if we should show top navbar - hide it when bottom nav is visible
  const shouldShowTopNav = showHeaderFooter && (shouldHideBottomNav || !isClient || window?.innerWidth >= 768);

  useEffect(() => {
    if (isClient) {
      const headerElement = document.querySelector('header');
      const footerElement = document.querySelector('footer.md\\:block');
      const bottomNavElement = document.querySelector('[data-bottom-nav]');

      const headerHeight = headerElement ? `${headerElement.offsetHeight}px` : (shouldShowTopNav ? '60px' : '0px');
      document.documentElement.style.setProperty('--header-height', headerHeight);
      document.documentElement.style.setProperty('--header-height-md', headerHeight);

      const footerHeightMd = footerElement ? `${(footerElement as HTMLElement).offsetHeight}px` : '0px';
      document.documentElement.style.setProperty('--footer-height-md', footerHeightMd);
      document.documentElement.style.setProperty('--footer-height', '0px');

      const updateBottomNavHeight = () => {
        const isMobile = window.innerWidth < 768;
        const chatMinimizedQuery = document.querySelector('[data-chat-minimized="true"]');
        const hideNav = isMobile && showHeaderFooter && isChatPage && chatMinimizedQuery;
        
        setShouldHideBottomNav(!!hideNav);
        
        if (isMobile && showHeaderFooter && !hideNav) {
          const bottomNavHeight = bottomNavElement ? `${(bottomNavElement as HTMLElement).offsetHeight}px` : '4rem';
          document.documentElement.style.setProperty('--bottom-nav-height', bottomNavHeight);
          // Hide top navbar when bottom nav is visible on mobile
          document.documentElement.style.setProperty('--header-height', '0px');
        } else {
          document.documentElement.style.setProperty('--bottom-nav-height', '0px');
          // Show top navbar when bottom nav is hidden
          const headerHeight = headerElement ? `${headerElement.offsetHeight}px` : '60px';
          document.documentElement.style.setProperty('--header-height', headerHeight);
        }
      };

      updateBottomNavHeight();
      
      // Add resize listener to update heights on orientation change
      const handleResize = () => {
        setTimeout(updateBottomNavHeight, 100);
      };
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);
      
      // Listen for chat minimization changes with more frequent polling
      const observer = new MutationObserver(updateBottomNavHeight);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-chat-minimized'],
        childList: true,
        subtree: true
      });

      // Also set up a polling mechanism as backup
      const pollInterval = setInterval(updateBottomNavHeight, 1000);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
        observer.disconnect();
        clearInterval(pollInterval);
      };
    }
  }, [isClient, showHeaderFooter, pathname, isChatPage, shouldShowTopNav]);

  const toggleBottomNav = useCallback(() => {
    setIsBottomNavMinimized(!isBottomNavMinimized);
    setBottomNavDragY(0); // Reset drag position when toggling
  }, [isBottomNavMinimized]);

  const handleBottomNavDrag = useCallback((info: any) => {
    const { offset } = info;
    // Allow dragging up to hide (positive Y) and down to show (negative Y)
    const constrainedY = Math.max(-100, Math.min(100, offset.y));
    setBottomNavDragY(constrainedY);
  }, []);

  const handleBottomNavDragEnd = useCallback((info: any) => {
    const { offset, velocity } = info;
    setIsDraggingBottomNav(false);
    
    // Determine if we should minimize based on drag distance and velocity
    const threshold = 50;
    const velocityThreshold = 500;
    
    if (offset.y > threshold || velocity.y > velocityThreshold) {
      // Dragged down or fast downward velocity - minimize
      setIsBottomNavMinimized(true);
      setBottomNavDragY(0);
    } else if (offset.y < -threshold || velocity.y < -velocityThreshold) {
      // Dragged up or fast upward velocity - expand
      setIsBottomNavMinimized(false);
      setBottomNavDragY(0);
    } else {
      // Return to original position
      setBottomNavDragY(0);
    }
  }, []);

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
        {showHeaderFooter && (shouldHideBottomNav || forceShowBottomNav || (isClient && window.innerWidth >= 768)) && (
          <motion.header 
            className={cn(
              "bg-card/90 text-card-foreground shadow-md sticky top-0 z-50 border-b backdrop-blur-lg transition-all duration-300",
              isNavbarMinimized ? "py-1 px-2" : "py-3 px-4 md:px-6"
            )}
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
            <div className={cn(
              "container mx-auto flex justify-between items-center max-w-7xl gap-4",
              isNavbarMinimized ? "px-1 sm:px-2" : "px-2 sm:px-4 lg:px-6 xl:px-8"
            )}
              style={{ minHeight: isNavbarMinimized ? '40px' : '60px' }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/dashboard" className={cn(
                  "flex items-center gap-2 font-bold text-primary hover:opacity-80 transition-opacity duration-200 group",
                  isNavbarMinimized ? "text-lg" : "text-xl"
                )}>
                  <motion.div
                    whileHover={{ 
                      scale: 1.1, 
                      rotate: -5,
                      transition: { type: "spring", stiffness: 300 }
                    }}
                  >
                    <Image
                      src="/logo.jpeg"
                      alt="Bago AI Logo"
                      width={isNavbarMinimized ? 24 : 32}
                      height={isNavbarMinimized ? 24 : 32}
                      className="rounded-sm"
                      priority
                    />
                  </motion.div>
                  {!isNavbarMinimized && (
                    <motion.span
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      Bago
                    </motion.span>
                  )}
                </Link>
              </motion.div>

              <div className="flex items-center gap-2">
                {!isNavbarMinimized && (
                  <TopNavigationBar 
                    navLinks={navLinks}
                    handleLogout={handleLogout}
                    pathname={pathname}
                  />
                )}
                
                {/* Navbar minimize/expand toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsNavbarMinimized(!isNavbarMinimized)}
                  className="p-2 h-8 w-8"
                  title={isNavbarMinimized ? "Expand navbar" : "Minimize navbar"}
                >
                  {isNavbarMinimized ? (
                    <Menu size={16} />
                  ) : (
                    <ArrowLeft size={16} className="rotate-90" />
                  )}
                </Button>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>
      
      <motion.main 
        className={cn(
          "flex-grow w-full relative",
          applyMainPadding ? 'pt-4 pb-8 md:pt-6 md:pb-12 px-2 sm:px-4' : '',
          isChatPage ? 'h-[calc(100vh-var(--header-height,0px)-var(--bottom-nav-height,0px))] overflow-hidden' :
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

      {/* Floating navbar toggle when minimized - only show when top nav is hidden */}
      <AnimatePresence>
        {isNavbarMinimized && showHeaderFooter && (shouldHideBottomNav || forceShowBottomNav || (isClient && window.innerWidth >= 768)) && (
          <motion.button
            className="fixed top-4 right-4 z-40 bg-primary text-primary-foreground p-2 rounded-full shadow-lg border-2 border-primary-foreground/20"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => setIsNavbarMinimized(false)}
            title="Expand navbar"
          >
            <Menu size={16} />
          </motion.button>
        )}
      </AnimatePresence>
      
      <Toaster />
      <RoutePreloader />
      
      <AnimatePresence>
        {showHeaderFooter && (
          <>
            {/* Single Bottom Navigation for Mobile */}
            <AnimatePresence>
              {isClient && window.innerWidth < 768 && (
                <motion.div
                  className="fixed bottom-0 left-0 right-0 z-50"
                  initial={{ y: 100 }}
                  animate={{ 
                    y: shouldHideBottomNav && !forceShowBottomNav ? 100 : 0 
                  }}
                  exit={{ y: 100 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                >
                  {/* Minimized state - just expand icon */}
                  <AnimatePresence>
                    {isBottomNavMinimized && (
                      <motion.div
                        className="flex justify-center pb-2"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <motion.button
                          className="bg-primary text-primary-foreground p-2 rounded-full shadow-lg border-2 border-primary-foreground/20"
                          whileTap={{ scale: 0.95 }}
                          onClick={toggleBottomNav}
                          title="Expand navigation"
                        >
                          <ArrowLeft size={16} className="-rotate-90" />
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Full bottom navigation */}
                  <AnimatePresence>
                    {!isBottomNavMinimized && (
                      <motion.div
                        drag="y"
                        dragConstraints={{ top: -100, bottom: 100 }}
                        dragElastic={0.2}
                        onDrag={handleBottomNavDrag}
                        onDragStart={() => setIsDraggingBottomNav(true)}
                        onDragEnd={handleBottomNavDragEnd}
                        className="bg-background border-t relative cursor-grab active:cursor-grabbing"
                        style={{
                          y: bottomNavDragY,
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3 }}
                        whileDrag={{ 
                          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                          scale: 1.02 
                        }}
                      >
                        {/* Drag handle */}
                        <div className="flex justify-center py-2 border-b border-border/50">
                          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
                        </div>

                        {/* Minimize button */}
                        {/* <div className="absolute top-2 right-2 z-10">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleBottomNav}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            title="Minimize navigation"
                          >
                            <ArrowLeft size={12} className="rotate-90" />
                          </Button>
                        </div> */}

                        {/* Close button when force showing (only in chat scenarios) */}
                        {forceShowBottomNav && shouldHideBottomNav && (
                          <div className="absolute top-2 left-2 z-10">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setForceShowBottomNav(false)}
                              className="h-8 w-8 p-0 bg-background/90 backdrop-blur-sm border-border hover:bg-muted hover:border-muted-foreground/30 transition-all duration-200"
                              title="Hide navigation"
                            >
                              <div className="flex flex-col items-center gap-0.5">
                                <ArrowLeft size={10} className="rotate-90" />
                                <div className="w-3 h-0.5 bg-current rounded-full opacity-60" />
                              </div>
                            </Button>
                          </div>
                        )}

                        <div data-bottom-nav>
                          <BottomNavigationBar
                            navLinks={navLinks}
                            handleLogout={handleLogout}
                            isSheetOpen={isMobileMenuOpen}
                            setIsSheetOpen={setIsMobileMenuOpen}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Show navigation toggle when bottom nav is completely hidden */}
            <AnimatePresence>
              {shouldHideBottomNav && !forceShowBottomNav && !isBottomNavMinimized && isClient && window.innerWidth < 768 && (
                <motion.button
                  className="md:hidden fixed bottom-4 right-4 z-40 bg-accent text-accent-foreground p-2 rounded-full shadow-lg border-2 border-accent-foreground/20"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => setForceShowBottomNav(true)}
                  title="Show navigation"
                >
                  <Menu size={16} />
                </motion.button>
              )}
            </AnimatePresence>
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
