import { create } from "zustand";
import { type AppState, defaultState, uid } from "./schema";

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

  addTag: (nome: string, cor: string) => void;
  renameTag: (id: string, nome: string) => void;
  deleteTag: (id: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  data: defaultState(),
  connected: false,
  valoresOcultos: false,
  hydrate: (data) => set({ data, connected: true }),
  setConnected: (connected) => set({ connected }),
  setValoresOcultos: (valoresOcultos) => set({ valoresOcultos }),

  addTag: (nome, cor) =>
    set((s) => ({ data: { ...s.data, tags: [...s.data.tags, { id: uid("tag"), nome, cor }] } })),

  renameTag: (id, nome) =>
    set((s) => ({
      data: { ...s.data, tags: s.data.tags.map((t) => (t.id === id ? { ...t, nome } : t)) },
    })),

  deleteTag: (id) =>
    set((s) => ({
      data: {
        ...s.data,
        tags: s.data.tags.filter((t) => t.id !== id),
        lancamentos: s.data.lancamentos.map((l) =>
          l.tagsIds.includes(id) ? { ...l, tagsIds: l.tagsIds.filter((tid) => tid !== id) } : l,
        ),
        investimentos: {
          ...s.data.investimentos,
          aportes: s.data.investimentos.aportes.map((a) =>
            a.tagsIds.includes(id) ? { ...a, tagsIds: a.tagsIds.filter((tid) => tid !== id) } : a,
          ),
        },
      },
    })),
}));
