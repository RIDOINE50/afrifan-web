"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react"
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
  HStack,
} from "@chakra-ui/react"

export default function RegisterPage() {
  const router = useRouter()
  const toast = useToast()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [accepted, setAccepted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // ✅ Nouveaux états pour la vérification en temps réel
  const [emailExists, setEmailExists] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [emailError, setEmailError] = useState("")

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // ✅ Vérification en temps réel avec debounce (500ms)
  useEffect(() => {
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      setEmailExists(false)
      setEmailError("")
      return
    }

    const timer = setTimeout(async () => {
      setIsCheckingEmail(true)
      setEmailError("")

      try {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", trimmedEmail)
          .maybeSingle()

        if (existingProfile) {
          setEmailExists(true)
          setEmailError("Cet email est déjà utilisé. Veuillez vous connecter.")
        } else {
          setEmailExists(false)
          setEmailError("")
        }
      } catch (err) {
        console.error("Erreur vérification email:", err)
        setEmailError("")
      } finally {
        setIsCheckingEmail(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [email])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!accepted) {
      toast({ title: "Veuillez accepter les conditions d'utilisation.", status: "warning", duration: 3000, isClosable: true })
      return
    }
    if (!fullName.trim() || !email.trim()) {
      toast({ title: "Veuillez remplir tous les champs.", status: "warning", duration: 3000, isClosable: true })
      return
    }
    if (!isValidEmail(email)) {
      toast({ title: "Veuillez entrer une adresse email valide.", status: "warning", duration: 3000, isClosable: true })
      return
    }

    if (emailExists) {
      toast({ title: "Email déjà utilisé", description: "Cet email est déjà enregistré. Veuillez vous connecter.", status: "error", duration: 5000, isClosable: true })
      return
    }

    setIsLoading(true)

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: Math.random().toString(36).slice(-8),
        options: { data: { full_name: fullName.trim() } },
      })

      if (signUpError) throw signUpError

      toast({ title: "Compte créé avec succès !", description: "Vérifiez votre boîte email pour obtenir votre code à 8 chiffres.", status: "success", duration: 4000, isClosable: true })
      router.push(`/verify-otp?email=${encodeURIComponent(email.trim())}`)
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Une erreur est survenue. Veuillez réessayer.", status: "error", duration: 4000, isClosable: true })
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ NOUVEAU : Fonction pour la connexion Google
  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      toast({
        title: "Erreur de connexion",
        description: err.message || "Impossible de se connecter avec Google.",
        status: "error",
        duration: 4000,
        isClosable: true,
      })
    }
  }

  const isButtonDisabled = isLoading || emailExists || isCheckingEmail

  return (
    <Flex minH="100vh" bg="#0A0A0A" color="white" align="center" justify="center" p={4}>
      <Box w="100%" maxW="400px">
        <Button variant="ghost" leftIcon={<ArrowLeft size={20} />} onClick={() => router.push("/")} color="gray.400" _hover={{ color: "white", bg: "transparent" }} mb={6}>
          Retour à l'accueil
        </Button>

        <VStack spacing={6} align="stretch">
          <Box>
            <Text fontSize="3xl" fontWeight="bold" mb={2}>Créer un compte</Text>
            <Text color="gray.400" fontSize="sm">Rejoignez la première plateforme de Creator Economy en Afrique.</Text>
          </Box>

          <Box as="form" onSubmit={handleRegister}>
            <VStack spacing={4}>
              <Input placeholder="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} bg="#1A1A1A" border="1px solid #2A2A2A" _focus={{ borderColor: "#8B5CF6", boxShadow: "none" }} h="50px" color="white" _placeholder={{ color: "gray.500" }} />

              <Box w="100%" position="relative">
                <Input type="email" placeholder="Adresse email" value={email} onChange={(e) => setEmail(e.target.value)} bg="#1A1A1A" border="1px solid" borderColor={emailError ? "red.500" : "#2A2A2A"} _focus={{ borderColor: emailExists ? "red.500" : "#8B5CF6", boxShadow: "none" }} h="50px" color="white" _placeholder={{ color: "gray.500" }} pr="40px" />
                
                {isCheckingEmail && <Flex position="absolute" right="12px" top="50%" transform="translateY(-50%)" w="20px" h="20px" borderRadius="full" border="2px solid #8B5CF6" borderTopColor="transparent" animation="spin 1s linear infinite" />}
                {emailExists && !isCheckingEmail && <Flex position="absolute" right="12px" top="50%" transform="translateY(-50%)" color="red.400"><AlertCircle size={20} /></Flex>}
                {!emailExists && !isCheckingEmail && email.trim() && isValidEmail(email) && <Flex position="absolute" right="12px" top="50%" transform="translateY(-50%)" color="green.400"><CheckCircle size={20} /></Flex>}
              </Box>

              {emailError && (
                <HStack w="100%" bg="red.500/10" border="1px solid" borderColor="red.500/30" borderRadius="lg" p={3} spacing={2}>
                  <AlertCircle size={16} color="#EF4444" />
                  <Text fontSize="sm" color="red.400">{emailError} <ChakraLink color="#8B5CF6" fontWeight="bold" onClick={() => router.push("/login")} cursor="pointer">Se connecter</ChakraLink></Text>
                </HStack>
              )}

              <Flex align="flex-start" w="100%">
                <Checkbox isChecked={accepted} onChange={(e) => setAccepted(e.target.checked)} colorScheme="purple" mr={3} mt={1}>
                  <Text fontSize="sm" color="gray.400" lineHeight="1.4">
                    J'accepte les <ChakraLink color="#8B5CF6" _hover={{ textDecoration: "underline" }}>Conditions d'utilisation</ChakraLink> et la <ChakraLink color="#8B5CF6" _hover={{ textDecoration: "underline" }}>Politique de confidentialité</ChakraLink>
                  </Text>
                </Checkbox>
              </Flex>

              <Button type="submit" w="100%" h="50px" bg={emailExists ? "gray.600" : "#8B5CF6"} _hover={emailExists ? {} : { bg: "#7C3AED" }} isLoading={isLoading} loadingText="Vérification en cours..." fontWeight="bold" mt={4} isDisabled={isButtonDisabled}>
                {emailExists ? "Email déjà utilisé" : isCheckingEmail ? "Vérification de l'email..." : "Recevoir le code"}
              </Button>
            </VStack>
          </Box>

          {/* ✅ NOUVEAU : Séparateur "OU" */}
          <Flex align="center" w="100%" my={2}>
            <Box flex="1" h="1px" bg="#2A2A2A" />
            <Text px={4} color="gray.500" fontSize="sm">ou</Text>
            <Box flex="1" h="1px" bg="#2A2A2A" />
          </Flex>

          {/* ✅ NOUVEAU : Bouton Google avec le vrai logo */}
          <Button
            w="100%"
            h="50px"
            bg="white"
            color="#1A1A1A"
            _hover={{ bg: "gray.100" }}
            fontWeight="medium"
            onClick={handleGoogleSignIn}
            leftIcon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
            }
          >
            Continuer avec Google
          </Button>

          <Text textAlign="center" fontSize="sm" color="gray.400">
            Déjà un compte ?{" "}
            <ChakraLink color="#8B5CF6" fontWeight="bold" _hover={{ textDecoration: "underline" }} onClick={() => router.push("/login")} cursor="pointer">
              Se connecter
            </ChakraLink>
          </Text>
        </VStack>
      </Box>

      <style>{`
        @keyframes spin {
          0% { transform: translateY(-50%) rotate(0deg); }
          100% { transform: translateY(-50%) rotate(360deg); }
        }
      `}</style>
    </Flex>
  )
}