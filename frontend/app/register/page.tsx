"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { apiRegister, apiLogin, saveTokens } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
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

  return (
    <div className="flex h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="w-[340px]">
        <div className="flex items-center gap-2 mb-3">
          <Image src="/favicon.svg" alt="Gridhub" width={28} height={28} />
          <h1 className="text-[34px] font-bold">
            <span className="text-yellow">Grid</span>
            <span className="text-white">hub</span>
          </h1>
        </div>

        <p className="text-muted text-[15px] mb-[30px]">
          Create your account
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
            minLength={3}
            maxLength={30}
            className="w-full h-12 px-[18px] bg-surface border border-border rounded-[16px] text-white text-[15px] outline-none transition-[border-color] duration-200 placeholder:text-muted-dark focus:border-yellow"
          />

          <label className="text-muted-light text-[14px]">Email</label>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-12 px-[18px] bg-surface border border-border rounded-[16px] text-white text-[15px] outline-none transition-[border-color] duration-200 placeholder:text-muted-dark focus:border-yellow"
          />

          <label className="text-muted-light text-[14px]">Display name (optional)</label>
          <input
            type="text"
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            className="w-full h-12 px-[18px] bg-surface border border-border rounded-[16px] text-white text-[15px] outline-none transition-[border-color] duration-200 placeholder:text-muted-dark focus:border-yellow"
          />

          <label className="text-muted-light text-[14px]">Password</label>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full h-12 px-[18px] bg-surface border border-border rounded-[16px] text-white text-[15px] outline-none transition-[border-color] duration-200 placeholder:text-muted-dark focus:border-yellow"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 mt-6 border-none rounded-[16px] bg-yellow text-dark text-[15px] font-bold cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="mt-[18px] text-center text-muted text-[14px]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-yellow font-bold no-underline transition-colors duration-200 hover:text-yellow-hover"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
