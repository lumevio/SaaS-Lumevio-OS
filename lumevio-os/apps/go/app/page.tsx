export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 720,
          width: "100%",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          padding: 32,
        }}
      >
        <h1 style={{ marginTop: 0 }}>LUMEVIO GO</h1>
        <p style={{ color: "#9ea8d8" }}>
          Publiczna warstwa kampanii. Wejdź na konkretny slug, np.
          <br />
          <strong>/zabka-konkurs</strong>
        </p>
      </div>
    </main>
  );
}