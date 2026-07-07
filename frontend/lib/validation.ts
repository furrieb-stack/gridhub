const RESERVED_USERNAMES = [
  "admin", "moderator", "support", "help", "system",
];

const SPECIAL_CHARS = /[!@#$%^&*(),.?":{}|<>]/;

export interface ValidationResult {
  ok: boolean;
  message?: string;
}

export function validateUsername(v: string): ValidationResult {
  if (v.length < 3) return { ok: false, message: "At least 3 characters" };
  if (v.length > 30) return { ok: false, message: "At most 30 characters" };
  if (!/^[a-zA-Z0-9_.-]+$/.test(v)) {
    return {
      ok: false,
      message: "Only letters, numbers, dots, underscores and hyphens",
    };
  }
  if (RESERVED_USERNAMES.includes(v.toLowerCase())) {
    return { ok: false, message: "This username is reserved" };
  }
  return { ok: true };
}

export function validateEmail(v: string): ValidationResult {
  if (!v) return { ok: false, message: "Email is required" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    return { ok: false, message: "Enter a valid email address" };
  }
  return { ok: true };
}

export function validateDisplayName(v: string): ValidationResult {
  if (v.length > 50) return { ok: false, message: "At most 50 characters" };
  return { ok: true };
}

export interface PasswordStrength {
  level: "empty" | "too-short" | "weak" | "medium" | "good" | "strong";
  label: string;
  score: number;
  checks: {
    minLength: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export function checkPasswordStrength(v: string): PasswordStrength {
  const checks = {
    minLength: v.length >= 8,
    uppercase: /[A-Z]/.test(v),
    lowercase: /[a-z]/.test(v),
    number: /\d/.test(v),
    special: SPECIAL_CHARS.test(v),
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const allMet = Object.values(checks).every(Boolean);

  if (!v) return { level: "empty", label: "", score: 0, checks };
  if (v.length < 8) {
    return { level: "too-short", label: "Too short", score: 20, checks };
  }
  if (passed <= 2) return { level: "weak", label: "Weak", score: 35, checks };
  if (passed <= 3) return { level: "medium", label: "Medium", score: 55, checks };
  if (allMet && v.length >= 12) {
    return { level: "strong", label: "Strong", score: 100, checks };
  }
  return { level: "good", label: "Good", score: 80, checks };
}

export function validatePassword(v: string): ValidationResult {
  if (v.length < 8) return { ok: false, message: "At least 8 characters" };
  if (!/[A-Z]/.test(v)) return { ok: false, message: "Need an uppercase letter" };
  if (!/[a-z]/.test(v)) return { ok: false, message: "Need a lowercase letter" };
  if (!/\d/.test(v)) return { ok: false, message: "Need a number" };
  if (!SPECIAL_CHARS.test(v)) return { ok: false, message: "Need a special character" };
  return { ok: true };
}
