import { NextRequest } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  const { type, id } = await params;

  try {
    const res = await fetch(`${API_BASE}/meta/${type}/${id}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return renderFallback(type, id);
    }

    const data = await res.json();
    const imageTag = data.image
      ? `<meta property="og:image" content="${escapeHtml(data.image)}" />
<meta name="twitter:image" content="${escapeHtml(data.image)}" />`
      : "";

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(data.title)} | Gridhub</title>
<meta property="og:title" content="${escapeHtml(data.title)}" />
<meta property="og:description" content="${escapeHtml(data.description)}" />
<meta property="og:url" content="${SITE_URL}${escapeHtml(data.url)}" />
<meta property="og:type" content="${escapeHtml(data.type)}" />
<meta property="og:site_name" content="Gridhub" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(data.title)}" />
<meta name="twitter:description" content="${escapeHtml(data.description)}" />
${imageTag}
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${SITE_URL}${escapeHtml(data.url)}" />
</head>
<body>
<script>window.location.href = "${SITE_URL}${escapeHtml(data.url)}";</script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch {
    return renderFallback(type, id);
  }
}

function renderFallback(type: string, id: string) {
  const name = type === "post" ? "Post" : type === "user" ? "User" : type === "subgrid" ? "Community" : "Page";
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${name} | Gridhub</title>
<meta property="og:title" content="${name} | Gridhub" />
<meta property="og:description" content="Gridhub — social network for developers" />
<meta property="og:site_name" content="Gridhub" />
<meta name="twitter:card" content="summary" />
<meta name="robots" content="noindex, nofollow" />
</head>
<body>
<script>window.location.href = "${SITE_URL}/${type === "user" ? "@" : type === "subgrid" ? "subgrids/" : type + "/"}${id}";</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
