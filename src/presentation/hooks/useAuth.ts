import { useState, useEffect, useCallback } from 'react';
import { authService } from '../../infrastructure/auth/authService';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    } catch (error) {
      setUser(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [refreshUser]);

  return { user, loading, refreshUser };
};