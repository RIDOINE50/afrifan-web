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

// ✅ CORRECTION DES IMPORTS : On utilise maintenant les fonctions dédiées aux ACHATS
import { getAllPurchasedFiles, deletePurchasedFile } from "@/lib/localStorage";

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
  
  const [purchases, setPurchases] = useState<PurchasedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingFile, setViewingFile] = useState<PurchasedFile | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    setIsLoading(true);
    try {
      // ✅ Utilisation de la bonne fonction pour les achats
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
      URL.revokeObjectURL(viewerUrl); // Libérer la mémoire
    }
    setViewerUrl(null);
    setViewingFile(null);
  };

  const handleDelete = async (productId: string, fileName: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer "${fileName}" de votre appareil ?`)) return;
    
    try {
      // ✅ Utilisation de la bonne fonction de suppression pour les achats
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
  // ✅ MODE VISIONNEUR (Verrouillé : PAS de sortie de l'app)
  // ==========================================
  if (viewingFile && viewerUrl) {
    const fileNameLower = viewingFile.fileName.toLowerCase();
    const mediaLower = viewingFile.mediaType.toLowerCase();
    
    const isPdf = mediaLower.includes("pdf") || fileNameLower.endsWith(".pdf");
    const isVideo = mediaLower.includes("video") || fileNameLower.endsWith(".mp4") || fileNameLower.endsWith(".mov") || fileNameLower.endsWith(".webm");
    const isImage = mediaLower.includes("image") || fileNameLower.match(/\.(jpg|jpeg|png|gif|webp)$/);
    const isAudio = mediaLower.includes("audio") || fileNameLower.endsWith(".mp3") || fileNameLower.endsWith(".wav") || fileNameLower.endsWith(".m4a") || fileNameLower.endsWith(".ogg");

    return (
      <Box minH="100vh" bg="#0A0A0A" color="white">
        <Flex align="center" justify="space-between" p={4} borderBottom="1px solid #2A2A2A" bg="#1A1A1A">
          <HStack>
            <Button variant="ghost" color="gray.400" leftIcon={<Icon as={FaArrowLeft} />} onClick={closeViewer}>
              Retour à mes achats
            </Button>
            <Text fontWeight="bold" fontSize="16px" noOfLines={1} maxW="300px">{viewingFile.fileName}</Text>
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
            <Box maxW="100%" maxH="80vh" borderRadius="12px" overflow="hidden" bg="black">
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
            <Box maxW="100%" p={8} bg="#1A1A1A" borderRadius="12px" border="1px solid #2A2A2A">
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
              <Icon as={FaLock} boxSize={20} color="gray.500" />
              <Text color="gray.400" textAlign="center" fontWeight="bold">
                Format de fichier spécifique
              </Text>
              <Text color="gray.500" fontSize="14px" textAlign="center" maxW="400px">
                Ce type de fichier ne peut pas être lu directement dans le navigateur.
              </Text>
              <Button as="a" href={viewerUrl} target="_blank" bg="#8B5CF6" color="white" _hover={{ bg: "#7C3AED" }}>
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
    <Box minH="100vh" bg="#0A0A0A" color="white">
      <Box position="sticky" top={0} zIndex={100} bg="rgba(10,10,10,0.95)" backdropFilter="blur(10px)" borderBottom="1px solid #2A2A2A" py={3} px={4}>
        <Flex align="center" maxW="1200px" mx="auto">
          <Button variant="ghost" color="gray.400" leftIcon={<Icon as={FaArrowLeft} />} onClick={() => router.back()}>
            Retour
          </Button>
          <Text fontSize="20px" fontWeight="bold" ml={4}>Mes Achats</Text>
        </Flex>
      </Box>

      <Box maxW="1200px" mx="auto" p={{ base: 4, md: 8 }}>
        {isLoading ? (
          <Center h="50vh">
            <Spinner thickness="4px" color="#8B5CF6" size="xl" />
          </Center>
        ) : purchases.length === 0 ? (
          <Center h="60vh">
            <VStack spacing={6}>
              <Box p={6} bg="#1A1A1A" borderRadius="full">
                <Icon as={FaPlayCircle} boxSize={16} color="gray.600" />
              </Box>
              <Text fontSize="20px" fontWeight="bold">Vous n'avez encore rien acheté</Text>
              <Text color="gray.400" textAlign="center" maxW="400px">
                Les contenus que vous achetez apparaîtront ici pour un accès sécurisé hors ligne.
              </Text>
              <Button bg="#8B5CF6" color="white" _hover={{ bg: "#7C3AED" }} onClick={() => router.push("/explore")}>
                Découvrir la boutique
              </Button>
            </VStack>
          </Center>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {purchases.map((file) => (
              <Box
                key={file.productId}
                bg="#1A1A1A"
                borderRadius="12px"
                border="1px solid #2A2A2A"
                p={5}
                _hover={{ borderColor: "#8B5CF6", transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                <Flex align="start" justify="space-between" mb={4}>
                  <Box p={3} bg="#8B5CF6/10" borderRadius="10px">
                    <Icon as={getFileIcon(file.mediaType, file.fileName)} boxSize={8} color="#8B5CF6" />
                  </Box>
                  <Button
                    size="sm"
                    variant="ghost"
                    color="gray.500"
                    _hover={{ color: "red.400", bg: "red.500/10" }}
                    onClick={() => handleDelete(file.productId, file.fileName)}
                  >
                    <Icon as={FaTrash} />
                  </Button>
                </Flex>

                <Text fontWeight="bold" fontSize="16px" mb={1} noOfLines={2}>
                  {file.fileName}
                </Text>
                
                <HStack spacing={2} mb={4}>
                  <Badge colorScheme="purple" fontSize="10px" textTransform="uppercase">
                    {file.mediaType}
                  </Badge>
                  <Text fontSize="12px" color="gray.500">
                    Ajouté le {formatDate(file.downloadedAt)}
                  </Text>
                </HStack>

                <Button
                  w="100%"
                  bg="#8B5CF6"
                  color="white"
                  _hover={{ bg: "#7C3AED" }}
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