// caminho: src/components/DrawerContent.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  DrawerContentScrollView,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mapeamento de ícone (emoji) por nome de rota
const ROUTE_ICONS: Record<string, string> = {
  Dashboard:    '📊',
  'Relatórios': '📈',
  Metas:        '🎯',
  'Chat IA':    '🤖',
  Configurações:'⚙️',
};

export default function DrawerContent(props: DrawerContentComponentProps) {
  const { state, navigation } = props;

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flex: 1, paddingTop: 0 }}
    >
      {/* Cabeçalho do Drawer */}
      <View className="bg-navy px-6 py-8">
        <View className="w-16 h-16 rounded-full bg-primary-500 items-center justify-center mb-3">
          <Text className="text-white text-2xl font-bold">💰</Text>
        </View>
        <Text className="text-white text-xl font-bold">FinançasPRO</Text>
        <Text className="text-primary-200 text-sm mt-1">Controle seu futuro</Text>
      </View>

      {/* Itens de navegação */}
      <ScrollView className="flex-1 bg-white pt-2">
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const icon = ROUTE_ICONS[route.name] ?? '📄';

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              className={`flex-row items-center px-6 py-4 mx-3 my-0.5 rounded-xl ${
                isFocused ? 'bg-primary-50' : 'bg-transparent'
              }`}
              activeOpacity={0.7}
            >
              <Text className="text-xl mr-4">{icon}</Text>
              <Text
                className={`text-base font-medium ${
                  isFocused ? 'text-primary-700' : 'text-gray-600'
                }`}
              >
                {route.name}
              </Text>
              {isFocused && (
                <View className="ml-auto w-1.5 h-6 rounded-full bg-primary-500" />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Rodapé do Drawer */}
      <SafeAreaView edges={['bottom']} className="bg-white px-6 py-4 border-t border-gray-100">
        <Text className="text-gray-400 text-xs text-center">
          FinançasPRO v1.0.0
        </Text>
      </SafeAreaView>
    </DrawerContentScrollView>
  );
}
