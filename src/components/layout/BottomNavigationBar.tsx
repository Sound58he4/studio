// src/components/layout/BottomNavigationBar.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { 
  LogOut, 
  Menu, 
  User,
  ChevronRight,
  Grid3X3,
  MoreHorizontal,
  Home,
  BarChart3,
  MessageCircle,
  Plus,
  Apple,
  Activity,
  Target,
  Users,
  History as HistoryIcon,
  Settings
} from 'lucide-react';
import { MenuItem } from '@/types/navigation';

interface MainNavItem {
  title: string;
  icon: React.ComponentType<any>;
  route: string;
}

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
}

interface BottomNavigationBarProps {
  navLinks: NavLink[];
  handleLogout: () => void;
  isSheetOpen: boolean;
  setIsSheetOpen: (open: boolean) => void;
}

// Main navigation items
const mainNavItems: MainNavItem[] = [
  {
    title: "Dashboard",
    icon: Home,
    route: "/dashboard"
  },
  {
    title: "Overview", 
    icon: BarChart3,
    route: "/overview"
  },
  {
    title: "AI Assistant",
    icon: MessageCircle,
    route: "/ai-assistant"
  },
  {
    title: "Quick Log",
    icon: Plus,
    route: "/quick-log"
  }
];

// All other items go into the "More" menu
const moreMenuItems: MenuItem[] = [
  {
    title: "Log Meal",
    icon: Apple,
    route: "/log"
  },
  {
    title: "Workouts",
    icon: Activity,
    route: "/workout-plans"
  },
  {
    title: "Points",
    icon: Target,
    route: "/points"
  },
  {
    title: "Friends",
    icon: Users,
    route: "/friends"
  },
  {
    title: "Profile",
    icon: User,
    route: "/profile"
  },
  {
    title: "History",
    icon: HistoryIcon,
    route: "/history"
  },
  {
    title: "Settings",
    icon: Settings,
    route: "/settings"
  }
];

const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
  navLinks,
  handleLogout,
  isSheetOpen,
  setIsSheetOpen
}) => {
  const pathname = usePathname();  const router = useRouter();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const [lightTheme, setLightTheme] = useState(true);

  useEffect(() => {
    setIsClient(true);
    const handleStorageChange = () => {
      // Keep light theme only as requested
      setLightTheme(true);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isDark = false; // Always light theme

  // Memoize the current path to prevent unnecessary re-renders
  const currentPath = useMemo(() => pathname, [pathname]);

  return (
    <>
      <nav
        className={`
          fixed bottom-0 left-0 right-0
          z-50
          backdrop-blur-md border-t
          md:hidden
          shadow-[0_-4px_20px_0_rgba(0,0,0,0.08)]
          transition-all duration-500
          ${isDark 
            ? 'bg-gray-900/95 border-purple-500/20 shadow-[0_-4px_20px_0_rgba(147,51,234,0.1)]' 
            : 'bg-white/95 border-gray-200/50'
          }
        `}
        aria-label="Main navigation"
      >
        <div className="flex justify-between items-center px-2 py-2">
          {mainNavItems.map((item) => {
            const isActive = currentPath === item.route;
            return (
              <button
                key={item.route}
                onClick={() => router.push(item.route)}
                aria-current={isActive ? "page" : undefined}
                className={`
                  mobile-nav-item
                  touch-target
                  transition-all duration-200 ease-out
                  hover:scale-105 active:scale-95
                  flex flex-col items-center justify-center px-1 py-2 min-w-[60px] max-w-[70px] rounded-lg
                  ${isActive 
                    ? isDark 
                      ? 'text-purple-400 bg-purple-500/20 font-semibold shadow-lg border border-purple-400/30' 
                      : 'text-blue-600 bg-clayBlue font-semibold shadow-clayInset'
                    : isDark 
                      ? 'text-gray-300 hover:text-purple-300 hover:bg-gray-800/60' 
                      : 'text-gray-600 hover:text-blue-500 hover:bg-clay-100/60'
                  }
                `}              >
                {React.createElement(item.icon, {
                  size: 22,
                  className: `mb-1 transition-transform duration-150 ${
                    isActive ? 'scale-110' : ''
                  }`,
                  strokeWidth: 2
                })}
                <span className="text-[11px] font-medium truncate leading-tight text-center select-none">
                  {item.title}
                </span>
              </button>
            );
          })}
          {/* More button */}
          <button
            onClick={() => setShowMobileMenu(true)}
            className={`
              mobile-nav-item
              touch-target
              transition-all duration-200 ease-out
              hover:scale-105 active:scale-95
              flex flex-col items-center justify-center px-1 py-2 min-w-[60px] max-w-[70px] rounded-lg
              ${isDark 
                ? 'text-gray-300 hover:text-purple-300 hover:bg-gray-800/60' 
                : 'text-gray-600 hover:text-blue-500 hover:bg-clay-100/60'
              }
            `}
            aria-label="More"
          >
            <MoreHorizontal 
              size={22} 
              className={`mb-1 transition-transform duration-150 ${
                showMobileMenu ? 'rotate-90' : ''
              }`} 
              strokeWidth={2} 
            />
            <span className="text-[11px] font-medium">More</span>
          </button>
        </div>      </nav>      {/* Mobile 'More' Menu */}
      {isClient && showMobileMenu && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowMobileMenu(false)}>
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Menu</h3>
            {moreMenuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.route}
                  onClick={() => {
                    router.push(item.route);
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center space-x-3 w-full p-3 hover:bg-gray-100 rounded"
                >
                  <IconComponent size={20} />
                  <span>{item.title}</span>
                </button>
              );
            })}
            <button
              onClick={() => {
                handleLogout();
                setShowMobileMenu(false);
              }}
              className="flex items-center space-x-3 w-full p-3 hover:bg-gray-100 rounded text-red-600"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNavigationBar;