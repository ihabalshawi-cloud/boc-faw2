import React, { useRef } from "react";

function SignaturePad({ onSave, label = "التوقيع" }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef(null);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e) => { e.preventDefault(); drawing.current = true; lastPos.current = getPos(e, canvasRef.current); };
  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
  };
  const stopDraw = () => { drawing.current = false; };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    onSave && onSave(null);
  };
  const save = () => { onSave && onSave(canvasRef.current.toDataURL("image/png")); };

  return (
    <div className="border border-color rounded-lg p-2 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-secondary">{label}</span>
        <div className="flex gap-1">
          <button type="button" onClick={clear} className="text-xs px-2 py-0.5 rounded border border-color hover:bg-hover text-secondary">مسح</button>
          <button type="button" onClick={save} className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white">حفظ التوقيع</button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={400}
        height={90}
        className="border border-dashed border-gray-300 rounded cursor-crosshair touch-none w-full bg-gray-50"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
    </div>
  );
}

export default SignaturePad;
