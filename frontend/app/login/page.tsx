"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { apiLogin, saveTokens } from "@/lib/api";

const API_BASE = "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

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

  async function handleOAuth(provider: "google" | "yandex") {
    setOauthLoading(provider);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/${provider}/login`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(`${provider} OAuth is not configured`);
        setOauthLoading(null);
      }
    } catch {
      setError("Failed to connect to the server");
      setOauthLoading(null);
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

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-dark text-[13px]">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={oauthLoading !== null}
            className="w-full h-11 flex items-center justify-center gap-2.5 border border-border rounded-[16px] bg-surface text-white text-[14px] font-medium cursor-pointer transition-all duration-200 hover:bg-white/5 active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {oauthLoading === "google" ? (
              "Connecting..."
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Sign in with Google
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleOAuth("yandex")}
            disabled={oauthLoading !== null}
            className="w-full h-11 flex items-center justify-center gap-2.5 border border-border rounded-[16px] bg-surface text-white text-[14px] font-medium cursor-pointer transition-all duration-200 hover:bg-white/5 active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {oauthLoading === "yandex" ? (
              "Connecting..."
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#fff" d="M2 2h20v20H2V2zm3.5 16h2.5l1.5-5h4l1.5 5h2.5l-4.5-14h-2.5L5.5 18zm3.5-7.5L10.5 7h3l1.5 3.5H9z"/></svg>
                Sign in with Yandex
              </>
            )}
          </button>
        </div>

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
