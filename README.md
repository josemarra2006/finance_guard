<div align="center">

<img src="https://img.shields.io/badge/Expo-SDK%2055-000020?style=for-the-badge&logo=expo&logoColor=white" />
<img src="https://img.shields.io/badge/React%20Native-0.76-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
<img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Supabase-Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
<img src="https://img.shields.io/badge/Groq-LLaMA%203.3%2070B-F55036?style=for-the-badge&logo=meta&logoColor=white" />
<img src="https://img.shields.io/badge/SQLite-Local--First-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />

</div>

---

> 🇧🇷 [Português](#português) · 🇺🇸 [English](#english)

---

# Português

<div align="center">

# 💰 Finance Guard

### Seu controle financeiro pessoal, offline-first, com IA integrada.

*Planeje, economize e conquiste suas metas — mesmo sem internet.*

</div>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Stack Tecnológica](#-stack-tecnológica)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e Configuração](#-instalação-e-configuração)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Banco de Dados](#-banco-de-dados)
- [Inteligência Artificial](#-inteligência-artificial)
- [Build e Deploy](#-build-e-deploy)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🎯 Sobre o Projeto

O **Finance Guard** (FinançasPRO) é um aplicativo de finanças pessoais desenvolvido com arquitetura **local-first**: todos os dados financeiros vivem no dispositivo do usuário em um banco SQLite, garantindo privacidade total e funcionamento pleno sem conexão à internet.

A autenticação é delegada ao **Supabase Auth** (sem armazenar dados financeiros na nuvem), e a inteligência artificial é alimentada pela **API do Groq** com o modelo LLaMA 3.3 70B — trazendo análises financeiras personalizadas e uma consultora virtual chamada **FinIA** diretamente no app.

O projeto foi construído em **7 fases** incrementais:

| Fase | Entrega |
|------|---------|
| 1 | Navegação com DrawerNavigator |
| 2 | Banco SQLite com sistema de migrações |
| 3 | Dashboard com cards e lançamentos |
| 4 | Relatórios por ano/mês/transação |
| 5 | Metas financeiras com análise de IA |
| 6 | Chat livre com a consultora FinIA |
| 7 | Configurações, temas e personalização |

---

## ✨ Funcionalidades

### 📊 Dashboard
- Resumo financeiro do mês atual com 4 cards: **Entradas**, **Gastos**, **Sobras** e **Economias**
- Lançamento de transações via modal (gasto, recebimento, economia)
- Lista das 10 movimentações mais recentes do mês
- Atalho para a tela de Relatórios

### 📈 Relatórios
- Histórico navegável por **Ano → Mês → Transações**
- Painel de resumo por mês (totais de entrada, gasto e economia)
- Bloqueio inteligente de meses futuros com mensagem inline
- Pull-to-refresh para recarregar dados

### 🎯 Metas Financeiras
- Criação de metas com nome, valor-alvo e prazo em meses
- **Vínculo automático** entre metas e economias pelo título da transação
- Barra de progresso calculada dinamicamente do banco
- Cards informativos: valor mensal necessário e prazo restante
- **Análise de viabilidade com IA** (via Groq): avalia se o prazo é realista e sugere recomendações

### 🤖 Chat IA — FinIA
- Chat livre com a consultora financeira **FinIA** (persona sobre LLaMA 3.3 70B)
- Histórico de conversa mantido em memória durante a sessão
- **Sistema de regras em 3 camadas** no prompt:
  - Foco exclusivo em finanças pessoais
  - Desvios simples respondidos em 1 frase + redirecionamento gentil
  - Desvios complexos recusados profissionalmente com sugestão financeira
- Indicador animado de "digitando" (1→2→3 pontos)
- Tratamento de erros por tipo (rede, chave inválida, rate limit)
- Banner de aviso quando a chave da API não está configurada

### ⚙️ Configurações
- **Perfil**: nome de exibição e renda mensal (alimenta a IA)
- **Integração com IA**: campo seguro para a chave da API Groq (BYOK — Bring Your Own Key) com máscara e toggle mostrar/ocultar
- **Aparência**:
  - Seletor de tema: ☀️ Claro · 🌙 Escuro · ⚙️ Sistema
  - Paleta de 5 cores de destaque: Azul, Verde, Laranja, Roxo, Teal
- **Conta**: reset de configurações e logout do Supabase

### 🔐 Autenticação
- Login e cadastro via **Supabase Auth** (email + senha)
- Sessão persistida no AsyncStorage entre fechamentos do app
- Perfil expandido na tabela `public.profiles` via trigger do banco

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────┐
│                   App.tsx (raiz)                │
│  GestureHandlerRootView                         │
│  └── SafeAreaProvider                           │
│      └── ThemeProvider (NativeWind darkMode)    │
│          └── SQLiteProvider (migrações)         │
│              └── AuthProvider (Supabase)        │
│                  └── AppShell (dark class)      │
│                      └── NavigationContainer   │
│                          └── RootNavigator     │
│                              ├── AuthScreen    │
│                              └── AppNavigator  │
│                                  (Drawer)      │
└─────────────────────────────────────────────────┘
```

**Princípios de design:**
- **Local-first**: dados financeiros nunca saem do dispositivo
- **BYOK (Bring Your Own Key)**: cada usuário usa sua cota gratuita do Groq
- **Separação de responsabilidades**: hooks de banco separados por domínio (`useTransactions`, `useGoals`, `useReports`)
- **Tema em runtime**: `ThemeContext` + NativeWind `darkMode: 'class'` sem rebuild

---

## 🛠️ Stack Tecnológica

| Categoria | Tecnologia |
|-----------|-----------|
| Framework | React Native + Expo SDK 55 |
| Linguagem | TypeScript 5.x |
| Navegação | React Navigation 7 (Drawer + Native Stack) |
| Banco local | expo-sqlite (SQLite WAL mode) |
| Estado global | Zustand + AsyncStorage |
| Autenticação | Supabase Auth |
| Estilização | NativeWind v4 (Tailwind CSS) |
| IA / LLM | Groq API — LLaMA 3.3 70B Versatile |
| Build | EAS Build (Expo Application Services) |
| Safe area | react-native-safe-area-context |
| Gestos | react-native-gesture-handler |

---

## 📦 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** ≥ 18.x ([download](https://nodejs.org))
- **npm** ≥ 9.x ou **yarn** ≥ 1.22.x
- **Expo CLI** (instalado globalmente):
  ```bash
  npm install -g expo-cli
  ```
- **EAS CLI** (para builds):
  ```bash
  npm install -g eas-cli
  ```
- Conta no **Supabase** (gratuita): [supabase.com](https://supabase.com)
- Conta no **Groq** (gratuita, para a API de IA): [console.groq.com](https://console.groq.com)
- **Android Studio** (para emulador Android) ou **Xcode** (para simulador iOS, somente macOS)

---

## 🚀 Instalação e Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/finance-guard.git
cd finance-guard
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto (veja a seção [Variáveis de Ambiente](#-variáveis-de-ambiente)):

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais do Supabase.

### 4. Configure o banco de dados no Supabase

Acesse o **SQL Editor** do seu projeto Supabase e execute os seguintes scripts em ordem:

#### 4.1 — Tabela de perfis e trigger de criação automática

```sql
-- Tabela pública de perfis (espelha auth.users)
CREATE TABLE public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  name       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilita RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: usuário vê e edita apenas o próprio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger: cria perfil automaticamente ao registrar novo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### 4.2 — Desabilitar confirmação de email (recomendado para testes)

No painel do Supabase:
> **Authentication → Providers → Email → desativar "Confirm email"**

Isso permite login imediato após o cadastro, sem verificação de email.

### 5. Inicie o servidor de desenvolvimento

```bash
npx expo start --clear
```

Acesse o app via:
- **Expo Go** (Android/iOS): escaneie o QR code
- **Emulador Android**: pressione `a` no terminal
- **Simulador iOS**: pressione `i` no terminal (somente macOS)

---

## 🔑 Variáveis de Ambiente

Crie o arquivo `.env` na raiz com o seguinte conteúdo:

```env
# ─── Supabase ─────────────────────────────────────────────────────────────────
# Encontre em: painel do Supabase → Settings → API

EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

> **⚠️ Importante:**
> - O prefixo `EXPO_PUBLIC_` é obrigatório para que o Expo injete as variáveis no bundle.
> - **Nunca** commite o arquivo `.env` com credenciais reais. Adicione-o ao `.gitignore`.
> - A chave da API do Groq **não vai para o `.env`** — cada usuário insere a própria chave em **Configurações → Integração com IA** dentro do app.

Exemplo de `.gitignore` mínimo:
```gitignore
.env
.env.local
node_modules/
.expo/
dist/
```

---

## 📁 Estrutura de Pastas

```
finance-guard/
├── App.tsx                          # Raiz: providers + AppShell
├── tailwind.config.js               # Config NativeWind com darkMode: 'class'
├── .env                             # Variáveis de ambiente (não commitar)
├── .env.example                     # Template das variáveis
│
└── src/
    ├── components/
    │   ├── DrawerContent.tsx        # Painel lateral com accentColor dinâmico
    │   └── HamburgerButton.tsx      # Botão de menu reutilizável
    │
    ├── contexts/
    │   ├── AuthContext.tsx          # Gerencia sessão Supabase
    │   └── ThemeContext.tsx         # accentColor + isDark + setColorScheme
    │
    ├── database/
    │   ├── db.ts                    # Schema SQLite + sistema de migrações
    │   ├── useTransactions.ts       # CRUD + resumo mensal
    │   ├── useGoals.ts              # CRUD metas + cálculo de progresso
    │   └── useReports.ts           # Queries de relatório por período
    │
    ├── navigation/
    │   ├── RootNavigator.tsx        # Auth vs App routing
    │   ├── AppNavigator.tsx         # DrawerNavigator principal
    │   ├── ReportsStack.tsx         # Stack: Anos → Meses → Transações
    │   └── GoalsStack.tsx           # Stack: Lista → Detalhes da meta
    │
    ├── screens/
    │   ├── AuthScreen.tsx           # Login e cadastro
    │   ├── DashboardScreen.tsx      # Tela principal
    │   ├── RelatoriosScreen.tsx     # Wrapper do ReportsStack
    │   ├── MetasScreen.tsx          # Wrapper do GoalsStack
    │   ├── ChatIAScreen.tsx         # Chat com FinIA
    │   ├── ConfiguracoesScreen.tsx  # Configurações completas
    │   ├── reports/
    │   │   ├── YearsScreen.tsx
    │   │   ├── MonthsScreen.tsx
    │   │   └── TransacoesScreen.tsx
    │   └── goals/
    │       ├── GoalsMainScreen.tsx
    │       └── GoalDetailsScreen.tsx
    │
    ├── services/
    │   ├── groqApi.ts               # chatWithAI + analyzeGoalViability
    │   └── supabase.ts              # Cliente Supabase configurado
    │
    ├── store/
    │   └── useSettingsStore.ts      # Zustand: perfil, tema, accentColor, groqApiKey
    │
    └── types/
        ├── database.ts              # Tipos: Transaction, Goal, etc.
        └── navigation.ts            # Tipos de rotas e props de navegação
```

---

## 🗄️ Banco de Dados

O banco local usa **SQLite via expo-sqlite** com um sistema de migrações versionadas por `PRAGMA user_version`.

### Schema atual (versão 1)

```sql
-- Transações financeiras
CREATE TABLE transactions (
  id     INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  title  TEXT    NOT NULL,
  amount REAL    NOT NULL,
  type   TEXT    NOT NULL CHECK(type IN ('gasto', 'entrada', 'economia')),
  date   TEXT    NOT NULL   -- ISO 8601: "2025-06-15T10:30:00.000Z"
);

CREATE INDEX idx_transactions_date ON transactions (date);
CREATE INDEX idx_transactions_type ON transactions (type);

-- Metas financeiras
CREATE TABLE goals (
  id             INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name           TEXT NOT NULL,
  target_amount  REAL NOT NULL,
  current_amount REAL NOT NULL DEFAULT 0.0,
  deadline_date  TEXT NOT NULL   -- ISO 8601
);

CREATE INDEX idx_goals_deadline ON goals (deadline_date);
```

### Regra de vínculo Meta ↔ Economia

O progresso de uma meta é calculado **dinamicamente** somando todas as transações do tipo `'economia'` cujo `title` seja exatamente igual ao `name` da meta. Não há chave estrangeira — o vínculo é feito por nome, o que permite lançamentos flexíveis via Dashboard.

```sql
-- Progresso de uma meta chamada "Apartamento PG"
SELECT COALESCE(SUM(amount), 0)
FROM transactions
WHERE type = 'economia' AND title = 'Apartamento PG';
```

### Adicionando migrações

Para evoluir o schema no futuro, incremente `DATABASE_VERSION` em `src/database/db.ts` e adicione um novo bloco `if (currentVersion < X)`:

```typescript
export const DATABASE_VERSION = 2;   // ← incrementar

if (currentVersion < 2) {
  await db.execAsync(`
    ALTER TABLE transactions ADD COLUMN category TEXT;
  `);
}
```

---

## 🤖 Inteligência Artificial

### Groq API — BYOK (Bring Your Own Key)

O app usa a **API do Groq** com o modelo `llama-3.3-70b-versatile`. A chave é inserida pelo usuário em **Configurações → Integração com IA** e armazenada apenas no dispositivo via AsyncStorage — nunca enviada a servidores de terceiros além do próprio Groq.

**Obter chave gratuita:**
1. Acesse [console.groq.com](https://console.groq.com)
2. Faça login ou crie uma conta
3. Vá em **API Keys → Create API Key**
4. Cole a chave no app em Configurações

### Funcionalidades de IA

#### 1. Análise de Viabilidade de Metas (`analyzeGoalViability`)
Chamada ao entrar nos detalhes de uma meta. Envia para o Groq:
- Renda mensal (Zustand)
- Média de gastos e economias mensais (SQLite)
- Valor acumulado, valor-alvo e prazo da meta

A IA retorna: diagnóstico de viabilidade (SIM/NÃO) + previsão realista + 2-3 recomendações práticas.

#### 2. Chat Livre — FinIA (`chatWithAI`)
Consultora financeira com **system prompt de 3 regras invioláveis**:

| Situação | Comportamento |
|----------|---------------|
| Pergunta financeira | Resposta completa e educativa (80–350 palavras) |
| Pergunta factual simples fora do escopo | 1 frase de resposta + redirecionamento gentil |
| Pedido complexo fora do escopo | Recusa profissional + sugestão financeira relacionada |

O histórico completo da conversa é enviado em cada requisição (formato padrão OpenAI), excluindo mensagens de erro para não contaminar o contexto do modelo.

---

## 📱 Build e Deploy

### Desenvolvimento (Expo Go)

```bash
npx expo start --clear        # limpa cache do Metro
npx expo start --tunnel       # usa túnel ngrok (útil em redes corporativas)
```

### Build de produção com EAS

#### Configurar EAS (primeira vez)

```bash
eas login
eas build:configure
```

#### Build para Android (APK para teste)

```bash
eas build --platform android --profile preview
```

#### Build para Android (AAB para Play Store)

```bash
eas build --platform android --profile production
```

#### Build para iOS (somente macOS com conta Apple Developer)

```bash
eas build --platform ios --profile production
```

> **Nota:** Um novo build EAS é necessário **apenas** quando dependências com código nativo são adicionadas ou atualizadas. Mudanças em JavaScript/TypeScript são entregues via **EAS Update** sem rebuild.

### EAS Update (hot update JS)

```bash
eas update --branch production --message "Descrição da atualização"
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um **fork** do repositório
2. Crie uma branch para sua feature:
   ```bash
   git checkout -b feature/minha-feature
   ```
3. Faça seus commits seguindo [Conventional Commits](https://www.conventionalcommits.org/pt-br/):
   ```bash
   git commit -m "feat: adiciona exportação de transações em CSV"
   ```
4. Faça o push da branch:
   ```bash
   git push origin feature/minha-feature
   ```
5. Abra um **Pull Request** descrevendo as mudanças

### Padrões do projeto

- TypeScript estrito — sem `any` explícito
- Comentários em português nos componentes de negócio
- `StyleSheet` para layouts complexos, NativeWind para theming
- Hooks de banco isolados por domínio (sem misturar `useTransactions` com `useGoals`)
- Cores semânticas financeiras (verde/vermelho/azul) nunca substituídas pelo `accentColor`

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
Feito com 💙 e React Native
</div>

---
---

# English

<div align="center">

# 💰 Finance Guard

### Your personal finance tracker, offline-first, with built-in AI.

*Plan, save, and achieve your goals — even without internet.*

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Folder Structure](#-folder-structure)
- [Database](#-database)
- [Artificial Intelligence](#-artificial-intelligence)
- [Build & Deploy](#-build--deploy)
- [Contributing](#-contributing)
- [License](#-license-1)

---

## 🎯 About the Project

**Finance Guard** (FinançasPRO) is a personal finance app built with a **local-first** architecture: all financial data lives on the user's device in a SQLite database, ensuring complete privacy and full offline functionality.

Authentication is delegated to **Supabase Auth** (no financial data is stored in the cloud), and AI capabilities are powered by the **Groq API** with the LLaMA 3.3 70B model — delivering personalized financial analysis and a virtual advisor named **FinIA** directly inside the app.

The project was built across **7 incremental phases**:

| Phase | Deliverable |
|-------|-------------|
| 1 | Navigation with DrawerNavigator |
| 2 | SQLite database with migration system |
| 3 | Dashboard with summary cards and transactions |
| 4 | Reports by year / month / transaction |
| 5 | Financial goals with AI viability analysis |
| 6 | Free chat with the FinIA advisor |
| 7 | Settings, themes and full personalization |

---

## ✨ Features

### 📊 Dashboard
- Monthly financial summary with 4 cards: **Income**, **Expenses**, **Surplus** and **Savings**
- Transaction entry via modal (expense, income, savings)
- List of the 10 most recent transactions for the current month
- Shortcut to the Reports screen

### 📈 Reports
- Browsable history by **Year → Month → Transactions**
- Monthly summary panel (income, expense and savings totals)
- Smart blocking of future months with inline message
- Pull-to-refresh to reload data

### 🎯 Financial Goals
- Create goals with name, target amount and deadline in months
- **Automatic linking** between goals and savings by transaction title
- Progress bar calculated dynamically from the database
- Info cards: required monthly amount and remaining time
- **AI viability analysis** (via Groq): evaluates whether the deadline is realistic and provides recommendations

### 🤖 AI Chat — FinIA
- Free chat with the **FinIA** financial advisor (persona over LLaMA 3.3 70B)
- Conversation history maintained in memory during the session
- **3-layer rule system** in the prompt:
  - Exclusive focus on personal finance
  - Simple off-topic questions answered in 1 sentence + gentle redirect
  - Complex off-topic requests professionally refused with a financial suggestion
- Animated "typing" indicator (1→2→3 dots)
- Typed error handling (network, invalid key, rate limit)
- Warning banner when the API key is not configured

### ⚙️ Settings
- **Profile**: display name and monthly income (feeds the AI)
- **AI Integration**: secure field for the Groq API key (BYOK — Bring Your Own Key) with mask and show/hide toggle
- **Appearance**:
  - Theme selector: ☀️ Light · 🌙 Dark · ⚙️ System
  - 5-color accent palette: Blue, Green, Orange, Purple, Teal
- **Account**: reset settings and Supabase logout

### 🔐 Authentication
- Sign in and sign up via **Supabase Auth** (email + password)
- Session persisted in AsyncStorage between app launches
- Expanded profile in the `public.profiles` table via database trigger

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   App.tsx (root)                │
│  GestureHandlerRootView                         │
│  └── SafeAreaProvider                           │
│      └── ThemeProvider (NativeWind darkMode)    │
│          └── SQLiteProvider (migrations)        │
│              └── AuthProvider (Supabase)        │
│                  └── AppShell (dark class)      │
│                      └── NavigationContainer   │
│                          └── RootNavigator     │
│                              ├── AuthScreen    │
│                              └── AppNavigator  │
│                                  (Drawer)      │
└─────────────────────────────────────────────────┘
```

**Design principles:**
- **Local-first**: financial data never leaves the device
- **BYOK (Bring Your Own Key)**: each user uses their own free Groq quota
- **Separation of concerns**: database hooks separated by domain (`useTransactions`, `useGoals`, `useReports`)
- **Runtime theming**: `ThemeContext` + NativeWind `darkMode: 'class'` without rebuilding

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React Native + Expo SDK 55 |
| Language | TypeScript 5.x |
| Navigation | React Navigation 7 (Drawer + Native Stack) |
| Local database | expo-sqlite (SQLite WAL mode) |
| Global state | Zustand + AsyncStorage |
| Authentication | Supabase Auth |
| Styling | NativeWind v4 (Tailwind CSS) |
| AI / LLM | Groq API — LLaMA 3.3 70B Versatile |
| Build | EAS Build (Expo Application Services) |
| Safe area | react-native-safe-area-context |
| Gestures | react-native-gesture-handler |

---

## 📦 Prerequisites

Before getting started, make sure you have installed:

- **Node.js** ≥ 18.x ([download](https://nodejs.org))
- **npm** ≥ 9.x or **yarn** ≥ 1.22.x
- **Expo CLI** (globally installed):
  ```bash
  npm install -g expo-cli
  ```
- **EAS CLI** (for builds):
  ```bash
  npm install -g eas-cli
  ```
- **Supabase** account (free): [supabase.com](https://supabase.com)
- **Groq** account (free, for the AI API): [console.groq.com](https://console.groq.com)
- **Android Studio** (for Android emulator) or **Xcode** (for iOS simulator, macOS only)

---

## 🚀 Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/finance-guard.git
cd finance-guard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root (see [Environment Variables](#-environment-variables)):

```bash
cp .env.example .env
```

Edit the `.env` file with your Supabase credentials.

### 4. Set up the Supabase database

Open the **SQL Editor** in your Supabase project and run the following scripts in order:

#### 4.1 — Profiles table and auto-creation trigger

```sql
-- Public profiles table (mirrors auth.users)
CREATE TABLE public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  name       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: users can only view and edit their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger: automatically creates profile when a new user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### 4.2 — Disable email confirmation (recommended for development)

In the Supabase dashboard:
> **Authentication → Providers → Email → disable "Confirm email"**

This allows immediate login after registration, without email verification.

### 5. Start the development server

```bash
npx expo start --clear
```

Access the app via:
- **Expo Go** (Android/iOS): scan the QR code
- **Android Emulator**: press `a` in the terminal
- **iOS Simulator**: press `i` in the terminal (macOS only)

---

## 🔑 Environment Variables

Create the `.env` file in the project root with the following content:

```env
# ─── Supabase ─────────────────────────────────────────────────────────────────
# Found at: Supabase dashboard → Settings → API

EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> **⚠️ Important:**
> - The `EXPO_PUBLIC_` prefix is required for Expo to inject variables into the bundle.
> - **Never** commit the `.env` file with real credentials. Add it to `.gitignore`.
> - The Groq API key does **not** go in `.env` — each user enters their own key in **Settings → AI Integration** inside the app.

Minimal `.gitignore` example:
```gitignore
.env
.env.local
node_modules/
.expo/
dist/
```

---

## 📁 Folder Structure

```
finance-guard/
├── App.tsx                          # Root: providers + AppShell
├── tailwind.config.js               # NativeWind config with darkMode: 'class'
├── .env                             # Environment variables (do not commit)
├── .env.example                     # Variable template
│
└── src/
    ├── components/
    │   ├── DrawerContent.tsx        # Side panel with dynamic accentColor
    │   └── HamburgerButton.tsx      # Reusable menu button
    │
    ├── contexts/
    │   ├── AuthContext.tsx          # Manages Supabase session
    │   └── ThemeContext.tsx         # accentColor + isDark + setColorScheme
    │
    ├── database/
    │   ├── db.ts                    # SQLite schema + migration system
    │   ├── useTransactions.ts       # CRUD + monthly summary
    │   ├── useGoals.ts              # CRUD goals + progress calculation
    │   └── useReports.ts           # Report queries by period
    │
    ├── navigation/
    │   ├── RootNavigator.tsx        # Auth vs App routing
    │   ├── AppNavigator.tsx         # Main DrawerNavigator
    │   ├── ReportsStack.tsx         # Stack: Years → Months → Transactions
    │   └── GoalsStack.tsx           # Stack: List → Goal Details
    │
    ├── screens/
    │   ├── AuthScreen.tsx           # Login and sign up
    │   ├── DashboardScreen.tsx      # Main screen
    │   ├── RelatoriosScreen.tsx     # ReportsStack wrapper
    │   ├── MetasScreen.tsx          # GoalsStack wrapper
    │   ├── ChatIAScreen.tsx         # Chat with FinIA
    │   ├── ConfiguracoesScreen.tsx  # Full settings screen
    │   ├── reports/
    │   │   ├── YearsScreen.tsx
    │   │   ├── MonthsScreen.tsx
    │   │   └── TransacoesScreen.tsx
    │   └── goals/
    │       ├── GoalsMainScreen.tsx
    │       └── GoalDetailsScreen.tsx
    │
    ├── services/
    │   ├── groqApi.ts               # chatWithAI + analyzeGoalViability
    │   └── supabase.ts              # Configured Supabase client
    │
    ├── store/
    │   └── useSettingsStore.ts      # Zustand: profile, theme, accentColor, groqApiKey
    │
    └── types/
        ├── database.ts              # Types: Transaction, Goal, etc.
        └── navigation.ts            # Route types and navigation props
```

---

## 🗄️ Database

The local database uses **SQLite via expo-sqlite** with a versioned migration system managed by `PRAGMA user_version`.

### Current schema (version 1)

```sql
-- Financial transactions
CREATE TABLE transactions (
  id     INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  title  TEXT    NOT NULL,
  amount REAL    NOT NULL,
  type   TEXT    NOT NULL CHECK(type IN ('gasto', 'entrada', 'economia')),
  date   TEXT    NOT NULL   -- ISO 8601: "2025-06-15T10:30:00.000Z"
);

CREATE INDEX idx_transactions_date ON transactions (date);
CREATE INDEX idx_transactions_type ON transactions (type);

-- Financial goals
CREATE TABLE goals (
  id             INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name           TEXT NOT NULL,
  target_amount  REAL NOT NULL,
  current_amount REAL NOT NULL DEFAULT 0.0,
  deadline_date  TEXT NOT NULL   -- ISO 8601
);

CREATE INDEX idx_goals_deadline ON goals (deadline_date);
```

### Goal ↔ Savings linking rule

A goal's progress is calculated **dynamically** by summing all `'economia'` (savings) transactions whose `title` exactly matches the goal's `name`. There is no foreign key — the link is made by name, allowing flexible entries via the Dashboard.

```sql
-- Progress for a goal named "Apartment"
SELECT COALESCE(SUM(amount), 0)
FROM transactions
WHERE type = 'economia' AND title = 'Apartment';
```

### Adding migrations

To evolve the schema in the future, increment `DATABASE_VERSION` in `src/database/db.ts` and add a new `if (currentVersion < X)` block:

```typescript
export const DATABASE_VERSION = 2;   // ← increment

if (currentVersion < 2) {
  await db.execAsync(`
    ALTER TABLE transactions ADD COLUMN category TEXT;
  `);
}
```

---

## 🤖 Artificial Intelligence

### Groq API — BYOK (Bring Your Own Key)

The app uses the **Groq API** with the `llama-3.3-70b-versatile` model. The key is entered by the user in **Settings → AI Integration** and stored only on the device via AsyncStorage — never sent to third-party servers other than Groq itself.

**Get a free API key:**
1. Visit [console.groq.com](https://console.groq.com)
2. Log in or create an account
3. Go to **API Keys → Create API Key**
4. Paste the key in the app under Settings

### AI Features

#### 1. Goal Viability Analysis (`analyzeGoalViability`)
Called when viewing goal details. Sends to Groq:
- Monthly income (Zustand)
- Average monthly expenses and savings (SQLite)
- Accumulated amount, target amount and goal deadline

The AI returns: viability diagnosis (YES/NO) + realistic forecast + 2-3 practical recommendations.

#### 2. Free Chat — FinIA (`chatWithAI`)
Financial advisor with a **3-rule inviolable system prompt**:

| Situation | Behavior |
|-----------|----------|
| Financial question | Complete and educational response (80–350 words) |
| Simple factual off-topic question | 1 sentence answer + gentle redirect |
| Complex off-topic request | Professional refusal + related financial suggestion |

The full conversation history is sent with each request (standard OpenAI format), excluding error messages to avoid contaminating the model's context.

---

## 📱 Build & Deploy

### Development (Expo Go)

```bash
npx expo start --clear        # clears Metro cache
npx expo start --tunnel       # uses ngrok tunnel (useful on corporate networks)
```

### Production build with EAS

#### Configure EAS (first time)

```bash
eas login
eas build:configure
```

#### Android build (APK for testing)

```bash
eas build --platform android --profile preview
```

#### Android build (AAB for Play Store)

```bash
eas build --platform android --profile production
```

#### iOS build (macOS only with Apple Developer account)

```bash
eas build --platform ios --profile production
```

> **Note:** A new EAS build is only required when native dependencies are added or updated. JavaScript/TypeScript changes are delivered via **EAS Update** without rebuilding.

### EAS Update (JS hot update)

```bash
eas update --branch production --message "Update description"
```

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. **Fork** the repository
2. Create a branch for your feature:
   ```bash
   git checkout -b feature/my-feature
   ```
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/en/):
   ```bash
   git commit -m "feat: add CSV transaction export"
   ```
4. Push the branch:
   ```bash
   git push origin feature/my-feature
   ```
5. Open a **Pull Request** describing the changes

### Project standards

- Strict TypeScript — no explicit `any`
- `StyleSheet` for complex layouts, NativeWind for theming
- Database hooks isolated by domain (no mixing `useTransactions` with `useGoals`)
- Financial semantic colors (green/red/blue) are never overridden by `accentColor`

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">
Made with 💙 and React Native
</div>
