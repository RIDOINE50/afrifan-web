"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { ArrowLeft } from "lucide-react"
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Input,
  Link as ChakraLink,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react"

export default function RegisterPage() {
  const router = useRouter()
  const toast = useToast()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [accepted, setAccepted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!accepted) {
      toast({
        title: "Veuillez accepter les conditions d'utilisation.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      })
      return
    }
    if (!fullName.trim() || !email.trim()) {
      toast({
        title: "Veuillez remplir tous les champs.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      })
      return
    }
    if (!isValidEmail(email)) {
      toast({
        title: "Veuillez entrer une adresse email valide.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsLoading(true)

    try {
      // ✅ ÉTAPE UNIQUE : Tenter d'inscrire l'utilisateur.
      // Supabase vérifie AUTOMATIQUEMENT et de manière sécurisée si l'email existe déjà.
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: Math.random().toString(36).slice(-8), // Mot de passe temporaire requis par signUp
        options: {
          data: { full_name: fullName.trim() },
        },
      })

      if (signUpError) {
        // Vérifier si l'erreur est due à un email déjà utilisé
        const errorMsg = signUpError.message.toLowerCase()
        if (
          errorMsg.includes("already registered") || 
          errorMsg.includes("already exists") || 
          errorMsg.includes("déjà")
        ) {
          toast({
            title: "Email déjà utilisé",
            description: "Cet email est déjà enregistré. Veuillez vous connecter.",
            status: "error",
            duration: 5000,
            isClosable: true,
          })
          setIsLoading(false)
          return // 🛑 On arrête tout ici, aucun code n'est envoyé !
        }
        
        // Si c'est une autre erreur, on la lance pour l'afficher
        throw signUpError
      }

      // ✅ Si l'inscription réussit, Supabase envoie automatiquement le mail de confirmation (qui contient ton code OTP)
      toast({
        title: "Compte créé avec succès !",
        description: "Vérifiez votre boîte email pour obtenir votre code à 8 chiffres.",
        status: "success",
        duration: 4000,
        isClosable: true,
      })

      // Redirection vers la page de vérification
      router.push(`/verify-otp?email=${encodeURIComponent(email.trim())}`)
      
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Une erreur est survenue. Veuillez réessayer.",
        status: "error",
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Flex
      minH="100vh"
      bg="#0A0A0A"
      color="white"
      align="center"
      justify="center"
      p={4}
    >
      <Box w="100%" maxW="400px">
        {/* Bouton Retour */}
        <Button
          variant="ghost"
          leftIcon={<ArrowLeft size={20} />}
          onClick={() => router.push("/")}
          color="gray.400"
          _hover={{ color: "white", bg: "transparent" }}
          mb={6}
        >
          Retour à l'accueil
        </Button>

        <VStack spacing={6} align="stretch">
          {/* En-tête */}
          <Box>
            <Text fontSize="3xl" fontWeight="bold" mb={2}>
              Créer un compte
            </Text>
            <Text color="gray.400" fontSize="sm">
              Rejoignez la première plateforme de Creator Economy en Afrique.
            </Text>
          </Box>

          {/* Formulaire */}
          <Box as="form" onSubmit={handleRegister}>
            <VStack spacing={4}>
              <Input
                placeholder="Nom complet"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                bg="#1A1A1A"
                border="1px solid #2A2A2A"
                _focus={{ borderColor: "#8B5CF6", boxShadow: "none" }}
                h="50px"
                color="white"
                _placeholder={{ color: "gray.500" }}
              />
              <Input
                type="email"
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                bg="#1A1A1A"
                border="1px solid #2A2A2A"
                _focus={{ borderColor: "#8B5CF6", boxShadow: "none" }}
                h="50px"
                color="white"
                _placeholder={{ color: "gray.500" }}
              />

              <Flex align="flex-start" w="100%">
                <Checkbox
                  isChecked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  colorScheme="purple"
                  mr={3}
                  mt={1}
                >
                  <Text fontSize="sm" color="gray.400" lineHeight="1.4">
                    J'accepte les{" "}
                    <ChakraLink color="#8B5CF6" _hover={{ textDecoration: "underline" }}>
                      Conditions d'utilisation
                    </ChakraLink>{" "}
                    et la{" "}
                    <ChakraLink color="#8B5CF6" _hover={{ textDecoration: "underline" }}>
                      Politique de confidentialité
                    </ChakraLink>
                  </Text>
                </Checkbox>
              </Flex>

              <Button
                type="submit"
                w="100%"
                h="50px"
                bg="#8B5CF6"
                _hover={{ bg: "#7C3AED" }}
                isLoading={isLoading}
                loadingText="Vérification en cours..."
                fontWeight="bold"
                mt={4}
              >
                Recevoir le code
              </Button>
            </VStack>
          </Box>

          {/* Lien vers Login */}
          <Text textAlign="center" fontSize="sm" color="gray.400">
            Déjà un compte ?{" "}
            <ChakraLink
              color="#8B5CF6"
              fontWeight="bold"
              _hover={{ textDecoration: "underline" }}
              onClick={() => router.push("/login")}
              cursor="pointer"
            >
              Se connecter
            </ChakraLink>
          </Text>
        </VStack>
      </Box>
    </Flex>
  )
}