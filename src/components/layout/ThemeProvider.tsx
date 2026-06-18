import { useEffect } from "react";
import { useUIStore } from "@/lib/store/uiStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeMode, themePalette, pureBlack } = useUIStore();

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");
    if (themeMode === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(themeMode);
    }

    if (pureBlack) {
      root.setAttribute("data-pure-black", "true");
    } else {
      root.removeAttribute("data-pure-black");
    }

    root.setAttribute("data-theme", themePalette);

  }, [themeMode, themePalette, pureBlack]);

  useEffect(() => {
    if (themeMode !== "system") return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(mediaQuery.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [themeMode]);

  return <>{children}</>;
}
