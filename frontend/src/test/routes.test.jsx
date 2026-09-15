import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: {
          use: vi.fn(),
        },
      },
      post: mockPost,
      get: mockGet,
      put: vi.fn(),
    })),
  },
}));

vi.mock("react-dom/client", () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
  })),
}));

describe("ProCV - routes protégées", () => {
  beforeEach(() => {
    localStorage.clear();
    mockGet.mockReset();
    mockPost.mockReset();
    window.history.pushState({}, "", "/tableau-de-bord");
  });

  it("redirige un utilisateur non connecté vers la connexion", async () => {
    const { App } = await import("../main.jsx");

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "ProCV", level: 1 })
      ).toBeInTheDocument();

      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Mot de passe")).toBeInTheDocument();
    });
  });

  it("affiche le tableau de bord pour un utilisateur connecté", async () => {
    localStorage.setItem("procv_token", "test-jwt-token");
    localStorage.setItem("procv_plan", "FREE");

    mockGet.mockResolvedValueOnce({
      data: [],
    });

    const { App } = await import("../main.jsx");

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Mes CV", level: 1 })
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Plan FREE")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "+ Nouveau CV" })
    ).toBeInTheDocument();

    expect(mockGet).toHaveBeenCalledWith("/cv");
  });
});
