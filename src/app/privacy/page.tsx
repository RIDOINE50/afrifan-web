"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Box, Container, Heading, Text, VStack, UnorderedList, ListItem, Button } from "@chakra-ui/react";

export default function PrivacyPage() {
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
              <ShieldCheck size={32} color="#FFFFFF" />
              <Heading as="h1" fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
                Politique de confidentialité
              </Heading>
            </Box>
            <Text color="gray.400" fontSize="sm">Dernière mise à jour : 25 Septembre 2026</Text>
          </Box>

          <VStack align="flex-start" spacing={6} w="100%">
            <Box>
              <Heading as="h2" fontSize="xl" fontWeight="bold" mb={3} color="white">1. Introduction</Heading>
              <Text color="gray.300" lineHeight="1.7">
                Chez Afrifan, nous accordons une importance capitale à la protection de vos données personnelles. Cette politique décrit comment nous collectons, utilisons et protégeons vos informations lorsque vous utilisez notre plateforme.
              </Text>
            </Box>

            <Box>
              <Heading as="h2" fontSize="xl" fontWeight="bold" mb={3} color="white">2. Données que nous collectons</Heading>
              <UnorderedList color="gray.300" spacing={2} lineHeight="1.7" style={{ listStyleType: "disc", paddingLeft: "20px" }}>
                <ListItem><Text as="span" color="white" fontWeight="semibold">Données d'inscription :</Text> Nom complet, adresse e-mail, mot de passe.</ListItem>
                <ListItem><Text as="span" color="white" fontWeight="semibold">Données de paiement :</Text> Numéro de téléphone Mobile Money (nécessaire pour les retraits et les achats). Nous ne stockons pas vos codes PIN ou mots de passe de compte bancaire.</ListItem>
                <ListItem><Text as="span" color="white" fontWeight="semibold">Données d'utilisation :</Text> Contenu publié, interactions (likes, commentaires), et données de navigation pour améliorer l'expérience utilisateur.</ListItem>
              </UnorderedList>
            </Box>

            <Box>
              <Heading as="h2" fontSize="xl" fontWeight="bold" mb={3} color="white">3. Utilisation des données</Heading>
              <Text color="gray.300" lineHeight="1.7" mb={3}>
                Nous utilisons vos données pour :
              </Text>
              <UnorderedList color="gray.300" spacing={2} lineHeight="1.7" style={{ listStyleType: "disc", paddingLeft: "20px" }}>
                <ListItem>Fournir, maintenir et améliorer les services de la plateforme.</ListItem>
                <ListItem>Traiter vos paiements et vos retraits de manière sécurisée via nos partenaires de confiance.</ListItem>
                <ListItem>Vous envoyer des notifications importantes concernant votre compte.</ListItem>
                <ListItem>Assurer la sécurité de la plateforme et prévenir les fraudes.</ListItem>
              </UnorderedList>
            </Box>

            <Box>
              <Heading as="h2" fontSize="xl" fontWeight="bold" mb={3} color="white">4. Partage des données</Heading>
              <Text color="gray.300" lineHeight="1.7">
                Nous ne vendons jamais vos données personnelles. Nous pouvons partager certaines informations avec des tiers de confiance uniquement dans les cas suivants :
              </Text>
              <UnorderedList color="gray.300" spacing={2} lineHeight="1.7" mt={2} style={{ listStyleType: "disc", paddingLeft: "20px" }}>
                <ListItem><Text as="span" color="white" fontWeight="semibold">Prestataires de paiement :</Text> Pour faciliter les transactions Mobile Money.</ListItem>
                <ListItem><Text as="span" color="white" fontWeight="semibold">Hébergeurs et services techniques :</Text> Comme Supabase et Vercel, qui hébergent nos serveurs de manière sécurisée.</ListItem>
                <ListItem><Text as="span" color="white" fontWeight="semibold">Obligations légales :</Text> Si la loi nous y oblige ou pour protéger nos droits et ceux de nos utilisateurs.</ListItem>
              </UnorderedList>
            </Box>

            <Box>
              <Heading as="h2" fontSize="xl" fontWeight="bold" mb={3} color="white">5. Sécurité des données</Heading>
              <Text color="gray.300" lineHeight="1.7">
                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles (chiffrement des données, accès restreint) pour protéger vos informations contre tout accès non autorisé, perte ou altération.
              </Text>
            </Box>

            <Box>
              <Heading as="h2" fontSize="xl" fontWeight="bold" mb={3} color="white">6. Vos droits</Heading>
              <Text color="gray.300" lineHeight="1.7" mb={3}>
                Conformément aux réglementations en vigueur, vous disposez des droits suivants :
              </Text>
              <UnorderedList color="gray.300" spacing={2} lineHeight="1.7" style={{ listStyleType: "disc", paddingLeft: "20px" }}>
                <ListItem><Text as="span" color="white" fontWeight="semibold">Droit d'accès et de rectification :</Text> Vous pouvez modifier vos informations dans les paramètres de votre compte.</ListItem>
                <ListItem><Text as="span" color="white" fontWeight="semibold">Droit à l'effacement :</Text> Vous pouvez demander la suppression définitive de votre compte et de vos données via les paramètres de confidentialité.</ListItem>
              </UnorderedList>
            </Box>

            <Box>
              <Heading as="h2" fontSize="xl" fontWeight="bold" mb={3} color="white">7. Contact</Heading>
              <Text color="gray.300" lineHeight="1.7">
                Pour toute question relative à cette politique ou pour exercer vos droits, contactez notre délégué à la protection des données à : <Text as="span" color="white" fontWeight="bold">privacy@afrifan.com</Text>
              </Text>
            </Box>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
}