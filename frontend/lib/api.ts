const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

export function mediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return url;
}

export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  is_verified: boolean;
  is_admin: boolean;
  is_mod: boolean;
  is_banned: boolean;
  is_private: boolean;
  privacy_settings: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  user: User;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  display_name?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit, isRetry = false): Promise<T> {
  let token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const doFetch = async (t: string | null) => fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options?.headers ?? {}),
      "Content-Type": "application/json",
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    },
  });

  let res = await doFetch(token);

  if (res.status === 401 && !isRetry) {
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE}/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (refreshRes.ok) {
          const newTokens: TokenResponse = await refreshRes.json();
          saveTokens(newTokens.access_token, newTokens.refresh_token, newTokens.user);
          token = newTokens.access_token;
          res = await doFetch(token);
        } else {
          clearTokens();
          if (typeof window !== "undefined") window.location.href = "/login";
        }
      } catch (e) {
        clearTokens();
        if (typeof window !== "undefined") window.location.href = "/login";
      }
    } else {
      clearTokens();
      if (typeof window !== "undefined") window.location.href = "/login";
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body.detail;
    if (res.status === 403 && typeof detail === "string" && detail.toLowerCase().includes("banned")) {
      if (typeof window !== "undefined") {
        clearTokens();
        sessionStorage.setItem("ban_reason", detail);
        window.location.href = "/banned";
      }
    }
    const message = Array.isArray(detail)
      ? detail.map((d: { msg: string }) => d.msg).join("; ")
      : detail ?? "Request failed";
    throw new ApiError(message, res.status);
  }

  return res.json();
}

export async function apiRegister(data: RegisterData): Promise<User> {
  return request("/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiLogin(data: LoginData): Promise<TokenResponse> {
  return request("/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiRefresh(
  refreshToken: string
): Promise<TokenResponse> {
  return request("/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export async function apiLogout(): Promise<void> {
  return request("/logout", { method: "POST" });
}

export function saveTokens(
  accessToken: string,
  refreshToken: string,
  user: User
) {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
  localStorage.setItem("user", JSON.stringify(user));
  document.cookie = `access_token=${accessToken}; path=/; max-age=86400; SameSite=Lax`;
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax";
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export function setStoredUser(user: User) {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user));
  }
}

export interface UserProfile {
  id: number;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  is_verified: boolean;
  follower_count: number;
  following_count: number;
  post_count: number;
  is_following: boolean;
  is_own_profile: boolean;
  created_at: string;
}

export async function fetchProfile(username: string): Promise<UserProfile> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/users/by-username/${username}`, { headers });

  if (!res.ok) {
    throw new ApiError("User not found", res.status);
  }

  return res.json();
}

export interface Subgrid {
  id: number;
  name: string;
  display_name: string | null;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  is_verified: boolean;
  is_nsfw: boolean;
  owner_id: number;
  owner: User | null;
  subscriber_count: number;
  moderator_count: number;
  is_subscribed?: boolean;
  created_at: string;
}

export interface SubgridCreate {
  name: string;
  display_name?: string;
  description?: string;
  is_nsfw?: boolean;
}

export async function fetchSubgrids(search?: string): Promise<Subgrid[]> {
  const token = localStorage.getItem("access_token");
  const params = search ? `?search=${encodeURIComponent(search)}` : "";
  const res = await fetch(`${API_BASE}/subgrids${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ApiError("Failed to fetch subgrids", res.status);
  return res.json();
}

export async function fetchSubgrid(id: number): Promise<Subgrid> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_BASE}/subgrids/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ApiError("Subgrid not found", res.status);
  return res.json();
}

export async function createSubgrid(data: SubgridCreate): Promise<Subgrid> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_BASE}/subgrids`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.detail ?? "Failed to create subgrid", res.status);
  }
  return res.json();
}

export async function toggleSubscribe(subgridId: number): Promise<{ subscribed: boolean; deleted?: boolean }> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_BASE}/subgrids/${subgridId}/subscribe`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ApiError("Failed to toggle subscription", res.status);
  return res.json();
}

export async function addModerator(subgridId: number, userId: number): Promise<void> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_BASE}/subgrids/${subgridId}/moderators?user_id=${userId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ApiError("Failed to add moderator", res.status);
}

export async function removeModerator(subgridId: number, userId: number): Promise<void> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_BASE}/subgrids/${subgridId}/moderators/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ApiError("Failed to remove moderator", res.status);
}

export async function fetchModerators(subgridId: number): Promise<User[]> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_BASE}/subgrids/${subgridId}/moderators`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ApiError("Failed to fetch moderators", res.status);
  return res.json();
}

// ── Stories ──

export interface StoryAuthorData {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
}

export interface StoryItemData {
  id: number;
  media_url: string;
  media_type: string;
  created_at: string;
  likes_count: number;
  is_liked: boolean;
}

export interface StoryGroupData {
  user_id: number;
  author: StoryAuthorData;
  stories: StoryItemData[];
}

export async function fetchStories(): Promise<StoryGroupData[]> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_BASE}/stories`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ApiError("Failed to fetch stories", res.status);
  return res.json();
}

export async function uploadStory(file: File): Promise<{ id: number; media_url: string; media_type: string; created_at: string }> {
  const token = localStorage.getItem("access_token");
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/stories`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new ApiError("Failed to upload story", res.status);
  return res.json();
}

export async function createStoryFromUrl(url: string, mediaType?: string): Promise<{ id: number; media_url: string; media_type: string; created_at: string }> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_BASE}/stories/from-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ url, media_type: mediaType ?? "image" }),
  });
  if (!res.ok) throw new ApiError("Failed to create story", res.status);
  return res.json();
}

export async function toggleStoryLike(storyId: number): Promise<{ liked: boolean; likes_count: number }> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_BASE}/stories/${storyId}/like`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ApiError("Failed to toggle story like", res.status);
  return res.json();
}

export async function fetchStoryFollowStatus(storyId: number): Promise<{ is_following: boolean; user_id: number }> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_BASE}/stories/${storyId}/follow-status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ApiError("Failed to fetch follow status", res.status);
  return res.json();
}
