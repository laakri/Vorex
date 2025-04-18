import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';

interface NotificationButtonProps {
  focused: boolean;
  unreadCount?: number;
}

export const NotificationButton: React.FC<NotificationButtonProps> = ({ focused, unreadCount = 0 }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons
        name={focused ? 'notifications' : 'notifications-outline'}
        size={24}
        color={focused ? colors.primary : colors.text}
      />
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
}); 