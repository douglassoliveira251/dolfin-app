import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { COLOR_PRESETS } from "../data/colors";
import { useAppStore } from "../data/store";
import { Icon } from "./icons/Icon";

interface TagsInputProps {
  value: string[];
  onChange: (ids: string[]) => void;
}

export function TagsInput({ value, onChange }: TagsInputProps) {
  const tags = useAppStore((s) => s.data.tags);
  const addTag = useAppStore((s) => s.addTag);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selTags = value.map((id) => tags.find((t) => t.id === id)).filter((t): t is (typeof tags)[number] => !!t);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  function openPop() {
    const r = triggerRef.current!.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: Math.min(r.left, window.innerWidth - 260) });
    setOpen(true);
  }

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
    setSearch("");
    setOpen(false);
  }

  function remove(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setOpen(false);
    onChange(value.filter((x) => x !== id));
  }

  function handleCreate() {
    const nome = search.trim();
    if (!nome) return;
    const id = addTag(nome, COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)]);
    onChange([...value, id]);
    setSearch("");
    setOpen(false);
  }

  const filtered = tags.filter((t) => t.nome.toLowerCase().includes(search.toLowerCase()));
  const existe = tags.some((t) => t.nome.toLowerCase() === search.trim().toLowerCase());

  return (
    <div className="custom-select">
      <div
        className="tags-input-trigger"
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          if (!open) openPop();
        }}
      >
        {selTags.map((t) => (
          <span className="tag-token" key={t.id}>
            {t.nome}
            <span className="tt-icon" style={{ width: 10, height: 10, marginLeft: 2, cursor: "pointer", opacity: 0.7 }} onClick={(e) => remove(t.id, e)}>
              <Icon name="close" size={10} />
            </span>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          placeholder={selTags.length ? "" : "Buscar ou criar tag..."}
          autoComplete="off"
          value={search}
          onFocus={openPop}
          onClick={(e) => {
            e.stopPropagation();
            if (!open) openPop();
          }}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) openPop();
          }}
        />
      </div>
      {open &&
        pos &&
        createPortal(
          <div
            className="color-popover open"
            style={{ position: "fixed", top: pos.top, left: pos.left, width: 240, maxHeight: 220, overflow: "auto" } as CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                className="fab-menu-item"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                onClick={() => toggle(t.id)}
              >
                <span>{t.nome}</span>
                {value.includes(t.id) && <Icon name="check" size={14} />}
              </button>
            ))}
            {search.trim() && !existe && (
              <button type="button" className="fab-menu-item" style={{ color: "var(--sidebar-accent)" }} onClick={handleCreate}>
                <Icon name="plus" size={14} /> Criar "{search.trim()}"
              </button>
            )}
            {!filtered.length && !search.trim() && (
              <div className="mini-note" style={{ padding: 6 }}>
                Nenhuma tag ainda — comece a digitar para criar.
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
