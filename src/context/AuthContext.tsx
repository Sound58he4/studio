"use client";

import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo } from 'react';
import { onAuthStateChanged, type User } from '@/lib/firebase/exports';
import { auth } from '@/lib/firebase/exports';
import { Loader2 } from 'lucide-react';
import { usePerformanceMonitor } from '@/hooks/use-performance';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userId: string | null; // Explicitly add userId
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  const { measureRender } = usePerformanceMonitor('AuthProvider');

  // Memoized auth value to prevent unnecessary re-renders
  const authValue = useMemo(() => ({
    user,
    userId,
    loading
  }), [user, userId, loading]);

  useEffect(() => {
    console.log("[AuthContext] Setting up auth state listener...");
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        console.log("[AuthContext] User logged in:", currentUser.uid);
        setUser(currentUser);
        setUserId(currentUser.uid); // Set userId state
      } else {
        console.log("[AuthContext] User logged out.");
        setUser(null);
        setUserId(null); // Clear userId state
      }
      setLoading(false);
      console.log("[AuthContext] Auth state listener finished processing. Loading:", false);
    }, (error) => {
        console.error("[AuthContext] Auth state listener error:", error);
        setUser(null);
        setUserId(null);
        setLoading(false); // Ensure loading is false even on error
    });

    // Cleanup subscription on unmount
    return () => {
        console.log("[AuthContext] Cleaning up auth state listener.");
        unsubscribe();
    }
  }, []);

  // Show a loading indicator while checking auth state
  if (loading) {
    return (
        <div className="flex justify-center items-center min-h-screen p-4 bg-gradient-to-br from-background via-muted to-background">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
             <span className="ml-3 text-muted-foreground">Checking authentication...</span>
        </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, userId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
