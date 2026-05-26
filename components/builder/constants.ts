import {
  DA_INK1, DA_INK3, DA_SURFACE, DA_GOLD, DA_GREEN,
} from "@/lib/tokens";

export const SAND    = DA_GOLD;
export const SUCCESS = DA_GREEN;

export const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: "6px 16px",
  borderRadius: 99,
  border: "none",
  background: active ? DA_INK1 : "transparent",
  color: active ? DA_SURFACE : DA_INK3,
  fontSize: 12,
  fontWeight: active ? 600 : 400,
  fontFamily: "inherit",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
});
