import type { Categoria } from "../schema";

export function catNivel1(categorias: Categoria[], incluirArquivadas = false): Categoria[] {
  return categorias.filter((c) => !c.categoriaPaiId && (incluirArquivadas || !c.arquivada));
}

export function catFilhas(categorias: Categoria[], paiId: string, incluirArquivadas = false): Categoria[] {
  return categorias.filter((c) => c.categoriaPaiId === paiId && (incluirArquivadas || !c.arquivada));
}

export function catLabel(categorias: Categoria[], id: string | null): string {
  const c = id ? categorias.find((x) => x.id === id) : null;
  if (!c) return "—";
  if (c.categoriaPaiId) {
    const pai = categorias.find((x) => x.id === c.categoriaPaiId);
    return (pai ? pai.nome + " › " : "") + c.nome;
  }
  return c.nome;
}
