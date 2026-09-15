"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  Textarea,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  useToast,
  Spinner,
  Center,
  Icon,
  Radio,
  RadioGroup,
  Stack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuOptionGroup,
  MenuItemOption,
} from "@chakra-ui/react";
import {
  FaArrowLeft,
  FaUpload,
  FaFileAlt,
  FaImage,
  FaVideo,
  FaMusic,
  FaChevronDown,
  FaFile,
} from "react-icons/fa";

// ✅ Configuration des types de médias avec icônes SVG
const MEDIA_TYPES = [
  { value: "image", label: "Image", icon: FaImage, color: "#8B5CF6" },
  { value: "video", label: "Vidéo", icon: FaVideo, color: "#EC4899" },
  { value: "audio", label: "Audio", icon: FaMusic, color: "#10B981" },
  { value: "file", label: "Fichier (PDF, ZIP, etc.)", icon: FaFile, color: "#F97316" },
];

export default function CreateProductPage() {
  const router = useRouter();
  const toast = useToast();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    media_type: "image",
    status: "draft",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUserId(user.id);
      }
    };
    getUser();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }

      if (file.type.startsWith("image/")) setFormData(prev => ({ ...prev, media_type: "image" }));
      else if (file.type.startsWith("video/")) setFormData(prev => ({ ...prev, media_type: "video" }));
      else if (file.type.startsWith("audio/")) setFormData(prev => ({ ...prev, media_type: "audio" }));
      else setFormData(prev => ({ ...prev, media_type: "file" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!formData.title.trim()) {
      toast({ title: "Erreur", description: "Le titre est obligatoire.", status: "error", duration: 3000 });
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({ title: "Erreur", description: "Veuillez entrer un prix valide.", status: "error", duration: 3000 });
      return;
    }
    if (!selectedFile) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un fichier pour votre produit.", status: "error", duration: 3000 });
      return;
    }

    setIsLoading(true);

    try {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("digital_products")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("digital_products")
        .getPublicUrl(filePath);

    const { error: dbError } = await supabase.from("digital_products").insert({
  creator_id: userId,
  title: formData.title.trim(),
  description: formData.description.trim() || null,
  price: parseFloat(formData.price),
  media_type: formData.media_type,
  file_url: publicUrl, // ✅ Le fichier réel (ce que l'acheteur télécharge)
  preview_url: (formData.media_type === "image" || formData.media_type === "video") 
    ? publicUrl  // ✅ Pour image/vidéo, l'aperçu = le fichier lui-même
    : null,      // ✅ Pour PDF/ZIP/Audio, pas d'aperçu visuel
  status: formData.status,
  currency: "XOF",
});

      if (dbError) throw dbError;

      toast({
        title: "Succès !",
        description: "Votre produit a été ajouté à votre boutique.",
        status: "success",
        duration: 4000,
      });

      router.push("/creator/dashboard?tab=shop&refresh=true");
      
    } catch (error: any) {
      console.error("Erreur création produit:", error);
      toast({
        title: "Échec",
        description: error.message || "Une erreur est survenue lors de la création du produit.",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!userId) {
    return (
      <Center h="100vh" bg="#0A0A0A">
        <Spinner thickness="4px" speed="0.65s" emptyColor="#2A2A2A" color="#8B5CF6" size="xl" />
      </Center>
    );
  }

  // ✅ Récupère le type sélectionné pour l'affichage dans le MenuButton
  const selectedMediaType = MEDIA_TYPES.find(m => m.value === formData.media_type) || MEDIA_TYPES[0];
  const SelectedMediaIcon = selectedMediaType.icon;

  return (
    <Box minH="100vh" bg="#0A0A0A" color="white" p={{ base: 4, md: 8 }}>
      <Box maxW="800px" mx="auto">
        {/* Header */}
        <Flex align="center" mb={8} gap={4}>
          <Button
            variant="ghost"
            color="gray.400"
            _hover={{ color: "white", bg: "whiteAlpha.100" }}
            leftIcon={<Icon as={FaArrowLeft} />}
            onClick={() => router.back()}
          >
            Retour
          </Button>
          <Text fontSize="24px" fontWeight="bold">Nouveau Produit</Text>
        </Flex>

        {/* Formulaire */}
        <Box as="form" onSubmit={handleSubmit} bg="#1A1A1A" p={{ base: 4, md: 8 }} borderRadius="16px" border="1px solid #2A2A2A">
          <VStack spacing={6} align="stretch">
            
            {/* Titre */}
            <FormControl isRequired>
              <FormLabel color="gray.300">Titre du produit</FormLabel>
              <Input
                bg="#0A0A0A"
                border="1px solid #2A2A2A"
                _focus={{ borderColor: "#8B5CF6", boxShadow: "none" }}
                placeholder="Ex: Pack de Presets Lightroom"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </FormControl>

            {/* Description */}
            <FormControl>
              <FormLabel color="gray.300">Description (optionnel)</FormLabel>
              <Textarea
                bg="#0A0A0A"
                border="1px solid #2A2A2A"
                _focus={{ borderColor: "#8B5CF6", boxShadow: "none" }}
                placeholder="Décrivez ce que l'acheteur va recevoir..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </FormControl>

            {/* Prix et Type de média */}
            <Flex direction={{ base: "column", md: "row" }} gap={6}>
              <FormControl isRequired flex={1}>
                <FormLabel color="gray.300">Prix (FCFA)</FormLabel>
                <Input
                  type="number"
                  bg="#0A0A0A"
                  border="1px solid #2A2A2A"
                  _focus={{ borderColor: "#8B5CF6", boxShadow: "none" }}
                  placeholder="Ex: 5000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </FormControl>

              <FormControl flex={1}>
                <FormLabel color="gray.300">Type de média</FormLabel>
                {/* ✅ Menu Chakra avec icônes SVG (au lieu du <select> qui ne supporte pas les SVG) */}
                <Menu matchWidth>
                  <MenuButton
                    as={Button}
                    rightIcon={<Icon as={FaChevronDown} />}
                    bg="#0A0A0A"
                    border="1px solid #2A2A2A"
                    color="white"
                    _hover={{ borderColor: "#8B5CF6", bg: "#0A0A0A" }}
                    _active={{ bg: "#0A0A0A", borderColor: "#8B5CF6" }}
                    _focus={{ borderColor: "#8B5CF6", boxShadow: "none" }}
                    w="100%"
                    justifyContent="space-between"
                    fontWeight="normal"
                    textAlign="left"
                    h="40px"
                    px={4}
                  >
                    <HStack spacing={2}>
                      <Icon as={SelectedMediaIcon} color={selectedMediaType.color} />
                      <Text>{selectedMediaType.label}</Text>
                    </HStack>
                  </MenuButton>
                  <MenuList bg="#1A1A1A" border="1px solid #2A2A2A" color="white" minW="240px" zIndex={200}>
                    {MEDIA_TYPES.map((type) => {
                      const ItemIcon = type.icon;
                      return (
                        <MenuItem
                          key={type.value}
                          bg={formData.media_type === type.value ? "whiteAlpha.200" : "transparent"}
                          _hover={{ bg: "whiteAlpha.100" }}
                          _focus={{ bg: "whiteAlpha.100" }}
                          onClick={() => setFormData({ ...formData, media_type: type.value })}
                          icon={<Icon as={ItemIcon} color={type.color} />}
                        >
                          <Text fontSize="14px">{type.label}</Text>
                        </MenuItem>
                      );
                    })}
                  </MenuList>
                </Menu>
              </FormControl>
            </Flex>

            {/* Upload de fichier */}
            <FormControl isRequired>
              <FormLabel color="gray.300">Fichier du produit</FormLabel>
              <Box
                border="2px dashed #2A2A2A"
                borderRadius="12px"
                p={6}
                textAlign="center"
                cursor="pointer"
                _hover={{ borderColor: "#8B5CF6", bg: "whiteAlpha.50" }}
                transition="all 0.2s"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  hidden
                  accept="image/*,video/*,audio/*,.pdf,.zip,.rar"
                  onChange={handleFileChange}
                />
                {selectedFile ? (
                  <VStack spacing={3}>
                    {previewUrl && formData.media_type === "image" && (
                      <Box as="img" src={previewUrl} alt="Preview" maxH="200px" borderRadius="8px" mx="auto" />
                    )}
                    <HStack color="#8B5CF6">
                      <Icon as={FaFileAlt} />
                      <Text fontWeight="bold">{selectedFile.name}</Text>
                    </HStack>
                    <Text fontSize="12px" color="gray.400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Cliquez pour changer
                    </Text>
                  </VStack>
                ) : (
                  <VStack spacing={3} color="gray.400">
                    <Icon as={FaUpload} boxSize={8} />
                    <Text fontWeight="bold">Cliquez pour sélectionner un fichier</Text>
                    <Text fontSize="12px">Images, vidéos, audio ou fichiers (Max 50MB)</Text>
                  </VStack>
                )}
              </Box>
            </FormControl>

            {/* Statut de publication */}
            <FormControl>
              <FormLabel color="gray.300">Statut de publication</FormLabel>
              <RadioGroup value={formData.status} onChange={(value) => setFormData({ ...formData, status: value })}>
                <Stack direction={{ base: "column", sm: "row" }} spacing={5}>
                  <Radio value="draft" colorScheme="purple">
                    <HStack>
                      <Text fontWeight="bold">Brouillon</Text>
                      <Text fontSize="12px" color="gray.400">(Visible uniquement par vous)</Text>
                    </HStack>
                  </Radio>
                  <Radio value="published" colorScheme="green">
                    <HStack>
                      <Text fontWeight="bold">Publié</Text>
                      <Text fontSize="12px" color="gray.400">(Visible dans la boutique)</Text>
                    </HStack>
                  </Radio>
                </Stack>
              </RadioGroup>
            </FormControl>

            {/* Bouton de soumission */}
            <Button
              type="submit"
              bg="#8B5CF6"
              color="white"
              _hover={{ bg: "#7C3AED" }}
              size="lg"
              mt={4}
              isLoading={isLoading}
              loadingText="Création en cours..."
              fontWeight="bold"
            >
              {formData.status === "published" ? "Publier le produit" : "Enregistrer comme brouillon"}
            </Button>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}