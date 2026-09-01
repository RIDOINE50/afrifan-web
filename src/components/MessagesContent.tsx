"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("to");

  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  
  const [inputText, setInputText] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);
  const [editingMsg, setEditingMsg] = useState<any>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ États pour les fonctionnalités avancées
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

  const colors = {
    bg: "#0A0A0A",
    card: "#1A1A1A",
    border: "#2A2A2A",
    primary: "#8B5CF6",
    text: "#FFFFFF",
    textMuted: "#9CA3AF",
    green: "#22C55E",
    orange: "#F59E0B",
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
        setEditingMsg(null);
      } else {
        await supabase.from("messages").insert({
          sender_id: user.id,
          receiver_id: selectedUserId,
          type: "text",
          content: inputText.trim(),
          reply_to_id: replyTo?.id || null,
          reply_to_content: replyTo?.content || null,
          reply_to_name: replyTo?.name || null,
          is_read: false,
        });
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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSending(true);
    try {
      const fileName = `img_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from("chat_images").upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("chat_images").getPublicUrl(fileName);
      await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: selectedUserId,
        type: "image",
        content: publicUrl,
        is_read: false,
      });
      fetchInbox(user.id);
    } catch (error) {
      console.error("Erreur image:", error);
      alert("Échec de l'envoi de l'image");
    } finally {
      setIsSending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
          await supabase.from("messages").insert({
            sender_id: user.id,
            receiver_id: selectedUserId,
            type: "voice",
            content: publicUrl,
            duration: recordingTime,
            is_read: false,
          });
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

  const deleteMessage = async (msgId: string) => {
    if (!confirm("Supprimer ce message ?")) return;
    await supabase.from("messages").delete().eq("id", msgId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  };

  const markAsRead = async (msgId: string) => {
    await supabase.from("messages").update({ is_read: true }).eq("id", msgId);
  };

  const markConversationAsRead = async (otherUserId: string) => {
    await supabase.from("messages").update({ is_read: true }).eq("sender_id", otherUserId).eq("receiver_id", user.id).eq("is_read", false);
  };

  const initiateCall = async (callType: "audio" | "video") => {
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
    if (!confirm("Supprimer cette conversation ? Cette action est irréversible.")) return;
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

  const emojis = ["😀", "😂", "", "🥺", "😎", "👍", "🔥", "❤️", "😭", "🎉", "🤔", "👏"];

  return (
    <div className="msg-layout">
      <div className="msg-list-col">
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "bold" }}>Messages</h1>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{ background: "none", border: "none", color: colors.textMuted, fontSize: "20px", cursor: "pointer", padding: "4px" }}
              title="Actualiser"
            >
              {refreshing ? "⏳" : "🔄"}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              style={{ background: "none", border: "none", color: colors.textMuted, fontSize: "20px", cursor: "pointer", padding: "4px" }}
              title="Paramètres"
            >
              ⚙️
            </button>
          </div>
        </div>

        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: "flex", alignItems: "center", backgroundColor: colors.card, borderRadius: "12px", border: `1px solid ${colors.border}`, padding: "8px 12px" }}>
            <span style={{ color: colors.textMuted, marginRight: "8px" }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher des messages..."
              style={{ flex: 1, backgroundColor: "transparent", border: "none", color: colors.text, fontSize: "14px", outline: "none" }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", fontSize: "16px" }}>
                ✕
              </button>
            )}
          </div>
        </div>

        {topRecents.length > 0 && (
          <div style={{ padding: "12px 0", borderBottom: `1px solid ${colors.border}` }}>
            <div style={{ display: "flex", gap: "16px", overflowX: "auto", padding: "0 16px", scrollbarWidth: "none" }}>
              {topRecents.map((c) => (
                <div
                  key={c.other_user_id}
                  onClick={() => selectConversation(c.other_user_id)}
                  style={{ minWidth: "70px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer" }}
                >
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        padding: c.unread_count > 0 ? "2px" : "0",
                        background: c.unread_count > 0 ? `linear-gradient(135deg, ${colors.primary}, #6D28D9)` : "transparent",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          backgroundColor: colors.card,
                          backgroundImage: getAvatarOf(c) ? `url(${getAvatarOf(c)})` : undefined,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "24px",
                        }}
                      >
                        {!getAvatarOf(c) && "👤"}
                      </div>
                    </div>
                    {c.unread_count > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "-2px",
                          right: "-2px",
                          backgroundColor: colors.primary,
                          borderRadius: "50%",
                          minWidth: "20px",
                          height: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          fontWeight: "bold",
                          padding: "0 4px",
                          border: `2px solid ${colors.bg}`,
                        }}
                      >
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
          <div style={{ margin: "12px 16px", padding: "14px", backgroundColor: colors.card, borderRadius: "12px", border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: `${colors.primary}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
              👥
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "bold", fontSize: "14px" }}>Demandes de messages</div>
              <div style={{ fontSize: "12px", color: colors.textMuted }}>{requestsCount} nouvelle(s) demande(s)</div>
            </div>
            <button
              style={{ padding: "8px 16px", backgroundColor: colors.primary, border: "none", borderRadius: "20px", color: "white", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}
              onClick={() => alert("Écran des demandes à implémenter")}
            >
              Voir
            </button>
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ padding: "12px 16px 8px", fontSize: "12px", fontWeight: "bold", color: colors.textMuted, letterSpacing: "1px" }}>
            TOUTES LES CONVERSATIONS
          </div>
          {sortedConversations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: colors.textMuted }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>💬</div>
              <div style={{ fontWeight: "bold", marginBottom: "8px" }}>Aucune conversation</div>
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
                    backgroundColor: selectedUserId === c.other_user_id ? `${colors.primary}20` : "transparent",
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => { if (selectedUserId !== c.other_user_id) e.currentTarget.style.backgroundColor = `${colors.primary}10`; }}
                  onMouseLeave={(e) => { if (selectedUserId !== c.other_user_id) e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        backgroundColor: colors.card,
                        backgroundImage: getAvatarOf(c) ? `url(${getAvatarOf(c)})` : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                      }}
                    >
                      {!getAvatarOf(c) && "👤"}
                    </div>
                    {isPinned && (
                      <div style={{ position: "absolute", top: "-4px", left: "-4px", backgroundColor: colors.primary, borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>
                        📌
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontWeight: "bold", fontSize: "15px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {getNameOf(c)}
                      </span>
                      {isPinned && <span style={{ fontSize: "12px" }}>📌</span>}
                      {isMuted && <span style={{ fontSize: "12px" }}>🔕</span>}
                    </div>
                    <div style={{ fontSize: "13px", color: colors.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.last_message_type === "voice" ? "🎤 Message vocal" : c.last_message_type === "image" ? " Image" : c.last_message}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", color: colors.textMuted }}>{formatTimeAgo(c.last_message_time)}</span>
                    {c.unread_count > 0 && (
                      <div style={{ backgroundColor: colors.primary, borderRadius: "50%", minWidth: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold", padding: "0 4px" }}>
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
            <div style={{ padding: "16px 24px", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  className="mobile-back-btn"
                  onClick={() => setSelectedUserId(null)}
                  style={{ background: "none", border: "none", color: colors.text, fontSize: "24px", cursor: "pointer", padding: "0 8px 0 0" }}
                >
                  ←
                </button>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: colors.card, backgroundImage: selectedUser.avatar_url ? `url(${selectedUser.avatar_url})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }} />
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "16px" }}>{selectedUser.full_name || selectedUser.username}</div>
                  <div style={{ fontSize: "12px", color: colors.green }}>En ligne</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "16px" }}>
                <button onClick={() => initiateCall("audio")} style={{ background: "none", border: "none", color: colors.primary, fontSize: "24px", cursor: "pointer" }}>📞</button>
                <button onClick={() => initiateCall("video")} style={{ background: "none", border: "none", color: colors.primary, fontSize: "24px", cursor: "pointer" }}>📹</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {messages.map((msg: any) => {
                const isMine = msg.sender_id === user.id;
                return (
                  <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                    {msg.reply_to_content && (
                      <div style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: "8px 12px", borderRadius: "12px 12px 0 0", fontSize: "12px", color: colors.textMuted, borderLeft: `3px solid ${colors.primary}`, marginBottom: "-8px", zIndex: 1, width: "100%" }}>
                        <div style={{ fontWeight: "bold", color: colors.primary }}>{msg.reply_to_name}</div>
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{msg.reply_to_content}</div>
                      </div>
                    )}
                    <div
                      onContextMenu={(e) => { e.preventDefault(); if (isMine) deleteMessage(msg.id); }}
                      style={{
                        backgroundColor: isMine ? colors.primary : colors.card,
                        color: "white", padding: "12px 16px", borderRadius: "18px",
                        borderBottomRightRadius: isMine ? "4px" : "18px",
                        borderBottomLeftRadius: isMine ? "18px" : "4px",
                        wordBreak: "break-word",
                      }}
                    >
                      {msg.type === "image" ? (
                        <img src={msg.content} alt="Image" style={{ maxWidth: "250px", borderRadius: "12px", cursor: "pointer", display: "block" }} onClick={() => window.open(msg.content, "_blank")} />
                      ) : msg.type === "voice" ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "150px" }}>
                          <span>🎤</span>
                          <audio controls src={msg.content} style={{ height: "30px", maxWidth: "150px" }} />
                          <span style={{ fontSize: "12px" }}>{formatDuration(msg.duration)}</span>
                        </div>
                      ) : (
                        <span>{msg.content} {msg.is_edited && <span style={{ fontSize: "10px", opacity: 0.7 }}>(modifié)</span>}</span>
                      )}
                    </div>
                    <span style={{ fontSize: "11px", color: colors.textMuted, marginTop: "4px", marginRight: "4px" }}>
                      {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} {isMine && (msg.is_read ? "✓✓" : "✓")}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: "16px", borderTop: `1px solid ${colors.border}`, backgroundColor: colors.bg, position: "relative" }}>
              {replyTo && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.card, padding: "8px 12px", borderRadius: "8px", marginBottom: "8px", borderLeft: `3px solid ${colors.primary}` }}>
                  <div style={{ fontSize: "13px", overflow: "hidden" }}>
                    <span style={{ fontWeight: "bold", color: colors.primary }}>Réponse à {replyTo.name} : </span>
                    <span style={{ color: colors.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{replyTo.content}</span>
                  </div>
                  <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", padding: "4px" }}>✕</button>
                </div>
              )}
              {showEmoji && (
                <div style={{ position: "absolute", bottom: "80px", left: "16px", backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "12px", display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.5)", zIndex: 10 }}>
                  {emojis.map((emoji) => (
                    <button key={emoji} onClick={() => { setInputText((prev) => prev + emoji); setShowEmoji(false); }} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer" }}>
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              {isRecording ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "12px", height: "12px", backgroundColor: colors.red, borderRadius: "50%", animation: "pulse 1s infinite" }} />
                    <span style={{ fontWeight: "bold", color: colors.red }}>{formatDuration(recordingTime)}</span>
                  </div>
                  <button onClick={stopRecording} style={{ backgroundColor: colors.red, color: "white", border: "none", borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>⏹</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-end", gap: "12px" }}>
                  <input type="file" ref={fileInputRef} accept="image/*" style={{ display: "none" }} onChange={handleImageSelect} />
                  <button onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "none", color: colors.textMuted, fontSize: "24px", cursor: "pointer", padding: "8px" }}>📎</button>
                  <button onClick={() => setShowEmoji(!showEmoji)} style={{ background: "none", border: "none", color: showEmoji ? colors.primary : colors.textMuted, fontSize: "24px", cursor: "pointer", padding: "8px" }}>😊</button>
                  <div style={{ flex: 1, backgroundColor: colors.card, borderRadius: "24px", border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", padding: "4px 16px" }}>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder="Écrivez un message..."
                      rows={1}
                      style={{ flex: 1, backgroundColor: "transparent", border: "none", color: colors.text, fontSize: "15px", outline: "none", resize: "none", maxHeight: "100px", padding: "8px 0", fontFamily: "inherit" }}
                    />
                  </div>
                  {inputText.trim() ? (
                    <button onClick={handleSend} disabled={isSending} style={{ backgroundColor: colors.primary, border: "none", borderRadius: "50%", width: "48px", height: "48px", color: "white", fontSize: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {isSending ? "..." : "➤"}
                    </button>
                  ) : (
                    <button onClick={startRecording} style={{ backgroundColor: colors.primary, border: "none", borderRadius: "50%", width: "48px", height: "48px", color: "white", fontSize: "24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      🎤
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: colors.textMuted }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>💬</div>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px" }}>Vos messages</h2>
              <p>Sélectionnez une conversation pour commencer à discuter</p>
            </div>
          </div>
        )}
      </div>

      {contextMenu && (
        <div
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: "12px",
            padding: "8px 0",
            minWidth: "220px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            zIndex: 1000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            onClick={() => { selectConversation(contextMenu.conv.other_user_id); setContextMenu(null); }}
            style={{ padding: "10px 16px", cursor: "pointer", color: colors.text, fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}
          >
            <span></span> Voir le profil
          </div>
          <div
            onClick={() => togglePin(contextMenu.conv.other_user_id)}
            style={{ padding: "10px 16px", cursor: "pointer", color: colors.text, fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}
          >
            <span>{pinnedIds.has(contextMenu.conv.other_user_id) ? "📌" : "📍"}</span>
            {pinnedIds.has(contextMenu.conv.other_user_id) ? "Désépingler" : "Épingler"}
          </div>
          <div
            onClick={() => toggleMute(contextMenu.conv.other_user_id)}
            style={{ padding: "10px 16px", cursor: "pointer", color: colors.text, fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}
          >
            <span>{mutedIds.has(contextMenu.conv.other_user_id) ? "🔔" : "🔕"}</span>
            {mutedIds.has(contextMenu.conv.other_user_id) ? "Réactiver les notifications" : "Mettre en sourdine"}
          </div>
          <div
            onClick={() => blockUser(contextMenu.conv.other_user_id)}
            style={{ padding: "10px 16px", cursor: "pointer", color: colors.red, fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}
          >
            <span>🚫</span> Bloquer
          </div>
          <div
            onClick={() => { alert("Signalement envoyé"); setContextMenu(null); }}
            style={{ padding: "10px 16px", cursor: "pointer", color: colors.red, fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}
          >
            <span></span> Signaler
          </div>
          <div style={{ height: "1px", backgroundColor: colors.border, margin: "4px 0" }} />
          <div
            onClick={() => deleteConversation(contextMenu.conv)}
            style={{ padding: "10px 16px", cursor: "pointer", color: colors.red, fontSize: "14px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "10px" }}
          >
            <span>🗑️</span> Supprimer la conversation
          </div>
        </div>
      )}

      {showSettings && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowSettings(false)}
        >
          <div
            style={{ backgroundColor: colors.card, borderTopLeftRadius: "20px", borderTopRightRadius: "20px", width: "100%", maxWidth: "500px", maxHeight: "80vh", overflowY: "auto", padding: "20px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: "40px", height: "4px", backgroundColor: colors.border, borderRadius: "2px", margin: "0 auto 20px" }} />
            <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>⚙️</span> Paramètres de messagerie
            </h3>

            {[
              { icon: "🔔", title: "Notifications", subtitle: "Recevoir une notification à chaque message", value: notifEnabled, onChange: setNotifEnabled },
              { icon: "✓✓", title: "Accusés de lecture", subtitle: "Les autres voient quand tu as lu leurs messages", value: readReceipts, onChange: setReadReceipts },
              { icon: "🟢", title: "Statut en ligne", subtitle: "Afficher ton statut et celui des autres", value: showOnlineStatus, onChange: setShowOnlineStatus },
              { icon: "👥", title: "Demandes des fans", subtitle: "Autoriser les messages des non-abonnés", value: allowFanRequests, onChange: setAllowFanRequests },
            ].map((item, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: `1px solid ${colors.border}` }}
              >
                <span style={{ fontSize: "22px" }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>{item.title}</div>
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
                    transition: "background-color 0.2s",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      backgroundColor: "white",
                      position: "absolute",
                      top: "2px",
                      left: item.value ? "22px" : "2px",
                      transition: "left 0.2s",
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        
        .msg-layout {
          height: 100%;
          min-height: 100%;
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
        }
        
        .msg-chat-col {
          flex: 1;
          display: flex;
          flex-direction: column;
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
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}