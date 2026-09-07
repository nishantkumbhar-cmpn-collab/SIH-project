import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { demoCitizens } from '@/lib/mockApi/seedData';
import type { DemoCitizen } from '@/lib/types';

interface AuthState {
  citizen: DemoCitizen | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<DemoCitizen>;
  logout: () => void;
  loginAsDemo: (citizenId: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'govsync-citizen';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      try {
        const citizen = JSON.parse(stored) as DemoCitizen;
        return { citizen, loading: false, error: null };
      } catch {
        return { citizen: null, loading: false, error: null };
      }
    }
    return { citizen: null, loading: false, error: null };
  });

  const login = useCallback(async (email: string, password: string): Promise<DemoCitizen> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    await new Promise((resolve) => setTimeout(resolve, 500));

    const citizen = demoCitizens.find(
      (c) => c.email.toLowerCase() === email.toLowerCase() && c.password === password,
    );

    if (!citizen) {
      setState({ citizen: null, loading: false, error: 'Invalid email or password. Try a demo account below.' });
      throw new Error('Invalid credentials');
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(citizen));
    setState({ citizen, loading: false, error: null });
    return citizen;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setState({ citizen: null, loading: false, error: null });
  }, []);

  const loginAsDemo = useCallback((citizenId: string) => {
    const citizen = demoCitizens.find((c) => c.id === citizenId);
    if (citizen) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(citizen));
      setState({ citizen, loading: false, error: null });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, loginAsDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
