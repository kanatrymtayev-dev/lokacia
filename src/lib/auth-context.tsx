"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "host" | "renter";
  avatar: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { name: string; email: string; phone: string; password: string; role: "host" | "renter" }) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "lokacia_user";

// Demo accounts
const DEMO_USERS: (User & { password: string })[] = [
  {
    id: "h1",
    name: "Алия К.",
    email: "host@lokacia.kz",
    phone: "+7 777 111 2233",
    role: "host",
    avatar: "https://picsum.photos/seed/lokacia101/200/200",
    password: "host123",
    createdAt: "2025-09-15",
  },
  {
    id: "r1",
    name: "Марат К.",
    email: "renter@lokacia.kz",
    phone: "+7 707 999 8877",
    role: "renter",
    avatar: "https://picsum.photos/seed/lokacia201/200/200",
    password: "renter123",
    createdAt: "2025-11-01",
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string): Promise<boolean> {
    // Check demo accounts
    const found = DEMO_USERS.find((u) => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...userData } = found;
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      return true;
    }

    // Check registered users in localStorage
    const registeredRaw = localStorage.getItem("lokacia_registered");
    if (registeredRaw) {
      const registered = JSON.parse(registeredRaw) as (User & { password: string })[];
      const found2 = registered.find((u) => u.email === email && u.password === password);
      if (found2) {
        const { password: _, ...userData } = found2;
        setUser(userData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        return true;
      }
    }

    return false;
  }

  async function register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: "host" | "renter";
  }): Promise<boolean> {
    const newUser: User & { password: string } = {
      id: `u_${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      avatar: `https://picsum.photos/seed/${Date.now()}/200/200`,
      password: data.password,
      createdAt: new Date().toISOString().split("T")[0],
    };

    // Save to registered users list
    const registeredRaw = localStorage.getItem("lokacia_registered");
    const registered = registeredRaw ? JSON.parse(registeredRaw) : [];
    registered.push(newUser);
    localStorage.setItem("lokacia_registered", JSON.stringify(registered));

    // Auto login
    const { password: _, ...userData } = newUser;
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    return true;
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
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
