"use client";

import { createContext, useContext } from "react";

type StudioNavContextValue = {
  openDrawer: () => void;
};

export const StudioNavContext = createContext<StudioNavContextValue | null>(null);

export function useStudioNav() {
  return useContext(StudioNavContext);
}
