function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 items-start py-3 border-b border-base-300 last:border-0">
      <div className="pt-2">
        <p className="text-sm font-medium text-base-content/70">{label}</p>
        {hint && <p className="text-xs text-base-content/40 mt-0.5">{hint}</p>}
      </div>
      <div className="col-span-2">{children}</div>
    </div>
  )
}

export function SystemTab() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-primary">System Settings</h2>
        <p className="text-xs text-base-content/50 mt-0.5">Environment and operational controls</p>
      </div>

      <Field label="Maintenance Mode" hint="Prevents new bookings while enabled">
        <div className="flex items-center gap-3">
          <input type="checkbox" className="toggle toggle-warning toggle-sm" />
          <span className="text-xs text-base-content/50">Off</span>
        </div>
      </Field>

      <Field label="Environment">
        <select className="select select-bordered select-sm w-48" defaultValue="Development">
          <option>Development</option>
          <option>Staging</option>
          <option>Production</option>
        </select>
      </Field>

      <Field label="API Version" hint="Read-only — set by deployment">
        <input
          type="text"
          value="v1.0.0"
          className="input input-bordered input-sm w-48 bg-base-300 cursor-not-allowed"
          disabled
        />
      </Field>

      <div className="flex gap-2 mt-6">
        <button className="btn btn-primary btn-sm" disabled>Save Changes</button>
        <span className="text-xs text-base-content/40 self-center">Coming in Phase 6</span>
      </div>
    </div>
  )
}
