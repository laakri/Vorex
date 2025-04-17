import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../stores/auth.store';
import { RootStackParamList, AuthStackParamList, MainTabParamList } from './types';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { DashboardScreen } from '../screens/driver/DashboardScreen';
import { ActiveRoutesScreen } from '../screens/driver/ActiveRoutesScreen';
import { AvailableRoutesScreen } from '../screens/driver/AvailableRoutesScreen';
import { EarningsScreen } from '../screens/driver/EarningsScreen';
import { ProfileScreen } from '../screens/driver/ProfileScreen';
import { SignInScreen } from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';

// Create navigators
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

// Common stack screen options
const commonStackScreenOptions: NativeStackNavigationOptions = {
  headerStyle: {
    backgroundColor: colors.background,
  },
  headerShadowVisible: false,
  headerTintColor: colors.foreground,
  headerTitleStyle: {
    color: colors.foreground,
    fontWeight: '600' as const,
  },
  contentStyle: {
    backgroundColor: colors.background,
  },
  animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
};

// Common tab screen options
const commonTabScreenOptions = {
  headerStyle: {
    backgroundColor: colors.background,
  },
  headerShadowVisible: false,
  headerTintColor: colors.foreground,
  headerTitleStyle: {
    color: colors.foreground,
    fontWeight: '600' as const,
  },
  contentStyle: {
    backgroundColor: colors.background,
  },
  tabBarStyle: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: Platform.OS === 'ios' ? 90 : 70,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
};

// Auth Navigator
const AuthNavigator = () => {
  return (    
    <AuthStack.Navigator
      screenOptions={{
        ...commonStackScreenOptions,
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
};

// Main Tab Navigator
const MainNavigator = () => {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        ...commonTabScreenOptions,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ActiveRoutes') {
            iconName = focused ? 'navigate' : 'navigate-outline';
          } else if (route.name === 'AvailableRoutes') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Earnings') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <MainTab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: 'Home',
        }}
      />
      <MainTab.Screen 
        name="ActiveRoutes" 
        component={ActiveRoutesScreen}
        options={{
          title: 'Active Routes',
        }}
      />
      <MainTab.Screen 
        name="AvailableRoutes" 
        component={AvailableRoutesScreen}
        options={{
          title: 'Available Routes',
        }}
      />
      <MainTab.Screen 
        name="Earnings" 
        component={EarningsScreen}
        options={{
          title: 'Earnings',
        }}
      />
      <MainTab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
    </MainTab.Navigator>
  );
};

// Root Navigator
export const AppNavigator = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const theme = {
    ...DefaultTheme,
    dark: true,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.background,
      text: colors.foreground,
      border: colors.border,
      notification: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={theme}>
      <RootStack.Navigator
        screenOptions={{
          ...commonStackScreenOptions,
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}; 