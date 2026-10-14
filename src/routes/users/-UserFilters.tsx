export type UserRoleFilter = 'ALL' | 'PASSENGER' | 'DRIVER'

interface UserFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  roleFilter: UserRoleFilter
  onRoleChange: (role: UserRoleFilter) => void
}

export function UserFilters({
  search,
  onSearchChange,
  roleFilter,
  onRoleChange,
}: UserFiltersProps) {
  return (
    <div className="card bg-base-200 border border-base-300 shadow-sm mb-4">
      <div className="card-body p-3">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <label className="input input-bordered input-sm flex items-center gap-2 flex-1 md:max-w-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by name or phone…"
              className="grow"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </label>

          <div className="flex gap-2 flex-wrap">
            {(['ALL', 'PASSENGER', 'DRIVER'] as UserRoleFilter[]).map((r) => (
              <button
                key={r}
                onClick={() => onRoleChange(r)}
                className={`btn btn-xs ${
                  roleFilter === r
                    ? r === 'DRIVER'
                      ? 'btn-secondary'
                      : 'btn-primary'
                    : 'btn-ghost border border-base-300'
                }`}
              >
                {r === 'ALL' ? 'All Roles' : r.charAt(0) + r.slice(1).toLowerCase() + 's'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
