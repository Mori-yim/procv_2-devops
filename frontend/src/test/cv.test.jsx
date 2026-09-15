import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: {
          use: vi.fn(),
        },
      },
      get: mockGet,
      post: mockPost,
      put: mockPut,
    })),
  },
}));

vi.mock("react-dom/client", () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
  })),
}));

describe("ProCV - création de CV", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("procv_token", "test-jwt-token");
    localStorage.setItem("procv_plan", "FREE");

    mockGet.mockReset();
    mockPost.mockReset();
    mockPut.mockReset();

    window.history.pushState({}, "", "/cv/nouveau");
  });

  it("affiche correctement le formulaire de nouveau CV", async () => {
    const { App } = await import("../main.jsx");

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(
      screen.getByRole("heading", { name: "Nouveau CV", level: 1 })
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Titre")).toBeInTheDocument();

    const textInputs = screen.getAllByRole("textbox");

    expect(textInputs.length).toBeGreaterThanOrEqual(6);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Ville")).toBeInTheDocument();
  });

  it("enregistre correctement un nouveau CV", async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        id: 1,
        titre: "CV Développeur Full-Stack",
      },
    });

    const { App } = await import("../main.jsx");

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    const textInputs = screen.getAllByRole("textbox");

    fireEvent.change(screen.getByLabelText("Titre"), {
      target: { value: "CV Développeur Full-Stack" },
    });

    fireEvent.change(textInputs[1], {
      target: { value: "Morino Yimfack" },
    });

    fireEvent.change(textInputs[2], {
      target: { value: "Développeur Full-Stack" },
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "morino@example.com" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /enregistrer/i })
    );

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        "/cv",
        expect.objectContaining({
          titre: "CV Développeur Full-Stack",
          prenomNom: "Morino Yimfack",
          posteVise: "Développeur Full-Stack",
          email: "morino@example.com",
        })
      );
    });
  });
});
