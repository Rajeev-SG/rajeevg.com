"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded border border-black/10 dark:border-white/20 px-3 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
    >
      {isDark ? "Switch to Light" : "Switch to Dark"}
    </button>
  );
}
