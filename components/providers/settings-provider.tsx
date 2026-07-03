"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type AppSettings,
  type Density,
  type TimeFormat,
} from "@/lib/settings";

interface SettingsContextValue extends AppSettings {
  hydrated: boolean;
  setTimeFormat: (format: TimeFormat) => void;
  setDensity: (density: Density) => void;
  setBrowserNotifications: (enabled: boolean) => void;
  setOperatorTimezone: (timezone: string) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setSettings(loadSettings());
      setHydrated(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const persist = useCallback((next: AppSettings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  const setTimeFormat = useCallback((timeFormat: TimeFormat) => {
    setSettings((prev) => {
      const next = { ...prev, timeFormat };
      saveSettings(next);
      return next;
    });
  }, []);

  const setDensity = useCallback((density: Density) => {
    setSettings((prev) => {
      const next = { ...prev, density };
      saveSettings(next);
      return next;
    });
  }, []);

  const setBrowserNotifications = useCallback((browserNotifications: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, browserNotifications };
      saveSettings(next);
      return next;
    });
  }, []);

  const setOperatorTimezone = useCallback((operatorTimezone: string) => {
    setSettings((prev) => {
      const next = { ...prev, operatorTimezone };
      saveSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => persist(DEFAULT_SETTINGS), [persist]);

  const value = useMemo(
    () => ({
      ...settings,
      hydrated,
      setTimeFormat,
      setDensity,
      setBrowserNotifications,
      setOperatorTimezone,
      resetSettings,
    }),
    [
      settings,
      hydrated,
      setTimeFormat,
      setDensity,
      setBrowserNotifications,
      setOperatorTimezone,
      resetSettings,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
}
