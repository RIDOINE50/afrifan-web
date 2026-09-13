"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { ArrowLeft } from "lucide-react" // ✅ On utilise lucide-react (déjà installé)
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
    // ✅ ÉTAPE 1 : Vérifier si l'email existe déjà
    const { data: existingUsers } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.trim())
      .single()

    if (existingUsers) {
      //  L'email existe déjà !
      toast({
        title: "Email déjà utilisé",
        description: "Cet email est déjà enregistré. Veuillez vous connecter ou utiliser un autre email.",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
      setIsLoading(false)
      return
    }

    // ✅ ÉTAPE 2 : Email libre, on crée le compte
    const { error: supabaseError } = await supabase.auth.signUp({
      email: email.trim(),
      password: Math.random().toString(36).slice(-8), // Mot de passe temporaire
      options: {
        data: { full_name: fullName.trim() },
      },
    })

    if (supabaseError) throw supabaseError

    // ✅ ÉTAPE 3 : Envoyer le code OTP
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false, // Ne pas créer (déjà fait)
      },
    })

    if (otpError) throw otpError

    toast({
      title: "Code envoyé !",
      description: "Vérifiez votre boîte email.",
      status: "success",
      duration: 4000,
      isClosable: true,
    })

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
        {/* Bouton Retour avec Lucide React */}
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
                loadingText="Envoi du code..."
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