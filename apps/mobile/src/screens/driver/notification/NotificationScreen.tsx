import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { Notification } from './notification-types';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from './notificationApi';

export const NotificationScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await getNotifications({ includeRead: true });
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <Ionicons name="checkmark-circle" size={24} color={colors.success} />;
      case 'WARNING':
        return <Ionicons name="warning" size={24} color={colors.warning} />;
      case 'ERROR':
        return <Ionicons name="alert-circle" size={24} color={colors.destructive} />;
      default:
        return <Ionicons name="information-circle" size={24} color={colors.primary} />;
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <View style={[
      styles.notificationCard,
      !item.isRead && styles.unreadCard
    ]}>
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIcon}>
          {getNotificationIcon(item.type)}
        </View>
        <View style={styles.notificationInfo}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationTime}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
        {!item.isRead && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>NEW</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.notificationMessage}>{item.message}</Text>
      
      <View style={styles.notificationActions}>
        {!item.isRead && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleMarkAsRead(item.id)}
          >
            <Ionicons name="checkmark" size={18} color={colors.primary} />
            <Text style={styles.actionButtonText}>Mark as Read</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => {
            Alert.alert(
              'Delete Notification',
              'Are you sure you want to delete this notification?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => handleDelete(item.id)
                }
              ]
            );
          }}
        >
          <Ionicons name="trash" size={18} color={colors.foreground} />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off" size={64} color={colors.muted} />
      <Text style={styles.emptyStateTitle}>No Notifications</Text>
      <Text style={styles.emptyStateText}>
        You don't have any notifications at the moment.
      </Text>
    </View>
  );

  if (loading && !notifications.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {notifications.some(n => !n.isRead) && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllButtonText}>Mark All as Read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  markAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.secondary,
    borderRadius: 8,
  },
  markAllButtonText: {
    fontSize: 14,
    color: colors.foreground,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unreadCard: {
    backgroundColor: `${colors.card}10`,
    borderColor: `${colors.card}`,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  notificationIcon: {
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.muted,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.foreground,
    marginBottom: 12,
    lineHeight: 20,
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: `${colors.destructive}10`,
  },
  deleteButtonText: {
    color: colors.foreground,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.foreground,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
}); 