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
    <div className="relative flex h-screen items-center justify-center p-4 overflow-hidden">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 rounded-full pointer-events-none"
        style={{
          width: 600,
          height: 600,
          background: "#FFD190",
          filter: "blur(200px)",
          opacity: 0.2,
        }}
      />
      <div className="noise-overlay" />
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

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-dark px-3 text-muted-dark text-[12px] font-medium uppercase tracking-wider">
              Or continue with
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={oauthLoading !== null}
            className="group relative w-full h-12 flex items-center justify-center gap-3 rounded-[14px] bg-white text-[#1f1f1f] text-[14px] font-medium cursor-pointer transition-all duration-200 hover:bg-gray-100 active:scale-[.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 overflow-hidden"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-r from-transparent via-black/[0.02] to-transparent" />
            {oauthLoading === "google" ? (
              <span className="text-muted-dark">Connecting...</span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                  <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleOAuth("yandex")}
            disabled={oauthLoading !== null}
            className="group relative w-full h-12 flex items-center justify-center gap-3 rounded-[14px] bg-[#FC3F1D] text-white text-[14px] font-medium cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 overflow-hidden"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            {oauthLoading === "yandex" ? (
              <span>Connecting...</span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="11" fill="white"/>
                  <path d="M10.5 6.5h-3l-3 10h2.5l1-3.5h4l1 3.5h2.5l-3-10h-2zm-.5 4.5L11 8l1 3H10z" fill="#FC3F1D"/>
                </svg>
                <span>Sign in with Yandex</span>
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
