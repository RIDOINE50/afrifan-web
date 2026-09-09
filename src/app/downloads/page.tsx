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

export default function DownloadsScreen() {
  const router = useRouter();
  const toast = useToast();
  
  const [downloads, setDownloads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingPost, setViewingPost] = useState<any | null>(null);

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
  // ✅ MODE VISIONNEUR (Utilise localUrl générée par offlineManager)
  // ==========================================
  if (viewingPost && viewingPost.localUrl) {
    const mediaType = viewingPost.media_type?.toLowerCase() || "";
    const urlLower = viewingPost.localUrl.toLowerCase();
    
    const isVideo = mediaType.includes("video") || urlLower.endsWith(".mp4") || urlLower.endsWith(".mov");
    const isImage = mediaType.includes("image") || urlLower.match(/\.(jpg|jpeg|png|gif|webp)$/);
    const isPdf = mediaType.includes("pdf") || urlLower.endsWith(".pdf");
    const isAudio = mediaType.includes("audio") || urlLower.endsWith(".mp3");

    return (
      <Box minH="100vh" bg="#0A0A0A" color="white">
        <Flex align="center" justify="space-between" p={4} borderBottom="1px solid #2A2A2A" bg="#1A1A1A">
          <HStack>
            <Button variant="ghost" color="gray.400" leftIcon={<Icon as={FaArrowLeft} />} onClick={() => setViewingPost(null)}>
              Retour
            </Button>
            <Text fontWeight="bold" fontSize="16px" noOfLines={1} maxW="300px">
              {viewingPost.profiles?.username || "Publication"}
            </Text>
          </HStack>
        </Flex>

        <Box p={4} display="flex" justifyContent="center" alignItems="center" minH="calc(100vh - 80px)">
          {isImage && (
            <Box as="img" src={viewingPost.localUrl} maxW="100%" maxH="80vh" borderRadius="12px" objectFit="contain" draggable={false} onContextMenu={(e: React.MouseEvent) => e.preventDefault()} />
          )}
          {isVideo && (
            <Box maxW="100%" maxH="80vh" borderRadius="12px" overflow="hidden" bg="black">
              <video src={viewingPost.localUrl} controls controlsList="nodownload" onContextMenu={(e: React.MouseEvent) => e.preventDefault()} style={{ maxWidth: "100%", maxHeight: "80vh" }} />
            </Box>
          )}
          {isPdf && (
            <Box w="100%" h="80vh" borderRadius="12px" overflow="hidden">
              <iframe src={`${viewingPost.localUrl}#toolbar=0&navpanes=0&scrollbar=0`} width="100%" height="100%" style={{ border: "none" }} />
            </Box>
          )}
          {isAudio && (
            <Box maxW="100%" p={8} bg="#1A1A1A" borderRadius="12px">
              <audio src={viewingPost.localUrl} controls autoPlay style={{ width: "100%" }} onContextMenu={(e: React.MouseEvent) => e.preventDefault()} />
            </Box>
          )}
          {!isVideo && !isImage && !isPdf && !isAudio && (
            <VStack spacing={6}>
              <Icon as={FaFilePdf} boxSize={20} color="gray.500" />
              <Text color="gray.400">Format non prévisualisable</Text>
              <Button as="a" href={viewingPost.localUrl} target="_blank" bg="#8B5CF6" color="white">Ouvrir le fichier</Button>
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
    <Box minH="100vh" bg="#0A0A0A" color="white">
      <Box position="sticky" top={0} zIndex={100} bg="rgba(10,10,10,0.95)" backdropFilter="blur(10px)" borderBottom="1px solid #2A2A2A" py={3} px={4}>
        <Flex align="center" maxW="1200px" mx="auto">
          <Button variant="ghost" color="gray.400" leftIcon={<Icon as={FaArrowLeft} />} onClick={() => router.back()}>Retour</Button>
          <Text fontSize="20px" fontWeight="bold" ml={4}>Mes Téléchargements</Text>
        </Flex>
      </Box>

      <Box maxW="1200px" mx="auto" p={{ base: 4, md: 8 }}>
        {isLoading ? (
          <Center h="50vh"><Spinner thickness="4px" color="#8B5CF6" size="xl" /></Center>
        ) : downloads.length === 0 ? (
          <Center h="60vh">
            <VStack spacing={6}>
              <Box p={6} bg="#1A1A1A" borderRadius="full"><Icon as={FaImage} boxSize={16} color="gray.600" /></Box>
              <Text fontSize="20px" fontWeight="bold">Aucun téléchargement</Text>
              <Text color="gray.400" textAlign="center" maxW="400px">
                Les publications que tu télécharges depuis le fil d'actualité apparaîtront ici pour un accès hors ligne.
              </Text>
              <Button bg="#8B5CF6" color="white" _hover={{ bg: "#7C3AED" }} onClick={() => router.push("/home")}>
                Retour au fil d'actualité
              </Button>
            </VStack>
          </Center>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {downloads.map((post) => (
              <Box key={post.id} bg="#1A1A1A" borderRadius="12px" border="1px solid #2A2A2A" p={5} _hover={{ borderColor: "#8B5CF6", transform: "translateY(-2px)" }} transition="all 0.2s">
                <Flex align="start" justify="space-between" mb={4}>
                  <HStack spacing={3}>
                    <Avatar size="sm" name={post.profiles?.username} src={post.profiles?.avatar_url} />
                    <Box>
                      <Text fontWeight="bold" fontSize="14px">{post.profiles?.username || "Utilisateur"}</Text>
                      <Text fontSize="11px" color="gray.500">{formatDate(post.downloadedAt)}</Text>
                    </Box>
                  </HStack>
                  <Button size="sm" variant="ghost" color="gray.500" _hover={{ color: "red.400", bg: "red.500/10" }} onClick={() => handleDelete(post.id)}>
                    <Icon as={FaTrash} />
                  </Button>
                </Flex>

                <Text fontWeight="bold" fontSize="16px" mb={4} noOfLines={2}>
                  {post.content || "Publication sans légende"}
                </Text>

                <HStack spacing={2} mb={4}>
                  <Badge colorScheme="purple" fontSize="10px" textTransform="uppercase">
                    {post.media_type || "Média"}
                  </Badge>
                </HStack>

                <Button w="100%" bg="#8B5CF6" color="white" _hover={{ bg: "#7C3AED" }} leftIcon={<Icon as={getFileIcon(post.media_type, post.media_url)} />} onClick={() => setViewingPost(post)}>
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