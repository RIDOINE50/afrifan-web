"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";
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
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

// ✅ Icône cloche (notification) — hérite de currentColor pour s'adapter au thème
const BellIcon = ({ active }: { active?: boolean }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill={active ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
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
  const { isDark, theme, toggleTheme } = useAppTheme();

  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

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
          .select("role, username, full_name, avatar_url")
          .eq("id", session.user.id)
          .single();

        setIsCreator(profile?.role === "creator" ? true : false);
        setUserProfile(profile);
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
      <Box minH="100vh" bg={theme.bg} display="flex" alignItems="center" justifyContent="center">
        <Box 
          w="40px" 
          h="40px" 
          border={`4px solid ${theme.border}`} 
          borderTop={`4px solid ${theme.primary}`} 
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

  // ✅ Calcul des infos du profil pour l'affichage
  const displayName = userProfile?.full_name || userProfile?.username || "Utilisateur";
  const displayUsername = userProfile?.username || "username";
  const avatarUrl = userProfile?.avatar_url;
  const initialLetter = (userProfile?.full_name?.[0] || userProfile?.username?.[0] || "U").toUpperCase();

  return (
    <Box 
      minH="100vh" 
      bg={theme.bg} 
      color={theme.text} 
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
            bg={theme.bg}
            borderRight={`1px solid ${theme.border}`}
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
                bg={theme.primary}
                color={theme.primaryText}
                display="flex" 
                alignItems="center" 
                justifyContent="center" 
                fontWeight="bold" 
                fontSize="24px"
              >
                A
              </Box>
              <Box>
                <Text fontSize="20px" fontWeight="bold" color={theme.text}>Afrifan</Text>
                <Text fontSize="11px" color={theme.textMuted}>Crée • Partage • Gagne</Text>
              </Box>
            </Flex>

            <Flex 
              align="center" 
              bg={theme.card} 
              borderRadius="12px" 
              p="10px 14px" 
              mb="20px"
              border={`1px solid ${theme.border}`}
              cursor="pointer"
              transition="border-color 0.2s"
              _hover={{ borderColor: theme.primary }}
              onClick={() => {}}
            >
              <Text color={theme.textMuted} mr="10px" fontSize="16px">🔍</Text>
              <Input 
                type="text" 
                placeholder="Rechercher sur Afrifan..." 
                bg="transparent" 
                border="none" 
                outline="none" 
                color={theme.text} 
                w="100%" 
                fontSize="14px"
                _focus={{ border: "none", outline: "none", boxShadow: "none" }}
                _placeholder={{ color: theme.textMuted }}
              />
            </Flex>

            <VStack gap="4px" mb="24px" align="stretch">
              {mainMenuItems.map((item) => {
                const isActive = pathname === item.path || (!!item.active && pathname === "/home");
                return (
                  <Button 
                    key={item.path} 
                    onClick={() => router.push(item.path)} 
                    bg={isActive ? theme.hover : "transparent"} 
                    border="none" 
                    borderRadius="12px" 
                    p="12px 16px" 
                    color={isActive ? theme.primary : theme.text} 
                    justifyContent="flex-start"
                    gap="12px" 
                    fontSize="15px" 
                    fontWeight={isActive ? "600" : "400"} 
                    position="relative"
                    _hover={{ bg: theme.hover }}
                  >
                    <Box fontSize="20px" display="flex" alignItems="center">
                      {renderIcon(item.icon, isActive, item.badge)}
                    </Box>
                    <Text>{item.label}</Text>
                    {item.badge && (
                      <Box
                        position="absolute"
                        right="16px"
                        bg={theme.primary}
                        color={theme.primaryText}
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

            <Box bg={theme.card} borderRadius="16px" p="16px" mb="24px" border={`1px solid ${theme.border}`}>
              <Flex align="center" gap="10px" mb="12px">
                <Text fontSize="24px">{creatorButtonIcon}</Text>
                <Box>
                  <Text fontSize="14px" fontWeight="600" color={theme.text}>{creatorButtonText}</Text>
                  <Text fontSize="12px" color={theme.textMuted}>{creatorButtonDesc}</Text>
                </Box>
              </Flex>
              <Button 
                w="100%"
                p="10px"
                bg={theme.primary}
                color={theme.primaryText}
                border="none"
                borderRadius="10px"
                fontSize="14px"
                fontWeight="600"
                onClick={handleCreatorButtonClick}
                _hover={{ opacity: 0.9, transform: "scale(1.02)" }}
                transition="all 0.2s"
              >
                {isCreator ? "Accéder" : "Commencer"} <Text as="span" fontSize="16px" ml="8px">→</Text>
              </Button>
            </Box>

            <Box mt="auto" pt="20px" borderTop={`1px solid ${theme.border}`}>
              <Button
                w="100%"
                variant="ghost"
                color={theme.textMuted}
                justifyContent="space-between"
                onClick={toggleTheme}
                _hover={{ bg: theme.hover }}
              >
                <HStack gap="10px">
                  <Text>{isDark ? "🌙" : "☀️"}</Text>
                  <Text fontSize="14px">{isDark ? "Mode sombre" : "Mode clair"}</Text>
                </HStack>
                <Box
                  w="44px"
                  h="24px"
                  bg={isDark ? "#4B5563" : "#000000"}
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
                    left={isDark ? "2px" : "22px"}
                    transition="left 0.3s"
                    boxShadow="0 2px 4px rgba(0,0,0,0.2)"
                  />
                </Box>
              </Button>
            </Box>

            {/* ✅ FOOTER PROFIL — données dynamiques */}
            <Flex 
              mt="16px" 
              pt="16px" 
              borderTop={`1px solid ${theme.border}`}
              align="center" 
              gap="12px"
              cursor="pointer"
              onClick={() => router.push("/profile")}
              _hover={{ bg: theme.hover }}
              borderRadius="8px"
              p="8px"
              ml="-8px"
            >
              <Box 
                w="36px" 
                h="36px" 
                borderRadius="50%" 
                bg={avatarUrl ? "transparent" : theme.primary}
                color={theme.primaryText}
                display="flex" 
                alignItems="center" 
                justifyContent="center" 
                fontSize="14px" 
                fontWeight="bold"
                overflow="hidden"
                bgImage={avatarUrl ? `url(${avatarUrl})` : undefined}
                bgSize="cover"
                bgPosition="center"
                flexShrink={0}
              >
                {!avatarUrl && initialLetter}
              </Box>
              <Box flex={1} minW={0}>
                <Text fontSize="14px" fontWeight="600" color={theme.text} noOfLines={1}>
                  {displayName}
                </Text>
                <Text fontSize="12px" color={theme.textMuted} noOfLines={1}>
                  @{displayUsername}
                </Text>
              </Box>
            </Flex>
          </Box>

          <Box flex={1} ml="280px" minH="100vh">
            {children}
          </Box>
        </Flex>
      )}

      {/* ============================================ */}
      {/* VERSION MOBILE : Header                      */}
      {/* ============================================ */}
      {isMobileDevice && (
        <>
          <Flex
            position="sticky" 
            top={0} 
            zIndex={50} 
            bg={theme.bg}
            borderBottom={`1px solid ${theme.border}`} 
            p="12px 16px"
            justifyContent="space-between" 
            alignItems="center"
          >
            <Flex align="center" gap="8px">
              <Box 
                w="32px" 
                h="32px" 
                borderRadius="8px" 
                bg={theme.primary}
                color={theme.primaryText}
                display="flex" 
                alignItems="center" 
                justifyContent="center" 
                fontWeight="bold" 
                fontSize="16px"
              >
                A
              </Box>
              <Text fontSize="16px" fontWeight="bold" color={theme.text}>Afrifan</Text>
            </Flex>
            {!isProfileSection && (
              <Button 
                variant="ghost"
                color={theme.text}
                p={0}
                w="40px"
                h="40px"
                minW="40px"
                borderRadius="50%"
                position="relative"
                onClick={() => router.push("/notifications")}
                _hover={{ bg: theme.hover }}
              >
                <BellIcon />
                <Box
                  position="absolute"
                  top="2px"
                  right="2px"
                  bg="#EF4444"
                  color="white"
                  fontSize="10px"
                  fontWeight="bold"
                  px="4px"
                  py="1px"
                  borderRadius="6px"
                  minW="16px"
                  h="16px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  border={`2px solid ${theme.bg}`}
                  lineHeight="1"
                >
                  3
                </Box>
              </Button>
            )}
          </Flex>

          <Box flex={1}>
            {children}
          </Box>

          <Box
            position="fixed"
            bottom={0}
            left={0}
            right={0}
            bg={theme.bg}
            borderTop={`1px solid ${theme.border}`}
            display="flex"
            justifyContent="space-around"
            alignItems="center"
            py="8px"
            zIndex={9999}
            sx={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            boxShadow={isDark ? "0 -2px 10px rgba(0,0,0,0.3)" : "0 -2px 10px rgba(0,0,0,0.05)"}
          >
            {mainMenuItems.map((item) => {
              const isActive = pathname === item.path || (!!item.active && pathname === "/home");
              const isCenter = item.isCenter ?? false;
              
              return (
                <Button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  bg={isCenter ? theme.primary : "transparent"}
                  border="none"
                  color={isCenter ? theme.primaryText : (isActive ? theme.primary : theme.textMuted)}
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  p={isCenter ? "12px 16px" : "6px 12px"}
                  position="relative"
                  borderRadius={isCenter ? "12px" : "0"}
                  minW={isCenter ? "56px" : "auto"}
                  minH={isCenter ? "40px" : "auto"}
                  transform={isCenter ? "translateY(-8px)" : "none"}
                  boxShadow={isCenter && isDark ? "0 4px 12px rgba(0,0,0,0.4)" : "none"}
                  _hover={{ opacity: 0.9 }}
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
                      border={`2px solid ${theme.bg}`}
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