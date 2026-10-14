import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { prismaQuery } from '../../lib/prisma-client'

interface FareConfig {
  id: string
  version: string
  baseFare: string | number
  perKmRate: string | number
  minimumFare: string | number
  platformCommission: string | number
  isActive: boolean
  effectiveFrom: string
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
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

export function CommissionTab() {
  const queryClient = useQueryClient()
  const [baseFare, setBaseFare] = useState('')
  const [perKmRate, setPerKmRate] = useState('')
  const [minimumFare, setMinimumFare] = useState('')
  const [platformCommission, setPlatformCommission] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const { data: config, isLoading, isError } = useQuery<FareConfig>({
    queryKey: ['fareConfig', 'active'],
    queryFn: () =>
      prismaQuery<FareConfig>({
        model: 'fareConfig',
        operation: 'findFirst',
        args: {
          where: { isActive: true },
          orderBy: { effectiveFrom: 'desc' },
        },
      }),
    staleTime: 60_000,
  })

  useEffect(() => {
    if (config) {
      setBaseFare(Number(config.baseFare).toFixed(2))
      setPerKmRate(Number(config.perKmRate).toFixed(2))
      setMinimumFare(Number(config.minimumFare).toFixed(2))
      setPlatformCommission(Number(config.platformCommission).toFixed(2))
    }
  }, [config?.id])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (config) {
        await prismaQuery({
          model: 'fareConfig',
          operation: 'update',
          args: { where: { id: config.id }, data: { isActive: false } },
        })
      }
      const nextVersion = config
        ? (() => {
            const [major, minor] = config.version.split('.').map(Number)
            return `${major}.${(minor ?? 0) + 1}`
          })()
        : '1.0'

      return prismaQuery({
        model: 'fareConfig',
        operation: 'create',
        args: {
          data: {
            version: nextVersion,
            baseFare: parseFloat(baseFare),
            perKmRate: parseFloat(perKmRate),
            minimumFare: parseFloat(minimumFare),
            platformCommission: parseFloat(platformCommission),
            isActive: true,
            effectiveFrom: new Date().toISOString(),
          },
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fareConfig'] })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
  })

  const resetForm = () => {
    if (config) {
      setBaseFare(Number(config.baseFare).toFixed(2))
      setPerKmRate(Number(config.perKmRate).toFixed(2))
      setMinimumFare(Number(config.minimumFare).toFixed(2))
      setPlatformCommission(Number(config.platformCommission).toFixed(2))
    }
  }

  if (isLoading) {
    return (
      <div>
        <h2 className="text-lg font-bold text-primary mb-6">Commission & Fare Settings</h2>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="grid grid-cols-3 gap-4 py-3 border-b border-base-300">
              <div className="h-4 skeleton rounded w-2/3" />
              <div className="col-span-2 h-9 skeleton rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-primary">Commission & Fare Settings</h2>
          <p className="text-xs text-base-content/50 mt-0.5">
            Saving creates a new versioned config — history is preserved.
          </p>
        </div>
        {config && (
          <span className="badge badge-success badge-sm">
            v{config.version} active
          </span>
        )}
      </div>

      {isError && !isLoading && (
        <div className="alert alert-warning mb-4 text-sm">
          No active fare config found. Fill in the fields below to create the first one.
        </div>
      )}
      {saveSuccess && (
        <div className="alert alert-success mb-4 text-sm">
          Fare config saved successfully.
        </div>
      )}
      {saveMutation.isError && (
        <div className="alert alert-error mb-4 text-sm">
          Failed to save. Please try again.
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate() }}>
        <Field label="Platform Commission" hint="Percentage deducted from each fare">
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={platformCommission}
              onChange={(e) => setPlatformCommission(e.target.value)}
              className="input input-bordered input-sm w-32"
              required
            />
            <span className="text-sm text-base-content/60">%</span>
          </div>
        </Field>

        <Field label="Minimum Fare" hint="Floor price regardless of distance">
          <div className="flex items-center gap-2">
            <span className="text-sm text-base-content/60">₱</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={minimumFare}
              onChange={(e) => setMinimumFare(e.target.value)}
              className="input input-bordered input-sm w-32"
              required
            />
          </div>
        </Field>

        <Field label="Base Fare" hint="Flat charge at start of every trip">
          <div className="flex items-center gap-2">
            <span className="text-sm text-base-content/60">₱</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={baseFare}
              onChange={(e) => setBaseFare(e.target.value)}
              className="input input-bordered input-sm w-32"
              required
            />
          </div>
        </Field>

        <Field label="Per KM Rate" hint="Added on top of base fare per kilometre">
          <div className="flex items-center gap-2">
            <span className="text-sm text-base-content/60">₱</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={perKmRate}
              onChange={(e) => setPerKmRate(e.target.value)}
              className="input input-bordered input-sm w-32"
              required
            />
            <span className="text-sm text-base-content/60">/ km</span>
          </div>
        </Field>

        <div className="flex gap-2 mt-6">
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending && <span className="loading loading-spinner loading-xs" />}
            Save New Version
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={resetForm}
            disabled={saveMutation.isPending || !config}
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  )
}
