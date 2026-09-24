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
    <Box minH="100vh" bg="#0A0A0A" color="white" position="relative" overflow="hidden">

      {/* ==========================================
          ANIMATIONS CSS PERSONNALISÉES
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
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-15px) scale(1.05); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255,255,255,0.1); }
          50% { box-shadow: 0 0 40px rgba(255,255,255,0.2); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .float-1 { animation: float 6s ease-in-out infinite; }
        .float-2 { animation: floatReverse 7s ease-in-out infinite; }
        .float-3 { animation: floatSlow 8s ease-in-out infinite; }
        .float-4 { animation: float 5s ease-in-out infinite 1s; }
        .float-5 { animation: floatReverse 6.5s ease-in-out infinite 0.5s; }
        .fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
        .slide-left { animation: slideInLeft 1s ease-out forwards; }
        .slide-right { animation: slideInRight 1s ease-out forwards; }
        .pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
      `}</style>

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
                <Box w="8" h="8" bg="white" borderRadius="md" display="flex" alignItems="center" justifyContent="center">
                  <Zap color="black" size={20} />
                </Box>
                <Text fontSize="xl" fontWeight="bold" letterSpacing="tight" color="white">Afrifan</Text>
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
                  bg="white"
                  _hover={{ bg: "gray.200" }}
                  color="black"
                  fontSize="sm"
                  fontWeight="semibold"
                  borderRadius="lg"
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
            2. SECTION HÉRO (ACCROCHE) AVEC IMAGES FLOTTANTES
        ========================================== */}
        <Box position="relative" py={{ base: 20, sm: 32 }} overflow="hidden">
          {/* Effet de lueur subtile (blanc) */}
          <Box
            position="absolute"
            top="0"
            left="50%"
            transform="translateX(-50%)"
            w="600px"
            h="600px"
            bg="rgba(255, 255, 255, 0.05)"
            borderRadius="full"
            filter="blur(120px)"
            zIndex="0"
          />

          {/* 🎯 IMAGES FLOTTANTES ANIMÉES */}
          
          {/* Image 1 - Créatrice en haut à gauche */}
          <Box
            position="absolute"
            top="15%"
            left="5%"
            w={{ base: "80px", md: "120px" }}
            h={{ base: "80px", md: "120px" }}
            borderRadius="2xl"
            overflow="hidden"
            border="2px solid"
            borderColor="whiteAlpha.200"
            className="float-1"
            zIndex="1"
            boxShadow="0 20px 40px rgba(0,0,0,0.5)"
          >
            <img 
              src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&h=300&fit=crop&crop=face" 
              alt="Créatrice" 
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Box>

          {/* Image 2 - Créateur en haut à droite */}
          <Box
            position="absolute"
            top="20%"
            right="8%"
            w={{ base: "90px", md: "130px" }}
            h={{ base: "90px", md: "130px" }}
            borderRadius="2xl"
            overflow="hidden"
            border="2px solid"
            borderColor="whiteAlpha.200"
            className="float-2"
            zIndex="1"
            boxShadow="0 20px 40px rgba(0,0,0,0.5)"
          >
            <img 
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face" 
              alt="Créateur" 
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Box>

          {/* Image 3 - Vidéo/Contenu en bas à gauche */}
          <Box
            position="absolute"
            bottom="25%"
            left="3%"
            w={{ base: "100px", md: "150px" }}
            h={{ base: "130px", md: "180px" }}
            borderRadius="2xl"
            overflow="hidden"
            border="2px solid"
            borderColor="whiteAlpha.200"
            className="float-3"
            zIndex="1"
            boxShadow="0 20px 40px rgba(0,0,0,0.5)"
          >
            <img 
              src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=400&fit=crop" 
              alt="Contenu vidéo" 
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {/* Badge "LIVE" */}
            <Box
              position="absolute"
              top="8px"
              left="8px"
              bg="red.500"
              color="white"
              px="6px"
              py="2px"
              borderRadius="md"
              fontSize="xs"
              fontWeight="bold"
            >
              LIVE
            </Box>
          </Box>

          {/* Image 4 - Mobile Money en bas à droite */}
          <Box
            position="absolute"
            bottom="20%"
            right="5%"
            w={{ base: "110px", md: "160px" }}
            h={{ base: "110px", md: "160px" }}
            borderRadius="2xl"
            overflow="hidden"
            border="2px solid"
            borderColor="whiteAlpha.200"
            className="float-4"
            zIndex="1"
            boxShadow="0 20px 40px rgba(0,0,0,0.5)"
          >
            <img 
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=300&fit=crop" 
              alt="Mobile Money" 
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Box>

          {/* Image 5 - Petite image décorative centre-gauche */}
          <Box
            position="absolute"
            top="50%"
            left="8%"
            w={{ base: "60px", md: "90px" }}
            h={{ base: "60px", md: "90px" }}
            borderRadius="full"
            overflow="hidden"
            border="2px solid"
            borderColor="whiteAlpha.200"
            className="float-5"
            zIndex="1"
            boxShadow="0 20px 40px rgba(0,0,0,0.5)"
          >
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face" 
              alt="Fan" 
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Box>

          {/* Contenu principal */}
          <Container maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }} textAlign="center" position="relative" zIndex="2">
            <Box
              display="inline-flex"
              alignItems="center"
              gap={2}
              px={3}
              py={1}
              borderRadius="full"
              bg="whiteAlpha.100"
              border="1px solid"
              borderColor="whiteAlpha.200"
              color="gray.200"
              fontSize="xs"
              fontWeight="medium"
              mb={6}
              className="fade-in-up"
            >
              <Star size={12} />
              La Creator Economy africaine, sans compromis
            </Box>

            <Text 
              fontSize={{ base: "4xl", sm: "6xl" }} 
              fontWeight="bold" 
              letterSpacing="tight" 
              mb={6} 
              lineHeight="1.1"
              className="fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              Monétisez votre talent, <br />
              <Text as="span" bgGradient="linear(to-r, #FFFFFF, #9CA3AF)" bgClip="text">
                quel que soit votre nombre d'abonnés.
              </Text>
            </Text>

            <Text 
              maxW="2xl" 
              mx="auto" 
              fontSize="lg" 
              color="gray.400" 
              mb={10}
              className="fade-in-up"
              style={{ animationDelay: "0.4s" }}
            >
              Pas besoin d'attendre des millions de vues. Sur Afrifan, chaque fan compte : vos vrais abonnés paient directement via Mobile Money pour accéder à votre contenu exclusif.
            </Text>

            <Flex 
              flexDir={{ base: "column", sm: "row" }} 
              align="center" 
              justify="center" 
              gap={4}
              className="fade-in-up"
              style={{ animationDelay: "0.6s" }}
            >
              <Link href="/register" style={{ textDecoration: "none", width: "100%" }}>
                <Button
                  w={{ base: "100%", sm: "auto" }}
                  px={8}
                  py={7}
                  bg="white"
                  _hover={{ bg: "gray.200" }}
                  color="black"
                  fontWeight="semibold"
                  borderRadius="xl"
                  boxShadow="0 10px 15px -3px rgba(255, 255, 255, 0.1)"
                  fontSize="md"
                  className="pulse-glow"
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
                  borderColor="whiteAlpha.200"
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
            <SimpleGrid 
              columns={{ base: 2, md: 4 }} 
              spacing={8} 
              maxW="4xl" 
              mx="auto" 
              borderTop="1px solid" 
              borderColor="whiteAlpha.100" 
              pt={8} 
              mt={16}
              className="fade-in-up"
              style={{ animationDelay: "0.8s" }}
            >
              <VStack spacing={1}>
                <Text fontSize="3xl" fontWeight="bold" color="white">15%</Text>
                <Text fontSize="sm" color="gray.500">Commission unique</Text>
              </VStack>
              <VStack spacing={1}>
                <Text fontSize="3xl" fontWeight="bold" color="white">Mobile</Text>
                <Text fontSize="sm" color="gray.500">Money First</Text>
              </VStack>
              <VStack spacing={1}>
                <Text fontSize="3xl" fontWeight="bold" color="white">Zéro</Text>
                <Text fontSize="sm" color="gray.500">Seuil requis</Text>
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
                  icon: <Users color="#FFFFFF" size={28} />,
                  title: "1. Créez votre espace",
                  desc: "Inscrivez-vous gratuitement, configurez vos paliers d'abonnement (ex: 500 FCFA, 2000 FCFA) et personnalisez votre profil."
                },
                {
                  icon: <Play color="#FFFFFF" size={28} />,
                  title: "2. Publiez du contenu exclusif",
                  desc: "Partagez vos vidéos, podcasts, tutoriels ou lives réservés uniquement à vos abonnés payants."
                },
                {
                  icon: <Wallet color="#FFFFFF" size={28} />,
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
                  _hover={{ borderColor: "whiteAlpha.300", transition: "all 0.2s" }}
                  className="fade-in-up"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <Box w="14" h="14" bg="whiteAlpha.100" borderRadius="xl" display="flex" alignItems="center" justifyContent="center" mb={6}>
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
                <Box 
                  key={index} 
                  bg="whiteAlpha.50" 
                  border="1px solid" 
                  borderColor="whiteAlpha.100" 
                  borderRadius="xl" 
                  p={6}
                  className="fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Box w="10" h="10" bg="whiteAlpha.100" borderRadius="lg" display="flex" alignItems="center" justifyContent="center" color="white" mb={4}>
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
              Rejoignez les créateurs africains qui construisent leur indépendance financière sur Afrifan — peu importe où ils en sont dans leur parcours.
            </Text>
            <Link href="/register" style={{ textDecoration: "none" }}>
              <Button
                px={8}
                py={8}
                bg="white"
                _hover={{ bg: "gray.200" }}
                color="black"
                fontWeight="semibold"
                borderRadius="xl"
                boxShadow="0 10px 15px -3px rgba(255, 255, 255, 0.1)"
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