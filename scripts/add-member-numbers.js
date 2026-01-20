#!/usr/bin/env node

/**
 * Script to add sequential member numbers to all members in the database
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Checking environment variables...');
console.log('Supabase URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('Supabase Key:', supabaseKey ? '✅ Found' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMemberNumbers() {
  try {
    console.log('🔄 Fetching all members...');

    // Fetch all members ordered by created_at
    const { data: members, error: fetchError } = await supabase
      .from('members')
      .select('id, full_name, created_at')
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch members: ${fetchError.message}`);
    }

    if (!members || members.length === 0) {
      console.log('⚠️  No members found in database');
      return;
    }

    console.log(`✅ Found ${members.length} members`);
    console.log('🔄 Assigning member numbers...\n');

    // Update each member with their sequential number
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      const memberNumber = i + 1; // Sequential number starting from 1

      const { error: updateError } = await supabase
        .from('members')
        .update({ member_number: memberNumber })
        .eq('id', member.id);

      if (updateError) {
        console.error(`❌ Error updating ${member.full_name}: ${updateError.message}`);
        errorCount++;
      } else {
        console.log(`✅ #${memberNumber.toString().padStart(3, '0')} - ${member.full_name}`);
        successCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Total members: ${members.length}`);
    console.log(`   Successfully updated: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 All member numbers assigned successfully!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
addMemberNumbers();
