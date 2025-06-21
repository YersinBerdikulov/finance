import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
enableScreens();

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './screens/HomeScreen';
import OperationsScreen from './screens/OperationsScreen';
import StatsScreen from './screens/StatsScreen';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import React, { useRef, useEffect, useState, useMemo, useContext, createContext } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from './shared/i18n';

const Tab = createBottomTabNavigator();

const icons = {
  Главная: {
    active: { lib: Ionicons, name: 'home' },
    inactive: { lib: Ionicons, name: 'home-outline' },
  },
  Операции: {
    active: { lib: Ionicons, name: 'swap-horizontal' },
    inactive: { lib: Ionicons, name: 'swap-horizontal-outline' },
  },
  Статистика: {
    active: { lib: FontAwesome5, name: 'chart-pie' },
    inactive: { lib: FontAwesome5, name: 'chart-pie' },
  },
} as const;

type TabName = keyof typeof icons;

const TAB_NAMES: TabName[] = ['Главная', 'Операции', 'Статистика'];
const TAB_COUNT = TAB_NAMES.length;
const SCREEN_WIDTH = Dimensions.get('window').width;

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { theme } = useTheme();
  const tabWidth = SCREEN_WIDTH / TAB_COUNT;
  const indicatorSize = 44;
  const iconOffset = (tabWidth - indicatorSize) / 2;
  const translateX = useRef(new Animated.Value(tabWidth * state.index)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: tabWidth * state.index,
      useNativeDriver: true,
      duration: 300,
      easing: undefined,
    }).start();
  }, [state.index, tabWidth]);

  return (
    <View style={[styles.tabBarContainer, { backgroundColor: theme.background, borderTopColor: theme.card }]}>
      <View style={styles.tabBarInner}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { lib: IconLib, name } = focused
            ? icons[route.name as TabName].active
            : icons[route.name as TabName].inactive;
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.8}
            >
              {focused ? (
                <Animatable.View
                  animation={focused ? 'bounceIn' : undefined}
                  duration={600}
                  style={[styles.iconBgCircle, { backgroundColor: theme.accent, shadowColor: theme.accent }]}
                >
                  <IconLib name={name} size={28} color={'#fff'} style={styles.iconOnCircle} />
                </Animatable.View>
              ) : (
                <IconLib name={name} size={26} color={theme.textSecondary} style={styles.iconOnCircle} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Главная" component={HomeScreen} />
      <Tab.Screen name="Операции" component={OperationsScreen} />
      <Tab.Screen name="Статистика" component={StatsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: '#fff',
    paddingBottom: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    height: 60,
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  iconBgCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8e24aa',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8e24aa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconOnCircle: {
    zIndex: 1,
  },
});

// --- Theme Context ---
const lightTheme = {
  background: '#f5f7fb',
  card: '#fff',
  accent: '#8e24aa',
  text: '#283593',
  textSecondary: '#b0b0b0',
  balanceCard: '#8e9cfb',
  income: '#1ecb81',
  expense: '#ff5e62',
  moonBg: '#fff',
  moonIcon: '#fbc02d',
};
const darkTheme = {
  background: '#181a20',
  card: '#232634',
  accent: '#8e24aa',
  text: '#fff',
  textSecondary: '#b0b0b0',
  balanceCard: '#232a4d',
  income: '#1ecb81',
  expense: '#ff5e62',
  moonBg: '#232634',
  moonIcon: '#fbc02d',
};

const ThemeContext = createContext({
  theme: lightTheme,
  toggleTheme: () => {},
  isDark: false,
});

export const useTheme = () => useContext(ThemeContext);

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const toggleTheme = () => setIsDark((v) => !v);
  const value = useMemo(() => ({
    theme: isDark ? darkTheme : lightTheme,
    toggleTheme,
    isDark,
  }), [isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// --- Transactions Context ---
const TransactionsContext = createContext<{
  transactions: any[];
  setTransactions: React.Dispatch<React.SetStateAction<any[]>>;
}>({
  transactions: [],
  setTransactions: () => {},
});

export const useTransactions = () => useContext(TransactionsContext);

const TransactionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<any[]>([]);

  // Загрузка транзакций при запуске
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('transactions');
      if (saved) setTransactions(JSON.parse(saved));
    })();
  }, []);

  // Сохранение транзакций при изменении
  useEffect(() => {
    AsyncStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  return (
    <TransactionsContext.Provider value={{ transactions, setTransactions }}>
      {children}
    </TransactionsContext.Provider>
  );
};

// --- Currency Context ---
type Currency = '₸' | '$' | '€' | '₽';
const CurrencyContext = createContext({
  currency: '$' as Currency,
  setCurrency: (c: Currency) => {},
});
export const useCurrency = () => useContext(CurrencyContext);

const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('$');
  const value = useMemo(() => ({ currency, setCurrency }), [currency]);
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

// --- Language Context ---
type Language = 'en' | 'ru';
const LanguageContext = createContext({
  language: 'en' as Language,
  setLanguage: (lang: Language) => {},
});
export const useLanguage = () => useContext(LanguageContext);

const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('language');
      if (stored === 'en' || stored === 'ru') {
        setLanguageState(stored);
        i18n.locale = stored;
      } else {
        setLanguageState('en');
        i18n.locale = 'en';
      }
    })();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    i18n.locale = lang;
    await AsyncStorage.setItem('language', lang);
  };

  const value = useMemo(() => ({ language, setLanguage }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <CurrencyProvider>
          <TransactionsProvider>
            <NavigationContainer>
              <MainTabs />
              <StatusBar style="auto" />
            </NavigationContainer>
          </TransactionsProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
