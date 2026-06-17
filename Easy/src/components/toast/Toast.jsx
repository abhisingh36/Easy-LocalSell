import { useApp } from "../../context/AppContext";

const TOAST_COLORS = {
  success: { bg: "#f0fdf4", border: "#86efac", color: "#15803d" },
  error:   { bg: "#fef2f2", border: "#fca5a5", color: "#b91c1c" },
  info:    { bg: "#f0f9ff", border: "#7dd3fc", color: "#0369a1" },
  warning: { bg: "#fffbeb", border: "#fcd34d", color: "#b45309" },
};

export default function Toast() {
  const { toasts } = useApp();

  return (
    <div className="toast-wrap">
      {toasts.map(t => {
        const c = TOAST_COLORS[t.type] || TOAST_COLORS.success;
        return (
          <div
            key={t.id}
            className="toast"
            style={{
              background: c.bg,
              borderColor: c.border,
              color: c.color,
              animation: t.leaving ? "slideOut 0.35s ease forwards" : "slideIn 0.35s ease",
            }}
          >
            <span style={{ flex: 1 }}>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
