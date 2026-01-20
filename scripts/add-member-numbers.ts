import { supabase } from '../lib/supabase'

async function addMemberNumbers() {
  console.log('Adding member_number column and populating data...')

  // First, get all members ordered by created_at
  const { data: members, error: fetchError } = await supabase
    .from('members')
    .select('id, created_at')
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })

  if (fetchError) {
    console.error('Error fetching members:', fetchError)
    return
  }

  console.log(`Found ${members?.length} members`)

  // Update each member with their sequential number
  if (members) {
    for (let i = 0; i < members.length; i++) {
      const { error: updateError } = await supabase
        .from('members')
        .update({ member_number: i + 1 })
        .eq('id', members[i].id)

      if (updateError) {
        console.error(`Error updating member ${members[i].id}:`, updateError)
      } else {
        console.log(`Updated member ${i + 1}/${members.length}`)
      }
    }
  }

  console.log('Done!')
}

addMemberNumbers()
