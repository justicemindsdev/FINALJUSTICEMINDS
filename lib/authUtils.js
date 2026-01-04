'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// Custom hook to get and monitor auth state
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user data from localStorage
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const accessToken = localStorage.getItem('access_token');
        
        if (storedUser && accessToken) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for storage changes
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { user, loading };
};

// HOC to protect components
export function withAuth(Component) {
  return function ProtectedComponent(props) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        // Clear any stale data
        localStorage.clear();
        router.replace('/auth/login');
      }
    }, [user, loading, router]);

    // Show nothing while loading
    if (loading) return null;

    // If not authenticated, don't show the component
    if (!user) return null;

    // If authenticated, render the component
    return <Component {...props} user={user} />;
  };
}

// Helper to check if user is authenticated
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  
  const user = localStorage.getItem('user');
  const accessToken = localStorage.getItem('access_token');
  return !!(user && accessToken);
};

// Constants for route types
export const ROUTE_TYPES = {
  PUBLIC: 'public',      // Accessible by anyone
  PROTECTED: 'protected', // Requires authentication
  AUTH: 'auth'           // Only for non-authenticated users (like login page)
};

// Route protection configuration
export const routeConfig = {
  '/': { type: ROUTE_TYPES.PUBLIC },
  '/auth/login': { type: ROUTE_TYPES.AUTH },
  '/dashboard': { type: ROUTE_TYPES.PROTECTED },
  '/caseworks': { type: ROUTE_TYPES.PROTECTED },
  '/journalists': { type: ROUTE_TYPES.PROTECTED },
  '/terminal-chat': { type: ROUTE_TYPES.PROTECTED },
  '/share': { type: ROUTE_TYPES.PUBLIC },  // Public - accessible via shared links
  '/share/manage': { type: ROUTE_TYPES.PROTECTED },
  '/share/groups': { type: ROUTE_TYPES.PROTECTED },
  // Add more routes as needed
};
