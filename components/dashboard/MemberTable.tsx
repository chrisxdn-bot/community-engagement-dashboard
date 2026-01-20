import { Member } from '@/types'
import { Mail, Phone, MapPin, ChevronDown, ChevronUp, ChevronsUpDown, MessageCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useState } from 'react'

interface MemberTableProps {
  members: Member[]
}

type SortField = 'full_name' | 'email' | 'location' | 'created_at' | 'engagement_score'
type SortDirection = 'asc' | 'desc'

export default function MemberTable({ members }: MemberTableProps) {
  const [sortField, setSortField] = useState<SortField>('engagement_score')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedMembers = [...members].sort((a, b) => {
    let aVal: any
    let bVal: any

    if (sortField === 'engagement_score') {
      aVal = a.engagement_metrics?.engagement_score ?? -1
      bVal = b.engagement_metrics?.engagement_score ?? -1
    } else {
      aVal = a[sortField]
      bVal = b[sortField]
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="w-4 h-4 text-slate-400" />
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-600" />
    )
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Generate consistent color from name
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-purple-100 text-purple-700',
      'bg-green-100 text-green-700',
      'bg-orange-100 text-orange-700',
      'bg-pink-100 text-pink-700',
      'bg-indigo-100 text-indigo-700',
      'bg-teal-100 text-teal-700',
      'bg-rose-100 text-rose-700',
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  // Get engagement trend (this month vs last month)
  const getEngagementTrend = (metrics: any) => {
    if (!metrics) return null

    const thisMonth = metrics.messages_this_month || 0
    const lastMonth = metrics.messages_last_month || 0

    if (thisMonth > lastMonth) {
      return { icon: TrendingUp, color: 'text-green-600', label: 'Up from last month' }
    } else if (thisMonth < lastMonth) {
      return { icon: TrendingDown, color: 'text-orange-600', label: 'Down from last month' }
    } else if (thisMonth === lastMonth && thisMonth > 0) {
      return { icon: Minus, color: 'text-slate-400', label: 'Same as last month' }
    }
    return null
  }

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-orange-700'
    if (score >= 60) return 'text-blue-700'
    if (score >= 40) return 'text-purple-700'
    if (score >= 20) return 'text-green-700'
    return 'text-slate-500'
  }

  if (members.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-12 text-center">
        <p className="text-slate-600">No members found</p>
      </div>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200/60 bg-slate-50/50">
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('full_name')}
                  className="flex items-center gap-2 font-semibold text-sm text-slate-700 hover:text-slate-900 transition-colors group"
                >
                  Name
                  <SortIcon field="full_name" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('engagement_score')}
                  className="flex items-center gap-2 font-semibold text-sm text-slate-700 hover:text-slate-900 transition-colors group"
                >
                  Engagement (Public WhatsApp)
                  <SortIcon field="engagement_score" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('email')}
                  className="flex items-center gap-2 font-semibold text-sm text-slate-700 hover:text-slate-900 transition-colors group"
                >
                  Email
                  <SortIcon field="email" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="flex items-center gap-2 font-semibold text-sm text-slate-700">
                  Phone
                </div>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('location')}
                  className="flex items-center gap-2 font-semibold text-sm text-slate-700 hover:text-slate-900 transition-colors group"
                >
                  Location
                  <SortIcon field="location" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('created_at')}
                  className="flex items-center gap-2 font-semibold text-sm text-slate-700 hover:text-slate-900 transition-colors group"
                >
                  Joined
                  <SortIcon field="created_at" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedMembers.map((member) => {
              const trend = getEngagementTrend(member.engagement_metrics)
              const TrendIcon = trend?.icon

              return (
                <tr
                  key={member.id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  {/* Name with Avatar */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${getAvatarColor(member.full_name)} flex items-center justify-center font-semibold text-sm shadow-sm`}>
                        {getInitials(member.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {member.full_name}
                        </p>
                        <p className="text-xs text-slate-500">Member #{member.member_number}</p>
                      </div>
                    </div>
                  </td>

                  {/* Engagement */}
                  <td className="px-6 py-4">
                    {member.engagement_metrics ? (
                      <div className="flex items-center gap-6">
                        {/* Message Count */}
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-5 h-5 text-slate-400" />
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-bold text-slate-900 tabular-nums">
                              {member.engagement_metrics.total_messages}
                            </span>
                            <span className="text-sm text-slate-500 font-medium">messages</span>
                          </div>
                          {TrendIcon && (
                            <TrendIcon className={`w-4 h-4 ${trend.color}`} />
                          )}
                        </div>

                        {/* Metrics */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-bold text-slate-900 tabular-nums">{member.engagement_metrics.messages_this_month}</div>
                            <div className="text-xs text-slate-500">this month</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-slate-700 tabular-nums">{member.engagement_metrics.messages_last_month}</div>
                            <div className="text-xs text-slate-500">last month</div>
                          </div>
                          <div className="text-center">
                            <div className={`font-bold tabular-nums ${getScoreColor(member.engagement_metrics.engagement_score)}`}>
                              {member.engagement_metrics.engagement_score}
                            </div>
                            <div className="text-xs text-slate-500">score</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <MessageCircle className="w-4 h-4" />
                        <span>No activity</span>
                      </div>
                    )}
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4">
                    <a
                      href={`mailto:${member.email}`}
                      className="flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 transition-colors group/email"
                    >
                      <Mail className="w-4 h-4 text-slate-400 group-hover/email:text-blue-600" />
                      <span className="truncate max-w-xs">{member.email}</span>
                    </a>
                  </td>

                  {/* Phone */}
                  <td className="px-6 py-4">
                    <a
                      href={`tel:${member.phone_number}`}
                      className="flex items-center gap-2 text-sm text-slate-700 hover:text-green-600 transition-colors group/phone"
                    >
                      <Phone className="w-4 h-4 text-slate-400 group-hover/phone:text-green-600" />
                      <span>{member.phone_number}</span>
                    </a>
                  </td>

                  {/* Location */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="truncate max-w-xs">{member.location}</span>
                    </div>
                  </td>

                  {/* Joined Date */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">
                      {new Date(member.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Count */}
      <div className="px-6 py-4 border-t border-slate-200/60 bg-slate-50/30">
        <p className="text-sm text-slate-600">
          Showing <span className="font-semibold text-slate-900">{members.length}</span> members
        </p>
      </div>
    </div>
  )
}
