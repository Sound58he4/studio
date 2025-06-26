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
  Settings,
  Gift,
  X
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
  isDark?: boolean;
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
  },
  {
    title: "Offer",
    icon: Gift,
    route: "/offer"
  }
];

const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
  navLinks,
  handleLogout,
  isSheetOpen,
  setIsSheetOpen,
  isDark = false
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Memoize the current path to prevent unnecessary re-renders
  const currentPath = useMemo(() => pathname, [pathname]);

  return (
    <>
      <nav
        className={`
          fixed bottom-0 left-0 right-0
          z-40
          backdrop-blur-md border-t
          md:hidden
          shadow-[0_-4px_20px_0_rgba(0,0,0,0.08)]
          transition-all duration-500
          ${isDark 
            ? 'bg-[#1a1a1a]/90 border-[#2a2a2a]' 
            : 'bg-white/90 border-gray-200/50'
          }
        `}
        aria-label="Main navigation"
        data-bottom-nav
      >
        <div className="flex justify-between items-center px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
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
                      ? 'text-blue-400 bg-blue-500/20 font-semibold shadow-lg border border-blue-400/30' 
                      : 'text-blue-600 bg-clayBlue font-semibold shadow-clayInset'
                    : isDark 
                      ? 'text-gray-300 hover:text-white hover:bg-[#2a2a2a]' 
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
                ? 'text-gray-300 hover:text-white hover:bg-[#2a2a2a]' 
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
        <div className={`fixed inset-0 z-[60] backdrop-blur-sm transition-all duration-300 ${
          isDark ? 'bg-black/60' : 'bg-black/20'
        }`} onClick={() => setShowMobileMenu(false)}>
          <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-sm backdrop-blur-md rounded-3xl shadow-2xl border animate-scale-in transition-all duration-500 ${
            isDark 
              ? 'bg-[#1a1a1a]/95 border-[#2a2a2a] shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]'
              : 'bg-white/95 border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)]'
          }`}>
            <div className="p-4 max-h-[80vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-800'
                }`}>Menu</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowMobileMenu(false)} 
                  className={`h-8 w-8 rounded-full transition-all duration-300 ${
                    isDark 
                      ? 'bg-[#2a2a2a]/60 hover:bg-[#3a3a3a]/80 text-gray-300 border border-[#3a3a3a]' 
                      : 'bg-white/60 hover:bg-white/80 shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.1)] text-gray-700'
                  }`}
                >
                  <X size={16} />
                </Button>
              </div>

              {/* Menu Items - Compact Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {moreMenuItems.map(item => {
                  const isActive = pathname === item.route;
                  const isOffer = item.title === "Offer";
                  const IconComponent = item.icon;
                  return (
                    <button 
                      key={item.title} 
                      className={`flex flex-col items-center space-y-2 p-3 text-center rounded-2xl transition-all duration-300 hover:-translate-y-0.5 ${
                        isActive 
                          ? isDark 
                            ? 'bg-blue-400/20 text-blue-300 shadow-lg border border-blue-400/30' 
                            : 'bg-blue-50 text-blue-700 shadow-[inset_0_1px_3px_0_rgba(59,130,246,0.2)]'
                          : isOffer
                            ? isDark
                              ? 'bg-orange-400/20 text-orange-300 shadow-lg border border-orange-400/30 hover:bg-orange-400/30'
                              : 'bg-orange-50 text-orange-700 shadow-[0_2px_8px_0_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.15)] border border-orange-200'
                            : isDark 
                              ? 'bg-[#2a2a2a]/60 text-gray-300 hover:bg-[#3a3a3a]/80 shadow-lg border border-[#3a3a3a] hover:border-blue-400/40' 
                              : 'bg-white/60 text-gray-700 hover:bg-white/80 shadow-[0_2px_8px_0_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.15)]'
                      }`} 
                      onClick={() => {
                        router.push(item.route);
                        setShowMobileMenu(false);
                      }}
                    >
                      <div className={`p-2 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? isDark 
                            ? 'bg-blue-400/30 shadow-lg border border-blue-300/30' 
                            : 'bg-blue-100 shadow-[inset_0_1px_3px_0_rgba(59,130,246,0.2)]'
                          : isOffer
                            ? isDark
                              ? 'bg-orange-400/30 shadow-lg border border-orange-300/30'
                              : 'bg-orange-100 shadow-[inset_0_1px_3px_0_rgba(251,146,60,0.2)]'
                            : isDark 
                              ? 'bg-[#3a3a3a]/60 shadow-lg border border-[#3a3a3a]' 
                              : 'bg-white/70 shadow-[0_1px_4px_0_rgba(0,0,0,0.1)]'
                      }`}>
                        <IconComponent size={18} className={
                          isActive 
                            ? isDark ? 'text-blue-300' : 'text-blue-700'
                            : isOffer
                              ? isDark ? 'text-orange-300' : 'text-orange-700'
                              : isDark ? 'text-gray-300' : 'text-gray-600'
                        } />
                      </div>
                      <span className={`text-xs font-medium ${
                        isActive 
                          ? isDark ? 'text-blue-300' : 'text-blue-700'
                          : isOffer
                            ? isDark ? 'text-orange-300' : 'text-orange-700'
                            : isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {item.title}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Logout Button */}
              <button 
                className={`w-full flex items-center justify-center space-x-3 px-4 py-3 text-red-400 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 ${
                  isDark 
                    ? 'bg-[#2a2a2a]/60 hover:bg-red-900/40 shadow-lg border border-[#3a3a3a] hover:border-red-400/40' 
                    : 'bg-white/60 hover:bg-red-50 shadow-[0_2px_8px_0_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.15)]'
                }`} 
                onClick={() => {
                  handleLogout();
                  setShowMobileMenu(false);
                }}
              >
                <div className={`p-2 rounded-xl transition-all duration-200 ${
                  isDark 
                    ? 'bg-[#3a3a3a]/60 shadow-lg border border-[#3a3a3a]' 
                    : 'bg-white/70 shadow-[0_1px_4px_0_rgba(0,0,0,0.1)]'
                }`}>
                  <LogOut size={16} className="text-red-400" />
                </div>
                <span className="text-sm font-medium text-red-400">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNavigationBar;