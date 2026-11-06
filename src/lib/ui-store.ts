"use client";

import { create } from "zustand";

type UiState = {
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  navOpen: false,
  setNavOpen: (navOpen) => set({ navOpen }),
}));
