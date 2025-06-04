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
                className="flex justify-around items-center h-14 relative"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
                {/* Animated background glow */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-primary/3 to-transparent opacity-0"
                    animate={{ opacity: [0, 0.2, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {mainBottomNavItems.map((item, index) => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href) && !['/dashboard', '/overview'].includes(item.href) && pathname.startsWith(item.href));

                    return (
                        <motion.div
                            key={item.href}
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative"
                        >
                            <Link href={item.href}>
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "flex flex-col items-center justify-center h-full w-full rounded-none p-0.5 group relative overflow-hidden",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )}
                                    aria-current={isActive ? "page" : undefined}
                                >
                                    {/* Active indicator */}
                                    <AnimatePresence>
                                        {isActive && (
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/3"
                                                layoutId="bottomNavActive"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                    </AnimatePresence>
                                    
                                    <div className="relative z-10 flex flex-col items-center">
                                        <item.icon className="h-4 w-4 mb-0.5" />
                                        <span className="text-[10px] font-medium leading-none">{item.label}</span>
                                    </div>
                                </Button>
                            </Link>
                        </motion.div>
                    );
                })}
                
                {/* More Menu Button */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex flex-col items-center justify-center h-full w-full rounded-none p-0.5 text-muted-foreground group relative overflow-hidden"
                            >
                                <div className="relative z-10 flex flex-col items-center">
                                    <motion.div
                                        animate={{ rotate: isSheetOpen ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <LayoutGrid className="h-4 w-4 mb-0.5" />
                                    </motion.div>
                                    <span className="text-[10px] font-medium leading-none">More</span>
                                </div>
                            </Button>
                        </SheetTrigger>
                        
                        <SheetContent side="bottom" className="h-auto max-h-[60vh] rounded-t-lg p-0 flex flex-col bg-card/95 backdrop-blur-lg">
                            <SheetHeader className="p-3 border-b">
                                <SheetTitle className="text-sm font-semibold text-center">More</SheetTitle>
                            </SheetHeader>
                            
                            <motion.div 
                                className="flex-grow overflow-y-auto p-3 space-y-1"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                {finalMoreLinks.map((link, index) => {
                                    const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/dashboard');
                                    return (
                                        <motion.div
                                            key={link.href}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                        >
                                            <Link href={link.href}>
                                                <Button
                                                    variant={isActive ? "secondary" : "ghost"}
                                                    className={cn(
                                                        "w-full justify-start text-sm py-2 px-3 rounded-md",
                                                        isActive ? "text-primary font-medium" : "hover:bg-accent/50"
                                                    )}
                                                    onClick={handleMoreLinkClick}
                                                >
                                                    <link.icon className="mr-2 h-4 w-4" />
                                                    {link.label}
                                                </Button>
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                            
                            <div className="p-3 border-t">
                                <Button 
                                    variant="ghost" 
                                    onClick={() => { handleLogout(); handleMoreLinkClick(); }} 
                                    className="w-full justify-start text-sm text-destructive hover:bg-destructive/10 hover:text-destructive py-2 px-3 rounded-md"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </motion.div>
            </motion.div>
        </nav>
    );
};

export default BottomNavigationBar;