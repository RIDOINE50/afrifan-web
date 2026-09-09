"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Box,
  Flex,
  Text,
  Spinner,
  Center,
  VStack,
  Icon,
  Badge,
} from "@chakra-ui/react";
import {
  FaWallet,
  FaShoppingCart,
  FaVideo,
  FaImage,
  FaMusic,
  FaFileAlt,
  FaChartBar,
} from "react-icons/fa";

interface ProductStat {
  id: string;
  title: string;
  media_type: string;
  sales_count: number;
  revenue: number;
}

export default function SalesTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [productStats, setProductStats] = useState<ProductStat[]>([]);
  
  const [debugMessage, setDebugMessage] = useState("");
  const [rawRowCount, setRawRowCount] = useState(0);

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: purchases, error } = await supabase
        .from("product_purchases")
        .select(`
          product_id,
          amount_paid,
          payment_status,
          digital_products (
            id,
            title,
            media_type
          )
        `)
        .eq("creator_id", user.id)
        .eq("payment_status", "completed")
        .order("purchase_date", { ascending: false });

      if (error) throw error;

      if (purchases) {
        setRawRowCount(purchases.length);
        
        if (purchases.length === 0) {
          setDebugMessage("⚠️ 0 vente trouvée avec le statut \"completed\".\nVérifie si ton achat test est bien passé en \"completed\" dans Supabase.");
        } else {
          setDebugMessage(`✅ ${purchases.length} vente(s) "completed" trouvée(s) en base de données.`);
        }

        const statsMap: Record<string, ProductStat> = {};
        let totalRev = 0;
        let totalSalesCount = 0;

        purchases.forEach((purchase: any) => {
          totalSalesCount++;
          
          const amount = (purchase.amount_paid as number) || 0;
          totalRev += amount;

          const productId = purchase.product_id || "inconnu";
          const product = purchase.digital_products;
          
          const title = product?.title || `Produit inconnu (ID: ${productId})`;
          const mediaType = product?.media_type || "file";

          if (!statsMap[productId]) {
            statsMap[productId] = {
              id: productId,
              title: title,
              media_type: mediaType,
              sales_count: 0,
              revenue: 0,
            };
          }
          
          statsMap[productId].sales_count += 1;
          statsMap[productId].revenue += amount;
        });

        const statsArray = Object.values(statsMap);
        statsArray.sort((a, b) => b.revenue - a.revenue);

        setProductStats(statsArray);
        setTotalRevenue(totalRev);
        setTotalSales(totalSalesCount);
      }
    } catch (error: any) {
      console.error("❌ ERREUR chargement ventes:", error);
      setDebugMessage(`❌ ERREUR : ${error.message}`);
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
      case "audio": return FaMusic;
      default: return FaFileAlt;
    }
  };

  if (isLoading) {
    return (
      <Center h="400px">
        <Spinner thickness="4px" speed="0.65s" emptyColor="#2A2A2A" color="#8B5CF6" size="xl" />
      </Center>
    );
  }

  return (
    <Box p={4}>
      <Box
        w="100%"
        p={3}
        mb={6}
        bg={rawRowCount > 0 ? "green.500/20" : "orange.500/20"}
        borderRadius="8px"
        border="1px solid"
        borderColor={rawRowCount > 0 ? "green.500" : "orange.500"}
      >
        <Text fontSize="12px" fontWeight="bold" color="white" mb={1}>
          🔍 DIAGNOSTIC BASE DE DONNÉES
        </Text>
        <Text fontSize="13px" color="white" whiteSpace="pre-line">
          {debugMessage}
        </Text>
        <Text fontSize="12px" color="gray.300" mt={1}>
          Somme calculée par Next.js : {formatPrice(totalRevenue)}
        </Text>
      </Box>

      <Flex gap={4} mb={6}>
        <Box flex={1} p={4} bg="#1A1A1A" borderRadius="16px" border="1px solid #2A2A2A">
          <Flex align="center" gap={2} mb={3}>
            <Icon as={FaWallet} color="#10B981" boxSize={5} />
            <Text color="gray.400" fontSize="13px">Revenu Total</Text>
          </Flex>
          <Text color="white" fontSize="24px" fontWeight="bold">
            {formatPrice(totalRevenue)}
          </Text>
        </Box>

        <Box flex={1} p={4} bg="#1A1A1A" borderRadius="16px" border="1px solid #2A2A2A">
          <Flex align="center" gap={2} mb={3}>
            <Icon as={FaShoppingCart} color="#8B5CF6" boxSize={5} />
            <Text color="gray.400" fontSize="13px">Ventes Totales</Text>
          </Flex>
          <Text color="white" fontSize="24px" fontWeight="bold">
            {totalSales}
          </Text>
        </Box>
      </Flex>
      
      <Text color="white" fontSize="18px" fontWeight="bold" mb={3}>
        Performance par produit
      </Text>

      {productStats.length === 0 ? (
        <Center py={16}>
          <VStack>
            <Icon as={FaChartBar} color="gray.500" boxSize={12} />
            <Text color="white" fontSize="16px" fontWeight="bold">
              Aucune vente pour le moment
            </Text>
          </VStack>
        </Center>
      ) : (
        <VStack spacing={3} align="stretch">
          {productStats.map((stat) => (
            <Box
              key={stat.id}
              p={4}
              bg="#1A1A1A"
              borderRadius="12px"
              border="1px solid #2A2A2A"
            >
              <Flex align="center" gap={4}>
                <Box
                  w={12}
                  h={12}
                  bg="#8B5CF6/20"
                  borderRadius="8px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={getIcon(stat.media_type)} color="#8B5CF6" boxSize={6} />
                </Box>

                <Box flex={1}>
                  <Text color="white" fontWeight="bold" fontSize="15px" noOfLines={2}>
                    {stat.title}
                  </Text>
                  <Text color="gray.400" fontSize="13px" mt={1}>
                    {stat.sales_count} vente{stat.sales_count > 1 ? "s" : ""}
                  </Text>
                </Box>

                <VStack align="flex-end" spacing={1}>
                  <Text color="#10B981" fontWeight="bold" fontSize="16px">
                    {formatPrice(stat.revenue)}
                  </Text>
                  <Badge
                    px={2}
                    py={1}
                    bg="green.500/10"
                    color="#10B981"
                    borderRadius="8px"
                    fontSize="11px"
                    fontWeight="bold"
                  >
                    Revenu
                  </Badge>
                </VStack>
              </Flex>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
}