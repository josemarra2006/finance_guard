// caminho: src/types/navigation.ts
import type { DrawerScreenProps } from '@react-navigation/drawer';

/**
 * Define os parâmetros de cada rota do Drawer.
 * `undefined` significa que a tela não recebe parâmetros de rota.
 */
export type DrawerParamList = {
  Dashboard: undefined;
  Relatórios: undefined;
  Metas: undefined;
  'Chat IA': undefined;
  Configurações: undefined;
};

// Props tipadas para cada tela — use nas telas para obter autocompletar em `navigation` e `route`
export type DashboardScreenProps    = DrawerScreenProps<DrawerParamList, 'Dashboard'>;
export type RelatoriosScreenProps   = DrawerScreenProps<DrawerParamList, 'Relatórios'>;
export type MetasScreenProps        = DrawerScreenProps<DrawerParamList, 'Metas'>;
export type ChatIAScreenProps       = DrawerScreenProps<DrawerParamList, 'Chat IA'>;
export type ConfiguracoesScreenProps = DrawerScreenProps<DrawerParamList, 'Configurações'>;
