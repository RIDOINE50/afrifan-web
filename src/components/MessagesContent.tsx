"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";
import { 
  ArrowLeft, Phone, Mic, Send, Paperclip, Smile, 
  MoreVertical, Check, CheckCheck, User, RefreshCw,
  Settings, Search, X, MessageSquare, Users, Pin,
  BellOff, Trash, Ban, Circle, Square, Play, Pause
} from "lucide-react";

export default function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("to");
  const { isDark, theme } = useAppTheme();

  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  
  const [inputText, setInputText] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);
  const [editingMsg, setEditingMsg] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [mutedIds, setMutedIds] = useState<Set<string>>(new Set());
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; conv: any } | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [allowFanRequests, setAllowFanRequests] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmPopup, setConfirmPopup] = useState<{ title: string; message: string; onConfirm: () => void; } | null>(null);
      const colors = {
    bg: isDark ? "#000000" : "#FFFFFF",
    card: isDark ? "#1E1E1E" : "#F3F4F6", // Bulles reçues : gris clair en clair, gris foncé en sombre
    border: isDark ? "#333333" : "#E5E7EB",
    primary: isDark ? "#7C3AED" : "#2563EB", // Bulles envoyées : Bleu en clair, Violet en sombre
    primaryText: "#FFFFFF", // TOUJOURS blanc sur les bulles envoyées
    text: isDark ? "#FFFFFF" : "#111827", // Texte : Blanc en sombre, Noir en clair
    textMuted: isDark ? "#A1A1AA" : "#6B7280",
    hover: isDark ? "#27272A" : "#F9FAFB",
    green: "#22C55E",
    red: "#EF4444",
  };

  useEffect(() => {
    let realtimeChannel: any = null;
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchInbox(session.user.id);
        realtimeChannel = setupRealtime(session.user.id);
      } else {
        router.push("/login");
      }
    };
    init();
    return () => {
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    };
  }, []);

  useEffect(() => {
    if (user && targetUserId && !selectedUserId) {
      selectConversation(targetUserId);
    }
  }, [user, targetUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const toggleAudioPlay = (msgId: string, audioUrl: string) => {
    if (playingAudioId === msgId) {
      audioRefs.current[msgId]?.pause();
      setPlayingAudioId(null);
    } else {
      if (playingAudioId && audioRefs.current[playingAudioId]) {
        audioRefs.current[playingAudioId].pause();
      }
      if (!audioRefs.current[msgId]) {
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          setPlayingAudioId(null);
          setAudioProgress(prev => ({ ...prev, [msgId]: 0 }));
        };
        audio.ontimeupdate = () => {
          const progress = (audio.currentTime / audio.duration) * 100;
          setAudioProgress(prev => ({ ...prev, [msgId]: progress }));
        };
        audioRefs.current[msgId] = audio;
      }
      audioRefs.current[msgId].play();
      setPlayingAudioId(msgId);
    }
  };

  const fetchInbox = async (userId: string) => {
    const { data: messagesData } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!messagesData) return;

    const conversationsMap: Record<string, any> = {};
    const unreadCountMap: Record<string, number> = {};

    for (const msg of messagesData) {
      const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!conversationsMap[otherUserId]) {
        conversationsMap[otherUserId] = msg;
        unreadCountMap[otherUserId] = 0;
      }
      if (msg.receiver_id === userId && msg.is_read === false) {
        unreadCountMap[otherUserId]++;
      }
    }

    const otherUserIds = Object.keys(conversationsMap);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", otherUserIds);

    const profilesMap: Record<string, any> = {};
    profiles?.forEach((p: any) => { profilesMap[p.id] = p; });

    const finalConversations = Object.entries(conversationsMap).map(([otherUserId, lastMessage]: [string, any]) => ({
      other_user_id: otherUserId,
      other_user_profile: profilesMap[otherUserId] || { username: "Utilisateur" },
      last_message: lastMessage.content,
      last_message_type: lastMessage.type || "text",
      last_message_time: lastMessage.created_at,
      last_message_is_mine: lastMessage.sender_id === userId,
      unread_count: unreadCountMap[otherUserId] || 0,
    }));

    finalConversations.sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());
    setConversations(finalConversations);
  };

  const setupRealtime = (userId: string) => {
    const channelName = `messages_${userId}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const newMsg = payload.new;
        fetchInbox(userId);
        if (newMsg.sender_id === selectedUserId || newMsg.receiver_id === selectedUserId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          });
          if (newMsg.receiver_id === userId && newMsg.sender_id === selectedUserId) {
            markAsRead(newMsg.id);
          }
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const updated = payload.new;
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, (payload) => {
        const deletedId = payload.old.id;
        setMessages((prev) => prev.filter((m) => m.id !== deletedId));
      })
      .subscribe();
    return channel;
  };

  const selectConversation = async (otherUserId: string) => {
    setSelectedUserId(otherUserId);
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", otherUserId).single();
    setSelectedUser(profile);
    
    const { data: messagesData } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });
      
    setMessages(messagesData || []);
    markConversationAsRead(otherUserId);
  };

    const handleSend = async () => {
    if (!inputText.trim() && !editingMsg) return;
    setIsSending(true);
    try {
      if (editingMsg) {
        await supabase.from("messages").update({ content: inputText.trim(), is_edited: true }).eq("id", editingMsg.id);
        setMessages((prev) => prev.map((m) => m.id === editingMsg.id ? { ...m, content: inputText.trim(), is_edited: true } : m));
        setEditingMsg(null);
      } else {
        const { data, error } = await supabase
          .from("messages")
          .insert({
            sender_id: user.id,
            receiver_id: selectedUserId,
            type: "text",
            content: inputText.trim(),
            reply_to_id: replyTo?.id || null,
            reply_to_content: replyTo?.content || null,
            reply_to_name: replyTo?.name || null,
            is_read: false,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.id)) return prev;
            return [...prev, data];
          });
        }
        setReplyTo(null);
      }
      setInputText("");
      fetchInbox(user.id);
    } catch (error) {
      console.error("Erreur envoi:", error);
    } finally {
      setIsSending(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (event: any) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
            recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const fileName = `voice_${Date.now()}.webm`;
        const { error: uploadError } = await supabase.storage.from("voice_messages").upload(fileName, audioBlob);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from("voice_messages").getPublicUrl(fileName);
          const { data, error } = await supabase
            .from("messages")
            .insert({
              sender_id: user.id,
              receiver_id: selectedUserId,
              type: "voice",
              content: publicUrl,
              duration: recordingTime,
              is_read: false,
            })
            .select()
            .single();

          if (!error && data) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === data.id)) return prev;
              return [...prev, data];
            });
          }
          fetchInbox(user.id);
        }
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    } catch (err) {
      alert("Veuillez autoriser l'accès au microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      clearInterval(recordingTimerRef.current);
      setIsRecording(false);
    }
  };

    const deleteMessage = (msgId: string) => {
    setConfirmPopup({
      title: "Supprimer le message",
      message: "Voulez-vous vraiment supprimer ce message ?",
      onConfirm: async () => {
        await supabase.from("messages").delete().eq("id", msgId);
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
        setConfirmPopup(null);
      }
    });
  };

  const markAsRead = async (msgId: string) => {
    await supabase.from("messages").update({ is_read: true }).eq("id", msgId);
  };

  const markConversationAsRead = async (otherUserId: string) => {
    await supabase.from("messages").update({ is_read: true }).eq("sender_id", otherUserId).eq("receiver_id", user.id).eq("is_read", false);
  };

  const initiateCall = async (callType: "audio") => {
    try {
      const { data, error } = await supabase
        .from("calls")
        .insert({ caller_id: user.id, receiver_id: selectedUserId, call_type: callType, status: "ongoing" })
        .select()
        .single();
      if (error) throw error;
      router.push(`/calls/${callType}?callId=${data.id}&otherId=${selectedUserId}&name=${encodeURIComponent(selectedUser.full_name || selectedUser.username)}`);
    } catch (error) {
      console.error("Erreur appel:", error);
      alert("Impossible de lancer l'appel pour le moment.");
    }
  };

  const getNameOf = (c: any) => c.other_user_profile?.full_name || c.other_user_profile?.username || "Utilisateur";
  const getAvatarOf = (c: any) => c.other_user_profile?.avatar_url || null;

  const formatTimeAgo = (dateString: string) => {
    try {
      const dateTime = new Date(dateString);
      const diff = Date.now() - dateTime.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      if (minutes < 1) return "À l'instant";
      if (minutes < 60) return `${minutes}m`;
      if (hours < 24) return `${hours}h`;
      if (days < 7) return `${days}j`;
      return dateTime.toLocaleDateString("fr-FR");
    } catch {
      return "";
    }
  };

  const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

  const filteredConversations = conversations.filter((c) => {
    if (searchQuery.trim() === "") return true;
    return getNameOf(c).toLowerCase().includes(searchQuery.toLowerCase());
  });

  const sortedConversations = [...filteredConversations].sort((a, b) => {
    const aPinned = pinnedIds.has(a.other_user_id);
    const bPinned = pinnedIds.has(b.other_user_id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
  });

  const topRecents = sortedConversations.filter((c) => !c.is_request).slice(0, 6);
  const requestsCount = conversations.filter((c) => c.is_request).length;

  const togglePin = (convId: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(convId)) next.delete(convId);
      else next.add(convId);
      return next;
    });
    setContextMenu(null);
  };

  const toggleMute = (convId: string) => {
    setMutedIds((prev) => {
      const next = new Set(prev);
      if (next.has(convId)) next.delete(convId);
      else next.add(convId);
      return next;
    });
    setContextMenu(null);
  };

  const blockUser = (convId: string) => {
    setBlockedIds((prev) => new Set(prev).add(convId));
    setContextMenu(null);
    alert("Utilisateur bloqué");
  };

   const deleteConversation = (conv: any) => {
    setConfirmPopup({
      title: "Supprimer la conversation",
      message: "Cette action est irréversible. Voulez-vous vraiment supprimer cette conversation ?",
      onConfirm: () => {
        setConversations((prev) => prev.filter((c) => c.other_user_id !== conv.other_user_id));
        setPinnedIds((prev) => { const n = new Set(prev); n.delete(conv.other_user_id); return n; });
        setMutedIds((prev) => { const n = new Set(prev); n.delete(conv.other_user_id); return n; });
        setBlockedIds((prev) => { const n = new Set(prev); n.delete(conv.other_user_id); return n; });
        if (selectedUserId === conv.other_user_id) {
          setSelectedUserId(null);
          setSelectedUser(null);
          setMessages([]);
        }
        setContextMenu(null);
        setConfirmPopup(null);
      }
    });
  };

  const handleContextMenu = (e: React.MouseEvent, conv: any) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, conv });
  };

  const handleLongPress = (conv: any) => {
    setContextMenu({ x: window.innerWidth / 2, y: window.innerHeight / 2, conv });
  };

  const handleRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchInbox(user.id);
    setRefreshing(false);
  };

  const goToUserProfile = () => {
    if (selectedUserId) {
      router.push(`/createur?id=${selectedUserId}`);
    }
  };

  const handleAttachment = () => {
    alert("Fonctionnalité de pièce jointe à implémenter");
  };

  return (
    <div className="msg-layout">
      <div className="msg-list-col">
        <div className="chat-header" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "bold", color: colors.text }}>Messages</h1>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
            >
              {refreshing ? <RefreshCw size={20} className="animate-spin" /> : <RefreshCw size={20} />}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", backgroundColor: colors.card, borderRadius: "12px", border: `1px solid ${colors.border}`, padding: "8px 12px" }}>
            <span style={{ color: colors.textMuted, marginRight: "8px", display: "flex" }}><Search size={18} /></span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              style={{ flex: 1, backgroundColor: "transparent", border: "none", color: colors.text, fontSize: "14px", outline: "none" }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", display: "flex", padding: "4px" }}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {topRecents.length > 0 && (
          <div style={{ padding: "12px 0", borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
            <div style={{ display: "flex", gap: "16px", overflowX: "auto", padding: "0 16px", scrollbarWidth: "none" }}>
              {topRecents.map((c) => (
                <div
                  key={c.other_user_id}
                  onClick={() => selectConversation(c.other_user_id)}
                  style={{ minWidth: "70px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer" }}
                >
                  <div style={{ position: "relative" }}>
                    <div style={{ width: "60px", height: "60px", borderRadius: "50%", padding: c.unread_count > 0 ? "2px" : "0", background: c.unread_count > 0 ? colors.primary : "transparent" }}>
                      <div style={{ width: "100%", height: "100%", borderRadius: "50%", backgroundColor: colors.card, backgroundImage: getAvatarOf(c) ? `url(${getAvatarOf(c)})` : undefined, backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center", color: colors.textMuted }}>
                        {!getAvatarOf(c) && <User size={24} />}
                      </div>
                    </div>
                    {c.unread_count > 0 && (
                      <div style={{ position: "absolute", top: "-2px", right: "-2px", backgroundColor: colors.primary, color: colors.primaryText, borderRadius: "50%", minWidth: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "bold", padding: "0 4px", border: `2px solid ${colors.bg}` }}>
                        {c.unread_count > 99 ? "99+" : c.unread_count}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: "11px", color: colors.text, textAlign: "center", maxWidth: "70px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {getNameOf(c)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {requestsCount > 0 && allowFanRequests && (
          <div style={{ margin: "12px 16px", padding: "14px", backgroundColor: colors.card, borderRadius: "12px", border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: colors.hover, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary }}>
              <Users size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "bold", fontSize: "14px", color: colors.text }}>Demandes de messages</div>
              <div style={{ fontSize: "12px", color: colors.textMuted }}>{requestsCount} nouvelle(s) demande(s)</div>
            </div>
            <button style={{ padding: "8px 16px", backgroundColor: colors.primary, border: "none", borderRadius: "20px", color: colors.primaryText, fontWeight: "bold", fontSize: "13px", cursor: "pointer" }} onClick={() => alert("Écran des demandes à implémenter")}>
              Voir
            </button>
          </div>
        )}

        <div className="conversations-scroll-area">
          <div style={{ padding: "12px 16px 8px", fontSize: "12px", fontWeight: "bold", color: colors.textMuted, letterSpacing: "1px" }}>
            TOUTES LES CONVERSATIONS
          </div>
          {sortedConversations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: colors.textMuted }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: colors.textMuted }}>
                <MessageSquare size={48} strokeWidth={1.5} />
              </div>
              <div style={{ fontWeight: "bold", marginBottom: "8px", color: colors.text }}>Aucune conversation</div>
              <div style={{ fontSize: "13px" }}>Suivez un créateur pour commencer à discuter</div>
            </div>
          ) : (
            sortedConversations.map((c) => {
              const isPinned = pinnedIds.has(c.other_user_id);
              const isMuted = mutedIds.has(c.other_user_id);
              const isBlocked = blockedIds.has(c.other_user_id);
              if (isBlocked) return null;
              return (
                <div
                  key={c.other_user_id}
                  onClick={() => selectConversation(c.other_user_id)}
                  onContextMenu={(e) => handleContextMenu(e, c)}
                  onDoubleClick={() => handleLongPress(c)}
                  style={{
                    padding: "14px 16px",
                    borderBottom: `1px solid ${colors.border}`,
                    cursor: "pointer",
                    backgroundColor: selectedUserId === c.other_user_id ? colors.hover : "transparent",
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => { if (selectedUserId !== c.other_user_id) e.currentTarget.style.backgroundColor = colors.hover; }}
                  onMouseLeave={(e) => { if (selectedUserId !== c.other_user_id) e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: colors.card, backgroundImage: getAvatarOf(c) ? `url(${getAvatarOf(c)})` : undefined, backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center", color: colors.textMuted }}>
                      {!getAvatarOf(c) && <User size={20} />}
                    </div>
                    {isPinned && (
                      <div style={{ position: "absolute", top: "-4px", left: "-4px", backgroundColor: colors.primary, borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Pin size={10} color="white" />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontWeight: "bold", fontSize: "15px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: colors.text }}>
                        {getNameOf(c)}
                      </span>
                      {isPinned && <Pin size={12} color={colors.textMuted} />}
                      {isMuted && <BellOff size={12} color={colors.textMuted} />}
                    </div>
                    <div style={{ fontSize: "13px", color: colors.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: "4px" }}>
                      {c.last_message_type === "voice" && <Mic size={12} />}
                      {c.last_message_type === "voice" ? "Message vocal" : c.last_message}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", color: colors.textMuted }}>{formatTimeAgo(c.last_message_time)}</span>
                    {c.unread_count > 0 && (
                      <div style={{ backgroundColor: colors.primary, color: colors.primaryText, borderRadius: "50%", minWidth: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold", padding: "0 4px" }}>
                        {c.unread_count}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="msg-chat-col">
        {selectedUserId && selectedUser ? (
          <>
            <div className="chat-header" style={{ 
              padding: "12px 16px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between", 
              flexShrink: 0,
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.bg
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                <button 
                  className="mobile-back-btn" 
                  onClick={() => setSelectedUserId(null)} 
                  style={{ background: "none", border: "none", color: colors.text, cursor: "pointer", padding: "4px", display: "none", alignItems: "center" }}
                >
                  <ArrowLeft size={24} />
                </button>
                
                <div 
                  onClick={goToUserProfile}
                  style={{ 
                    width: "40px", 
                    height: "40px", 
                    borderRadius: "50%", 
                    backgroundColor: colors.card, 
                    backgroundImage: selectedUser.avatar_url ? `url(${selectedUser.avatar_url})` : undefined, 
                    backgroundSize: "cover", 
                    backgroundPosition: "center", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    color: colors.textMuted, 
                    cursor: "pointer",
                    position: "relative"
                  }}
                >
                  {!selectedUser.avatar_url && <User size={20} />}
                  <div style={{
                    position: "absolute",
                    bottom: "2px",
                    right: "2px",
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: colors.green,
                    border: `2px solid ${colors.bg}`
                  }} />
                </div>

                <div onClick={goToUserProfile} style={{ cursor: "pointer", flex: 1 }}>
                  <div style={{ fontWeight: "600", fontSize: "16px", color: colors.text }}>
                    {selectedUser.full_name || selectedUser.username}
                  </div>
                  <div style={{ fontSize: "13px", color: colors.green }}>
                    En ligne
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <button 
                  onClick={() => initiateCall("audio")} 
                  style={{ 
                    background: "none", 
                    border: "none", 
                    color: colors.text, 
                    cursor: "pointer", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    padding: "8px",
                    borderRadius: "50%",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <Phone size={22} />
                </button>
                <button 
                  style={{ 
                    background: "none", 
                    border: "none", 
                    color: colors.text, 
                    cursor: "pointer", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    padding: "8px",
                    borderRadius: "50%",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <MoreVertical size={22} />
                </button>
              </div>
            </div>

            <div className="messages-scroll-area" style={{ 
              flex: 1, 
              overflowY: "auto", 
              padding: "20px", 
              display: "flex", 
              flexDirection: "column", 
              gap: "8px",
              backgroundColor: colors.bg
            }}>
              {messages.map((msg: any) => {
                const isMine = msg.sender_id === user.id;
                return (
                  <div key={msg.id} style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: isMine ? "flex-end" : "flex-start",
                    maxWidth: "75%",
                    alignSelf: isMine ? "flex-end" : "flex-start"
                  }}>
                    {msg.reply_to_content && (
                      <div style={{ 
                        backgroundColor: isMine ? "rgba(255,255,255,0.1)" : colors.hover, 
                        padding: "6px 10px", 
                        borderRadius: "8px 8px 0 0", 
                        fontSize: "12px", 
                        color: colors.textMuted, 
                        borderLeft: `3px solid ${colors.primary}`, 
                        marginBottom: "4px",
                        width: "100%"
                      }}>
                        <div style={{ fontWeight: "600", color: colors.primary, fontSize: "11px", marginBottom: "2px" }}>
                          {msg.reply_to_name}
                        </div>
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {msg.reply_to_content}
                        </div>
                      </div>
                    )}
                    
                    <div
                      onContextMenu={(e) => { e.preventDefault(); if (isMine) deleteMessage(msg.id); }}
                      style={{
                        backgroundColor: isMine ? colors.primary : colors.card,
                        color: isMine ? colors.primaryText : colors.text,
                        padding: "10px 14px", 
                        borderRadius: "18px",
                        borderBottomRightRadius: isMine ? "4px" : "18px",
                        borderBottomLeftRadius: isMine ? "18px" : "4px",
                        wordBreak: "break-word",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      }}
                    >
                      {msg.type === "voice" ? (
                        <div style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "12px", 
                          minWidth: "200px",
                          maxWidth: "280px",
                          padding: "4px 0"
                        }}>
                          <button
                            onClick={() => toggleAudioPlay(msg.id, msg.content)}
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              backgroundColor: isMine 
                                ? (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)") 
                                : colors.primary,
                              border: "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              flexShrink: 0,
                              transition: "transform 0.1s"
                            }}
                            onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.95)"}
                            onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                          >
                            {playingAudioId === msg.id ? (
                              <Pause size={18} color={isMine ? (isDark ? "white" : "black") : "white"} />
                            ) : (
                              <Play size={18} color={isMine ? (isDark ? "white" : "black") : "white"} style={{ marginLeft: "2px" }} />
                            )}
                          </button>

                          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div style={{
                              height: "4px",
                              backgroundColor: isMine 
                                ? (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)") 
                                : "rgba(255,255,255,0.1)",
                              borderRadius: "2px",
                              overflow: "hidden",
                              position: "relative"
                            }}>
                              <div style={{
                                height: "100%",
                                width: `${audioProgress[msg.id] || 0}%`,
                                backgroundColor: isMine 
                                  ? (isDark ? "white" : "black") 
                                  : colors.primary,
                                borderRadius: "2px",
                                transition: "width 0.1s linear"
                              }} />
                            </div>
                            
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "2px",
                              height: "20px"
                            }}>
                              {Array.from({ length: 20 }).map((_, i) => {
                                const height = Math.random() * 16 + 4;
                                const isActive = playingAudioId === msg.id && (i / 20) * 100 <= (audioProgress[msg.id] || 0);
                                return (
                                  <div
                                    key={i}
                                    style={{
                                      width: "3px",
                                      height: `${height}px`,
                                      backgroundColor: isActive 
                                        ? (isMine ? (isDark ? "white" : "black") : colors.primary) 
                                        : (isMine ? (isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)") : "rgba(255,255,255,0.15)"),
                                      borderRadius: "2px",
                                      transition: "background-color 0.2s"
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>

                          <span style={{ 
                            fontSize: "12px", 
                            opacity: 0.8, 
                            flexShrink: 0,
                            fontFamily: "monospace",
                            color: isMine ? (isDark ? "white" : "black") : colors.textMuted
                          }}>
                            {formatDuration(msg.duration)}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: "15px", lineHeight: "1.4" }}>
                          {msg.content} 
                          {msg.is_edited && <span style={{ fontSize: "10px", opacity: 0.7, marginLeft: "4px" }}>(modifié)</span>}
                        </span>
                      )}
                    </div>
                    
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "4px", 
                      marginTop: "4px",
                      marginRight: isMine ? "4px" : "auto",
                      marginLeft: isMine ? "auto" : "4px"
                    }}>
                      <span style={{ fontSize: "11px", color: colors.textMuted }}>
                        {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {isMine && (
                        <span style={{ color: msg.is_read ? colors.primary : colors.textMuted, display: "flex" }}>
                          {msg.is_read ? <CheckCheck size={14} /> : <Check size={14} />}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-footer" style={{ 
              padding: "12px 16px", 
              flexShrink: 0,
              backgroundColor: colors.bg,
              borderTop: `1px solid ${colors.border}`
            }}>
              {replyTo && (
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  backgroundColor: colors.card, 
                  padding: "8px 12px", 
                  borderRadius: "8px", 
                  marginBottom: "8px", 
                  borderLeft: `3px solid ${colors.primary}` 
                }}>
                  <div style={{ fontSize: "13px", overflow: "hidden", flex: 1, marginRight: "8px" }}>
                    <span style={{ fontWeight: "600", color: colors.primary, fontSize: "12px" }}>
                      Réponse à {replyTo.name}
                    </span>
                    <div style={{ color: colors.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "13px" }}>
                      {replyTo.content}
                    </div>
                  </div>
                  <button 
                    onClick={() => setReplyTo(null)} 
                    style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", padding: "4px", display: "flex" }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              
              {isRecording ? (
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  padding: "12px 16px", 
                  backgroundColor: "rgba(239, 68, 68, 0.1)", 
                  borderRadius: "12px", 
                  border: "1px solid rgba(239, 68, 68, 0.3)" 
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ 
                      width: "10px", 
                      height: "10px", 
                      backgroundColor: colors.red, 
                      borderRadius: "50%", 
                      animation: "pulse 1s infinite" 
                    }} />
                    <span style={{ fontWeight: "600", color: colors.red, fontFamily: "monospace", fontSize: "16px" }}>
                      {formatDuration(recordingTime)}
                    </span>
                  </div>
                  <button 
                    onClick={stopRecording} 
                    style={{ 
                      backgroundColor: colors.red, 
                      color: "white", 
                      border: "none", 
                      borderRadius: "50%", 
                      width: "40px", 
                      height: "40px", 
                      cursor: "pointer", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center" 
                    }}
                  >
                    <Square size={18} fill="white" />
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                  <button 
                    style={{ 
                      background: "none", 
                      border: "none", 
                      color: colors.textMuted, 
                      cursor: "pointer", 
                      padding: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <Smile size={24} />
                  </button>

                  <div style={{ 
                    flex: 1, 
                    backgroundColor: colors.card, 
                    borderRadius: "24px", 
                    border: `1px solid ${colors.border}`, 
                    display: "flex", 
                    alignItems: "center", 
                    padding: "8px 16px" 
                  }}>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder="Écrivez un message..."
                      rows={1}
                      style={{ 
                        flex: 1, 
                        backgroundColor: "transparent", 
                        border: "none", 
                        color: colors.text, 
                        fontSize: "15px", 
                        outline: "none", 
                        resize: "none", 
                        maxHeight: "100px", 
                        fontFamily: "inherit",
                        minHeight: "24px"
                      }}
                    />
                  </div>

                  {inputText.trim() ? (
                    <button 
                      onClick={handleSend} 
                      disabled={isSending} 
                      style={{ 
                        backgroundColor: colors.primary, 
                        color: colors.primaryText, 
                        border: "none", 
                        borderRadius: "50%", 
                        width: "48px", 
                        height: "48px", 
                        cursor: "pointer", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        flexShrink: 0,
                        transition: "transform 0.1s, opacity 0.2s"
                      }}
                      onMouseEnter={(e) => { if (!isSending) e.currentTarget.style.transform = "scale(1.05)"; }}
                      onMouseLeave={(e) => { if (!isSending) e.currentTarget.style.transform = "scale(1)"; }}
                    >
                      {isSending ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                  ) : (
                    <button 
                      onClick={startRecording} 
                      style={{ 
                        backgroundColor: colors.primary, 
                        color: colors.primaryText, 
                        border: "none", 
                        borderRadius: "50%", 
                        width: "48px", 
                        height: "48px", 
                        cursor: "pointer", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        flexShrink: 0,
                        transition: "transform 0.1s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    >
                      <Mic size={22} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ 
            flex: 1, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            color: colors.textMuted, 
            backgroundColor: colors.bg 
          }}>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px", color: colors.textMuted, opacity: 0.5 }}>
                <MessageSquare size={64} strokeWidth={1.5} />
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px", color: colors.text }}>
                Vos messages
              </h2>
              <p style={{ fontSize: "14px", maxWidth: "300px", margin: "0 auto", color: colors.textMuted }}>
                Sélectionnez une conversation dans la liste pour commencer à discuter.
              </p>
            </div>
          </div>
        )}
      </div>

      {contextMenu && (
        <div style={{ 
          position: "fixed", 
          top: contextMenu.y, 
          left: contextMenu.x, 
          backgroundColor: colors.card, 
          border: `1px solid ${colors.border}`, 
          borderRadius: "12px", 
          padding: "8px 0", 
          minWidth: "220px", 
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)", 
          zIndex: 1000 
        }} onClick={(e) => e.stopPropagation()}>
          <div onClick={() => { selectConversation(contextMenu.conv.other_user_id); setContextMenu(null); }} style={{ padding: "10px 16px", cursor: "pointer", color: colors.text, fontSize: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
            <User size={16} /> Voir le profil
          </div>
          <div onClick={() => togglePin(contextMenu.conv.other_user_id)} style={{ padding: "10px 16px", cursor: "pointer", color: colors.text, fontSize: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
            <Pin size={16} /> {pinnedIds.has(contextMenu.conv.other_user_id) ? "Désépingler" : "Épingler"}
          </div>
          <div onClick={() => toggleMute(contextMenu.conv.other_user_id)} style={{ padding: "10px 16px", cursor: "pointer", color: colors.text, fontSize: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
            <BellOff size={16} /> {mutedIds.has(contextMenu.conv.other_user_id) ? "Réactiver" : "Mettre en sourdine"}
          </div>
          <div onClick={() => blockUser(contextMenu.conv.other_user_id)} style={{ padding: "10px 16px", cursor: "pointer", color: colors.red, fontSize: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
            <Ban size={16} /> Bloquer
          </div>
          <div onClick={() => { alert("Signalement envoyé"); setContextMenu(null); }} style={{ padding: "10px 16px", cursor: "pointer", color: colors.red, fontSize: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
            <Ban size={16} /> Signaler
          </div>
          <div style={{ height: "1px", backgroundColor: colors.border, margin: "4px 0" }} />
          <div onClick={() => deleteConversation(contextMenu.conv)} style={{ padding: "10px 16px", cursor: "pointer", color: colors.red, fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "12px" }}>
            <Trash size={16} /> Supprimer la conversation
          </div>
        </div>
      )}
      {confirmPopup && (
        <div style={{ 
          position: "fixed", 
          inset: 0, 
          backgroundColor: "rgba(0,0,0,0.6)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          zIndex: 2000,
          padding: "20px"
        }} onClick={() => setConfirmPopup(null)}>
          <div style={{ 
            backgroundColor: colors.card, 
            padding: "24px", 
            borderRadius: "16px", 
            width: "100%", 
            maxWidth: "340px", 
            border: `1px solid ${colors.border}`, 
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)" 
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", color: colors.text, fontWeight: "bold" }}>
              {confirmPopup.title}
            </h3>
            <p style={{ margin: "0 0 24px", fontSize: "14px", color: colors.textMuted, lineHeight: "1.4" }}>
              {confirmPopup.message}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button 
                onClick={() => setConfirmPopup(null)} 
                style={{ 
                  padding: "10px 16px", 
                  borderRadius: "12px", 
                  border: "none", 
                  backgroundColor: colors.hover, 
                  color: colors.text, 
                  fontWeight: "600", 
                  cursor: "pointer", 
                  fontSize: "14px" 
                }}
              >
                Annuler
              </button>
              <button 
                onClick={confirmPopup.onConfirm} 
                style={{ 
                  padding: "10px 16px", 
                  borderRadius: "12px", 
                  border: "none", 
                  backgroundColor: colors.red, 
                  color: "white", 
                  fontWeight: "600", 
                  cursor: "pointer", 
                  fontSize: "14px" 
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
      {showSettings && (
        <div style={{ 
          position: "fixed", 
          inset: 0, 
          backgroundColor: "rgba(0,0,0,0.7)", 
          display: "flex", 
          alignItems: "flex-end", 
          justifyContent: "center", 
          zIndex: 1000 
        }} onClick={() => setShowSettings(false)}>
          <div style={{ 
            backgroundColor: colors.card, 
            borderTopLeftRadius: "20px", 
            borderTopRightRadius: "20px", 
            width: "100%", 
            maxWidth: "500px", 
            maxHeight: "80vh", 
            overflowY: "auto", 
            padding: "20px" 
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: "40px", height: "4px", backgroundColor: colors.border, borderRadius: "2px", margin: "0 auto 20px" }} />
            <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px", color: colors.text }}>
              <Settings size={20} /> Paramètres de messagerie
            </h3>

            {[
              { icon: <BellOff size={20} />, title: "Notifications", subtitle: "Recevoir une notification à chaque message", value: notifEnabled, onChange: setNotifEnabled },
              { icon: <CheckCheck size={20} />, title: "Accusés de lecture", subtitle: "Les autres voient quand tu as lu leurs messages", value: readReceipts, onChange: setReadReceipts },
              { icon: <Circle size={20} />, title: "Statut en ligne", subtitle: "Afficher ton statut et celui des autres", value: showOnlineStatus, onChange: setShowOnlineStatus },
              { icon: <Users size={20} />, title: "Demandes des fans", subtitle: "Autoriser les messages des non-abonnés", value: allowFanRequests, onChange: setAllowFanRequests },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: `1px solid ${colors.border}` }}>
                <span style={{ color: colors.textMuted, display: "flex" }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "600", fontSize: "14px", color: colors.text }}>{item.title}</div>
                  <div style={{ fontSize: "12px", color: colors.textMuted }}>{item.subtitle}</div>
                </div>
                <button 
                  onClick={() => item.onChange(!item.value)} 
                  style={{ 
                    width: "44px", 
                    height: "24px", 
                    borderRadius: "12px", 
                    border: "none", 
                    backgroundColor: item.value ? colors.primary : colors.border, 
                    position: "relative", 
                    cursor: "pointer", 
                    transition: "background-color 0.2s" 
                  }}
                >
                  <div style={{ 
                    width: "20px", 
                    height: "20px", 
                    borderRadius: "50%", 
                    backgroundColor: "white", 
                    position: "absolute", 
                    top: "2px", 
                    left: item.value ? "22px" : "2px", 
                    transition: "left 0.2s", 
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)" 
                  }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 
          0% { opacity: 1; transform: scale(1); } 
          50% { opacity: 0.5; transform: scale(1.1); } 
          100% { opacity: 1; transform: scale(1); } 
        }
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
        .animate-spin { 
          animation: spin 1s linear infinite; 
        }
        
        .msg-layout {
          height: 100dvh;
          background-color: ${colors.bg};
          color: ${colors.text};
          display: flex;
          overflow: hidden;
        }
        
        .msg-list-col {
          width: 350px;
          border-right: 1px solid ${colors.border};
          display: flex;
          flex-direction: column;
          height: 100%;
          background-color: ${colors.bg};
        }
        
        .msg-chat-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          background-color: ${colors.bg};
          height: 100%;
          position: relative;
        }

        .messages-scroll-area {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .conversations-scroll-area {
          flex: 1;
          overflow-y: auto;
        }

        .chat-header {
          position: sticky;
          top: 0;
          z-index: 10;
          background-color: ${colors.bg};
        }

        .chat-footer {
          position: sticky;
          bottom: 0;
          z-index: 10;
          background-color: ${colors.bg};
        }

        .mobile-back-btn {
          display: none !important;
        }

        @media (max-width: 768px) {
          .msg-list-col {
            width: 100% !important;
            border-right: none !important;
            display: ${selectedUserId ? 'none' : 'flex'} !important;
          }
          .msg-chat-col {
            display: ${selectedUserId ? 'flex' : 'none'} !important;
            width: 100% !important;
          }
          .mobile-back-btn {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}