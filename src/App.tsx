import { WeekGrid } from "./components/WeekGrid";
import { LoginScreen } from "./components/LoginScreen";
import { useMember } from "./hooks/useMember";

export default function App() {
  const { members, currentMember, loaded, login, logout } = useMember();

  if (!loaded) {
    return (
      <div className="bg-pink-pale flex h-screen flex-col items-center justify-center">
        <div className="animate-[pulse_1s_ease-in-out_infinite] text-5xl">📋</div>
        <p className="text-slate-muted mt-3 text-lg font-bold">Loading Rulu...</p>
      </div>
    );
  }

  if (!currentMember) {
    return <LoginScreen members={members} onLogin={login} />;
  }

  return <WeekGrid currentMember={currentMember} onLogout={logout} />;
}
