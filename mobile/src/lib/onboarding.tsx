import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";

const KEY = "agrointel.onboarded";

interface OnboardingState {
  /** null while loading from storage */
  done: boolean | null;
  finish: () => void;
  /** Show onboarding again (Profile → "Replay intro"). */
  replay: () => void;
}

const OnboardingContext = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [done, setDone] = useState<boolean | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(KEY)
      .then((v) => setDone(v === "1"))
      .catch(() => setDone(false));
  }, []);

  const value: OnboardingState = {
    done,
    finish: () => {
      setDone(true);
      SecureStore.setItemAsync(KEY, "1").catch(() => undefined);
    },
    replay: () => {
      setDone(false);
      SecureStore.deleteItemAsync(KEY).catch(() => undefined);
    },
  };
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used inside OnboardingProvider");
  return ctx;
}
