"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Flex, Text, Button, Spinner, Center, VStack, HStack,
  useToast, Icon, SimpleGrid, Badge
} from "@chakra-ui/react";
import { 
  FaArrowLeft, FaPlayCircle, FaImage, FaFilePdf, FaVideo, FaTrash, FaLock, FaMusic
} from "react-icons/fa";
import { getAllPurchasedFiles, deletePurchasedFile } from "@/lib/localStorage";
import { useAppTheme } from "@/contexts/ThemeContext";

interface PurchasedFile {
  productId: string;
  fileName: string;
  mediaType: string;
  blob: Blob;
  downloadedAt: number;
}

export default function MesAchatsPage() {
  const router = useRouter();
  const toast = useToast();
  const { isDark, theme } = useAppTheme();
  
  const [purchases, setPurchases] = useState<PurchasedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingFile, setViewingFile] = useState<PurchasedFile | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

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
    red: "#EF4444",
  };

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    setIsLoading(true);
    try {
      const files = await getAllPurchasedFiles();
      setPurchases(files);
    } catch (error) {
      console.error("❌ Erreur chargement achats:", error);
      toast({ title: "Erreur de chargement", status: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const openFile = (file: PurchasedFile) => {
    const url = URL.createObjectURL(file.blob);
    setViewerUrl(url);
    setViewingFile(file);
  };

  const closeViewer = () => {
    if (viewerUrl) {
      URL.revokeObjectURL(viewerUrl);
    }
    setViewerUrl(null);
    setViewingFile(null);
  };

  const handleDelete = async (productId: string, fileName: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer "${fileName}" de votre appareil ?`)) return;
    
    try {
      await deletePurchasedFile(productId);
      setPurchases(prev => prev.filter(p => p.productId !== productId));
      toast({ title: "Fichier supprimé", status: "success", duration: 3000 });
    } catch (error) {
      toast({ title: "Erreur lors de la suppression", status: "error" });
    }
  };

  const getFileIcon = (mediaType: string, fileName: string) => {
    const type = mediaType.toLowerCase();
    const name = fileName.toLowerCase();
    if (type.includes("video") || name.endsWith(".mp4") || name.endsWith(".mov")) return FaVideo;
    if (type.includes("audio") || name.endsWith(".mp3") || name.endsWith(".wav")) return FaMusic;
    if (type.includes("pdf") || name.endsWith(".pdf")) return FaFilePdf;
    return FaImage;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      day: "numeric", month: "short", year: "numeric"
    });
  };

  // ==========================================
  // ✅ MODE VISIONNEUR
  // ==========================================
  if (viewingFile && viewerUrl) {
    const fileNameLower = viewingFile.fileName.toLowerCase();
    const mediaLower = viewingFile.mediaType.toLowerCase();
    
    const isPdf = mediaLower.includes("pdf") || fileNameLower.endsWith(".pdf");
    const isVideo = mediaLower.includes("video") || fileNameLower.endsWith(".mp4") || fileNameLower.endsWith(".mov") || fileNameLower.endsWith(".webm");
    const isImage = mediaLower.includes("image") || fileNameLower.match(/\.(jpg|jpeg|png|gif|webp)$/);
    const isAudio = mediaLower.includes("audio") || fileNameLower.endsWith(".mp3") || fileNameLower.endsWith(".wav") || fileNameLower.endsWith(".m4a") || fileNameLower.endsWith(".ogg");

    return (
      <Box minH="100vh" bg={colors.bg} color={colors.text}>
        <Flex align="center" justify="space-between" p={4} borderBottom={`1px solid ${colors.border}`} bg={colors.card}>
          <HStack>
            <Button variant="ghost" color={colors.textMuted} leftIcon={<Icon as={FaArrowLeft} />} onClick={closeViewer}>
              Retour à mes achats
            </Button>
            <Text fontWeight="bold" fontSize="16px" noOfLines={1} maxW="300px" color={colors.text}>{viewingFile.fileName}</Text>
          </HStack>
        </Flex>

        <Box p={4} display="flex" justifyContent="center" alignItems="center" minH="calc(100vh - 80px)">
          
          {isImage && (
            <Box 
              as="img" 
              src={viewerUrl} 
              maxW="100%" 
              maxH="80vh" 
              borderRadius="12px" 
              objectFit="contain" 
              draggable={false}
              onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
            />
          )}

          {isVideo && (
            <Box maxW="100%" maxH="80vh" borderRadius="12px" overflow="hidden" bg={colors.mediaBg}>
              <video 
                src={viewerUrl} 
                controls 
                controlsList="nodownload"
                onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
                style={{ maxWidth: "100%", maxHeight: "80vh" }} 
              />
            </Box>
          )}

          {isPdf && (
            <Box w="100%" h="80vh" borderRadius="12px" overflow="hidden">
              <iframe 
                src={`${viewerUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                width="100%" 
                height="100%" 
                style={{ border: "none" }} 
                title="PDF Viewer"
              />
            </Box>
          )}

          {isAudio && (
            <Box maxW="100%" p={8} bg={colors.card} borderRadius="12px" border={`1px solid ${colors.border}`}>
              <audio 
                src={viewerUrl} 
                controls 
                autoPlay 
                style={{ width: "100%" }} 
                onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
              />
            </Box>
          )}

          {!isPdf && !isVideo && !isImage && !isAudio && (
            <VStack spacing={6}>
              <Icon as={FaLock} boxSize={20} color={colors.textMuted} />
              <Text color={colors.textMuted} textAlign="center" fontWeight="bold">
                Format de fichier spécifique
              </Text>
              <Text color={colors.textMuted} fontSize="14px" textAlign="center" maxW="400px" opacity={0.7}>
                Ce type de fichier ne peut pas être lu directement dans le navigateur.
              </Text>
              <Button as="a" href={viewerUrl} target="_blank" bg={colors.primary} color={colors.primaryText} _hover={{ opacity: 0.9 }}>
                Ouvrir le fichier
              </Button>
            </VStack>
          )}
        </Box>
      </Box>
    );
  }

  // ==========================================
  // ✅ MODE LISTE DES ACHATS
  // ==========================================
  return (
    <Box minH="100vh" bg={colors.bg} color={colors.text}>
      <Box position="sticky" top={0} zIndex={100} bg={colors.overlay} backdropFilter="blur(10px)" borderBottom={`1px solid ${colors.border}`} py={3} px={4}>
        <Flex align="center" maxW="1200px" mx="auto">
          <Button variant="ghost" color={colors.textMuted} leftIcon={<Icon as={FaArrowLeft} />} onClick={() => router.back()}>
            Retour
          </Button>
          <Text fontSize="20px" fontWeight="bold" ml={4} color={colors.text}>Mes Achats</Text>
        </Flex>
      </Box>

      <Box maxW="1200px" mx="auto" p={{ base: 4, md: 8 }}>
        {isLoading ? (
          <Center h="50vh">
            <Spinner thickness="4px" color={colors.primary} size="xl" />
          </Center>
        ) : purchases.length === 0 ? (
          <Center h="60vh">
            <VStack spacing={6}>
              <Box p={6} bg={colors.card} borderRadius="full">
                <Icon as={FaPlayCircle} boxSize={16} color={colors.textMuted} />
              </Box>
              <Text fontSize="20px" fontWeight="bold" color={colors.text}>Vous n'avez encore rien acheté</Text>
              <Text color={colors.textMuted} textAlign="center" maxW="400px">
                Les contenus que vous achetez apparaîtront ici pour un accès sécurisé hors ligne.
              </Text>
              <Button bg={colors.primary} color={colors.primaryText} _hover={{ opacity: 0.9 }} onClick={() => router.push("/explore")}>
                Découvrir la boutique
              </Button>
            </VStack>
          </Center>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {purchases.map((file) => (
              <Box
                key={file.productId}
                bg={colors.card}
                borderRadius="12px"
                border={`1px solid ${colors.border}`}
                p={5}
                _hover={{ borderColor: colors.primary, transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                <Flex align="start" justify="space-between" mb={4}>
                  <Box p={3} bg={colors.hover} borderRadius="10px">
                    <Icon as={getFileIcon(file.mediaType, file.fileName)} boxSize={8} color={colors.primary} />
                  </Box>
                  <Button
                    size="sm"
                    variant="ghost"
                    color={colors.textMuted}
                    _hover={{ color: colors.red, bg: "rgba(239, 68, 68, 0.1)" }}
                    onClick={() => handleDelete(file.productId, file.fileName)}
                  >
                    <Icon as={FaTrash} />
                  </Button>
                </Flex>

                <Text fontWeight="bold" fontSize="16px" mb={1} noOfLines={2} color={colors.text}>
                  {file.fileName}
                </Text>
                
                <HStack spacing={2} mb={4}>
                  <Badge colorScheme="purple" fontSize="10px" textTransform="uppercase">
                    {file.mediaType}
                  </Badge>
                  <Text fontSize="12px" color={colors.textMuted}>
                    Ajouté le {formatDate(file.downloadedAt)}
                  </Text>
                </HStack>

                <Button
                  w="100%"
                  bg={colors.primary}
                  color={colors.primaryText}
                  _hover={{ opacity: 0.9 }}
                  leftIcon={<Icon as={FaPlayCircle} />}
                  onClick={() => openFile(file)}
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