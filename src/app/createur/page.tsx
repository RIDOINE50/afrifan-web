"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";
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
  ModalHeader,      // ✅ AJOUT

  TabPanels,
  TabPanel,
  SimpleGrid,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
} from "@chakra-ui/react";

// ==========================================
// ✅ VRAIES ICÔNES SVG PROFESSIONNELLES
// ==========================================
const Icon = ({ path, size = 20, className = "", fill = "none", color = "currentColor" }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {path}
  </svg>
);

const Icons = {
  Tip: (props: any) => <Icon {...props} path={<><path d="M17 11h1a3 3 0 0 1 0 6h-1" /><path d="M9 12v6" /><path d="M12 12v6" /><path d="M15 12v6" /><path d="M5 12h14" /><path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" /><path d="M12 2v4" /><path d="M8 6h8" /></>} />,
  Flag: (props: any) => <Icon {...props} path={<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></>} />,
  FileText: (props: any) => <Icon {...props} path={<><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></>} />,
  Play: (props: any) => <Icon {...props} fill="currentColor" stroke="none" path={<><polygon points="5 3 19 12 5 21 5 3" /></>} />,
  Lock: (props: any) => <Icon {...props} path={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>} />,
  MoreVertical: (props: any) => <Icon {...props} path={<><circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" /></>} />,
  X: (props: any) => <Icon {...props} path={<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>} />,
  ChevronLeft: (props: any) => <Icon {...props} path={<><path d="m15 18-6-6 6-6" /></>} />,
};

function formatCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count >= 1000) return (count / 1000).toFixed(1) + "K";
  return count.toString();
}

function CreatorProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const creatorId = searchParams.get('id');
  const { isDark, theme } = useAppTheme();

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
  
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [isLoadingShop, setIsLoadingShop] = useState(true);

  // Modals
  const { isOpen: isAvatarOpen, onOpen: onAvatarOpen, onClose: onAvatarClose } = useDisclosure();
  const { isOpen: isReportOpen, onOpen: onReportOpen, onClose: onReportClose } = useDisclosure();
  
  const isSubscribed = currentSubscription !== null;

  const colors = {
    bg: theme.bg,
    card: theme.card,
    border: theme.border,
    primary: theme.primary,
    primaryText: theme.primaryText,
    text: theme.text,
    textMuted: theme.textMuted,
    hover: theme.hover,
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
        loadCreatorShop(),
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
    const { data } = await supabase.from('profiles').select('id, username, full_name, avatar_url, bio, is_verified, premium_price, pro_price').eq('id', creatorId).maybeSingle();
    if (data) setCreator(data);
  };

  const loadCreatorPosts = async () => {
    const { data } = await supabase.from('posts').select('id, media_url, media_type, caption, title, background_color, created_at, likes_count, comments_count, views_count').eq('user_id', creatorId).order('created_at', { ascending: false }).limit(30);
    if (data) setPosts(data);
  };

  const loadCreatorStories = async () => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase.from('stories').select('id, media_url, media_type, text_content, background_color').eq('creator_id', creatorId).gte('created_at', twentyFourHoursAgo).order('created_at', { ascending: true });
    if (data) {
      setStories(data);
      setHasActiveStories(data.length > 0);
    }
  };

  const loadCreatorShop = async () => {
    try {
      const { data } = await supabase.from('digital_products').select('*').eq('creator_id', creatorId).eq('status', 'published').order('created_at', { ascending: false });
      if (data) setShopProducts(data);
    } catch (error) {
      console.error("❌ Erreur chargement boutique:", error);
    } finally {
      setIsLoadingShop(false);
    }
  };

  const checkIfFollowing = async (currentUser: any) => {
    if (!currentUser || !creatorId) return;
    const { data } = await supabase.from('follows').select('follower_id').eq('follower_id', currentUser.id).eq('following_id', creatorId).maybeSingle();
    if (data) setIsFollowing(true);
  };

  const loadFollowersCount = async () => {
    if (!creatorId) return;
    const { count } = await supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', creatorId);
    if (count) setFollowersCount(count);
  };

  const loadFollowingCount = async () => {
    if (!creatorId) return;
    const { count } = await supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', creatorId);
    if (count) setFollowingCount(count);
  };

  const loadLikesCount = async () => {
    if (!creatorId) return;
    const { data } = await supabase.from('posts').select('likes_count').eq('user_id', creatorId);
    if (data) {
      const total = data.reduce((sum, post) => sum + (post.likes_count || 0), 0);
      setLikesCount(total);
    }
  };

  const checkSubscriptionStatus = async (currentUser: any) => {
    if (!currentUser || !creatorId) return;
    const { data } = await supabase.from('subscriptions').select('*').eq('fan_id', currentUser.id).eq('creator_id', creatorId).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();
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

  const handleReportCreator = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      await supabase.from('reports').insert({
        reporter_id: user.id,
        target_id: creatorId,
        target_type: 'user',
        reason: 'Comportement inapproprié'
      });
      alert("✅ Signalement envoyé avec succès.");
      onReportClose();
    } catch (error) {
      console.error("Erreur signalement:", error);
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
      <Box position="sticky" top={0} zIndex={100} bg={isDark ? "rgba(10,10,10,0.9)" : "rgba(255,255,255,0.9)"} backdropFilter="blur(12px)" borderBottom={`1px solid ${colors.border}`} py={3} px={4}>
        <Flex align="center" justify="space-between" maxW="1200px" mx="auto">
          <Button variant="ghost" color={colors.text} p={0} w="40px" h="40px" onClick={() => router.back()}>
            <Icons.ChevronLeft size={24} />
          </Button>
          <Flex direction="column" align="center">
            <Text fontWeight="bold" fontSize="16px">{creator.username}</Text>
            {isVerified && <Text color={colors.primary} fontSize="12px">✓ Vérifié</Text>}
          </Flex>
          
          {/* Menu 3 points pour signaler */}
          <Menu>
            <MenuButton as={Button} variant="ghost" color={colors.text} p={0} w="40px" h="40px">
              <Icons.MoreVertical size={24} />
            </MenuButton>
            <MenuList bg={colors.card} borderColor={colors.border} color={colors.text} zIndex={200}>
              <MenuItem icon={<Icons.Flag size={16} color="#EF4444" />} _hover={{ bg: colors.hover }} onClick={onReportOpen}>
                Signaler ce créateur
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Box>

      <Box maxW="1200px" mx="auto" px={4} py={6}>
        
        {/* PROFIL HEADER */}
        <Box mb={6}>
          <Flex direction={{ base: "column", md: "row" }} gap={6} align={{ base: "center", md: "flex-start" }} mb={5}>
            
            {/* AVATAR INTERACTIF */}
            <Box position="relative">
              <Box
                p="3px"
                borderRadius="full"
                bg={hasActiveStories ? `linear-gradient(135deg, ${colors.primary}, #EC4899, ${colors.primary})` : "transparent"}
                cursor="pointer"
                onClick={() => {
                  if (hasActiveStories) {
                    router.push(`/stories/view?creatorId=${creatorId}`);
                  } else {
                    onAvatarOpen();
                  }
                }}
                _hover={{ transform: "scale(1.05)", transition: "transform 0.2s" }}
              >
                <Avatar size="xl" name={creatorDisplayName} src={creator.avatar_url || undefined} border={`3px solid ${colors.bg}`} />
              </Box>
              {hasActiveStories && (
                <Box position="absolute" bottom="8px" right="8px" w="20px" h="20px" borderRadius="full" bg={colors.success} border={`3px solid ${colors.bg}`} />
              )}
            </Box>

            {/* INFO ET STATS */}
            <Box flex={1} textAlign={{ base: "center", md: "left" }}>
              <Flex align="center" justify={{ base: "center", md: "flex-start" }} gap={2} mb={2} flexWrap="wrap">
                <Text fontSize={{ base: "22px", md: "26px" }} fontWeight="bold">{creatorDisplayName}</Text>
                {isVerified && <Text color={colors.primary} fontSize={{ base: "20px", md: "22px" }}>✓</Text>}
              </Flex>
              <Text color={colors.textMuted} fontSize="14px" mb={4}>@{creator.username}</Text>
              
              <Flex justify={{ base: "center", md: "flex-start" }} gap={8} mb={5}>
                <VStack spacing={1}><Text fontWeight="bold" fontSize="18px">{formatCount(followingCount)}</Text><Text color={colors.textMuted} fontSize="13px">Suivis</Text></VStack>
                <VStack spacing={1}><Text fontWeight="bold" fontSize="18px">{formatCount(followersCount)}</Text><Text color={colors.textMuted} fontSize="13px">Followers</Text></VStack>
                <VStack spacing={1}><Text fontWeight="bold" fontSize="18px">{formatCount(likesCount)}</Text><Text color={colors.textMuted} fontSize="13px">J'aime</Text></VStack>
              </Flex>

              <Flex gap={2} justify={{ base: "center", md: "flex-start" }} flexWrap="wrap" mb={4}>
                <Button bg={isFollowing ? "transparent" : colors.primary} color={isFollowing ? colors.text : colors.primaryText} border={isFollowing ? `1px solid ${colors.border}` : "none"} _hover={{ opacity: 0.9 }} px={8} onClick={toggleFollow}>
                  {isFollowing ? "✓ Suivi" : "Suivre"}
                </Button>
                <Button bg={colors.card} border={`1px solid ${colors.border}`} color={colors.text} _hover={{ bg: colors.hover }} px={6} onClick={() => router.push(`/messages?to=${creatorId}`)}>
                  Message
                </Button>
                <Button bg={colors.card} border={`1px solid ${colors.border}`} color={colors.text} _hover={{ bg: colors.hover }} w="40px" p={0} onClick={() => setShowTipModal(true)}>
                  <Icons.Tip size={20} color={colors.primary} />
                </Button>
              </Flex>

              {creator.bio && (
                <Text color={colors.text} fontSize="14px" lineHeight="1.6" textAlign={{ base: "center", md: "left" }} maxW="500px">
                  {creator.bio}
                </Text>
              )}
            </Box>
          </Flex>

          {/* ABONNEMENTS */}
          {(premiumPrice > 0 || proPrice > 0) && (
            <Box mb={6} p={4} bg={colors.card} borderRadius="12px" border={`1px solid ${colors.border}`}>
              <Text fontSize="16px" fontWeight="bold" mb={3}>{isSubscribed ? '💎 Votre abonnement' : '💎 Devenir abonné'}</Text>
              <Flex gap={3} overflowX="auto" pb={2} css={{ '&::-webkit-scrollbar': { display: 'none' } }}>
                {premiumPrice > 0 && (
                  <SubscriptionCard badge="PREMIUM" title="Fan" price={premiumPrice} features={["Accès à tous les posts", "Contenu exclusif"]} isPro={false} currentTier={currentSubscription?.tier_type} daysRemaining={daysRemaining} onSubscribe={() => router.push(`/subscribe/${creatorId}?tier=premium&price=${premiumPrice}&name=${encodeURIComponent(creatorDisplayName)}`)} colors={colors} />
                )}
                {proPrice > 0 && (
                  <SubscriptionCard badge="PRO" title="VIP" price={proPrice} features={["Tout Premium", "Messages privés", "Appels"]} isPro={true} currentTier={currentSubscription?.tier_type} daysRemaining={daysRemaining} onSubscribe={() => router.push(`/subscribe/${creatorId}?tier=pro&price=${proPrice}&name=${encodeURIComponent(creatorDisplayName)}`)} colors={colors} />
                )}
              </Flex>
            </Box>
          )}
        </Box>

        {/* ONGLETS */}
        <Tabs index={selectedTab} onChange={(index) => setSelectedTab(index)} mb={5}>
          <TabList borderBottom={`1px solid ${colors.border}`}>
            <Tab _selected={{ color: colors.text, borderBottom: `2px solid ${colors.primary}` }} color={colors.textMuted} flex={1} textTransform="uppercase" fontSize="13px" fontWeight="600" letterSpacing="0.5px">Publications</Tab>
            <Tab _selected={{ color: colors.text, borderBottom: `2px solid ${colors.primary}` }} color={colors.textMuted} flex={1} textTransform="uppercase" fontSize="13px" fontWeight="600" letterSpacing="0.5px">Boutique</Tab>
            <Tab _selected={{ color: colors.text, borderBottom: `2px solid ${colors.primary}` }} color={colors.textMuted} flex={1} textTransform="uppercase" fontSize="13px" fontWeight="600" letterSpacing="0.5px">À propos</Tab>
          </TabList>

          <TabPanels>
            {/* ONGLET 0 : PUBLICATIONS */}
            <TabPanel p={0} pt={4}>
              {posts.length === 0 ? (
                <Center py={16} color={colors.textMuted}>
                  <VStack><Text fontSize="48px">📷</Text><Text>Aucune publication pour le moment</Text></VStack>
                </Center>
              ) : (
                <SimpleGrid columns={{ base: 3, md: 4, lg: 5 }} spacing={{ base: 2, md: 3 }}>
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} isSubscribed={isSubscribed} colors={colors} onClick={() => {
                      if (!isSubscribed && post.media_type !== 'text') { // On autorise la lecture des posts texte même sans abonnement si tu le souhaites, sinon enlève la condition
                        router.push(`/subscribe/${creatorId}?tier=premium&price=${premiumPrice}&name=${encodeURIComponent(creatorDisplayName)}`);
                      } else {
                        router.push(`/post/${post.id}?creatorId=${creatorId}`);
                      }
                    }} />
                  ))}
                </SimpleGrid>
                )}
            </TabPanel>

            {/* ONGLET 1 : BOUTIQUE */}
            <TabPanel p={0} pt={4}>
              {isLoadingShop ? (
                <Center py={16}><Spinner thickness="3px" color={colors.primary} size="md" /></Center>
              ) : shopProducts.length === 0 ? (
                <Center py={16} color={colors.textMuted}>
                  <VStack><Icons.FileText size={48} color={colors.textMuted} /><Text fontSize="16px" fontWeight="bold">Aucun produit en vente</Text></VStack>
                </Center>
              ) : (
                <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={{ base: 2, md: 3 }}>
                  {shopProducts.map((product) => (
                    <ShopProductCard key={product.id} product={product} colors={colors} onClick={() => router.push(`/product/${product.id}`)} />
                  ))}
                </SimpleGrid>
              )}
            </TabPanel>

            {/* ONGLET 2 : À PROPOS */}
            <TabPanel p={0} pt={4}>
              <Box p={5} bg={colors.card} borderRadius="12px" border={`1px solid ${colors.border}`}>
                <Text fontWeight="bold" mb={4} fontSize="18px">À propos</Text>
                <VStack align="stretch" spacing={4} color={colors.textMuted} fontSize="14px">
                  <Flex justify="space-between"><Text color={colors.text}>Nom complet</Text><Text color={colors.text} fontWeight="500">{creatorDisplayName}</Text></Flex>
                  <Flex justify="space-between"><Text color={colors.text}>Identifiant</Text><Text color={colors.text} fontWeight="500">@{creator.username}</Text></Flex>
                  {creator.bio && (
                    <Box>
                      <Text color={colors.text} mb={2}>Biographie</Text>
                      <Text color={colors.text} lineHeight="1.6" bg={colors.bg} p={3} borderRadius="8px">{creator.bio}</Text>
                    </Box>
                  )}
                </VStack>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      {/* MODAL POUR VOIR LA PHOTO DE PROFIL EN GRAND */}
      <Modal isOpen={isAvatarOpen} onClose={onAvatarClose} size="xl" isCentered>
        <ModalOverlay bg="blackAlpha.900" />
        <ModalContent bg="transparent" border="none">
          <ModalCloseButton color="white" />
          <ModalBody display="flex" justifyContent="center" alignItems="center">
            <Avatar size="2xl" name={creatorDisplayName} src={creator.avatar_url || undefined} border={`4px solid ${colors.bg}`} />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* MODAL DE SIGNALEMENT */}
      <Modal isOpen={isReportOpen} onClose={onReportClose} isCentered>
        <ModalOverlay bg="blackAlpha.700" />
        <ModalContent bg={colors.card} color={colors.text} maxW="400px" borderRadius="16px">
          <ModalHeader>Signaler ce créateur</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text fontSize="14px" color={colors.textMuted} mb={4}>
              Pourquoi souhaitez-vous signaler ce compte ?
            </Text>
            <VStack spacing="2" align="stretch">
              {["Contenu inapproprié", "Harcèlement", "Arnaque / Fraude", "Faux compte", "Autre"].map(reason => (
                <Button key={reason} justifyContent="flex-start" bg={colors.bg} border={`1px solid ${colors.border}`} _hover={{ bg: colors.hover }} onClick={() => { handleReportCreator(); }}>
                  {reason}
                </Button>
              ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {showTipModal && creatorId && (
        <TipDialog creatorId={creatorId} creatorName={creatorDisplayName} onClose={() => setShowTipModal(false)} onSuccess={() => {}} />
      )}
    </Box>
  );
}

// ==========================================
// COMPOSANTS SECONDAIRES
// ==========================================

function ShopProductCard({ product, colors, onClick }: { product: any, colors: any, onClick: () => void }) {
  const title = product.title || "Sans titre";
  const price = (product.price as number) || 0;
  const mediaType = product.media_type || "file";

  return (
    <Box bg={colors.card} borderRadius="12px" border={`1px solid ${colors.border}`} overflow="hidden" cursor="pointer" onClick={onClick} _hover={{ transform: "translateY(-4px)", transition: "transform 0.2s", borderColor: colors.primary }}>
      <Box aspectRatio="4/3" bg={colors.hover} display="flex" alignItems="center" justifyContent="center">
        {product.media_url ? (
          <Box as="img" src={product.media_url} alt={title} w="100%" h="100%" objectFit="cover" />
        ) : (
          <Icons.FileText size={40} color={colors.textMuted} />
        )}
      </Box>
      <Box p={3}>
        <Text color={colors.text} fontWeight="bold" fontSize="14px" noOfLines={2} mb={2}>{title}</Text>
        <Text color={colors.primary} fontWeight="bold" fontSize="16px">{price.toFixed(0)} FCFA</Text>
      </Box>
    </Box>
  );
}

function SubscriptionCard({ badge, title, price, features, isPro, currentTier, daysRemaining, onSubscribe, colors }: any) {
  const isCurrentTier = currentTier === (isPro ? 'pro' : 'premium');
  return (
    <Box minW="180px" flex="1 1 180px" p={4} borderRadius="12px" bg={isPro ? colors.primary : colors.card} border={`1px solid ${isPro ? colors.primary : colors.border}`} transition="transform 0.2s" _hover={{ transform: "scale(1.02)" }}>
      <Badge display="inline-block" px={2} py={1} borderRadius="6px" bg={isPro ? "rgba(255,255,255,0.2)" : `${colors.primary}20`} fontSize="10px" fontWeight="bold" mb={3} color={isPro ? colors.primaryText : colors.primary}>
        {badge}
      </Badge>
      <Text fontSize="15px" fontWeight="medium" mb={1} color={isPro ? colors.primaryText : colors.text}>{title}</Text>
      <Text fontSize="20px" fontWeight="bold" mb={3} color={isPro ? colors.primaryText : colors.text}>{price} <Text as="span" fontSize="12px" color={isPro ? "rgba(255,255,255,0.7)" : colors.textMuted}>FCFA/mois</Text></Text>
      <VStack align="stretch" spacing={2} mb={4}>
        {features.map((feature: string, i: number) => (
          <Flex key={i} align="center" gap={2} fontSize="12px" color={isPro ? "rgba(255,255,255,0.9)" : colors.textMuted}>
            <Text color={isPro ? "white" : colors.success}>✓</Text> {feature}
          </Flex>
        ))}
      </VStack>
      <Button w="100%" size="sm" bg={isCurrentTier ? colors.border : (isPro ? colors.primaryText : colors.primary)} color={isCurrentTier ? colors.textMuted : (isPro ? colors.primary : colors.primaryText)} isDisabled={isCurrentTier} cursor={isCurrentTier ? "not-allowed" : "pointer"} onClick={onSubscribe} _hover={!isCurrentTier ? { opacity: 0.9 } : {}}>
        {isCurrentTier ? `Abonné (${daysRemaining}j)` : 'Rejoindre'}
      </Button>
    </Box>
  );
}

function PostCard({ post, isSubscribed, colors, onClick }: any) {
  const isTextPost = post.media_type === 'text';
  
  return (
    <Box aspectRatio="3/4" borderRadius="8px" overflow="hidden" bg={colors.card} cursor="pointer" position="relative" onClick={onClick} _hover={{ transform: "scale(1.03)", transition: "transform 0.2s", zIndex: 10 }}>
      
      {/* ✅ GESTION DES POSTS TEXTE COMME DES IMAGES AVEC APERÇU */}
      {isTextPost ? (
        <Box w="100%" h="100%" bg={post.background_color || (colors.bg === "#000000" ? "#2D3748" : "#E2E8F0")} display="flex" alignItems="center" justifyContent="center" p={3}>
          <Text color={colors.bg === "#000000" ? "#FFFFFF" : "#000000"} fontSize="13px" fontWeight="bold" textAlign="center" lineHeight="1.4" noOfLines={6}>
            {post.content || post.caption || "Texte"}
          </Text>
        </Box>
      ) : post.media_url ? (
        <Box as="img" src={post.media_url} alt={post.caption || "Post"} w="100%" h="100%" objectFit="cover" style={{ filter: !isSubscribed ? "blur(20px) brightness(0.5)" : "none", transform: !isSubscribed ? "scale(1.1)" : "none", transition: "all 0.3s" }} />
      ) : (
        <Center w="100%" h="100%" color={colors.textMuted}><Icons.FileText size={40} /></Center>
      )}

      {/* OVERLAY POUR CONTENU EXCLUSIF (Non abonné) */}
      {!isSubscribed && !isTextPost && (
        <Center position="absolute" inset={0} flexDirection="column" backdropFilter="blur(2px)">
          <Box p={3} borderRadius="full" bg="rgba(0,0,0,0.6)" mb={2}>
            <Icons.Lock size={24} color="white" />
          </Box>
          <Text fontSize="12px" fontWeight="bold" color="white">Exclusif</Text>
          <Text fontSize="10px" color="rgba(255,255,255,0.8)" mt={1}>Cliquez pour débloquer</Text>
        </Center>
      )}

      {/* BADGE VIDÉO */}
      {post.media_type === 'video' && isSubscribed && (
        <Box position="absolute" top={2} right={2} bg="rgba(0,0,0,0.6)" p={1.5} borderRadius="full">
          <Icons.Play size={14} color="white" />
        </Box>
      )}

      {/* INFO BAS DE CARTE */}
      <Box position="absolute" bottom={0} left={0} right={0} p={2} bg="linear-gradient(transparent, rgba(0,0,0,0.8))">
        {post.caption && (
          <Text fontSize="11px" fontWeight="600" mb={1} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" color="white">
            {post.caption}
          </Text>
        )}
        <Flex align="center" gap={1} color="white" fontSize="11px" fontWeight="bold">
          ❤️ {formatCount(post.likes_count || 0)}
        </Flex>
      </Box>
    </Box>
  );
}

export default function CreatorProfilePage() {
  return (
    <Suspense fallback={<Center h="100vh" bg="#0A0A0A"><Spinner thickness="4px" speed="0.65s" emptyColor="#2A2A2A" color="#8B5CF6" size="xl" /></Center>}>
      <CreatorProfileContent />
    </Suspense>
  );
}