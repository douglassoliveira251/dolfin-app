import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons/Icon";
import { useConfirm } from "./ConfirmDialog";
import { fmtMonthLabel } from "../data/format";
import { disconnect } from "../data/persistence";
import { useAppStore } from "../data/store";

export function Topbar() {
  const currentMonth = useAppStore((s) => s.currentMonth);
  const setCurrentMonth = useAppStore((s) => s.setCurrentMonth);
  const valoresOcultos = useAppStore((s) => s.valoresOcultos);
  const setValoresOcultos = useAppStore((s) => s.setValoresOcultos);
  const perfil = useAppStore((s) => s.data.perfil);
  const setScreenId = useAppStore((s) => s.setScreenId);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { confirm, dialog: confirmDialog } = useConfirm();

  useEffect(() => {
    if (!profileOpen) return;
    const close = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [profileOpen]);

  function irParaMesAnterior() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }
  function irParaProximoMes() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }
  function voltarParaHoje() {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    setCurrentMonth(d);
  }

  async function handleSair() {
    setProfileOpen(false);
    const ok = await confirm("Deseja desconectar deste arquivo? Seus dados continuam salvos localmente.", { okLabel: "Sair" });
    if (ok) await disconnect();
  }

  return (
    <div className="page-controls">
      <div />
      <div className="month-switch">
        <button type="button" title="Mês anterior" onClick={irParaMesAnterior}>
          ‹
        </button>
        <div className="month-label" title="Clique para voltar para hoje" style={{ cursor: "pointer" }} onClick={voltarParaHoje}>
          {fmtMonthLabel(currentMonth)}
        </div>
        <button type="button" title="Próximo mês" onClick={irParaProximoMes}>
          ›
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flex: "none" }}>
        <button
          type="button"
          className="icon-btn icon-btn-topbar"
          title={valoresOcultos ? "Mostrar valores" : "Ocultar valores"}
          onClick={() => setValoresOcultos(!valoresOcultos)}
        >
          <Icon name={valoresOcultos ? "eyeOff" : "eye"} size={17} />
        </button>
        <div ref={profileRef} style={{ position: "relative" }}>
          <button
            type="button"
            title="Perfil"
            onClick={(e) => {
              e.stopPropagation();
              setProfileOpen((v) => !v);
            }}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              flex: "none",
              background: perfil.fotoDataUrl ? undefined : "#fff",
              backgroundImage: perfil.fotoDataUrl ? `url(${perfil.fotoDataUrl})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              border: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--sidebar-accent)",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,.06)",
            }}
          >
            {!perfil.fotoDataUrl && <Icon name="userGeneric" size={19} />}
          </button>
          {profileOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: 260,
                background: "var(--surface)",
                borderRadius: 14,
                boxShadow: "0 8px 28px rgba(0,0,0,.18)",
                overflow: "hidden",
                zIndex: 60,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px" }}>
                <span
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    flex: "none",
                    background: "var(--surface-2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--gray-400)",
                    overflow: "hidden",
                    backgroundImage: perfil.fotoDataUrl ? `url(${perfil.fotoDataUrl})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {!perfil.fotoDataUrl && <Icon name="userGeneric" size={22} />}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {perfil.nome || "Meu perfil"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--gray-400)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{perfil.email}</div>
                </div>
              </div>
              <div style={{ borderTop: "1px solid var(--line)", padding: 6 }}>
                <a
                  href="#"
                  className="config-side-item"
                  style={{ textDecoration: "none" }}
                  onClick={(e) => {
                    e.preventDefault();
                    setProfileOpen(false);
                    setScreenId("configuracoes");
                  }}
                >
                  <Icon name="detail" size={16} />
                  <span>Perfil</span>
                </a>
                <a
                  href="#"
                  className="config-side-item"
                  style={{ textDecoration: "none" }}
                  onClick={(e) => {
                    e.preventDefault();
                    setProfileOpen(false);
                    setScreenId("configuracoes");
                  }}
                >
                  <Icon name="config" size={16} />
                  <span>Configurações</span>
                </a>
              </div>
              <div style={{ borderTop: "1px solid var(--line)", padding: 6 }}>
                <a
                  href="#"
                  className="config-side-item"
                  style={{ textDecoration: "none", color: "var(--negative)" }}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSair();
                  }}
                >
                  <Icon name="logout" size={16} />
                  <span>Sair</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
      {confirmDialog}
    </div>
  );
}
