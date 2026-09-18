import { create } from "zustand";
import { nowLocalIso } from "./format";
import {
  type Aporte,
  type AppState,
  type Ativo,
  type AtualizacaoAtivo,
  type Cartao,
  type Categoria,
  type Configuracoes,
  type Conta,
  type Lancamento,
  type Meta,
  type Orcamento,
  type TipoMovimentoMeta,
  defaultState,
  uid,
} from "./schema";

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

  /** Retorna o id da tag criada, para poder selecioná-la imediatamente (ex: TagsInput). */
  addTag: (nome: string, cor: string) => string;
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

  saveCategoria: (categoria: Categoria) => void;
  setCategoriaArquivada: (id: string, arquivada: boolean) => void;
  deleteCategoria: (id: string) => void;
  deleteCategoriasComFilhas: (ids: string[]) => void;
  /** Garante a categoria única de "Aportes" (investimento) usada pelo orçamento, criando-a se preciso. */
  getOrCreateCategoriaOrcamentoInvestimento: () => Categoria;

  saveOrcamento: (orcamento: Orcamento) => void;
  addOrcamentos: (orcamentos: Orcamento[]) => void;
  deleteOrcamento: (id: string) => void;

  saveAtivo: (ativo: Ativo) => void;
  deleteAtivoComHistorico: (id: string) => void;

  saveAporte: (aporte: Aporte) => void;
  deleteAporte: (id: string) => void;
  registrarTransferenciaAtivo: (origemId: string, destinoId: string, valor: number, data: string) => void;

  saveAtualizacaoAtivo: (atualizacao: AtualizacaoAtivo) => void;
  deleteAtualizacaoAtivo: (id: string) => void;

  saveLancamento: (lancamento: Lancamento) => void;
  addLancamentos: (lancamentos: Lancamento[]) => void;
  deleteLancamento: (id: string) => void;
  deleteLancamentosSerie: (grupoId: string, fromDate?: string) => void;
  toggleEfetivadoLancamento: (id: string) => void;
  /** Aplica um patch a todos os membros de uma série recorrente (exceto o id informado). */
  updateLancamentosSerie: (grupoId: string, patch: Partial<Lancamento>, excludeId?: string) => void;
  updateConfiguracoes: (patch: Partial<Configuracoes>) => void;
}

function recalcularValorAtual(movimentos: Meta["movimentos"]): number {
  return movimentos.reduce((sum, mv) => sum + (mv.tipo === "saida" ? -mv.valor : mv.valor), 0);
}

