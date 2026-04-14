const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export async function getCampaignPage(slug: string) {
  const response = await fetch(`${API_BASE_URL}/public/campaign-pages/${slug}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać strony kampanii");
  }

  return response.json();
}

export async function trackEvent(payload: {
  type: string;
  organizationId: string;
  campaignId?: string;
  redirectLinkId?: string;
  nfcTagId?: string;
  sessionId?: string;
  payload?: unknown;
}) {
  const response = await fetch(`${API_BASE_URL}/events/public`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Nie udało się zapisać eventu");
  }

  return response.json();
}