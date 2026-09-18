export const SCHEMA_VERSION = "1.0.3";

export function uid(prefix?: string): string {
  return (prefix || "id") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export type TipoConta = "corrente" | "poupanca" | "carteira" | "investimento";
export type TipoLancamento = "entrada" | "despesa" | "investimento" | "transferencia";
export type TipoCategoria = "entrada" | "despesa" | "investimento" | "conta";
export type TipoAporte = "aporte" | "resgate";
export type TipoMovimentoMeta = "entrada" | "saida";

export interface Conta {
  id: string;
  nome: string;
  tipo: TipoConta;
  saldoInicial: number;
  cor: string;
  moeda: string;
  categoriaContaId: string | null;
  icone: string;
  oculta: boolean;
  arquivada: boolean;
  padrao: boolean;
  ativo: boolean;
}

export interface Cartao {
  id: string;
  nome: string;
  contaVinculada: string | null;
  bandeira: string;
  ultimosDigitos: string;
  diaFechamento: number;
  diaVencimento: number;
  limite: number;
  cor: string;
  icone: string;
  padrao: boolean;
  ativo: boolean;
  mostrarNoDashboard: boolean;
  arquivada: boolean;
}

export interface Categoria {
  id: string;
  nome: string;
  tipo: TipoCategoria;
  categoriaPaiId: string | null;
  cor: string;
  icone: string | null;
  arquivada: boolean;
  ocultarGraficos: boolean;
}

export interface Tag {
  id: string;
  nome: string;
  cor: string;
}

export interface CategoriaSplit {
  categoriaId: string | null;
  subcategoriaId: string | null;
  valor: number;
}

export type Recorrencia =
  | { ativa: false }
  | {
      ativa: true;
      frequencia: string;
      intervalo: number;
      grupoId: string;
      tipo: string;
      valorTipo: string;
      totalParcelas: number | null;
      parcelaAtual: number | null;
      parcelaInicial: number;
      dataTermino: string | null;
    };

export interface Lancamento {
  id: string;
  tipo: TipoLancamento;
  nome: string;
  valor: number;
  data: string;
  hora: string;
  criadoEm: string;
  categoriasSplits: CategoriaSplit[] | null;
  contaId: string | null;
  cartaoId: string | null;
  competenciaFatura: string | null;
  contaDestinoId: string | null;
  categoriasIds: string[];
  tagsIds: string[];
  descricao: string;
  efetivado: boolean;
  dataEfetivacao: string | null;
  grupoPagamento: string | null;
  origemPagamentoGrupo: string | null;
  recorrencia: Recorrencia;
}

export interface HistoricoValorOrcamento {
  desde: string;
  valor: number;
}

export interface Orcamento {
  id: string;
  categoriaId: string | null;
  mesReferencia: string | null;
  validoApartirDe: string | null;
  valorPlanejado: number;
  historicoValores: HistoricoValorOrcamento[];
}

export interface Ativo {
  id: string;
  nome: string;
  categoriaId: string | null;
  tipoLegado: string | null;
  contaId: string | null;
  saldoInicial: number;
  dataCriacao: string | null;
  ativo: boolean;
}

export interface Aporte {
  id: string;
  ativoId: string | null;
  data: string;
  valor: number;
  tipo: TipoAporte;
  categoriaId: string | null;
  tagsIds: string[];
  contaId: string | null;
  transferenciaGrupoId: string | null;
  lancamentoVinculadoId: string | null;
  criadoEm: string;
  efetivado: boolean;
}

export interface AtualizacaoAtivo {
  id: string;
  ativoId: string | null;
  data: string;
  valorAtual: number;
  criadoEm: string;
}

export interface MovimentoMeta {
  id: string;
  data: string;
  valor: number;
  tipo: TipoMovimentoMeta;
}

export interface Meta {
  id: string;
  nome: string;
  valorAlvo: number;
  valorAtual: number;
  dataAlvo: string | null;
  cor: string;
  icone: string;
  concluida: boolean;
  criadoEm: string;
  descricao: string;
  movimentos: MovimentoMeta[];
}

export interface Perfil {
  nome: string;
  email: string;
  fotoDataUrl: string | null;
}

export interface Configuracoes {
  orcamentoAfetaPrevisto: boolean;
  mostrarApenasContasComSaldo: boolean;
  lastUsedCategoria: {
    entrada: [string | null, string | null];
    despesa: [string | null, string | null];
    investimento: [string | null, string | null];
  };
  lastUsedCartaoId: string | null;
  temaEscuro: boolean;
  ordenacaoDecrescente: boolean;
  lancPageSizePadrao: number;
  fusoHorario: string;
  ocultarValoresAoAbrir: boolean;
  sidebarColapsada: boolean;
  fluxoCaixaPeriodo: string;
  ultimoBackup: string | null;
}

export interface AppState {
  schemaVersion: string;
  meta: { createdAt: string; lastModified: string };
  configuracoes: Configuracoes;
  contas: Conta[];
  cartoes: Cartao[];
  categorias: Categoria[];
  tags: Tag[];
  lancamentos: Lancamento[];
  orcamentos: Orcamento[];
  investimentos: {
    ativos: Ativo[];
    aportes: Aporte[];
    atualizacoes: AtualizacaoAtivo[];
  };
  metas: Meta[];
  perfil: Perfil;
}

export function defaultState(): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    meta: { createdAt: new Date().toISOString(), lastModified: new Date().toISOString() },
    configuracoes: {
      orcamentoAfetaPrevisto: false,
      mostrarApenasContasComSaldo: false,
      lastUsedCategoria: { entrada: [null, null], despesa: [null, null], investimento: [null, null] },
      lastUsedCartaoId: null,
      temaEscuro: false,
      ordenacaoDecrescente: true,
      lancPageSizePadrao: 10,
      fusoHorario: "-03:00",
      ocultarValoresAoAbrir: false,
      sidebarColapsada: false,
      fluxoCaixaPeriodo: "30D",
      ultimoBackup: null,
    },
    contas: [],
    cartoes: [],
    categorias: [],
    tags: [],
    lancamentos: [],
    orcamentos: [],
    investimentos: { ativos: [], aportes: [], atualizacoes: [] },
    metas: [],
    perfil: { nome: "", email: "", fotoDataUrl: null },
  };
}

