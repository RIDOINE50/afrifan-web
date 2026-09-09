"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Box, Flex, Text, Button, Spinner, Center, VStack, HStack,
  Divider, useToast, Icon, Avatar, Image,
} from "@chakra-ui/react";
import {
  FaArrowLeft, FaDownload, FaLock, FaCheckCircle,
  FaFilePdf, FaImage, FaVideo, FaShoppingCart, FaPlayCircle,
} from "react-icons/fa";
// ✅ IMPORT CORRIGÉ
import { savePurchasedFile, getPurchasedFileUrl } from "@/lib/localStorage";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const productId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isStoredLocally, setIsStoredLocally] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      await fetchProductAndStatus(user?.id);
    };
    init();
  }, [productId]);

  const fetchProductAndStatus = async (userId: string | undefined) => {
    try {
      const { data: productData, error: productError } = await supabase
        .from("digital_products")
        .select("*, profiles!inner(full_name, username, avatar_url)")
        .eq("id", productId)
        .single();

      if (productError) throw productError;
      setProduct(productData);

      if (userId) {
        const { data: purchaseData } = await supabase
          .from("product_purchases")
          .select("id")
          .eq("product_id", productId)
          .eq("buyer_id", userId)
          .eq("payment_status", "completed")
          .maybeSingle();

        setHasPurchased(!!purchaseData);

        if (purchaseData) {
          // ✅ VÉRIFICATION : getPurchasedFileUrl retourne l'URL ou null
          const storedUrl = await getPurchasedFileUrl(productId);
          setIsStoredLocally(storedUrl !== null);
        }
      }
    } catch (error) {
      console.error("❌ Erreur chargement produit:", error);
      toast({ title: "Produit introuvable", status: "error", duration: 3000 });
      router.push("/creator/dashboard?tab=shop");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAndStore = async () => {
    if (!product) return;
    setIsDownloading(true);
    try {
      const fileUrl = product.file_url || product.media_url;
      if (!fileUrl) throw new Error("Aucune URL de fichier disponible");

      console.log('🔍 URL brute dans la BDD:', fileUrl);

      let filePath = '';
      try {
        const urlObj = new URL(fileUrl);
        const pathMatch = urlObj.pathname.match(/\/object\/(?:public|sign)\/[^\/]+\/(.+)/);
        if (pathMatch && pathMatch[1]) {
          filePath = decodeURIComponent(pathMatch[1]);
        } else {
          throw new Error("Format d'URL non reconnu");
        }
      } catch (e) {
        filePath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
      }

      console.log('📂 Chemin extrait et décodé:', filePath);

      const BUCKET_NAME = 'digital_products';

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, 300);

      if (error) {
        console.error('❌ Erreur Supabase createSignedUrl:', error);
        throw new Error(`Erreur Supabase: ${error.message}`);
      }

      if (!data?.signedUrl) {
        throw new Error("Impossible de générer l'URL de téléchargement");
      }

      console.log('✅ URL signée générée avec succès');

      const response = await fetch(data.signedUrl);
      if (!response.ok) throw new Error("Le serveur a refusé le téléchargement du fichier");

      const blob = await response.blob();
      console.log('📦 Fichier téléchargé en mémoire, taille:', blob.size, 'bytes');

      const originalFileName = fileUrl.split('/').pop() || `${product.title || 'fichier'}.${product.media_type === 'video' ? 'mp4' : product.media_type === 'image' ? 'jpg' : 'pdf'}`;

      // ✅ SAUVEGARDE CORRECTE
      await savePurchasedFile(
        productId,
        originalFileName,
        product.media_type || "file",
        blob
      );

      setIsStoredLocally(true);
      toast({
        title: "✅ Fichier enregistré dans l'application",
        description: "Il reste ici, vous pouvez y accéder à tout moment.",
        status: "success",
        duration: 4000
      });

      const localUrl = URL.createObjectURL(blob);
      setViewerUrl(localUrl);
      setShowViewer(true);

    } catch (error: any) {
      console.error("❌ Échec complet du téléchargement:", error);
      toast({
        title: "Échec du téléchargement",
        description: error.message || "Vérifiez que le fichier existe dans le bucket.",
        status: "error",
        duration: 5000
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const openStoredFile = async () => {
    // ✅ OUVERTURE CORRECTE
    const url = await getPurchasedFileUrl(productId);
    if (url) {
      setViewerUrl(url);
      setShowViewer(true);
    } else {
      toast({ title: "Fichier introuvable", status: "error" });
    }
  };

  const goToPayment = () => {
    if (!user) {
      toast({ title: "Connexion requise", status: "warning" });
      router.push("/login");
      return;
    }
    const queryParams = new URLSearchParams({
      type: "product",
      productId: productId,
      price: product.price.toString(),
      productName: product.title,
      creatorId: product.creator_id,
      creatorName: product.profiles?.full_name || product.profiles?.username || "Créateur"
    });
    router.push(`/subscribe/${product.creator_id}?${queryParams.toString()}`);
  };

  if (isLoading) {
    return (
      <Center h="100vh" bg="#0A0A0A">
        <Spinner thickness="4px" color="#8B5CF6" size="xl" />
      </Center>
    );
  }

  if (!product) return null;

  const fileUrl = product.file_url || product.media_url;
  const mediaType = product.media_type || "file";
  const isPdf = mediaType === "file" || product.title?.toLowerCase().endsWith(".pdf");

  if (showViewer && viewerUrl) {
    return (
      <Box minH="100vh" bg="#0A0A0A" color="white">
        <Flex align="center" justify="space-between" p={4} borderBottom="1px solid #2A2A2A" bg="#1A1A1A">
          <HStack>
            <Button variant="ghost" color="gray.400" leftIcon={<Icon as={FaArrowLeft} />} onClick={() => setShowViewer(false)}>
              Retour
            </Button>
            <Text fontWeight="bold" fontSize="16px" noOfLines={1} maxW="300px">{product.title}</Text>
          </HStack>
          <Box px={3} py={1} bg="green.500/20" borderRadius="full">
            <Text fontSize="11px" color="green.400" fontWeight="bold">📱 Stocké dans l'app</Text>
          </Box>
        </Flex>

        <Box p={4} display="flex" justifyContent="center" alignItems="center" minH="calc(100vh - 80px)">
          {mediaType === "image" && (
            <Box maxW="100%" maxH="80vh" borderRadius="12px" overflow="hidden">
              <Image src={viewerUrl} alt={product.title} objectFit="contain" maxH="80vh" />
            </Box>
          )}
          {mediaType === "video" && (
            <Box maxW="100%" maxH="80vh" borderRadius="12px" overflow="hidden" bg="black">
              <video src={viewerUrl} controls autoPlay style={{ maxWidth: "100%", maxHeight: "80vh" }} />
            </Box>
          )}
          {isPdf && (
            <Box w="100%" h="80vh" borderRadius="12px" overflow="hidden">
              <iframe src={viewerUrl} width="100%" height="100%" style={{ border: "none" }} />
            </Box>
          )}
          {!["image", "video"].includes(mediaType) && !isPdf && (
            <VStack spacing={6}>
              <Icon as={FaFilePdf} boxSize={20} color="gray.500" />
              <Text color="gray.400">Ce format ne peut pas être prévisualisé dans l'application.</Text>
            </VStack>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="#0A0A0A" color="white">
      <Box position="sticky" top={0} zIndex={100} bg="rgba(10,10,10,0.95)" backdropFilter="blur(10px)" borderBottom="1px solid #2A2A2A" py={3} px={4}>
        <Flex align="center" maxW="1000px" mx="auto">
          <Button variant="ghost" color="gray.400" leftIcon={<Icon as={FaArrowLeft} />} onClick={() => router.back()}>
            Retour
          </Button>
        </Flex>
      </Box>

      <Box maxW="1000px" mx="auto" p={{ base: 4, md: 8 }}>
        <Flex direction={{ base: "column", md: "row" }} gap={8}>
          <Box flex={1}>
            <Box aspectRatio="16/9" bg="#1A1A1A" borderRadius="16px" border="1px solid #2A2A2A" display="flex" alignItems="center" justifyContent="center" mb={6} overflow="hidden" position="relative">
              {fileUrl && !hasPurchased ? (
                <>
                  <Image src={fileUrl} alt={product.title} w="100%" h="100%" objectFit="cover" filter="blur(8px)" />
                  <Box position="absolute" inset={0} bg="rgba(0,0,0,0.6)" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                    <Icon as={FaLock} boxSize={12} color="#8B5CF6" mb={3} />
                    <Text fontWeight="bold" fontSize="18px">Contenu protégé</Text>
                    <Text color="gray.400" fontSize="14px">Achetez ce produit pour y accéder</Text>
                  </Box>
                </>
              ) : fileUrl ? (
                <Image src={fileUrl} alt={product.title} w="100%" h="100%" objectFit="cover" />
              ) : (
                <Icon as={mediaType === "video" ? FaVideo : FaImage} boxSize={20} color="gray.600" />
              )}
            </Box>

            <Text fontSize={{ base: "24px", md: "32px" }} fontWeight="bold" mb={2}>{product.title}</Text>
            <HStack spacing={3} mb={6}>
              <Avatar size="sm" name={product.profiles?.username} src={product.profiles?.avatar_url} />
              <Text color="gray.400" fontSize="14px">
                Créé par <Text as="span" color="white" fontWeight="bold">{product.profiles?.full_name || product.profiles?.username}</Text>
              </Text>
            </HStack>

            <Box bg="#1A1A1A" p={5} borderRadius="12px" border="1px solid #2A2A2A">
              <Text fontSize="16px" fontWeight="bold" mb={3}>Description</Text>
              <Text color="gray.300" lineHeight="1.7" whiteSpace="pre-wrap">
                {product.description || "Aucune description."}
              </Text>
            </Box>
          </Box>

          <Box w={{ base: "100%", md: "350px" }}>
            <Box bg="#1A1A1A" p={6} borderRadius="16px" border="1px solid #2A2A2A" position="sticky" top="100px">
              <Text fontSize="14px" color="gray.400" mb={1}>Prix</Text>
              <Text fontSize="36px" fontWeight="bold" color="#8B5CF6" mb={6}>
                {product.price.toLocaleString('fr-FR')} FCFA
              </Text>

              <Divider borderColor="#2A2A2A" mb={6} />

              {hasPurchased ? (
                <VStack spacing={4} w="100%">
                  <HStack color="#10B981" spacing={2}>
                    <Icon as={FaCheckCircle} boxSize={5} />
                    <Text fontWeight="bold">Achat confirmé</Text>
                  </HStack>

                  {isStoredLocally ? (
                    <>
                      <Box w="100%" p={3} bg="green.500/10" borderRadius="8px" border="1px solid green.500/30">
                        <HStack>
                          <Icon as={FaCheckCircle} color="green.400" />
                          <Text fontSize="13px" color="green.400" fontWeight="bold">
                            Fichier stocké dans l'application
                          </Text>
                        </HStack>
                      </Box>
                      <Button
                        w="100%"
                        bg="#10B981"
                        color="white"
                        _hover={{ bg: "#059669" }}
                        leftIcon={<Icon as={FaPlayCircle} />}
                        size="lg"
                        fontWeight="bold"
                        onClick={openStoredFile}
                      >
                        Ouvrir le contenu
                      </Button>
                    </>
                  ) : (
                    <Button
                      w="100%"
                      bg="#8B5CF6"
                      color="white"
                      _hover={{ bg: "#7C3AED" }}
                      leftIcon={<Icon as={FaDownload} />}
                      size="lg"
                      fontWeight="bold"
                      isLoading={isDownloading}
                      loadingText="Enregistrement..."
                      onClick={handleDownloadAndStore}
                    >
                      Enregistrer dans l'application
                    </Button>
                  )}
                </VStack>
              ) : (
                <VStack spacing={4} w="100%">
                  <Text color="gray.300" fontSize="14px" textAlign="center">
                    En achetant ce produit, vous obtenez un accès permanent au contenu.
                  </Text>
                  <Button
                    w="100%"
                    bg="#8B5CF6"
                    color="white"
                    _hover={{ bg: "#7C3AED" }}
                    size="lg"
                    fontWeight="bold"
                    leftIcon={<Icon as={FaShoppingCart} />}
                    onClick={goToPayment}
                  >
                    Acheter maintenant
                  </Button>
                </VStack>
              )}
            </Box>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
}