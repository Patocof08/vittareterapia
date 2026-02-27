import React, { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type UserRole = "psicologo" | "cliente" | "admin" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string, selectedRole: UserRole) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserRole = async (userId: string, metadata?: Record<string, any>) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role, created_at")
        .eq("user_id", userId);

      if (error) throw error;

      if (!data || data.length === 0) {
        // No role found — try to recover from signup metadata (happens when email
        // confirmation is required and the role INSERT failed without a session)
        const intendedRole = metadata?.role_intended;
        if (intendedRole && ["psicologo", "cliente"].includes(intendedRole)) {
          const { error: insertError } = await supabase
            .from("user_roles")
            .insert({ user_id: userId, role: intendedRole });
          if (!insertError) return intendedRole as UserRole;
        }
        return null;
      }

      // Prefer role priority: admin > psicologo > cliente
      const roles = data.map((r: any) => r.role as string);
      if (roles.includes("admin")) return "admin" as const;
      if (roles.includes("psicologo")) return "psicologo" as const;
      if (roles.includes("cliente")) return "cliente" as const;

      // Fallback to the most recent role
      const sorted = [...data].sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return (sorted[0]?.role ?? null) as any;
    } catch (error) {
      // Only log in development, silent in production for security
      if (import.meta.env.DEV) {
        console.error("Error fetching user role:", error);
      }
      return null;
    }
  };
  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        // Only synchronous state updates here
        setSession(session);
        setUser(session?.user ?? null);

        // Defer async Supabase calls with setTimeout to prevent deadlocks
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id, session.user.user_metadata).then((userRole) => {
              if (isMounted) {
                setRole(userRole);
                setLoading(false);
              }
            });
          }, 0);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserRole(session.user.id, session.user.user_metadata).then((userRole) => {
          if (isMounted) {
            setRole(userRole);
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      const userRole = await fetchUserRole(data.user.id, data.user.user_metadata);

      // Set role in context BEFORE navigating so ProtectedRoute sees it immediately
      setRole(userRole);

      // Redirect based on role
      if (userRole === "admin") {
        navigate("/admin/dashboard");
      } else if (userRole === "psicologo") {
        navigate("/therapist/dashboard");
      } else if (userRole === "cliente") {
        navigate("/portal");
      } else {
        navigate("/");
      }
    }

    return data;
  };

  const signUp = async (email: string, password: string, fullName: string, selectedRole: UserRole) => {
    if (!selectedRole) {
      throw new Error("Debes seleccionar un rol");
    }

    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          // Store intended role in metadata so it can be recovered after email confirmation
          role_intended: selectedRole,
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      if (data.session) {
        // Session exists (email confirmation disabled) — insert role immediately
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: data.user.id, role: selectedRole });

        if (roleError) throw roleError;

        // Redirect based on role
        if (selectedRole === "psicologo") {
          navigate("/onboarding-psicologo");
        } else if (selectedRole === "cliente") {
          navigate("/portal");
        }
      } else {
        // No session yet — email confirmation required.
        // The role is saved in metadata and will be inserted automatically on first login.
        throw new Error("Revisa tu correo y confirma tu cuenta para continuar.");
      }
    }

    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
