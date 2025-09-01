// src/context/AuthContext.tsx
// Enhanced version of your working approach
import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";
import { loginSchema, signupSchema } from "../types/auth.types";
import type { LoginData, SignupData } from "../types/auth.types";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (credentials: LoginData) => Promise<void>;
  signUp: (userData: SignupData) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (credentials: LoginData) => {
    const validCredentials = loginSchema.parse(credentials);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: validCredentials.email,
      password: validCredentials.password,
    });
    
    if (error) throw error;
  };

  const signUp = async (userData: SignupData) => {
    const validUserData = signupSchema.parse(userData);
    
    const { error } = await supabase.auth.signUp({
      email: validUserData.email,
      password: validUserData.password,
      options: {
        data: {
          full_name: validUserData.fullName || '',
        }
      }
    });
    
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};