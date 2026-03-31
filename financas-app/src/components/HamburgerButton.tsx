// caminho: src/components/HamburgerButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface HamburgerButtonProps {
  onPress: () => void;
  /** Cor do ícone — deve receber HEADER_TINT do navigator pai. Padrão: #ffffff */
  color?: string;
}

/**
 * Botão de menu lateral reutilizável para o header do React Navigation.
 *
 * Usa o ícone `menu` do Feather em vez das três linhas manuais,
 * mantendo consistência com o restante da biblioteca de ícones.
 * StyleSheet puro — sem NativeWind — pois opera dentro do contexto
 * do header nativo onde as classes Tailwind não propagam corretamente.
 */
export default function HamburgerButton({
  onPress,
  color = '#ffffff',
}: HamburgerButtonProps): React.JSX.Element {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={styles.container}
      activeOpacity={0.65}
      accessibilityLabel="Abrir menu lateral"
      accessibilityRole="button"
    >
      <Feather name="menu" size={22} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 16,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
