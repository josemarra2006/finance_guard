// caminho: src/navigation/AppNavigator.tsx
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

import type { DrawerParamList } from '../types/navigation';
import DrawerContent from '../components/DrawerContent';
import HamburgerButton from '../components/HamburgerButton';

import DashboardScreen from '../screens/DashboardScreen';
import RelatoriosScreen from '../screens/RelatoriosScreen';
import MetasScreen from '../screens/MetasScreen';
import ChatIAScreen from '../screens/ChatIAScreen';
import ConfiguracoesScreen from '../screens/ConfiguracoesScreen';

const Drawer = createDrawerNavigator<DrawerParamList>();

// Cor principal do cabeçalho
const HEADER_BG = '#0f2044';
const HEADER_TINT = '#ffffff';

export default function AppNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        // Estilo global do cabeçalho
        headerStyle: {
          backgroundColor: HEADER_BG,
          elevation: 0,       // Remove sombra no Android
          shadowOpacity: 0,   // Remove sombra no iOS
        },
        headerTintColor: HEADER_TINT,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerTitleAlign: 'center',
        // Esconde o botão de hambúrguer padrão do React Navigation
        // pois vamos usar o nosso próprio (HamburgerButton)
        headerLeft: () => null,
        // Estilo do Drawer
        drawerStyle: {
          backgroundColor: '#ffffff',
          width: 280,
        },
        drawerType: 'front',
        overlayColor: 'rgba(0,0,0,0.5)',
      }}
    >
      {/*
       * Dashboard — tela inicial com botão de hambúrguer customizado
       */}
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

      {/*
       * Demais telas — apenas título centralizado por enquanto.
       * O botão de voltar / abrir drawer fica disponível pelo
       * gesto de swipe (drawerType: 'front').
       * Para adicionar o hambúrguer em outras telas, basta copiar
       * o pattern do headerLeft acima.
       */}
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
