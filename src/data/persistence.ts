import { COLOR_PRESETS } from "./colors";
import { type AppState, defaultState, normalizeState, uid } from "./schema";
import { useAppStore } from "./store";

/* =========================================================
   INDEXEDDB — persistência do file handle
========================================================= */
const IDB_NAME = "dolfin-db";
const IDB_STORE = "handles";
const IDB_KEY = "fileHandle";

function idbOpen(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(handle: FileSystemFileHandle): Promise<void> {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(handle, IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(): Promise<FileSystemFileHandle | null> {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const rq = tx.objectStore(IDB_STORE).get(IDB_KEY);
    rq.onsuccess = () => resolve(rq.result || null);
    rq.onerror = () => reject(rq.error);
  });
}

async function idbClear(): Promise<void> {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).delete(IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* =========================================================
   FILE SYSTEM ACCESS
========================================================= */
async function verifyPermission(handle: FileSystemFileHandle, forWrite: boolean): Promise<boolean> {
  const opts = forWrite ? { mode: "readwrite" as const } : {};
  if ((await handle.queryPermission(opts)) === "granted") return true;
  if ((await handle.requestPermission(opts)) === "granted") return true;
  return false;
}

async function readFileHandle(handle: FileSystemFileHandle): Promise<unknown> {
  const file = await handle.getFile();
  const text = await file.text();
  return text.trim() ? JSON.parse(text) : {};
}

async function writeFileHandle(handle: FileSystemFileHandle, data: AppState): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
}

let fileHandle: FileSystemFileHandle | null = null;
let writeTimer: ReturnType<typeof setTimeout> | undefined;
let lastSyncAt: Date | null = null;

export function getLastSyncAt(): Date | null {
  return lastSyncAt;
}

export function getConnectedFileName(): string | null {
  return fileHandle?.name ?? null;
}

export async function persist(immediate = false): Promise<void> {
  if (!fileHandle) return;
  const { data } = useAppStore.getState();
  data.meta.lastModified = new Date().toISOString();
  clearTimeout(writeTimer);
  const doWrite = () => writeFileHandle(fileHandle as FileSystemFileHandle, data).then(() => (lastSyncAt = new Date()));
  if (immediate) {
    await doWrite();
  } else {
    writeTimer = setTimeout(doWrite, 300);
  }
}

function categoriasSeedPadrao() {
  const grupos = [
    { nome: "Salário", tipo: "entrada" as const, cor: "#2e7d5b", icone: "briefcase", filhos: [{ nome: "Outros", cor: "#9C978A", icone: "other" }] },
    { nome: "Serviços", tipo: "entrada" as const, cor: "#C9A227", icone: "tools", filhos: [{ nome: "Outros", cor: "#9C978A", icone: "other" }] },
    { nome: "Alimentação", tipo: "despesa" as const, cor: "#C9A227", icone: "food", filhos: [{ nome: "Outros", cor: "#9C978A", icone: "other" }] },
    { nome: "Compras", tipo: "despesa" as const, cor: "#6E4E9E", icone: "gift", filhos: [{ nome: "Outros", cor: "#9C978A", icone: "other" }] },
    { nome: "Saúde", tipo: "despesa" as const, cor: "#AD4B34", icone: "heart", filhos: [{ nome: "Outros", cor: "#9C978A", icone: "other" }] },
    { nome: "Finanças", tipo: "despesa" as const, cor: "#004523", icone: "salary", filhos: [{ nome: "Outros", cor: "#9C978A", icone: "other" }] },
    { nome: "Renda Fixa", tipo: "investimento" as const, cor: "#2E5C8A", icone: "investment", filhos: [] },
    { nome: "Fundo de Investimento", tipo: "investimento" as const, cor: "#2E7D5B", icone: "investment", filhos: [] },
    { nome: "Bolsa de Valores", tipo: "investimento" as const, cor: "#B8863A", icone: "investment", filhos: [] },
    { nome: "Fundo Imobiliário", tipo: "investimento" as const, cor: "#9C978A", icone: "investment", filhos: [] },
  ];
  const cats: AppState["categorias"] = [];
  grupos.forEach((g) => {
    const pai = { id: uid("cat"), nome: g.nome, tipo: g.tipo, categoriaPaiId: null, cor: g.cor, icone: g.icone, arquivada: false, ocultarGraficos: false };
    cats.push(pai);
    g.filhos.forEach((filho) => {
      cats.push({ id: uid("cat"), nome: filho.nome, tipo: g.tipo, categoriaPaiId: pai.id, cor: filho.cor, icone: filho.icone, arquivada: false, ocultarGraficos: false });
    });
  });
  return cats;
}

export async function openExisting(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: "Dolfin JSON", accept: { "application/json": [".json"] } }],
      excludeAcceptAllOption: false,
      multiple: false,
    });
    if (!(await verifyPermission(handle, true))) {
      return { ok: false, error: "Permissão de escrita negada. Tente novamente." };
    }
    const raw = await readFileHandle(handle);
    fileHandle = handle;
    await idbSet(handle);
    useAppStore.getState().hydrate(normalizeState(raw));
    await persist(true);
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") return { ok: false, error: "" };
    return { ok: false, error: "Não foi possível abrir o arquivo: " + (e as Error).message };
  }
}

