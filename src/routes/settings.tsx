import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import Layout from '../components/Layout'
import { ProtectedRoute } from '../lib/auth-middleware'
import { ProfileTab } from './settings/-ProfileTab'
import { CommissionTab } from './settings/-CommissionTab'
import { GeneralTab } from './settings/-GeneralTab'
import { NotificationsTab } from './settings/-NotificationsTab'
import { SystemTab } from './settings/-SystemTab'

export const Route = createFileRoute('/settings')({
  component: Settings,
})

type Tab = 'profile' | 'general' | 'commission' | 'notifications' | 'system'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'profile',       label: 'Profile',       icon: '👤' },
  { id: 'general',       label: 'General',       icon: '⚙️' },
  { id: 'commission',    label: 'Commission',    icon: '💰' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'system',        label: 'System',        icon: '🖥️' },
]

function Settings() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  )
}

function SettingsContent() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary mb-1">Settings</h1>
        <p className="text-xs text-base-content/60">
          Configure platform settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Tab sidebar */}
        <div className="lg:col-span-1">
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body p-3">
              <h2 className="font-bold text-primary mb-2">Categories</h2>
              <div className="space-y-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
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

        {/* Tab content */}
        <div className="lg:col-span-3">
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body">
              {activeTab === 'profile'       && <ProfileTab />}
              {activeTab === 'general'       && <GeneralTab />}
              {activeTab === 'commission'    && <CommissionTab />}
              {activeTab === 'notifications' && <NotificationsTab />}
              {activeTab === 'system'        && <SystemTab />}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
