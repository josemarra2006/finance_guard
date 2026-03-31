// caminho: src/navigation/GoalsStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { GoalsStackParamList } from '../types/navigation';
import GoalsMainScreen from '../screens/goals/GoalsMainScreen';
import GoalDetailsScreen from '../screens/goals/GoalDetailsScreen';

const Stack = createNativeStackNavigator<GoalsStackParamList>();

const HEADER_BG   = '#0f2044';
const HEADER_TINT = '#ffffff';

export default function GoalsStack(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="GoalsMain"
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
        name="GoalsMain"
        component={GoalsMainScreen}
        options={{
          title: 'Metas',
          headerBackVisible: false,
        }}
      />

      <Stack.Screen
        name="GoalDetails"
        component={GoalDetailsScreen}
        options={({ route }) => ({
          title: route.params.goalName,
          headerBackTitle: 'Metas',
        })}
      />
    </Stack.Navigator>
  );
}