// caminho: src/screens/DashboardScreen.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { DashboardScreenProps } from '../types/navigation';

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >

        {/* Card de saldo total */}
        <View className="bg-navy rounded-2xl p-6 mb-6 shadow-md">
          <Text className="text-primary-200 text-sm font-medium mb-1">
            Saldo Total
          </Text>
          <Text className="text-white text-4xl font-bold">
            R$ 0,00
          </Text>
          <Text className="text-primary-300 text-xs mt-2">
            Atualizado agora
          </Text>
        </View>

        {/* Cards de resumo */}
        <View className="flex-row gap-4 mb-6">
          <View className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <Text className="text-gray-500 text-xs mb-1">Receitas</Text>
            <Text className="text-green-600 text-xl font-bold">R$ 0,00</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <Text className="text-gray-500 text-xs mb-1">Despesas</Text>
            <Text className="text-red-500 text-xl font-bold">R$ 0,00</Text>
          </View>
        </View>

        {/* Meta do apartamento */}
        <View className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-100">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-800 font-bold text-base">
              🏠 Meta: Apartamento PG
            </Text>
            <Text className="text-primary-600 text-xs font-semibold">0%</Text>
          </View>
          <View className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <View className="h-full w-0 bg-primary-500 rounded-full" />
          </View>
          <Text className="text-gray-400 text-xs mt-2">
            R$ 0,00 / R$ 0,00 guardados
          </Text>
        </View>

        {/* Atalhos rápidos */}
        <Text className="text-gray-700 font-bold text-base mb-3">
          Acesso rápido
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {[
            { label: 'Relatórios', icon: '📈', screen: 'Relatórios' },
            { label: 'Metas',      icon: '🎯', screen: 'Metas' },
            { label: 'Chat IA',   icon: '🤖', screen: 'Chat IA' },
            { label: 'Config.',   icon: '⚙️', screen: 'Configurações' },
          ].map((item) => (
            <TouchableOpacity
              key={item.screen}
              className="flex-1 min-w-[44%] bg-white rounded-xl p-4 items-center shadow-sm border border-gray-100"
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate(item.screen as keyof typeof navigation)
              }
            >
              <Text className="text-2xl mb-1">{item.icon}</Text>
              <Text className="text-gray-700 text-xs font-medium">
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transações recentes (placeholder) */}
        <Text className="text-gray-700 font-bold text-base mt-6 mb-3">
          Transações recentes
        </Text>
        <View className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 items-center">
          <Text className="text-4xl mb-2">💸</Text>
          <Text className="text-gray-400 text-sm text-center">
            Nenhuma transação ainda.{'\n'}Comece adicionando uma receita ou despesa.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
