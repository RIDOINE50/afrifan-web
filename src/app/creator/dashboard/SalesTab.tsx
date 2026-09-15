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
  HStack,
} from "@chakra-ui/react";
import {
  FaWallet,
  FaShoppingCart,
  FaVideo,
  FaImage,
  FaMusic,
  FaFileAlt,
  FaChartBar,
  FaSearch,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
} from "react-icons/fa";

interface ProductStat {
  id: string;
  title: string;
  media_type: string;
  sales_count: number;
  revenue: number;
}

// ✅ Type du message de debug
type DebugType = "success" | "warning" | "error" | "neutral";
interface DebugMessage {
  type: DebugType;
  text: string;
}

export default function SalesTab() {
  const { isDark, theme } = useAppTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [productStats, setProductStats] = useState<ProductStat[]>([]);
  
  // ✅ Refactor : message de debug avec type + texte
  const [debugMessage, setDebugMessage] = useState<DebugMessage>({ type: "neutral", text: "" });
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
          setDebugMessage({
            type: "warning",
            text: "0 vente trouvée avec le statut \"completed\".\nVérifie si ton achat test est bien passé en \"completed\" dans Supabase.",
          });
        } else {
          setDebugMessage({
            type: "success",
            text: `${purchases.length} vente(s) "completed" trouvée(s) en base de données.`,
          });
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
      setDebugMessage({ type: "error", text: error.message });
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

  // ✅ Renvoie l'icône + les couleurs selon le type de message
  const getDebugIcon = (type: DebugType) => {
    switch (type) {
      case "success": return FaCheckCircle;
      case "warning": return FaExclamationTriangle;
      case "error":   return FaTimesCircle;
      default:        return FaSearch;
    }
  };

  const getDebugColor = (type: DebugType) => {
    switch (type) {
      case "success": return colors.green;
      case "warning": return colors.orange;
      case "error":   return colors.red;
      default:        return colors.textMuted;
    }
  };

  const getDebugBg = (type: DebugType) => {
    switch (type) {
      case "success": return "rgba(16, 185, 129, 0.1)";
      case "warning": return "rgba(249, 115, 22, 0.1)";
      case "error":   return "rgba(239, 68, 68, 0.1)";
      default:        return colors.hover;
    }
  };

  if (isLoading) {
    return (
      <Center h="400px">
        <Spinner thickness="4px" speed="0.65s" emptyColor={colors.border} color={colors.primary} size="xl" />
      </Center>
    );
  }

  const debugColor = getDebugColor(debugMessage.type);
  const DebugIcon = getDebugIcon(debugMessage.type);

  return (
    <Box p={4}>
      {/* ✅ Bandeau diagnostic avec icône SVG dynamique */}
      <Box
        w="100%"
        p={3}
        mb={6}
        bg={getDebugBg(debugMessage.type)}
        borderRadius="8px"
        border="1px solid"
        borderColor={debugColor}
      >
        <HStack align="center" spacing={2} mb={1}>
          {/* ✅ Icône Search / CheckCircle / ExclamationTriangle / TimesCircle */}
          <Icon as={DebugIcon} color={debugColor} boxSize={4} />
          <Text fontSize="12px" fontWeight="bold" color={colors.text}>
            DIAGNOSTIC BASE DE DONNÉES
          </Text>
        </HStack>
        <Text fontSize="13px" color={colors.text} whiteSpace="pre-line">
          {debugMessage.text}
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