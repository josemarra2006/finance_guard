// caminho: src/navigation/ReportsStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { ReportsStackParamList } from '../types/navigation';
import YearsScreen from '../screens/reports/YearsScreen';
import MonthsScreen from '../screens/reports/MonthsScreen';
import TransacoesScreen from '../screens/reports/TransacoesScreen';

const Stack = createNativeStackNavigator<ReportsStackParamList>();

const HEADER_BG   = '#0f2044';
const HEADER_TINT = '#ffffff';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function ReportsStack(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="ReportsAnos"
      screenOptions={{
        headerStyle: {
          backgroundColor: HEADER_BG,
        },
        headerTintColor: HEADER_TINT,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
        },
        headerTitleAlign: 'center',
        animation: 'slide_from_right',
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="ReportsAnos"
        component={YearsScreen}
        options={{
          title: 'Relatórios',
          headerBackVisible: false,
        }}
      />

      <Stack.Screen
        name="ReportsMeses"
        component={MonthsScreen}
        options={({ route }) => ({
          title: String(route.params.year),
          headerBackTitle: 'Anos',
        })}
      />

      <Stack.Screen
        name="ReportsTransacoes"
        component={TransacoesScreen}
        options={({ route }) => {
          const monthName = MONTH_NAMES[route.params.month - 1] ?? '';
          return {
            title: `${monthName} ${route.params.year}`,
            headerBackTitle: 'Meses',
          };
        }}
      />
    </Stack.Navigator>
  );
}