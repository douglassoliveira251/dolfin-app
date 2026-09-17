import { useAppStore } from "./data/store";

function App() {
  const ready = useAppStore((state) => state.ready);

  return (
    <main style={{ fontFamily: "sans-serif", padding: 40 }}>
      <h1>Dolfin</h1>
      <p>Fase 0 — fundação do projeto concluída.</p>
      <p>Zustand store: {ready ? "conectado" : "desconectado"}</p>
    </main>
  );
}

export default App;
