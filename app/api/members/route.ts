import { NextRequest, NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data: members, error } = await supabase
    .from('members')
    .select('*')
    .order('full_name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ members })
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  const csvText = await file.text()

  // Parse CSV
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true
  })

  // Transform to Member objects (Supabase format with snake_case)
  const members = records.map((row: any) => ({
    full_name: row['Full Name'] || row['Name'],
    email: row['Email'],
    phone_number: row['Phone Number'] || row['Phone'],
    location: row['Location']
  }))

  // Insert into Supabase
  const { data, error } = await supabase
    .from('members')
    .insert(members)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    imported: data.length
  })
}
