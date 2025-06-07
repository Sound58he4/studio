import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/exports';

export interface ErrorLogEntry {
  errorType: 'ACCESS_DENIED' | 'AUTHENTICATION_FAILED' | 'CRITICAL_ERROR' | 'NAVIGATION_ERROR';
  message: string;
  userAgent?: string;
  url?: string;
  userId?: string | null;
  timestamp: any;
  additionalContext?: Record<string, any>;
}

export const logErrorToServer = async (errorData: Omit<ErrorLogEntry, 'timestamp'>): Promise<void> => {
  try {
    const errorId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const errorLogRef = doc(db, 'errorLogs', errorId);
    
    const logEntry: ErrorLogEntry = {
      ...errorData,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      timestamp: serverTimestamp(),
    };

    await setDoc(errorLogRef, logEntry);
    console.log(`[ErrorLogging] Error logged to server with ID: ${errorId}`);
  } catch (error) {
    console.error('[ErrorLogging] Failed to log error to server:', error);
    // Don't throw here to avoid infinite error loops
  }
};

export const clearAuthCookies = (): void => {
  if (typeof window === 'undefined') return;

  try {
    // Clear all cookies related to authentication
    const cookiesToClear = [
      'auth-token',
      'session-token', 
      'user-session',
      'firebase-auth',
      '__session',
      'next-auth.session-token',
      'next-auth.callback-url',
      'next-auth.csrf-token',
      'isLoggedIn', // Add isLoggedIn cookie to clear list
    ];

    cookiesToClear.forEach(cookieName => {
      // Clear cookie for current domain
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      // Clear cookie for subdomain
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
      // Clear cookie without domain
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();

    // Explicitly set isLoggedIn to false in all storage types
    localStorage.setItem('isLoggedIn', 'false');
    sessionStorage.setItem('isLoggedIn', 'false');
    
    // Also set isLoggedIn cookie to false as backup
    document.cookie = `isLoggedIn=false; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `isLoggedIn=false; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    document.cookie = `isLoggedIn=false; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;

    console.log('[ErrorLogging] Authentication cookies, storage cleared, and isLoggedIn explicitly set to false');
  } catch (error) {
    console.error('[ErrorLogging] Failed to clear auth cookies:', error);
  }
};

export const handleImmediateAccessDeniedRedirect = (): void => {
  if (typeof window === 'undefined') return;

  try {
    // Immediately navigate to authorize page
    window.location.href = '/authorize';
    
    // Refresh the page after 0.1 second as backup
    setTimeout(() => {
      window.location.reload();
    }, 100);
  } catch (error) {
    console.error('[ErrorLogging] Failed to redirect on access denied:', error);
    // Fallback: force page reload
    window.location.reload();
  }
};

export const logAccessDeniedError = async (userId: string | null, reason: string, additionalContext?: Record<string, any>): Promise<void> => {
  // Immediately clear auth cookies when access is denied
  clearAuthCookies();
  
  // Trigger immediate navigation and refresh
  handleImmediateAccessDeniedRedirect();
  
  // Log to server (this will happen in background during navigation)
  await logErrorToServer({
    errorType: 'ACCESS_DENIED',
    message: `Access denied: ${reason}`,
    userId,
    additionalContext: {
      ...additionalContext,
      authLoadingState: additionalContext?.authLoading,
      hasUserId: !!userId,
      reason,
      cookiesCleared: true,
      clearedAt: new Date().toISOString(),
      immediateRedirect: true,
    },
  });
};
