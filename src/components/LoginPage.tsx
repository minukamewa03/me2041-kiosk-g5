import { useState } from "react";
import { useLibrary } from "@/context/LibraryContext";

export default function LoginPage() {
  const [memberId, setMemberId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useLibrary();

  const handleLogin = async () => {
    if (!memberId || !password) {
      setError("Please enter your ID and password.");
      return;
    }
    const err = await login(memberId.trim(), password.trim());
    if (err) setError(err);else
    setError("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-5 relative z-[1]">
      <div className="animate-rise bg-paper border border-border rounded-[20px] p-12 w-full max-w-[420px] shadow-[0_8px_40px_hsl(var(--shadow-color)/0.08),0_2px_8px_hsl(var(--shadow-color)/0.08)]">
        <div className="text-center mb-9">
          <span className="text-[40px] block mb-2.5">📚</span>
          <h1 className="font-serif text-[28px] font-black text-ink tracking-tight">LibraKiosk</h1>
          <p className="text-[13px] text-muted-foreground mt-1 font-light">University of Moratuwa · Library Portal</p>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-muted-foreground tracking-[1.5px] uppercase">Member ID</label>
            <input
              type="text"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              placeholder="e.g. 240320V"
              className="bg-warm border-[1.5px] border-border rounded-[10px] px-4 py-3 font-sans text-sm text-ink outline-none transition-all focus:border-accent-orange focus:bg-paper placeholder:text-border" />
            
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-muted-foreground tracking-[1.5px] uppercase">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="••••••••"
              className="bg-warm border-[1.5px] border-border rounded-[10px] px-4 py-3 font-sans text-sm text-ink outline-none transition-all focus:border-accent-orange focus:bg-paper placeholder:text-border" />
            
          </div>
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-ink text-cream border-none rounded-[10px] py-3.5 font-sans text-sm font-medium cursor-pointer transition-all tracking-[0.5px] hover:bg-ink2 active:scale-[0.98]">
          
          Sign In
        </button>

        {error &&
        <p className="text-accent-orange text-xs text-center mt-3 font-mono">{error}</p>
        }

        

        
      </div>
    </div>);

}