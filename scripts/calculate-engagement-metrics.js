#!/usr/bin/env node

/**
 * Calculate engagement metrics for all members based on WhatsApp messages
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function calculateEngagementMetrics() {
  try {
    console.log('📊 Calculating Engagement Metrics\n');

    // Get all messages
    console.log('📱 Fetching WhatsApp messages...');
    const { data: messages, error: messagesError } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .not('member_id', 'is', null); // Only matched messages

    if (messagesError) throw messagesError;
    console.log(`✅ Found ${messages.length} matched messages\n`);

    // Group messages by member
    const memberStats = new Map();

    for (const msg of messages) {
      if (!memberStats.has(msg.member_id)) {
        memberStats.set(msg.member_id, {
          totalMessages: 0,
          firstMessageAt: new Date(msg.timestamp),
          lastMessageAt: new Date(msg.timestamp),
          messagesThisMonth: 0,
          messagesLastMonth: 0
        });
      }

      const stats = memberStats.get(msg.member_id);
      stats.totalMessages++;

      const msgDate = new Date(msg.timestamp);
      if (msgDate < stats.firstMessageAt) stats.firstMessageAt = msgDate;
      if (msgDate > stats.lastMessageAt) stats.lastMessageAt = msgDate;

      // Calculate this month vs last month
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      if (msgDate >= thisMonthStart) {
        stats.messagesThisMonth++;
      } else if (msgDate >= lastMonthStart && msgDate <= lastMonthEnd) {
        stats.messagesLastMonth++;
      }
    }

    console.log(`👥 Processing ${memberStats.size} members...\n`);

    // Calculate engagement scores and update database
    let updated = 0;
    const totalMessages = messages.length;

    for (const [memberId, stats] of memberStats.entries()) {
      // Calculate engagement score (0-100)
      // Based on: % of total messages + recency bonus
      const messagePercentage = (stats.totalMessages / totalMessages) * 100;
      const daysSinceLastMessage = (new Date() - stats.lastMessageAt) / (1000 * 60 * 60 * 24);

      // Recency multiplier: 1.0 for today, 0.5 for 30 days ago, 0.1 for 90+ days
      let recencyMultiplier = 1.0;
      if (daysSinceLastMessage > 90) recencyMultiplier = 0.1;
      else if (daysSinceLastMessage > 30) recencyMultiplier = 0.5;
      else if (daysSinceLastMessage > 7) recencyMultiplier = 0.8;

      const engagementScore = Math.min(100, Math.round(
        (messagePercentage * 10) * recencyMultiplier
      ));

      // Determine behavior type based on activity
      let behaviorType = 'quiet';
      if (engagementScore >= 80) behaviorType = 'champion';
      else if (engagementScore >= 60) behaviorType = 'contributing';
      else if (engagementScore >= 40) behaviorType = 'curious';
      else if (engagementScore >= 20) behaviorType = 'encouraging';

      // Update engagement metrics
      const { error } = await supabase
        .from('engagement_metrics')
        .upsert({
          member_id: memberId,
          total_messages: stats.totalMessages,
          messages_this_month: stats.messagesThisMonth,
          messages_last_month: stats.messagesLastMonth,
          total_reactions: 0, // TODO: Add when we parse reactions
          reactions_this_month: 0,
          reactions_last_month: 0,
          engagement_score: engagementScore,
          behavior_type: behaviorType,
          first_message_at: stats.firstMessageAt.toISOString(),
          last_message_at: stats.lastMessageAt.toISOString(),
          last_calculated_at: new Date().toISOString()
        }, {
          onConflict: 'member_id'
        });

      if (!error) {
        updated++;
        process.stdout.write(`\r   Progress: ${Math.round((updated / memberStats.size) * 100)}%`);
      }
    }

    console.log('\n\n🎉 Engagement Metrics Calculated!\n');
    console.log('📊 Summary:');
    console.log(`   Members updated: ${updated}`);
    console.log(`   Total messages analyzed: ${messages.length}`);

    // Show distribution
    const distribution = {
      champion: 0,
      contributing: 0,
      curious: 0,
      encouraging: 0,
      quiet: 0
    };

    for (const [, stats] of memberStats.entries()) {
      const messagePercentage = (stats.totalMessages / totalMessages) * 100;
      const daysSinceLastMessage = (new Date() - stats.lastMessageAt) / (1000 * 60 * 60 * 24);
      let recencyMultiplier = 1.0;
      if (daysSinceLastMessage > 90) recencyMultiplier = 0.1;
      else if (daysSinceLastMessage > 30) recencyMultiplier = 0.5;
      else if (daysSinceLastMessage > 7) recencyMultiplier = 0.8;
      const score = Math.min(100, Math.round((messagePercentage * 10) * recencyMultiplier));

      if (score >= 80) distribution.champion++;
      else if (score >= 60) distribution.contributing++;
      else if (score >= 40) distribution.curious++;
      else if (score >= 20) distribution.encouraging++;
      else distribution.quiet++;
    }

    console.log('\n   Behavior Distribution:');
    console.log(`      🔥 Champions: ${distribution.champion}`);
    console.log(`      💡 Contributing: ${distribution.contributing}`);
    console.log(`      🔍 Curious: ${distribution.curious}`);
    console.log(`      💚 Encouraging: ${distribution.encouraging}`);
    console.log(`      💤 Quiet: ${distribution.quiet}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

calculateEngagementMetrics();
