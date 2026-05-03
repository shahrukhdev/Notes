"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getUser } from "@/lib/userService";

type User = {
  id: number;
  name: string;
  email: string;
  profileImage?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      setLoading(true);

      const response = await getUser();
      setUser(response?.data);

    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        refreshUser: fetchUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}