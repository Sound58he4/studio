// src/components/layout/BottomNavigationBar.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Activity, Users, LayoutGrid, LogOut, BarChart2, Bot, ListChecks, ClipboardList, User, History as HistoryIcon, Settings, LayoutDashboard, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface NavLink {
    href: string;
    label: string;
    icon: React.ElementType;
}

interface BottomNavigationBarProps {
    navLinks: NavLink[];
    handleLogout: () => void;
    isSheetOpen: boolean;
    setIsSheetOpen: (isOpen: boolean) => void;
}

const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({ navLinks, handleLogout, isSheetOpen, setIsSheetOpen }) => {
    const pathname = usePathname();

    const mainBottomNavItems = [
        { href: "/dashboard", label: "Dashboard", icon: Activity },
        { href: "/overview", label: "Overview", icon: LayoutDashboard },
        { href: "/ai-assistant", label: "AI Chat", icon: Bot },
        { href: "/quick-log", label: "Quick Log", icon: ListChecks },
    ];

    const moreSheetLinks = navLinks.filter(
        link => !mainBottomNavItems.some(mainLink => mainLink.href === link.href)
    );

    // Ensure Log Food and Workout Plans appear in the More menu
    const logFoodLink = navLinks.find(link => link.href === "/log");
    const workoutPlansLink = navLinks.find(link => link.href === "/workout-plans");
    
    // Create prioritized list with Log Food and Workout Plans at the top
    const priorityLinks = [
        logFoodLink,
        workoutPlansLink
    ].filter(Boolean); // Remove undefined values
    
    const finalMoreLinks = [
        ...priorityLinks,
        ...moreSheetLinks.filter(link => 
            link.href !== "/log" && link.href !== "/workout-plans"
        )
    ];

    const handleMoreLinkClick = () => {
        setIsSheetOpen(false);
    };

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border shadow-top-md z-50">
            <motion.div 
                className="flex justify-around items-center h-16 relative"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    staggerChildren: 0.1,
                    delayChildren: 0.1
                }}
            >
                {/* Animated background glow */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0"
                    animate={{ opacity: [0, 0.3, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {mainBottomNavItems.map((item, index) => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href) && !['/dashboard', '/overview'].includes(item.href) && pathname.startsWith(item.href));
                     // More specific active check for dashboard and overview
                     if (item.href === '/dashboard' && pathname !== '/dashboard' && pathname !== '/overview') {
                        // isActive = false;
                     }
                     if (item.href === '/overview' && pathname !== '/overview') {
                        // isActive = false;
                     }

                    return (
                        <motion.div
                            key={item.href}
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ 
                                delay: index * 0.1,
                                type: "spring",
                                stiffness: 300,
                                damping: 25
                            }}
                            whileTap={{ scale: 0.9 }}
                            className="relative"
                        >
                            <Link href={item.href}>
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "flex flex-col items-center justify-center h-full w-full rounded-none p-1 group relative overflow-hidden",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )}
                                    aria-current={isActive ? "page" : undefined}
                                >
                                    {/* Active indicator */}
                                    <AnimatePresence>
                                        {isActive && (
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-br from-primary/15 to-primary/5"
                                                layoutId="bottomNavActive"
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0, opacity: 0 }}
                                                transition={{ 
                                                    type: "spring",
                                                    stiffness: 300,
                                                    damping: 30
                                                }}
                                            />
                                        )}
                                    </AnimatePresence>
                                    
                                    <motion.div className="relative z-10 flex flex-col items-center">
                                        <motion.div
                                            animate={isActive ? { 
                                                scale: [1, 1.2, 1],
                                                rotate: [0, 10, 0]
                                            } : {}}
                                            transition={{ 
                                                duration: 0.6,
                                                ease: "easeInOut"
                                            }}
                                            whileHover={{ scale: 1.1 }}
                                        >
                                            <item.icon className="h-5 w-5 mb-0.5 transition-transform duration-200 ease-out" />
                                        </motion.div>
                                        <span className="text-xs font-medium">{item.label}</span>
                                    </motion.div>
                                    
                                    {/* Ripple effect on tap */}
                                    <motion.div
                                        className="absolute inset-0 bg-primary/20"
                                        initial={{ scale: 0, opacity: 0 }}
                                        whileTap={{ 
                                            scale: 1.5,
                                            opacity: [0, 1, 0],
                                            transition: { duration: 0.3 }
                                        }}
                                    />
                                </Button>
                            </Link>
                        </motion.div>
                    );
                })}
                
                {/* More Menu Button */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ 
                        delay: 0.4,
                        type: "spring",
                        stiffness: 300,
                        damping: 25
                    }}
                    whileTap={{ scale: 0.9 }}
                >
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex flex-col items-center justify-center h-full w-full rounded-none p-1 text-muted-foreground group relative overflow-hidden"
                            >
                                <motion.div className="relative z-10 flex flex-col items-center">
                                    <motion.div
                                        animate={{ rotate: isSheetOpen ? 180 : 0 }}
                                        transition={{ duration: 0.3 }}
                                        whileHover={{ scale: 1.1 }}
                                    >
                                        <LayoutGrid className="h-5 w-5 mb-0.5 transition-transform duration-200 ease-out" />
                                    </motion.div>
                                    <span className="text-xs font-medium">More</span>
                                </motion.div>
                                
                                {/* Ripple effect */}
                                <motion.div
                                    className="absolute inset-0 bg-primary/20"
                                    initial={{ scale: 0, opacity: 0 }}
                                    whileTap={{ 
                                        scale: 1.5,
                                        opacity: [0, 1, 0],
                                        transition: { duration: 0.3 }
                                    }}
                                />
                            </Button>
                        </SheetTrigger>
                        
                        <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-xl p-0 flex flex-col bg-card/95 backdrop-blur-lg">
                            <SheetHeader className="p-4 border-b">
                                <SheetTitle className="text-base font-semibold text-center">More Options</SheetTitle>
                            </SheetHeader>
                            
                            <motion.div 
                                className="flex-grow overflow-y-auto p-4 space-y-2"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ 
                                    staggerChildren: 0.05,
                                    delayChildren: 0.1
                                }}
                            >
                                {finalMoreLinks.map((link, index) => {
                                    const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/dashboard');
                                    return (
                                        <motion.div
                                            key={link.href}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <Link href={link.href}>
                                                <Button
                                                    variant={isActive ? "secondary" : "ghost"}
                                                    className={cn(
                                                        "w-full justify-start text-sm font-medium py-2.5 px-3 rounded-md group relative overflow-hidden",
                                                        isActive ? "text-primary font-semibold" : "hover:bg-accent/50"
                                                    )}
                                                    onClick={handleMoreLinkClick}
                                                >
                                                    <motion.div className="flex items-center relative z-10">
                                                        <motion.div
                                                            whileHover={{ 
                                                                scale: 1.1,
                                                                rotate: -3,
                                                                transition: { type: "spring", stiffness: 400 }
                                                            }}
                                                        >
                                                            <link.icon className="mr-2 h-4 w-4" />
                                                        </motion.div>
                                                        {link.label}
                                                    </motion.div>
                                                </Button>
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                            
                            <div className="p-4 border-t">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => { handleLogout(); handleMoreLinkClick(); }} 
                                        className="w-full justify-start text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive py-2.5 px-3 rounded-md group relative overflow-hidden"
                                    >
                                        <motion.div className="flex items-center relative z-10">
                                            <motion.div
                                                whileHover={{ 
                                                    scale: 1.1,
                                                    rotate: -3,
                                                    transition: { type: "spring", stiffness: 400 }
                                                }}
                                            >
                                                <LogOut className="mr-2 h-4 w-4" />
                                            </motion.div>
                                            Logout
                                        </motion.div>
                                    </Button>
                                </motion.div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </motion.div>
            </motion.div>
        </nav>
    );
};

export default BottomNavigationBar;
