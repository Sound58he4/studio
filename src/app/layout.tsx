// src/app/layout.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Lexend as FontSans } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Settings, Menu, User, History as HistoryIcon, BarChart2, Bot, Users, Activity, ClipboardList, ListChecks, LayoutDashboard, Star, ArrowLeft, Gift } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { auth } from '@/lib/firebase/exports';
import BottomNavigationBar from '@/components/layout/BottomNavigationBar';
import TopNavigationBar from '@/components/layout/TopNavigationBar';
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
  const { isDark } = useTheme(); // Use theme from ThemeContext instead of local state
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null);
  const [isNavbarMinimized, setIsNavbarMinimized] = useState(false); // Desktop navbar minimize state

  useEffect(() => {
    setIsClient(true);
    
    // Check mobile status immediately when client is ready
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  const showHeaderFooter = !pathname?.startsWith('/authorize') && !!user;
  const applyMainPadding = showHeaderFooter && !['/friends', '/ai-assistant'].includes(pathname || '');
  const isChatPage = ['/friends', '/ai-assistant'].includes(pathname || '');


  const handleLogout = async () => {
    console.log("[Layout] handleLogout called.");
    const currentUserId = userId;
    try {
      await auth.signOut();
      console.log("[Layout] Firebase sign-out successful.");
      document.cookie = 'isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      document.cookie = 'userDisplayName=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      console.log("[Layout] Cleared authentication cookies.");
      if (isClient) {
        if (currentUserId) {
            localStorage.removeItem(`${LOCAL_STORAGE_PROFILE_KEY_PREFIX}${currentUserId}`);
            console.log(`[Layout] Cleared cached profile for user: ${currentUserId}`);
        } else {
            console.warn("[Layout] Could not clear cached profile on logout: userId was null before operation.");
        }
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
    { href: "/offer", label: "Offer", icon: Gift },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  // Determine if we should show top navbar - ONLY on desktop, NEVER on mobile
  const shouldShowTopNav = showHeaderFooter && isClient && !isMobile;

  // Determine if we should show bottom navbar - ONLY on mobile, NEVER on desktop
  const shouldShowBottomNav = showHeaderFooter && isClient && isMobile;

  useEffect(() => {
    if (isClient) {
      const headerElement = document.querySelector('header');
      const bottomNavElement = document.querySelector('[data-bottom-nav]');

      const headerHeight = headerElement ? `${headerElement.offsetHeight}px` : (shouldShowTopNav ? '60px' : '0px');
      document.documentElement.style.setProperty('--header-height', headerHeight);

      const updateBottomNavHeight = () => {
        // Always show nav height when on mobile and header/footer should be shown
        if (isMobile && showHeaderFooter) {
          const bottomNavHeight = bottomNavElement ? `${(bottomNavElement as HTMLElement).offsetHeight}px` : '5rem';
          document.documentElement.style.setProperty('--bottom-nav-height', bottomNavHeight);
        } else {
          document.documentElement.style.setProperty('--bottom-nav-height', '0px');
        }
      };

      updateBottomNavHeight();
      
      const handleResize = () => {
        setTimeout(updateBottomNavHeight, 100);
      };
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      };
    }
  }, [isClient, showHeaderFooter, shouldShowTopNav, isMobile]);

  // Optimized navigation handler with better performance
  const handleOptimisticNavigation = useCallback((href: string) => {
    // Immediate UI feedback
    setOptimisticPath(href);
    
    // Use startTransition for non-urgent state updates
    router.push(href);
    
    // Clear optimistic state faster
    setTimeout(() => setOptimisticPath(null), 50);
  }, [router]);

  // Prefetch primary routes on mount for faster navigation
  useEffect(() => {
    if (isClient && router) {
      const primaryRoutes = ['/dashboard', '/overview', '/ai-assistant', '/profile'];
      primaryRoutes.forEach(route => {
        router.prefetch(route);
      });
    }
  }, [isClient, router]);  return (
    <div 
      className={cn(
        "min-h-screen flex flex-col transition-colors duration-500",
        isDark 
          ? "bg-[#1a1a1a]" 
          : "bg-gradient-to-br from-clay-100 via-clayBlue to-clay-200"
      )}
    >      {/* Top Navigation - Desktop Only */}
      {shouldShowTopNav && (
        <header 
          className={cn(
            "sticky top-0 z-50 shadow-lg animate-slide-down hidden md:block transition-all duration-500",
            isDark 
              ? "bg-[#1a1a1a]" 
              : "bg-clayGlass backdrop-blur-lg border-b border-white/20"
          )}
        >
          <div className={cn(
            "container mx-auto flex justify-between items-center max-w-7xl gap-4",
            isNavbarMinimized ? "px-1 sm:px-2" : "px-2 sm:px-4 lg:px-6 xl:px-8"
          )}
            style={{ minHeight: isNavbarMinimized ? '40px' : '60px' }}
          >            <div>
              <Link href="/dashboard" className={cn(
                "flex items-center gap-2 font-bold hover:opacity-80 transition-opacity duration-200 group",
                isNavbarMinimized ? "text-lg" : "text-xl",
                isDark ? "text-white" : "text-primary"
              )}>
                <Image
                  src="/logo.jpeg"
                  alt="Bago AI Logo"
                  width={isNavbarMinimized ? 24 : 32}
                  height={isNavbarMinimized ? 24 : 32}
                  className="rounded-sm"
                  priority
                />
                {!isNavbarMinimized && (
                  <span>Bago</span>
                )}
              </Link>
            </div>

            <div className="flex items-center gap-2">              {!isNavbarMinimized && (
                <TopNavigationBar 
                  navLinks={navLinks}
                  handleLogout={handleLogout}
                  pathname={pathname || ''}
                  isDark={isDark}
                />
              )}
                <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsNavbarMinimized(!isNavbarMinimized)}
                className={cn(
                  "p-2 h-8 w-8 transition-colors duration-200",
                  isDark ? "hover:bg-[#2a2a2a] text-white" : ""
                )}
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
        </header>
      )}
      
      <main 
        className={cn(
          "flex-grow w-full relative",
          applyMainPadding ? 'pt-4 pb-8 md:pt-6 md:pb-12 px-2 sm:px-4' : '',
          isChatPage ? 'h-[calc(100vh-var(--header-height,0px)-var(--bottom-nav-height,0px))] overflow-hidden' :
          (showHeaderFooter && !applyMainPadding ? 'px-2 sm:px-4 pb-[var(--bottom-nav-height)] md:pb-8' : '')
        )}
        style={{ 
          position: 'relative',
          zIndex: 1
        }}
      >        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className={cn(
            "absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-40 transition-colors duration-500",
            isDark 
              ? "bg-gradient-to-br from-purple-500/10 to-blue-500/10" 
              : "bg-gradient-to-br from-primary/5 to-secondary/5"
          )} />
          <div className={cn(
            "absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-30 transition-colors duration-500",
            isDark 
              ? "bg-gradient-to-tr from-blue-500/10 to-purple-500/10" 
              : "bg-gradient-to-tr from-accent/5 to-primary/5"
          )} />
        </div>

        <div className={cn(
          "relative h-full",
          isChatPage ? "z-10" : "z-10"
        )}>
          {children}
        </div>
      </main>      {/* Floating navbar toggle when minimized - Desktop Only */}
      {isNavbarMinimized && shouldShowTopNav && (
        <button
          className={cn(
            "hidden md:block fixed top-4 right-4 z-50 p-2 rounded-full shadow-lg border-2 transition-colors duration-500",
            isDark 
              ? "bg-[#2a2a2a] text-white border-[#3a3a3a] hover:bg-[#3a3a3a]" 
              : "bg-primary text-primary-foreground border-primary-foreground/20 hover:bg-primary/90"
          )}
          onClick={() => setIsNavbarMinimized(false)}
          title="Expand navbar"
        >
          <Menu size={16} />
        </button>
      )}
      
      <Toaster />
      <RoutePreloader />        {/* Bottom Navigation - Mobile Only */}
      {shouldShowBottomNav && (
        <BottomNavigationBar
          navLinks={navLinks}
          handleLogout={handleLogout}
          isSheetOpen={isMobileMenuOpen}
          setIsSheetOpen={setIsMobileMenuOpen}
          isDark={isDark}
        />
      )}
    </div>
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
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function() {
              try {
                const cachedTheme = localStorage.getItem('bago-cached-theme');
                const isSystemDefault = localStorage.getItem('bago-system-default') === 'true';
                
                let theme = 'light';
                
                if (isSystemDefault) {
                  // Always check current system preference for system default
                  theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  // Update cache with current system theme
                  localStorage.setItem('bago-cached-theme', theme);
                } else if (cachedTheme && (cachedTheme === 'light' || cachedTheme === 'dark')) {
                  // Use cached theme for manual selection
                  theme = cachedTheme;
                }
                
                // Apply theme immediately to prevent flash
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(theme);
                localStorage.setItem('lightTheme', (theme === 'light').toString());
                
                // Mark that theme has been initialized
                window.__THEME_INITIALIZED__ = true;
                
                console.log('[Theme Init] Applied theme:', theme, 'isSystemDefault:', isSystemDefault);
              } catch (error) {
                console.warn('[Theme Init] Error:', error);
                document.documentElement.classList.add('light');
                window.__THEME_INITIALIZED__ = true;
              }
            })();
          `}
        </Script>
        <AuthProvider>
          <ThemeProvider>
            <MainLayout>{children}</MainLayout>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
