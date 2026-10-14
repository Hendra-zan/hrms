import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Employee } from '../types';

interface ChatHeaderProps {
  partner: Employee;
  onBack: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  partner,
  onBack,
}) => {
  const getOnlineStatusLabel = (emp: Employee) => {
    const lastSeenTime = emp.last_seen ? new Date(emp.last_seen).getTime() : 0;
    const isOnline = Date.now() - lastSeenTime < 40000;

    if (isOnline) return { text: 'Online', isOnline: true };
    if (lastSeenTime > 0) {
      const diffMins = Math.floor((Date.now() - lastSeenTime) / 60000);
      if (diffMins < 1) return { text: 'Baru saja aktif', isOnline: false };
      if (diffMins < 60) return { text: `Aktif ${diffMins} mnt lalu`, isOnline: false };
      return { text: `Aktif ${Math.floor(diffMins / 60)} jam lalu`, isOnline: false };
    }
    return { text: 'Offline', isOnline: false };
  };

  const presence = getOnlineStatusLabel(partner);

  return (
    <View style={styles.chatHeader}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>←</Text>
      </Pressable>
      <View style={styles.partnerInfo}>
        <Text style={styles.partnerName} numberOfLines={1}>{partner.nama}</Text>
        <View style={styles.presenceWrap}>
          {presence.isOnline && <View style={styles.onlineDot} />}
          <Text style={styles.partnerSub} numberOfLines={1}>
            {presence.text} &middot; {partner.jabatan || 'Karyawan'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    padding: 8,
    marginRight: 6,
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  presenceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 4,
  },
  partnerSub: {
    fontSize: 11,
    color: '#64748b',
  },
});
