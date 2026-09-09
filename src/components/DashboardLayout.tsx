"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Box,
  Flex,
  Text,
  Input,
  Button,
  VStack,
  HStack,
} from "@chakra-ui/react";

// ✅ Icônes SVG Professionnelles
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const ExploreIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

const CreateIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const MessageIcon = ({ active, badge }: { active: boolean; badge?: number }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    {(badge ?? 0) > 0 && (
      <circle cx="18" cy="6" r="3" fill="#EF4444" stroke="none" />
    )}
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

type MenuItem = {
  icon: string;
  label: string;
  path: string;
  active?: boolean;
  isCenter?: boolean;
  badge?: number;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  useEffect(() => {
    const checkCreatorStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsCreator(false);
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        setIsCreator(profile?.role === "creator" ? true : false);
      } catch (error) {
        console.error("Erreur vérification statut créateur:", error);
        setIsCreator(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkCreatorStatus();
  }, []);

  if (isMobile === null) {
    return (
      <Box minH="100vh" bg="#0A0A0A" display="flex" alignItems="center" justifyContent="center">
        <Box 
          w="40px" 
          h="40px" 
          border="4px solid #2A2A2A" 
          borderTop="4px solid #8B5CF6" 
          borderRadius="50%" 
          sx={{ animation: "spin 1s linear infinite" }} 
        />
      </Box>
    );
  }

  const isProfileSection = 
    pathname === "/profile" || 
    pathname === "/abonnements" || 
    pathname === "/suivis" || 
    pathname === "/live" || 
    pathname === "/settings" ||
    (pathname?.startsWith("/profile/") ?? false);

  const swipeSequence = ["/home", "/explore", "/messages", "/profile"];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX;
    const diffY = touchStartY.current - touchEndY;

    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      const currentIndex = swipeSequence.indexOf(pathname ?? "");
      if (currentIndex !== -1) {
        let nextIndex = currentIndex;
        if (diffX > 0) {
          nextIndex = (currentIndex + 1) % swipeSequence.length;
        } else {
          nextIndex = (currentIndex - 1 + swipeSequence.length) % swipeSequence.length;
        }
        router.push(swipeSequence[nextIndex]);
      }
    }
  };

  const mainMenuItems: MenuItem[] = [
    { icon: "home", label: "Accueil", path: "/home", active: true },
    { icon: "explore", label: "Explorer", path: "/explore" },
    { icon: "create", label: "Créer", path: "/create", isCenter: true },
    { icon: "message", label: "Messages", path: "/messages", badge: 3 },
    { icon: "profile", label: "Profil", path: "/profile" },
  ];

  const renderIcon = (iconName: string, isActive: boolean, badge?: number) => {
    switch (iconName) {
      case "home": return <HomeIcon active={isActive} />;
      case "explore": return <ExploreIcon active={isActive} />;
      case "create": return <CreateIcon />;
      case "message": return <MessageIcon active={isActive} badge={badge} />;
      case "profile": return <ProfileIcon active={isActive} />;
      default: return null;
    }
  };

  const handleCreatorButtonClick = () => {
    if (isCreator) {
      router.push("/creator/dashboard");
    } else {
      router.push("/creator/onboarding");
    }
  };

  const creatorButtonText = isCreator ? "Tableau de bord" : "Deviens créateur";
  const creatorButtonIcon = isCreator ? "📊" : "👑";
  const creatorButtonDesc = isCreator 
    ? "Accédez à votre espace créateur" 
    : "Partage ton talent et gagne de l'argent";

  const isDesktop = isMobile === false;
  const isMobileDevice = isMobile === true;

  return (
    <Box 
      minH="100vh" 
      bg="#0A0A0A" 
      color="#FFFFFF" 
      fontFamily="Arial, sans-serif" 
      pb={isMobileDevice ? "80px" : "0"}
      suppressHydrationWarning
    >
      {/* ============================================ */}
      {/* VERSION DESKTOP : Sidebar à gauche           */}
      {/* ============================================ */}
      {isDesktop && (
        <Flex minH="100vh">
          <Box
            w="280px"
            bg="#0A0A0A"
            borderRight="1px solid #1A1A1A"
            p="20px 16px"
            display="flex"
            flexDirection="column"
            position="fixed"
            h="100vh"
            overflowY="auto"
          >
            <Flex align="center" gap="12px" mb="24px">
              <Box 
                w="44px" 
                h="44px" 
                borderRadius="12px" 
                bg="linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)"
                display="flex" 
                alignItems="center" 
                justifyContent="center" 
                fontWeight="bold" 
                fontSize="24px"
                boxShadow="0 4px 12px rgba(139, 92, 246, 0.3)"
              >
                A
              </Box>
              <Box>
                <Text fontSize="20px" fontWeight="bold">Afrifan</Text>
                <Text fontSize="11px" color="#9CA3AF">Crée • Partage • Gagne</Text>
              </Box>
            </Flex>

            <Flex 
              align="center" 
              bg="#1A1A1A" 
              borderRadius="12px" 
              p="10px 14px" 
              mb="20px"
              border="1px solid #2A2A2A"
              cursor="pointer"
              transition="border-color 0.2s"
              _hover={{ borderColor: "#8B5CF6" }}
              onClick={() => {}}
            >
              <Text color="#9CA3AF" mr="10px" fontSize="16px">🔍</Text>
              <Input 
                type="text" 
                placeholder="Rechercher sur Afrifan..." 
                bg="transparent" 
                border="none" 
                outline="none" 
                color="#FFFFFF" 
                w="100%" 
                fontSize="14px"
                _focus={{ border: "none", outline: "none", boxShadow: "none" }}
                _placeholder={{ color: "#9CA3AF" }}
              />
            </Flex>

            <VStack gap="4px" mb="24px" align="stretch">
              {mainMenuItems.map((item) => {
                // ✅ forcer isActive à être un booléen strict
                const isActive = pathname === item.path || (!!item.active && pathname === "/home");
                return (
                  <Button 
                    key={item.path} 
                    onClick={() => router.push(item.path)} 
                    bg={isActive ? "rgba(139, 92, 246, 0.15)" : "transparent"} 
                    border="none" 
                    borderRadius="12px" 
                    p="12px 16px" 
                    color={isActive ? "#8B5CF6" : "#FFFFFF"} 
                    justifyContent="flex-start"
                    gap="12px" 
                    fontSize="15px" 
                    fontWeight={isActive ? "600" : "400"} 
                    position="relative"
                    _hover={{ bg: isActive ? "rgba(139, 92, 246, 0.25)" : "whiteAlpha.50" }}
                  >
                    <Box fontSize="20px" display="flex" alignItems="center">
                      {renderIcon(item.icon, isActive, item.badge)}
                    </Box>
                    <Text>{item.label}</Text>
                    {item.badge && (
                      <Box
                        position="absolute"
                        right="16px"
                        bg="#8B5CF6"
                        color="white"
                        fontSize="11px"
                        fontWeight="bold"
                        px="8px"
                        py="2px"
                        borderRadius="10px"
                        minW="20px"
                        textAlign="center"
                      >
                        {item.badge}
                      </Box>
                    )}
                  </Button>
                );
              })}
            </VStack>

            <Box bg="#1A1A1A" borderRadius="16px" p="16px" mb="24px" border="1px solid #2A2A2A">
              <Flex align="center" gap="10px" mb="12px">
                <Text fontSize="24px">{creatorButtonIcon}</Text>
                <Box>
                  <Text fontSize="14px" fontWeight="600">{creatorButtonText}</Text>
                  <Text fontSize="12px" color="#9CA3AF">{creatorButtonDesc}</Text>
                </Box>
              </Flex>
              <Button 
                w="100%"
                p="10px"
                bg="linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)"
                border="none"
                borderRadius="10px"
                color="#FFFFFF"
                fontSize="14px"
                fontWeight="600"
                onClick={handleCreatorButtonClick}
                _hover={{ opacity: 0.9, transform: "scale(1.02)" }}
                transition="all 0.2s"
              >
                {isCreator ? "Accéder" : "Commencer"} <Text as="span" fontSize="16px" ml="8px">→</Text>
              </Button>
            </Box>

            <Box mt="auto" pt="20px" borderTop="1px solid #1A1A1A">
              <Button
                w="100%"
                variant="ghost"
                color="#9CA3AF"
                justifyContent="space-between"
                onClick={() => setIsDarkMode(!isDarkMode)}
                _hover={{ bg: "whiteAlpha.50" }}
              >
                <HStack gap="10px">
                  <Text>🌙</Text>
                  <Text fontSize="14px">Mode sombre</Text>
                </HStack>
                <Box
                  w="44px"
                  h="24px"
                  bg={isDarkMode ? "#8B5CF6" : "#374151"}
                  borderRadius="12px"
                  position="relative"
                  transition="background-color 0.3s"
                >
                  <Box
                    w="20px"
                    h="20px"
                    bg="#FFFFFF"
                    borderRadius="50%"
                    position="absolute"
                    top="2px"
                    left={isDarkMode ? "22px" : "2px"}
                    transition="left 0.3s"
                    boxShadow="0 2px 4px rgba(0,0,0,0.2)"
                  />
                </Box>
              </Button>
            </Box>

            <Flex 
              mt="16px" 
              pt="16px" 
              borderTop="1px solid #1A1A1A"
              align="center" 
              gap="12px"
              cursor="pointer"
              onClick={() => router.push("/profile")}
              _hover={{ bg: "whiteAlpha.50" }}
              borderRadius="8px"
              p="8px"
              ml="-8px"
            >
              <Box 
                w="36px" 
                h="36px" 
                borderRadius="50%" 
                bg="linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)"
                display="flex" 
                alignItems="center" 
                justifyContent="center" 
                fontSize="14px" 
                fontWeight="bold" 
              >
                N
              </Box>
              <Box flex={1}>
                <Text fontSize="14px" fontWeight="600">Utilisateur</Text>
                <Text fontSize="12px" color="#9CA3AF">@username</Text>
              </Box>
            </Flex>
          </Box>

          <Box flex={1} ml="280px" minH="100vh">
            {children}
          </Box>
        </Flex>
      )}

      {/* ============================================ */}
      {/* VERSION MOBILE : Header + SWIPE              */}
      {/* ============================================ */}
      {isMobileDevice && (
        <>
          <Flex
            position="sticky" 
            top={0} 
            zIndex={50} 
            bg="#0A0A0A"
            borderBottom="1px solid #1A1A1A" 
            p="12px 16px"
            justifyContent="space-between" 
            alignItems="center"
          >
            <Flex align="center" gap="8px">
              <Box 
                w="32px" 
                h="32px" 
                borderRadius="8px" 
                bg="linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)"
                display="flex" 
                alignItems="center" 
                justifyContent="center" 
                fontWeight="bold" 
                fontSize="16px"
              >
                A
              </Box>
              <Text fontSize="16px" fontWeight="bold">Afrifan</Text>
            </Flex>
            {!isProfileSection && (
              <Button 
                variant="ghost"
                color="#FFFFFF" 
                fontSize="24px" 
                p={0}
                w="40px"
                h="40px"
                position="relative"
                onClick={() => router.push("/notifications")} 
              >
                🔔
                <Box
                  position="absolute"
                  top="-2px"
                  right="-2px"
                  bg="#8B5CF6"
                  color="white"
                  fontSize="10px"
                  fontWeight="bold"
                  px="4px"
                  py="1px"
                  borderRadius="6px"
                  minW="16px"
                  textAlign="center"
                >
                  3
                </Box>
              </Button>
            )}
          </Flex>

          <Box 
            flex={1} 
            sx={{ touchAction: "pan-y" }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {children}
          </Box>

          <Box
            position="fixed"
            bottom={0}
            left={0}
            right={0}
            bg="#0A0A0A"
            borderTop="1px solid #1A1A1A"
            display="flex"
            justifyContent="space-around"
            alignItems="center"
            py="8px"
            zIndex={9999}
            sx={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            boxShadow="0 -2px 10px rgba(0,0,0,0.3)"
          >
            {mainMenuItems.map((item) => {
              // ✅ forcer isActive à être un booléen strict
              const isActive = pathname === item.path || (!!item.active && pathname === "/home");
              const isCenter = item.isCenter ?? false;
              
              return (
                <Button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  bg={isCenter ? "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)" : "transparent"}
                  border="none"
                  color={isActive ? "#8B5CF6" : "#9CA3AF"}
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  p={isCenter ? "12px 16px" : "6px 12px"}
                  position="relative"
                  borderRadius={isCenter ? "12px" : "0"}
                  minW={isCenter ? "56px" : "auto"}
                  minH={isCenter ? "40px" : "auto"}
                  transform={isCenter ? "translateY(-8px)" : "none"}
                  boxShadow={isCenter ? "0 4px 12px rgba(139, 92, 246, 0.4)" : "none"}
                  _hover={{ bg: isCenter ? "linear-gradient(135deg, #7C3AED 0%, #D53F8C 100%)" : "whiteAlpha.50" }}
                >
                  <Box fontSize={isCenter ? "28px" : "24px"} display="flex" alignItems="center" justifyContent="center">
                    {renderIcon(item.icon, isActive, item.badge)}
                  </Box>
                  {!isCenter && (
                    <Text fontSize="10px" fontWeight={isActive ? "600" : "400"} mt="2px">
                      {item.label}
                    </Text>
                  )}
                  {(item.badge ?? 0) > 0 && !isCenter && (
                    <Box
                      position="absolute"
                      top="0px"
                      right="8px"
                      bg="#EF4444"
                      color="white"
                      fontSize="9px"
                      fontWeight="bold"
                      px="5px"
                      py="1px"
                      borderRadius="8px"
                      minW="16px"
                      textAlign="center"
                      border="2px solid #0A0A0A"
                    >
                      {item.badge}
                    </Box>
                  )}
                </Button>
              );
            })}
          </Box>
        </>
      )}
    </Box>
  );
}