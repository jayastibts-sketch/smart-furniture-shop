import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "moderator" | "user";
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: UserRole[];
  isLoading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return data;
  };

  const fetchRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching roles:", error);
      return [];
    }
    return data || [];
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      const rolesData = await fetchRoles(user.id);
      setProfile(profileData);
      setRoles(rolesData);
    }
  };

  useEffect(() => {
    const setCurrentUserId = useStore.getState().setCurrentUserId;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Sync store with user ID for per-user cart/wishlist
        setCurrentUserId(session?.user?.id ?? null);

        if (session?.user) {
          // Defer profile fetch to avoid blocking
          setTimeout(async () => {
            const profileData = await fetchProfile(session.user.id);
            const rolesData = await fetchRoles(session.user.id);
            setProfile(profileData);
            setRoles(rolesData);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Sync store with user ID for per-user cart/wishlist
      setCurrentUserId(session?.user?.id ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
        fetchRoles(session.user.id).then(setRoles);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      toast.error("Sign up failed", { description: error.message });
      throw error;
    }

    toast.success("Account created!", { description: "You have been signed in successfully." });
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("Sign in failed", { description: error.message });
      throw error;
    }

    toast.success("Welcome back!", { description: "You have been signed in successfully." });
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Sign out failed", { description: error.message });
      throw error;
    }
    toast.success("Signed out", { description: "You have been signed out successfully." });
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error("No user logged in");

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Update failed", { description: error.message });
      throw error;
    }

    await refreshProfile();
    toast.success("Profile updated", { description: "Your profile has been updated successfully." });
  };

  const isAdmin = roles.some((r) => r.role === "admin");
  const isModerator = roles.some((r) => r.role === "moderator" || r.role === "admin");

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        isLoading,
        isAdmin,
        isModerator,
        signUp,
        signIn,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
