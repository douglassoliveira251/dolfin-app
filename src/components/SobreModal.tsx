import { Modal } from "./Modal";

export function SobreModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      title="Sobre o Dolfin"
      onClose={onClose}
      closeOnBackdropClick
      modalClassName="confirm-box"
      footer={
        <>
          <div />
          <button type="button" className="btn ghost" onClick={onClose}>
            Fechar
          </button>
        </>
      }
    >
      <p style={{ marginBottom: 10 }}>
        <strong>Dolfin</strong> — Controle Financeiro Pessoal
      </p>
      <p className="mini-note" style={{ marginBottom: 10 }}>
        Aplicativo com dados salvos diretamente no seu computador via File System Access API.
      </p>
      <p className="mini-note" style={{ marginBottom: 4 }}>
        Versão: 1.11.021
      </p>
      <p className="mini-note">Navegador recomendado: Chrome ou Edge.</p>
    </Modal>
  );
}
