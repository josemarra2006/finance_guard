// caminho: src/components/HamburgerButton.tsx
import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';

interface HamburgerButtonProps {
  onPress: () => void;
  color?: string;
}

/**
 * Botão de hambúrguer reutilizável para o cabeçalho.
 * Usa StyleSheet ao invés de NativeWind pois é renderizado
 * dentro do contexto do header do React Navigation.
 */
export default function HamburgerButton({
  onPress,
  color = '#ffffff',
}: HamburgerButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={styles.container}
      activeOpacity={0.7}
      accessibilityLabel="Abrir menu lateral"
      accessibilityRole="button"
    >
      <View style={[styles.line, { backgroundColor: color }]} />
      <View style={[styles.lineMiddle, { backgroundColor: color }]} />
      <View style={[styles.line, { backgroundColor: color }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 16,
    padding: 4,
    justifyContent: 'center',
    gap: 5,
  },
  line: {
    width: 22,
    height: 2,
    borderRadius: 2,
  },
  lineMiddle: {
    width: 16,
    height: 2,
    borderRadius: 2,
  },
});
