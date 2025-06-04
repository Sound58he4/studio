// src/components/layout/BottomNavigationBar.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Activity, Users, LayoutGrid, LogOut, BarChart2, Bot, ListChecks, ClipboardList, User, History as HistoryIcon, Settings, LayoutDashboard, Star, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from "@/components/ui/scroll-area";

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
        <nav className="bg-background px-2 py-2 relative">
            <div className="flex justify-around items-center max-w-md mx-auto">
                {/* Show first 4 nav items directly */}
                {mainBottomNavItems.map(({ href, label, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className={cn(
                            "flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all duration-200 min-w-0 touch-manipulation",
                            pathname === href 
                                ? "text-primary bg-primary/10" 
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        <Icon size={18} className="flex-shrink-0" />
                        <span className="text-xs font-medium truncate max-w-[60px]">{label}</span>
                    </Link>
                ))}

                {/* More menu sheet */}
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            className={cn(
                                "flex flex-col items-center gap-1 px-2 py-1 h-auto touch-manipulation",
                                isSheetOpen ? "text-primary bg-primary/10" : "text-muted-foreground"
                            )}
                        >
                            <MoreHorizontal size={18} />
                            <span className="text-xs font-medium">More</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[80vh] p-0">
                        <div className="p-4 border-b">
                            <h2 className="text-lg font-semibold">Navigation Menu</h2>
                        </div>
                        <ScrollArea className="flex-1 p-4">
                            <div className="grid grid-cols-2 gap-3">
                                {finalMoreLinks.map(({ href, label, icon: Icon }) => (
                                    <Link
                                        key={href}
                                        href={href}
                                        onClick={() => setIsSheetOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg transition-all duration-200 touch-manipulation",
                                            pathname === href 
                                                ? "text-primary bg-primary/10 border border-primary/20" 
                                                : "text-foreground hover:bg-muted border border-transparent"
                                        )}
                                    >
                                        <Icon size={20} className="flex-shrink-0" />
                                        <span className="font-medium">{label}</span>
                                    </Link>
                                ))}
                            </div>
                            
                            <div className="mt-6 pt-4 border-t">
                                <Button
                                    onClick={() => {
                                        handleLogout();
                                        setIsSheetOpen(false);
                                    }}
                                    variant="destructive"
                                    className="w-full flex items-center gap-2 touch-manipulation"
                                >
                                    <LogOut size={18} />
                                    Sign Out
                                </Button>
                            </div>
                        </ScrollArea>
                    </SheetContent>
                </Sheet>
            </div>
        </nav>
    );
};

export default BottomNavigationBar;
