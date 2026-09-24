"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Box, Container, Heading, Text, VStack, UnorderedList, ListItem, Button } from "@chakra-ui/react";

export default function TermsPage() {
  const router = useRouter();

  return (
    <Box minH="100vh" bg="#0A0A0A" color="white" py={12}>
      <Container maxW="4xl" px={{ base: 4, md: 8 }}>
        
        {/* Bouton Retour */}
        <Button 
          variant="ghost" 
          leftIcon={<ArrowLeft size={20} />} 
          onClick={() => router.back()} 
          color="gray.400" 
          _hover={{ color: "white", bg: "whiteAlpha.100" }} 
          mb={8}
        >
          Retour
        </Button>

        <VStack align="flex-start" spacing={8}>
          <Box>
            <Box display="flex" alignItems="center" gap={3} mb={4}>
              <FileText size={32} color="#FFFFFF" />
              <Heading as="h1" fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
                Conditions d'utilisation
              </Heading>
            </Box>
            <Text color="gray.400" fontSize="sm">Dernière mise à jour : 25 Septembre 2026</Text>
          </Box>

          <VStack align="flex-start" spacing={6} w="100%">
            <Box>
              <Heading as="h2" fontSize="xl" fontWeight="bold" mb={3} color="white">1. Acceptation des conditions</Heading>
              <Text color="gray.300" lineHeight="1.7">
                En accédant ou en utilisant la plateforme Afrifan, vous acceptez d'être lié par les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.
              </Text>
            </Box>

            <Box>
              <Heading as="h2" fontSize="xl" fontWeight="bold" mb={3} color="white">2. Description du service</Heading>
              <Text color="gray.300" lineHeight="1.7">
                Afrifan est une plateforme de "Creator Economy" permettant aux créateurs de contenu en Afrique de monétiser leur audience via des abonnements, des pourboires et du contenu exclusif. Les paiements sont principalement traités via des solutions de Mobile Money (MTN, Orange, Moov, Wave, etc.).
              </Text>
            </Box>

            <Box>
              <Heading as="h2" fontSize="xl" fontWeight="bold" mb={3} color="white">3. Inscription et Compte</Heading>
              <UnorderedList color="gray.300" spacing={2} lineHeight="1.7" style={{ listStyleType: "disc", paddingLeft: "20px" }}>
                <ListItem>Vous devez avoir au moins 18 ans pour créer un compte créateur.</ListItem>
                <ListItem>Vous êtes responsable de la confidentialité de vos identifiants de connexion.</ListItem>
                <ListItem>La création de faux comptes ou l'usurpation d'identité est strictement interdite et entraînera la suppression immédiate du compte.</ListItem>
                <ListItem>Nous nous réservons le droit de suspendre ou de bannir tout compte en cas de violation de ces règles.</ListItem>
              </UnorderedList>
            </Box>

            <Box>
              <Heading as="h2" fontSize="xl" fontWeight="bold" mb={3} color="white">4. Règles de publication</Heading>
              <Text color="gray.300" lineHeight="1.7" mb={3}>
                Il est strictement interdit de publier sur Afrifan :
              </Text>
              <UnorderedList color="gray.300" spacing={2} lineHeight="1.7" style={{ listStyleType: "disc", paddingLeft: "20px" }}>
                <ListItem>Du contenu illégal, haineux, discriminatoire ou violent.</ListItem>
                <ListItem>Du contenu portant atteinte aux droits d'auteur ou à la propriété intellectuelle d'autrui.</ListItem>
                <ListItem>Des arnaques, du phishing ou toute activité frauduleuse.</ListItem>
              </UnorderedList>
            </Box>

            <Box>
              <Heading as="h2" fontSize="xl" fontWeight="bold" mb={3} color="white">5. Paiements et Retraits</Heading>
              <Text color="gray.300" lineHeight="1.7">
                Afrifan prélève une commission de 15% sur les revenus générés par les créateurs pour couvrir les frais de transaction et la maintenance de la plateforme. Les retraits sont effectués vers les comptes Mobile Money enregistrés sous un délai maximum de 24 à 48 heures ouvrables, sous réserve de validation.
              </Text>
            </Box>

            <Box>
              <Heading as="h2" fontSize="xl" fontWeight="bold" mb={3} color="white">6. Contact</Heading>
              <Text color="gray.300" lineHeight="1.7">
                Pour toute question concernant ces conditions, veuillez nous contacter à : <Text as="span" color="white" fontWeight="bold">support@afrifan.com</Text>
              </Text>
            </Box>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
}