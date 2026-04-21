import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider } from "@/lib/i18n";
import HeroSearch from "@/components/hero-search";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

function renderSearch() {
  return render(
    <I18nProvider>
      <HeroSearch />
    </I18nProvider>
  );
}

describe("HeroSearch", () => {
  it("renders search labels in Russian by default", () => {
    renderSearch();
    expect(screen.getAllByText("Что планируете?").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Где?").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Когда?").length).toBeGreaterThan(0);
  });

  it("renders search button", () => {
    renderSearch();
    // Desktop and mobile versions
    expect(screen.getAllByText("Найти").length).toBeGreaterThan(0);
  });

  it("navigates to catalog on search click", async () => {
    renderSearch();
    pushMock.mockClear();
    // Click the desktop search button (first "Найти")
    const buttons = screen.getAllByText("Найти");
    await act(async () => {
      await userEvent.click(buttons[0]);
    });
    expect(pushMock).toHaveBeenCalledWith("/catalog");
  });

  it("includes activity param when selected", async () => {
    renderSearch();
    pushMock.mockClear();

    // Find the hidden select for activity (desktop version) and change it
    const selects = document.querySelectorAll("select");
    // First select is activity
    await act(async () => {
      await userEvent.selectOptions(selects[0], "production");
    });

    const buttons = screen.getAllByText("Найти");
    await act(async () => {
      await userEvent.click(buttons[0]);
    });

    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining("activity=production"));
  });

  it("includes city param when selected", async () => {
    renderSearch();
    pushMock.mockClear();

    const selects = document.querySelectorAll("select");
    // Second select is city (desktop: selects[0]=activity hidden, selects[1]=city hidden, selects[2]=activity mobile, selects[3]=city mobile)
    await act(async () => {
      await userEvent.selectOptions(selects[1], "almaty");
    });

    const buttons = screen.getAllByText("Найти");
    await act(async () => {
      await userEvent.click(buttons[0]);
    });

    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining("city=almaty"));
  });
});
