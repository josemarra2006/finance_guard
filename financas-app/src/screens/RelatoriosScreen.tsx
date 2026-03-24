// caminho: src/screens/RelatoriosScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RelatoriosScreenProps } from '../types/navigation';

export default function RelatoriosScreen(_props: RelatoriosScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-6xl mb-4">📈</Text>
        <Text className="text-gray-800 text-2xl font-bold mb-2">
          Relatórios
        </Text>
        <Text className="text-gray-400 text-sm text-center leading-relaxed">
          Aqui você verá gráficos e análises detalhadas das suas finanças.{'\n'}
          Em construção — disponível na próxima fase.
        </Text>
      </View>
    </SafeAreaView>
  );
}
