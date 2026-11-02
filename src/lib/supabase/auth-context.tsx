"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, Business, Profile, BusinessMembership } from "./client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  currentBusiness: Business | null;
  membership: BusinessMembership | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  currentBusiness: null,
  membership: null,
  loading: true,
  refreshUserData: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [membership, setMembership] = useState<BusinessMembership | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (currentUser: User) => {
    try {
      // 1. Fetch Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as Profile);
      } else {
        setProfile({
          id: currentUser.id,
          full_name: (currentUser.user_metadata?.full_name as string) || (currentUser.email?.split("@")[0] ?? "Usuario"),
          avatar_url: null,
          phone: null,
        });
      }

      // 2. Fetch Business Memberships
      const { data: membershipData } = await supabase
        .from("business_memberships")
        .select("*, business:businesses(*)")
        .eq("user_id", currentUser.id)
        .limit(1)
        .maybeSingle();

      if (membershipData) {
        setMembership(membershipData as unknown as BusinessMembership);
        if (membershipData.business) {
          setCurrentBusiness(membershipData.business as Business);
        }
      } else {
        // Fallback: check if created by user directly
        const { data: businessData } = await supabase
          .from("businesses")
          .select("*")
          .eq("created_by", currentUser.id)
          .limit(1)
          .maybeSingle();

        if (businessData) {
          setCurrentBusiness(businessData as Business);
          setMembership({
            id: "owner-fallback",
            business_id: businessData.id,
            user_id: currentUser.id,
            role: "owner",
            business: businessData as Business,
          });
        }
      }
    } catch (err) {
      console.error("Error loading user context:", err);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(data.session);
      setUser(data.session?.user ?? null);

      if (data.session?.user) {
        await fetchUserData(data.session.user);
      }
      setLoading(false);
    }

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchUserData(currentSession.user);
        } else {
          setProfile(null);
          setCurrentBusiness(null);
          setMembership(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setCurrentBusiness(null);
    setMembership(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        currentBusiness,
        membership,
        loading,
        refreshUserData,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
