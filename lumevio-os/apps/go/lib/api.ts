const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

export async function getCampaignPage(slug: string) {
  const response = await fetch(`${API_URL}/api/campaign-pages/public/${slug}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać strony kampanii");
  }

  return response.json();
}

export async function trackEvent(input: {
  type: string;
  organizationId: string;
  campaignId?: string;
  redirectLinkId?: string;
  nfcTagId?: string;
  sessionId?: string;
  payload?: Record<string, unknown>;
}) {
  const response = await fetch(`${API_URL}/api/events/track`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Nie udało się zapisać eventu");
  }

  return response.json();
}