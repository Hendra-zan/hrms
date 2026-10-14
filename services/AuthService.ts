/**
 * AUTH SERVICE
 * Abstraction layer for authentication operations
 * Encapsulates all interactions with configured Supabase Auth endpoint
 * Single source of truth for login/logout/session logic
 */

import { authSupabase } from './authSupabaseClient';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
  };
  accessToken?: string;
  refreshToken?: string;
}

class AuthService {
  /**
   * Cleans all auth session data from browser storage.
   */
  private clearLocalSessionStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem('hrms-auth-session');
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('auth') || key.includes('token') || key.includes('session'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => window.localStorage.removeItem(k));
      } catch (e) {
        console.warn('[AuthService] Could not clear localStorage:', e);
      }
    }
  }

  /**
   * Login user dengan email dan password
   * @param credentials Email dan password
   * @returns Auth response dengan token atau error
   */
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await authSupabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        user: data.user
          ? {
              id: data.user.id,
              email: data.user.email || '',
            }
          : undefined,
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Login failed',
      };
    }
  }

  /**
   * Logout user and cleanly purge local storage.
   * Handles 403 Forbidden / session_not_found gracefully when session is already gone on server.
   */
  async logout(): Promise<AuthResponse> {
    try {
      // 1. Immediately wipe local auth storage so client state is guaranteed logged out
      this.clearLocalSessionStorage();

      // 2. Request GoTrue server to invalidate session
      const { error } = await authSupabase.auth.signOut({ scope: 'local' });

      if (error) {
        const message = String(error.message || '').toLowerCase();
        // If session was already expired or deleted from DB (403 session_not_found), treat as clean success
        if (
          message.includes('403') ||
          message.includes('forbidden') ||
          message.includes('session_not_found') ||
          message.includes('not found')
        ) {
          return { success: true };
        }
        // Still treat logout as success locally
        return { success: true };
      }

      return {
        success: true,
      };
    } catch (error: any) {
      this.clearLocalSessionStorage();
      return {
        success: true,
      };
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    try {
      const { data, error } = await authSupabase.auth.getSession();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        session: data.session,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string, redirectUrl?: string): Promise<AuthResponse> {
    try {
      const { error } = await authSupabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl || `${window.location.origin}/reset-password`,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<AuthResponse> {
    try {
      const { error } = await authSupabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (event: any, session: any) => void) {
    return authSupabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
}

// Export singleton instance
export const authService = new AuthService();
