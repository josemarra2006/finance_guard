// caminho: src/screens/MetasScreen.tsx
import React from 'react';
import GoalsStack from '../navigation/GoalsStack';

/**
 * Ponto de entrada da aba "Metas" no Drawer Navigator.
 *
 * Esta tela funciona apenas como wrapper do `GoalsStack`.
 * Todo o conteúdo visual, lógica e navegação vivem dentro do Stack.
 *
 * Por que um wrapper separado?
 *  - O DrawerNavigator precisa de um componente React para a rota "Metas".
 *  - O GoalsStack precisa de um StackNavigator próprio para manter histórico
 *    de navegação interno (GoalsMain → GoalDetails) sem interferir no Drawer.
 *  - Separar os dois evita que o botão "Voltar" do Stack conflite com o Drawer.
 */
export default function MetasScreen(): React.JSX.Element {
  return <GoalsStack />;
}
