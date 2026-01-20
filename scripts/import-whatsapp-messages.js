#!/usr/bin/env node

/**
 * Script to import WhatsApp messages from exported chat file
 * Usage: node scripts/import-whatsapp-messages.js /path/to/chat.txt
 */

const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Parse WhatsApp chat export file
 */
function parseWhatsAppChat(content) {
  const lines = content.split('\n');
  const messages = [];
  let currentMessage = null;

  // Regex to match WhatsApp message format
  const messageRegex = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s+(\d{1,2}:\d{2}:\d{2}\s+(?:AM|PM))\]\s+([^:]+):\s*(.*)$/;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine) continue;

    const match = trimmedLine.match(messageRegex);

    if (match) {
      if (currentMessage) {
        messages.push(currentMessage);
      }

      const [, date, time, sender, content] = match;
      const timestamp = parseTimestamp(date, time);
      const messageType = detectMessageType(content);

      currentMessage = {
        timestamp,
        senderName: sender.trim(),
        messageContent: content.trim(),
        messageType,
        rawLine: trimmedLine
      };
    } else if (currentMessage) {
      currentMessage.messageContent += '\n' + trimmedLine;
      currentMessage.rawLine += '\n' + trimmedLine;
    }
  }

  if (currentMessage) {
    messages.push(currentMessage);
  }

  return messages;
}

function parseTimestamp(dateStr, timeStr) {
  const dateParts = dateStr.split('/');
  const month = parseInt(dateParts[0], 10) - 1;
  const day = parseInt(dateParts[1], 10);
  let year = parseInt(dateParts[2], 10);

  if (year < 100) year += 2000;

  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)/);
  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const seconds = parseInt(timeMatch[3], 10);
  const period = timeMatch[4];

  if (period === 'PM' && hours !== 12) hours += 12;
  else if (period === 'AM' && hours === 12) hours = 0;

  return new Date(year, month, day, hours, minutes, seconds);
}

function detectMessageType(content) {
  if (content.includes('‎image omitted')) return 'image';
  if (content.includes('‎video omitted')) return 'video';
  if (content.includes('‎sticker omitted')) return 'sticker';
  if (content.includes('‎audio omitted')) return 'audio';
  if (content.includes('POLL:')) return 'poll';
  if (content.includes('‎pinned') || content.includes('‎added') || content.includes('‎left')) return 'system';
  return 'text';
}

function cleanName(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function findBestMatch(senderName, members) {
  const cleanSender = cleanName(senderName);

  // Exact match
  for (const member of members) {
    if (cleanName(member.full_name) === cleanSender) {
      return member.id;
    }
  }

  // Partial match
  for (const member of members) {
    const cleanMemberName = cleanName(member.full_name);
    if (cleanSender.includes(cleanMemberName) || cleanMemberName.includes(cleanSender)) {
      return member.id;
    }
  }

  // First/last name match
  const senderParts = cleanSender.split(/\s+/);
  const senderFirst = senderParts[0];
  const senderLast = senderParts[senderParts.length - 1];

  for (const member of members) {
    const memberParts = cleanName(member.full_name).split(/\s+/);
    const memberFirst = memberParts[0];
    const memberLast = memberParts[memberParts.length - 1];

    if (senderFirst === memberFirst && (senderLast === memberLast || senderParts.length === 1)) {
      return member.id;
    }
  }

  return null;
}

async function importMessages(filePath) {
  try {
    console.log('📱 WhatsApp Message Importer\n');
    console.log(`📂 Reading: ${filePath}`);

    const content = readFileSync(filePath, 'utf-8');
    console.log('🔍 Parsing messages...');

    const messages = parseWhatsAppChat(content);
    console.log(`✅ Parsed ${messages.length} messages\n`);

    // Fetch members
    console.log('👥 Fetching members...');
    const { data: members, error } = await supabase
      .from('members')
      .select('id, full_name, phone_number');

    if (error) throw error;
    console.log(`✅ Found ${members.length} members\n`);

    // Match senders
    console.log('🔗 Matching senders...');
    const uniqueSenders = [...new Set(messages.map(m => m.senderName))];
    const senderMatches = new Map();
    let matchedCount = 0;

    for (const sender of uniqueSenders) {
      const memberId = findBestMatch(sender, members);
      senderMatches.set(sender, memberId);
      if (memberId) matchedCount++;
    }

    console.log(`✅ Matched ${matchedCount}/${uniqueSenders.length} senders\n`);

    // Import messages
    console.log('💾 Importing messages...');
    const batchSize = 100;
    let imported = 0;

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize).map(msg => ({
        member_id: senderMatches.get(msg.senderName),
        sender_name: msg.senderName,
        message_content: msg.messageContent,
        message_type: msg.messageType,
        timestamp: msg.timestamp.toISOString(),
        is_matched: !!senderMatches.get(msg.senderName),
        raw_line: msg.rawLine
      }));

      const { error } = await supabase.from('whatsapp_messages').insert(batch);
      if (!error) {
        imported += batch.length;
        process.stdout.write(`\r   Progress: ${Math.floor((imported / messages.length) * 100)}%`);
      }
    }

    console.log('\n\n🎉 Import Complete!');
    console.log(`   Imported: ${imported} messages`);
    console.log(`   Matched: ${matchedCount}/${uniqueSenders.length} senders`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/import-whatsapp-messages.js /path/to/chat.txt');
  process.exit(1);
}

importMessages(filePath);
