"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg bg-white dark:bg-white border border-gray-200 dark:border-gray-300">
        <div className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-lg bg-white dark:bg-white border border-gray-200 dark:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <SunIcon className="w-5 h-5 text-orangeColorDull" />
      ) : (
        <MoonIcon className="w-5 h-5 text-blueColorDull" />
      )}
    </button>
  );
}
