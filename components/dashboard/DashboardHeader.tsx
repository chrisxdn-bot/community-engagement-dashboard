import { Search, Users, UserCheck, LayoutGrid, Table2 } from 'lucide-react'

type ViewMode = 'table' | 'cards'

interface DashboardHeaderProps {
  totalCount: number
  filteredCount: number
  onSearch: (query: string) => void
  searchQuery: string
  loading: boolean
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export default function DashboardHeader({
  totalCount,
  filteredCount,
  onSearch,
  searchQuery,
  loading,
  viewMode,
  onViewModeChange
}: DashboardHeaderProps) {
  return (
    <div className="mb-10">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent mb-3 tracking-tight">
            Community Members
          </h1>
          <p className="text-slate-600 text-lg">
            Manage and connect with your community
          </p>
        </div>

        {/* Stats Cards */}
        <div className="flex gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 px-6 py-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Total Members</p>
                <p className="text-2xl font-bold text-slate-900">
                  {loading ? '...' : totalCount}
                </p>
              </div>
            </div>
          </div>

          {searchQuery && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 px-6 py-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Filtered</p>
                  <p className="text-2xl font-bold text-slate-900">{filteredCount}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar & View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search members by name..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all shadow-sm hover:shadow-md text-base"
          />
          {searchQuery && (
            <button
              onClick={() => onSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => onViewModeChange('table')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              viewMode === 'table'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Table2 className="w-4 h-4" />
            Table
          </button>
          <button
            onClick={() => onViewModeChange('cards')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              viewMode === 'cards'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Cards
          </button>
        </div>
      </div>
    </div>
  )
}
