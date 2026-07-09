import type { Metadata } from "next";
import PostDetailClient from "./PostDetailClient";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${API_BASE}/meta/post/${id}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        title: data.title,
        description: data.description,
        openGraph: {
          title: data.title,
          description: data.description,
          url: `${SITE_URL}/post/${id}`,
          type: "article",
          images: data.image ? [{ url: data.image.startsWith("http") ? data.image : `${SITE_URL}${data.image}`, width: 1200, height: 630 }] : [],
        },
        twitter: {
          card: "summary_large_image",
          title: data.title,
          description: data.description,
          images: data.image ? [data.image.startsWith("http") ? data.image : `${SITE_URL}${data.image}`] : [],
        },
        alternates: { canonical: `${SITE_URL}/post/${id}` },
        robots: { index: true, follow: true },
      };
    }
  } catch {}

  return {
    title: "Post | Gridhub",
    description: "View post on Gridhub",
    alternates: { canonical: `${SITE_URL}/post/${id}` },
  };
}

export default function PostDetailPage() {
  return <PostDetailClient />;
}
