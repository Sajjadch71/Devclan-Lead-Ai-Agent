const GHL_BASE_URL = "https://services.leadconnectorhq.com";

export async function ghlRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${GHL_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.GHL_PRIVATE_TOKEN}`,
      Version: "2021-07-28",
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
   console.error("GHL ERROR:", text);
throw new Error(`GHL ERROR: ${text}`);
  }

  return response.json();
}
