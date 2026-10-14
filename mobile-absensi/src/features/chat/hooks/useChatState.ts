import { useState, useEffect, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../../config/supabase';
import { MobileUser } from '../../../types';
import { Employee, ChatMessage } from '../types';

export function useChatState(user: MobileUser) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Employee | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [lastMessageTimes, setLastMessageTimes] = useState<Record<string, number>>({});
  const [inputText, setInputText] = useState('');
  const [search, setSearch] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [uploading, setUploading] = useState(false);

  const flatListRef = useRef<any>(null);
  const selectedPartnerRef = useRef(selectedPartner);
  useEffect(() => {
    selectedPartnerRef.current = selectedPartner;
  }, [selectedPartner]);

  // Presence heartbeat every 20s
  const sendHeartbeat = async () => {
    try {
      await supabase
        .from('employees')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', user.id);
    } catch (err) {
      console.error('Failed to update mobile presence heartbeat:', err);
    }
  };

  useEffect(() => {
    sendHeartbeat();
    const timer = setInterval(() => {
      sendHeartbeat();
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  // 1. Fetch Contacts
  const loadContacts = async () => {
    setLoadingContacts(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, user_id, nama, jabatan, departemen, foto, status, last_seen, shift')
        .eq('status', 'Aktif')
        .neq('id', user.id)
        .order('nama', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  // 2. Fetch Chat History
  const loadChatHistory = async (partnerUserId: string) => {
    setLoadingChat(true);
    try {
      const currentUserId = user.userId || '';
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${partnerUserId}),and(sender_id.eq.${partnerUserId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      const history = (data || []).reverse();
      setMessages(history);

      const unreads = history.filter(m => m.sender_id === partnerUserId && !m.is_read);
      if (unreads.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('sender_id', partnerUserId)
          .eq('receiver_id', currentUserId);

        setUnreadCounts(prev => ({ ...prev, [partnerUserId]: 0 }));
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setLoadingChat(false);
    }
  };

  // 3. Fetch Unread Counts
  const loadUnreadCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', user.userId || '')
        .eq('is_read', false);

      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach(m => {
        counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
      });
      setUnreadCounts(counts);
    } catch (err) {
      console.error('Failed to load unread counts:', err);
    }
  };

  // 4. Fetch Last Message Times for sort ordering
  const loadLastMessageTimes = async () => {
    try {
      const currentUserId = user.userId || '';
      const { data, error } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, created_at')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const timesMap: Record<string, number> = {};
        data.forEach(m => {
          const otherUser = m.sender_id === currentUserId ? m.receiver_id : m.sender_id;
          if (!timesMap[otherUser]) {
            timesMap[otherUser] = new Date(m.created_at).getTime();
          }
        });
        setLastMessageTimes(timesMap);
      }
    } catch (err) {
      console.error('Failed to load last message times:', err);
    }
  };

  // Send Message
  const handleSend = async (fileUrl?: string, fileType?: string, altText?: string) => {
    if (!selectedPartner?.user_id) return;
    const text = altText || inputText.trim();
    if (!text && !fileUrl) return;
    
    setInputText('');
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.userId || '',
          receiver_id: selectedPartner.user_id,
          message_text: text,
          file_url: fileUrl || null,
          file_type: fileType || null
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, data];
        });
        loadLastMessageTimes();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Pick Image & Send
  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('Izin akses galeri dibutuhkan untuk mengirim gambar.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
    });

    if (pickerResult.canceled || !pickerResult.assets?.[0]) return;
    const asset = pickerResult.assets[0];

    setUploading(true);
    try {
      const fileExt = asset.uri.split('.').pop() || 'jpg';
      const fileName = `chat-attachments/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('employee-documents')
        .upload(fileName, blob, {
          contentType: `image/${fileExt}`
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('employee-documents')
        .getPublicUrl(fileName);

      await handleSend(publicUrl, 'image', 'Mengirim gambar dari galeri mobile');
    } catch (err: any) {
      console.error('Failed to upload image:', err);
      alert('Gagal mengunggah gambar: ' + (err.message || err));
    } finally {
      setUploading(false);
    }
  };

  // Initial Realtime Subscription
  useEffect(() => {
    loadContacts();
    loadUnreadCounts();
    loadLastMessageTimes();

    const currentUserId = user.userId || '';
    const channel = supabase
      .channel('mobile_messages_realtime_upgrade')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          const activePartner = selectedPartnerRef.current;
          
          if (newMsg.receiver_id === currentUserId || newMsg.sender_id === currentUserId) {
            loadLastMessageTimes();

            if (
              (activePartner?.user_id && newMsg.sender_id === activePartner.user_id) ||
              (activePartner?.user_id && newMsg.receiver_id === activePartner.user_id && newMsg.sender_id === currentUserId)
            ) {
              setMessages(prev => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });

              if (newMsg.sender_id === activePartner.user_id) {
                supabase
                  .from('messages')
                  .update({ is_read: true })
                  .eq('id', newMsg.id)
                  .then();
              }
            } else if (newMsg.receiver_id === currentUserId) {
              setUnreadCounts(prev => ({
                ...prev,
                [newMsg.sender_id]: (prev[newMsg.sender_id] || 0) + 1
              }));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'employees' },
        () => {
          loadContacts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedPartner?.user_id) {
      loadChatHistory(selectedPartner.user_id);
    }
  }, [selectedPartner]);

  // Polling fallback
  useEffect(() => {
    if (!selectedPartner?.user_id) return;

    const interval = setInterval(() => {
      const fetchSilent = async () => {
        try {
          const currentUserId = user.userId || '';
          const partnerUserId = selectedPartner.user_id;
          const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${partnerUserId}),and(sender_id.eq.${partnerUserId},receiver_id.eq.${currentUserId})`)
            .order('created_at', { ascending: false })
            .limit(50);

          if (!error && data) {
            const history = data.reverse();
            setMessages(history);
          }
        } catch {}
      };
      fetchSilent();
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedPartner]);

  const filteredContacts = employees
    .filter(e => e.nama.toLowerCase().includes(search.toLowerCase()) || e.jabatan.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const unreadA = unreadCounts[a.user_id] || 0;
      const unreadB = unreadCounts[b.user_id] || 0;
      if (unreadB !== unreadA) return unreadB - unreadA;

      const timeA = lastMessageTimes[a.user_id] || 0;
      const timeB = lastMessageTimes[b.user_id] || 0;
      if (timeB !== timeA) return timeB - timeA;

      const lastSeenA = a.last_seen ? new Date(a.last_seen).getTime() : 0;
      const lastSeenB = b.last_seen ? new Date(b.last_seen).getTime() : 0;
      const isOnlineA = Date.now() - lastSeenA < 40000;
      const isOnlineB = Date.now() - lastSeenB < 40000;
      if (isOnlineB !== isOnlineA) return isOnlineB ? 1 : -1;

      return a.nama.localeCompare(b.nama);
    });

  return {
    employees,
    selectedPartner,
    setSelectedPartner,
    messages,
    unreadCounts,
    inputText,
    setInputText,
    search,
    setSearchQuery: setSearch,
    loadingContacts,
    loadingChat,
    uploading,
    flatListRef,
    filteredContacts,
    handleSend,
    handlePickImage,
    loadContacts,
  };
}
