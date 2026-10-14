import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { colors } from '../../../theme/colors';
import { Employee } from '../types';

interface ContactListItemProps {
  item: Employee;
  unreadCount: number;
  onSelect: (item: Employee) => void;
}

export const ContactListItem: React.FC<ContactListItemProps> = ({
  item,
  unreadCount,
  onSelect,
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

  const presence = getOnlineStatusLabel(item);

  return (
    <Pressable onPress={() => onSelect(item)} style={styles.contactItem}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.nama.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
        </Text>
        {presence.isOnline && (
          <View style={styles.onlineStatusBadge} />
        )}
      </View>
      <View style={styles.contactInfo}>
        <View style={styles.contactHeaderLine}>
          <Text style={styles.contactName}>{item.nama}</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.subLine}>
          <Text style={styles.contactSubtitle} numberOfLines={1}>
            {item.jabatan || 'Karyawan'} &middot; {item.departemen} (Shift: {item.shift || 'Pagi'})
          </Text>
          <Text style={styles.presenceLabel}>{presence.text}</Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  onlineStatusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#fff',
  },
  contactInfo: {
    flex: 1,
  },
  contactHeaderLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  subLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  contactSubtitle: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  presenceLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 8,
  },
});
