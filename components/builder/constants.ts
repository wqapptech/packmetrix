export const SAND = "#e8c97b";
export const SUCCESS = "#2dd4a0";

export const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: "6px 16px",
  borderRadius: 99,
  border: "none",
  background: active ? "rgba(255,255,255,0.12)" : "transparent",
  color: active ? "#fff" : "rgba(255,255,255,0.4)",
  fontSize: 12,
  fontWeight: active ? 600 : 400,
  fontFamily: "inherit",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
});
