import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { colors } from '../../../theme/colors';
import { ChatMessage } from '../types';

interface ChatMessageBubbleProps {
  item: ChatMessage;
  isMe: boolean;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  item,
  isMe,
}) => {
  const hasImage = item.file_url && item.file_type === 'image';

  return (
    <View style={[styles.bubbleWrap, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubblePartner]}>
        {hasImage && (
          <Image
            source={{ uri: item.file_url }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        )}
        <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextPartner]}>
          {item.message_text}
        </Text>
        <View style={styles.timeLine}>
          <Text style={[styles.timeText, isMe ? styles.timeTextMe : styles.timeTextPartner]}>
            {new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isMe && (
            <Text style={[styles.statusCheck, item.is_read ? styles.statusRead : styles.statusSent]}>
              {item.is_read ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bubbleWrap: {
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  bubbleRight: {
    alignItems: 'flex-end',
  },
  bubbleLeft: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 10,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubblePartner: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 6,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  messageTextMe: {
    color: '#fff',
  },
  messageTextPartner: {
    color: '#1e293b',
  },
  timeLine: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
  },
  timeTextMe: {
    color: 'rgba(255,255,255,0.7)',
  },
  timeTextPartner: {
    color: '#94a3b8',
  },
  statusCheck: {
    fontSize: 10,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  statusRead: {
    color: '#38bdf8',
  },
  statusSent: {
    color: 'rgba(255,255,255,0.7)',
  },
});