export async function createNew(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: "dbase.json",
      types: [{ description: "Dolfin JSON", accept: { "application/json": [".json"] } }],
    });
    if (!(await verifyPermission(handle, true))) {
      return { ok: false, error: "Permissão de escrita negada. Tente novamente." };
    }
    const state = defaultState();
    state.categorias = categoriasSeedPadrao();
    state.contas.push({
      id: uid("conta"), nome: "Carteira", tipo: "carteira", saldoInicial: 0,
      cor: COLOR_PRESETS[14], moeda: "BRL", categoriaContaId: null, icone: "bank",
      oculta: false, arquivada: false, padrao: false, ativo: true,
    });
    state.contas.push({
      id: uid("conta"), nome: "Conta Corrente", tipo: "corrente", saldoInicial: 0,
      cor: COLOR_PRESETS[4], moeda: "BRL", categoriaContaId: null, icone: "bank",
      oculta: false, arquivada: false, padrao: false, ativo: true,
    });
    state.configuracoes.orcamentoAfetaPrevisto = true;
    state.configuracoes.mostrarApenasContasComSaldo = true;
    fileHandle = handle;
    await idbSet(handle);
    await writeFileHandle(handle, state);
    useAppStore.getState().hydrate(state);
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") return { ok: false, error: "" };
    return { ok: false, error: "Não foi possível criar o arquivo: " + (e as Error).message };
  }
}

export type ReconnectResult =
  | { status: "connected" }
  | { status: "needs-click"; fileName: string; retry: () => Promise<{ ok: true } | { ok: false; error: string }> }
  | { status: "none" };

export async function tryReconnect(): Promise<ReconnectResult> {
  try {
    const handle = await idbGet();
    if (!handle) return { status: "none" };
    if ((await handle.queryPermission({ mode: "readwrite" })) === "granted") {
      const raw = await readFileHandle(handle);
      fileHandle = handle;
      useAppStore.getState().hydrate(normalizeState(raw));
      return { status: "connected" };
    }
    // Permissão precisa de um clique real do usuário.
    return {
      status: "needs-click",
      fileName: handle.name,
      retry: async () => {
        try {
          if (!(await verifyPermission(handle, true))) {
            return { ok: false, error: "Permissão negada. Escolha o arquivo manualmente." };
          }
          const raw = await readFileHandle(handle);
          fileHandle = handle;
          useAppStore.getState().hydrate(normalizeState(raw));
          return { ok: true };
        } catch (e) {
          return { ok: false, error: "Não foi possível reconectar: " + (e as Error).message };
        }
      },
    };
  } catch {
    return { status: "none" };
  }
}

export async function disconnect(): Promise<void> {
  fileHandle = null;
  await idbClear();
  useAppStore.setState({ data: defaultState(), connected: false });
}
