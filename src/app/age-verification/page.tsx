"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import { useAppTheme } from "@/contexts/ThemeContext"
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react"

export default function AgeVerificationPage() {
  const router = useRouter()
  const toast = useToast()
  const { isDark, theme } = useAppTheme()
  const [isAdult, setIsAdult] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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
  }

  const handleContinue = async () => {
    if (!isAdult) return

    setIsLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push("/interests")
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Flex minH="100vh" bg={colors.bg} color={colors.text} align="center" justify="center" p={4}>
      <Box w="100%" maxW="400px">
        
        {/* Bouton Retour */}
        <Button
          variant="ghost"
          leftIcon={<ArrowLeft size={20} />}
          onClick={() => router.push("/create-password")}
          color={colors.textMuted}
          _hover={{ color: colors.text, bg: "transparent" }}
          mb={6}
        >
          Retour
        </Button>

        <VStack spacing={6} align="stretch">
          
          {/* En-tête et Icône */}
          <Box textAlign="center">
            <Flex 
              w="24" 
              h="24" 
              bg={colors.hover}
              border={`1px solid ${colors.border}`}
              borderRadius="16px" 
              align="center" 
              justify="center" 
              mx="auto" 
              mb={6}
            >
              <ShieldCheck color={colors.primary} size={48} />
            </Flex>
            
            <Text fontSize="3xl" fontWeight="bold" mb={3} color={colors.text}>Vérification d'âge</Text>
            <Text color={colors.textMuted} fontSize="base" lineHeight="relaxed">
              Vous devez avoir au moins <Text as="span" color={colors.text} fontWeight="bold">18 ans</Text> pour utiliser Afrifan et accéder à certaines fonctionnalités de la plateforme.
            </Text>
          </Box>

          {/* Formulaire de vérification */}
          <Box bg={colors.card} border={`1px solid ${colors.border}`} borderRadius="16px" p={6}>
            <VStack spacing={6} align="stretch">
              
              {/* Checkbox */}
              <Checkbox 
                isChecked={isAdult} 
                onChange={(e) => setIsAdult(e.target.checked)}
                colorScheme="purple"
                fontSize="md"
                fontWeight="medium"
                color={colors.textMuted}
                _hover={{ color: colors.text }}
              >
                Je confirme avoir 18 ans ou plus
              </Checkbox>

              {/* Bouton d'action */}
              <Button
                onClick={handleContinue}
                isDisabled={!isAdult || isLoading}
                isLoading={isLoading}
                loadingText="Redirection..."
                w="100%"
                h="50px"
                bg={colors.primary}
                color={colors.primaryText}
                _hover={{ opacity: 0.9 }}
                _disabled={{ bg: colors.border, cursor: "not-allowed" }}
                fontWeight="semibold"
              >
                Continuer
              </Button>
            </VStack>
          </Box>

          {/* Petit texte légal en bas */}
          <Text textAlign="center" fontSize="xs" color={colors.textMuted} px={4}>
            En cliquant sur "Continuer", vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité, et vous certifiez que les informations fournies sont exactes.
          </Text>

        </VStack>
      </Box>
    </Flex>
  )
}