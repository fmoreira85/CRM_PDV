import { getApiBaseUrl } from "./config.js";

export const buildQuery = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    searchParams.append(key, value);
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const apiRequest = async (path, options = {}) => {
  const { auth = true, headers = {}, body, ...rest } = options;
  const baseUrl = getApiBaseUrl();
  const token = auth ? localStorage.getItem("auth_token") : null;

  const finalHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  let finalBody = body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    finalBody = JSON.stringify(body);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    headers: finalHeaders,
    body: finalBody,
    ...rest,
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text || "Request failed";
    try {
      const payload = JSON.parse(text);
      message = payload.message || message;
    } catch (error) {
      // fallback to raw text
    }
    throw new Error(message);
  }

  return response.json();
};
