/**
 * WhatsApp Chat Parser
 * Parses WhatsApp exported chat files (.txt) into structured message data
 */

export interface ParsedMessage {
  timestamp: Date;
  senderName: string;
  messageContent: string;
  messageType: 'text' | 'image' | 'video' | 'poll' | 'system' | 'sticker' | 'audio';
  rawLine: string;
  isPoll?: boolean;
  pollOptions?: string[];
  isEdited?: boolean;
}

/**
 * Parse a WhatsApp chat export file
 * Format: [MM/DD/YY, HH:MM:SS AM/PM] Sender Name: Message content
 */
export function parseWhatsAppChat(content: string): ParsedMessage[] {
  const lines = content.split('\n');
  const messages: ParsedMessage[] = [];
  let currentMessage: ParsedMessage | null = null;

  // Regex to match WhatsApp message format
  // Example: [10/1/24, 5:49:57 PM] Keegan Arthur TE Olton: message content
  const messageRegex = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s+(\d{1,2}:\d{2}:\d{2}\s+(?:AM|PM))\]\s+([^:]+):\s*(.*)$/;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      // Skip empty lines
      continue;
    }

    const match = trimmedLine.match(messageRegex);

    if (match) {
      // Save previous message if exists
      if (currentMessage) {
        messages.push(currentMessage);
      }

      const [, date, time, sender, content] = match;

      // Parse timestamp
      const timestamp = parseWhatsAppTimestamp(date, time);

      // Determine message type
      const messageType = detectMessageType(content);

      // Check for special content
      const isPoll = content.includes('POLL:') || content.includes('‎POLL:');
      const isEdited = content.includes('<This message was edited>');

      currentMessage = {
        timestamp,
        senderName: sender.trim(),
        messageContent: content.trim(),
        messageType,
        rawLine: trimmedLine,
        isPoll,
        isEdited
      };

      // Parse poll options if it's a poll
      if (isPoll) {
        currentMessage.pollOptions = [];
      }

    } else if (currentMessage) {
      // Multi-line message or poll option
      if (currentMessage.isPoll && trimmedLine.startsWith('‎OPTION:')) {
        // Extract poll option
        const option = trimmedLine.replace('‎OPTION:', '').trim();
        if (!currentMessage.pollOptions) {
          currentMessage.pollOptions = [];
        }
        currentMessage.pollOptions.push(option);
      } else {
        // Append to current message content (multi-line message)
        currentMessage.messageContent += '\n' + trimmedLine;
        currentMessage.rawLine += '\n' + trimmedLine;
      }
    }
  }

  // Don't forget the last message
  if (currentMessage) {
    messages.push(currentMessage);
  }

  return messages;
}

/**
 * Parse WhatsApp timestamp format to JavaScript Date
 * Format: "10/1/24, 5:49:57 PM"
 */
function parseWhatsAppTimestamp(dateStr: string, timeStr: string): Date {
  // Parse date: MM/DD/YY or MM/DD/YYYY
  const dateParts = dateStr.split('/');
  const month = parseInt(dateParts[0], 10) - 1; // JavaScript months are 0-indexed
  const day = parseInt(dateParts[1], 10);
  let year = parseInt(dateParts[2], 10);

  // Handle 2-digit year
  if (year < 100) {
    year += 2000;
  }

  // Parse time: HH:MM:SS AM/PM
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)/);
  if (!timeMatch) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }

  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const seconds = parseInt(timeMatch[3], 10);
  const period = timeMatch[4];

  // Convert to 24-hour format
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return new Date(year, month, day, hours, minutes, seconds);
}

/**
 * Detect the type of message based on content
 */
function detectMessageType(content: string): ParsedMessage['messageType'] {
  const lowerContent = content.toLowerCase();

  // System messages
  if (content.includes('‎') && (
    lowerContent.includes('pinned a message') ||
    lowerContent.includes('added') ||
    lowerContent.includes('removed') ||
    lowerContent.includes('changed') ||
    lowerContent.includes('created group') ||
    lowerContent.includes('left') ||
    lowerContent.includes('joined')
  )) {
    return 'system';
  }

  // Media messages
  if (content.includes('‎image omitted') || content.includes('<image omitted>')) {
    return 'image';
  }
  if (content.includes('‎video omitted') || content.includes('<video omitted>')) {
    return 'video';
  }
  if (content.includes('‎sticker omitted') || content.includes('<sticker omitted>')) {
    return 'sticker';
  }
  if (content.includes('‎audio omitted') || content.includes('<audio omitted>')) {
    return 'audio';
  }

  // Poll messages
  if (content.includes('POLL:') || content.includes('‎POLL:')) {
    return 'poll';
  }

  // Default to text
  return 'text';
}

/**
 * Get statistics from parsed messages
 */
export function getMessageStats(messages: ParsedMessage[]) {
  const stats = {
    totalMessages: messages.length,
    byType: {} as Record<string, number>,
    bySender: {} as Record<string, number>,
    dateRange: {
      start: messages[0]?.timestamp,
      end: messages[messages.length - 1]?.timestamp
    },
    uniqueSenders: new Set<string>()
  };

  for (const message of messages) {
    // Count by type
    stats.byType[message.messageType] = (stats.byType[message.messageType] || 0) + 1;

    // Count by sender
    stats.bySender[message.senderName] = (stats.bySender[message.senderName] || 0) + 1;

    // Track unique senders
    stats.uniqueSenders.add(message.senderName);
  }

  return {
    ...stats,
    uniqueSenderCount: stats.uniqueSenders.size
  };
}

/**
 * Match sender names to members in the database
 * Returns a map of sender name -> best matching member
 */
export function matchSendersToMembers(
  senderNames: string[],
  members: Array<{ id: string; full_name: string; phone_number: string }>
): Map<string, string | null> {
  const matches = new Map<string, string | null>();

  for (const senderName of senderNames) {
    const bestMatch = findBestMemberMatch(senderName, members);
    matches.set(senderName, bestMatch?.id || null);
  }

  return matches;
}

/**
 * Find the best matching member for a sender name
 * Uses fuzzy matching to handle variations in names
 */
function findBestMemberMatch(
  senderName: string,
  members: Array<{ id: string; full_name: string; phone_number: string }>
): { id: string; full_name: string } | null {
  const cleanSender = cleanName(senderName);

  // Try exact match first
  for (const member of members) {
    if (cleanName(member.full_name) === cleanSender) {
      return member;
    }
  }

  // Try partial match (sender name contains member name or vice versa)
  for (const member of members) {
    const cleanMemberName = cleanName(member.full_name);
    if (
      cleanSender.includes(cleanMemberName) ||
      cleanMemberName.includes(cleanSender)
    ) {
      return member;
    }
  }

  // Try first name + last name match
  const senderParts = cleanSender.split(/\s+/);
  const senderFirstName = senderParts[0];
  const senderLastName = senderParts[senderParts.length - 1];

  for (const member of members) {
    const memberParts = cleanName(member.full_name).split(/\s+/);
    const memberFirstName = memberParts[0];
    const memberLastName = memberParts[memberParts.length - 1];

    if (
      senderFirstName === memberFirstName &&
      (senderLastName === memberLastName || senderParts.length === 1 || memberParts.length === 1)
    ) {
      return member;
    }
  }

  return null;
}

/**
 * Clean and normalize a name for matching
 */
function cleanName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}
