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
});
