import { MobileUser } from '../../types';

export interface Employee {
  id: string;
  user_id: string;
  nama: string;
  jabatan: string;
  departemen: string;
  foto?: string;
  status: string;
  last_seen?: string;
  shift?: string;
}

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

export interface ChatScreenProps {
  user: MobileUser;
}
