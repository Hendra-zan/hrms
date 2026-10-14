import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { APP_VERSION, APP_VERSION_CODE } from '../../../config/version';

export const ProfileFooter: React.FC = () => {
  return (
    <View style={styles.devFooter}>
      <Text style={styles.devFooterTitle}>Dikembangkan oleh AuraCore Labs</Text>
      <View style={styles.devFooterRow}>
        <Text style={styles.devFooterItem}>✉️ auracore.labs@gmail.com</Text>
        <Text style={styles.devFooterDot}>·</Text>
        <Text style={styles.devFooterItem}>💬 +62 822-5665-7700</Text>
      </View>
      <Text style={styles.devFooterWeb}>🌐 www.auracore.my.id</Text>
      <Text style={styles.devFooterVersion}>Versi {APP_VERSION} (Build {APP_VERSION_CODE})</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  devFooter: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
  devFooterTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  devFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  devFooterItem: {
    fontSize: 11,
    color: '#94a3b8',
  },
  devFooterDot: {
    color: '#cbd5e1',
  },
  devFooterWeb: {
    fontSize: 11,
    color: '#0284c7',
  },
  devFooterVersion: {
    fontSize: 10,
    color: '#cbd5e1',
    marginTop: 4,
  },
});
