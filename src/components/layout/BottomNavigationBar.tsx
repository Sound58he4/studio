// src/components/layout/BottomNavigationBar.tsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  MoreHorizontal
} from 'lucide-react';

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

const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
  navLinks,
  handleLogout,
  isSheetOpen,
  setIsSheetOpen
}) => {
  const pathname = usePathname();
  
  // Primary navigation items (most used) - reduced to 4 items
  const primaryNavItems = [
    navLinks.find(link => link.href === '/dashboard'),
    navLinks.find(link => link.href === '/overview'),
    navLinks.find(link => link.href === '/ai-assistant'),
    navLinks.find(link => link.href === '/quick-log'),
  ].filter(Boolean) as NavLink[];

  // Secondary navigation items (for the sheet)
  const secondaryNavItems = navLinks.filter(link => 
    !primaryNavItems.some(primary => primary.href === link.href)
  );

  const isActive = (href: string) => pathname === href;

  return (
    <div className="w-full">
      {/* Ultra Compact Primary Navigation */}
      <div className="flex items-center justify-around px-0.5 py-1">
        {primaryNavItems.map((item, index) => (
          <motion.div
            key={item.href}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex-1"
          >
            <Link href={item.href} className="block">
              <motion.div
                className={cn(
                  "relative flex flex-col items-center gap-0.5 p-1 rounded-md transition-all duration-200",
                  isActive(item.href)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                whileTap={{ scale: 0.95 }}
              >
                {/* Compact active indicator */}
                <AnimatePresence>
                  {isActive(item.href) && (
                    <motion.div
                      className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-3 h-0.5 bg-primary rounded-full"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>

                <motion.div
                  animate={isActive(item.href) ? { scale: 1.05 } : { scale: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  <item.icon size={16} />
                </motion.div>
                
                <span 
                  className={cn(
                    "text-[9px] font-medium transition-opacity duration-150 leading-tight",
                    isActive(item.href) ? "opacity-100" : "opacity-60"
                  )}
                >
                  {item.label}
                </span>

                {/* Compact background for active item */}
                <AnimatePresence>
                  {isActive(item.href) && (
                    <motion.div
                      className="absolute inset-0 bg-primary/10 rounded-md -z-10"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          </motion.div>
        ))}

        {/* Compact More Menu Trigger */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1"
        >
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <motion.button
                className="w-full flex flex-col items-center gap-0.5 p-1 rounded-md text-muted-foreground hover:text-foreground transition-all duration-200"
                whileTap={{ scale: 0.95 }}
              >
                <Menu size={16} />
                <span className="text-[9px] font-medium opacity-60 leading-tight">More</span>
              </motion.button>
            </SheetTrigger>
            
            <SheetContent 
              side="bottom" 
              className="h-[65vh] rounded-t-lg border-t bg-background/95 backdrop-blur-xl border-border shadow-2xl"
            >
              <SheetHeader className="pb-2">
                <SheetTitle className="text-left text-base font-semibold text-foreground">
                  Menu
                </SheetTitle>
              </SheetHeader>
              
              <div className="space-y-0.5 max-h-[50vh] overflow-y-auto">
                {secondaryNavItems.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Link 
                      href={item.href} 
                      onClick={() => setIsSheetOpen(false)}
                      className="block"
                    >
                      <motion.div
                        className={cn(
                          "flex items-center gap-2.5 p-2.5 rounded-md transition-all duration-150 border",
                          isActive(item.href)
                            ? "bg-primary/15 text-primary border-primary/30"
                            : "hover:bg-muted/70 text-foreground border-transparent hover:border-border"
                        )}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={cn(
                          "p-1 rounded-sm",
                          isActive(item.href)
                            ? "bg-primary/25 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}>
                          <item.icon size={14} />
                        </div>
                        
                        <span className="font-medium text-sm">{item.label}</span>
                        
                        {isActive(item.href) && (
                          <motion.div
                            className="w-1 h-1 bg-primary rounded-full ml-auto"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.15 }}
                          />
                        )}
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
                
                {/* Compact Logout Button */}
                <motion.div
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: secondaryNavItems.length * 0.03 + 0.05 }}
                  className="pt-2 border-t border-border mt-2"
                >
                  <motion.button
                    onClick={() => {
                      setIsSheetOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-md text-destructive hover:bg-destructive/15 transition-all duration-150 border border-transparent hover:border-destructive/30"
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="p-1 rounded-sm bg-destructive/25 text-destructive">
                      <LogOut size={14} />
                    </div>
                    <span className="font-medium text-sm">Logout</span>
                  </motion.button>
                </motion.div>
              </div>
            </SheetContent>
          </Sheet>
        </motion.div>
      </div>
    </div>
  );
};

export default BottomNavigationBar;