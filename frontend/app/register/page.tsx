"use client";

import { type FormEvent, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { apiRegister, apiLogin, saveTokens } from "@/lib/api";
import {
  validateUsername,
  validateEmail,
  validateDisplayName,
  checkPasswordStrength,
  type PasswordStrength,
} from "@/lib/validation";

const LEVEL_COLORS: Record<PasswordStrength["level"], string> = {
  empty: "",
  "too-short": "bg-red-500",
  weak: "bg-red-500",
  medium: "bg-orange-400",
  good: "bg-[#FFD190]",
  strong: "bg-green-400",
};

function PasswordBar({ strength }: { strength: PasswordStrength }) {
  if (strength.level === "empty") return null;

  const color = LEVEL_COLORS[strength.level];
  const labelColor =
    strength.level === "good" || strength.level === "strong"
      ? "text-[#FFD190]"
      : "text-red-400";

  return (
    <div className="mt-2">
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${strength.score}%` }}
        />
      </div>
      <p className={`text-[12px] mt-1 ${labelColor}`}>{strength.label}</p>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const usernameErr = useMemo(() => {
    if (!username) return null;
    return validateUsername(username);
  }, [username]);

  const emailErr = useMemo(() => {
    if (!email) return null;
    return validateEmail(email);
  }, [email]);

  const displayNameErr = useMemo(() => {
    if (!displayName) return null;
    return validateDisplayName(displayName);
  }, [displayName]);

  const strength = useMemo(() => checkPasswordStrength(password), [password]);

  const canSubmit =
    usernameErr?.ok &&
    emailErr?.ok &&
    (!displayName || displayNameErr?.ok) &&
    (strength.level === "good" || strength.level === "strong");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setLoading(true);

    try {
      await apiRegister({
        username,
        email,
        password,
        display_name: displayName || undefined,
      });

      const res = await apiLogin({ username, password });
      saveTokens(res.access_token, res.refresh_token, res.user);
      router.replace("/feed");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function inputClass(err: { ok: boolean } | null) {
    const base =
      "w-full h-12 px-[18px] bg-white/[0.02] border rounded-[16px] text-white text-[15px] outline-none transition-all duration-200 placeholder:text-white/20 focus:shadow-[0_0_0_3px_rgba(255,209,144,0.1)]";
    if (err && !err.ok) {
      return `${base} border-red-500/40 focus:border-red-400`;
    }
    return `${base} border-white/[0.06] focus:border-[#FFD190]/50`;
  }

  return (
    <div className="relative flex h-screen items-center justify-center p-4 overflow-hidden bg-[#12110f]">
      <div 
        className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[80vw] max-w-[800px] h-[300px] bg-[#FFD190] opacity-20 blur-[120px] rounded-full pointer-events-none"
      />
      <div className="noise-overlay" />
      <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-[340px]">
        <div className="flex items-center gap-2 mb-3">
          <Image src="/favicon.svg" alt="Gridhub" width={28} height={28} />
          <h1 className="text-[34px] font-bold">
            <span className="text-[#FFD190]">Grid</span>
            <span className="text-white">hub</span>
          </h1>
        </div>

        <p className="text-white/40 text-[15px] mb-[30px]">
          Create your account
        </p>

        {error && (
          <p className="text-red-400 text-[14px] mb-4">{error}</p>
        )}

        <div className="flex flex-col gap-[10px]">
          <label className="text-white/60 text-[14px]">Username</label>
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

          <label className="text-white/60 text-[14px] mt-1">Email</label>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass(emailErr)}
          />
          {emailErr && !emailErr.ok && (
            <p className="text-red-400 text-[12px] mt-[-6px]">{emailErr.message}</p>
          )}

          <label className="text-white/60 text-[14px] mt-1">
            Display name <span className="text-white/30">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            className={inputClass(displayNameErr)}
          />
          {displayNameErr && !displayNameErr.ok && (
            <p className="text-red-400 text-[12px] mt-[-6px]">{displayNameErr.message}</p>
          )}

          <label className="text-white/60 text-[14px] mt-1">Password</label>
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
          className="w-full h-12 mt-6 border-none rounded-[16px] bg-[#FFD190] text-[#12110f] text-[15px] font-bold cursor-pointer transition-all duration-200 hover:bg-[#ffe3bc] active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="mt-[18px] text-center text-white/40 text-[14px]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[#FFD190] font-bold no-underline transition-colors duration-200 hover:text-[#ffe3bc]"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}