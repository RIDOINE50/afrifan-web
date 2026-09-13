"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Flex, Text, Button, Spinner, Center, VStack, HStack,
  useToast, Icon, SimpleGrid, Badge, Avatar
} from "@chakra-ui/react";
import { 
  FaArrowLeft, FaPlayCircle, FaImage, FaFilePdf, FaVideo, FaTrash, FaMusic
} from "react-icons/fa";
import { getDownloadedPosts, deleteDownloadedPost } from "@/lib/offlineManager";
import { useAppTheme } from "@/contexts/ThemeContext";

export default function DownloadsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { isDark, theme } = useAppTheme();
  
  const [downloads, setDownloads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingPost, setViewingPost] = useState<any | null>(null);

  // ✅ Couleurs dynamiques
  const colors = {
    bg: theme.bg,
    card: theme.card,
    border: theme.border,
    primary: theme.primary,
    primaryText: theme.primaryText,
    text: theme.text,
    textMuted: theme.textMuted,
    hover: theme.hover,
    overlay: isDark ? "rgba(10,10,10,0.95)" : "rgba(255,255,255,0.95)",
    mediaBg: "#000000",
  };

  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    setIsLoading(true);
    try {
      const posts = await getDownloadedPosts();
      setDownloads(posts);
    } catch (error) {
      console.error("❌ Erreur chargement téléchargements:", error);
      toast({ title: "Erreur de chargement", status: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Supprimer ce téléchargement pour libérer de l'espace ?")) return;
    try {
      await deleteDownloadedPost(postId);
      setDownloads(prev => prev.filter(p => p.id !== postId));
      toast({ title: "Supprimé", status: "success", duration: 2000 });
    } catch (error) {
      toast({ title: "Erreur", status: "error" });
    }
  };

  const getFileIcon = (mediaType: string, url: string) => {
    const type = mediaType?.toLowerCase() || "";
    const name = url?.toLowerCase() || "";
    if (type.includes("video") || name.endsWith(".mp4") || name.endsWith(".mov")) return FaVideo;
    if (type.includes("audio") || name.endsWith(".mp3")) return FaMusic;
    if (type.includes("pdf") || name.endsWith(".pdf")) return FaFilePdf;
    return FaImage;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  // ==========================================
  // ✅ MODE VISIONNEUR
  // ==========================================
  if (viewingPost && viewingPost.localUrl) {
    const mediaType = viewingPost.media_type?.toLowerCase() || "";
    const urlLower = viewingPost.localUrl.toLowerCase();
    
    const isVideo = mediaType.includes("video") || urlLower.endsWith(".mp4") || urlLower.endsWith(".mov");
    const isImage = mediaType.includes("image") || urlLower.match(/\.(jpg|jpeg|png|gif|webp)$/);
    const isPdf = mediaType.includes("pdf") || urlLower.endsWith(".pdf");
    const isAudio = mediaType.includes("audio") || urlLower.endsWith(".mp3");

    return (
      <Box minH="100vh" bg={colors.bg} color={colors.text}>
        <Flex align="center" justify="space-between" p={4} borderBottom={`1px solid ${colors.border}`} bg={colors.card}>
          <HStack>
            <Button variant="ghost" color={colors.textMuted} leftIcon={<Icon as={FaArrowLeft} />} onClick={() => setViewingPost(null)}>
              Retour
            </Button>
            <Text fontWeight="bold" fontSize="16px" noOfLines={1} maxW="300px" color={colors.text}>
              {viewingPost.profiles?.username || "Publication"}
            </Text>
          </HStack>
        </Flex>

        <Box p={4} display="flex" justifyContent="center" alignItems="center" minH="calc(100vh - 80px)">
          {isImage && (
            <Box as="img" src={viewingPost.localUrl} maxW="100%" maxH="80vh" borderRadius="12px" objectFit="contain" draggable={false} onContextMenu={(e: React.MouseEvent) => e.preventDefault()} />
          )}
          {isVideo && (
            <Box maxW="100%" maxH="80vh" borderRadius="12px" overflow="hidden" bg={colors.mediaBg}>
              <video src={viewingPost.localUrl} controls controlsList="nodownload" onContextMenu={(e: React.MouseEvent) => e.preventDefault()} style={{ maxWidth: "100%", maxHeight: "80vh" }} />
            </Box>
          )}
          {isPdf && (
            <Box w="100%" h="80vh" borderRadius="12px" overflow="hidden">
              <iframe src={`${viewingPost.localUrl}#toolbar=0&navpanes=0&scrollbar=0`} width="100%" height="100%" style={{ border: "none" }} />
            </Box>
          )}
          {isAudio && (
            <Box maxW="100%" p={8} bg={colors.card} borderRadius="12px">
              <audio src={viewingPost.localUrl} controls autoPlay style={{ width: "100%" }} onContextMenu={(e: React.MouseEvent) => e.preventDefault()} />
            </Box>
          )}
          {!isVideo && !isImage && !isPdf && !isAudio && (
            <VStack spacing={6}>
              <Icon as={FaFilePdf} boxSize={20} color={colors.textMuted} />
              <Text color={colors.textMuted}>Format non prévisualisable</Text>
              <Button as="a" href={viewingPost.localUrl} target="_blank" bg={colors.primary} color={colors.primaryText} _hover={{ opacity: 0.9 }}>Ouvrir le fichier</Button>
            </VStack>
          )}
        </Box>
      </Box>
    );
  }

  // ==========================================
  // ✅ MODE LISTE DES TÉLÉCHARGEMENTS
  // ==========================================
  return (
    <Box minH="100vh" bg={colors.bg} color={colors.text}>
      <Box position="sticky" top={0} zIndex={100} bg={colors.overlay} backdropFilter="blur(10px)" borderBottom={`1px solid ${colors.border}`} py={3} px={4}>
        <Flex align="center" maxW="1200px" mx="auto">
          <Button variant="ghost" color={colors.textMuted} leftIcon={<Icon as={FaArrowLeft} />} onClick={() => router.back()}>Retour</Button>
          <Text fontSize="20px" fontWeight="bold" ml={4} color={colors.text}>Mes Téléchargements</Text>
        </Flex>
      </Box>

      <Box maxW="1200px" mx="auto" p={{ base: 4, md: 8 }}>
        {isLoading ? (
          <Center h="50vh"><Spinner thickness="4px" color={colors.primary} size="xl" /></Center>
        ) : downloads.length === 0 ? (
          <Center h="60vh">
            <VStack spacing={6}>
              <Box p={6} bg={colors.card} borderRadius="full"><Icon as={FaImage} boxSize={16} color={colors.textMuted} /></Box>
              <Text fontSize="20px" fontWeight="bold" color={colors.text}>Aucun téléchargement</Text>
              <Text color={colors.textMuted} textAlign="center" maxW="400px">
                Les publications que tu télécharges depuis le fil d'actualité apparaîtront ici pour un accès hors ligne.
              </Text>
              <Button bg={colors.primary} color={colors.primaryText} _hover={{ opacity: 0.9 }} onClick={() => router.push("/home")}>
                Retour au fil d'actualité
              </Button>
            </VStack>
          </Center>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {downloads.map((post) => (
              <Box 
                key={post.id} 
                bg={colors.card} 
                borderRadius="12px" 
                border={`1px solid ${colors.border}`} 
                p={5} 
                _hover={{ borderColor: colors.primary, transform: "translateY(-2px)" }} 
                transition="all 0.2s"
              >
                <Flex align="start" justify="space-between" mb={4}>
                  <HStack spacing={3}>
                    <Avatar size="sm" name={post.profiles?.username} src={post.profiles?.avatar_url} />
                    <Box>
                      <Text fontWeight="bold" fontSize="14px" color={colors.text}>{post.profiles?.username || "Utilisateur"}</Text>
                      <Text fontSize="11px" color={colors.textMuted}>{formatDate(post.downloadedAt)}</Text>
                    </Box>
                  </HStack>
                  <Button size="sm" variant="ghost" color={colors.textMuted} _hover={{ color: "red.400", bg: "rgba(239, 68, 68, 0.1)" }} onClick={() => handleDelete(post.id)}>
                    <Icon as={FaTrash} />
                  </Button>
                </Flex>

                <Text fontWeight="bold" fontSize="16px" mb={4} noOfLines={2} color={colors.text}>
                  {post.content || "Publication sans légende"}
                </Text>

                <HStack spacing={2} mb={4}>
                  <Badge colorScheme="purple" fontSize="10px" textTransform="uppercase">
                    {post.media_type || "Média"}
                  </Badge>
                </HStack>

                <Button 
                  w="100%" 
                  bg={colors.primary} 
                  color={colors.primaryText} 
                  _hover={{ opacity: 0.9 }} 
                  leftIcon={<Icon as={getFileIcon(post.media_type, post.media_url)} />} 
                  onClick={() => setViewingPost(post)}
                >
                  Ouvrir le contenu
                </Button>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>
    </Box>
  );
}