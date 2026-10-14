import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '../../theme/colors';
import { ChatScreenProps } from './types';
import { useChatState } from './hooks/useChatState';
import { ContactListItem } from './components/ContactListItem';
import { ChatMessageBubble } from './components/ChatMessageBubble';
import { ChatHeader } from './components/ChatHeader';
import { ChatInputBar } from './components/ChatInputBar';

export function ChatScreen({ user }: ChatScreenProps) {
  const {
    selectedPartner,
    setSelectedPartner,
    messages,
    unreadCounts,
    inputText,
    setInputText,
    search,
    setSearchQuery,
    loadingContacts,
    loadingChat,
    uploading,
    flatListRef,
    filteredContacts,
    handleSend,
    handlePickImage,
  } = useChatState(user);

  // Active Chat Room View
  if (selectedPartner) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        <ChatHeader
          partner={selectedPartner}
          onBack={() => setSelectedPartner(null)}
        />

        <View style={styles.messageContainer}>
          {loadingChat ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.center} />
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item }) => (
                <ChatMessageBubble
                  item={item}
                  isMe={item.sender_id === user.userId}
                />
              )}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>

        {uploading && (
          <View style={styles.uploadingBar}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.uploadingText}>Mengunggah gambar...</Text>
          </View>
        )}

        <ChatInputBar
          inputText={inputText}
          setInputText={setInputText}
          onSend={() => handleSend()}
          onPickImage={handlePickImage}
          uploading={uploading}
        />
      </KeyboardAvoidingView>
    );
  }

  // Contact List View
  return (
    <View style={styles.container}>
      <View style={styles.searchBarWrap}>
        <TextInput
          placeholder="Cari rekan kerja..."
          value={search}
          onChangeText={setSearchQuery}
          style={styles.searchField}
        />
      </View>

      {loadingContacts ? (
        <ActivityIndicator size="small" color={colors.primary} style={styles.center} />
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          renderItem={({ item }) => (
            <ContactListItem
              item={item}
              unreadCount={item.user_id ? unreadCounts[item.user_id] || 0 : 0}
              onSelect={setSelectedPartner}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarWrap: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  searchField: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 20,
  },
  messageContainer: {
    flex: 1,
  },
  uploadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#f1f5f9',
    gap: 8,
  },
  uploadingText: {
    fontSize: 12,
    color: '#64748b',
  },
});

export default ChatScreen;
