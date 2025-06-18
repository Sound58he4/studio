import { LucideIcon } from 'lucide-react';
import React from 'react';

export interface NavigationItem {
  title: string;
  icon: LucideIcon;
  route: string;
  badge?: {
    text: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  };
}

export interface MenuItem {
  title: string;
  icon: React.ComponentType<any>;
  route: string;
}
