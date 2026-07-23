"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, checkUsernameAvailability, checkEmailAvailability } from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";
import { z } from "zod";

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const usernameSchema = z.string()
  .min(3, "Username must be at least 3 characters long")
  .max(20, "Username must be at most 20 characters long")
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores");

const emailSchema = z.email("Invalid email address");

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  
  const [errors, setErrors] = useState<{username?: string; email?: string; password?: string}>({});
  const router = useRouter();

  useEffect(() => {
    if (!username) {
      setErrors((prev) => ({ ...prev, username: undefined }));
      return;
    }
    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) {
      setErrors((prev) => ({ ...prev, username: parsed.error.issues[0].message }));
      return;
    }
    const timer = setTimeout(async () => {
      const res = await checkUsernameAvailability(username);
      if (!res.available) {
        setErrors((prev) => ({ ...prev, username: "Username is already taken" }));
      } else {
        setErrors((prev) => ({ ...prev, username: undefined }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  useEffect(() => {
    if (!email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
      return;
    }
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setErrors((prev) => ({ ...prev, email: parsed.error.issues[0].message }));
      return;
    }
    const timer = setTimeout(async () => {
      const res = await checkEmailAvailability(email);
      if (!res.available) {
        setErrors((prev) => ({ ...prev, email: "Account with this email already exists" }));
      } else {
        setErrors((prev) => ({ ...prev, email: undefined }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [email]);

  useEffect(() => {
    if (!password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
      return;
    }
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setErrors((prev) => ({ ...prev, password: parsed.error.issues[0].message }));
    } else {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (errors.username || errors.email || errors.password) {
      toast.error("Please fix the errors before submitting");
      return;
    }
    if (!username || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("username", data.username);
        window.dispatchEvent(new Event("auth-change"));
        toast.success("Signed up!");
        router.push("/problems");
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to sign up");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getInputClass = (hasError: boolean) =>
    `w-full h-10 rounded-md border ${
      hasError 
        ? "border-red-500/80 focus:border-red-500" 
        : "border-neutral-800/60 hover:border-neutral-700 focus:border-neutral-600"
    } bg-[#0d0d0d] px-3 font-mono-custom text-[12px] text-neutral-300 placeholder:text-neutral-800 outline-none transition-colors duration-200`;

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
            Create your account
          </p>
        </div>
        <div className="border border-neutral-800/60 rounded-lg bg-[#0d0d0d] p-7">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700">
                Username
              </label>
              <input
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={getInputClass(!!errors.username)}
              />
              {errors.username && (
                <p className="font-mono-custom text-[9px] text-red-500 mt-0.5">{errors.username}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={getInputClass(!!errors.email)}
              />
              {errors.email && (
                <p className="font-mono-custom text-[9px] text-red-500 mt-0.5">{errors.email}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono-custom text-[9px] tracking-[0.22em] uppercase text-neutral-700">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={getInputClass(!!errors.password)}
              />
              {errors.password && (
                <p className="font-mono-custom text-[9px] text-red-500 mt-0.5">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !!errors.username || !!errors.email || !!errors.password}
              className="mt-1 h-10 w-full flex items-center justify-center gap-2 rounded-md bg-white font-mono-custom text-[11px] tracking-[0.14em] uppercase font-medium text-neutral-900 hover:bg-neutral-200 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="h-3.5 w-3.5 animate-spin text-neutral-600" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : "Sign Up"}
            </button>

            <div className="border-t border-neutral-800/50 pt-5 flex items-center justify-center gap-1.5">
              <span className="font-mono-custom text-[10px] text-neutral-700">
                Already have an account?
              </span>
              <Link
                href="/login"
                className="font-mono-custom text-[10px] text-neutral-500 hover:text-neutral-300 border-b border-neutral-800 hover:border-neutral-600 pb-px transition-colors duration-200"
              >
                Login →
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;