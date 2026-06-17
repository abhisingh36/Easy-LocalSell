import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg, var(--blue-50) 0%, var(--bg) 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, fontFamily: "Inter, sans-serif"
    }}>
      {/* Big 404 */}
      <div style={{ position: "relative", marginBottom: 8 }}>
        <p style={{
          fontSize: "clamp(80px, 18vw, 160px)", fontWeight: 800,
          color: "var(--blue-100)", lineHeight: 1, userSelect: "none", letterSpacing: "-0.04em"
        }}>404</p>
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <span style={{ fontSize: 56 }}>🔍</span>
        </div>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--gray-900)", marginBottom: 10, textAlign: "center" }}>
        Page not found
      </h1>
      <p style={{ fontSize: 14, color: "var(--gray-500)", marginBottom: 32, textAlign: "center", maxWidth: 340, lineHeight: 1.6 }}>
        Looks like this page doesn't exist or was moved. Let's get you back to browsing!
      </p>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/home")}
        >
          🏠 Go to Home
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
        >
          ← Go back
        </button>
      </div>

      {/* EASY branding */}
      <p
        style={{ marginTop: 48, fontSize: 22, fontWeight: 800, color: "var(--blue-600)", letterSpacing: "0.04em", cursor: "pointer" }}
        onClick={() => navigate("/home")}
      >
        EASY
      </p>
      <p style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 4 }}>Buy & sell locally</p>
    </div>
  );
}
