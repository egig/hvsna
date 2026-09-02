/**
 * The very first thing painted, before providers or routing exist — shown
 * while modules/bootstrap.ts restores the session and runs the initial sync.
 * Deliberately self-contained (no context, no i18n, inline styles) so it can
 * render outside the provider tree.
 */
export function BootScreen() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        background: "#ffffff",
        color: "#2e335a",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div
        className="animate-spin"
        style={{
          width: 28,
          height: 28,
          borderRadius: 9999,
          border: "3px solid #d5d9ec",
          borderTopColor: "#2e335a",
        }}
      />
      <span style={{ fontSize: 14, letterSpacing: 0.2 }}>Initiating…</span>
    </div>
  );
}
