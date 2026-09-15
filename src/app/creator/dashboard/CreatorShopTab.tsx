"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";
import {
  Box,
  Flex,
  Text,
  Button,
  Spinner,
  Center,
  VStack,
  HStack,
  SimpleGrid,
  Icon,
  Badge,
  Image,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from "@chakra-ui/react";
import {
  FaStore,
  FaPlus,
  FaVideo,
  FaImage,
  FaFileAlt,
  FaEdit,
  FaTrash,
  FaExclamationTriangle,
} from "react-icons/fa";

// ✅ Interface mise à jour avec preview_url au lieu de media_url
interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  media_type: string;
  preview_url?: string;  // ✅ Pour l'affichage (miniature)
  file_url?: string;     // ✅ Pour le téléchargement (fichier réel)
  status: string;
  created_at: string;
}

export default function CreatorShopTab() {
  const router = useRouter();
  const toast = useToast();
  const { isDark, theme } = useAppTheme();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const colors = {
    bg: theme.bg,
    card: theme.card,
    border: theme.border,
    primary: theme.primary,
    primaryText: theme.primaryText,
    text: theme.text,
    textMuted: theme.textMuted,
    hover: theme.hover,
    red: "#EF4444",
    orange: "#F97316",
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("digital_products")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProducts(data || []);
    } catch (error: any) {
      console.error("Erreur chargement boutique:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos produits",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    return `${price.toFixed(0)} FCFA`;
  };

  const getIcon = (mediaType: string) => {
    switch (mediaType) {
      case "video": return FaVideo;
      case "image": return FaImage;
      default: return FaFileAlt;
    }
  };

  const askDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    onDeleteOpen();
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("digital_products")
        .delete()
        .eq("id", productToDelete.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Produit supprimé avec succès",
        status: "success",
        duration: 3000,
      });

      onDeleteClose();
      setProductToDelete(null);
      loadProducts();
    } catch (error: any) {
      console.error("Erreur suppression:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Center h="400px">
        <Spinner thickness="4px" speed="0.65s" emptyColor={colors.border} color={colors.primary} size="xl" />
      </Center>
    );
  }

  if (products.length === 0) {
    return (
      <Center py={16}>
        <VStack spacing={6}>
          <Box p={6} bg={colors.hover} borderRadius="full">
            <Icon as={FaStore} color={colors.primary} boxSize={12} />
          </Box>
          
          <Text color={colors.text} fontSize="18px" fontWeight="bold">
            Votre boutique est vide
          </Text>
          
          <Text color={colors.textMuted} fontSize="14px" textAlign="center" maxW="300px">
            Commencez à vendre vos créations numériques dès maintenant.
          </Text>

          <Button
            leftIcon={<Icon as={FaPlus} />}
            bg={colors.primary}
            color={colors.primaryText}
            _hover={{ opacity: 0.9 }}
            px={6}
            py={3}
            borderRadius="20px"
            fontWeight="bold"
            onClick={() => router.push("/creator/products/new")}
          >
            Ajouter mon premier produit
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box position="relative">
      <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={3} p={4}>
        {products.map((product) => (
          <Box
            key={product.id}
            bg={colors.card}
            borderRadius="16px"
            border="1px solid"
            borderColor={product.status === "published" ? colors.border : colors.orange}
            overflow="hidden"
            position="relative"
            _hover={{ transform: "translateY(-2px)", transition: "transform 0.2s" }}
          >
            {product.status === "draft" && (
              <Box position="absolute" top={2} right={2} zIndex={10}>
                <Badge
                  px={2}
                  py={1}
                  bg={colors.orange}
                  color="white"
                  borderRadius="8px"
                  fontSize="9px"
                  fontWeight="bold"
                >
                  Brouillon
                </Badge>
              </Box>
            )}

            <Box
              aspectRatio="4/3"
              bg={colors.hover}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {/* ✅ CORRECTION ICI : preview_url au lieu de media_url */}
              {product.preview_url ? (
                <Image
                  src={product.preview_url}
                  alt={product.title}
                  objectFit="cover"
                  w="100%"
                  h="100%"
                />
              ) : (
                <Icon as={getIcon(product.media_type)} color={colors.textMuted} boxSize={10} />
              )}
            </Box>

            <Box p={3}>
              <Text color={colors.text} fontWeight="bold" fontSize="14px" noOfLines={2} mb={2}>
                {product.title || "Sans titre"}
              </Text>

              <Flex justify="space-between" align="center">
                <Text color={colors.primary} fontWeight="bold" fontSize="16px">
                  {formatPrice(product.price)}
                </Text>

                <Flex gap={1}>
                  <Button
                    size="xs"
                    variant="ghost"
                    color={colors.textMuted}
                    _hover={{ color: colors.text, bg: colors.hover }}
                    onClick={() => router.push(`/creator/products/${product.id}/edit`)}
                  >
                    <Icon as={FaEdit} />
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    color={colors.textMuted}
                    _hover={{ color: colors.red, bg: "rgba(239, 68, 68, 0.1)" }}
                    onClick={() => askDeleteProduct(product)}
                  >
                    <Icon as={FaTrash} />
                  </Button>
                </Flex>
              </Flex>
            </Box>
          </Box>
        ))}
      </SimpleGrid>

      <Button
        position="fixed"
        bottom={6}
        right={6}
        bg={colors.primary}
        color={colors.primaryText}
        _hover={{ opacity: 0.9 }}
        leftIcon={<Icon as={FaPlus} />}
        borderRadius="full"
        px={6}
        py={4}
        boxShadow={isDark ? "0 4px 12px rgba(255,255,255,0.2)" : "0 4px 12px rgba(0,0,0,0.15)"}
        onClick={() => router.push("/creator/products/new")}
        zIndex={100}
      >
        Nouveau
      </Button>

      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered size="sm">
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
        <ModalContent
          bg={colors.card}
          color={colors.text}
          borderRadius="16px"
          border={`1px solid ${colors.border}`}
        >
          <ModalCloseButton color={colors.textMuted} _hover={{ bg: colors.hover }} />
          
          <ModalBody pt={8} pb={4}>
            <VStack spacing={4}>
              <Box
                p={4}
                bg="rgba(239, 68, 68, 0.1)"
                borderRadius="full"
                border="2px solid rgba(239, 68, 68, 0.3)"
              >
                <Icon as={FaExclamationTriangle} color={colors.red} boxSize={8} />
              </Box>

              <Text fontSize="18px" fontWeight="bold" textAlign="center">
                Supprimer ce produit ?
              </Text>

              <Text fontSize="14px" color={colors.textMuted} textAlign="center">
                <Text as="span" fontWeight="bold" color={colors.text}>
                  "{productToDelete?.title || "Sans titre"}"
                </Text>
                {" "}sera définitivement supprimé. Cette action est irréversible.
              </Text>
            </VStack>
          </ModalBody>

          <ModalFooter gap={2} pb={5}>
            <Button
              flex={1}
              bg="transparent"
              color={colors.text}
              border={`1px solid ${colors.border}`}
              _hover={{ bg: colors.hover }}
              onClick={onDeleteClose}
              isDisabled={isDeleting}
              borderRadius="10px"
            >
              Annuler
            </Button>
            <Button
              flex={1}
              bg={colors.red}
              color="white"
              _hover={{ opacity: 0.9 }}
              onClick={confirmDeleteProduct}
              isLoading={isDeleting}
              loadingText="Suppression..."
              borderRadius="10px"
            >
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}