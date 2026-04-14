"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "./supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "host" | "renter";
  avatar_url: string | null;
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
      role: ((newProfile as Record<string, unknown>).role as string) as "host" | "renter",
      avatar_url: (newProfile as Record<string, unknown>).avatar_url as string | null,
    };
  }

  const profile = data as {
    id: string;
    name: string;
    phone: string | null;
    role: string;
    avatar_url: string | null;
  };

  return {
    id: profile.id,
    name: profile.name,
    email: supabaseUser.email ?? "",
    phone: profile.phone,
    role: profile.role as "host" | "renter",
    avatar_url: profile.avatar_url,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
          // Set session but don't redirect — let reset-password page handle it
          if (session?.user) {
            const profile = await fetchProfile(session.user);
            setUser(profile);
          }
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
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
      },
    });

    if (error) return { ok: false, error: error.message };

    // Update profile with phone
    if (authData.user) {
      await supabase
        .from("profiles")
        .update({ phone: data.phone })
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
