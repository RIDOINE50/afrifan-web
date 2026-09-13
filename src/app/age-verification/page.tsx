"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ShieldCheck, Loader2 } from "lucide-react"
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
  const [isAdult, setIsAdult] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleContinue = async () => {
    if (!isAdult) return

    setIsLoading(true)

    try {
      // NOTE : Si tu veux enregistrer cette vérification dans Supabase, décommente ceci :
      // const { supabase } = await import("@/lib/supabaseClient")
      // await supabase.auth.updateUser({ data: { age_verified: true } })
      
      // Simulation d'un petit délai pour l'UX
      await new Promise(resolve => setTimeout(resolve, 500))

      // Redirection vers l'écran des centres d'intérêt
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
    <Flex minH="100vh" bg="#0A0A0A" color="white" align="center" justify="center" p={4}>
      <Box w="100%" maxW="400px">
        
        {/* Bouton Retour */}
        <Button
          variant="ghost"
          leftIcon={<ArrowLeft size={20} />}
          onClick={() => router.push("/create-password")}
          color="gray.400"
          _hover={{ color: "white", bg: "transparent" }}
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
              bg="rgba(139, 92, 246, 0.1)" 
              border="1px solid rgba(139, 92, 246, 0.2)" 
              borderRadius="16px" 
              align="center" 
              justify="center" 
              mx="auto" 
              mb={6}
            >
              <ShieldCheck color="#8B5CF6" size={48} />
            </Flex>
            
            <Text fontSize="3xl" fontWeight="bold" mb={3}>Vérification d'âge</Text>
            <Text color="gray.400" fontSize="base" lineHeight="relaxed">
              Vous devez avoir au moins <Text as="span" color="white" fontWeight="bold">18 ans</Text> pour utiliser Afrifan et accéder à certaines fonctionnalités de la plateforme.
            </Text>
          </Box>

          {/* Formulaire de vérification */}
          <Box bg="#1A1A1A" border="1px solid rgba(255, 255, 255, 0.05)" borderRadius="16px" p={6}>
            <VStack spacing={6} align="stretch">
              
              {/* Checkbox */}
              <Checkbox 
                isChecked={isAdult} 
                onChange={(e) => setIsAdult(e.target.checked)}
                colorScheme="purple"
                fontSize="md"
                fontWeight="medium"
                color="gray.300"
                _hover={{ color: "white" }}
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
                bg="#8B5CF6"
                _hover={{ bg: "#7C3AED" }}
                _disabled={{ bg: "rgba(139, 92, 246, 0.3)", cursor: "not-allowed" }}
                fontWeight="semibold"
              >
                Continuer
              </Button>
            </VStack>
          </Box>

          {/* Petit texte légal en bas */}
          <Text textAlign="center" fontSize="xs" color="gray.500" px={4}>
            En cliquant sur "Continuer", vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité, et vous certifiez que les informations fournies sont exactes.
          </Text>

        </VStack>
      </Box>
    </Flex>
  )
}