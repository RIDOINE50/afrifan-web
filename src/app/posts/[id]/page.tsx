"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  ArrowLeft, 
  Eye, 
  Heart, 
  MessageCircle, 
  TrendingUp, 
  Play, 
  Image as ImageIcon,
  User
} from "lucide-react";

export default function PostStatsPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<any>(null);
  const [creator, setCreator] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (postId) {
      loadPostStats();
    }
  }, [postId]);

  const loadPostStats = async () => {
    setIsLoading(true);
    try {
      // 1. Récupérer les données du post
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (postError || !postData) throw new Error("Post introuvable");
      setPost(postData);

      // 2. Récupérer les infos du créateur (pour l'affichage)
      if (postData.user_id) {
        const { data: creatorData } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .eq("id", postData.user_id)
          .single();
        setCreator(creatorData);
      }

      // 3. Calculer les statistiques
      const views = postData.views_count || 0;
      const likes = postData.likes_count || 0;
      const comments = postData.comments_count || 0;
      const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;

      setStats({ views, likes, comments, engagementRate });
    } catch (error) {
      console.error("❌ Erreur chargement stats post:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ LOGIQUE SIMPLIFIÉE : Cette page est privée, c'est toujours MON profil.
  const handleCreatorClick = () => {
    router.push("/profile");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Inconnue";
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "Inconnue";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-800 border-t-[#8B5CF6] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">
        <p>Post introuvable</p>
      </div>
    );
  }

  const mediaUrl = post.media_url;
  const caption = post.content || post.caption || "";
  const createdAt = post.created_at;
  const creatorName = creator?.full_name || creator?.username || "Utilisateur";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      {/* 1. HEADER */}
      <div className="flex items-center gap-4 p-4 border-b border-white/10 sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-sm z-10">
        <button 
          onClick={() => router.back()} 
          className="p-2 hover:bg-white/10 rounded-full transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">Statistiques du post</h1>
      </div>

      {/* 2. CONTENU SCROLLABLE */}
      <div className="flex-1 overflow-y-auto p-5 space-y-8 max-w-2xl mx-auto w-full">
        
        {/* APERÇU DU POST AVEC INFOS CRÉATEUR */}
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0 border border-white/10">
            {mediaUrl ? (
              <img 
                src={mediaUrl} 
                alt="Post" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : null}
            <div className={`w-full h-full flex items-center justify-center ${mediaUrl ? "hidden" : ""}`}>
              <ImageIcon className="w-8 h-8 text-gray-500" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            {/* ✅ NOM DU CRÉATEUR CLIQUABLE : Renvoie TOUJOURS à /profile */}
            <div 
              onClick={handleCreatorClick}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition mb-1"
            >
              <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden">
                {creator?.avatar_url ? (
                  <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-full h-full p-1 text-gray-400" />
                )}
              </div>
              <span className="text-sm font-bold text-[#8B5CF6] truncate">
                {creatorName}
              </span>
            </div>

            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-1">
              {caption || "(Pas de légende)"}
            </p>
            <p className="text-[10px] text-gray-500">
              Publié le {formatDate(createdAt)}
            </p>
          </div>
        </div>

        {/* GRANDES CARTES DE MÉTRIQUES */}
        <div>
          <h2 className="text-lg font-bold mb-4">Performance</h2>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard title="Vues" value={stats.views.toLocaleString("fr-FR")} icon={<Eye className="w-6 h-6 text-blue-500" />} />
            <MetricCard title="Likes" value={stats.likes.toLocaleString("fr-FR")} icon={<Heart className="w-6 h-6 text-red-500" />} />
            <MetricCard title="Commentaires" value={stats.comments.toLocaleString("fr-FR")} icon={<MessageCircle className="w-6 h-6 text-orange-500" />} />
            <MetricCard title="Engagement" value={`${stats.engagementRate.toFixed(1)}%`} icon={<TrendingUp className="w-6 h-6 text-green-500" />} />
          </div>
        </div>

        {/* SOURCES DE TRAFIC */}
        <div>
          <h2 className="text-lg font-bold mb-4">D'où viennent vos vues ?</h2>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 space-y-5 border border-white/5">
            <TrafficBar label="Pour toi (Découverte)" percentage={0.65} color="bg-[#8B5CF6]" />
            <TrafficBar label="Abonnés" percentage={0.25} color="bg-blue-500" />
            <TrafficBar label="Profil & Partages" percentage={0.10} color="bg-gray-500" />
          </div>
        </div>

        {/* BOUTON D'ACTION */}
        <button
          onClick={() => router.push(`/post/${postId}`)}
          className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Play className="w-5 h-5 fill-current" />
          Voir le post
        </button>
        
        <div className="h-8"></div>
      </div>
    </div>
  );
}

// --- COMPOSANTS UTILITAIRES ---

function MetricCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 flex flex-col gap-3 hover:bg-[#222222] transition-colors">
      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{title}</p>
      </div>
    </div>
  );
}

function TrafficBar({ label, percentage, color }: { label: string; percentage: number; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-300">{label}</span>
        <span className="font-bold text-white">{Math.round(percentage * 100)}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${percentage * 100}%` }}
        />
      </div>
    </div>
  );
}