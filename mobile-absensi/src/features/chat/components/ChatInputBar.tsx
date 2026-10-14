import React from 'react';
import { StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import { colors } from '../../../theme/colors';

interface ChatInputBarProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSend: () => void;
  onPickImage: () => void;
  uploading: boolean;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  inputText,
  setInputText,
  onSend,
  onPickImage,
  uploading,
}) => {
  return (
    <View style={styles.inputBar}>
      <Pressable
        onPress={onPickImage}
        disabled={uploading}
        style={styles.attachButton}
      >
        <Text style={styles.attachIcon}>📎</Text>
      </Pressable>

      <TextInput
        placeholder="Ketik pesan..."
        value={inputText}
        onChangeText={setInputText}
        style={styles.textInput}
        multiline
        editable={!uploading}
      />

      <Pressable
        onPress={onSend}
        disabled={!inputText.trim() || uploading}
        style={[styles.sendButton, (!inputText.trim() || uploading) && styles.sendButtonDisabled]}
      >
        <Text style={styles.sendButtonText}>Kirim</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  attachButton: {
    padding: 8,
    marginRight: 6,
  },
  attachIcon: {
    fontSize: 20,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
