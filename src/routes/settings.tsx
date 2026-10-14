import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import { ProtectedRoute } from '../lib/auth-middleware'
import { useSession } from '../lib/auth-client'
import { prismaQuery } from '../lib/prisma-client'

export const Route = createFileRoute('/settings')({
  component: Settings,
})

type Tab = 'profile' | 'general' | 'commission' | 'notifications' | 'system'

interface AdminProfile {
  id: string
  fullName: string
  email: string
  phone: string | null
  role: string
  isActive: boolean
}

function Settings() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  )
}

function SettingsContent() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  // ── Fetch admin profile via /api/prisma ───────────────────────────
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery<AdminProfile>({
    queryKey: ['admin', 'profile'],
    queryFn: () =>
      prismaQuery<AdminProfile>({
        model: 'admin',
        operation: 'findFirst',
        args: { where: { userId: session?.user?.id } },
      }),
    enabled: !!session?.user?.id,
  })

  // ── Form state (initialised from fetched profile) ─────────────────
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Sync form when profile loads
  useState(() => {
    if (profile) {
      setFullName(profile.fullName)
      setPhone(profile.phone ?? '')
    }
  })

  // ── Update mutation ───────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (data: { fullName: string; phone: string }) =>
      prismaQuery({
        model: 'admin',
        operation: 'update',
        args: {
          where: { id: profile?.id },
          data: {
            fullName: data.fullName.trim(),
            phone: data.phone.trim() || null,
          },
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'profile'] })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
  })

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({ fullName, phone })
  }

  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary mb-1">Settings</h1>
        <p className="text-xs text-base-content/60">
          Configure platform settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Tabs */}
        <div className="lg:col-span-1">
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body p-3">
              <h2 className="font-bold text-primary mb-2">Categories</h2>
              <div className="space-y-1">
                {[
                  { id: 'profile',       label: 'Profile',       icon: '👤' },
                  { id: 'general',       label: 'General',       icon: '⚙️' },
                  { id: 'commission',    label: 'Commission',    icon: '💰' },
                  { id: 'notifications', label: 'Notifications', icon: '🔔' },
                  { id: 'system',        label: 'System',        icon: '🖥️' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`btn btn-sm w-full justify-start gap-2 ${
                      activeTab === tab.id ? 'btn-primary' : 'btn-ghost'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body">
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-bold text-primary mb-4">My Profile</h2>

                  {profileLoading && (
                    <div className="flex items-center gap-3 text-base-content/60">
                      <span className="loading loading-spinner loading-sm" />
                      Loading profile…
                    </div>
                  )}

                  {profileError && (
                    <div className="alert alert-error mb-4">
                      <span>Failed to load profile. Please refresh.</span>
                    </div>
                  )}

                  {saveSuccess && (
                    <div className="alert alert-success mb-4">
                      <span>Profile updated successfully.</span>
                    </div>
                  )}

                  {updateMutation.isError && (
                    <div className="alert alert-error mb-4">
                      <span>{(updateMutation.error as Error).message}</span>
                    </div>
                  )}

                  {profile && (
                    <form onSubmit={handleProfileSave} className="space-y-4">
                      {/* Read-only fields */}
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Email</span>
                        </label>
                        <input
                          type="email"
                          value={profile.email}
                          className="input input-bordered bg-base-300 cursor-not-allowed"
                          disabled
                        />
                        <label className="label">
                          <span className="label-text-alt">
                            Email cannot be changed here
                          </span>
                        </label>
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Role</span>
                        </label>
                        <input
                          type="text"
                          value={profile.role.replace(/_/g, ' ')}
                          className="input input-bordered bg-base-300 cursor-not-allowed"
                          disabled
                        />
                      </div>

                      {/* Editable fields */}
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Full Name</span>
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="input input-bordered"
                          required
                          minLength={2}
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Phone</span>
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="input input-bordered"
                          placeholder="+63 917 123 4567"
                        />
                      </div>

                      <div className="flex gap-2 mt-6 pt-4 border-t border-base-300">
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending && (
                            <span className="loading loading-spinner loading-xs" />
                          )}
                          Save Changes
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => {
                            setFullName(profile.fullName)
                            setPhone(profile.phone ?? '')
                          }}
                          disabled={updateMutation.isPending}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {activeTab === 'general' && (
                <div>
                  <h2 className="text-xl font-bold text-primary mb-4">
                    General Settings
                  </h2>
                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Platform Name</span>
                      </label>
                      <input
                        type="text"
                        value="PATULOD"
                        className="input input-bordered"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Support Email</span>
                      </label>
                      <input
                        type="email"
                        value="support@patulod.com"
                        className="input input-bordered"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Support Phone</span>
                      </label>
                      <input
                        type="tel"
                        value="+63 912 345 6789"
                        className="input input-bordered"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'commission' && (
                <div>
                  <h2 className="text-xl font-bold text-primary mb-4">
                    Commission Settings
                  </h2>
                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Platform Commission (%)</span>
                      </label>
                      <input
                        type="number"
                        value="20"
                        className="input input-bordered"
                      />
                      <label className="label">
                        <span className="label-text-alt">
                          Percentage of each trip fare
                        </span>
                      </label>
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Minimum Fare (₱)</span>
                      </label>
                      <input
                        type="number"
                        value="50"
                        className="input input-bordered"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Base Fare (₱)</span>
                      </label>
                      <input
                        type="number"
                        value="40"
                        className="input input-bordered"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Per KM Rate (₱)</span>
                      </label>
                      <input
                        type="number"
                        value="15"
                        className="input input-bordered"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-bold text-primary mb-4">
                    Notification Settings
                  </h2>
                  <div className="space-y-3">
                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-3">
                        <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                        <div>
                          <span className="label-text font-medium">New Booking Alerts</span>
                          <p className="text-xs text-base-content/60">
                            Get notified when new bookings are created
                          </p>
                        </div>
                      </label>
                    </div>
                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-3">
                        <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                        <div>
                          <span className="label-text font-medium">Driver Application Alerts</span>
                          <p className="text-xs text-base-content/60">
                            Get notified about new driver applications
                          </p>
                        </div>
                      </label>
                    </div>
                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-3">
                        <input type="checkbox" className="checkbox checkbox-primary" />
                        <div>
                          <span className="label-text font-medium">Support Case Alerts</span>
                          <p className="text-xs text-base-content/60">
                            Get notified about new support cases
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'system' && (
                <div>
                  <h2 className="text-xl font-bold text-primary mb-4">
                    System Settings
                  </h2>
                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Maintenance Mode</span>
                      </label>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                      />
                      <label className="label">
                        <span className="label-text-alt">
                          Enable maintenance mode to prevent new bookings
                        </span>
                      </label>
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">API Version</span>
                      </label>
                      <input
                        type="text"
                        value="v1.0.0"
                        className="input input-bordered"
                        disabled
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Environment</span>
                      </label>
                      <select className="select select-bordered">
                        <option>Development</option>
                        <option>Staging</option>
                        <option>Production</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
