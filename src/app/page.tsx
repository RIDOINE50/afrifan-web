"use client";

import Link from "next/link";
import { Zap, Users, Wallet, Smartphone, ArrowRight, Play, Star } from "lucide-react";
import {
  Box,
  Flex,
  Text,
  Button,
  VStack,
  HStack,
  SimpleGrid,
  Container,
} from "@chakra-ui/react";

export default function LandingPage() {
  return (
    <Box minH="100vh" color="white" position="relative" overflow-x="hidden">

      {/* ==========================================
          ANIMATIONS CSS
      ========================================== */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(20px) rotate(-2deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slowZoom {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .float-1 { animation: float 6s ease-in-out infinite; }
        .float-2 { animation: floatReverse 7s ease-in-out infinite; }
        .float-3 { animation: float 8s ease-in-out infinite; }
        .float-4 { animation: floatReverse 5s ease-in-out infinite 1s; }
        .float-5 { animation: float 6.5s ease-in-out infinite 0.5s; }
        .fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
        .slow-zoom { animation: slowZoom 20s ease-in-out infinite; }
      `}</style>

      {/* ==========================================
          IMAGE DE FOND PRINCIPALE - PLUS VISIBLE
      ========================================== */}
      <Box
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        zIndex="0"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          w="100%"
          h="100%"
          className="slow-zoom"
        >
          <img
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&h=1080&fit=crop"
            alt="Créateur africain"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.6, /* PLUS VISIBLE */
            }}
          />
        </Box>

        {/* Overlay PLUS CLAIR pour voir l'image */}
        <Box
          position="absolute"
          inset="0"
          bg="rgba(10,10,10,0.6)" /* 0.6 au lieu de 0.9 */
        />
      </Box>

      {/* ==========================================
          NAVBAR
      ========================================== */}
      <Box
        position="fixed"
        top="0"
        w="100%"
        zIndex="50"
        bg="rgba(10, 10, 10, 0.9)"
        backdropFilter="blur(10px)"
        borderBottom="1px solid"
        borderColor="whiteAlpha.100"
      >
        <Container maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }}>
          <Flex align="center" justify="space-between" h="16">
            <Link href="/" style={{ textDecoration: "none" }}>
              <HStack spacing={2}>
                <Box w="8" h="8" bg="white" borderRadius="md" display="flex" alignItems="center" justifyContent="center">
                  <Zap color="black" size={20} />
                </Box>
                <Text fontSize="xl" fontWeight="bold" letterSpacing="tight" color="white">Afrifan</Text>
              </HStack>
            </Link>

            <HStack spacing={3}>
              <Link href="/login" style={{ textDecoration: "none" }}>
                <Button variant="ghost" color="gray.300" _hover={{ color: "white", bg: "transparent" }} fontSize="sm" fontWeight="medium">
                  Connexion
                </Button>
              </Link>
              <Link href="/register" style={{ textDecoration: "none" }}>
                <Button bg="white" _hover={{ bg: "gray.200" }} color="black" fontSize="sm" fontWeight="semibold" borderRadius="lg">
                  Créer un compte
                </Button>
              </Link>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* ==========================================
          CONTENU PRINCIPAL
      ========================================== */}
      <Box pt="16" position="relative" zIndex="1">

        {/* SECTION HÉRO */}
        <Box position="relative" py={{ base: 20, sm: 32 }}>
          
          {/* Images flottantes - TOUTES VISIBLES */}
          
          {/* Image 1 - Haut gauche */}
          <Box
            position="absolute"
            top="15%"
            left={{ base: "2%", md: "5%" }}
            w={{ base: "70px", md: "120px" }}
            h={{ base: "70px", md: "120px" }}
            borderRadius="2xl"
            overflow="hidden"
            border="3px solid rgba(255,255,255,0.3)"
            className="float-1"
            zIndex="2"
            boxShadow="0 20px 40px rgba(0,0,0,0.6)"
          >
            <img 
              src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&h=300&fit=crop&crop=face" 
              alt="Créatrice" 
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Box>

          {/* Image 2 - Haut droite */}
          <Box
            position="absolute"
            top="20%"
            right={{ base: "2%", md: "8%" }}
            w={{ base: "80px", md: "130px" }}
            h={{ base: "80px", md: "130px" }}
            borderRadius="2xl"
            overflow="hidden"
            border="3px solid rgba(255,255,255,0.3)"
            className="float-2"
            zIndex="2"
            boxShadow="0 20px 40px rgba(0,0,0,0.6)"
          >
            <img 
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face" 
              alt="Créateur" 
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Box>

          {/* Image 3 - Bas gauche */}
          <Box
            position="absolute"
            bottom="25%"
            left={{ base: "1%", md: "3%" }}
            w={{ base: "90px", md: "150px" }}
            h={{ base: "120px", md: "180px" }}
            borderRadius="2xl"
            overflow="hidden"
            border="3px solid rgba(255,255,255,0.3)"
            className="float-3"
            zIndex="2"
            boxShadow="0 20px 40px rgba(0,0,0,0.6)"
          >
            <img 
              src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=400&fit=crop" 
              alt="Vidéo" 
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <Box position="absolute" top="8px" left="8px" bg="red.500" color="white" px="6px" py="2px" borderRadius="md" fontSize="xs" fontWeight="bold">
              LIVE
            </Box>
          </Box>

          {/* Image 4 - Bas droite */}
          <Box
            position="absolute"
            bottom="20%"
            right={{ base: "2%", md: "5%" }}
            w={{ base: "100px", md: "160px" }}
            h={{ base: "100px", md: "160px" }}
            borderRadius="2xl"
            overflow="hidden"
            border="3px solid rgba(255,255,255,0.3)"
            className="float-4"
            zIndex="2"
            boxShadow="0 20px 40px rgba(0,0,0,0.6)"
          >
            <img 
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=300&fit=crop" 
              alt="Paiement" 
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Box>

          {/* Image 5 - Centre */}
          <Box
            position="absolute"
            top="50%"
            left={{ base: "3%", md: "8%" }}
            w={{ base: "60px", md: "90px" }}
            h={{ base: "60px", md: "90px" }}
            borderRadius="full"
            overflow="hidden"
            border="3px solid rgba(255,255,255,0.3)"
            className="float-5"
            zIndex="2"
            boxShadow="0 20px 40px rgba(0,0,0,0.6)"
          >
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face" 
              alt="Fan" 
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Box>

          {/* TEXTE PRINCIPAL */}
          <Container maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }} textAlign="center" position="relative" zIndex="3">
            <Box display="inline-flex" alignItems="center" gap={2} px={3} py={1} borderRadius="full" bg="rgba(255,255,255,0.15)" border="1px solid" borderColor="whiteAlpha.300" color="white" fontSize="xs" fontWeight="medium" mb={6} className="fade-in-up">
              <Star size={12} />
              La Creator Economy africaine, sans compromis
            </Box>

            <Text fontSize={{ base: "3xl", sm: "5xl", md: "6xl" }} fontWeight="bold" letterSpacing="tight" mb={6} lineHeight="1.1" className="fade-in-up" style={{ animationDelay: "0.2s" }}>
              Monétisez votre talent, <br />
              <Text as="span" color="gray.300">
                quel que soit votre nombre d'abonnés.
              </Text>
            </Text>

            <Text maxW="2xl" mx="auto" fontSize="lg" color="gray.300" mb={10} className="fade-in-up" style={{ animationDelay: "0.4s" }}>
              Pas besoin d'attendre des millions de vues. Sur Afrifan, chaque fan compte : vos vrais abonnés paient directement via Mobile Money.
            </Text>

            <Flex flexDir={{ base: "column", sm: "row" }} align="center" justify="center" gap={4} className="fade-in-up" style={{ animationDelay: "0.6s" }}>
              <Link href="/register" style={{ textDecoration: "none", width: "100%" }}>
                <Button w={{ base: "100%", sm: "auto" }} px={8} py={7} bg="white" _hover={{ bg: "gray.200" }} color="black" fontWeight="semibold" borderRadius="xl" fontSize="md">
                  Commencer à gagner <ArrowRight size={18} style={{ marginLeft: "8px" }} />
                </Button>
              </Link>
              <Link href="/login" style={{ textDecoration: "none", width: "100%" }}>
                <Button w={{ base: "100%", sm: "auto" }} px={8} py={7} bg="rgba(255,255,255,0.1)" _hover={{ bg: "rgba(255,255,255,0.2)" }} border="1px solid" borderColor="whiteAlpha.300" color="white" fontWeight="semibold" borderRadius="xl" fontSize="md">
                  J'ai déjà un compte
                </Button>
              </Link>
            </Flex>

            {/* Stats */}
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={8} maxW="4xl" mx="auto" borderTop="1px solid" borderColor="whiteAlpha.200" pt={8} mt={16} className="fade-in-up" style={{ animationDelay: "0.8s" }}>
              <VStack spacing={1}>
                <Text fontSize="3xl" fontWeight="bold" color="white">15%</Text>
                <Text fontSize="sm" color="gray.400">Commission unique</Text>
              </VStack>
              <VStack spacing={1}>
                <Text fontSize="3xl" fontWeight="bold" color="white">Mobile</Text>
                <Text fontSize="sm" color="gray.400">Money First</Text>
              </VStack>
              <VStack spacing={1}>
                <Text fontSize="3xl" fontWeight="bold" color="white">Zéro</Text>
                <Text fontSize="sm" color="gray.400">Seuil requis</Text>
              </VStack>
              <VStack spacing={1}>
                <Text fontSize="3xl" fontWeight="bold" color="white">24h</Text>
                <Text fontSize="sm" color="gray.400">Retrait rapide</Text>
              </VStack>
            </SimpleGrid>
          </Container>
        </Box>

        {/* SECTION COMMENT ÇA MARCHE */}
        <Box py={20} bg="rgba(10,10,10,0.85)">
          <Container maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }}>
            <Box textAlign="center" mb={16}>
              <Text fontSize="3xl" fontWeight="bold" color="white" mb={4}>Comment ça marche ?</Text>
              <Text color="gray.400" maxW="2xl" mx="auto">En 3 étapes simples, transformez votre passion en revenus.</Text>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              {[
                { icon: <Users color="#FFFFFF" size={28} />, title: "1. Créez votre espace", desc: "Inscrivez-vous gratuitement et configurez vos abonnements." },
                { icon: <Play color="#FFFFFF" size={28} />, title: "2. Publiez du contenu", desc: "Partagez vidéos, podcasts et lives exclusifs." },
                { icon: <Wallet color="#FFFFFF" size={28} />, title: "3. Recevez vos paiements", desc: "Encaissez via MTN, Orange, Moov ou Wave." }
              ].map((step, index) => (
                <Box key={index} bg="rgba(26,26,26,0.9)" border="1px solid" borderColor="whiteAlpha.200" borderRadius="2xl" p={8}>
                  <Box w="14" h="14" bg="whiteAlpha.200" borderRadius="xl" display="flex" alignItems="center" justifyContent="center" mb={6}>{step.icon}</Box>
                  <Text fontSize="xl" fontWeight="bold" color="white" mb={3}>{step.title}</Text>
                  <Text color="gray.400" lineHeight="relaxed">{step.desc}</Text>
                </Box>
              ))}
            </SimpleGrid>
          </Container>
        </Box>

        {/* FOOTER */}
        <Box borderTop="1px solid" borderColor="whiteAlpha.200" py={8} bg="rgba(10,10,10,0.95)">
          <Container maxW="7xl" px={4} textAlign="center">
            <Text fontSize="sm" color="gray.500">© 2026 Afrifan. Tous droits réservés. Fait avec ❤️ pour l'Afrique.</Text>
          </Container>
        </Box>

      </Box>
    </Box>
  );
}