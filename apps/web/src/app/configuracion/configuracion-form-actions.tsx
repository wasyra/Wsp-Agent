export function ConfiguracionFormActions({
  settingsTab,
  saving,
  onReload,
  onClearSecrets,
}: {
  settingsTab: "general" | "agent";
  saving: boolean;
  onReload: () => void;
  onClearSecrets: () => void;
}) {
  return (
    <>
      {settingsTab === "general" ? (
        <section className="rounded-2xl border border-amber-500/35 bg-amber-950/35 p-4 text-sm text-amber-50">
          <strong>Importante:</strong> guardar secretos en la base de datos (Supabase) es cómodo para desarrollo; en
          producción valora cifrar, usar un vault o solo variables de entorno.
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[var(--wa-accent)] px-6 py-2.5 text-sm font-semibold text-[#041016] shadow-lg transition hover:bg-[var(--wa-accent-soft)] disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar configuración"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onReload}
          className="rounded-full border border-[var(--wa-border)] bg-[var(--wa-panel-hover)] px-5 py-2.5 text-sm font-medium text-[var(--wa-text)] transition hover:bg-[#3b4a54] disabled:opacity-50"
        >
          Recargar
        </button>
        {settingsTab === "general" ? (
          <button
            type="button"
            disabled={saving}
            onClick={onClearSecrets}
            className="rounded-full border border-red-500/50 bg-red-950/40 px-5 py-2.5 text-sm font-medium text-red-100 transition hover:bg-red-950/60 disabled:opacity-50"
          >
            Borrar tokens del panel
          </button>
        ) : null}
      </div>
    </>
  );
}
