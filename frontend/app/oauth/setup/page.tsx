"use client";

import { type FormEvent, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { saveTokens } from "@/lib/api";
import {
  validateUsername,
  checkPasswordStrength,
  type PasswordStrength,
} from "@/lib/validation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.replace("/api", "") || "http://localhost:8000";

const LEVEL_COLORS: Record<PasswordStrength["level"], string> = {
  empty: "",
  "too-short": "bg-red-500",
  weak: "bg-red-500",
  medium: "bg-orange-400",
  good: "bg-yellow",
  strong: "bg-green-400",
};

function PasswordBar({ strength }: { strength: PasswordStrength }) {
  if (strength.level === "empty") return null;

  const color = LEVEL_COLORS[strength.level];
  const labelColor =
    strength.level === "good" || strength.level === "strong"
      ? "text-yellow"
      : "text-red-400";

  return (
    <div className="mt-2">
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${strength.score}%` }}
        />
      </div>
      <p className={`text-[12px] mt-1 ${labelColor}`}>{strength.label}</p>
    </div>
  );
}

function SetupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const setupToken = params.get("token") ?? "";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const usernameErr = useMemo(() => {
    if (!username) return null;
    return validateUsername(username);
  }, [username]);

  const strength = useMemo(() => checkPasswordStrength(password), [password]);

  const canSubmit =
    usernameErr?.ok && (strength.level === "good" || strength.level === "strong");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || !setupToken) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/oauth/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          setup_token: setupToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const detail = data.detail;
        const message = Array.isArray(detail)
          ? detail.map((d: { msg: string }) => d.msg).join("; ")
          : detail ?? "Setup failed";
        setError(message);
        return;
      }

      saveTokens(data.access_token, data.refresh_token, data.user);
      router.replace("/feed");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function inputClass(err: { ok: boolean } | null) {
    const base =
      "w-full h-12 px-[18px] bg-surface border rounded-[16px] text-white text-[15px] outline-none transition-all duration-200 placeholder:text-muted-dark focus:shadow-[0_0_0_3px_rgba(255,209,144,0.1)]";
    if (err && !err.ok) {
      return `${base} border-red-500/40 focus:border-red-400`;
    }
    return `${base} border-border focus:border-yellow`;
  }

  if (!setupToken) {
    return (
      <p className="text-red-400 text-[14px]">Invalid setup link. No token provided.</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[340px]">
      <div className="flex items-center gap-2 mb-3">
        <Image src="/favicon.svg" alt="Gridhub" width={28} height={28} />
        <h1 className="text-[34px] font-bold">
          <span className="text-yellow">Grid</span>
          <span className="text-white">hub</span>
        </h1>
      </div>

      <p className="text-muted text-[15px] mb-[30px]">
        Almost there! Choose a username and password.
      </p>

      {error && <p className="text-red-400 text-[14px] mb-4">{error}</p>}

      <div className="flex flex-col gap-[10px]">
        <label className="text-muted-light text-[14px]">Username</label>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className={inputClass(usernameErr)}
          autoFocus
        />
        {usernameErr && !usernameErr.ok && (
          <p className="text-red-400 text-[12px] mt-[-6px]">{usernameErr.message}</p>
        )}

        <label className="text-muted-light text-[14px]">Password</label>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={inputClass(
            strength.level !== "empty" &&
              strength.level !== "good" &&
              strength.level !== "strong"
              ? { ok: false }
              : null
          )}
        />
        <PasswordBar strength={strength} />
        {password && strength.level !== "strong" && strength.level !== "good" && (
          <ul className="text-red-400 text-[12px] space-y-0.5 mt-[-2px]">
            {!strength.checks.minLength && <li>At least 8 characters</li>}
            {strength.checks.minLength && !strength.checks.uppercase && (
              <li>Need an uppercase letter</li>
            )}
            {strength.checks.minLength && strength.checks.uppercase && !strength.checks.lowercase && (
              <li>Need a lowercase letter</li>
            )}
            {strength.checks.minLength && strength.checks.uppercase && strength.checks.lowercase && !strength.checks.number && (
              <li>Need a number</li>
            )}
            {strength.checks.minLength &&
              strength.checks.uppercase &&
              strength.checks.lowercase &&
              strength.checks.number &&
              !strength.checks.special && <li>Need a special character</li>}
          </ul>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !canSubmit}
        className="w-full h-12 mt-6 border-none rounded-[16px] bg-yellow text-dark text-[15px] font-bold cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100"
      >
        {loading ? "Setting up..." : "Complete setup"}
      </button>
    </form>
  );
}

export default function OAuthSetupPage() {
  return (
    <div className="relative flex h-screen items-center justify-center p-4 overflow-hidden">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 rounded-full pointer-events-none"
        style={{
          width: 600,
          height: 600,
          background: "#FFD190",
          filter: "blur(400px)",
          opacity: 0.2,
        }}
      />
      <div className="noise-overlay" />
      <Suspense
        fallback={
          <p className="text-muted text-[15px]">Loading...</p>
        }
      >
        <SetupForm />
      </Suspense>
    </div>
  );
}
