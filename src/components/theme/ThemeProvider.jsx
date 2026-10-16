"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
// v2: the default moved from dark to light. The old key was written on every
// visit whether or not anyone chose a theme, so reusing it would have kept
// almost every returning visitor on dark.
export const THEME_STORAGE_KEY = "mt-theme-v2";
const ThemeContext = createContext(null);
function systemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
function readSetting() {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light" || stored === "system") {
      return stored;
    }
  } catch {
    // Private mode, or site data blocked. The default is a fine answer.
  }
  return "light";
}
/**
 * The script that runs before the first paint.
 *
 * It is stringified into the document head so it executes ahead of any CSS
 * paint — without it a visitor on paper gets a black flash on every cold load.
 * It must stay dependency-free and small enough to inline, and it must never
 * throw: `localStorage` raises in some embedded contexts, so the whole body is
 * wrapped. Falling through to the light default is always safe.
 */
export const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var s=localStorage.getItem(k);if(s!=="dark"&&s!=="light"&&s!=="system")s="light";var t=s==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):s;document.documentElement.setAttribute("data-theme",t);document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;
export function ThemeProvider({ children }) {
  // Server-render the brand default. The inline script has already corrected
  // the DOM by the time this hydrates, and the effect below re-syncs state.
  const [setting, setSettingState] = useState("light");
  const [theme, setTheme] = useState("light");
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
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const resolved = mq.matches ? "dark" : "light";
      setTheme(resolved);
      document.documentElement.setAttribute("data-theme", resolved);
      document.documentElement.style.colorScheme = resolved;
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [setting]);
  const setSetting = useCallback((next) => {
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
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
/**
 * Read the theme. Safe outside the provider — admin and error boundaries render
 * without it — where it reports the light default and treats writes as no-ops.
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx;
  return {
    setting: "light",
    theme: "light",
    setSetting: () => {},
    toggle: () => {},
  };
}
