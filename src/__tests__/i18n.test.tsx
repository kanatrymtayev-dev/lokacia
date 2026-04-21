import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider, useT } from "@/lib/i18n";

function TestComponent() {
  const { lang, setLang, t } = useT();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="nav-browse">{t("nav.browse")}</span>
      <span data-testid="hero-title">{t("hero.title2")}</span>
      <span data-testid="with-params">{t("onboarding.stepOf", { n: "2" })}</span>
      <span data-testid="missing-key">{t("nonexistent.key")}</span>
      <button data-testid="switch-en" onClick={() => setLang("en")}>EN</button>
      <button data-testid="switch-kz" onClick={() => setLang("kz")}>KZ</button>
      <button data-testid="switch-ru" onClick={() => setLang("ru")}>RU</button>
    </div>
  );
}

function renderWithI18n() {
  return render(
    <I18nProvider>
      <TestComponent />
    </I18nProvider>
  );
}

describe("i18n", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to Russian", () => {
    renderWithI18n();
    expect(screen.getByTestId("lang")).toHaveTextContent("ru");
    expect(screen.getByTestId("nav-browse")).toHaveTextContent("Найти локацию");
    expect(screen.getByTestId("hero-title")).toHaveTextContent("локацию");
  });

  it("switches to English", async () => {
    renderWithI18n();
    await act(async () => {
      await userEvent.click(screen.getByTestId("switch-en"));
    });
    expect(screen.getByTestId("lang")).toHaveTextContent("en");
    expect(screen.getByTestId("nav-browse")).toHaveTextContent("Browse Locations");
    expect(screen.getByTestId("hero-title")).toHaveTextContent("Location");
  });

  it("switches to Kazakh", async () => {
    renderWithI18n();
    await act(async () => {
      await userEvent.click(screen.getByTestId("switch-kz"));
    });
    expect(screen.getByTestId("lang")).toHaveTextContent("kz");
    expect(screen.getByTestId("nav-browse")).toHaveTextContent("Локация іздеу");
  });

  it("supports parameter substitution", () => {
    renderWithI18n();
    expect(screen.getByTestId("with-params")).toHaveTextContent("Шаг 2 из 3");
  });

  it("falls back to key for missing translations", () => {
    renderWithI18n();
    expect(screen.getByTestId("missing-key")).toHaveTextContent("nonexistent.key");
  });

  it("persists language in localStorage", async () => {
    renderWithI18n();
    await act(async () => {
      await userEvent.click(screen.getByTestId("switch-en"));
    });
    expect(localStorage.getItem("lokacia_lang")).toBe("en");
  });
});
