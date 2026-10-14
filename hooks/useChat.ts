import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../stores/appStore';

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  created_at: string;
  is_read: boolean;
  file_url?: string;
  file_type?: string;
}

export const useChat = (selectedUserId?: string) => {
  const { authUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Heartbeat untuk memperbarui last_seen pengguna
  const updateLastSeen = useCallback(async () => {
    if (!authUser?.id) return;
    try {
      // Ambil profile employee id
      const { data: emp } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (emp?.id) {
        await supabase
          .from('employees')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', emp.id);
      }
    } catch (err) {
      console.error('[useChat] Failed to update heartbeat:', err);
    }
  }, [authUser?.id]);

  // Jalankan heartbeat setiap 20 detik
  useEffect(() => {
    if (authUser?.id) {
      updateLastSeen(); // Pemicu awal
      const timer = setInterval(() => {
        updateLastSeen();
      }, 20000);
      return () => clearInterval(timer);
    }
  }, [authUser?.id, updateLastSeen]);

  // Ambil riwayat chat
  const fetchChatHistory = useCallback(async () => {
    if (!authUser?.id || !selectedUserId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${authUser.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${authUser.id})`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      const history = (data || []).reverse();
      setMessages(history);

      // Tandai pesan dari lawan bicara sebagai terbaca
      const unreadFromPartner = history.filter(m => m.sender_id === selectedUserId && !m.is_read);
      if (unreadFromPartner.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('sender_id', selectedUserId)
          .eq('receiver_id', authUser.id);
        
        // Update unread count local
        setUnreadCounts(prev => ({
          ...prev,
          [selectedUserId]: 0
        }));
      }
    } catch (err) {
      console.error('[useChat] Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  }, [authUser?.id, selectedUserId]);

  // Ambil total pesan yang belum dibaca dari semua user
  const fetchUnreadCounts = useCallback(async () => {
    if (!authUser?.id) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', authUser.id)
        .eq('is_read', false);

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach(m => {
        counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
      });
      setUnreadCounts(counts);
    } catch (err) {
      console.error('[useChat] Error fetching unread counts:', err);
    }
  }, [authUser?.id]);

  // Kirim pesan baru (mendukung teks dan file)
  const sendMessage = useCallback(async (text: string, fileUrl?: string, fileType?: string) => {
    if (!authUser?.id || !selectedUserId) return false;
    if (!text.trim() && !fileUrl) return false;
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: authUser.id,
          receiver_id: selectedUserId,
          message_text: text.trim(),
          file_url: fileUrl || null,
          file_type: fileType || null
        });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('[useChat] Error sending message:', err);
      return false;
    }
  }, [authUser?.id, selectedUserId]);

  // Unggah file lampiran ke Supabase Storage (bucket employee-documents)
  const uploadAttachment = useCallback(async (file: File): Promise<{ url: string; type: string } | null> => {
    if (!authUser?.id) return null;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `chat-attachments/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('employee-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('employee-documents')
        .getPublicUrl(fileName);

      return {
        url: publicUrl,
        type: file.type.startsWith('image/') ? 'image' : 'document'
      };
    } catch (err) {
      console.error('[useChat] Error uploading file:', err);
      return null;
    }
  }, [authUser?.id]);

  const selectedUserIdRef = useRef(selectedUserId);
  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  // Subscribe ke real-time messages & updates
  useEffect(() => {
    if (!authUser?.id) return;

    fetchUnreadCounts();

    const channel = supabase
      .channel('messages_realtime_upgrade')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          const currentPartnerId = selectedUserIdRef.current;
          
          if (newMsg.receiver_id === authUser.id || newMsg.sender_id === authUser.id) {
            if (
              (newMsg.sender_id === currentPartnerId && newMsg.receiver_id === authUser.id) ||
              (newMsg.sender_id === authUser.id && newMsg.receiver_id === currentPartnerId)
            ) {
              setMessages(prev => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });

              if (newMsg.sender_id === currentPartnerId) {
                supabase
                  .from('messages')
                  .update({ is_read: true })
                  .eq('id', newMsg.id)
                  .then();
              }
            } else if (newMsg.receiver_id === authUser.id) {
              setUnreadCounts(prev => ({
                ...prev,
                [newMsg.sender_id]: (prev[newMsg.sender_id] || 0) + 1
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authUser?.id]);

  // Ambil ulang chat history setiap kali partner chat berubah
  useEffect(() => {
    if (selectedUserId) {
      fetchChatHistory();
    } else {
      setMessages([]);
    }
  }, [selectedUserId, fetchChatHistory]);

  return {
    messages,
    loading,
    unreadCounts,
    sendMessage,
    uploadAttachment,
    refreshHistory: fetchChatHistory,
    refreshUnread: fetchUnreadCounts
  };
};
