import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/driver/DashboardScreen';
import { ProfileScreen } from '../screens/driver/ProfileScreen';
import { EarningsScreen } from '../screens/driver/EarningsScreen';
import { HelpScreen } from '../screens/driver/HelpScreen';
import { MainTabParamList } from './types';
import { ActiveRoutesScreen } from '../screens/driver/ActiveRoutesScreen';
import { AvailableRoutesScreen } from '../screens/driver/AvailableRoutesScreen';
import { OrderDetailsScreen } from '../screens/driver/OrderDetailsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Earnings') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'ActiveRoutes') {
            iconName = focused ? 'navigate' : 'navigate-outline';
          } else if (route.name === 'AvailableRoutes') {
            iconName = focused ? 'map' : 'map-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
        },
        headerStyle: {
          backgroundColor: '#0f172a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="ActiveRoutes" component={ActiveRoutesScreen} />
      <Tab.Screen name="AvailableRoutes" component={AvailableRoutesScreen} />
      <Tab.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{
          title: 'Order Details',
          headerShown: true,
        }}
      />
    </Tab.Navigator>
  );
}; 