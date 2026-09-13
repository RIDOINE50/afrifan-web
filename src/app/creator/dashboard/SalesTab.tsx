"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";
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
  const { isDark, theme } = useAppTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [productStats, setProductStats] = useState<ProductStat[]>([]);
  
  const [debugMessage, setDebugMessage] = useState("");
  const [rawRowCount, setRawRowCount] = useState(0);

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
    green: "#10B981",
    orange: "#F97316",
    red: "#EF4444",
  };

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
        <Spinner thickness="4px" speed="0.65s" emptyColor={colors.border} color={colors.primary} size="xl" />
      </Center>
    );
  }

  return (
    <Box p={4}>
      <Box
        w="100%"
        p={3}
        mb={6}
        bg={rawRowCount > 0 ? "rgba(16, 185, 129, 0.1)" : "rgba(249, 115, 22, 0.1)"}
        borderRadius="8px"
        border="1px solid"
        borderColor={rawRowCount > 0 ? colors.green : colors.orange}
      >
        <Text fontSize="12px" fontWeight="bold" color={colors.text} mb={1}>
          🔍 DIAGNOSTIC BASE DE DONNÉES
        </Text>
        <Text fontSize="13px" color={colors.text} whiteSpace="pre-line">
          {debugMessage}
        </Text>
        <Text fontSize="12px" color={colors.textMuted} mt={1}>
          Somme calculée par Next.js : {formatPrice(totalRevenue)}
        </Text>
      </Box>

      <Flex gap={4} mb={6}>
        <Box flex={1} p={4} bg={colors.card} borderRadius="16px" border={`1px solid ${colors.border}`}>
          <Flex align="center" gap={2} mb={3}>
            <Icon as={FaWallet} color={colors.green} boxSize={5} />
            <Text color={colors.textMuted} fontSize="13px">Revenu Total</Text>
          </Flex>
          <Text color={colors.text} fontSize="24px" fontWeight="bold">
            {formatPrice(totalRevenue)}
          </Text>
        </Box>

        <Box flex={1} p={4} bg={colors.card} borderRadius="16px" border={`1px solid ${colors.border}`}>
          <Flex align="center" gap={2} mb={3}>
            <Icon as={FaShoppingCart} color={colors.primary} boxSize={5} />
            <Text color={colors.textMuted} fontSize="13px">Ventes Totales</Text>
          </Flex>
          <Text color={colors.text} fontSize="24px" fontWeight="bold">
            {totalSales}
          </Text>
        </Box>
      </Flex>
      
      <Text color={colors.text} fontSize="18px" fontWeight="bold" mb={3}>
        Performance par produit
      </Text>

      {productStats.length === 0 ? (
        <Center py={16}>
          <VStack>
            <Icon as={FaChartBar} color={colors.textMuted} boxSize={12} />
            <Text color={colors.text} fontSize="16px" fontWeight="bold">
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
              bg={colors.card}
              borderRadius="12px"
              border={`1px solid ${colors.border}`}
            >
              <Flex align="center" gap={4}>
                <Box
                  w={12}
                  h={12}
                  bg={colors.hover}
                  borderRadius="8px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={getIcon(stat.media_type)} color={colors.primary} boxSize={6} />
                </Box>

                <Box flex={1}>
                  <Text color={colors.text} fontWeight="bold" fontSize="15px" noOfLines={2}>
                    {stat.title}
                  </Text>
                  <Text color={colors.textMuted} fontSize="13px" mt={1}>
                    {stat.sales_count} vente{stat.sales_count > 1 ? "s" : ""}
                  </Text>
                </Box>

                <VStack align="flex-end" spacing={1}>
                  <Text color={colors.green} fontWeight="bold" fontSize="16px">
                    {formatPrice(stat.revenue)}
                  </Text>
                  <Badge
                    px={2}
                    py={1}
                    bg="rgba(16, 185, 129, 0.1)"
                    color={colors.green}
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