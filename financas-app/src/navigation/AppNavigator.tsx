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

// ─── Constantes de identidade de marca ───────────────────────────────────────
//
// O header navy (#0f2044) é fixo e não varia com o accentColor nem com o tema.
// Ele representa a identidade visual do FinançasPRO em toda a navegação.
//
// Decisão de design:
//  - accentColor NÃO é aplicado ao header — headers com cores dinâmicas
//    fragilizam a percepção de identidade do produto.
//  - accentColor é aplicado nos elementos internos das telas e no DrawerContent
//    (item ativo, logo), onde o efeito é sutil e contextual.

const HEADER_BG   = '#0f2044';   // navy — cor de marca fixa
const HEADER_TINT = '#ffffff';   // branco — sempre legível sobre navy

// ─── Componente ──────────────────────────────────────────────────────────────

/**
 * AppNavigator — DrawerNavigator principal da aplicação.
 *
 * Responsabilidades:
 *  1. Montar as 5 rotas do Drawer.
 *  2. Aplicar opções de header globais (navy fixo, HamburgerButton via Feather).
 *  3. Adaptar backgroundColor do painel lateral ao tema via isDark.
 *     O DrawerContent interno lida com os itens dinamicamente.
 *
 * drawerBg precisa ser definido aqui — não apenas no DrawerContent — para
 * cobrir as áreas de safe area visíveis ao deslizar (iOS notch / rounded corners).
 */
export default function AppNavigator(): React.JSX.Element {
  const { isDark } = useAppTheme();

  // dark : #0d1117 (GitHub-dark, fundo profundo)
  // light: #ffffff (branco nítido)
  const drawerBg = isDark ? '#0d1117' : '#ffffff';

  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        // ── Header global ──────────────────────────────────────────
        headerStyle: {
          backgroundColor: HEADER_BG,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: HEADER_TINT,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 16,
          letterSpacing: -0.2,
        },
        headerTitleAlign: 'center',

        // Suprime o botão padrão — usamos HamburgerButton customizado
        headerLeft: () => null,

        // ── Drawer ────────────────────────────────────────────────
        drawerStyle: {
          backgroundColor: drawerBg,
          width: 272,
        },
        drawerType: 'front',
        overlayColor: 'rgba(0,0,0,0.45)',
        drawerLabel: () => null,
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={({ navigation }) => ({
          title: 'Dashboard',
          headerLeft: () => (
            <HamburgerButton onPress={() => navigation.openDrawer()} color={HEADER_TINT} />
          ),
        })}
      />

      <Drawer.Screen
        name="Relatórios"
        component={RelatoriosScreen}
        options={({ navigation }) => ({
          title: 'Relatórios',
          headerLeft: () => (
            <HamburgerButton onPress={() => navigation.openDrawer()} color={HEADER_TINT} />
          ),
        })}
      />

      <Drawer.Screen
        name="Metas"
        component={MetasScreen}
        options={({ navigation }) => ({
          title: 'Metas',
          headerLeft: () => (
            <HamburgerButton onPress={() => navigation.openDrawer()} color={HEADER_TINT} />
          ),
        })}
      />

      <Drawer.Screen
        name="Chat IA"
        component={ChatIAScreen}
        options={({ navigation }) => ({
          title: 'Chat IA',
          headerLeft: () => (
            <HamburgerButton onPress={() => navigation.openDrawer()} color={HEADER_TINT} />
          ),
        })}
      />

      <Drawer.Screen
        name="Configurações"
        component={ConfiguracoesScreen}
        options={({ navigation }) => ({
          title: 'Configurações',
          headerLeft: () => (
            <HamburgerButton onPress={() => navigation.openDrawer()} color={HEADER_TINT} />
          ),
        })}
      />
    </Drawer.Navigator>
  );
}
