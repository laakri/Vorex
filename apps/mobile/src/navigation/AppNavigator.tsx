import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../stores/auth.store';
import { RootStackParamList, AuthStackParamList, MainTabParamList, ProfileStackParamList } from './types';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Text, View } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { DashboardScreen } from '../screens/driver/DashboardScreen';
import { ActiveRoutesScreen } from '../screens/driver/ActiveRoutesScreen';
import { AvailableRoutesScreen } from '../screens/driver/AvailableRoutesScreen';
import { EarningsScreen } from '../screens/driver/EarningsScreen';
import { ProfileScreen } from '../screens/driver/ProfileScreen';
import { SignInScreen } from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import { HistoryScreen } from '../screens/driver/HistoryScreen';
import { VehicleInfoScreen } from '../screens/driver/VehicleInfoScreen';
import { SettingsScreen } from '../screens/driver/SettingsScreen';
import { NotificationScreen } from '../screens/driver/notification/NotificationScreen';
import { NotificationButton } from '../components/NotificationButton';
import { DriverApplicationScreen } from '../screens/driver/DriverApplicationScreen';

// Create navigators
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

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
  // Create a nested Profile navigator
  const ProfileNavigator = () => {
    return (
      <ProfileStack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerShadowVisible: false,
          headerTintColor: colors.foreground,
        }}
      >
        <ProfileStack.Screen 
          name="ProfileMain" 
          component={ProfileScreen} 
          options={{ title: 'Profile', headerShown: false }} 
        />
        <ProfileStack.Screen 
          name="History" 
          component={HistoryScreen} 
          options={{ title: 'History' }} 
        />
        <ProfileStack.Screen 
          name="Vehicle" 
          component={VehicleInfoScreen} 
          options={{ title: 'Vehicle Info' }} 
        />
        <ProfileStack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ title: 'Settings' }} 
        />
      </ProfileStack.Navigator>
    );
  };

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
          } else if (route.name === 'Notifications') {
            return <NotificationButton focused={focused} />;
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
        name="Notifications" 
        component={NotificationScreen}
        options={{
          title: 'Notifications',
        }}
      />
      <MainTab.Screen 
        name="Profile" 
        component={ProfileNavigator}
        options={{
          title: 'Profile',
          headerShown: false,
        }}
      />
    </MainTab.Navigator>
  );
};

// Root Navigator
export const AppNavigator = () => {
  const { user, isAuthenticated, isVerifiedDriver } = useAuthStore();

  // Role-based navigation guard
  const shouldShowDriverApplication = isAuthenticated && user && !user.role.includes('DRIVER');
  const shouldShowDashboard = isAuthenticated && user && user.role.includes('DRIVER');

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
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : shouldShowDriverApplication ? (
          <RootStack.Screen name="DriverApplication" component={DriverApplicationScreen} />
        ) : shouldShowDashboard ? (
          <>
            <RootStack.Screen name="Main" component={MainNavigator} />
            <RootStack.Screen name="VehicleInfo" component={VehicleInfoScreen} />
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}; 