"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Sparkles, Loader2, Check } from "lucide-react"
import {
  Box,
  Button,
  Flex,
  SimpleGrid,
  Text,
  useToast,
} from "@chakra-ui/react"

export default function InterestsPage() {
  const router = useRouter()
  const toast = useToast()

  // Liste des catégories (identique à ton code Flutter)
  const categories = [
    "Musique", "Humour", "Art & Design", "Danse", 
    "Sport", "Mode", "Littérature", "Éducation", 
    "Cuisine", "Tech", "Voyage", "Autre"
  ]

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  // Fonction pour ajouter ou retirer une catégorie
  const toggleCategory = (category: string) => {
    const newSelected = new Set(selectedCategories)
    if (newSelected.has(category)) {
      newSelected.delete(category)
    } else {
      newSelected.add(category)
    }
    setSelectedCategories(newSelected)
  }

  const handleContinue = async () => {
    if (selectedCategories.size < 3) return

    setIsLoading(true)

    try {
      // ✅ SAUVEGARDE RÉELLE : Met à jour les métadonnées de l'utilisateur dans Supabase
      const { error } = await supabase.auth.updateUser({
        data: { 
          interests: Array.from(selectedCategories),
          onboarding_completed: true 
        }
      })

      if (error) throw error

      toast({
        title: "Profil configuré !",
        description: "Vos centres d'intérêt ont été enregistrés.",
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      // Redirection vers la page d'accueil principale de l'application
      router.push("/home") 
      
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde des intérêts:", error)
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue. Veuillez réessayer.",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedCount = selectedCategories.size
  const canContinue = selectedCount >= 3

  return (
    <Flex minH="100vh" bg="#0A0A0A" color="white" flexDirection="column" p={{ base: 4, sm: 8 }}>
      
      {/* En-tête */}
      <Box mb={6}>
        <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" mb={2}>
          Choisissez vos centres d'intérêt
        </Text>
        <Text color="gray.400" fontSize="sm">
          Sélectionnez au moins <Text as="span" color="white" fontWeight="bold">3 catégories</Text> qui vous intéressent pour personnaliser votre fil d'actualité.
        </Text>
      </Box>

      {/* Grille des catégories */}
      <Box flex="1" overflowY="auto" pr={2} mb={6}>
        <SimpleGrid columns={{ base: 2, sm: 3 }} spacing={3}>
          {categories.map((category) => {
            const isSelected = selectedCategories.has(category)
            
            return (
              <Button
                key={category}
                onClick={() => toggleCategory(category)}
                variant="outline"
                height="120px"
                flexDirection="column"
                gap={3}
                borderWidth={isSelected ? "2px" : "1px"}
                borderColor={isSelected ? "white" : "transparent"}
                bg={isSelected ? "rgba(255, 255, 255, 0.08)" : "#1A1A1A"}
                color={isSelected ? "white" : "gray.400"}
                _hover={{
                  bg: isSelected ? "rgba(255, 255, 255, 0.12)" : "#252525",
                  borderColor: isSelected ? "white" : "rgba(255, 255, 255, 0.1)",
                }}
                _active={{ transform: "scale(0.98)" }}
                transition="all 0.2s"
                position="relative"
              >
                <Sparkles size={28} />
                <Text fontSize="sm" fontWeight="semibold" textAlign="center" lineHeight="1.2">
                  {category}
                </Text>
                
                {/* Petit indicateur visuel de sélection (checkmark) */}
                {isSelected && (
                  <Flex
                    position="absolute"
                    top={2}
                    right={2}
                    w={5}
                    h={5}
                    bg="white"
                    borderRadius="full"
                    align="center"
                    justify="center"
                  >
                    <Check size={12} color="#0A0A0A" strokeWidth={3} />
                  </Flex>
                )}
              </Button>
            )
          })}
        </SimpleGrid>
      </Box>

      {/* Bouton d'action en bas */}
      <Box pt={4} borderTop="1px solid rgba(255, 255, 255, 0.05)">
        <Button
          onClick={handleContinue}
          isDisabled={!canContinue || isLoading}
          isLoading={isLoading}
          loadingText="Configuration..."
          w="100%"
          h="50px"
          bg={canContinue ? "white" : "#1A1A1A"}
          color={canContinue ? "black" : "gray.600"}
          _hover={canContinue ? { bg: "gray.200" } : {}}
          _disabled={{ cursor: "not-allowed", opacity: 0.7 }}
          fontWeight="bold"
          fontSize="base"
        >
          Continuer ({selectedCount}/3 min.)
        </Button>
        
        {!canContinue && selectedCount > 0 && (
          <Text textAlign="center" fontSize="xs" color="orange.400" mt={3}>
            Veuillez sélectionner au moins 3 catégories pour continuer.
          </Text>
        )}
      </Box>

    </Flex>
  )
}