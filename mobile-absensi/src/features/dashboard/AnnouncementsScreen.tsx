import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Linking,
} from 'react-native';
import { supabase } from '../../config/supabase';
import { colors } from '../../theme/colors';

interface AnnouncementAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'kebijakan' | 'pengumuman';
  created_at: string;
  author_id: string | null;
  is_pinned?: boolean;
  attachments?: AnnouncementAttachment[];
  requires_acknowledgment?: boolean;
  employees?: {
    nama: string;
  } | null;
  is_read?: boolean;
  acknowledged_at?: string | null;
}

interface AnnouncementsScreenProps {
  onBack: () => void;
  currentEmployeeId?: string | null;
}

export function AnnouncementsScreen({ onBack, currentEmployeeId }: AnnouncementsScreenProps) {
  const [list, setList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Announcement | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pengumuman' | 'kebijakan'>('all');
  const [acknowledging, setAcknowledging] = useState(false);

  const fetchItems = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*, employees:author_id(nama)')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setList((data as any) || []);
    } catch (err) {
      console.warn('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchItems();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchItems(true);
  };

  const handleAcknowledge = async (item: Announcement) => {
    if (!currentEmployeeId) return;
    setAcknowledging(true);
    try {
      const now = new Date().toISOString();
      await supabase
        .from('announcement_reads')
        .upsert({
          announcement_id: item.id,
          employee_id: currentEmployeeId,
          read_at: now,
          acknowledged_at: now,
        }, { onConflict: 'announcement_id, employee_id' });

      setList(prev => prev.map(a => a.id === item.id ? { ...a, acknowledged_at: now } : a));
      if (selectedItem && selectedItem.id === item.id) {
        setSelectedItem({ ...selectedItem, acknowledged_at: now });
      }
    } catch (err) {
      console.warn('Failed to acknowledge:', err);
    } finally {
      setAcknowledging(false);
    }
  };

  const filteredList = list.filter((item) => activeTab === 'all' || item.type === activeTab);

  const renderItem = ({ item }: { item: Announcement }) => {
    const isPolicy = item.type === 'kebijakan';
    const hasAttachments = item.attachments && item.attachments.length > 0;
    const isAck = Boolean(item.acknowledged_at);
    const dateStr = new Date(item.created_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return (
      <Pressable style={[styles.card, item.is_pinned && styles.cardPinned]} onPress={() => setSelectedItem(item)}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            {item.is_pinned && (
              <View style={styles.badgePinned}>
                <Text style={styles.badgeTextPinned}>📌 Pinned</Text>
              </View>
            )}
            <View style={[styles.badge, isPolicy ? styles.badgePolicy : styles.badgeAnnounce]}>
              <Text style={[styles.badgeText, isPolicy ? styles.badgeTextPolicy : styles.badgeTextAnnounce]}>
                {isPolicy ? '📜 Kebijakan' : '📢 Pengumuman'}
              </Text>
            </View>
            {item.requires_acknowledgment && (
              <View style={[styles.badge, isAck ? styles.badgeAckDone : styles.badgeAckPending]}>
                <Text style={[styles.badgeText, isAck ? styles.badgeTextAckDone : styles.badgeTextAckPending]}>
                  {isAck ? '✓ Dikonfirmasi' : '⚠️ Wajib Baca'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.cardDate}>{dateStr}</Text>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardPreview} numberOfLines={3}>{item.content}</Text>

        <View style={styles.cardFooter}>
          <View style={styles.footerInfo}>
            <Text style={styles.cardAuthor}>Oleh: {item.employees?.nama || 'Admin'}</Text>
            {hasAttachments && <Text style={styles.attachmentTag}>📎 {item.attachments?.length} Berkas</Text>}
          </View>
          <Text style={styles.readMore}>Baca Selengkapnya →</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Kebijakan & Pengumuman</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['all', 'pengumuman', 'kebijakan'] as const).map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === 'all' ? 'Semua' : t === 'pengumuman' ? '📢 Pengumuman' : '📜 Kebijakan'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat informasi...</Text>
        </View>
      ) : filteredList.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>Belum ada informasi</Text>
          <Text style={styles.emptyDesc}>Tidak ada kebijakan atau pengumuman aktif saat ini.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        />
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <Modal visible={Boolean(selectedItem)} animationType="slide" transparent={true} onRequestClose={() => setSelectedItem(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.badgeRow}>
                  {selectedItem.is_pinned && <View style={styles.badgePinned}><Text style={styles.badgeTextPinned}>📌 Pinned</Text></View>}
                  <View style={[styles.badge, selectedItem.type === 'kebijakan' ? styles.badgePolicy : styles.badgeAnnounce]}>
                    <Text style={[styles.badgeText, selectedItem.type === 'kebijakan' ? styles.badgeTextPolicy : styles.badgeTextAnnounce]}>
                      {selectedItem.type === 'kebijakan' ? '📜 Kebijakan' : '📢 Pengumuman'}
                    </Text>
                  </View>
                </View>
                <Pressable style={styles.closeButton} onPress={() => setSelectedItem(null)}>
                  <Text style={styles.closeText}>×</Text>
                </Pressable>
              </View>

              <FlatList
                data={[selectedItem]}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.modalInner}>
                    <Text style={styles.modalTitle}>{item.title}</Text>
                    <View style={styles.modalMetaRow}>
                      <Text style={styles.modalMetaText}>Oleh: {item.employees?.nama || 'Admin'}</Text>
                      <Text style={styles.modalMetaText}>
                        {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </Text>
                    </View>
                    <View style={styles.divider} />
                    <Text style={styles.modalBody}>{item.content}</Text>

                    {item.attachments && item.attachments.length > 0 && (
                      <View style={styles.attachmentBox}>
                        <Text style={styles.attachmentTitle}>📎 Lampiran Berkas ({item.attachments.length}):</Text>
                        {item.attachments.map(att => (
                          <Pressable key={att.id} style={styles.attachmentBtn} onPress={() => Linking.openURL(att.url)}>
                            <Text style={styles.attachmentName} numberOfLines={1}>📄 {att.name}</Text>
                            <Text style={styles.attachmentDownload}>Unduh ⬇</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}

                    {item.requires_acknowledgment && currentEmployeeId && (
                      <View style={styles.ackBox}>
                        <Text style={styles.ackTitle}>✍️ Konfirmasi Kepatuhan Regulasi</Text>
                        {item.acknowledged_at ? (
                          <Text style={styles.ackDoneText}>✓ Anda telah membaca & memahami kebijakan ini.</Text>
                        ) : (
                          <Pressable style={styles.ackButton} onPress={() => handleAcknowledge(item)} disabled={acknowledging}>
                            <Text style={styles.ackButtonText}>{acknowledging ? 'Menyimpan...' : '✓ Saya Telah Membaca & Memahami'}</Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                )}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backButton: { padding: 8, borderRadius: 8 },
  backIcon: { fontSize: 20, fontWeight: 'bold', color: '#334155' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', flex: 1 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#ffffff', padding: 6, marginHorizontal: 16, marginVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#f1f5f9' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#0f172a' },
  list: { padding: 16, paddingBottom: 32, gap: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  cardPinned: { borderColor: '#fde68a', backgroundColor: '#fffbeb' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badgeRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  badge: { paddingHorizontal: 9, paddingVertical: 2.5, borderRadius: 20 },
  badgePinned: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeTextPinned: { fontSize: 9, fontWeight: 'bold', color: '#b45309' },
  badgePolicy: { backgroundColor: '#ccfbf1' },
  badgeAnnounce: { backgroundColor: '#dbeafe' },
  badgeAckDone: { backgroundColor: '#dcfce7' },
  badgeAckPending: { backgroundColor: '#ffe4e6' },
  badgeText: { fontSize: 9, fontWeight: '700' },
  badgeTextPolicy: { color: '#0f766e' },
  badgeTextAnnounce: { color: '#1d4ed8' },
  badgeTextAckDone: { color: '#15803d' },
  badgeTextAckPending: { color: '#be123c' },
  cardDate: { fontSize: 10, color: '#94a3b8' },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 6, lineHeight: 20 },
  cardPreview: { fontSize: 12, color: '#64748b', lineHeight: 18, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f8fafc', paddingTop: 10 },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardAuthor: { fontSize: 10, color: '#94a3b8' },
  attachmentTag: { fontSize: 10, color: '#6366f1', fontWeight: '600' },
  readMore: { fontSize: 11, fontWeight: '700', color: colors.primary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { fontSize: 12, color: '#64748b', marginTop: 10 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: 'bold', color: '#334155', marginBottom: 4 },
  emptyDesc: { fontSize: 12, color: '#94a3b8', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%', paddingBottom: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  closeButton: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 16, fontWeight: 'bold', color: '#475569' },
  modalInner: { padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#0f172a', marginBottom: 8, lineHeight: 24 },
  modalMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  modalMetaText: { fontSize: 11, color: '#94a3b8' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 16 },
  modalBody: { fontSize: 13, color: '#334155', lineHeight: 22 },
  attachmentBox: { marginTop: 20, padding: 14, backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  attachmentTitle: { fontSize: 12, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  attachmentBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: '#ffffff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 6 },
  attachmentName: { fontSize: 12, color: '#334155', flex: 1, marginRight: 8 },
  attachmentDownload: { fontSize: 11, fontWeight: 'bold', color: colors.primary },
  ackBox: { marginTop: 20, padding: 14, backgroundColor: '#f0fdfa', borderRadius: 14, borderWidth: 1, borderColor: '#ccfbf1' },
  ackTitle: { fontSize: 12, fontWeight: 'bold', color: '#0f766e', marginBottom: 6 },
  ackDoneText: { fontSize: 11, color: '#15803d', fontWeight: '600' },
  ackButton: { marginTop: 6, backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  ackButtonText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
});
