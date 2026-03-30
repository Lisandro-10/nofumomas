"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "sans-serif",
          backgroundColor: "#f5f5f5",
          margin: 0,
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "1rem",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            padding: "2.5rem",
            maxWidth: "400px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <h1 style={{ color: "#0f2340", marginBottom: "1rem" }}>
            Algo salió mal
          </h1>
          <p style={{ color: "#0f234099", marginBottom: "2rem" }}>
            Ocurrió un error crítico. Podés intentar recargar la página.
          </p>
          <button
            onClick={reset}
            style={{
              backgroundColor: "#f97316",
              color: "white",
              border: "none",
              borderRadius: "9999px",
              padding: "1rem 2rem",
              fontWeight: "bold",
              cursor: "pointer",
              width: "100%",
            }}
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  );
}
