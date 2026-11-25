import React from "react";

export default function PumpGuide() {
  return (
    <div className="w-full h-full" style={{ minHeight: "calc(100vh - 120px)" }}>
      <iframe
        src="/guides/ph04-guide.html"
        title="دليل تشغيل المضخة PH04"
        className="w-full border-0 rounded-xl"
        style={{ height: "calc(100vh - 120px)" }}
      />
    </div>
  );
}
