import { useState } from "react";
import { supabase } from "../lib/supabase";

interface AuthGateProps {
  onAuthenticated: () => void;
}

export function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError("Wrong email or password");
    } else {
      onAuthenticated();
    }
  };

  return (
    <div className="from-pink-pale flex min-h-screen flex-col items-center justify-center bg-linear-to-br via-[#FFFDF5] to-[#FFF0F5] p-6">
      <link
        href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap"
        rel="stylesheet"
      />

      <h1 className="text-pink mb-2 text-4xl font-black tracking-tight">Rulu</h1>
      <p className="text-slate-muted mb-8 text-lg font-bold">Family Weekly Planner</p>

      <form
        onSubmit={handleSubmit}
        className="border-pink-light w-full max-w-80 rounded-3xl border-2 bg-white p-7 shadow-[0_8px_30px_rgba(255,107,157,0.12)]"
      >
        <div className="mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            required
            className="border-pink-light focus:border-pink box-border w-full rounded-xl border-2 px-3.5 py-3 text-base font-bold transition-colors duration-200 outline-none focus:shadow-[0_0_0_3px_rgba(255,107,157,0.12)]"
          />
        </div>
        <div className="mb-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            required
            className="border-pink-light focus:border-pink box-border w-full rounded-xl border-2 px-3.5 py-3 text-base font-bold transition-colors duration-200 outline-none focus:shadow-[0_0_0_3px_rgba(255,107,157,0.12)]"
          />
        </div>

        {error && (
          <p className="mb-4 text-center text-sm font-bold text-[#DC2626]">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="from-pink w-full cursor-pointer rounded-xl border-none bg-linear-to-br to-[#FF8FB1] py-3 text-[15px] font-extrabold text-white shadow-[0_4px_15px_rgba(255,107,157,0.25)] transition-all duration-200 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
