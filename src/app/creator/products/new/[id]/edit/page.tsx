"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
  Image,
  Badge,
} from "@chakra-ui/react";
import {
  FaArrowLeft,
  FaUpload,
  FaFileAlt,
  FaImage,
  FaVideo,
  FaMusic,
  FaFile,
  FaSave,
} from "react-icons/fa";

const MEDIA_TYPES = [
  { value: "image", label: "Image", icon: FaImage, color: "#8B5CF6" },
  { value: "video", label: "Vidéo", icon: FaVideo, color: "#EC4899" },
  { value: "audio", label: "Audio", icon: FaMusic, color: "#10B981" },
  { value: "file", label: "Fichier", icon: FaFile, color: "#F97316" },
];

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const productId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    media_type: "image",
    status: "draft",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentFileUrl, setCurrentFileUrl] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
      await loadProduct(user.id);
    };
    init();
  }, [productId, router]);

  const loadProduct = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("digital_products")
        .select("*")
        .eq("id", productId)
        .eq("creator_id", userId)
        .single();

      if (error || !data) {
        toast({
          title: "Erreur",
          description: "Produit non trouvé",
          status: "error",
          duration: 3000,
        });
        router.push("/creator/dashboard?tab=shop");
        return;
      }

      setFormData({
        title: data.title || "",
        description: data.description || "",
        price: data.price.toString() || "",
        media_type: data.media_type || "image",
        status: data.status || "draft",
      });

      setCurrentFileUrl(data.preview_url || data.file_url);
      if (data.preview_url || data.file_url) {
        setPreviewUrl(data.preview_url || data.file_url);
      }
    } catch (error: any) {
      console.error("Erreur chargement produit:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le produit",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

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

    setIsSaving(true);

    try {
      let fileUrl = currentFileUrl;
      let previewUrlToSave = formData.media_type === "image" || formData.media_type === "video" ? fileUrl : null;

      // Si un nouveau fichier est sélectionné, on l'upload
      if (selectedFile) {
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

        fileUrl = publicUrl;
        
        if (formData.media_type === "image" || formData.media_type === "video") {
          previewUrlToSave = publicUrl;
        }
      }

      const updateData: any = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        media_type: formData.media_type,
        status: formData.status,
        file_url: fileUrl,
      };

      if (previewUrlToSave) {
        updateData.preview_url = previewUrlToSave;
      }

      const { error: dbError } = await supabase
        .from("digital_products")
        .update(updateData)
        .eq("id", productId);

      if (dbError) throw dbError;

      toast({
        title: "Succès !",
        description: "Produit modifié avec succès.",
        status: "success",
        duration: 4000,
      });

      router.push("/creator/dashboard?tab=shop&refresh=true");
      
    } catch (error: any) {
      console.error("Erreur modification produit:", error);
      toast({
        title: "Échec",
        description: error.message || "Une erreur est survenue.",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Center h="100vh" bg="#0A0A0A">
        <Spinner thickness="4px" speed="0.65s" emptyColor="#2A2A2A" color="#8B5CF6" size="xl" />
      </Center>
    );
  }

  const selectedMediaType = MEDIA_TYPES.find(m => m.value === formData.media_type) || MEDIA_TYPES[0];

  return (
    <Box minH="100vh" bg="#0A0A0A" color="white" p={{ base: 4, md: 8 }}>
      <Box maxW="800px" mx="auto">
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
          <Text fontSize="24px" fontWeight="bold">Modifier le Produit</Text>
        </Flex>

        <Box as="form" onSubmit={handleSubmit} bg="#1A1A1A" p={{ base: 4, md: 8 }} borderRadius="16px" border="1px solid #2A2A2A">
          <VStack spacing={6} align="stretch">
            
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
                <Flex
                  bg="#0A0A0A"
                  border="1px solid #2A2A2A"
                  borderRadius="8px"
                  p={3}
                  align="center"
                  gap={2}
                >
                  <Icon as={selectedMediaType.icon} color={selectedMediaType.color} />
                  <Text color="white">{selectedMediaType.label}</Text>
                </Flex>
              </FormControl>
            </Flex>

            <FormControl>
              <FormLabel color="gray.300">Fichier actuel</FormLabel>
              {currentFileUrl && !selectedFile && (
                <Box mb={4} p={3} bg="#0A0A0A" borderRadius="8px" border="1px solid #2A2A2A">
                  {formData.media_type === "image" || formData.media_type === "video" ? (
                    <Image
                      src={currentFileUrl}
                      alt="Aperçu actuel"
                      maxH="200px"
                      borderRadius="8px"
                      mb={2}
                    />
                  ) : (
                    <HStack color="#8B5CF6">
                      <Icon as={FaFileAlt} />
                      <Text>Fichier: {formData.media_type}</Text>
                    </HStack>
                  )}
                  <Text fontSize="12px" color="gray.400">Cliquez ci-dessous pour remplacer</Text>
                </Box>
              )}

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
                    <Text fontWeight="bold">Cliquez pour sélectionner un nouveau fichier</Text>
                    <Text fontSize="12px">Laissez vide pour conserver le fichier actuel</Text>
                  </VStack>
                )}
              </Box>
            </FormControl>

            <FormControl>
              <FormLabel color="gray.300">Statut de publication</FormLabel>
              <Flex gap={4}>
                <Button
                  flex={1}
                  bg={formData.status === "draft" ? "#8B5CF6" : "transparent"}
                  color={formData.status === "draft" ? "white" : "gray.400"}
                  border={formData.status === "draft" ? "none" : "1px solid #2A2A2A"}
                  _hover={{ bg: formData.status === "draft" ? "#7C3AED" : "#2A2A2A" }}
                  onClick={() => setFormData({ ...formData, status: "draft" })}
                >
                  Brouillon
                </Button>
                <Button
                  flex={1}
                  bg={formData.status === "published" ? "#10B981" : "transparent"}
                  color={formData.status === "published" ? "white" : "gray.400"}
                  border={formData.status === "published" ? "none" : "1px solid #2A2A2A"}
                  _hover={{ bg: formData.status === "published" ? "#059669" : "#2A2A2A" }}
                  onClick={() => setFormData({ ...formData, status: "published" })}
                >
                  Publié
                </Button>
              </Flex>
            </FormControl>

            <Button
              type="submit"
              bg="#8B5CF6"
              color="white"
              _hover={{ bg: "#7C3AED" }}
              size="lg"
              mt={4}
              isLoading={isSaving}
              loadingText="Enregistrement..."
              fontWeight="bold"
              leftIcon={<Icon as={FaSave} />}
            >
              Enregistrer les modifications
            </Button>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}