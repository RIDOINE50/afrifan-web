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
    <Box minH="100vh" bg="#0A0A0A" color="white" position="relative">
      
      {/* ==========================================
          1. NAVBAR (EN-TÊTE)
      ========================================== */}
      <Box
        position="fixed"
        top="0"
        w="100%"
        zIndex="50"
        bg="rgba(10, 10, 10, 0.8)"
        backdropFilter="blur(10px)"
        borderBottom="1px solid"
        borderColor="whiteAlpha.100"
      >
        <Container maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }}>
          <Flex align="center" justify="space-between" h="16">
            {/* Logo */}
            <Link href="/" style={{ textDecoration: "none" }}>
              <HStack spacing={2}>
                <Box w="8" h="8" bg="#8B5CF6" borderRadius="md" display="flex" alignItems="center" justifyContent="center">
                  <Zap color="white" size={20} />
                </Box>
                <Text fontSize="xl" fontWeight="bold" letterSpacing="tight">Afrifan</Text>
              </HStack>
            </Link>

            {/* Boutons d'authentification */}
            <HStack spacing={3}>
              <Link href="/login" style={{ textDecoration: "none" }}>
                <Button variant="ghost" color="gray.300" _hover={{ color: "white", bg: "transparent" }} fontSize="sm" fontWeight="medium">
                  Connexion
                </Button>
              </Link>
              <Link href="/register" style={{ textDecoration: "none" }}>
                <Button
                  bg="#8B5CF6"
                  _hover={{ bg: "#7C3AED" }}
                  color="white"
                  fontSize="sm"
                  fontWeight="medium"
                  borderRadius="lg"
                  boxShadow="0 10px 15px -3px rgba(139, 92, 246, 0.2)"
                >
                  Créer un compte
                </Button>
              </Link>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Box pt="16">
        
        {/* ==========================================
            2. SECTION HÉRO (ACCROCHE)
        ========================================== */}
        <Box position="relative" py={{ base: 20, sm: 32 }} overflow="hidden">
          {/* Effet de lueur en arrière-plan */}
          <Box
            position="absolute"
            top="0"
            left="50%"
            transform="translateX(-50%)"
            w="600px"
            h="600px"
            bg="rgba(139, 92, 246, 0.2)"
            borderRadius="full"
            filter="blur(120px)"
            zIndex="-1"
          />
          
          <Container maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }} textAlign="center">
            <Box
              display="inline-flex"
              alignItems="center"
              gap={2}
              px={3}
              py={1}
              borderRadius="full"
              bg="rgba(139, 92, 246, 0.1)"
              border="1px solid"
              borderColor="rgba(139, 92, 246, 0.2)"
              color="#A78BFA"
              fontSize="xs"
              fontWeight="medium"
              mb={6}
            >
              <Star size={12} />
              La première plateforme de Creator Economy en Afrique
            </Box>
            
            <Text fontSize={{ base: "4xl", sm: "6xl" }} fontWeight="bold" letterSpacing="tight" mb={6} lineHeight="1.1">
              Monétisez votre talent <br />
              <Text as="span" bgGradient="linear(to-r, #A78BFA, #E879F9)" bgClip="text">
                dès 1 000 abonnés engagés.
              </Text>
            </Text>
            
            <Text maxW="2xl" mx="auto" fontSize="lg" color="gray.400" mb={10}>
              Oubliez les millions de vues requis par YouTube ou TikTok. Sur Afrifan, vos vrais fans paient directement via Mobile Money pour accéder à votre contenu exclusif.
            </Text>

            <Flex flexDir={{ base: "column", sm: "row" }} align="center" justify="center" gap={4}>
              <Link href="/register" style={{ textDecoration: "none", width: "100%" }}>
                <Button
                  w={{ base: "100%", sm: "auto" }}
                  px={8}
                  py={7}
                  bg="#8B5CF6"
                  _hover={{ bg: "#7C3AED" }}
                  color="white"
                  fontWeight="semibold"
                  borderRadius="xl"
                  boxShadow="0 10px 15px -3px rgba(139, 92, 246, 0.2)"
                  fontSize="md"
                >
                  Commencer à gagner <ArrowRight size={18} style={{ marginLeft: "8px" }} />
                </Button>
              </Link>
              <Link href="/login" style={{ textDecoration: "none", width: "100%" }}>
                <Button
                  w={{ base: "100%", sm: "auto" }}
                  px={8}
                  py={7}
                  bg="whiteAlpha.50"
                  _hover={{ bg: "whiteAlpha.100" }}
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                  color="white"
                  fontWeight="semibold"
                  borderRadius="xl"
                  fontSize="md"
                >
                  J'ai déjà un compte
                </Button>
              </Link>
            </Flex>

            {/* Statistiques rapides */}
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={8} maxW="4xl" mx="auto" borderTop="1px solid" borderColor="whiteAlpha.100" pt={8} mt={16}>
              <VStack spacing={1}>
                <Text fontSize="3xl" fontWeight="bold" color="white">15%</Text>
                <Text fontSize="sm" color="gray.500">Commission only</Text>
              </VStack>
              <VStack spacing={1}>
                <Text fontSize="3xl" fontWeight="bold" color="white">Mobile</Text>
                <Text fontSize="sm" color="gray.500">Money First</Text>
              </VStack>
              <VStack spacing={1}>
                <Text fontSize="3xl" fontWeight="bold" color="white">1k</Text>
                <Text fontSize="sm" color="gray.500">Abonnés min.</Text>
              </VStack>
              <VStack spacing={1}>
                <Text fontSize="3xl" fontWeight="bold" color="white">24h</Text>
                <Text fontSize="sm" color="gray.500">Retrait rapide</Text>
              </VStack>
            </SimpleGrid>
          </Container>
        </Box>

        {/* ==========================================
            3. SECTION COMMENT ÇA MARCHE
        ========================================== */}
        <Box py={20} bg="#111111">
          <Container maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }}>
            <Box textAlign="center" mb={16}>
              <Text fontSize="3xl" fontWeight="bold" color="white" mb={4}>Comment ça marche ?</Text>
              <Text color="gray.400" maxW="2xl" mx="auto">En 3 étapes simples, transformez votre passion en source de revenus récurrents.</Text>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              {[
                {
                  icon: <Users color="#A78BFA" size={28} />,
                  title: "1. Créez votre espace",
                  desc: "Inscrivez-vous gratuitement, configurez vos paliers d'abonnement (ex: 500 FCFA, 2000 FCFA) et personnalisez votre profil."
                },
                {
                  icon: <Play color="#A78BFA" size={28} />,
                  title: "2. Publiez du contenu exclusif",
                  desc: "Partagez vos vidéos, podcasts, tutoriels ou lives réservés uniquement à vos abonnés payants."
                },
                {
                  icon: <Wallet color="#A78BFA" size={28} />,
                  title: "3. Recevez vos paiements",
                  desc: "Vos fans paient via MTN, Orange, Moov ou Wave. Retirez vos gains directement sur votre compte Mobile Money."
                }
              ].map((step, index) => (
                <Box
                  key={index}
                  bg="#1A1A1A"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                  borderRadius="2xl"
                  p={8}
                  _hover={{ borderColor: "rgba(139, 92, 246, 0.3)", transition: "all 0.2s" }}
                >
                  <Box w="14" h="14" bg="rgba(139, 92, 246, 0.1)" borderRadius="xl" display="flex" alignItems="center" justifyContent="center" mb={6} _groupHover={{ bg: "rgba(139, 92, 246, 0.2)" }}>
                    {step.icon}
                  </Box>
                  <Text fontSize="xl" fontWeight="bold" color="white" mb={3}>{step.title}</Text>
                  <Text color="gray.400" lineHeight="relaxed">{step.desc}</Text>
                </Box>
              ))}
            </SimpleGrid>
          </Container>
        </Box>

        {/* ==========================================
            4. SECTION NOS SERVICES / FONCTIONNALITÉS
        ========================================== */}
        <Box py={20}>
          <Container maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }}>
            <Box textAlign="center" mb={16}>
              <Text fontSize="3xl" fontWeight="bold" color="white" mb={4}>Tout ce dont vous avez besoin pour réussir</Text>
              <Text color="gray.400" maxW="2xl" mx="auto">Une suite d'outils complète pensée pour les créateurs africains.</Text>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {[
                { icon: <Zap size={24} />, title: "Abonnements récurrents", desc: "Des revenus stables chaque mois grâce à vos fans fidèles." },
                { icon: <Wallet size={24} />, title: "Pourboires (Tips)", desc: "Recevez des dons ponctuels de vos fans à tout moment." },
                { icon: <Smartphone size={24} />, title: "Paiement Mobile Money", desc: "Intégration native de Kkiapay (MTN, Orange, Moov, Wave)." },
                { icon: <Users size={24} />, title: "Gestion de communauté", desc: "Messagerie privée et commentaires pour vos abonnés." },
                { icon: <Play size={24} />, title: "Contenu verrouillé", desc: "Protégez vos meilleures vidéos et fichiers derrière un paywall." },
                { icon: <ArrowRight size={24} />, title: "Tableau de bord", desc: "Suivez vos revenus, vos abonnés et vos statistiques en temps réel." }
              ].map((feature, index) => (
                <Box key={index} bg="whiteAlpha.50" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={6}>
                  <Box w="10" h="10" bg="whiteAlpha.50" borderRadius="lg" display="flex" alignItems="center" justifyContent="center" color="#A78BFA" mb={4}>
                    {feature.icon}
                  </Box>
                  <Text fontSize="lg" fontWeight="semibold" color="white" mb={2}>{feature.title}</Text>
                  <Text fontSize="sm" color="gray.400">{feature.desc}</Text>
                </Box>
              ))}
            </SimpleGrid>
          </Container>
        </Box>

        {/* ==========================================
            5. SECTION APPEL À L'ACTION FINAL
        ========================================== */}
        <Box py={20} bgGradient="linear(to-b, #111111, #0A0A0A)">
          <Container maxW="4xl" px={4} textAlign="center">
            <Text fontSize={{ base: "3xl", sm: "4xl" }} fontWeight="bold" color="white" mb={6}>
              Prêt à vivre de votre passion ?
            </Text>
            <Text color="gray.400" mb={8} fontSize="lg">
              Rejoignez les premiers créateurs africains qui construisent leur indépendance financière sur Afrifan.
            </Text>
            <Link href="/register" style={{ textDecoration: "none" }}>
              <Button
                px={8}
                py={8}
                bg="#8B5CF6"
                _hover={{ bg: "#7C3AED" }}
                color="white"
                fontWeight="semibold"
                borderRadius="xl"
                boxShadow="0 10px 15px -3px rgba(139, 92, 246, 0.2)"
                fontSize="md"
              >
                Créer mon compte gratuitement <ArrowRight size={18} style={{ marginLeft: "8px" }} />
              </Button>
            </Link>
          </Container>
        </Box>

      </Box>

      {/* ==========================================
          6. FOOTER
      ========================================== */}
      <Box borderTop="1px solid" borderColor="whiteAlpha.100" py={8} bg="#0A0A0A">
        <Container maxW="7xl" px={4} textAlign="center">
          <Text fontSize="sm" color="gray.500">
            © 2026 Afrifan. Tous droits réservés. Fait avec ❤️ pour les créateurs africains.
          </Text>
        </Container>
      </Box>
    </Box>
  );
}