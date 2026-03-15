"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";

const Login = () => {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("username", data.username);
        window.dispatchEvent(new Event("auth-change"));
        toast.success("Logged in");
        router.push("/problems");
      } else {
        toast.error("Invalid credentials");
      }
    } catch (error) {
      console.error(error);
      toast.error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full h-10 rounded-md border border-neutral-800/60 hover:border-neutral-700 focus:border-neutral-600 bg-[#0d0d0d] px-3 font-mono-custom text-[12px] text-neutral-300 placeholder:text-neutral-800 outline-none transition-colors duration-200";

  return (
    <div className="relative flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center bg-[#0a0a0a] overflow-hidden">

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:72px_72px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(255,255,255,0.03),transparent)]" />

      <div className="relative z-10 w-full max-w-sm">

        <div className="text-center mb-8">
          <span className="font-sans text-[22px] font-bold tracking-[-0.04em] text-white">
            Execut<span className="text-neutral-600">.</span>
          </span>
          <p className="font-mono-custom text-[10px] tracking-[0.2em] uppercase text-neutral-700 mt-2">
            Log in to your account
          </p>
        </div>

        <div className="border border-neutral-800/60 rounded-lg bg-[#0d0d0d] p-7">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            <div className="flex flex-col gap-2">
              <label className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 h-10 w-full flex items-center justify-center gap-2 rounded-md bg-white font-mono-custom text-[11px] tracking-[0.14em] uppercase font-medium text-neutral-900 hover:bg-neutral-200 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="h-3.5 w-3.5 animate-spin text-neutral-600" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : "Login"}
            </button>

            <div className="border-t border-neutral-800/50 pt-5 flex items-center justify-center gap-1.5">
              <span className="font-mono-custom text-[10px] text-neutral-700">
                Don&apos;t have an account?
              </span>
              <Link
                href="/signup"
                className="font-mono-custom text-[10px] text-neutral-500 hover:text-neutral-300 border-b border-neutral-800 hover:border-neutral-600 pb-px transition-colors duration-200"
              >
                Sign Up →
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;