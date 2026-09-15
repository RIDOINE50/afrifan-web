"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { ArrowLeft, Mail } from "lucide-react"
import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  VStack,
  useToast,
  Spinner,
} from "@chakra-ui/react"

// ✅ 1. Le contenu réel est isolé dans ce sous-composant
function VerifyOtpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()

  const email = searchParams.get("email")

  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!email) {
      router.push("/register")
    }
  }, [email, router])

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    if (value.length <= 8) {
      setOtp(value)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()

    if (otp.length !== 8) {
      toast({
        title: "Code invalide",
        description: "Le code doit contenir exactement 8 chiffres.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsLoading(true)

    try {
      const { error: supabaseError } = await supabase.auth.verifyOtp({
        email: email!,
        token: otp,
        type: "signup",
      })

      if (supabaseError) throw supabaseError

      toast({
        title: "Succès !",
        description: "Email vérifié avec succès.",
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      router.push(`/create-password?email=${encodeURIComponent(email!)}`)
      
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Code invalide ou expiré. Veuillez réessayer.",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!email) return null

  return (
    <Flex minH="100vh" bg="#0A0A0A" color="white" align="center" justify="center" p={4}>
      <Box w="100%" maxW="400px">
        <Button
          variant="ghost"
          leftIcon={<ArrowLeft size={20} />}
          onClick={() => router.push("/register")}
          color="gray.400"
          _hover={{ color: "white", bg: "transparent" }}
          mb={6}
        >
          Retour
        </Button>

        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Flex w="16" h="16" bg="rgba(255, 255, 255, 0.08)" borderRadius="full" align="center" justify="center" mx="auto" mb={4}>
              <Mail color="white" size={32} />
            </Flex>
            <Text fontSize="3xl" fontWeight="bold" mb={2}>Vérification</Text>
            <Text color="gray.400">
              Nous avons envoyé un code à <Text as="span" color="white" fontWeight="bold">8 chiffres</Text> à :
            </Text>
            <Text color="white" fontWeight="bold" fontSize="lg" mt={1}>{email}</Text>
          </Box>

          <Box as="form" onSubmit={handleVerify}>
            <VStack spacing={6}>
              <Box w="100%">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{8}"
                  value={otp}
                  onChange={handleOtpChange}
                  bg="#1A1A1A"
                  border="1px solid #2A2A2A"
                  _focus={{ borderColor: "white", boxShadow: "none" }}
                  h="60px"
                  fontSize="3xl"
                  fontWeight="bold"
                  textAlign="center"
                  letterSpacing="0.5em"
                  color="white"
                  _placeholder={{ color: "gray.600" }}
                  placeholder="00000000"
                  autoFocus
                />
                <Text textAlign="center" fontSize="xs" color="gray.500" mt={2}>
                  Entrez les 8 chiffres reçus par email
                </Text>
              </Box>

              <Button
                type="submit"
                w="100%"
                h="50px"
                bg="white"
                color="black"
                _hover={{ bg: "gray.200" }}
                isDisabled={isLoading || otp.length !== 8}
                isLoading={isLoading}
                loadingText="Vérification..."
                fontWeight="bold"
              >
                Vérifier le code
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Box>
    </Flex>
  )
}

// ✅ 2. Le composant principal enveloppe le tout dans <Suspense>
export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <Flex minH="100vh" bg="#0A0A0A" align="center" justify="center">
        <Spinner thickness="4px" speed="0.65s" emptyColor="#2A2A2A" color="white" size="xl" />
      </Flex>
    }>
      <VerifyOtpContent />
    </Suspense>
  )
}