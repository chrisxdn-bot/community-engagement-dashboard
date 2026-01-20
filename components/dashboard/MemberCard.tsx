import { Member } from '@/types'
import { Mail, Phone, MapPin, User } from 'lucide-react'

interface MemberCardProps {
  member: Member
}

export default function MemberCard({ member }: MemberCardProps) {
  // Get initials for avatar
  const initials = member.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

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

  return (
    <div className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-xl hover:border-slate-300/60 transition-all duration-300 hover:-translate-y-1">
      {/* Avatar & Name Section */}
      <div className="flex items-start gap-4 mb-5">
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${getAvatarColor(member.full_name)} flex items-center justify-center font-semibold text-base shadow-sm`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 mb-1 truncate group-hover:text-blue-600 transition-colors">
            {member.full_name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <User className="w-3.5 h-3.5" />
            <span>Member</span>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-3">
        {/* Email */}
        <div className="flex items-start gap-3 group/item">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mt-0.5">
            <Mail className="w-4 h-4 text-slate-600 group-hover/item:text-blue-600 transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-500 mb-0.5">Email</p>
            <a
              href={`mailto:${member.email}`}
              className="text-sm text-slate-700 hover:text-blue-600 transition-colors break-all"
            >
              {member.email}
            </a>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-start gap-3 group/item">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mt-0.5">
            <Phone className="w-4 h-4 text-slate-600 group-hover/item:text-green-600 transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-500 mb-0.5">Phone</p>
            <a
              href={`tel:${member.phone_number}`}
              className="text-sm text-slate-700 hover:text-green-600 transition-colors"
            >
              {member.phone_number}
            </a>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-3 group/item">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mt-0.5">
            <MapPin className="w-4 h-4 text-slate-600 group-hover/item:text-purple-600 transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-500 mb-0.5">Location</p>
            <p className="text-sm text-slate-700">{member.location}</p>
          </div>
        </div>
      </div>

      {/* Hover Action Indicator */}
      <div className="mt-5 pt-4 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs text-center text-slate-400 font-medium">
          Click to view details
        </p>
      </div>
    </div>
  )
}
