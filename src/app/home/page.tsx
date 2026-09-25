"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { downloadForOffline } from "@/lib/offlineManager";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@chakra-ui/react";
import { FaPlay, FaPause } from "react-icons/fa";

import TipDialog from "@/components/TipDialog";
import { useAppTheme } from "@/contexts/ThemeContext";

import {
  Box,
  Flex,
  Text,
  Image,
  Button,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  VStack,
  HStack,
  Avatar,
  Spinner,
  Center,
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
} from "@chakra-ui/react";

interface CreatorProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  followers_count?: number;
  premium_price?: number;
  pro_price?: number;
  role?: string; // ✅ Ajouté pour la logique du cadenas
}

interface Post {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  content: string;
  background_color?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  is_premium?: boolean;
  profiles: CreatorProfile;
}

interface CommentData {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: { id: string; username: string; avatar_url: string | null; is_verified: boolean };
}

interface HashtagCount {
  count: number;
  image: string | null;
}

function formatCount(num: number | null | undefined): string {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.', ',') + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace('.', ',') + "K";
  return num.toString();
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}j`;
}

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const HeartIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? "#EC4899" : "none"} stroke={filled ? "#EC4899" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CommentIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const ShareIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const MoneyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
);

const MoreIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1.5" fill="white" />
    <circle cx="12" cy="12" r="1.5" fill="white" />
    <circle cx="12" cy="19" r="1.5" fill="white" />
  </svg>
);

const LockIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const VolumeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

const VolumeOnIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

const CrownIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20h20M4 17l2-10 4 5 2-7 2 7 4-5 2 10" />
  </svg>
);

const FlagIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

function ReportModal({ isOpen, onClose, postId }: { isOpen: boolean; onClose: () => void; postId: string }) {
  const toast = useToast();
  const { theme } = useAppTheme();
  const [selectedReason, setSelectedReason] = useState("");

  const handleReport = async () => {
    if (!selectedReason) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await supabase.from('reports').insert({ post_id: postId, reporter_id: session.user.id, reason: selectedReason });
      toast({ title: "✅ Signalement envoyé", status: "success", duration: 3000 });
      onClose();
    } catch (error) {
      console.error("Erreur signalement:", error);
      toast({ title: "Erreur lors du signalement", status: "error" });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg={theme.card} color={theme.text} maxW="400px" borderRadius="16px">
        <ModalHeader>Signaler ce post</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing="2" align="stretch">
            {["Spam", "Violence", "Harcèlement", "Droits d'auteur", "Autre"].map(reason => (
              <Button
                key={reason}
                justifyContent="flex-start"
                bg={selectedReason === reason ? theme.primary : theme.bg}
                color={selectedReason === reason ? theme.primaryText : theme.text}
                border={`1px solid ${theme.border}`}
                _hover={{ opacity: 0.9 }}
                onClick={() => setSelectedReason(reason)}
              >
                {reason}
              </Button>
            ))}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <VStack w="100%" spacing="2">
            <Button w="100%" bg={theme.primary} color={theme.primaryText} _hover={{ opacity: 0.9 }} onClick={handleReport} isDisabled={!selectedReason}>Envoyer</Button>
            <Button w="100%" variant="ghost" onClick={onClose}>Annuler</Button>
          </VStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default function HomePage() {
  const router = useRouter();
  const toast = useToast();
  const { isDark, theme } = useAppTheme();

  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [stories, setStories] = useState<any[]>([]);
  const [recommendedCreators, setRecommendedCreators] = useState<CreatorProfile[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<any[]>([]);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState("");
  const [currentPostId, setCurrentPostId] = useState<string>("");

  const [heartAnimation, setHeartAnimation] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"foryou" | "following">("foryou");

  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  const { isOpen: isTipOpen, onOpen: onTipOpen, onClose: onTipClose } = useDisclosure();
  const [tipCreator, setTipCreator] = useState({ id: "", name: "" });

  const { isOpen: isReportOpen, onOpen: onReportOpen, onClose: onReportClose } = useDisclosure();
  const [reportPostId, setReportPostId] = useState<string>("");

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [followedCreatorIds, setFollowedCreatorIds] = useState<Set<string>>(new Set());
  const [subscribedCreatorIds, setSubscribedCreatorIds] = useState<Set<string>>(new Set());

  const [videoStates, setVideoStates] = useState<Record<string, { isPlaying: boolean; currentTime: number; duration: number }>>({});

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const updateVideoState = (postId: string, updates: Partial<{ isPlaying: boolean; currentTime: number; duration: number }>) => {
    setVideoStates(prev => ({
      ...prev,
      [postId]: { ...prev[postId], ...updates }
    }));
  };

  const handleExpandAndScroll = (postId: string) => {
    setExpandedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });

    setTimeout(() => {
      if (window.innerWidth < 768) {
        const postElement = document.getElementById(`post-${postId}`);
        if (postElement) {
          postElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      if (!containerRef.current) return;
      const containerHeight = containerRef.current.clientHeight;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        containerRef.current.scrollBy({ top: containerHeight, behavior: 'smooth' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        containerRef.current.scrollBy({ top: -containerHeight, behavior: 'smooth' });
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
    };
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { 
        router.push("/login"); 
        return; 
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_banned')
        .eq('id', session.user.id)
        .single();

      if (profile?.is_banned === true) {
        await supabase.auth.signOut();
        router.push("/login?error=banned");
        return;
      }

      setUser(session.user);
      await Promise.all([fetchData(session.user.id), fetchStories(), fetchRecommendedCreators(), fetchTrendingHashtags()]);
    };
    init();
  }, [router]);

  const fetchStories = async () => {
    const { data } = await supabase.from('stories').select(`id, creator_id, media_url, media_type, profiles:user_id (id, username, avatar_url, is_verified)`).order('created_at', { ascending: false }).limit(10);
    if (data) setStories(data);
  };

  const fetchRecommendedCreators = async () => {
    const { data } = await supabase.from('profiles').select('id, username, full_name, avatar_url, is_verified, followers_count').eq('role', 'creator').order('followers_count', { ascending: false }).limit(5);
    if (data) setRecommendedCreators(data);
  };

  const fetchTrendingHashtags = async () => {
    const { data } = await supabase.from('posts').select('content, media_url').order('created_at', { ascending: false }).limit(30);
    if (!data) return;
    const hashtagCount: Record<string, HashtagCount> = {};
    data.forEach((post: any) => {
      if (post.content) {
        const hashtags = post.content.match(/#\w+/g) || [];
        hashtags.forEach((tag: string) => {
          const cleanTag = tag.toLowerCase();
          if (!hashtagCount[cleanTag]) hashtagCount[cleanTag] = { count: 0, image: post.media_url };
          hashtagCount[cleanTag].count++;
        });
      }
    });
    const trending = Object.entries(hashtagCount)
      .map(([tag, data]: [string, HashtagCount]) => ({
        tag: tag.replace('#', ''),
        count: data.count,
        image: data.image
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    setTrendingHashtags(trending);
  };

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data: followsData } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
      setFollowedCreatorIds(new Set(followsData?.map((f: any) => f.following_id) || []));
      const { data: subsData } = await supabase.from('subscriptions').select('creator_id').eq('fan_id', userId).eq('status', 'active');
      setSubscribedCreatorIds(new Set(subsData?.map((s: any) => s.creator_id) || []));

      const { data: postsData } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(20);
      if (!postsData || postsData.length === 0) { setPosts([]); setFilteredPosts([]); setIsLoading(false); return; }

      const userIds = [...new Set(postsData.map((p: any) => p.user_id))];
      
      const [profilesData, likesData] = await Promise.all([
        supabase
          .from('profiles')
          // ✅ AJOUT DE 'role' ICI
          .select('id, username, full_name, avatar_url, is_verified, role, premium_price, pro_price')
          .in('id', userIds),
        supabase
          .from('post_likes')
          .select('post_id')
          .in('post_id', postsData.map(p => p.id))
          .eq('user_id', userId)
      ]);

      const profilesMap: Record<string, CreatorProfile> = {};
      profilesData?.data?.forEach((p: any) => { profilesMap[p.id] = p; });
      setLikedPostIds(new Set(likesData?.data?.map((l: any) => l.post_id) || []));

      const mergedPosts = postsData.map(post => {
        // ✅ AJOUT DE 'role: user' PAR DÉFAUT
        const profile = profilesMap[post.user_id] || { id: post.user_id, username: 'User', full_name: 'User', avatar_url: null, is_verified: false, role: 'user', premium_price: 0, pro_price: 0 };
        return { ...post, profiles: profile };
      });
      
      setPosts(mergedPosts);
      setFilteredPosts(activeTab === "following" ? mergedPosts.filter(post => followedCreatorIds.has(post.user_id)) : mergedPosts);
    } catch (error) { console.error(" Erreur:", error); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    setFilteredPosts(activeTab === "following" ? posts.filter(post => followedCreatorIds.has(post.user_id)) : posts);
  }, [activeTab, posts, followedCreatorIds]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.6 });

    const currentVideos = Object.values(videoRefs.current);
    currentVideos.forEach(video => {
      if (video) observerRef.current?.observe(video);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [filteredPosts]);

  const handleLike = async (postId: string) => {
    if (!user) return;
    const isLiked = likedPostIds.has(postId);
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const newCount = isLiked ? Math.max(0, post.likes_count - 1) : post.likes_count + 1;

    setLikedPostIds(prev => { const next = new Set(prev); isLiked ? next.delete(postId) : next.add(postId); return next; });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: newCount } : p));

    try {
      if (isLiked) {
        await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      } else {
        await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
      }
      await supabase.from('posts').update({ likes_count: newCount }).eq('id', postId);
    } catch (error) {
      console.error("Erreur like:", error);
      setLikedPostIds(prev => { const next = new Set(prev); isLiked ? next.add(postId) : next.delete(postId); return next; });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: post.likes_count } : p));
      toast({ title: "Erreur de connexion", description: "Impossible de mettre à jour le like", status: "error" });
    }
  };

  const handleDoubleTap = (postId: string) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!likedPostIds.has(postId)) handleLike(postId);
      setHeartAnimation(postId);
      setTimeout(() => setHeartAnimation(null), 800);
    }
    lastTapRef.current = now;
  };

  const handleFollow = async (creatorId: string) => {
    if (!user) return;
    const isFollowed = followedCreatorIds.has(creatorId);

    setFollowedCreatorIds(prev => { const next = new Set(prev); isFollowed ? next.delete(creatorId) : next.add(creatorId); return next; });

    try {
      if (isFollowed) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', creatorId);
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: creatorId });
      }
    } catch (error) {
      console.error("Erreur follow:", error);
      setFollowedCreatorIds(prev => { const next = new Set(prev); isFollowed ? next.add(creatorId) : next.delete(creatorId); return next; });
      toast({ title: "Erreur de connexion", description: "Impossible de suivre ce créateur", status: "error" });
    }
  };

  const fetchComments = async (postId: string) => {
    const { data } = await supabase.from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: false });
    if (!data) { setComments([]); return; }
    const userIds = [...new Set(data.map((c: any) => c.user_id))];
    const { data: profilesData } = await supabase.from('profiles').select('id, username, avatar_url, is_verified').in('id', userIds);
    const profilesMap: Record<string, any> = {};
    profilesData?.forEach((p: any) => { profilesMap[p.id] = p; });
    setComments(data.map(c => ({ ...c, profiles: profilesMap[c.user_id] || { id: c.user_id, username: 'User', avatar_url: null, is_verified: false } })));
  };

  const submitComment = async () => {
    const trimmedComment = newComment.trim();
    if (!trimmedComment || !user) return;
    
    if (trimmedComment.length > 500) {
      toast({ title: "Commentaire trop long", description: "Maximum 500 caractères", status: "warning" });
      return;
    }

    try {
      await supabase.from('comments').insert({ 
        post_id: currentPostId, 
        user_id: user.id, 
        content: trimmedComment 
      });
      const post = posts.find(p => p.id === currentPostId);
      if (post) {
        const newCount = post.comments_count + 1;
        await supabase.from('posts').update({ comments_count: newCount }).eq('id', currentPostId);
        setPosts(prev => prev.map(p => p.id === currentPostId ? { ...p, comments_count: newCount } : p));
      }
      setNewComment("");
      fetchComments(currentPostId);
    } catch (error) { 
      console.error("Erreur commentaire:", error);
      toast({ title: "Erreur", description: "Impossible d'ajouter le commentaire", status: "error" });
    }
  };

  const handleDownload = async (post: Post) => {
    if (!post.media_url) return;
    setDownloadingId(post.id);
    try {
      const success = await downloadForOffline(post.id, post.media_url, post);
      toast({
        title: success ? "✅ Sauvegardé !" : " Échec",
        description: success ? "Disponible dans 'Mes Téléchargements'" : "Vérifiez votre connexion",
        status: success ? "success" : "error",
        duration: 3000
      });
    } catch (error) {
      toast({ title: "❌ Erreur", status: "error", duration: 3000 });
    } finally {
      setDownloadingId(null);
    }
  };

  if (!user || isLoading) return (
    <DashboardLayout>
      <Center h="100dvh" bg={theme.bg}>
        <Spinner thickness="4px" speed="0.65s" emptyColor={theme.border} color={theme.primary} size="xl" />
      </Center>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <Flex h="100dvh" bg={theme.bg} color="white" overflow="hidden" direction={{ base: "column", lg: "row" }}>

        <Box
          flex="1"
          h="100dvh"
          overflowY="auto"
          css={{ scrollSnapType: "y mandatory" }}
          ref={containerRef}
          sx={{ '&::-webkit-scrollbar': { display: 'none' } }}
          maxW={{ base: "100%", lg: "680px" }}
          mx="auto"
          px={{ base: 0, lg: 4 }}
          tabIndex={-1}
        >
          {filteredPosts.map((post) => {
            const creator = post.profiles;
            const isLiked = likedPostIds.has(post.id);
            const isFollowed = followedCreatorIds.has(post.user_id);
            
            // ✅ LOGIQUE EXACTE DU FLUTTER POUR LE CADENAS :
            const creatorId = post.user_id;
            const isMyOwnPost = user?.id === creatorId;
            const creatorRole = creator?.role || 'user';
            const isCreator = creatorRole === 'creator';
            const isLocked = isCreator && !isMyOwnPost && !subscribedCreatorIds.has(creatorId);
            
            const showHeart = heartAnimation === post.id;
            const videoState = videoStates[post.id] || { isPlaying: false, currentTime: 0, duration: 0 };

            return (
              <Box
                id={`post-${post.id}`}
                key={post.id}
                h="100dvh"
                w="100%"
                css={{ scrollSnapAlign: "start" }}
                position="relative"
                onDoubleClick={() => handleDoubleTap(post.id)}
              >
                <Flex position="absolute" top="0" left="0" right="0" zIndex="10" p="4" justifyContent="space-between" alignItems="center" bgGradient="linear(to-b, blackAlpha.600, transparent)">
                  <HStack spacing="3">
                    <Avatar
                      size="sm"
                      name={creator.username}
                      src={creator.avatar_url || ''}
                      border={`2px solid ${theme.primary}`}
                      cursor="pointer"
                      onClick={() => router.push(`/createur?id=${creator.id}`)}
                    />
                    <Box cursor="pointer" onClick={() => router.push(`/createur?id=${creator.id}`)}>
                      <Text fontWeight="bold" fontSize="sm">{creator.full_name || creator.username} {creator.is_verified && <Text as="span" color="#10B981">✓</Text>}</Text>
                      <Text fontSize="xs" color="gray.400">{timeAgo(post.created_at)}</Text>
                    </Box>
                  </HStack>
                  {!isFollowed && user.id !== post.user_id && (
                    <Button size="xs" bg={theme.primary} color={theme.primaryText} _hover={{ opacity: 0.9 }} onClick={() => handleFollow(post.user_id)}>Suivre</Button>
                  )}
                </Flex>

                {post.media_type === 'text' ? (
                  <Box
                    w="100%"
                    h="100%"
                    bg={post.background_color || theme.card}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    p={8}
                    cursor={isLocked ? "pointer" : "default"}
                    onClick={isLocked ? () => router.push(`/subscribe/${post.user_id}?tier=premium&price=${creator.premium_price || 0}&name=${encodeURIComponent(creator.full_name || creator.username)}`) : undefined}
                  >
                    <Text
                      color="white"
                      fontSize={{ base: "2xl", md: "3xl" }}
                      fontWeight="bold"
                      textAlign="center"
                      lineHeight="1.4"
                      wordBreak="break-word"
                      filter={isLocked ? "blur(25px)" : "none"}
                    >
                      {post.content || "..."}
                    </Text>
                  </Box>
                ) : post.media_type === 'video' ? (
                  <Box flex="1" position="relative" display="flex" alignItems="center" justifyContent="center" bg="black" h="100%" pb="110px">
                    <video
                      ref={el => { if (el) videoRefs.current[post.id] = el; }}
                      src={post.media_url}
                      loop
                      muted={isMuted}
                      playsInline
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", filter: isLocked ? "blur(25px)" : "none" }}
                      onPlay={() => updateVideoState(post.id, { isPlaying: true })}
                      onPause={() => updateVideoState(post.id, { isPlaying: false })}
                      onLoadedMetadata={(e) => {
                        const video = e.target as HTMLVideoElement;
                        updateVideoState(post.id, { duration: video.duration, currentTime: video.currentTime });
                      }}
                      onTimeUpdate={(e) => {
                        const video = e.target as HTMLVideoElement;
                        updateVideoState(post.id, { currentTime: video.currentTime });
                      }}
                    />

                    {!isLocked && (
                      <Box
                        className="video-controls-zone"
                        position="absolute"
                        bottom="0"
                        left="0"
                        right="0"
                        px={4}
                        pb={4}
                        pt={12}
                        bgGradient="linear(to-t, blackAlpha.800, transparent)"
                        zIndex="20"
                        pointerEvents="none"
                        onClick={(e) => e.stopPropagation()}
                        onWheel={(e) => {
                          if (containerRef.current) {
                            containerRef.current.scrollTop += e.deltaY;
                          }
                          e.stopPropagation();
                        }}
                      >
                        <HStack spacing={4} mb={2}>
                          <Button
                            size="sm"
                            variant="ghost"
                            color="white"
                            p={0}
                            w="30px"
                            h="30px"
                            pointerEvents="auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              const video = videoRefs.current[post.id];
                              if (video) {
                                if (video.paused) { video.play(); } else { video.pause(); }
                              }
                            }}
                          >
                            {videoState.isPlaying ? <FaPause size={16} /> : <FaPlay size={16} />}
                          </Button>
                          <Text fontSize="xs" color="white" fontWeight="bold">
                            {formatTime(videoState.currentTime)} / {formatTime(videoState.duration)}
                          </Text>
                        </HStack>

                        <Slider
                          value={videoState.duration ? ((videoState.currentTime / videoState.duration) * 100) : 0}
                          onChange={(val) => {
                            const video = videoRefs.current[post.id];
                            if (video && video.duration) {
                              video.currentTime = (val / 100) * video.duration;
                              updateVideoState(post.id, { currentTime: video.currentTime });
                            }
                          }}
                          h="4px"
                          pointerEvents="auto"
                          focusThumbOnChange={false}
                        >
                          <SliderTrack h="4px" borderRadius="full" bg="whiteAlpha.300">
                            <SliderFilledTrack h="4px" borderRadius="full" bg="white" />
                          </SliderTrack>
                          <SliderThumb boxSize={3} borderRadius="full" bg="white" border="none" tabIndex={-1} />
                        </Slider>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box flex="1" position="relative" display="flex" alignItems="center" justifyContent="center" bg="black" h="100%" pb="110px">
                    <Image
                      src={post.media_url}
                      alt="Post"
                      maxW="100%"
                      maxH="100%"
                      objectFit="contain"
                      filter={isLocked ? "blur(25px)" : "none"}
                    />
                  </Box>
                )}

                {isLocked && (
                  <Center position="absolute" inset="0" bg="blackAlpha.800" flexDirection="column" zIndex="20" cursor="pointer" onClick={() => router.push(`/subscribe/${post.user_id}?tier=premium&price=${creator.premium_price || 0}&name=${encodeURIComponent(creator.full_name || creator.username)}`)}>
                    <Box mb="3"><LockIcon /></Box>
                    <Text fontWeight="bold" textAlign="center" px={4}>
                      Contenu réservé aux abonnés
                      <Text as="span" display="block" fontSize="sm" color="gray.300" mt={2}>Cliquez pour vous abonner</Text>
                    </Text>
                  </Center>
                )}

                {showHeart && (
                  <Text position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" fontSize="120px" animation="heartPop 0.8s ease-out forwards" pointerEvents="none" zIndex="100">❤️</Text>
                )}

                <Button position="absolute" top="20" left="4" bg="blackAlpha.50" borderRadius="full" w="40px" h="40px" onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} _hover={{ bg: "blackAlpha.700" }} display="flex" alignItems="center" justifyContent="center" zIndex="30">
                  {isMuted ? <VolumeOffIcon /> : <VolumeOnIcon />}
                </Button>

                <VStack position="absolute" right={{ base: "2", md: "3" }} bottom={{ base: "28", md: "24" }} spacing="4" zIndex="30">
                  <Flex direction="column" align="center" cursor="pointer" onClick={() => handleLike(post.id)}>
                    <Box w="48px" h="48px" borderRadius="full" bg={isLiked ? "pink.500/40" : "whiteAlpha.200"} backdropFilter="blur(10px)" display="flex" alignItems="center" justifyContent="center" _hover={{ transform: "scale(1.1)", transition: "0.2s" }}>
                      <HeartIcon filled={isLiked} />
                    </Box>
                    <Text fontSize="xs" fontWeight="bold" textShadow="0 1px 2px black" mt="1">{formatCount(post.likes_count)}</Text>
                  </Flex>

                  <Flex direction="column" align="center" cursor="pointer" onClick={(e) => { e.stopPropagation(); setCurrentPostId(post.id); setShowComments(true); fetchComments(post.id); }}>
                    <Box w="48px" h="48px" borderRadius="full" bg="whiteAlpha.200" backdropFilter="blur(10px)" display="flex" alignItems="center" justifyContent="center" _hover={{ transform: "scale(1.1)", transition: "0.2s" }}>
                      <CommentIcon />
                    </Box>
                    <Text fontSize="xs" fontWeight="bold" textShadow="0 1px 2px black" mt="1">{formatCount(post.comments_count)}</Text>
                  </Flex>

                 

                

                  <Menu>
                    <MenuButton>
                      <Flex direction="column" align="center">
                        <Box w="48px" h="48px" borderRadius="full" bg="whiteAlpha.200" backdropFilter="blur(10px)" display="flex" alignItems="center" justifyContent="center" _hover={{ transform: "scale(1.1)", transition: "0.2s" }}>
                          <MoreIcon />
                        </Box>
                      </Flex>
                    </MenuButton>
                    <MenuList bg={theme.card} border={`1px solid ${theme.border}`} color={theme.text}>
                      <MenuItem onClick={(e) => { e.stopPropagation(); handleDownload(post); }} bg={theme.card} _hover={{ bg: theme.cardHover }} icon={<Text>⬇️</Text>}>Télécharger</MenuItem>
                      <MenuItem onClick={(e) => { e.stopPropagation(); setReportPostId(post.id); onReportOpen(); }} bg={theme.card} _hover={{ bg: theme.cardHover }} color="red.400" icon={<FlagIcon />}>Signaler</MenuItem>
                    </MenuList>
                  </Menu>
                </VStack>

                {post.media_type !== 'text' && post.content && (
                  <Box position="absolute" bottom="0" left="0" right="0" p="4" bgGradient="linear(to-t, blackAlpha.900, transparent)" zIndex="10" onClick={(e) => e.stopPropagation()}>
                    <Text 
                      fontSize="sm" 
                      lineHeight="1.4" 
                      mb="1" 
                      wordBreak="break-word" 
                      noOfLines={expandedPosts.has(post.id) ? undefined : 3}
                    >
                      {post.content}
                    </Text>
                    {post.content.length > 120 && (
                      <Text 
                        fontSize="xs" 
                        color="gray.300" 
                        fontWeight="semibold" 
                        cursor="pointer"
                        onClick={(e) => { e.stopPropagation(); handleExpandAndScroll(post.id); }}
                        mt={1}
                      >
                        {expandedPosts.has(post.id) ? "Voir moins" : "Voir plus"}
                      </Text>
                    )}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>

        <Box
          w={{ base: "0", lg: "350px" }}
          display={{ base: "none", lg: "block" }}
          borderLeft={`1px solid ${theme.border}`}
          p="4"
          overflowY="auto"
          color={theme.text}
        >
          <VStack spacing="4" align="stretch">
            <Box bg={theme.card} borderRadius="12px" p="4">
              <Text fontWeight="bold" mb="3">Recommandé</Text>
              {recommendedCreators.map(creator => {
                const isFollowed = followedCreatorIds.has(creator.id);
                return (
                  <HStack
                    key={creator.id}
                    mb="3"
                    spacing="3"
                    cursor="pointer"
                    onClick={() => router.push(`/createur?id=${creator.id}`)}
                    _hover={{ bg: theme.hover }}
                    borderRadius="8px"
                    p="2"
                  >
                    <Avatar size="sm" name={creator.username} src={creator.avatar_url || ''} />
                    <Box flex="1">
                      <Text fontWeight="bold" fontSize="sm">{creator.full_name || creator.username} {creator.is_verified && "✓"}</Text>
                      <Text fontSize="xs" color={theme.textMuted}>{formatCount(creator.followers_count)} abonnés</Text>
                    </Box>
                    <Button
                      size="xs"
                      bg={isFollowed ? theme.border : theme.primary}
                      color={isFollowed ? theme.textMuted : theme.primaryText}
                      _hover={{ opacity: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); handleFollow(creator.id); }}
                    >
                      {isFollowed ? "Suivi" : "Suivre"}
                    </Button>
                  </HStack>
                );
              })}
            </Box>

            <Box bg={theme.card} borderRadius="12px" p="4">
              <Text fontWeight="bold" mb="3"> Tendances</Text>
              {trendingHashtags.map((trend, i) => (
                <Flex key={i} justifyContent="space-between" py="2" borderBottom={`1px solid ${theme.border}`} _last={{ borderBottom: "none" }}>
                  <Text fontWeight="bold" fontSize="sm">#{trend.tag}</Text>
                  <Text fontSize="xs" color={theme.textMuted}>{formatCount(trend.count)} vues</Text>
                </Flex>
              ))}
            </Box>

            <Box bg={theme.card} border={`1px solid ${theme.border}`} borderRadius="12px" p="5" textAlign="center">
              <Box display="flex" justifyContent="center" mb="3"><CrownIcon /></Box>
              <Text fontWeight="bold" mb="2">Gagne de l'argent</Text>
              <Text fontSize="sm" color={theme.textMuted} mb="4">Deviens créateur sur Afrifan</Text>
              <Button w="100%" bg={theme.primary} color={theme.primaryText} _hover={{ opacity: 0.9 }} onClick={() => router.push('/creator-info')}>
                En savoir plus →
              </Button>
            </Box>
          </VStack>
        </Box>
      </Flex>

      {isTipOpen && (
        <TipDialog
          creatorId={tipCreator.id}
          creatorName={tipCreator.name}
          onClose={onTipClose}
        />
      )}
      <ReportModal isOpen={isReportOpen} onClose={onReportClose} postId={reportPostId} />

      <Modal isOpen={showComments} onClose={() => setShowComments(false)} size={{ base: "full", md: "md" }}>
        <ModalOverlay bg="blackAlpha.700" />
        <ModalContent 
          bg={theme.card} 
          color={theme.text} 
          borderRadius={{ base: "20px 20px 0 0", md: "16px" }} 
          h={{ base: "100dvh", md: "70vh" }} 
          maxH={{ base: "100dvh", md: "70vh" }} 
          m={{ base: "0", md: "auto" }}
          display="flex"
          flexDirection="column"
        >
          <ModalHeader display="flex" justifyContent="space-between" alignItems="center">
            Commentaires ({comments.length})
            <ModalCloseButton position="static" />
          </ModalHeader>
          
          <ModalBody overflowY="auto" flex="1" pb="24" mb="60px">
            {comments.length === 0 ? (
              <Center h="100px" color={theme.textMuted}>Aucun commentaire</Center>
            ) : (
              <VStack align="stretch" spacing="4">
                {comments.map(comment => (
                  <HStack key={comment.id} align="start" spacing="3">
                    <Avatar 
                      size="sm" 
                      name={comment.profiles?.username} 
                      src={comment.profiles?.avatar_url || ''}
                      cursor="pointer"
                      onClick={() => router.push(`/createur?id=${comment.user_id}`)}
                    />
                    <Box 
                      cursor="pointer" 
                      onClick={() => router.push(`/createur?id=${comment.user_id}`)}
                      _hover={{ opacity: 0.8 }}
                    >
                      <Text fontWeight="bold" fontSize="sm">{comment.profiles?.username || 'User'}</Text>
                      <Text fontSize="sm" color={theme.textMuted}>{comment.content}</Text>
                    </Box>
                  </HStack>
                ))}
              </VStack>
            )}
          </ModalBody>

          <ModalFooter 
            borderTop={`1px solid ${theme.border}`}
            position="fixed"
            bottom="60px"
            left="0"
            right="0"
            bg={theme.card}
            zIndex="100"
            px="4"
            py="2"
          >
            <HStack w="100%">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                bg={theme.bg}
                border={`1px solid ${theme.border}`}
                color={theme.text}
                _placeholder={{ color: theme.textMuted }}
                maxLength={500}
                onKeyDown={(e) => e.key === 'Enter' && submitComment()}
              />
              <Button bg={theme.primary} color={theme.primaryText} _hover={{ opacity: 0.9 }} onClick={submitComment} isDisabled={!newComment.trim()}>↑</Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <style>{`
        @keyframes heartPop { 0% { transform: translate(-50%, -50%) scale(0); opacity: 0; } 50% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1); opacity: 0; } }
      `}</style>
    </DashboardLayout>
  );
}