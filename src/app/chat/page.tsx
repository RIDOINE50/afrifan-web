"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("userId");

  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialUserId);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Ref pour stocker le canal Realtime
  const channelRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const colors = {
    bg: "#0A0A0A",
    card: "#1A1A1A",
    border: "#2A2A2A",
    primary: "#8B5CF6",
    primaryHover: "#7C3AED",
    text: "#FFFFFF",
    textMuted: "#9CA3AF",
    green: "#22C55E",
    orange: "#F59E0B",
    red: "#EF4444",
    myMessage: "#8B5CF6",
    theirMessage: "#2A2A2A",
  };

  // Initialisation
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchInbox(session.user.id);
        // Stocker le canal pour le cleanup
        channelRef.current = setupRealtime(session.user.id);

        if (initialUserId) {
          await selectConversation(initialUserId);
        }
        setIsLoading(false);
      } else {
        router.push("/login");
      }
    };
    init();

    // Nettoyage : se désabonner du canal
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus sur l'input quand on sélectionne une conversation
  useEffect(() => {
    if (selectedUserId) {
      inputRef.current?.focus();
    }
  }, [selectedUserId]);

  // Récupérer la liste des conversations
  const fetchInbox = async (userId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      if (!messages || messages.length === 0) {
        setConversations([]);
        return;
      }

      const conversationsMap: Record<string, any> = {};
      const unreadCountMap: Record<string, number> = {};

      for (const msg of messages) {
        const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;

        if (!conversationsMap[otherUserId]) {
          conversationsMap[otherUserId] = msg;
          unreadCountMap[otherUserId] = 0;
        }

        if (msg.receiver_id === userId && msg.is_read === false) {
          unreadCountMap[otherUserId] = (unreadCountMap[otherUserId] || 0) + 1;
        }
      }

      const otherUserIds = Object.keys(conversationsMap);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, online_status')
        .in('id', otherUserIds);

      const profilesMap: Record<string, any> = {};
      profiles?.forEach((p: any) => { profilesMap[p.id] = p; });

      const finalConversations = Object.entries(conversationsMap).map(([otherUserId, lastMessage]: [string, any]) => ({
        other_user_id: otherUserId,
        other_user_profile: profilesMap[otherUserId] || { username: 'Utilisateur', full_name: 'Utilisateur' },
        last_message: lastMessage.content,
        last_message_time: lastMessage.created_at,
        last_message_is_mine: lastMessage.sender_id === userId,
        unread_count: unreadCountMap[otherUserId] || 0,
      }));

      finalConversations.sort((a, b) =>
        new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      );

      setConversations(finalConversations);
    } catch (error) {
      console.error("❌ Erreur fetchInbox:", error);
    }
  };

  // Temps réel – création du canal avec ses callbacks
  const setupRealtime = (userId: string) => {
    const channel = supabase
      .channel('messages_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new;

          // Mettre à jour la liste des conversations
          fetchInbox(userId);

          // Si c'est la conversation active, ajouter le message
          if (newMsg.sender_id === selectedUserId || newMsg.receiver_id === selectedUserId) {
            setMessages(prev => {
              const exists = prev.some(m => m.id === newMsg.id);
              if (exists) return prev;
              return [...prev, newMsg].sort((a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            });

            // Marquer comme lu si on est le destinataire
            if (newMsg.receiver_id === userId && newMsg.sender_id === selectedUserId) {
              markAsRead(newMsg.id);
            }
          }
        }
      )
      .subscribe((status, err) => {
        if (err) console.error("❌ Erreur subscription Realtime:", err);
        else console.log("✅ Realtime connecté");
      });

    return channel;
  };

  // Sélectionner une conversation
  const selectConversation = async (otherUserId: string) => {
    setSelectedUserId(otherUserId);
    setShowMobileChat(true);

    // Récupérer le profil de l'utilisateur
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', otherUserId)
      .single();

    setSelectedUser(profiles);
    await fetchMessages(otherUserId);

    // Marquer tous les messages comme lus
    await markConversationAsRead(otherUserId);
  };

  // Récupérer les messages d'une conversation
  const fetchMessages = async (otherUserId: string) => {
    if (!user) return;

    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(messages || []);
    } catch (error) {
      console.error("❌ Erreur fetchMessages:", error);
    }
  };

  // Envoyer un message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId || !user) return;

    const content = newMessage.trim();
    setNewMessage("");

    try {
      const { data: newMsg, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedUserId,
          content: content,
          type: 'text',
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Ajouter immédiatement à la liste (optimistic update)
      setMessages(prev => [...prev, newMsg]);

      // Mettre à jour la liste des conversations
      fetchInbox(user.id);
    } catch (error) {
      console.error("❌ Erreur sendMessage:", error);
      setNewMessage(content); // Restaurer le message en cas d'erreur
    }
  };

  // Marquer un message comme lu
  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', messageId);
    } catch (error) {
      console.error("❌ Erreur markAsRead:", error);
    }
  };

  // Marquer toute la conversation comme lue
  const markConversationAsRead = async (otherUserId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);
    } catch (error) {
      console.error("❌ Erreur markConversationAsRead:", error);
    }
  };

  // Helpers
  const getName = (c: any) => c.other_user_profile?.full_name || c.other_user_profile?.username || "Utilisateur";
  const getAvatar = (c: any) => c.other_user_profile?.avatar_url;

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "";
    }
  };

  const formatLastSeen = (dateString: string) => {
    try {
      const diff = Date.now() - new Date(dateString).getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return "En ligne";
      if (minutes < 60) return `Vu il y a ${minutes}m`;
      if (hours < 24) return `Vu il y a ${hours}h`;
      if (days < 7) return `Vu il y a ${days}j`;
      return `Vu le ${new Date(dateString).toLocaleDateString('fr-FR')}`;
    } catch {
      return "";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return colors.green;
      case 'away': return colors.orange;
      case 'busy': return colors.red;
      default: return colors.textMuted;
    }
  };

  if (isLoading) {
    return (
      <div style={{ height: "100vh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", backgroundColor: colors.bg, color: colors.text, display: "flex", overflow: "hidden" }}>

      {/* COLONNE GAUCHE - Liste des conversations */}
      <div style={{
        width: showMobileChat ? "0" : "100%",
        maxWidth: showMobileChat ? "0" : "400px",
        borderRight: `1px solid ${colors.border}`,
        display: showMobileChat ? "none" : "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "all 0.3s"
      }} className="conversation-list">

        {/* Header */}
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button onClick={() => router.back()} style={{ background: "none", border: "none", color: colors.text, fontSize: "24px", cursor: "pointer" }}>←</button>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>Messages</h1>
          </div>
        </div>

        {/* Liste scrollable */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {conversations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: colors.textMuted }}>
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>💬</div>
              <p>Aucune conversation</p>
            </div>
          ) : (
            conversations.map((c: any) => (
              <div
                key={c.other_user_id}
                onClick={() => selectConversation(c.other_user_id)}
                style={{
                  padding: "12px 16px",
                  borderBottom: `1px solid ${colors.border}`,
                  cursor: "pointer",
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  backgroundColor: selectedUserId === c.other_user_id ? `${colors.primary}20` : "transparent",
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.card}40`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedUserId === c.other_user_id ? `${colors.primary}20` : "transparent"}
              >
                <div style={{ position: "relative" }}>
                  <div style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    backgroundColor: colors.card,
                    backgroundImage: getAvatar(c) ? `url(${getAvatar(c)})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px"
                  }}>
                    {!getAvatar(c) && "👤"}
                  </div>
                  <div style={{
                    position: "absolute",
                    bottom: "0",
                    right: "0",
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    backgroundColor: getStatusColor(c.other_user_profile?.online_status),
                    border: `2px solid ${colors.bg}`
                  }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <div style={{ fontWeight: c.unread_count > 0 ? "bold" : "600", fontSize: "16px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {getName(c)}
                    </div>
                    <div style={{ fontSize: "12px", color: colors.textMuted, marginLeft: "8px" }}>
                      {formatTime(c.last_message_time)}
                    </div>
                  </div>
                  <div style={{ fontSize: "14px", color: c.unread_count > 0 ? colors.text : colors.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.last_message_is_mine ? "Vous : " : ""}{c.last_message}
                  </div>
                </div>

                {c.unread_count > 0 && (
                  <div style={{
                    minWidth: "20px",
                    height: "20px",
                    backgroundColor: colors.primary,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: "bold",
                    marginLeft: "8px"
                  }}>
                    {c.unread_count > 99 ? "99+" : c.unread_count}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* COLONNE DROITE - Zone de chat */}
      <div style={{
        flex: 1,
        display: showMobileChat ? "flex" : "none",
        flexDirection: "column",
        overflow: "hidden"
      }} className="chat-area">

        {selectedUserId ? (
          <>
            {/* Header de la conversation */}
            <div style={{
              padding: "16px 24px",
              borderBottom: `1px solid ${colors.border}`,
              display: "flex",
              alignItems: "center",
              gap: "16px",
              backgroundColor: colors.bg
            }}>
              <button
                onClick={() => {
                  setShowMobileChat(false);
                  setSelectedUserId(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: colors.text,
                  fontSize: "24px",
                  cursor: "pointer",
                  display: "block"
                }}
                className="mobile-only"
              >
                ←
              </button>

              <div style={{ position: "relative" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: colors.card,
                  backgroundImage: selectedUser?.avatar_url ? `url(${selectedUser.avatar_url})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px"
                }}>
                  {!selectedUser?.avatar_url && "👤"}
                </div>
                <div style={{
                  position: "absolute",
                  bottom: "0",
                  right: "0",
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  backgroundColor: getStatusColor(selectedUser?.online_status),
                  border: `2px solid ${colors.bg}`
                }} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                  {selectedUser?.full_name || selectedUser?.username || "Utilisateur"}
                </div>
                <div style={{ fontSize: "13px", color: colors.textMuted }}>
                  {selectedUser?.online_status === 'online' ? "En ligne" : formatLastSeen(selectedUser?.last_seen)}
                </div>
              </div>
            </div>

            {/* Zone des messages */}
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: "24px",
              backgroundColor: `${colors.bg}`,
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: "center", color: colors.textMuted, padding: "40px" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>👋</div>
                  <p>Début de la conversation</p>
                  <p style={{ fontSize: "14px", marginTop: "8px" }}>Envoyez un message pour commencer</p>
                </div>
              ) : (
                messages.map((msg: any) => {
                  const isMine = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        justifyContent: isMine ? "flex-end" : "flex-start",
                        marginBottom: "8px"
                      }}
                    >
                      <div style={{
                        maxWidth: "70%",
                        padding: "12px 16px",
                        borderRadius: "18px",
                        backgroundColor: isMine ? colors.myMessage : colors.theirMessage,
                        color: "white",
                        position: "relative"
                      }}>
                        <div style={{ fontSize: "15px", lineHeight: "1.4", wordBreak: "break-word" }}>
                          {msg.content}
                        </div>
                        <div style={{
                          fontSize: "11px",
                          color: "rgba(255,255,255,0.7)",
                          marginTop: "4px",
                          textAlign: "right",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: "4px"
                        }}>
                          {formatTime(msg.created_at)}
                          {isMine && (
                            <span style={{ marginLeft: "4px" }}>
                              {msg.is_read ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Zone de saisie */}
            <div style={{
              padding: "16px 24px",
              borderTop: `1px solid ${colors.border}`,
              backgroundColor: colors.bg,
              display: "flex",
              gap: "12px",
              alignItems: "center"
            }}>
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Tapez votre message..."
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "999px",
                  color: colors.text,
                  fontSize: "15px",
                  outline: "none"
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: newMessage.trim() ? colors.primary : colors.border,
                  border: "none",
                  color: "white",
                  fontSize: "20px",
                  cursor: newMessage.trim() ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s"
                }}
              >
                ➤
              </button>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: colors.textMuted,
            textAlign: "center"
          }}>
            <div>
              <div style={{ fontSize: "80px", marginBottom: "24px" }}>💬</div>
              <h2 style={{ fontSize: "24px", marginBottom: "12px", color: colors.text }}>Vos messages</h2>
              <p style={{ fontSize: "16px" }}>Sélectionnez une conversation pour commencer à discuter</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (min-width: 769px) {
          .conversation-list {
            display: flex !important;
            width: 400px !important;
            max-width: 400px !important;
          }
          .chat-area {
            display: flex !important;
          }
          .mobile-only {
            display: none !important;
          }
        }

        @media (max-width: 768px) {
          .conversation-list {
            display: ${showMobileChat ? 'none' : 'flex'} !important;
            width: 100% !important;
          }
          .chat-area {
            display: ${showMobileChat ? 'flex' : 'none'} !important;
          }
        }
      `}</style>
    </div>
  );
}