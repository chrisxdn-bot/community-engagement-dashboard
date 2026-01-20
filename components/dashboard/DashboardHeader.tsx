import { Search, Users, UserCheck, LayoutGrid, Table2 } from 'lucide-react'
import { Member } from '@/types'

type ViewMode = 'table' | 'cards'
type BehaviorFilter = 'all' | 'leader' | 'contributor' | 'supporter' | 'observer'

interface DashboardHeaderProps {
  totalCount: number
  filteredCount: number
  onSearch: (query: string) => void
  searchQuery: string
  loading: boolean
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  lastUpdated?: string | null
  behaviorFilter: BehaviorFilter
  onBehaviorFilterChange: (filter: BehaviorFilter) => void
  members: Member[]
}

export default function DashboardHeader({
  totalCount,
  filteredCount,
  onSearch,
  searchQuery,
  loading,
  viewMode,
  onViewModeChange,
  lastUpdated,
  behaviorFilter,
  onBehaviorFilterChange,
  members
}: DashboardHeaderProps) {
  const formatLastUpdated = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Calculate behavior distribution
  const behaviorCounts = {
    leader: members.filter(m => m.engagement_metrics?.behavior_type === 'leader').length,
    contributor: members.filter(m => m.engagement_metrics?.behavior_type === 'contributor').length,
    supporter: members.filter(m => m.engagement_metrics?.behavior_type === 'supporter').length,
    observer: members.filter(m => m.engagement_metrics?.behavior_type === 'observer').length,
  };

  const filterOptions: { value: BehaviorFilter; label: string; emoji: string; color: string }[] = [
    { value: 'all', label: 'All Members', emoji: '👥', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
    { value: 'leader', label: `Leaders (${behaviorCounts.leader})`, emoji: '🔨', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200' },
    { value: 'contributor', label: `Contributors (${behaviorCounts.contributor})`, emoji: '💡', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200' },
    { value: 'supporter', label: `Supporters (${behaviorCounts.supporter})`, emoji: '👏', color: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200' },
    { value: 'observer', label: `Observers (${behaviorCounts.observer})`, emoji: '👀', color: 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200' },
  ];

  return (
    <div className="mb-10">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent mb-3 tracking-tight">
            Community Members
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-slate-600 text-lg">
              Manage and connect with your community
            </p>
            {lastUpdated && (
              <>
                <span className="text-slate-300">•</span>
                <p className="text-sm text-slate-500">
                  Data updated {formatLastUpdated(lastUpdated)}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 px-6 py-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 rounded-lg">
                <Users className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Total Members</p>
                <p className="text-2xl font-bold text-slate-900">
                  {loading ? '...' : totalCount}
                </p>
              </div>
            </div>
          </div>
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
