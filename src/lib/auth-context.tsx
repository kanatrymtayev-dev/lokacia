"use client";

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import { supabase } from "./supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  phone_verified: boolean;
  id_verified: boolean;
  role: "host" | "renter";
  avatar_url: string | null;
  onboarding_completed: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: "host" | "renter";
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchProfile(supabaseUser: SupabaseUser): Promise<User | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", supabaseUser.id)
    .single();

  if (!data) {
    // Profile doesn't exist — create it from user metadata
    const meta = supabaseUser.user_metadata ?? {};
    const { data: newProfile } = await supabase
      .from("profiles")
      .upsert({
        id: supabaseUser.id,
        name: (meta.name as string) ?? "Пользователь",
        role: (meta.role as string) ?? "renter",
        phone: null,
      })
      .select()
      .single();

    if (!newProfile) return null;

    return {
      id: supabaseUser.id,
      name: (newProfile as Record<string, unknown>).name as string,
      email: supabaseUser.email ?? "",
      phone: (newProfile as Record<string, unknown>).phone as string | null,
      phone_verified: ((newProfile as Record<string, unknown>).phone_verified as boolean) ?? false,
      id_verified: ((newProfile as Record<string, unknown>).id_verified as boolean) ?? false,
      role: ((newProfile as Record<string, unknown>).role as string) as "host" | "renter",
      avatar_url: (newProfile as Record<string, unknown>).avatar_url as string | null,
      onboarding_completed: ((newProfile as Record<string, unknown>).onboarding_completed as boolean) ?? false,
    };
  }

  // Check if user is suspended
  if ((data as Record<string, unknown>).suspended === true) {
    await supabase.auth.signOut();
    return null;
  }

  // Check if user is deactivated
  if ((data as Record<string, unknown>).deactivated_at != null) {
    await supabase.auth.signOut();
    return null;
  }

  const profile = data as {
    id: string;
    name: string;
    phone: string | null;
    phone_verified: boolean;
    id_verified: boolean;
    role: string;
    avatar_url: string | null;
    onboarding_completed: boolean;
  };

  return {
    id: profile.id,
    name: profile.name,
    email: supabaseUser.email ?? "",
    phone: profile.phone,
    phone_verified: profile.phone_verified ?? false,
    id_verified: profile.id_verified ?? false,
    role: profile.role as "host" | "renter",
    avatar_url: profile.avatar_url,
    onboarding_completed: profile.onboarding_completed ?? false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Skip onAuthStateChange when login() already handled the profile
  const loginHandledRef = useRef(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user);
        setUser(profile);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          if (session?.user) {
            const profile = await fetchProfile(session.user);
            setUser(profile);
          }
          return;
        }
        // Skip if login() already set the user
        if (event === "SIGNED_IN" && loginHandledRef.current) {
          loginHandledRef.current = false;
          return;
        }
        if (session?.user) {
          const profile = await fetchProfile(session.user);
          setUser(profile);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function login(
    email: string,
    password: string
  ): Promise<{ ok: boolean; error?: string }> {
    // Set flag BEFORE signIn to prevent onAuthStateChange from running fetchProfile
    loginHandledRef.current = true;

    const { error, data: signInData } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      loginHandledRef.current = false;
      return { ok: false, error: error.message };
    }

    // Fetch profile immediately so user state is ready before redirect
    if (signInData.user) {
      const profile = await fetchProfile(signInData.user);

      if (!profile) {
        loginHandledRef.current = false;
        return {
          ok: false,
          error: "Ваш аккаунт деактивирован. Для восстановления напишите на hello@lokacia.kz",
        };
      }

      setUser(profile);
    }

    return { ok: true };
  }

  async function register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: "host" | "renter";
  }): Promise<{ ok: boolean; error?: string }> {
    const { error, data: authData } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: data.role,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) return { ok: false, error: error.message };

    // Update profile with phone
    if (authData.user) {
      await supabase
        .from("profiles")
        .update({ phone: data.phone, terms_accepted_at: new Date().toISOString() })
        .eq("id", authData.user.id);
    }

    return { ok: true };
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
