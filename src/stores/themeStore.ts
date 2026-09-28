import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// Class `dark` di <html> yang membuat varian `dark:` Tailwind aktif.
const applyTheme = (theme: Theme) => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light",

      toggleTheme: () => get().setTheme(get().theme === "light" ? "dark" : "light"),

      setTheme: (theme: Theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    }
  )
);

export const useTheme = () => {
  const { theme, toggleTheme } = useThemeStore();
  return { theme, toggleTheme };
};
