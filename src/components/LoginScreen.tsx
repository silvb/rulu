import type { Member } from "../lib/types";

interface LoginScreenProps {
  members: Member[];
  onLogin: (memberId: string) => void;
}

export function LoginScreen({ members, onLogin }: LoginScreenProps) {
  return (
    <div className="from-pink-pale flex min-h-screen flex-col items-center justify-center bg-linear-to-br via-[#FFFDF5] to-[#FFF0F5] p-6">
      <link
        href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap"
        rel="stylesheet"
      />

      <h1 className="text-pink mb-2 text-4xl font-black tracking-tight">Rulu</h1>
      <p className="text-slate-muted mb-10 text-lg font-bold">Who's checking in?</p>

      <div className="flex gap-5">
        {members.map((member) => (
          <button
            key={member.id}
            onClick={() => onLogin(member.id)}
            className="border-pink-light hover:border-pink flex w-32 cursor-pointer flex-col items-center gap-3 rounded-3xl border-3 bg-white px-6 py-8 shadow-[0_8px_30px_rgba(255,107,157,0.12)] transition-all duration-200 hover:scale-105 hover:shadow-[0_12px_40px_rgba(255,107,157,0.2)] active:scale-95"
          >
            <span className="text-5xl">{member.emoji}</span>
            <span className="text-slate-dark text-lg font-extrabold">{member.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
