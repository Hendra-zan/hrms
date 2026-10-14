import { useState, useEffect, useRef } from 'react';
import { useChat } from '../../../hooks/useChat.ts';
import { useAppData, useAuth } from '../../../stores/appStore.ts';
import { Employee } from '../../../types.ts';
import { supabase } from '../../../services/supabaseClient.ts';
import { FontSize, WidgetSize } from './types.ts';

export const useFloatingChatState = () => {
  const { authUser } = useAuth();
  const { attendanceRecords } = useAppData();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Employee | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isSearchingChat, setIsSearchingChat] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [contacts, setContacts] = useState<Employee[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const [fontSize, setFontSize] = useState<FontSize>(() =>
    (localStorage.getItem('chat_fontSize') as FontSize) || 'normal'
  );
  const [widgetSize, setWidgetSize] = useState<WidgetSize>(() =>
    (localStorage.getItem('chat_widgetSize') as WidgetSize) || 'normal'
  );

  useEffect(() => { localStorage.setItem('chat_fontSize', fontSize); }, [fontSize]);
  useEffect(() => { localStorage.setItem('chat_widgetSize', widgetSize); }, [widgetSize]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const { messages, loading, unreadCounts, sendMessage, uploadAttachment, refreshUnread } = useChat(selectedPartner?.user_id);
  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const [lastMessageTimes, setLastMessageTimes] = useState<Record<string, number>>({});

  const fetchLastMessageTimes = async () => {
    if (!authUser?.id) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, created_at')
        .or(`sender_id.eq.${authUser.id},receiver_id.eq.${authUser.id}`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const timesMap: Record<string, number> = {};
        data.forEach(m => {
          const otherUser = m.sender_id === authUser.id ? m.receiver_id : m.sender_id;
          if (!timesMap[otherUser]) {
            timesMap[otherUser] = new Date(m.created_at).getTime();
          }
        });
        setLastMessageTimes(timesMap);
      }
    } catch (err) {
      console.error('Failed to fetch last message times:', err);
    }
  };

  const fetchContacts = async () => {
    if (!authUser?.id) return;
    setLoadingContacts(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, user_id, nama, jabatan, departemen, foto, status, last_seen, shift')
        .eq('status', 'Aktif')
        .neq('user_id', authUser.id)
        .order('nama', { ascending: true });

      if (!error && data) {
        setContacts(data as Employee[]);
      }
    } catch (err) {
      console.error('Failed to fetch chat contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    if (authUser?.id) {
      refreshUnread();
      fetchLastMessageTimes();
      fetchContacts();
      const timer = setInterval(() => {
        refreshUnread();
        fetchLastMessageTimes();
      }, 10000);

      const channel = supabase
        .channel('desktop_employees_presence')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'employees' },
          () => {
            fetchContacts();
          }
        )
        .subscribe();

      return () => {
        clearInterval(timer);
        supabase.removeChannel(channel);
      };
    }
  }, [authUser?.id, refreshUnread]);

  const filteredEmployees = contacts
    .filter(emp => emp.user_id !== authUser?.id)
    .filter(emp =>
      !searchTerm.trim() ||
      emp.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.departemen || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.jabatan || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const unreadA = a.user_id ? unreadCounts[a.user_id] || 0 : 0;
      const unreadB = b.user_id ? unreadCounts[b.user_id] || 0 : 0;
      if (unreadB !== unreadA) return unreadB - unreadA;

      const timeA = a.user_id ? lastMessageTimes[a.user_id] || 0 : 0;
      const timeB = b.user_id ? lastMessageTimes[b.user_id] || 0 : 0;
      if (timeB !== timeA) return timeB - timeA;

      const lastSeenA = a.last_seen ? new Date(a.last_seen).getTime() : 0;
      const lastSeenB = b.last_seen ? new Date(b.last_seen).getTime() : 0;
      const isOnlineA = Date.now() - lastSeenA < 40000;
      const isOnlineB = Date.now() - lastSeenB < 40000;
      if (isOnlineB !== isOnlineA) return isOnlineB ? 1 : -1;

      return a.nama.localeCompare(b.nama);
    });

  const getOnlineStatus = (emp: Employee) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const rec = attendanceRecords?.find(r => (r.employeeId === emp.id || (r as any).nama === emp.nama) && r.tanggal === todayStr);

    let lastSeenText = '';
    let isRecentlyActive = false;

    if (emp.last_seen) {
      const diffMs = Date.now() - new Date(emp.last_seen).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) {
        lastSeenText = 'Aktif sekarang';
        isRecentlyActive = true;
      } else if (diffMins < 60) {
        lastSeenText = `Aktif ${diffMins}m lalu`;
        isRecentlyActive = diffMins < 5;
      } else {
        const diffHours = Math.floor(diffMins / 60);
        lastSeenText = `Aktif ${diffHours}j lalu`;
      }
    }

    const isClockedIn = rec?.clockIn && !rec?.clockOut;
    return { isClockedIn, lastSeenText, isRecentlyActive };
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedPartner) return;

    const text = inputText;
    setInputText('');
    await sendMessage(text);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPartner) return;

    try {
      setIsUploading(true);
      await uploadAttachment(file);
    } catch (err) {
      console.error('Failed to upload file:', err);
      alert('Gagal mengirim lampiran file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedPartner?.user_id || !authUser?.id) return;
    if (!window.confirm(`Hapus seluruh riwayat obrolan dengan ${selectedPartner.nama}? Pesan yang terhapus tidak dapat dikembalikan.`)) return;

    try {
      setIsDeletingConversation(true);
      const { error } = await supabase
        .from('messages')
        .delete()
        .or(`and(sender_id.eq.${authUser.id},receiver_id.eq.${selectedPartner.user_id}),and(sender_id.eq.${selectedPartner.user_id},receiver_id.eq.${authUser.id})`);

      if (error) throw error;
      setSelectedPartner(null);
    } catch (err: any) {
      console.error('Failed to delete conversation:', err);
      alert('Gagal menghapus percakapan: ' + err.message);
    } finally {
      setIsDeletingConversation(false);
    }
  };

  return {
    authUser,
    isOpen,
    setIsOpen,
    selectedPartner,
    setSelectedPartner,
    inputText,
    setInputText,
    searchTerm,
    setSearchTerm,
    chatSearchQuery,
    setChatSearchQuery,
    isSearchingChat,
    setIsSearchingChat,
    isUploading,
    isDeletingConversation,
    showSettings,
    setShowSettings,
    fontSize,
    setFontSize,
    widgetSize,
    setWidgetSize,
    fileInputRef,
    chatEndRef,
    messages,
    loading,
    unreadCounts,
    totalUnread,
    filteredEmployees,
    loadingContacts,
    getOnlineStatus,
    handleSend,
    handleFileUpload,
    handleDeleteConversation,
  };
};