export const useAppStore = create<AppStore>((set, get) => ({
  data: defaultState(),
  connected: false,
  valoresOcultos: false,
  currentMonth: inicioMesAtual(),
  hydrate: (data) => set({ data, connected: true }),
  setConnected: (connected) => set({ connected }),
  setValoresOcultos: (valoresOcultos) => set({ valoresOcultos }),
  setCurrentMonth: (currentMonth) => set({ currentMonth }),

  addTag: (nome, cor) => {
    const id = uid("tag");
    set((s) => ({ data: { ...s.data, tags: [...s.data.tags, { id, nome, cor }] } }));
    return id;
  },

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

  saveCategoria: (categoria) =>
    set((s) => {
      const idx = s.data.categorias.findIndex((c) => c.id === categoria.id);
      const categorias = idx >= 0 ? s.data.categorias.map((c, i) => (i === idx ? categoria : c)) : [...s.data.categorias, categoria];
      return { data: { ...s.data, categorias } };
    }),

  setCategoriaArquivada: (id, arquivada) =>
    set((s) => ({
      data: { ...s.data, categorias: s.data.categorias.map((c) => (c.id === id ? { ...c, arquivada } : c)) },
    })),

  deleteCategoria: (id) =>
    set((s) => ({
      data: {
        ...s.data,
        categorias: s.data.categorias.filter((c) => c.id !== id),
        lancamentos: s.data.lancamentos.map((l) =>
          l.categoriasIds.includes(id) ? { ...l, categoriasIds: l.categoriasIds.filter((cid) => cid !== id) } : l,
        ),
      },
    })),

  deleteCategoriasComFilhas: (ids) =>
    set((s) => {
      const idSet = new Set(ids);
      return {
        data: {
          ...s.data,
          categorias: s.data.categorias.filter((c) => !idSet.has(c.id)),
          lancamentos: s.data.lancamentos.map((l) =>
            l.categoriasIds.some((cid) => idSet.has(cid))
              ? { ...l, categoriasIds: l.categoriasIds.filter((cid) => !idSet.has(cid)) }
              : l,
          ),
        },
      };
    }),

  getOrCreateCategoriaOrcamentoInvestimento: () => {
    const categorias = get().data.categorias;
    const existente = categorias.find(
      (c) => c.tipo === "investimento" && !c.categoriaPaiId && (c.nome === "Aportes" || c.nome === "Aportes (orçamento)"),
    );
    if (!existente) {
      const nova: Categoria = {
        id: uid("cat"),
        nome: "Aportes",
        tipo: "investimento",
        categoriaPaiId: null,
        cor: "#2E5C8A",
        icone: "investment",
        arquivada: false,
        ocultarGraficos: false,
      };
      set((s) => ({ data: { ...s.data, categorias: [...s.data.categorias, nova] } }));
      return nova;
    }
    if (existente.nome !== "Aportes") {
      const renomeada: Categoria = { ...existente, nome: "Aportes" };
      set((s) => ({
        data: { ...s.data, categorias: s.data.categorias.map((c) => (c.id === existente.id ? renomeada : c)) },
      }));
      return renomeada;
    }
    return existente;
  },

  saveOrcamento: (orcamento) =>
    set((s) => {
      const idx = s.data.orcamentos.findIndex((o) => o.id === orcamento.id);
      const orcamentos = idx >= 0 ? s.data.orcamentos.map((o, i) => (i === idx ? orcamento : o)) : [...s.data.orcamentos, orcamento];
      return { data: { ...s.data, orcamentos } };
    }),

  addOrcamentos: (orcamentos) =>
    set((s) => ({ data: { ...s.data, orcamentos: [...s.data.orcamentos, ...orcamentos] } })),

  deleteOrcamento: (id) =>
    set((s) => ({ data: { ...s.data, orcamentos: s.data.orcamentos.filter((o) => o.id !== id) } })),

  saveAtivo: (ativo) =>
    set((s) => {
      const idx = s.data.investimentos.ativos.findIndex((a) => a.id === ativo.id);
      const ativos =
        idx >= 0 ? s.data.investimentos.ativos.map((a, i) => (i === idx ? ativo : a)) : [...s.data.investimentos.ativos, ativo];
      return { data: { ...s.data, investimentos: { ...s.data.investimentos, ativos } } };
    }),

  deleteAtivoComHistorico: (id) =>
    set((s) => ({
      data: {
        ...s.data,
        investimentos: {
          ativos: s.data.investimentos.ativos.filter((a) => a.id !== id),
          aportes: s.data.investimentos.aportes.filter((a) => a.ativoId !== id),
          atualizacoes: s.data.investimentos.atualizacoes.filter((a) => a.ativoId !== id),
        },
      },
    })),

  saveAporte: (aporte) =>
    set((s) => {
      const idx = s.data.investimentos.aportes.findIndex((a) => a.id === aporte.id);
      const aportes =
        idx >= 0 ? s.data.investimentos.aportes.map((a, i) => (i === idx ? aporte : a)) : [...s.data.investimentos.aportes, aporte];
      return { data: { ...s.data, investimentos: { ...s.data.investimentos, aportes } } };
    }),

  deleteAporte: (id) =>
    set((s) => {
      const aporteRemovido = s.data.investimentos.aportes.find((a) => a.id === id);
      const lancamentos = aporteRemovido?.lancamentoVinculadoId
        ? s.data.lancamentos.filter((l) => l.id !== aporteRemovido.lancamentoVinculadoId)
        : s.data.lancamentos;
      return {
        data: {
          ...s.data,
          lancamentos,
          investimentos: { ...s.data.investimentos, aportes: s.data.investimentos.aportes.filter((a) => a.id !== id) },
        },
      };
    }),

  registrarTransferenciaAtivo: (origemId, destinoId, valor, data) =>
    set((s) => {
      const grupoId = uid("transf");
      const criadoEm = new Date().toISOString();
      const novoResgate: Aporte = {
        id: uid("aporte"), ativoId: origemId, data, valor, tipo: "resgate", categoriaId: null, tagsIds: [],
        contaId: null, transferenciaGrupoId: grupoId, lancamentoVinculadoId: null, criadoEm, efetivado: true,
      };
      const novoAporte: Aporte = {
        id: uid("aporte"), ativoId: destinoId, data, valor, tipo: "aporte", categoriaId: null, tagsIds: [],
        contaId: null, transferenciaGrupoId: grupoId, lancamentoVinculadoId: null, criadoEm, efetivado: true,
      };
      return {
        data: {
          ...s.data,
          investimentos: { ...s.data.investimentos, aportes: [...s.data.investimentos.aportes, novoResgate, novoAporte] },
        },
      };
    }),

  saveAtualizacaoAtivo: (atualizacao) =>
    set((s) => {
      const idx = s.data.investimentos.atualizacoes.findIndex((a) => a.id === atualizacao.id);
      const atualizacoes =
        idx >= 0
          ? s.data.investimentos.atualizacoes.map((a, i) => (i === idx ? atualizacao : a))
          : [...s.data.investimentos.atualizacoes, atualizacao];
      return { data: { ...s.data, investimentos: { ...s.data.investimentos, atualizacoes } } };
    }),

  deleteAtualizacaoAtivo: (id) =>
    set((s) => ({
      data: {
        ...s.data,
        investimentos: { ...s.data.investimentos, atualizacoes: s.data.investimentos.atualizacoes.filter((a) => a.id !== id) },
      },
    })),

  saveLancamento: (lancamento) =>
    set((s) => {
      const idx = s.data.lancamentos.findIndex((l) => l.id === lancamento.id);
      const lancamentos = idx >= 0 ? s.data.lancamentos.map((l, i) => (i === idx ? lancamento : l)) : [...s.data.lancamentos, lancamento];
      return { data: { ...s.data, lancamentos } };
    }),

  addLancamentos: (lancamentos) =>
    set((s) => ({ data: { ...s.data, lancamentos: [...s.data.lancamentos, ...lancamentos] } })),

  deleteLancamento: (id) =>
    set((s) => ({ data: { ...s.data, lancamentos: s.data.lancamentos.filter((l) => l.id !== id) } })),

  deleteLancamentosSerie: (grupoId, fromDate) =>
    set((s) => ({
      data: {
        ...s.data,
        lancamentos: s.data.lancamentos.filter((l) => {
          if (!l.recorrencia.ativa || l.recorrencia.grupoId !== grupoId) return true;
          if (fromDate) return l.data < fromDate;
          return false;
        }),
      },
    })),

  toggleEfetivadoLancamento: (id) =>
    set((s) => ({
      data: {
        ...s.data,
        lancamentos: s.data.lancamentos.map((l) => {
          if (l.id !== id) return l;
          const efetivado = !l.efetivado;
          return { ...l, efetivado, dataEfetivacao: efetivado && !l.cartaoId ? nowLocalIso() : l.dataEfetivacao };
        }),
      },
    })),

  updateLancamentosSerie: (grupoId, patch, excludeId) =>
    set((s) => ({
      data: {
        ...s.data,
        lancamentos: s.data.lancamentos.map((l) =>
          l.recorrencia.ativa && l.recorrencia.grupoId === grupoId && l.id !== excludeId ? { ...l, ...patch } : l,
        ),
      },
    })),

  updateConfiguracoes: (patch) =>
    set((s) => ({ data: { ...s.data, configuracoes: { ...s.data.configuracoes, ...patch } } })),
}));
