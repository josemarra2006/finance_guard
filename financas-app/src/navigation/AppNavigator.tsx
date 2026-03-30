// caminho: src/navigation/AppNavigator.tsx
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

import type { DrawerParamList } from '../types/navigation';
import DrawerContent from '../components/DrawerContent';
import HamburgerButton from '../components/HamburgerButton';
import { useAppTheme } from '../contexts/ThemeContext';

import DashboardScreen from '../screens/DashboardScreen';
import RelatoriosScreen from '../screens/RelatoriosScreen';
import MetasScreen from '../screens/MetasScreen';
import ChatIAScreen from '../screens/ChatIAScreen';
import ConfiguracoesScreen from '../screens/ConfiguracoesScreen';

const Drawer = createDrawerNavigator<DrawerParamList>();

/**
 * Cor do cabeçalho de navegação.
 *
 * Mantemos navy fixo para preservar a identidade visual de marca independente
 * do accentColor escolhido pelo usuário. O tint branco (#ffffff) garante
 * contraste adequado sobre o fundo escuro em todos os casos.
 *
 * O accentColor é aplicado nos elementos de destaque dentro das telas
 * (DrawerContent, ConfiguracoesScreen) — não no header da navegação.
 */
const HEADER_BG   = '#0f2044';   // navy — cor de marca fixa
const HEADER_TINT = '#ffffff';   // branco — sempre contrasta bem sobre navy

export default function AppNavigator(): React.JSX.Element {
  const { isDark } = useAppTheme();

  /**
   * O fundo do painel lateral se adapta ao modo escuro.
   * O DrawerContent interno já lida com as cores dos itens dinamicamente,
   * mas o drawerStyle.backgroundColor precisa ser definido aqui no Navigator
   * para cobrir a área de segurança (padding do sistema) ao deslizar.
   */
  const drawerBg = isDark ? '#0f172a' : '#ffffff';

  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        // ── Estilo global do cabeçalho ─────────────────────────────────
        headerStyle: {
          backgroundColor: HEADER_BG,
          elevation: 0,         // Remove sombra no Android
          shadowOpacity: 0,     // Remove sombra no iOS
        },
        headerTintColor: HEADER_TINT,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerTitleAlign: 'center',

        // Esconde o botão padrão — usamos o HamburgerButton customizado
        headerLeft: () => null,

        // ── Estilo do Drawer ───────────────────────────────────────────
        drawerStyle: {
          backgroundColor: drawerBg,
          width: 280,
        },
        drawerType: 'front',
        overlayColor: 'rgba(0,0,0,0.5)',
      }}
    >
      {/* Dashboard */}
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={({ navigation }) => ({
          title: 'Dashboard',
          headerLeft: () => (
            <HamburgerButton
              onPress={() => navigation.openDrawer()}
              color={HEADER_TINT}
            />
          ),
        })}
      />

      {/* Relatórios */}
      <Drawer.Screen
        name="Relatórios"
        component={RelatoriosScreen}
        options={({ navigation }) => ({
          title: 'Relatórios',
          headerLeft: () => (
            <HamburgerButton
              onPress={() => navigation.openDrawer()}
              color={HEADER_TINT}
            />
          ),
        })}
      />

      {/* Metas */}
      <Drawer.Screen
        name="Metas"
        component={MetasScreen}
        options={({ navigation }) => ({
          title: 'Metas',
          headerLeft: () => (
            <HamburgerButton
              onPress={() => navigation.openDrawer()}
              color={HEADER_TINT}
            />
          ),
        })}
      />

      {/* Chat IA */}
      <Drawer.Screen
        name="Chat IA"
        component={ChatIAScreen}
        options={({ navigation }) => ({
          title: 'Chat IA',
          headerLeft: () => (
            <HamburgerButton
              onPress={() => navigation.openDrawer()}
              color={HEADER_TINT}
            />
          ),
        })}
      />

      {/* Configurações */}
      <Drawer.Screen
        name="Configurações"
        component={ConfiguracoesScreen}
        options={({ navigation }) => ({
          title: 'Configurações',
          headerLeft: () => (
            <HamburgerButton
              onPress={() => navigation.openDrawer()}
              color={HEADER_TINT}
            />
          ),
        })}
      />
    </Drawer.Navigator>
  );
}