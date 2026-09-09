"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Box,
  Flex,
  Text,
  Button,
  Spinner,
  Center,
  VStack,
  SimpleGrid,
  Icon,
  Badge,
  Image,
  useToast,
} from "@chakra-ui/react";
import {
  FaStore,
  FaPlus,
  FaVideo,
  FaImage,
  FaFileAlt,
  FaEdit,
  FaTrash,
} from "react-icons/fa";

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  media_type: string;
  media_url?: string;
  status: string;
  created_at: string;
}

export default function CreatorShopTab() {
  const router = useRouter();
  const toast = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      console.error("❌ Erreur chargement boutique:", error);
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

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;

    try {
      const { error } = await supabase
        .from("digital_products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Produit supprimé avec succès",
        status: "success",
        duration: 3000,
      });

      loadProducts();
    } catch (error: any) {
      console.error("❌ Erreur suppression:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit",
        status: "error",
        duration: 3000,
      });
    }
  };

  if (isLoading) {
    return (
      <Center h="400px">
        <Spinner thickness="4px" speed="0.65s" emptyColor="#2A2A2A" color="#8B5CF6" size="xl" />
      </Center>
    );
  }

  if (products.length === 0) {
    return (
      <Center py={16}>
        <VStack spacing={6}>
          <Box p={6} bg="#8B5CF6/10" borderRadius="full">
            <Icon as={FaStore} color="#8B5CF6" boxSize={12} />
          </Box>
          
          <Text color="white" fontSize="18px" fontWeight="bold">
            Votre boutique est vide
          </Text>
          
          <Text color="gray.400" fontSize="14px" textAlign="center" maxW="300px">
            Commencez à vendre vos créations numériques dès maintenant.
          </Text>

          <Button
            leftIcon={<Icon as={FaPlus} />}
            bg="#8B5CF6"
            color="white"
            _hover={{ bg: "#7C3AED" }}
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
            bg="#1A1A1A"
            borderRadius="16px"
            border="1px solid"
            borderColor={product.status === "published" ? "#2A2A2A" : "orange.500"}
            overflow="hidden"
            position="relative"
            _hover={{ transform: "translateY(-2px)", transition: "transform 0.2s" }}
          >
            {product.status === "draft" && (
              <Box position="absolute" top={2} right={2} zIndex={10}>
                <Badge
                  px={2}
                  py={1}
                  bg="orange.500"
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
              bg="gray.800"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {product.media_url ? (
                <Image
                  src={product.media_url}
                  alt={product.title}
                  objectFit="cover"
                  w="100%"
                  h="100%"
                />
              ) : (
                <Icon as={getIcon(product.media_type)} color="gray.500" boxSize={10} />
              )}
            </Box>

            <Box p={3}>
              <Text color="white" fontWeight="bold" fontSize="14px" noOfLines={2} mb={2}>
                {product.title || "Sans titre"}
              </Text>

              <Flex justify="space-between" align="center">
                <Text color="#8B5CF6" fontWeight="bold" fontSize="16px">
                  {formatPrice(product.price)}
                </Text>

                <Flex gap={1}>
                  <Button
                    size="xs"
                    variant="ghost"
                    color="gray.400"
                    _hover={{ color: "white", bg: "whiteAlpha.100" }}
                    onClick={() => router.push(`/creator/products/${product.id}/edit`)}
                  >
                    <Icon as={FaEdit} />
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    color="gray.400"
                    _hover={{ color: "red.400", bg: "red.500/10" }}
                    onClick={() => handleDeleteProduct(product.id)}
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
        bg="#8B5CF6"
        color="white"
        _hover={{ bg: "#7C3AED" }}
        leftIcon={<Icon as={FaPlus} />}
        borderRadius="full"
        px={6}
        py={4}
        boxShadow="0 4px 12px rgba(139, 92, 246, 0.4)"
        onClick={() => router.push("/creator/products/new")}
        zIndex={100}
      >
        Nouveau
      </Button>
    </Box>
  );
}