import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { WeekGrid } from "./components/WeekGrid";
import { LoginScreen } from "./components/LoginScreen";
import { AuthGate } from "./components/AuthGate";
import { useMember } from "./hooks/useMember";

function AuthenticatedApp({ onSignOut }: { onSignOut: () => void }) {
  const { members, currentMember, householdId, loaded, login, logout } = useMember();

  if (!loaded) {
    return (
      <div className="bg-pink-pale flex h-screen flex-col items-center justify-center">
        <div className="animate-[pulse_1s_ease-in-out_infinite] text-5xl">📋</div>
        <p className="text-slate-muted mt-3 text-lg font-bold">Loading Rulu...</p>
      </div>
    );
  }

  if (!currentMember || !householdId) {
    return <LoginScreen members={members} onLogin={login} />;
  }

  return (
    <WeekGrid
      currentMember={currentMember}
      householdId={householdId}
      onLogout={logout}
      onSignOut={onSignOut}
    />
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="bg-pink-pale flex h-screen flex-col items-center justify-center">
        <div className="animate-[pulse_1s_ease-in-out_infinite] text-5xl">📋</div>
        <p className="text-slate-muted mt-3 text-lg font-bold">Loading Rulu...</p>
      </div>
    );
  }

  if (!session) {
    return <AuthGate onAuthenticated={() => {}} />;
  }

  return (
    <AuthenticatedApp
      onSignOut={async () => {
        await supabase.auth.signOut();
      }}
    />
  );
}
