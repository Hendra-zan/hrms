import React from 'react';
import { StyleSheet, Text, View, Image, Pressable, ActivityIndicator } from 'react-native';
import { colors } from '../../../theme/colors';
import { MobileUser } from '../../../types';

interface ProfileHeaderHeroProps {
  user: MobileUser;
  avatarUploading: boolean;
  onChangeAvatar: () => void;
}

export const ProfileHeaderHero: React.FC<ProfileHeaderHeroProps> = ({
  user,
  avatarUploading,
  onChangeAvatar,
}) => {
  return (
    <View style={styles.header}>
      <Pressable onPress={onChangeAvatar} disabled={avatarUploading} style={styles.avatarWrapper}>
        {((user as any).avatarUrl || user.foto) ? (
          <Image source={{ uri: (user as any).avatarUrl || user.foto }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
            </Text>
          </View>
        )}
        {avatarUploading ? (
          <View style={styles.avatarOverlay}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : (
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarBadgeText}>✎</Text>
          </View>
        )}
      </Pressable>
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerName}>{user.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{user.jabatan || 'Staf Medis'}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  avatarPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 34,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  headerTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  roleBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
});
