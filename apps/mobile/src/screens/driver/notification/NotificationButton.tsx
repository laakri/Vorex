import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { getNotificationCount } from './notificationApi';
import { useNavigation } from '@react-navigation/native';

interface NotificationButtonProps {
  focused: boolean;
}

export const NotificationButton: React.FC<NotificationButtonProps> = ({ focused }) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const navigation = useNavigation();

  useEffect(() => {
    let mounted = true;

    const fetchCount = async () => {
      try {
        const { data } = await getNotificationCount();
        if (mounted) {
          setNotificationCount(data.count);
        }
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };

    fetchCount();
    
    // Set up a refresh interval
    const interval = setInterval(fetchCount, 30000); // Refresh every 30 seconds

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('Notifications' as never)}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={focused ? 'notifications' : 'notifications-outline'}
          size={24}
          color={focused ? colors.primary : colors.foreground}
        />
        {notificationCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {notificationCount > 99 ? '99+' : notificationCount}
            </Text>
          </View>
        )}
      </View>
      <Text style={[
        styles.label,
        focused && styles.focusedLabel
      ]}>
        Notifications
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: colors.destructive,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 12,
    color: colors.foreground,
    marginTop: 4,
  },
  focusedLabel: {
    color: colors.primary,
    fontWeight: '500',
  },
}); 