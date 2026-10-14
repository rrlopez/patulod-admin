function NotificationRow({
  label,
  description,
  defaultChecked,
}: {
  label: string
  description: string
  defaultChecked: boolean
}) {
  return (
    <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-base-300 last:border-0">
      <div>
        <p className="text-sm font-medium text-base-content/70">{label}</p>
        <p className="text-xs text-base-content/40 mt-0.5">{description}</p>
      </div>
      <div className="col-span-2">
        <input
          type="checkbox"
          className="toggle toggle-primary toggle-sm"
          defaultChecked={defaultChecked}
        />
      </div>
    </div>
  )
}

export function NotificationsTab() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-primary">Notification Settings</h2>
        <p className="text-xs text-base-content/50 mt-0.5">Control which events trigger admin alerts</p>
      </div>

      <NotificationRow
        label="New Booking Alerts"
        description="Get notified when new bookings are created"
        defaultChecked={true}
      />
      <NotificationRow
        label="Driver Application Alerts"
        description="Get notified about new driver applications"
        defaultChecked={true}
      />
      <NotificationRow
        label="Support Case Alerts"
        description="Get notified about new support cases"
        defaultChecked={false}
      />
      <NotificationRow
        label="Payment Dispute Alerts"
        description="Get notified when a payment is disputed"
        defaultChecked={true}
      />

      <div className="flex gap-2 mt-6">
        <button className="btn btn-primary btn-sm" disabled>Save Changes</button>
        <span className="text-xs text-base-content/40 self-center">Coming in Phase 6</span>
      </div>
    </div>
  )
}
