import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";

vi.mock("./auth", () => ({
  getToken: vi.fn(() => null),
  tryRefresh: vi.fn(async () => null),
  logout: vi.fn(async () => {}),
  apiFetch: vi.fn(),
  AUTH_REQUIRED: "AUTH_REQUIRED",
}));

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el login cuando no hay token ni refresh válido", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/iniciar sesión/i)).toBeInTheDocument();
    });
  });

  it("hace UN solo GET /todos cuando el refresh tiene éxito", async () => {
    const tryRefreshMock = vi.fn(async () => "new-token");
    const apiFetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => [],
    }));
    const { getToken: _getToken, tryRefresh, apiFetch, logout: _logout, AUTH_REQUIRED: _AUTH_REQUIRED } =
      await import("./auth");
    vi.mocked(tryRefresh).mockImplementation(tryRefreshMock);
    vi.mocked(apiFetch).mockImplementation(apiFetchMock);

    render(<App />);

    await waitFor(() => {
      expect(tryRefresh).toHaveBeenCalledTimes(1);
      expect(apiFetch).toHaveBeenCalledTimes(1);
    });
  });

  it("NO hace GET /todos si tryRefresh falla", async () => {
    const tryRefreshMock = vi.fn(async () => null);
    const apiFetchMock = vi.fn();
    const { getToken: _getToken, tryRefresh, apiFetch, logout: _logout, AUTH_REQUIRED: _AUTH_REQUIRED } =
      await import("./auth");
    vi.mocked(tryRefresh).mockImplementation(tryRefreshMock);
    vi.mocked(apiFetch).mockImplementation(apiFetchMock);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/iniciar sesión/i)).toBeInTheDocument();
    });

    expect(tryRefresh).toHaveBeenCalledTimes(1);
    expect(apiFetch).not.toHaveBeenCalled();
  });
});
