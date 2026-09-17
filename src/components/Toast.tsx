import { useEffect, useState } from "react";
import { create } from "zustand";

interface ToastItem {
  id: string;
  message: string;
}

interface ToastState {
  items: ToastItem[];
  push: (message: string) => void;
  remove: (id: string) => void;
}

const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (message) => set((s) => ({ items: [...s.items, { id: Math.random().toString(36).slice(2), message }] })),
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}));

export function showToast(message: string): void {
  useToastStore.getState().push(message);
}

function ToastMessage({ message, onDone }: { message: string; onDone: () => void }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true));
    const hideTimer = setTimeout(() => setShow(false), 2600);
    const removeTimer = setTimeout(onDone, 2850);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className={`toast${show ? " show" : ""}`}>{message}</div>;
}

/** Renderize uma única vez, no topo da árvore (ex: App.tsx). */
export function ToastHost() {
  const items = useToastStore((s) => s.items);
  const remove = useToastStore((s) => s.remove);
  return (
    <div className="toast-wrap">
      {items.map((i) => (
        <ToastMessage key={i.id} message={i.message} onDone={() => remove(i.id)} />
      ))}
    </div>
  );
}
