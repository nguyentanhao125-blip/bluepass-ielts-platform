"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { INITIAL_USERS } from "@/lib/seed-data";
import { Role, UserProfile } from "@/lib/types";

interface AppContextValue {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  switchDemoRole: (role: Role) => void;
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bluepass_current_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          setCurrentUserState(parsed);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const setCurrentUser = (user: UserProfile) => {
    setCurrentUserState(user);
    try {
      localStorage.setItem("bluepass_current_user", JSON.stringify(user));
    } catch {
      // Ignore storage errors
    }
  };

  const switchDemoRole = (role: Role) => {
    const found =
      INITIAL_USERS.find((u) => u.role === role) || INITIAL_USERS[0];
    setCurrentUser(found);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchDemoRole,
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
