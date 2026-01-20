#!/usr/bin/env node

/**
 * Script to import WhatsApp messages from exported chat file
 * Usage: npx ts-node scripts/import-whatsapp-messages.ts /path/to/chat.txt
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parseWhatsAppChat, getMessageStats, matchSendersToMembers } from '../lib/whatsapp/parser.js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importWhatsAppMessages(filePath: string) {
  try {
    console.log('📱 WhatsApp Message Importer\n');
    console.log(`📂 Reading file: ${filePath}`);

    // Read the chat file
    const content = readFileSync(filePath, 'utf-8');

    console.log('🔍 Parsing WhatsApp messages...');
    const messages = parseWhatsAppChat(content);

    console.log(`✅ Parsed ${messages.length} messages\n`);

    // Get statistics
    const stats = getMessageStats(messages);
    console.log('📊 Message Statistics:');
    console.log(`   Total messages: ${stats.totalMessages}`);
    console.log(`   Unique senders: ${stats.uniqueSenderCount}`);
    console.log(`   Date range: ${stats.dateRange.start?.toLocaleDateString()} - ${stats.dateRange.end?.toLocaleDateString()}`);
    console.log(`   By type:`);
    for (const [type, count] of Object.entries(stats.byType)) {
      console.log(`      ${type}: ${count}`);
    }
    console.log('');

    // Fetch all members from database
    console.log('👥 Fetching members from database...');
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, full_name, phone_number');

    if (membersError) {
      throw new Error(`Failed to fetch members: ${membersError.message}`);
    }

    console.log(`✅ Found ${members?.length || 0} members in database\n`);

    // Match senders to members
    console.log('🔗 Matching senders to members...');
    const uniqueSenders = Array.from(stats.uniqueSenders);
    const senderMatches = matchSendersToMembers(uniqueSenders, members || []);

    let matchedCount = 0;
    let unmatchedSenders: string[] = [];

    for (const [sender, memberId] of senderMatches.entries()) {
      if (memberId) {
        matchedCount++;
      } else {
        unmatchedSenders.push(sender);
      }
    }

    console.log(`✅ Matched ${matchedCount}/${uniqueSenders.length} senders`);
    if (unmatchedSenders.length > 0) {
      console.log(`⚠️  Unmatched senders (${unmatchedSenders.length}):`);
      unmatchedSenders.slice(0, 10).forEach(sender => {
        console.log(`   - ${sender}`);
      });
      if (unmatchedSenders.length > 10) {
        console.log(`   ... and ${unmatchedSenders.length - 10} more`);
      }
    }
    console.log('');

    // Import messages to database
    console.log('💾 Importing messages to database...');

    let importedCount = 0;
    let errorCount = 0;
    const batchSize = 100;

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const dbMessages = batch.map(msg => {
        const memberId = senderMatches.get(msg.senderName);

        return {
          member_id: memberId,
          sender_name: msg.senderName,
          message_content: msg.messageContent,
          message_type: msg.messageType,
          timestamp: msg.timestamp.toISOString(),
          is_matched: !!memberId,
          raw_line: msg.rawLine
        };
      });

      const { error } = await supabase
        .from('whatsapp_messages')
        .insert(dbMessages);

      if (error) {
        console.error(`❌ Error importing batch ${i / batchSize + 1}: ${error.message}`);
        errorCount += batch.length;
      } else {
        importedCount += batch.length;
        const progress = Math.min(((i + batchSize) / messages.length) * 100, 100);
        process.stdout.write(`\r   Progress: ${progress.toFixed(1)}% (${importedCount}/${messages.length})`);
      }
    }

    console.log('\n');

    // Calculate engagement metrics for matched members
    console.log('📈 Calculating engagement metrics...');

    const memberMessageCounts = new Map<string, number>();

    for (const message of messages) {
      const memberId = senderMatches.get(message.senderName);
      if (memberId) {
        memberMessageCounts.set(memberId, (memberMessageCounts.get(memberId) || 0) + 1);
      }
    }

    // Update engagement metrics for each member
    for (const [memberId, messageCount] of memberMessageCounts.entries()) {
      const firstMessage = messages.find(m => senderMatches.get(m.senderName) === memberId);
      const lastMessage = messages.filter(m => senderMatches.get(m.senderName) === memberId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

      // Calculate engagement score (simple formula for now)
      const engagementScore = Math.min(100, Math.floor((messageCount / messages.length) * 1000));

      const { error: metricsError } = await supabase
        .from('engagement_metrics')
        .upsert({
          member_id: memberId,
          total_messages: messageCount,
          first_message_at: firstMessage?.timestamp.toISOString(),
          last_message_at: lastMessage?.timestamp.toISOString(),
          engagement_score: engagementScore,
          last_calculated_at: new Date().toISOString()
        }, {
          onConflict: 'member_id'
        });

      if (metricsError) {
        console.error(`❌ Error updating metrics for member ${memberId}: ${metricsError.message}`);
      }
    }

    console.log(`✅ Updated engagement metrics for ${memberMessageCounts.size} members\n`);

    // Final summary
    console.log('🎉 Import Complete!\n');
    console.log('📊 Summary:');
    console.log(`   Messages imported: ${importedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Matched members: ${matchedCount}/${uniqueSenders.length}`);
    console.log(`   Unmatched senders: ${unmatchedSenders.length}`);
    console.log(`   Engagement metrics updated: ${memberMessageCounts.size} members`);

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Get file path from command line arguments
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: npx ts-node scripts/import-whatsapp-messages.ts /path/to/chat.txt');
  process.exit(1);
}

// Run the import
importWhatsAppMessages(filePath);
