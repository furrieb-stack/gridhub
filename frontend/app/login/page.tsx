"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { apiLogin, saveTokens } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = username.trim() && password;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setLoading(true);

    try {
      const res = await apiLogin({ username, password });
      saveTokens(res.access_token, res.refresh_token, res.user);
      router.replace("/feed");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[340px]"
      >
        <div className="flex items-center gap-2 mb-3">
          <Image src="/favicon.svg" alt="Gridhub" width={28} height={28} />
          <h1 className="text-[34px] font-bold">
            <span className="text-yellow">Grid</span>
            <span className="text-white">hub</span>
          </h1>
        </div>

        <p className="text-muted text-[15px] mb-[30px]">
          Sign in to your account
        </p>

        {error && (
          <p className="text-red-400 text-[14px] mb-4">{error}</p>
        )}

        <div className="flex flex-col gap-[10px]">
          <label className="text-muted-light text-[14px]">Username</label>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full h-12 px-[18px] bg-surface border border-border rounded-[16px] text-white text-[15px] outline-none transition-[border-color] duration-200 placeholder:text-muted-dark focus:border-yellow"
          />

          <label className="text-muted-light text-[14px]">Password</label>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full h-12 px-[18px] bg-surface border border-border rounded-[16px] text-white text-[15px] outline-none transition-[border-color] duration-200 placeholder:text-muted-dark focus:border-yellow"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="w-full h-12 mt-6 border-none rounded-[16px] bg-yellow text-dark text-[15px] font-bold cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100"
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <p className="mt-[18px] text-center text-muted text-[14px]">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-yellow font-bold no-underline transition-colors duration-200 hover:text-yellow-hover"
          >
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
