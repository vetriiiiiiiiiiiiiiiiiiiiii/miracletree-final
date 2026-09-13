"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Theme state.
 *
 * Three settings, two grounds. "system" is a *setting*, not a ground: the
 * inline script in the document head resolves it to a concrete `data-theme`
 * before first paint, and this provider keeps doing so as the OS preference
 * changes. Everything downstream — CSS, canvases, charts — only ever reads the
 * resolved value, so nothing has to know that "system" exists.
 */
export type ThemeSetting = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

export const THEME_STORAGE_KEY = "mt-theme";

type ThemeContextValue = {
  /** What the visitor chose. */
  setting: ThemeSetting;
  /** What is actually painted right now. */
  theme: ResolvedTheme;
  setSetting: (next: ThemeSetting) => void;
  /** Flip to the opposite of what is on screen, and pin it. */
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function readSetting(): ThemeSetting {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light" || stored === "system") {
      return stored;
    }
  } catch {
    // Private mode, or site data blocked. The default is a fine answer.
  }
  return "dark";
}

/**
 * The script that runs before the first paint.
 *
 * It is stringified into the document head so it executes ahead of any CSS
 * paint — without it a visitor on paper gets a black flash on every cold load.
 * It must stay dependency-free and small enough to inline, and it must never
 * throw: `localStorage` raises in some embedded contexts, so the whole body is
 * wrapped. Falling through to the dark default is always safe.
 */
export const themeInitScript = `(function(){try{var k=${JSON.stringify(
  THEME_STORAGE_KEY,
)};var s=localStorage.getItem(k);if(s!=="dark"&&s!=="light"&&s!=="system")s="dark";var t=s==="system"?(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"):s;document.documentElement.setAttribute("data-theme",t);document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Server-render the brand default. The inline script has already corrected
  // the DOM by the time this hydrates, and the effect below re-syncs state.
  const [setting, setSettingState] = useState<ThemeSetting>("dark");
  const [theme, setTheme] = useState<ResolvedTheme>("dark");

  // Adopt whatever the inline script decided, once, on mount.
  useEffect(() => {
    const stored = readSetting();
    setSettingState(stored);
    setTheme(stored === "system" ? systemTheme() : stored);
  }, []);

  // Paint the resolved theme and remember the setting.
  useEffect(() => {
    const resolved = setting === "system" ? systemTheme() : setting;
    setTheme(resolved);
    document.documentElement.setAttribute("data-theme", resolved);
    document.documentElement.style.colorScheme = resolved;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, setting);
    } catch {
      // Not being able to remember the choice is not a reason to refuse it.
    }
  }, [setting]);

  // Follow the OS while — and only while — the visitor is on "system".
  useEffect(() => {
    if (setting !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      const resolved = mq.matches ? "light" : "dark";
      setTheme(resolved);
      document.documentElement.setAttribute("data-theme", resolved);
      document.documentElement.style.colorScheme = resolved;
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [setting]);

  const setSetting = useCallback((next: ThemeSetting) => {
    setSettingState(next);
  }, []);

  const toggle = useCallback(() => {
    // Toggling acts on what is on screen, which is the only thing the visitor
    // can see. From "system" that means pinning the opposite of the OS.
    setSettingState((current) => {
      const resolved = current === "system" ? systemTheme() : current;
      return resolved === "dark" ? "light" : "dark";
    });
  }, []);

  const value = useMemo(
    () => ({ setting, theme, setSetting, toggle }),
    [setting, theme, setSetting, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Read the theme. Safe outside the provider — admin and error boundaries render
 * without it — where it reports the dark default and treats writes as no-ops.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx;
  return {
    setting: "dark",
    theme: "dark",
    setSetting: () => {},
    toggle: () => {},
  };
}
