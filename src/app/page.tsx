"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Zap, Users, Wallet, Smartphone, ArrowRight, Play, Star, 
  Menu, X, Check, Mail, TrendingUp, Shield 
} from "lucide-react";
import {
  Box, Flex, Text, Button, VStack, HStack, SimpleGrid, Container,
  Collapse
} from "@chakra-ui/react";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    { icon: <TrendingUp size={28} />, title: "Abonnements récurrents", desc: "Construisez une source de revenus stable mois après mois grâce à vos fans les plus fidèles." },
    { icon: <Wallet size={28} />, title: "Pourboires (Tips)", desc: "Recevez des dons ponctuels et directs de votre communauté à tout moment." },
    { icon: <Smartphone size={28} />, title: "Mobile Money Natif", desc: "Intégration parfaite de MTN, Orange, Moov et Wave pour des paiements sans friction." },
    { icon: <Play size={28} />, title: "Contenu Exclusif", desc: "Verrouillez vos meilleures vidéos, podcasts et fichiers derrière un paywall sécurisé." },
    { icon: <Users size={28} />, title: "Communauté Privée", desc: "Messagerie directe et commentaires réservés uniquement à vos abonnés payants." },
    { icon: <Shield size={28} />, title: "Sécurité Maximale", desc: "Vos données et celles de vos fans sont protégées par un chiffrement de bout en bout." },
  ];

  const steps = [
    { step: "01", title: "Créez votre espace", desc: "Inscription gratuite en 2 minutes. Personnalisez votre profil et définissez vos paliers d'abonnement." },
    { step: "02", title: "Publiez du contenu", desc: "Partagez vos vidéos, tutoriels ou lives exclusifs réservés à votre cercle d'initiés." },
    { step: "03", title: "Encaissez vos gains", desc: "Vos fans paient via Mobile Money. Retirez vos fonds directement sur votre compte en 24h." },
  ];

  return (
    <Box minH="100vh" color="white" position="relative" overflowX="hidden" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">

      {/* ==========================================
          ANIMATIONS CSS
      ========================================== */}
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        @keyframes floatReverse { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(15px); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slowZoom { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        .float-1 { animation: float 6s ease-in-out infinite; }
        .float-2 { animation: floatReverse 7s ease-in-out infinite; }
        .float-3 { animation: float 8s ease-in-out infinite; }
        .fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
        .slow-zoom { animation: slowZoom 20s ease-in-out infinite; }
      `}</style>

      {/* ==========================================
          IMAGE DE FOND PRINCIPALE
      ========================================== */}
      <Box position="fixed" top="0" left="0" right="0" bottom="0" zIndex="0" overflow="hidden">
        <Box position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" w="100%" h="100%" className="slow-zoom">
          <img
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&h=1080&fit=crop"
            alt="Créateur africain"
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }}
          />
        </Box>
        <Box position="absolute" inset="0" bg="linear-gradient(to bottom, rgba(10,10,10,0.8) 0%, rgba(10,10,10,0.95) 100%)" />
      </Box>

      {/* ==========================================
          NAVBAR (RESPONSIVE AVEC HAMBURGER)
      ========================================== */}
      <Box position="fixed" top="0" w="100%" zIndex="50" bg="rgba(10, 10, 10, 0.85)" backdropFilter="blur(12px)" borderBottom="1px solid" borderColor="whiteAlpha.100">
        <Container maxW="7xl" px={{ base: 4, md: 8 }}>
          <Flex align="center" justify="space-between" h="20">
            <Link href="/" style={{ textDecoration: "none" }}>
              <HStack spacing={2}>
                <Box w="10" h="10" bg="white" borderRadius="lg" display="flex" alignItems="center" justifyContent="center">
                  <Zap color="black" size={24} />
                </Box>
                <Text fontSize="2xl" fontWeight="bold" letterSpacing="tight" color="white">Afrifan</Text>
              </HStack>
            </Link>

            <HStack spacing={8} display={{ base: "none", md: "flex" }}>
              {["Accueil", "Fonctionnalités", "Comment ça marche", "Contact"].map((item) => (
                <Link key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`} style={{ textDecoration: "none" }}>
                  <Text fontSize="sm" fontWeight="500" color="gray.300" _hover={{ color: "white" }} transition="color 0.2s">
                    {item}
                  </Text>
                </Link>
              ))}
            </HStack>

            <HStack spacing={4}>
              <Link href="/login" style={{ textDecoration: "none" }}>
                <Button display={{ base: "none", md: "flex" }} variant="ghost" color="gray.300" _hover={{ color: "white", bg: "transparent" }} fontSize="sm" fontWeight="medium">
                  Connexion
                </Button>
              </Link>
              <Link href="/register" style={{ textDecoration: "none" }}>
                <Button display={{ base: "none", md: "flex" }} bg="white" _hover={{ bg: "gray.200" }} color="black" fontSize="sm" fontWeight="semibold" borderRadius="lg">
                  Commencer
                </Button>
              </Link>
              
              <Button 
                display={{ base: "flex", md: "none" }} 
                variant="ghost" 
                color="white" 
                p={2}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
            </HStack>
          </Flex>
        </Container>

        <Collapse in={isMenuOpen} animateOpacity>
          <Box bg="rgba(10, 10, 10, 0.95)" backdropFilter="blur(12px)" borderBottom="1px solid" borderColor="whiteAlpha.100" px={4} py={6} display={{ base: "block", md: "none" }}>
            <VStack spacing={6} align="stretch">
              {["Accueil", "Fonctionnalités", "Comment ça marche", "Contact"].map((item) => (
                <Link key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`} onClick={() => setIsMenuOpen(false)} style={{ textDecoration: "none" }}>
                  <Text fontSize="lg" fontWeight="500" color="gray.300" _hover={{ color: "white" }}>
                    {item}
                  </Text>
                </Link>
              ))}
              <Box borderTop="1px solid" borderColor="whiteAlpha.100" pt={4} mt={2}>
                <Link href="/login" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: "none", display: "block", marginBottom: "12px" }}>
                  <Button w="100%" variant="ghost" color="gray.300" justifyContent="center">Connexion</Button>
                </Link>
                <Link href="/register" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: "none" }}>
                  <Button w="100%" bg="white" color="black" fontWeight="semibold" justifyContent="center">Créer un compte</Button>
                </Link>
              </Box>
            </VStack>
          </Box>
        </Collapse>
      </Box>

      {/* ==========================================
          CONTENU PRINCIPAL
      ========================================== */}
      <Box position="relative" zIndex="1" pt="20">

        {/* 1. SECTION ACCUEIL (HÉRO) */}
        <Box id="accueil" position="relative" py={{ base: 16, md: 32 }}>
          <Container maxW="7xl" px={{ base: 4, md: 8 }} textAlign="center" position="relative" zIndex="3">
            <Box display="inline-flex" alignItems="center" gap={2} px={4} py={2} borderRadius="full" bg="whiteAlpha.100" border="1px solid" borderColor="whiteAlpha.200" color="gray.200" fontSize="sm" fontWeight="medium" mb={8} className="fade-in-up">
              <Star size={14} />
              La Creator Economy africaine, sans compromis
            </Box>

            <Text fontSize={{ base: "3xl", md: "5xl", lg: "6xl" }} fontWeight="bold" letterSpacing="tight" mb={6} lineHeight="1.1" className="fade-in-up" style={{ animationDelay: "0.2s" }}>
              Monétisez votre talent, <br />
              <Text as="span" bgGradient="linear(to-r, #FFFFFF, #9CA3AF)" bgClip="text">
                quel que soit votre nombre d'abonnés.
              </Text>
            </Text>

            <Text maxW="2xl" mx="auto" fontSize={{ base: "md", md: "lg" }} color="gray.300" mb={10} className="fade-in-up" style={{ animationDelay: "0.4s" }}>
              Pas besoin d'attendre des millions de vues. Sur Afrifan, chaque fan compte : vos vrais abonnés paient directement via Mobile Money pour accéder à votre contenu exclusif.
            </Text>

            <Flex flexDir={{ base: "column", sm: "row" }} align="center" justify="center" gap={4} className="fade-in-up" style={{ animationDelay: "0.6s" }}>
              <Link href="/register" style={{ textDecoration: "none", width: "100%" }}>
                <Button w={{ base: "100%", sm: "auto" }} px={8} py={7} bg="white" _hover={{ bg: "gray.200" }} color="black" fontWeight="semibold" borderRadius="xl" fontSize="md">
                  Commencer à gagner <ArrowRight size={18} style={{ marginLeft: "8px" }} />
                </Button>
              </Link>
              <Link href="#comment-ça-marche" style={{ textDecoration: "none", width: "100%" }}>
                <Button w={{ base: "100%", sm: "auto" }} px={8} py={7} bg="whiteAlpha.100" _hover={{ bg: "whiteAlpha.200" }} border="1px solid" borderColor="whiteAlpha.200" color="white" fontWeight="semibold" borderRadius="xl" fontSize="md">
                  Découvrir le projet
                </Button>
              </Link>
            </Flex>

            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={8} maxW="4xl" mx="auto" borderTop="1px solid" borderColor="whiteAlpha.200" pt={8} mt={16} className="fade-in-up" style={{ animationDelay: "0.8s" }}>
              {[
                { val: "15%", label: "Commission unique" },
                { val: "Mobile", label: "Money First" },
                { val: "0 FCFA", label: "Seuil requis" },
                { val: "24h", label: "Retrait rapide" }
              ].map((stat, i) => (
                <VStack key={i} spacing={1}>
                  <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="white">{stat.val}</Text>
                  <Text fontSize="sm" color="gray.400">{stat.label}</Text>
                </VStack>
              ))}
            </SimpleGrid>
          </Container>

          <Box display={{ base: "none", md: "block" }}>
            <Box position="absolute" top="20%" left="5%" w="120px" h="120px" borderRadius="2xl" overflow="hidden" border="3px solid rgba(255,255,255,0.2)" className="float-1" zIndex="2" boxShadow="0 20px 40px rgba(0,0,0,0.6)">
              <img src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&h=300&fit=crop&crop=face" alt="Créatrice" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Box>
            <Box position="absolute" top="25%" right="8%" w="130px" h="130px" borderRadius="2xl" overflow="hidden" border="3px solid rgba(255,255,255,0.2)" className="float-2" zIndex="2" boxShadow="0 20px 40px rgba(0,0,0,0.6)">
              <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face" alt="Créateur" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Box>
            <Box position="absolute" bottom="25%" left="8%" w="150px" h="180px" borderRadius="2xl" overflow="hidden" border="3px solid rgba(255,255,255,0.2)" className="float-3" zIndex="2" boxShadow="0 20px 40px rgba(0,0,0,0.6)">
              <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=400&fit=crop" alt="Vidéo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <Box position="absolute" top="8px" left="8px" bg="red.500" color="white" px="6px" py="2px" borderRadius="md" fontSize="xs" fontWeight="bold">LIVE</Box>
            </Box>
          </Box>
        </Box>

        {/* 2. SECTION FONCTIONNALITÉS (SERVICES) */}
        <Box id="fonctionnalités" py={{ base: 16, md: 24 }} bg="rgba(10,10,10,0.8)">
          <Container maxW="7xl" px={{ base: 4, md: 8 }}>
            <Box textAlign="center" mb={16}>
              <Text fontSize={{ base: "2xl", md: "4xl" }} fontWeight="bold" color="white" mb={4}>Tout pour réussir votre carrière</Text>
              <Text color="gray.400" maxW="2xl" mx="auto" fontSize="lg">Une suite d'outils complète, pensée spécifiquement pour les réalités et les opportunités du marché africain.</Text>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {features.map((feature, index) => (
                <Box 
                  key={index} 
                  bg="rgba(26,26,26,0.6)" 
                  border="1px solid" 
                  borderColor="whiteAlpha.100" 
                  borderRadius="2xl" 
                  p={8}
                  transition="all 0.3s ease"
                  _hover={{ transform: "translateY(-5px)", borderColor: "whiteAlpha.300", bg: "rgba(26,26,26,0.9)" }}
                >
                  <Box w="14" h="14" bg="whiteAlpha.100" borderRadius="xl" display="flex" alignItems="center" justifyContent="center" color="white" mb={6}>
                    {feature.icon}
                  </Box>
                  <Text fontSize="xl" fontWeight="bold" color="white" mb={3}>{feature.title}</Text>
                  <Text fontSize="md" color="gray.400" lineHeight="1.6">{feature.desc}</Text>
                </Box>
              ))}
            </SimpleGrid>
          </Container>
        </Box>

        {/* 3. SECTION COMMENT ÇA MARCHE */}
        <Box id="comment-ça-marche" py={{ base: 16, md: 24 }} bg="rgba(17,17,17,0.9)">
          <Container maxW="7xl" px={{ base: 4, md: 8 }}>
            <Box textAlign="center" mb={16}>
              <Text fontSize={{ base: "2xl", md: "4xl" }} fontWeight="bold" color="white" mb={4}>Comment ça marche ?</Text>
              <Text color="gray.400" maxW="2xl" mx="auto" fontSize="lg">En 3 étapes simples, transformez votre passion en source de revenus récurrents.</Text>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 8, md: 12 }}>
              {steps.map((step, index) => (
                <Box key={index} position="relative" p={8}>
                  <Text fontSize="6xl" fontWeight="black" color="whiteAlpha.50" position="absolute" top="0" left="8" lineHeight="1">
                    {step.step}
                  </Text>
                  <Box position="relative" zIndex="1" mt={8}>
                    <Text fontSize="xl" fontWeight="bold" color="white" mb={4}>{step.title}</Text>
                    <Text color="gray.400" lineHeight="1.6" fontSize="md">{step.desc}</Text>
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          </Container>
        </Box>

        {/* 4. SECTION CONTACT / CTA FINAL */}
        <Box id="contact" py={{ base: 16, md: 24 }} bg="rgba(10,10,10,0.95)">
          <Container maxW="4xl" px={4} textAlign="center">
            <Box w="16" h="16" bg="white" borderRadius="full" display="flex" alignItems="center" justifyContent="center" mx="auto" mb={6}>
              <Zap color="black" size={32} />
            </Box>
            <Text fontSize={{ base: "2xl", md: "4xl" }} fontWeight="bold" color="white" mb={6}>
              Prêt à vivre de votre passion ?
            </Text>
            <Text color="gray.400" mb={10} fontSize="lg" maxW="2xl" mx="auto">
              Rejoignez les créateurs africains qui construisent leur indépendance financière sur Afrifan. Notre équipe est là pour vous accompagner à chaque étape.
            </Text>
            
            <Flex flexDir={{ base: "column", sm: "row" }} align="center" justify="center" gap={4}>
              <Link href="/register" style={{ textDecoration: "none", width: "100%" }}>
                <Button w={{ base: "100%", sm: "auto" }} px={8} py={7} bg="white" _hover={{ bg: "gray.200" }} color="black" fontWeight="semibold" borderRadius="xl" fontSize="md">
                  Créer mon compte gratuitement
                </Button>
              </Link>
              <Link href="mailto:support@afrifan.com" style={{ textDecoration: "none", width: "100%" }}>
                <Button w={{ base: "100%", sm: "auto" }} px={8} py={7} variant="outline" borderColor="whiteAlpha.300" color="white" _hover={{ bg: "whiteAlpha.100" }} fontWeight="semibold" borderRadius="xl" fontSize="md">
                  <Mail size={18} style={{ marginRight: "8px" }} />
                  Contacter le support
                </Button>
              </Link>
            </Flex>
          </Container>
        </Box>

        {/* 5. FOOTER */}
        <Box borderTop="1px solid" borderColor="whiteAlpha.100" py={12} bg="#050505">
          <Container maxW="7xl" px={{ base: 4, md: 8 }}>
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={8} mb={8}>
              <Box>
                <HStack spacing={2} mb={4}>
                  <Box w="8" h="8" bg="white" borderRadius="md" display="flex" alignItems="center" justifyContent="center">
                    <Zap color="black" size={18} />
                  </Box>
                  <Text fontSize="lg" fontWeight="bold" color="white">Afrifan</Text>
                </HStack>
                <Text fontSize="sm" color="gray.500" lineHeight="1.6">
                  La plateforme de monétisation dédiée aux créateurs de contenu en Afrique.
                </Text>
              </Box>
              
              <Box>
                <Text fontSize="sm" fontWeight="bold" color="white" mb={4} textTransform="uppercase" letterSpacing="wider">Plateforme</Text>
                <VStack align="flex-start" spacing={3}>
                  <Link href="#fonctionnalités" style={{ textDecoration: "none", width: "100%" }}>
                    <Text color="gray.400" fontSize="sm" _hover={{ color: "white" }} transition="color 0.2s">Fonctionnalités</Text>
                  </Link>
                  <Link href="#comment-ça-marche" style={{ textDecoration: "none", width: "100%" }}>
                    <Text color="gray.400" fontSize="sm" _hover={{ color: "white" }} transition="color 0.2s">Comment ça marche</Text>
                  </Link>
                  <Link href="/login" style={{ textDecoration: "none", width: "100%" }}>
                    <Text color="gray.400" fontSize="sm" _hover={{ color: "white" }} transition="color 0.2s">Connexion</Text>
                  </Link>
                </VStack>
              </Box>

              {/* ✅ LIENS LÉGAUX ACTUALISÉS ICI */}
              <Box>
                <Text fontSize="sm" fontWeight="bold" color="white" mb={4} textTransform="uppercase" letterSpacing="wider">Légal</Text>
                <VStack align="flex-start" spacing={3}>
                  <Link href="/terms" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", width: "100%" }}>
                    <Text color="gray.400" fontSize="sm" _hover={{ color: "white" }} transition="color 0.2s" cursor="pointer">Conditions d'utilisation</Text>
                  </Link>
                  <Link href="/privacy" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", width: "100%" }}>
                    <Text color="gray.400" fontSize="sm" _hover={{ color: "white" }} transition="color 0.2s" cursor="pointer">Politique de confidentialité</Text>
                  </Link>
                </VStack>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="bold" color="white" mb={4} textTransform="uppercase" letterSpacing="wider">Contact</Text>
                <VStack align="flex-start" spacing={3}>
                  <HStack spacing={2} color="gray.400" fontSize="sm">
                    <Mail size={16} />
                    <Text>support@afrifan.com</Text>
                  </HStack>
                </VStack>
              </Box>
            </SimpleGrid>
            
            <Box borderTop="1px solid" borderColor="whiteAlpha.100" pt={8} textAlign="center">
              <Text fontSize="sm" color="gray.600">
                © 2026 Afrifan. Tous droits réservés. Fait avec ❤️ pour les créateurs africains.
              </Text>
            </Box>
          </Container>
        </Box>

      </Box>
    </Box>
  );
}