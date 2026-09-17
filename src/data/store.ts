import { create } from "zustand";
import { type AppState, type Cartao, type Conta, type Meta, type TipoMovimentoMeta, defaultState, uid } from "./schema";

function inicioMesAtual(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

interface AppStore {
  /** Dados persistidos no arquivo JSON conectado. */
  data: AppState;
  /** true assim que um arquivo foi aberto/criado com sucesso. */
  connected: boolean;
  /** Preferência de sessão (não persistida no arquivo): oculta valores monetários na tela. */
  valoresOcultos: boolean;
  /** Mês exibido nas telas com navegação por mês (não persistido). */
  currentMonth: Date;
  hydrate: (data: AppState) => void;
  setConnected: (connected: boolean) => void;
  setValoresOcultos: (value: boolean) => void;
  setCurrentMonth: (date: Date) => void;

  addTag: (nome: string, cor: string) => void;
  renameTag: (id: string, nome: string) => void;
  deleteTag: (id: string) => void;

  saveConta: (conta: Conta) => void;
  setContaArquivada: (id: string, arquivada: boolean) => void;
  deleteConta: (id: string) => void;

  saveCartao: (cartao: Cartao) => void;
  setCartaoArquivada: (id: string, arquivada: boolean) => void;
  deleteCartao: (id: string) => void;

  saveMeta: (meta: Meta) => void;
  deleteMeta: (id: string) => void;
  setMetaConcluida: (id: string, concluida: boolean) => void;
  addMetaMovimento: (metaId: string, mov: { data: string; valor: number; tipo: TipoMovimentoMeta }) => void;
  deleteMetaMovimento: (metaId: string, movId: string) => void;
}

function recalcularValorAtual(movimentos: Meta["movimentos"]): number {
  return movimentos.reduce((sum, mv) => sum + (mv.tipo === "saida" ? -mv.valor : mv.valor), 0);
}

export const useAppStore = create<AppStore>((set) => ({
  data: defaultState(),
  connected: false,
  valoresOcultos: false,
  currentMonth: inicioMesAtual(),
  hydrate: (data) => set({ data, connected: true }),
  setConnected: (connected) => set({ connected }),
  setValoresOcultos: (valoresOcultos) => set({ valoresOcultos }),
  setCurrentMonth: (currentMonth) => set({ currentMonth }),

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

  saveConta: (conta) =>
    set((s) => {
      let contas = conta.padrao ? s.data.contas.map((c) => ({ ...c, padrao: false })) : s.data.contas;
      const idx = contas.findIndex((c) => c.id === conta.id);
      contas = idx >= 0 ? contas.map((c, i) => (i === idx ? conta : c)) : [...contas, conta];
      return { data: { ...s.data, contas } };
    }),

  setContaArquivada: (id, arquivada) =>
    set((s) => ({
      data: { ...s.data, contas: s.data.contas.map((c) => (c.id === id ? { ...c, arquivada } : c)) },
    })),

  deleteConta: (id) =>
    set((s) => ({ data: { ...s.data, contas: s.data.contas.filter((c) => c.id !== id) } })),

  saveCartao: (cartao) =>
    set((s) => {
      let cartoes = cartao.padrao ? s.data.cartoes.map((c) => ({ ...c, padrao: false })) : s.data.cartoes;
      const idx = cartoes.findIndex((c) => c.id === cartao.id);
      cartoes = idx >= 0 ? cartoes.map((c, i) => (i === idx ? cartao : c)) : [...cartoes, cartao];
      return { data: { ...s.data, cartoes } };
    }),

  setCartaoArquivada: (id, arquivada) =>
    set((s) => ({
      data: { ...s.data, cartoes: s.data.cartoes.map((c) => (c.id === id ? { ...c, arquivada } : c)) },
    })),

  deleteCartao: (id) =>
    set((s) => ({ data: { ...s.data, cartoes: s.data.cartoes.filter((c) => c.id !== id) } })),

  saveMeta: (meta) =>
    set((s) => {
      const idx = s.data.metas.findIndex((m) => m.id === meta.id);
      const metas = idx >= 0 ? s.data.metas.map((m, i) => (i === idx ? meta : m)) : [...s.data.metas, meta];
      return { data: { ...s.data, metas } };
    }),

  deleteMeta: (id) => set((s) => ({ data: { ...s.data, metas: s.data.metas.filter((m) => m.id !== id) } })),

  setMetaConcluida: (id, concluida) =>
    set((s) => ({
      data: { ...s.data, metas: s.data.metas.map((m) => (m.id === id ? { ...m, concluida } : m)) },
    })),

  addMetaMovimento: (metaId, mov) =>
    set((s) => ({
      data: {
        ...s.data,
        metas: s.data.metas.map((m) => {
          if (m.id !== metaId) return m;
          const movimentos = [...m.movimentos, { id: uid("metamov"), ...mov }];
          const valorAtual = recalcularValorAtual(movimentos);
          const concluida = m.concluida || (m.valorAlvo > 0 && valorAtual >= m.valorAlvo);
          return { ...m, movimentos, valorAtual, concluida };
        }),
      },
    })),

  deleteMetaMovimento: (metaId, movId) =>
    set((s) => ({
      data: {
        ...s.data,
        metas: s.data.metas.map((m) => {
          if (m.id !== metaId) return m;
          const movimentos = m.movimentos.filter((mv) => mv.id !== movId);
          return { ...m, movimentos, valorAtual: recalcularValorAtual(movimentos) };
        }),
      },
    })),
}));
