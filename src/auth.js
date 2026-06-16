const AUTH_URL = import.meta.env.VITE_AUTH_URL;
const TOKEN_KEY = "todo_access_token";

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export async function requestOtp(email) {
  const res = await fetch(`${AUTH_URL}/request-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Error al solicitar el código OTP");
  }

  return true;
}

export async function verifyOtp(email, otp) {
  const res = await fetch(`${AUTH_URL}/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, otp }),
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Código inválido o expirado");
  }

  const data = await res.json();
  const token = data.accessToken;
  sessionStorage.setItem(TOKEN_KEY, token);
  return token;
}

export async function tryRefresh() {
  const res = await fetch(`${AUTH_URL}/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  const token = data.accessToken;
  sessionStorage.setItem(TOKEN_KEY, token);
  return token;
}

export async function logout() {
  try {
    await fetch(`${AUTH_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (e) {
    console.warn("Logout request failed", e);
  }
  sessionStorage.removeItem(TOKEN_KEY);
}

export const AUTH_REQUIRED = "AUTH_REQUIRED";

export async function apiFetch(url, options = {}) {
  const token = getToken();

  const headers = {
    ...options.headers,
    Origin: window.location.origin,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === "string") {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401 || res.status === 403) {
    sessionStorage.removeItem(TOKEN_KEY);
    throw new Error(AUTH_REQUIRED);
  }

  return res;
}