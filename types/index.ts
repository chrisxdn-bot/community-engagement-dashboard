export interface Member {
  id: string;
  member_number: number;
  full_name: string;
  email: string;
  phone_number: string;
  location: string;
  created_at: string;
  engagement_metrics?: EngagementMetrics;
}

export interface EngagementMetrics {
  total_messages: number;
  messages_this_month: number;
  messages_last_month: number;
  total_reactions: number;
  reactions_this_month: number;
  reactions_last_month: number;
  engagement_score: number;
  behavior_type: 'champion' | 'contributing' | 'curious' | 'encouraging' | 'quiet' | null;
  first_message_at: string | null;
  last_message_at: string | null;
}
