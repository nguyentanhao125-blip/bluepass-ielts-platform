"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { INITIAL_USERS } from "@/lib/seed-data";
import { Role, UserProfile } from "@/lib/types";

interface AppContextValue {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  switchDemoRole: (role: Role) => Promise<void>;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  unreadAnnouncementsCount: number;
  setUnreadAnnouncementsCount: (count: number) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<UserProfile>(INITIAL_USERS[0]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(2);

  const setCurrentUser = (user: UserProfile) => {
    setCurrentUserState(user);
    try {
      localStorage.setItem("bluepass_current_user", JSON.stringify(user));
    } catch {
      // Ignore storage errors
    }
  };

  // Synchronize client user state with server's signed HTTP-only cookie (`GET /api/auth/me`)
  useEffect(() => {
    let active = true;
    async function verifySessionWithServer() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok && active) {
          const data = await res.json();
          if (data.user && data.user.id) {
            setCurrentUser(data.user);
            return;
          }
        }
      } catch {
        // Fallback to localStorage only if offline
        try {
          const saved = localStorage.getItem("bluepass_current_user");
          if (saved && active) {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.id) {
              setCurrentUserState(parsed);
            }
          }
        } catch {
          // Ignore
        }
      }
    }
    verifySessionWithServer();
    return () => {
      active = false;
    };
  }, []);

  const switchDemoRole = async (role: Role) => {
    const found =
      INITIAL_USERS.find((u) => u.role === role) || INITIAL_USERS[0];
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: found.email, password: "123456" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          return;
        }
      }
    } catch {
      // Fallback
    }
    setCurrentUser(found);
  };

  const logout = async () => {
    try {
      const res = await fetch("/api/auth/me", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          return;
        }
      }
    } catch {
      // Fallback
    }
    setCurrentUser(INITIAL_USERS[0]);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchDemoRole,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
        unreadAnnouncementsCount,
        setUnreadAnnouncementsCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within AppProvider");
  }
  return ctx;
}
