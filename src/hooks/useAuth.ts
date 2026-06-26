import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Consumer-facing auth hook. Reads the current user / initializing state from
 * the global store and exposes the sign-in/out actions. Requires
 * useAuthListener() to be mounted at the root to keep state in sync.
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const initializing = useAuthStore((state) => state.initializing);

  return {
    user,
    initializing,
    isAuthenticated: user !== null,
    signInWithGoogle: authService.signInWithGoogle,
    signInAnonymously: authService.signInAnonymously,
    signOut: authService.signOut,
  };
}