/** Garante o formato completo + corrige pequenas inconsistências. Nunca é destrutivo. */
export function normalizeState(raw: unknown): AppState {
  const s = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  const out = defaultState();
  out.schemaVersion = SCHEMA_VERSION;
  out.meta = Object.assign(out.meta, s.meta || {});
  out.configuracoes = Object.assign(out.configuracoes, s.configuracoes || {});
  out.configuracoes.lastUsedCategoria = Object.assign(
    { entrada: [null, null], despesa: [null, null], investimento: [null, null] },
    out.configuracoes.lastUsedCategoria || {},
  );

  out.contas = Array.isArray(s.contas)
    ? s.contas.map(
        (c: any): Conta => ({
          id: c.id || uid("conta"),
          nome: c.nome || "Conta",
          tipo: c.tipo || "corrente",
          saldoInicial: Number(c.saldoInicial) || 0,
          cor: c.cor || "#173E37",
          moeda: c.moeda || "BRL",
          categoriaContaId: c.categoriaContaId || null,
          icone:
            c.icone ||
            ({ corrente: "bank", poupanca: "piggy", carteira: "wallet", investimento: "investment" } as Record<
              string,
              string
            >)[c.tipo] ||
            "bank",
          oculta: c.oculta === true,
          arquivada: c.arquivada === true,
          padrao: c.padrao === true,
          ativo: c.ativo !== false,
        }),
      )
    : [];

  out.cartoes = Array.isArray(s.cartoes)
    ? s.cartoes.map(
        (c: any): Cartao => ({
          id: c.id || uid("cartao"),
          nome: c.nome || "Cartão",
          contaVinculada: c.contaVinculada || null,
          bandeira: c.bandeira || "outros",
          ultimosDigitos: c.ultimosDigitos || "",
          diaFechamento: Number(c.diaFechamento) || 25,
          diaVencimento: Number(c.diaVencimento) || 5,
          limite: Number(c.limite) || 0,
          cor: c.cor || "#B8863A",
          icone: c.icone || "card",
          padrao: c.padrao === true,
          ativo: c.ativo !== false,
          mostrarNoDashboard: c.mostrarNoDashboard !== false,
          arquivada: c.arquivada === true,
        }),
      )
    : [];

  out.categorias = Array.isArray(s.categorias)
    ? s.categorias.map(
        (c: any): Categoria => ({
          id: c.id || uid("cat"),
          nome: c.nome || "Categoria",
          tipo: c.tipo || "despesa",
          categoriaPaiId: c.categoriaPaiId || null,
          cor: c.cor || "#9C978A",
          icone: c.icone || (c.tipo === "conta" ? "bank" : null),
          arquivada: c.arquivada === true,
          ocultarGraficos: c.ocultarGraficos === true,
        }),
      )
    : [];

  // Migração: categoria de aportes de orçamento renomeada de "Aportes (orçamento)" para "Aportes"
  out.categorias.forEach((c) => {
    if (c.tipo === "investimento" && !c.categoriaPaiId && c.nome === "Aportes (orçamento)") c.nome = "Aportes";
  });

  // Limpeza: investimento é categoria de 1 nível só; remove subcategorias "Outros" criadas por engano em versão anterior
  const catsInvComFilhoIndevido = out.categorias.filter((c) => c.tipo === "investimento" && c.categoriaPaiId);
  if (catsInvComFilhoIndevido.length) {
    const idsRemover = new Set(catsInvComFilhoIndevido.map((c) => c.id));
    out.categorias = out.categorias.filter((c) => !idsRemover.has(c.id));
  }

  // Migration: categoria+subcategoria agora são obrigatórias em lançamentos.
  // Garante que toda categoria de nível 1 (exceto tipo "conta"/"investimento", que são de 1 nível só) tenha ao menos uma subcategoria.
  out.categorias
    .filter((c) => !c.categoriaPaiId && c.tipo !== "conta" && c.tipo !== "investimento")
    .forEach((pai) => {
      const temFilha = out.categorias.some((c) => c.categoriaPaiId === pai.id);
      if (!temFilha) {
        out.categorias.push({
          id: uid("cat"),
          nome: "Outros",
          tipo: pai.tipo,
          categoriaPaiId: pai.id,
          cor: "#9C978A",
          icone: "other",
          arquivada: false,
          ocultarGraficos: false,
        });
      }
    });

  out.tags = Array.isArray(s.tags)
    ? s.tags.map((t: any): Tag => ({ id: t.id || uid("tag"), nome: t.nome || "Tag", cor: t.cor || "#B8863A" }))
    : [];

  out.lancamentos = Array.isArray(s.lancamentos)
    ? s.lancamentos.map((l: any): Lancamento => {
        const data = l.data || new Date().toISOString().slice(0, 10);
        const hora = l.hora || "00:00";
        return {
          id: l.id || uid("lanc"),
          tipo: l.tipo || "despesa",
          nome: l.nome || l.descricao || (l.tipo === "transferencia" ? "Transferência" : ""),
          valor: Math.abs(Number(l.valor)) || 0,
          data,
          hora,
          criadoEm: l.criadoEm || `${data}T${hora}:00.000Z`,
          categoriasSplits: Array.isArray(l.categoriasSplits)
            ? l.categoriasSplits.map((sp: any) => ({
                categoriaId: sp.categoriaId || null,
                subcategoriaId: sp.subcategoriaId || null,
                valor: Number(sp.valor) || 0,
              }))
            : null,
          contaId: l.contaId || null,
          cartaoId: l.cartaoId || null,
          competenciaFatura: l.competenciaFatura || null,
          contaDestinoId: l.contaDestinoId || null,
          categoriasIds: Array.isArray(l.categoriasIds) ? l.categoriasIds : [],
          tagsIds: Array.isArray(l.tagsIds) ? l.tagsIds : [],
          descricao: l.nome ? l.descricao || "" : "",
          efetivado: l.efetivado === true,
          dataEfetivacao: l.dataEfetivacao || null,
          grupoPagamento: l.grupoPagamento || null,
          origemPagamentoGrupo: l.origemPagamentoGrupo || null,
          recorrencia:
            l.recorrencia && l.recorrencia.ativa
              ? {
                  ativa: true,
                  frequencia: l.recorrencia.frequencia || "mensal",
                  intervalo: Number(l.recorrencia.intervalo) || 1,
                  grupoId: l.recorrencia.grupoId || uid("rec"),
                  tipo: l.recorrencia.tipo || "fixo",
                  valorTipo: l.recorrencia.valorTipo || "parcela",
                  totalParcelas: l.recorrencia.totalParcelas || null,
                  parcelaAtual: l.recorrencia.parcelaAtual || null,
                  parcelaInicial: l.recorrencia.parcelaInicial || 1,
                  dataTermino: l.recorrencia.dataTermino || null,
                }
              : { ativa: false },
        };
      })
    : [];

  out.orcamentos = Array.isArray(s.orcamentos)
    ? s.orcamentos.map(
        (o: any): Orcamento => ({
          id: o.id || uid("orc"),
          categoriaId: o.categoriaId || null,
          mesReferencia: o.mesReferencia || null,
          validoApartirDe: o.validoApartirDe || null,
          valorPlanejado: Number(o.valorPlanejado) || 0,
          historicoValores: Array.isArray(o.historicoValores)
            ? o.historicoValores.map((h: any) => ({ desde: h.desde, valor: Number(h.valor) || 0 }))
            : [],
        }),
      )
    : [];

  const inv = s.investimentos || {};
  out.investimentos.ativos = Array.isArray(inv.ativos)
    ? inv.ativos.map(
        (a: any): Ativo => ({
          id: a.id || uid("ativo"),
          nome: a.nome || "Ativo",
          categoriaId: a.categoriaId || null,
          tipoLegado: a.tipo || null,
          contaId: a.contaId || null,
          saldoInicial: Number(a.saldoInicial) || 0,
          dataCriacao: a.dataCriacao || null,
          ativo: a.ativo !== false,
        }),
      )
    : [];

  // Migração: tipo (texto livre) de investimento vira categoria de verdade
  out.investimentos.ativos.forEach((a) => {
    if (a.categoriaId) return;
    const nomeTipo = a.tipoLegado || "Outro";
    let cat = out.categorias.find((c) => c.tipo === "investimento" && c.nome.toLowerCase() === nomeTipo.toLowerCase());
    if (!cat) {
      cat = {
        id: uid("cat"),
        nome: nomeTipo,
        tipo: "investimento",
        categoriaPaiId: null,
        cor: "#2E5C8A",
        icone: "investment",
        arquivada: false,
        ocultarGraficos: false,
      };
      out.categorias.push(cat);
    }
    a.categoriaId = cat.id;
  });

  out.investimentos.aportes = Array.isArray(inv.aportes)
    ? inv.aportes.map(
        (a: any): Aporte => ({
          id: a.id || uid("aporte"),
          ativoId: a.ativoId || null,
          data: a.data || new Date().toISOString().slice(0, 10),
          valor: Number(a.valor) || 0,
          tipo: a.tipo || "aporte",
          categoriaId: a.categoriaId || null,
          tagsIds: Array.isArray(a.tagsIds) ? a.tagsIds : [],
          contaId: a.contaId || null,
          transferenciaGrupoId: a.transferenciaGrupoId || null,
          lancamentoVinculadoId: a.lancamentoVinculadoId || null,
          criadoEm: a.criadoEm || new Date().toISOString(),
          efetivado: a.efetivado !== false,
        }),
      )
    : [];

  out.investimentos.atualizacoes = Array.isArray(inv.atualizacoes)
    ? inv.atualizacoes.map(
        (a: any): AtualizacaoAtivo => ({
          id: a.id || uid("atual"),
          ativoId: a.ativoId || null,
          data: a.data || new Date().toISOString().slice(0, 10),
          valorAtual: Number(a.valorAtual) || 0,
          criadoEm: a.criadoEm || new Date().toISOString(),
        }),
      )
    : [];

  out.metas = Array.isArray(s.metas)
    ? s.metas.map(
        (m: any): Meta => ({
          id: m.id || uid("meta"),
          nome: m.nome || "Meta",
          valorAlvo: Number(m.valorAlvo) || 0,
          valorAtual: Number(m.valorAtual) || 0,
          dataAlvo: m.dataAlvo || null,
          cor: m.cor || "#2E5C8A",
          icone: m.icone || "target",
          concluida: m.concluida === true,
          criadoEm: m.criadoEm || new Date().toISOString(),
          descricao: m.descricao || "",
          movimentos: Array.isArray(m.movimentos)
            ? m.movimentos.map((mv: any) => ({
                id: mv.id || uid("metamov"),
                data: mv.data || new Date().toISOString().slice(0, 10),
                valor: Number(mv.valor) || 0,
                tipo: mv.tipo === "saida" ? "saida" : "entrada",
              }))
            : [],
        }),
      )
    : [];

  const p = s.perfil || {};
  out.perfil = { nome: p.nome || "", email: p.email || "", fotoDataUrl: p.fotoDataUrl || null };

  return out;
}
