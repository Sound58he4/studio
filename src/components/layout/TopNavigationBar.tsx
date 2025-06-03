// src/components/layout/TopNavigationBar.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Activity, 
  LayoutDashboard, 
  ClipboardList, 
  Bot, 
  User, 
  Settings, 
  LogOut, 
  MoreHorizontal,
  ListChecks,
  Users,
  Star,
  BarChart2,
  History as HistoryIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface NavLink {
    href: string;
    label: string;
    icon: React.ElementType;
}

interface TopNavigationBarProps {
    navLinks: NavLink[];
    handleLogout: () => void;
    pathname: string;
}

const TopNavigationBar: React.FC<TopNavigationBarProps> = ({ navLinks, handleLogout, pathname }) => {
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);    // Check if device is mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Don't render anything on mobile screens
    if (isMobile) {
        return null;
    }    // Primary navigation items (shown directly in navbar)
    const primaryNavItems = [
        { href: "/dashboard", label: "Dashboard", icon: Activity },
        { href: "/overview", label: "Overview", icon: LayoutDashboard },
        { href: "/ai-assistant", label: "AI Assistant", icon: Bot },
        { href: "/profile", label: "Profile", icon: User },
        { href: "/quick-log", label: "Quick Log", icon: ListChecks },
        { href: "/workout-plans", label: "Workout Plans", icon: ClipboardList },
        { href: "/points", label: "Your Points", icon: Star },
    ];    // Secondary navigation items (shown in dropdown)
    const secondaryNavItems = navLinks.filter(
        link => !primaryNavItems.some(primaryLink => primaryLink.href === link.href) && link.href !== "/settings" && link.href !== "/log"
    );

    const settingsItem = navLinks.find(link => link.href === "/settings");

    const checkIsActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard';
        }
        if (href === '/overview') {
            return pathname === '/overview';
        }
        return pathname === href || (pathname.startsWith(href) && href !== '/dashboard' && href !== '/overview');
    };

    return (
        <nav className="hidden md:flex items-center gap-2 lg:gap-3">
            {/* Primary Navigation Items */}
            <motion.div 
                className="flex items-center gap-1 lg:gap-2"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                    delay: 0.3,
                    staggerChildren: 0.1,
                    delayChildren: 0.4
                }}
            >
                {primaryNavItems.map((link, index) => {
                    const isActive = checkIsActive(link.href);

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
                                        "min-w-0 px-3 lg:px-4",
                                        isActive ? "text-primary font-semibold bg-primary/10" : "hover:bg-accent/50 hover:text-accent-foreground",
                                        "transform hover:scale-105"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5"
                                            layoutId="activeTopTab"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <motion.div className="flex items-center relative z-10 gap-1.5 lg:gap-2">
                                        <motion.div
                                            whileHover={{ 
                                                scale: 1.1,
                                                rotate: -3,
                                                transition: { type: "spring", stiffness: 400 }
                                            }}
                                        >
                                            <link.icon className="h-4 w-4 flex-shrink-0" />
                                        </motion.div>
                                        <span className="hidden lg:inline whitespace-nowrap">{link.label}</span>
                                        <span className="lg:hidden whitespace-nowrap text-xs">{link.label.split(' ')[0]}</span>
                                    </motion.div>
                                </Button>
                            </Link>
                        </motion.div>
                    )
                })}
            </motion.div>

            {/* More Menu Dropdown */}
            <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <DropdownMenu open={isMoreMenuOpen} onOpenChange={setIsMoreMenuOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="sm"
                            className={cn(
                                "text-sm font-medium transition-all duration-200 ease-out group relative overflow-hidden",
                                "min-w-0 px-3 lg:px-4",
                                "hover:bg-accent/50 hover:text-accent-foreground transform hover:scale-105"
                            )}
                        >
                            <motion.div className="flex items-center relative z-10 gap-1.5 lg:gap-2">
                                <motion.div
                                    animate={{ rotate: isMoreMenuOpen ? 90 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    whileHover={{ 
                                        scale: 1.1,
                                        transition: { type: "spring", stiffness: 400 }
                                    }}
                                >
                                    <MoreHorizontal className="h-4 w-4 flex-shrink-0" />
                                </motion.div>
                                <span className="hidden lg:inline whitespace-nowrap">More</span>
                            </motion.div>
                        </Button>
                    </DropdownMenuTrigger>
                    
                    <DropdownMenuContent 
                        align="end" 
                        className="w-56 bg-card/95 backdrop-blur-lg border shadow-lg"
                        sideOffset={5}
                    >                        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                            Additional Options
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        {secondaryNavItems.map((link, index) => {
                            const isActive = checkIsActive(link.href);
                            return (
                                <motion.div
                                    key={link.href}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (index + 1) * 0.05 }}
                                >
                                    <DropdownMenuItem asChild>
                                        <Link href={link.href} className="w-full">
                                            <motion.div 
                                                className={cn(
                                                    "flex items-center w-full transition-all duration-200",
                                                    isActive ? "text-primary font-semibold" : "text-foreground"
                                                )}
                                                whileHover={{ x: 4 }}
                                            >
                                                <motion.div
                                                    whileHover={{ 
                                                        scale: 1.1,
                                                        rotate: -3,
                                                        transition: { type: "spring", stiffness: 400 }
                                                    }}
                                                >
                                                    <link.icon className="mr-3 h-4 w-4" />
                                                </motion.div>
                                                {link.label}
                                            </motion.div>
                                        </Link>
                                    </DropdownMenuItem>
                                </motion.div>
                            );
                        })}
                        
                        <DropdownMenuSeparator />
                        
                        {/* Settings Item */}
                        {settingsItem && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: secondaryNavItems.length * 0.05 + 0.1 }}
                            >
                                <DropdownMenuItem asChild>
                                    <Link href={settingsItem.href} className="w-full">
                                        <motion.div 
                                            className={cn(
                                                "flex items-center w-full transition-all duration-200",
                                                checkIsActive(settingsItem.href) ? "text-primary font-semibold" : "text-foreground"
                                            )}
                                            whileHover={{ x: 4 }}
                                        >
                                            <motion.div
                                                whileHover={{ 
                                                    scale: 1.1,
                                                    rotate: -3,
                                                    transition: { type: "spring", stiffness: 400 }
                                                }}
                                            >
                                                <Settings className="mr-3 h-4 w-4" />
                                            </motion.div>
                                            Settings
                                        </motion.div>
                                    </Link>
                                </DropdownMenuItem>
                            </motion.div>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        {/* Logout Item */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (secondaryNavItems.length + 1) * 0.05 + 0.2 }}
                        >
                            <DropdownMenuItem onClick={handleLogout}>
                                <motion.div 
                                    className="flex items-center w-full text-destructive transition-all duration-200"
                                    whileHover={{ x: 4 }}
                                >
                                    <motion.div
                                        whileHover={{ 
                                            scale: 1.1,
                                            rotate: -3,
                                            transition: { type: "spring", stiffness: 400 }
                                        }}
                                    >
                                        <LogOut className="mr-3 h-4 w-4" />
                                    </motion.div>
                                    Logout
                                </motion.div>
                            </DropdownMenuItem>
                        </motion.div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </motion.div>
        </nav>
    );
};

export default TopNavigationBar;
