export const Shell = {
  outer: { position: "relative" as const, width: "100vw", height: "100vh", overflow: "hidden" },
  barH: 72,
  bar: {
    position: "absolute" as const, left: 0, top: 0, width: "100%", height: 72,
    background: "#f6f8fa", borderBottom: "1px solid #d0d7de", zIndex: 1000, padding: 8, boxSizing: "border-box" as const
  },
  left: {
    position: "absolute" as const, left: 0, top: 72, bottom: 0, width: "50%", borderRight: "1px solid #e5e7eb",
    boxSizing: "border-box" as const
  },
  right: {
    position: "absolute" as const, left: "50%", right: 0, top: 72, bottom: 0, overflow: "auto", boxSizing: "border-box" as const
  },
  title: { position: "absolute" as const, left: 8, top: 8, fontSize: 11, color: "#64748b", zIndex: 1 },
  rf: { position: "absolute" as const, left: 0, right: 0, top: 0, bottom: 0 },
};
