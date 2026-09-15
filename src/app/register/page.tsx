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

  const isButtonDisabled = isLoading || emailExists || isCheckingEmail

  return (
    <Flex minH="100vh" bg="#0A0A0A" color="white" align="center" justify="center" p={4}>
      <Box w="100%" maxW="400px">
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
          <Box>
            <Text fontSize="3xl" fontWeight="bold" mb={2}>Créer un compte</Text>
            <Text color="gray.400" fontSize="sm">Rejoignez la première plateforme de Creator Economy en Afrique.</Text>
          </Box>

          <Box as="form" onSubmit={handleRegister}>
            <VStack spacing={4}>
              <Input
                placeholder="Nom complet"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                bg="#1A1A1A"
                border="1px solid"
                borderColor="#2A2A2A"
                _focus={{ borderColor: "white", boxShadow: "none" }}
                h="50px"
                color="white"
                _placeholder={{ color: "gray.500" }}
              />

              <Box w="100%" position="relative">
                <Input
                  type="email"
                  placeholder="Adresse email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  bg="#1A1A1A"
                  border="1px solid"
                  borderColor={emailError ? "red.500" : "#2A2A2A"}
                  _focus={{ borderColor: emailExists ? "red.500" : "white", boxShadow: "none" }}
                  h="50px"
                  color="white"
                  _placeholder={{ color: "gray.500" }}
                  pr="40px"
                />

                {isCheckingEmail && (
                  <Flex
                    position="absolute"
                    right="12px"
                    top="50%"
                    transform="translateY(-50%)"
                    w="20px"
                    h="20px"
                    borderRadius="full"
                    border="2px solid"
                    borderColor="white"
                    borderTopColor="transparent"
                    animation="spin 1s linear infinite"
                  />
                )}
                {emailExists && !isCheckingEmail && (
                  <Flex position="absolute" right="12px" top="50%" transform="translateY(-50%)" color="red.400">
                    <AlertCircle size={20} />
                  </Flex>
                )}
                {!emailExists && !isCheckingEmail && email.trim() && isValidEmail(email) && (
                  <Flex position="absolute" right="12px" top="50%" transform="translateY(-50%)" color="green.400">
                    <CheckCircle size={20} />
                  </Flex>
                )}
              </Box>

              {emailError && (
                <HStack
                  w="100%"
                  bg="red.500/10"
                  border="1px solid"
                  borderColor="red.500/30"
                  borderRadius="lg"
                  p={3}
                  spacing={2}
                >
                  <AlertCircle size={16} color="#EF4444" />
                  <Text fontSize="sm" color="red.400">
                    {emailError}{" "}
                    <ChakraLink
                      color="white"
                      fontWeight="bold"
                      onClick={() => router.push("/login")}
                      cursor="pointer"
                    >
                      Se connecter
                    </ChakraLink>
                  </Text>
                </HStack>
              )}

              <Flex align="flex-start" w="100%">
                <Checkbox
                  isChecked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  mr={3}
                  mt={1}
                  sx={{
                    "& .chakra-checkbox__control": {
                      borderColor: "#2A2A2A",
                      bg: "#1A1A1A",
                      _checked: {
                        bg: "white",
                        borderColor: "white",
                        color: "black",
                        _hover: { bg: "white", borderColor: "white" },
                      },
                      _hover: { borderColor: "white" },
                    },
                  }}
                >
                  <Text fontSize="sm" color="gray.400" lineHeight="1.4">
                    J'accepte les{" "}
                    <ChakraLink color="white" fontWeight="bold" _hover={{ textDecoration: "underline" }}>
                      Conditions d'utilisation
                    </ChakraLink>{" "}
                    et la{" "}
                    <ChakraLink color="white" fontWeight="bold" _hover={{ textDecoration: "underline" }}>
                      Politique de confidentialité
                    </ChakraLink>
                  </Text>
                </Checkbox>
              </Flex>

              <Button
                type="submit"
                w="100%"
                h="50px"
                bg={emailExists ? "gray.700" : "white"}
                color={emailExists ? "gray.400" : "black"}
                _hover={emailExists ? {} : { bg: "gray.200" }}
                isLoading={isLoading}
                loadingText="Vérification en cours..."
                fontWeight="bold"
                mt={4}
                isDisabled={isButtonDisabled}
              >
                {emailExists ? "Email déjà utilisé" : isCheckingEmail ? "Vérification de l'email..." : "Recevoir le code"}
              </Button>
            </VStack>
          </Box>

          <Text textAlign="center" fontSize="sm" color="gray.400">
            Déjà un compte ?{" "}
            <ChakraLink
              color="white"
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

      <style>{`
        @keyframes spin {
          0% { transform: translateY(-50%) rotate(0deg); }
          100% { transform: translateY(-50%) rotate(360deg); }
        }
      `}</style>
    </Flex>
  )
}