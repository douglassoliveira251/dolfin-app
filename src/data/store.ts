import { create } from "zustand";

interface AppStore {
  ready: boolean;
}

export const useAppStore = create<AppStore>(() => ({
  ready: true,
}));
