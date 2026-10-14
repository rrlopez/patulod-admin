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

export function GeneralTab() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-primary">General Settings</h2>
        <p className="text-xs text-base-content/50 mt-0.5">Platform identity and contact information</p>
      </div>

      <Field label="Platform Name">
        <input type="text" defaultValue="PATULOD" className="input input-bordered input-sm w-full" />
      </Field>

      <Field label="Support Email" hint="Displayed on help screens">
        <input type="email" defaultValue="support@patulod.com" className="input input-bordered input-sm w-full" />
      </Field>

      <Field label="Support Phone" hint="Displayed on help screens">
        <input type="tel" defaultValue="+63 912 345 6789" className="input input-bordered input-sm w-full" />
      </Field>

      <div className="flex gap-2 mt-6">
        <button className="btn btn-primary btn-sm" disabled>Save Changes</button>
        <span className="text-xs text-base-content/40 self-center">Coming in Phase 6</span>
      </div>
    </div>
  )
}
