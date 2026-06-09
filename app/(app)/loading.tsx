// Next.js renders this automatically as the Suspense fallback for any
// (app)/* route while its server component is still fetching data from
// Supabase. Renders inside the existing shell so the sidebar stays put.
export default function AppLoading() {
  return (
    <>
      <div className="route-progress" aria-hidden="true" />
      <div
        role="status"
        aria-live="polite"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px",
          color: "var(--fg3)",
          fontSize: 13,
          gap: 10,
        }}
      >
        <span className="navitem-spinner" aria-hidden="true" />
        <span>Loading…</span>
      </div>
    </>
  );
}
