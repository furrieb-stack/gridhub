"use client";

import { useEffect } from "react";
import { getStoredUser } from "@/lib/api";

const VAPID_PUBLIC_KEY = "BOH3zi1FnLgkrlzpst1xZkqtgktCC9QtsuvrPPMQ32EnCyZ1LMSNisOxn95IZZjLzAVmQ1V7-5v4MwImegsB3XI";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output as unknown as Uint8Array<ArrayBuffer>;
}

async function saveSubscriptionOnServer(subJSON: string) {
  const token = localStorage.getItem("access_token");
  if (!token) return;
  try {
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subscription: JSON.parse(subJSON) }),
    });
  } catch {}
}

async function subscribe(reg: ServiceWorkerRegistration) {
  const existing = localStorage.getItem("push_subscription");
  if (existing) {
    try {
      const currentSub = await reg.pushManager.getSubscription();
      if (currentSub && JSON.stringify(currentSub.toJSON()) === existing) {
        return;
      }
    } catch {}
  }

  try {
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    const subJSON = JSON.stringify(sub.toJSON());
    localStorage.setItem("push_subscription", subJSON);
    await saveSubscriptionOnServer(subJSON);
  } catch (e) {
    console.error("Push subscription failed:", e);
  }
}

export async function requestPushSubscription() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    if (Notification.permission === "default") {
      const perm = await Notification.requestPermission();
      if (perm === "granted") await subscribe(reg);
    } else if (Notification.permission === "granted") {
      await subscribe(reg);
    }
  } catch (err) {
    console.error("Failed to request push subscription:", err);
  }
}

export default function PushManager() {
  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;

    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        if (Notification.permission === "granted") {
          subscribe(reg);
        }
      }).catch(console.error);
    }
  }, []);

  return null;
}