// caminho: src/components/DrawerContent.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  DrawerContentScrollView,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme, hexAlpha } from '../contexts/ThemeContext';

// ─── Route icon map ───────────────────────────────────────────────────────────

const ROUTE_ICONS: Record<string, string> = {
  Dashboard:     '📊',
  'Relatórios':  '📈',
  Metas:         '🎯',
  'Chat IA':     '🤖',
  Configurações: '⚙️',
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * DrawerContent
 *
 * Customizações de Fase 7:
 *  - O círculo do logo usa `accentColor` como fundo (substitui `bg-primary-500`).
 *  - O background do item ativo usa um tint semi-transparente do accentColor.
 *  - O texto do item ativo usa `accentColor`.
 *  - A barra indicadora vertical usa `accentColor`.
 *  - O fundo do painel e do rodapé adaptam-se ao modo escuro via `isDark`.
 *
 * O cabeçalho navy (`#0f2044`) é mantido fixo — é a identidade de marca do app
 * e não deve variar com a accentColor.
 */
export default function DrawerContent(
  props: DrawerContentComponentProps,
): React.JSX.Element {
  const { state, navigation } = props;
  const { accentColor, isDark } = useAppTheme();

  // ── Cores dinâmicas ───────────────────────────────────────────────────────
  const panelBg      = isDark ? '#0f172a' : '#ffffff';
  const inactiveText = isDark ? '#94a3b8' : '#4b5563';
  const footerBg     = isDark ? '#0f172a' : '#ffffff';
  const footerBorder = isDark ? '#1e293b' : '#f3f4f6';
  const footerText   = isDark ? '#475569' : '#9ca3af';

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flex: 1, paddingTop: 0 }}
    >
      {/* ── Cabeçalho de marca ───────────────────────────────────────── */}
      {/*
       * O header usa navy fixo (#0f2044) independentemente do accentColor.
       * Apenas o círculo do logo usa accentColor para criar uma relação visual
       * entre a cor escolhida pelo usuário e a identidade do app.
       */}
      <View style={styles.drawerHeader}>
        <View style={[styles.logoCircle, { backgroundColor: accentColor }]}>
          <Text style={styles.logoEmoji}>💰</Text>
        </View>
        <Text style={styles.appName}>FinançasPRO</Text>
        <Text style={styles.appTagline}>Controle seu futuro</Text>
      </View>

      {/* ── Itens de navegação ───────────────────────────────────────── */}
      <ScrollView
        style={[styles.navList, { backgroundColor: panelBg }]}
        showsVerticalScrollIndicator={false}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const icon = ROUTE_ICONS[route.name] ?? '📄';

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              activeOpacity={0.7}
              style={[
                styles.navItem,
                {
                  /*
                   * Tint de 10% do accentColor como background ativo.
                   * hexAlpha('#2f78f0', 0.10) → '#2f78f01a'
                   * A baixa opacidade garante legibilidade mesmo com accent
                   * colors vibrantes como laranja ou verde.
                   */
                  backgroundColor: isFocused
                    ? hexAlpha(accentColor, 0.10)
                    : 'transparent',
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
            >
              <Text style={styles.navIcon}>{icon}</Text>

              <Text
                style={[
                  styles.navLabel,
                  {
                    color: isFocused ? accentColor : inactiveText,
                    fontWeight: isFocused ? '700' : '500',
                  },
                ]}
              >
                {route.name}
              </Text>

              {/* Barra vertical indicadora de item ativo */}
              {isFocused && (
                <View
                  style={[
                    styles.activeIndicator,
                    { backgroundColor: accentColor },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Rodapé ──────────────────────────────────────────────────── */}
      <SafeAreaView
        edges={['bottom']}
        style={[
          styles.footer,
          { backgroundColor: footerBg, borderTopColor: footerBorder },
        ]}
      >
        <Text style={[styles.footerVersion, { color: footerText }]}>
          FinançasPRO v1.0.0
        </Text>
      </SafeAreaView>
    </DrawerContentScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Cabeçalho ──────────────────────────────────────────────────────────
  drawerHeader: {
    backgroundColor: '#0f2044',   // navy fixo — identidade de marca
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    // backgroundColor definido inline via accentColor
  },
  logoEmoji: {
    fontSize: 28,
  },
  appName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  appTagline: {
    color: '#bfdbfe',   // primary-200 — contraste suave sobre navy
    fontSize: 13,
    marginTop: 2,
  },

  // ── Lista de navegação ─────────────────────────────────────────────────
  navList: {
    flex: 1,
    paddingTop: 8,
    // backgroundColor definido inline via isDark
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 10,
    marginVertical: 2,
    borderRadius: 12,
    // backgroundColor definido inline via isFocused + accentColor
  },
  navIcon: {
    fontSize: 20,
    marginRight: 14,
  },
  navLabel: {
    flex: 1,
    fontSize: 15,
    // color e fontWeight definidos inline
  },
  activeIndicator: {
    width: 5,
    height: 22,
    borderRadius: 3,
    // backgroundColor definido inline via accentColor
  },

  // ── Rodapé ────────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    // backgroundColor e borderTopColor definidos inline via isDark
  },
  footerVersion: {
    fontSize: 11,
    textAlign: 'center',
    // color definido inline via isDark
  },
});