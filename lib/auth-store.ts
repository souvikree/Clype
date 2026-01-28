import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  displayName: string;
  profilePicture: string;
}

export interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  login: (
    googleId: string,
    email: string,
    displayName: string,
    profilePicture: string,
  ) => Promise<void>;
  logout: () => void;
  updateDisplayName: (displayName: string) => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false, // ✅ This is fine
      hasHydrated: false,
      setHasHydrated: (v: boolean) => set({ hasHydrated: v }),

      setUser: (user: User | null) => {
        console.log("🔐 setUser called:", user);
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      setToken: (token: string | null) => {
        console.log("🔑 setToken called:", token ? "SET" : "NULL");
        set({ token });
      },

      setIsLoading: (isLoading: boolean) => set({ isLoading }),

      // WEB: Async login via API
      login: async (
        googleId: string,
        email: string,
        displayName: string,
        profilePicture: string,
      ) => {
        set({ isLoading: true });
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/google-login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                googleId,
                email,
                displayName,
                profilePicture,
              }),
            },
          );

          if (!response.ok) throw new Error("Login failed");

          const data = await response.json();
          set({
            user: {
              id: data.userId,
              email: data.email,
              displayName: data.displayName,
              profilePicture: data.profilePicture,
            },
            token: data.token,
            isAuthenticated: true,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        console.log("🚪 Logging out...");
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateDisplayName: async (displayName: string) => {
        const { token } = get();
        if (!token) throw new Error("Not authenticated");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/update-display-name`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ displayName }),
          },
        );

        if (!response.ok) throw new Error("Failed to update display name");

        const updatedUser = await response.json();
        set((state) => ({
          user: state.user
            ? { ...state.user, displayName: updatedUser.displayName }
            : null,
        }));
      },
    }),
    {
      name: "auth-store",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // ✅ ADD THIS: Always reset loading state on hydration
        state?.setIsLoading(false);
      },
    },
  ),
);
