"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react"
import {
  Box,
  Button,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  VStack,
  useToast,
  Spinner,
} from "@chakra-ui/react"

// ✅ Sous-composant qui utilise useSearchParams
function CreatePasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()

  const email = searchParams.get("email")
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) throw updateError

      toast({
        title: "Succès !",
        description: "Compte créé avec succès.",
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      router.push("/age-verification")
      
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Une erreur est survenue. Veuillez réessayer.",
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
          onClick={() => router.push("/verify-otp")}
          color="gray.400"
          _hover={{ color: "white", bg: "transparent" }}
          mb={6}
        >
          Retour
        </Button>

        <VStack spacing={6} align="stretch">
          
          {/* En-tête */}
          <Box textAlign="center">
            <Flex w="16" h="16" bg="rgba(34, 197, 94, 0.1)" borderRadius="full" align="center" justify="center" mx="auto" mb={4}>
              <CheckCircle color="#22C55E" size={32} />
            </Flex>
            <Text fontSize="3xl" fontWeight="bold" mb={2}>Sécurisez votre compte</Text>
            <Text color="gray.400">
              Votre email est vérifié ! 🎉<br />
              Créez un mot de passe pour vous connecter facilement la prochaine fois.
            </Text>
            {email && (
              <Text color="#8B5CF6" fontWeight="medium" mt={2} fontSize="sm" bg="rgba(139, 92, 246, 0.1)" display="inline-block" px={3} py={1} borderRadius="full">
                {email}
              </Text>
            )}
          </Box>

          {/* Formulaire */}
          <Box as="form" onSubmit={handleCreatePassword}>
            <VStack spacing={5}>
              
              {/* Champ Mot de passe */}
              <Box w="100%">
                <Text fontSize="sm" fontWeight="medium" color="gray.300" mb={1.5}>Mot de passe</Text>
                <InputGroup>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    bg="#1A1A1A"
                    border="1px solid #2A2A2A"
                    _focus={{ borderColor: "#8B5CF6", boxShadow: "none" }}
                    h="50px"
                    color="white"
                    _placeholder={{ color: "gray.500" }}
                    placeholder="••••••••"
                  />
                  <InputRightElement h="50px">
                    <Button
                      variant="ghost"
                      h="100%"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      color="gray.400"
                      _hover={{ color: "white" }}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </Box>

              {/* Champ Confirmer le mot de passe */}
              <Box w="100%">
                <Text fontSize="sm" fontWeight="medium" color="gray.300" mb={1.5}>Confirmer le mot de passe</Text>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  bg="#1A1A1A"
                  border="1px solid #2A2A2A"
                  _focus={{ borderColor: "#8B5CF6", boxShadow: "none" }}
                  h="50px"
                  color="white"
                  _placeholder={{ color: "gray.500" }}
                  placeholder="••••••••"
                />
              </Box>

              {/* Bouton d'action */}
              <Button
                type="submit"
                w="100%"
                h="50px"
                bg="#8B5CF6"
                _hover={{ bg: "#7C3AED" }}
                isLoading={isLoading}
                loadingText="Création en cours..."
                fontWeight="bold"
                mt={4}
              >
                Finaliser l'inscription
              </Button>
            </VStack>
          </Box>

        </VStack>
      </Box>
    </Flex>
  )
}

// ✅ Composant principal qui enveloppe le tout dans Suspense
export default function CreatePasswordPage() {
  return (
    <Suspense fallback={
      <Flex minH="100vh" bg="#0A0A0A" align="center" justify="center">
        <Spinner thickness="4px" speed="0.65s" emptyColor="#2A2A2A" color="#8B5CF6" size="xl" />
      </Flex>
    }>
      <CreatePasswordContent />
    </Suspense>
  )
}