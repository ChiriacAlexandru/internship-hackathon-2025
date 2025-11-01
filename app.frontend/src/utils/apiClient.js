const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const buildHeaders = (token, extra = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...extra,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const apiClient = async (path, { method = "GET", body, token, headers } = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(token, headers),
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message = payload?.error ?? `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

export const withErrorBoundary = async (fn) => {
  try {
    return await fn();
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
};

export default apiClient;
