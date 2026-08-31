"use client";

import { Suspense } from "react";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// ─── COMPOSANT CONTENU (utilise useSearchParams) ──────────
function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("to");

  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  
  // États pour la saisie et les fonctionnalités avancées
  const [inputText, setInputText] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);
  const [editingMsg, setEditingMsg] = useState<any>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // États pour l'enregistrement vocal (Web API)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colors = {
    bg: "#0A0A0A",
    card: "#1A1A1A",
    border: "#2A2A2A",
    primary: "#8B5CF6",
    text: "#FFFFFF",
    textMuted: "#9CA3AF",
    green: "#22C55E",
    red: "#EF4444",
  };

  // 1. Initialisation
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
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, []);

  // 2. Ouvrir le chat si ?to=... est dans l'URL
  useEffect(() => {
    if (user && targetUserId && !selectedUserId) {
      selectConversation(targetUserId);
    }
  }, [user, targetUserId]);

  // Scroll automatique
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- FONCTIONS DE BASE ---

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

  // --- ENVOI DE MESSAGE (TEXTE, RÉPONSE, MODIFICATION) ---

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

  // --- ENVOI D'IMAGE ---
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

  // --- ENREGISTREMENT VOCAL (WEB API) ---
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
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
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

  // --- ACTIONS SUR LES MESSAGES ---
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

  // --- APPELS (VOCAL & VIDÉO) ---
  const initiateCall = async (callType: "audio" | "video") => {
    try {
      const { data, error } = await supabase
        .from("calls")
        .insert({
          caller_id: user.id,
          receiver_id: selectedUserId,
          call_type: callType,
          status: "ongoing",
        })
        .select()
        .single();

      if (error) throw error;

      router.push(`/calls/${callType}?callId=${data.id}&otherId=${selectedUserId}&name=${encodeURIComponent(selectedUser.full_name || selectedUser.username)}`);
    } catch (error) {
      console.error("Erreur appel:", error);
      alert("Impossible de lancer l'appel pour le moment.");
    }
  };

  // --- HELPERS D'AFFICHAGE ---
  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

  const emojis = ["😀", "😂", "😍", "🥺", "😎", "👍", "🔥", "❤️", "😭", "🎉", "🤔", "👏"];

  // ==========================================
  // RENDU DE L'INTERFACE
  // ==========================================
  return (
    <div style={{ height: "100vh", backgroundColor: colors.bg, color: colors.text, display: "flex", overflow: "hidden" }}>
      
      {/* COLONNE GAUCHE : Liste des conversations */}
      <div style={{ width: "350px", borderRight: `1px solid ${colors.border}`, display: "flex", flexDirection: "column" }} className="hidden-mobile">
        <div style={{ padding: "20px", borderBottom: `1px solid ${colors.border}` }}>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>Messages</h1>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {conversations.map((c: any) => (
            <div
              key={c.other_user_id}
              onClick={() => selectConversation(c.other_user_id)}
              style={{
                padding: "16px", borderBottom: `1px solid ${colors.border}`, cursor: "pointer",
                backgroundColor: selectedUserId === c.other_user_id ? `${colors.primary}20` : "transparent",
                display: "flex", gap: "12px", alignItems: "center"
              }}
            >
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: colors.card, backgroundImage: c.other_user_profile?.avatar_url ? `url(${c.other_user_profile.avatar_url})` : undefined, backgroundSize: "cover" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", fontSize: "15px" }}>{c.other_user_profile?.full_name || c.other_user_profile?.username}</div>
                <div style={{ fontSize: "13px", color: colors.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.last_message_type === "voice" ? "🎤 Message vocal" : c.last_message}
                </div>
              </div>
              {c.unread_count > 0 && (
                <div style={{ backgroundColor: colors.primary, borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold" }}>
                  {c.unread_count}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* COLONNE DROITE : Zone de Chat Avancée */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: colors.bg }}>
        {selectedUserId && selectedUser ? (
          <>
            {/* 1. HEADER AVEC BOUTONS D'APPEL */}
            <div style={{ padding: "16px 24px", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: colors.card, backgroundImage: selectedUser.avatar_url ? `url(${selectedUser.avatar_url})` : undefined, backgroundSize: "cover" }} />
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "16px" }}>{selectedUser.full_name || selectedUser.username}</div>
                  <div style={{ fontSize: "12px", color: colors.green }}>En ligne</div>
                </div>
              </div>
              
              {/* 📞 BOUTONS D'APPEL */}
              <div style={{ display: "flex", gap: "16px" }}>
                <button onClick={() => initiateCall("audio")} style={{ background: "none", border: "none", color: colors.primary, fontSize: "24px", cursor: "pointer" }} title="Appel Vocal">📞</button>
                <button onClick={() => initiateCall("video")} style={{ background: "none", border: "none", color: colors.primary, fontSize: "24px", cursor: "pointer" }} title="Appel Vidéo">📹</button>
              </div>
            </div>

            {/* 2. LISTE DES MESSAGES */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {messages.map((msg: any) => {
                const isMine = msg.sender_id === user.id;
                return (
                  <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                    
                    {/* Contexte de réponse */}
                    {msg.reply_to_content && (
                      <div style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: "8px 12px", borderRadius: "12px 12px 0 0", fontSize: "12px", color: colors.textMuted, borderLeft: `3px solid ${colors.primary}`, marginBottom: "-8px", zIndex: 1 }}>
                        <div style={{ fontWeight: "bold", color: colors.primary }}>{msg.reply_to_name}</div>
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{msg.reply_to_content}</div>
                      </div>
                    )}

                    {/* Bulle de message */}
                    <div
                      onContextMenu={(e) => { e.preventDefault(); if(isMine) deleteMessage(msg.id); }}
                      style={{
                        backgroundColor: isMine ? colors.primary : colors.card,
                        color: "white", padding: "12px 16px", borderRadius: "18px",
                        borderBottomRightRadius: isMine ? "4px" : "18px",
                        borderBottomLeftRadius: isMine ? "18px" : "4px",
                        wordBreak: "break-word"
                      }}
                    >
                      {msg.type === "image" ? (
                        <img src={msg.content} alt="Image" style={{ maxWidth: "250px", borderRadius: "12px", cursor: "pointer" }} onClick={() => window.open(msg.content, "_blank")} />
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
                      {formatTime(msg.created_at)} {isMine && (msg.is_read ? "✓✓" : "✓")}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* 3. ZONE DE SAISIE AVANCÉE */}
            <div style={{ padding: "16px", borderTop: `1px solid ${colors.border}`, backgroundColor: colors.bg, position: "relative" }}>
              
              {/* Barre de réponse */}
              {replyTo && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.card, padding: "8px 12px", borderRadius: "8px", marginBottom: "8px", borderLeft: `3px solid ${colors.primary}` }}>
                  <div style={{ fontSize: "13px" }}>
                    <span style={{ fontWeight: "bold", color: colors.primary }}>Réponse à {replyTo.name} : </span>
                    <span style={{ color: colors.textMuted }}>{replyTo.content}</span>
                  </div>
                  <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer" }}>✕</button>
                </div>
              )}

              {/* Panneau Emoji */}
              {showEmoji && (
                <div style={{ position: "absolute", bottom: "80px", left: "16px", backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "12px", display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.5)", zIndex: 10 }}>
                  {emojis.map((emoji) => (
                    <button key={emoji} onClick={() => { setInputText(prev => prev + emoji); setShowEmoji(false); }} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer" }}>
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Barre d'enregistrement */}
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
                  {/* Input fichier caché pour les images */}
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
                      style={{ flex: 1, backgroundColor: "transparent", border: "none", color: colors.text, fontSize: "15px", outline: "none", resize: "none", maxHeight: "100px", padding: "8px 0" }}
                    />
                  </div>

                  {inputText.trim() ? (
                    <button onClick={handleSend} disabled={isSending} style={{ backgroundColor: colors.primary, border: "none", borderRadius: "50%", width: "48px", height: "48px", color: "white", fontSize: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isSending ? "..." : "➤"}
                    </button>
                  ) : (
                    <button onClick={startRecording} style={{ backgroundColor: colors.primary, border: "none", borderRadius: "50%", width: "48px", height: "48px", color: "white", fontSize: "24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
              <h2>Sélectionnez une conversation</h2>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── EXPORT PAR DÉFAUT AVEC SUSPENSE ──────────────────────
export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0A0A0A", color: "#FFFFFF" }}>
        Chargement des messages...
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}