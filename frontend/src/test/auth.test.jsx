import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

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
      get: vi.fn(),
      put: vi.fn(),
    })),
  },
}));

vi.mock("react-dom/client", () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
  })),
}));

describe("ProCV - authentification", () => {
  beforeEach(() => {
    localStorage.clear();
    mockPost.mockReset();
    window.history.pushState({}, "", "/connexion");
  });

  it("affiche correctement la page de connexion", async () => {
    const { App } = await import("../main.jsx");

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(
      screen.getByRole("heading", { name: "ProCV", level: 1 })
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Mot de passe")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Se connecter" })
    ).toBeInTheDocument();
  });

  it("connecte correctement un utilisateur", async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        token: "test-jwt-token",
        plan: "FREE",
      },
    });

    const { App } = await import("../main.jsx");

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@procv.com" },
    });

    fireEvent.change(screen.getByLabelText("Mot de passe"), {
      target: { value: "Password123!" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Se connecter" })
    );

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/auth/connexion", {
        nomComplet: "",
        telephone: "",
        email: "test@procv.com",
        motDePasse: "Password123!",
      });
    });

    await waitFor(() => {
      expect(localStorage.getItem("procv_token")).toBe("test-jwt-token");
      expect(localStorage.getItem("procv_plan")).toBe("FREE");
    });
  });

  it("affiche une erreur lorsque la connexion échoue", async () => {
    mockPost.mockRejectedValueOnce({
      response: {
        data: {
          erreur: "Identifiants invalides",
        },
      },
    });

    const { App } = await import("../main.jsx");

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "wrong@procv.com" },
    });

    fireEvent.change(screen.getByLabelText("Mot de passe"), {
      target: { value: "WrongPassword123!" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Se connecter" })
    );

    await waitFor(() => {
      expect(screen.getByText("Identifiants invalides")).toBeInTheDocument();
    });

    expect(localStorage.getItem("procv_token")).toBeNull();
  });
});
