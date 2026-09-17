import { create } from "zustand";
import { type AppState, defaultState } from "./schema";

interface AppStore {
  /** Dados persistidos no arquivo JSON conectado. */
  data: AppState;
  /** true assim que um arquivo foi aberto/criado com sucesso. */
  connected: boolean;
  /** Preferência de sessão (não persistida no arquivo): oculta valores monetários na tela. */
  valoresOcultos: boolean;
  hydrate: (data: AppState) => void;
  setConnected: (connected: boolean) => void;
  setValoresOcultos: (value: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  data: defaultState(),
  connected: false,
  valoresOcultos: false,
  hydrate: (data) => set({ data, connected: true }),
  setConnected: (connected) => set({ connected }),
  setValoresOcultos: (valoresOcultos) => set({ valoresOcultos }),
}));
