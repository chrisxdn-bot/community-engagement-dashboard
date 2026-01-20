import { Member } from '@/types'
import MemberCard from './MemberCard'
import { UserX } from 'lucide-react'

interface MemberGridProps {
  members: Member[]
}

export default function MemberGrid({ members }: MemberGridProps) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <UserX className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No members found</h3>
        <p className="text-slate-600 text-center max-w-md">
          Try adjusting your search or check back later for new members.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {members.map(member => (
        <MemberCard key={member.id} member={member} />
      ))}
    </div>
  )
}
