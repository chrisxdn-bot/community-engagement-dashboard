'use client'

import { useState, useEffect } from 'react'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import MemberGrid from '@/components/dashboard/MemberGrid'
import MemberTable from '@/components/dashboard/MemberTable'
import { Member } from '@/types'

type ViewMode = 'table' | 'cards'

export default function DashboardPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  useEffect(() => {
    setLoading(true)
    fetch('/api/members')
      .then(res => res.json())
      .then(data => {
        setMembers(data.members || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filteredMembers = members.filter(m =>
    m.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/50">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative">
        {/* Container with max width for better readability */}
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 py-8 lg:py-12">
          <DashboardHeader
            totalCount={members.length}
            filteredCount={filteredMembers.length}
            onSearch={setSearchQuery}
            searchQuery={searchQuery}
            loading={loading}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {loading ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-8 animate-pulse">
              <div className="space-y-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-1/4" />
                      <div className="h-3 bg-slate-100 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : viewMode === 'table' ? (
            <MemberTable members={filteredMembers} />
          ) : (
            <MemberGrid members={filteredMembers} />
          )}
        </div>
      </div>
    </div>
  )
}
