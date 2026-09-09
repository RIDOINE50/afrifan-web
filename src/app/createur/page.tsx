"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import TipDialog from "@/components/TipDialog";
import {
  Box,
  Flex,
  Text,
  Button,
  Avatar,
  Spinner,
  Center,
  VStack,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  SimpleGrid,
  Badge,
  Icon,
} from "@chakra-ui/react";
import { FaVideo, FaImage, FaFileAlt, FaStore } from "react-icons/fa";

function formatCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count >= 1000) return (count / 1000).toFixed(1) + "K";
  return count.toString();
}

function CreatorProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const creatorId = searchParams.get('id');

  const [user, setUser] = useState<any>(null);
  const [creator, setCreator] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [hasActiveStories, setHasActiveStories] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);
  
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [showTipModal, setShowTipModal] = useState(false);

  // ✅ NOUVEAU : États pour la boutique
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [isLoadingShop, setIsLoadingShop] = useState(true);
  
  const isSubscribed = currentSubscription !== null;

  const colors = {
    bg: "#0A0A0A",
    card: "#1A1A1A",
    border: "#2A2A2A",
    primary: "#8B5CF6",
    secondary: "#A78BFA",
    text: "#FFFFFF",
    textMuted: "#9CA3AF",
    success: "#10B981",
  };

  useEffect(() => {
    if (user && creatorId && user.id === creatorId) {
      router.replace("/profile");
    }
  }, [user, creatorId, router]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        setUser(session.user);
        if (creatorId) await loadCreatorData(session.user);
      } else {
        setUser(null);
        if (creatorId) await loadCreatorData(null);
      }
    };
    init();
  }, [creatorId]);

  const loadCreatorData = async (currentUser: any) => {
    setIsLoading(true);
    try {
      await Promise.allSettled([
        loadCreatorProfile(),
        loadCreatorPosts(),
        loadCreatorStories(),
        loadCreatorShop(), // ✅ NOUVEAU
        checkIfFollowing(currentUser),
        loadFollowersCount(),
        loadFollowingCount(),
        loadLikesCount(),
        checkSubscriptionStatus(currentUser),
      ]);
    } catch (error) {
      console.error("❌ Erreur chargement profil:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCreatorProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, is_verified, premium_price, pro_price')
      .eq('id', creatorId)
      .maybeSingle();
    if (data) setCreator(data);
  };

  const loadCreatorPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('id, media_url, media_type, caption, title, created_at, likes_count, comments_count, views_count')
      .eq('user_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(30);
    
    if (data) setPosts(data);
  };

  const loadCreatorStories = async () => {
    const { data } = await supabase
      .from('stories')
      .select('id, media_url, media_type')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: true });
    
    if (data) {
      setStories(data);
      setHasActiveStories(data.length > 0);
    }
  };

  // ✅ NOUVEAU : Charger les produits publiés de la boutique
  const loadCreatorShop = async () => {
    try {
      const { data } = await supabase
        .from('digital_products')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      
      if (data) {
        setShopProducts(data);
      }
    } catch (error) {
      console.error("❌ Erreur chargement boutique:", error);
    } finally {
      setIsLoadingShop(false);
    }
  };

  const checkIfFollowing = async (currentUser: any) => {
    if (!currentUser || !creatorId) return;
    const { data } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', currentUser.id)
      .eq('following_id', creatorId)
      .maybeSingle();
    
    if (data) setIsFollowing(true);
  };

  const loadFollowersCount = async () => {
    if (!creatorId) return;
    const { count } = await supabase
      .from('follows')
      .select('follower_id', { count: 'exact', head: true })
      .eq('following_id', creatorId);
    if (count) setFollowersCount(count);
  };

  const loadFollowingCount = async () => {
    if (!creatorId) return;
    const { count } = await supabase
      .from('follows')
      .select('following_id', { count: 'exact', head: true })
      .eq('follower_id', creatorId);
    if (count) setFollowingCount(count);
  };

  const loadLikesCount = async () => {
    if (!creatorId) return;
    const { data } = await supabase
      .from('posts')
      .select('likes_count')
      .eq('user_id', creatorId);
    
    if (data) {
      const total = data.reduce((sum, post) => sum + (post.likes_count || 0), 0);
      setLikesCount(total);
    }
  };

  const checkSubscriptionStatus = async (currentUser: any) => {
    if (!currentUser || !creatorId) return;
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('fan_id', currentUser.id)
      .eq('creator_id', creatorId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      const endDate = new Date(data.end_date);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      let calculatedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (calculatedDays < 0) calculatedDays = 0;
      setCurrentSubscription(data);
      setDaysRemaining(calculatedDays);
    }
  };

  const toggleFollow = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', creatorId);
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: creatorId });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("❌ Erreur follow:", error);
    }
  };

  if (isLoading) {
    return (
      <Center h="100vh" bg={colors.bg}>
        <Spinner thickness="4px" speed="0.65s" emptyColor={colors.border} color={colors.primary} size="xl" />
      </Center>
    );
  }

  if (!creator) {
    return (
      <Center h="100vh" bg={colors.bg} color={colors.text}>
        <Text>Créateur introuvable</Text>
      </Center>
    );
  }

  const isVerified = creator.is_verified === true;
  const premiumPrice = creator.premium_price || 0;
  const proPrice = creator.pro_price || 0;
  const creatorDisplayName = creator.full_name || creator.username;

  return (
    <Box minH="100vh" bg={colors.bg} color={colors.text}>
      
      {/* HEADER */}
      <Box position="sticky" top={0} zIndex={100} bg="rgba(10,10,10,0.95)" backdropFilter="blur(10px)" borderBottom={`1px solid ${colors.border}`} py={3} px={4}>
        <Flex align="center" justify="space-between" maxW="1200px" mx="auto">
          <Button variant="ghost" color={colors.text} fontSize="24px" p={0} w="40px" h="40px" onClick={() => router.back()}>←</Button>
          <Flex direction="column" align="center">
            <Text fontWeight="bold" fontSize="16px">{creator.username}</Text>
            {isVerified && <Text color={colors.primary} fontSize="12px">✓</Text>}
          </Flex>
          <Button variant="ghost" color={colors.text} fontSize="24px" p={0} w="40px" h="40px">⋮</Button>
        </Flex>
      </Box>

      <Box maxW="1200px" mx="auto" px={4} py={6}>
        
        {/* PROFIL HEADER */}
        <Box mb={6}>
          <Flex 
            direction={{ base: "column", md: "row" }}
            gap={6}
            align={{ base: "center", md: "flex-start" }}
            mb={5}
          >
            {/* AVATAR */}
            <Box position="relative">
              <Box
                p="3px"
                borderRadius="full"
                bg={hasActiveStories ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, ${colors.primary})` : "transparent"}
                cursor={hasActiveStories ? "pointer" : "default"}
                onClick={hasActiveStories ? () => router.push(`/stories/view?creatorId=${creatorId}`) : undefined}
              >
                <Avatar 
                  size="xl" 
                  name={creatorDisplayName} 
                  src={creator.avatar_url || undefined} 
                  border={`3px solid ${colors.bg}`}
                />
              </Box>
              <Box 
                position="absolute" 
                bottom="8px" 
                right="8px" 
                w="18px" 
                h="18px" 
                borderRadius="full" 
                bg={colors.success}
                border={`3px solid ${colors.bg}`}
              />
            </Box>

            {/* INFO ET STATS */}
            <Box flex={1} textAlign={{ base: "center", md: "left" }}>
              <Flex align="center" justify={{ base: "center", md: "flex-start" }} gap={2} mb={2} flexWrap="wrap">
                <Text fontSize={{ base: "20px", md: "24px" }} fontWeight="bold">{creatorDisplayName}</Text>
                {isVerified && <Text color={colors.primary} fontSize={{ base: "18px", md: "20px" }}>✓</Text>}
              </Flex>
              <Text color={colors.textMuted} fontSize="14px" mb={4}>@{creator.username}</Text>
              
              {/* STATS */}
              <Flex justify={{ base: "center", md: "flex-start" }} gap={8} mb={4}>
                <VStack spacing={1}>
                  <Text fontWeight="bold" fontSize="18px">{formatCount(followingCount)}</Text>
                  <Text color={colors.textMuted} fontSize="13px">Suivis</Text>
                </VStack>
                <VStack spacing={1}>
                  <Text fontWeight="bold" fontSize="18px">{formatCount(followersCount)}</Text>
                  <Text color={colors.textMuted} fontSize="13px">Followers</Text>
                </VStack>
                <VStack spacing={1}>
                  <Text fontWeight="bold" fontSize="18px">{formatCount(likesCount)}</Text>
                  <Text color={colors.textMuted} fontSize="13px">J'aime</Text>
                </VStack>
              </Flex>

              {/* BOUTONS */}
              <Flex gap={2} justify={{ base: "center", md: "flex-start" }} flexWrap="wrap" mb={4}>
                <Button 
                  bg={isFollowing ? "transparent" : colors.primary}
                  color={isFollowing ? colors.text : "white"}
                  border={isFollowing ? `1px solid ${colors.border}` : "none"}
                  _hover={{ bg: isFollowing ? colors.card : colors.primary }}
                  px={8}
                  onClick={toggleFollow}
                >
                  {isFollowing ? "✓ Suivi" : "Suivre"}
                </Button>
                <Button 
                  bg={colors.card}
                  border={`1px solid ${colors.border}`}
                  color={colors.text}
                  _hover={{ bg: colors.border }}
                  px={6}
                  onClick={() => router.push(`/messages?to=${creatorId}`)}
                >
                  Message
                </Button>
                <Button 
                  bg={colors.card}
                  border={`1px solid ${colors.border}`}
                  color={colors.text}
                  _hover={{ bg: colors.border }}
                  w="40px"
                  p={0}
                  fontSize="18px"
                  onClick={() => setShowTipModal(true)}
                >
                  ☕
                </Button>
                <Button 
                  bg={colors.card}
                  border={`1px solid ${colors.border}`}
                  color={colors.text}
                  _hover={{ bg: colors.border }}
                  w="40px"
                  p={0}
                  fontSize="18px"
                >
                  ⋯
                </Button>
              </Flex>

              {/* BIO */}
              {creator.bio && (
                <Text color={colors.text} fontSize="14px" lineHeight="1.5" textAlign={{ base: "center", md: "left" }}>
                  {creator.bio}
                </Text>
              )}
            </Box>
          </Flex>

          {/* ABONNEMENTS */}
          {(premiumPrice > 0 || proPrice > 0) && (
            <Box mb={6} p={4} bg={colors.card} borderRadius="8px" border={`1px solid ${colors.border}`}>
              <Text fontSize="16px" fontWeight="bold" mb={3}>
                {isSubscribed ? '💎 Votre abonnement' : '💎 Devenir abonné'}
              </Text>
              <Flex gap={3} overflowX="auto" pb={2}>
                {premiumPrice > 0 && (
                  <SubscriptionCard 
                    badge="PREMIUM" title="Fan" price={premiumPrice} 
                    features={["Accès à tous les posts", "Contenu exclusif"]} 
                    isPro={false} 
                    currentTier={currentSubscription?.tier_type} 
                    daysRemaining={daysRemaining} 
                    onSubscribe={() => router.push(`/subscribe/${creatorId}?tier=premium`)} 
                    colors={colors} 
                  />
                )}
                {proPrice > 0 && (
                  <SubscriptionCard 
                    badge="PRO" title="VIP" price={proPrice} 
                    features={["Tout Premium", "Messages privés", "Appels"]} 
                    isPro={true} 
                    currentTier={currentSubscription?.tier_type} 
                    daysRemaining={daysRemaining} 
                    onSubscribe={() => router.push(`/subscribe/${creatorId}?tier=pro`)} 
                    colors={colors} 
                  />
                )}
              </Flex>
            </Box>
          )}
        </Box>

        {/* ONGLETS */}
        <Tabs index={selectedTab} onChange={(index) => setSelectedTab(index)} mb={5}>
          <TabList borderBottom={`1px solid ${colors.border}`}>
            <Tab _selected={{ color: colors.text, borderBottom: `2px solid ${colors.primary}` }} color={colors.textMuted} flex={1} textTransform="uppercase" fontSize="14px" letterSpacing="0.5px">
              Vidéos
            </Tab>
            {/* ✅ NOUVEL ONGLET BOUTIQUE */}
            <Tab _selected={{ color: colors.text, borderBottom: `2px solid ${colors.primary}` }} color={colors.textMuted} flex={1} textTransform="uppercase" fontSize="14px" letterSpacing="0.5px">
              Boutique
            </Tab>
            <Tab _selected={{ color: colors.text, borderBottom: `2px solid ${colors.primary}` }} color={colors.textMuted} flex={1} textTransform="uppercase" fontSize="14px" letterSpacing="0.5px">
              À propos
            </Tab>
          </TabList>

          <TabPanels>
            {/* ONGLET 0 : VIDÉOS */}
            <TabPanel p={0} pt={4}>
              {posts.length === 0 ? (
                <Center py={16} color={colors.textMuted}>
                  <VStack>
                    <Text fontSize="48px">📹</Text>
                    <Text>Aucune vidéo pour le moment</Text>
                  </VStack>
                </Center>
              ) : (
                <SimpleGrid columns={{ base: 3, md: 4, lg: 5 }} spacing={{ base: 1, md: 2, lg: 3 }}>
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} isSubscribed={isSubscribed} colors={colors} onClick={() => router.push(`/post/${post.id}?creatorId=${creatorId}`)} />
                  ))}
                </SimpleGrid>
              )}
            </TabPanel>

            {/* ✅ ONGLET 1 : BOUTIQUE */}
            <TabPanel p={0} pt={4}>
              {isLoadingShop ? (
                <Center py={16}>
                  <Spinner thickness="3px" color={colors.primary} size="md" />
                </Center>
              ) : shopProducts.length === 0 ? (
                <Center py={16} color={colors.textMuted}>
                  <VStack>
                    <Icon as={FaStore} boxSize={12} color="gray.600" />
                    <Text fontSize="16px" fontWeight="bold">Aucun produit en vente pour le moment</Text>
                  </VStack>
                </Center>
              ) : (
                <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={{ base: 2, md: 3 }}>
                  {shopProducts.map((product) => (
                    <ShopProductCard 
                      key={product.id} 
                      product={product} 
                      colors={colors} 
                      onClick={() => router.push(`/product/${product.id}`)} // Redirige vers la page de détail du produit
                    />
                  ))}
                </SimpleGrid>
              )}
            </TabPanel>

            {/* ONGLET 2 : À PROPOS */}
            <TabPanel p={0} pt={4}>
              <Box p={5} bg={colors.card} borderRadius="8px" border={`1px solid ${colors.border}`}>
                <Text fontWeight="bold" mb={4}>À propos</Text>
                <VStack align="stretch" spacing={3} color={colors.textMuted} fontSize="14px">
                  <Text><Text as="span" color={colors.text}>Nom:</Text> {creatorDisplayName}</Text>
                  <Text><Text as="span" color={colors.text}>Identifiant:</Text> @{creator.username}</Text>
                  {creator.bio && (
                    <Box>
                      <Text as="span" color={colors.text}>Bio:</Text>
                      <Text mt={2} color={colors.text} lineHeight="1.5">{creator.bio}</Text>
                    </Box>
                  )}
                </VStack>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>

      </Box>

      {showTipModal && creatorId && (
        <TipDialog 
          creatorId={creatorId} 
          creatorName={creatorDisplayName} 
          onClose={() => setShowTipModal(false)} 
          onSuccess={() => {}} 
        />
      )}
    </Box>
  );
}

// ✅ COMPOSANT CARTE PRODUIT POUR LA BOUTIQUE (Style identique au Flutter)
function ShopProductCard({ product, colors, onClick }: { product: any, colors: any, onClick: () => void }) {
  const title = product.title || "Sans titre";
  const price = (product.price as number) || 0;
  const mediaType = product.media_type || "file";

  const getIcon = () => {
    switch (mediaType) {
      case "video": return FaVideo;
      case "image": return FaImage;
      default: return FaFileAlt;
    }
  };

  return (
    <Box
      bg={colors.card}
      borderRadius="12px"
      border={`1px solid ${colors.border}`}
      overflow="hidden"
      cursor="pointer"
      onClick={onClick}
      _hover={{ transform: "translateY(-2px)", transition: "transform 0.2s", borderColor: colors.primary }}
    >
      <Box aspectRatio="4/3" bg="gray.800" display="flex" alignItems="center" justifyContent="center">
        {product.media_url ? (
          <Box as="img" src={product.media_url} alt={title} w="100%" h="100%" objectFit="cover" />
        ) : (
          <Icon as={getIcon()} color="gray.500" boxSize={10} />
        )}
      </Box>
      <Box p={3}>
        <Text color="white" fontWeight="bold" fontSize="13px" noOfLines={2} mb={2}>
          {title}
        </Text>
        <Text color={colors.primary} fontWeight="bold" fontSize="15px">
          {price.toFixed(0)} FCFA
        </Text>
      </Box>
    </Box>
  );
}
function SubscriptionCard({ badge, title, price, features, isPro, currentTier, daysRemaining, onSubscribe, colors }: any) {
  const isCurrentTier = currentTier === (isPro ? 'pro' : 'premium');
  
  return (
    <Box 
      minW="180px" 
      flex="1 1 180px" 
      p={3} 
      borderRadius="8px" 
      bg={isPro ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` : colors.card} 
      border={`1px solid ${isPro ? colors.primary : colors.border}`}
    >
      <Badge 
        display="inline-block" 
        px={2}
        py={1}
        borderRadius="4px" 
        bg={isPro ? "rgba(255,255,255,0.2)" : `${colors.primary}33`} 
        fontSize="10px" 
        fontWeight="bold" 
        mb={2}
        color={isPro ? colors.text : colors.primary}
      >
        {badge}
      </Badge>
      <Text fontSize="14px" fontWeight="medium" mb={1}>{title}</Text>
      <Text fontSize="18px" fontWeight="bold" mb={2}>
        {price} <Text as="span" fontSize="11px" color={colors.textMuted}>FCFA/mois</Text>
      </Text>
      <VStack align="stretch" spacing={1} mb={3}>
        {features.map((feature: string, i: number) => (
          <Text key={i} fontSize="11px" color={isPro ? "rgba(255,255,255,0.9)" : colors.textMuted}>
            ✓ {feature}
          </Text>
        ))}
      </VStack>
      {/* ✅ CORRECTION : Ajout de onClick={onSubscribe} */}
      <Button 
        w="100%" 
        size="sm"
        bg={isCurrentTier ? colors.border : (isPro ? colors.text : colors.primary)} 
        color={isCurrentTier ? colors.textMuted : (isPro ? colors.primary : colors.text)} 
        isDisabled={isCurrentTier}
        cursor={isCurrentTier ? "not-allowed" : "pointer"}
        onClick={onSubscribe}  // ⬅️ C'EST ÇA QUI MANQUAIT !
        _hover={!isCurrentTier ? { opacity: 0.9, transform: "scale(1.02)" } : {}}
        transition="all 0.2s"
      >
        {isCurrentTier ? `Abonné (${daysRemaining}j)` : 'Rejoindre'}
      </Button>
    </Box>
  );
}

