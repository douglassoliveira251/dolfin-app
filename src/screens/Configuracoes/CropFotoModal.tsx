import { useEffect, useRef, useState } from "react";
import { Modal } from "../../components/Modal";

const SIZE = 260;
const OUT = 240;

interface CropFotoModalProps {
  imgSrc: string;
  onDone: (dataUrl: string) => void;
  onClose: () => void;
}

export function CropFotoModal({ imgSrc, onDone, onClose }: CropFotoModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const geo = useRef({ natW: 0, natH: 0, baseScale: 1, scale: 1, offX: 0, offY: 0 });
  const drag = useRef({ dragging: false, startX: 0, startY: 0, startOffX: 0, startOffY: 0 });

  function clampOffsets() {
    const g = geo.current;
    const w = g.natW * g.baseScale * g.scale;
    const h = g.natH * g.baseScale * g.scale;
    g.offX = Math.min(0, Math.max(SIZE - w, g.offX));
    g.offY = Math.min(0, Math.max(SIZE - h, g.offY));
  }

  function applyTransform() {
    const img = imgRef.current;
    if (!img) return;
    clampOffsets();
    const g = geo.current;
    img.style.width = g.natW * g.baseScale * g.scale + "px";
    img.style.height = g.natH * g.baseScale * g.scale + "px";
    img.style.transform = `translate(${g.offX}px, ${g.offY}px)`;
  }

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    function onPointerDown(e: PointerEvent) {
      drag.current = { dragging: true, startX: e.clientX, startY: e.clientY, startOffX: geo.current.offX, startOffY: geo.current.offY };
      if (stage) {
        stage.style.cursor = "grabbing";
        stage.setPointerCapture(e.pointerId);
      }
    }
    function onPointerMove(e: PointerEvent) {
      if (!drag.current.dragging) return;
      geo.current.offX = drag.current.startOffX + (e.clientX - drag.current.startX);
      geo.current.offY = drag.current.startOffY + (e.clientY - drag.current.startY);
      applyTransform();
    }
    function onPointerUp() {
      drag.current.dragging = false;
      if (stage) stage.style.cursor = "grab";
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const s = Math.min(3, Math.max(1, geo.current.scale - e.deltaY * 0.001));
      geo.current.scale = s;
      setZoom(s);
      applyTransform();
    }
    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerup", onPointerUp);
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", onPointerUp);
      stage.removeEventListener("wheel", onWheel);
    };
  }, []);

  function handleImgLoad() {
    const img = imgRef.current;
    if (!img) return;
    const g = geo.current;
    g.natW = img.naturalWidth;
    g.natH = img.naturalHeight;
    g.baseScale = Math.max(SIZE / g.natW, SIZE / g.natH);
    g.scale = 1;
    setZoom(1);
    g.offX = (SIZE - g.natW * g.baseScale) / 2;
    g.offY = (SIZE - g.natH * g.baseScale) / 2;
    applyTransform();
  }

  function handleZoomInput(v: number) {
    geo.current.scale = v;
    setZoom(v);
    applyTransform();
  }

  function handleSalvar() {
    const img = imgRef.current;
    if (!img) return;
    const g = geo.current;
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d")!;
    const drawW = g.natW * g.baseScale * g.scale;
    const drawH = g.natH * g.baseScale * g.scale;
    const k = OUT / SIZE;
    ctx.drawImage(img, g.offX * k, g.offY * k, drawW * k, drawH * k);
    onDone(canvas.toDataURL("image/jpeg", 0.88));
  }

  return (
    <Modal
      title="Ajustar foto"
      onClose={onClose}
      closeOnBackdropClick
      footer={
        <>
          <div />
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="btn primary" onClick={handleSalvar}>
              Selecionar e salvar
            </button>
          </div>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          ref={stageRef}
          style={{
            position: "relative",
            width: SIZE,
            height: SIZE,
            borderRadius: "50%",
            overflow: "hidden",
            background: "var(--surface-2)",
            cursor: "grab",
            touchAction: "none",
            border: "1px solid var(--line)",
          }}
        >
          <img
            ref={imgRef}
            src={imgSrc}
            onLoad={handleImgLoad}
            draggable={false}
            style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", userSelect: "none" }}
          />
        </div>
        <input type="range" min={1} max={3} step={0.01} value={zoom} style={{ width: SIZE, marginTop: 16 }} onChange={(e) => handleZoomInput(Number(e.target.value))} />
        <p className="mini-note" style={{ marginTop: 6 }}>
          Arraste para posicionar, use o controle para dar zoom.
        </p>
      </div>
    </Modal>
  );
}