function PostCard({ post, isSubscribed, colors, onClick }: any) {
  return (
    <Box 
      aspectRatio="3/4" 
      borderRadius="4px" 
      overflow="hidden" 
      bg={colors.card} 
      cursor="pointer" 
      position="relative"
      onClick={onClick}
      _hover={{ transform: "scale(1.02)", transition: "transform 0.2s" }}
    >
      {post.media_url ? (
        <>
          <Box as="img" src={post.media_url} alt={post.caption || "Post"} w="100%" h="100%" objectFit="cover" />
          {!isSubscribed && (
            <Center position="absolute" inset={0} bg="rgba(0,0,0,0.6)" flexDirection="column">
              <Text fontSize="28px" mb={2}>🔒</Text>
              <Text fontSize="10px" fontWeight="bold">Abonné</Text>
            </Center>
          )}
        </>
      ) : (
        <Center w="100%" h="100%" color={colors.textMuted} fontSize="40px">📷</Center>
      )}
      <Box position="absolute" bottom={0} left={0} right={0} p={2} bg="linear-gradient(transparent, rgba(0,0,0,0.9))">
        {post.caption && (
          <Text fontSize="11px" fontWeight="600" mb={1} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" color="white">
            {post.caption}
          </Text>
        )}
        <Text fontSize="10px" color={colors.text}>
          ❤️ {formatCount(post.likes_count || 0)}
        </Text>
      </Box>
      {post.media_type === 'video' && (
        <Box position="absolute" top={2} right={2} bg="rgba(0,0,0,0.6)" px={2} py={1} borderRadius="3px" fontSize="10px">
          ▶
        </Box>
      )}
    </Box>
  );
}

export default function CreatorProfilePage() {
  return (
    <Suspense fallback={
      <Center h="100vh" bg="#0A0A0A">
        <Spinner thickness="4px" speed="0.65s" emptyColor="#2A2A2A" color="#8B5CF6" size="xl" />
      </Center>
    }>
      <CreatorProfileContent />
    </Suspense>
  );
}