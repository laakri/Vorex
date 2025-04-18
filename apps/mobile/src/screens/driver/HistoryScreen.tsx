import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../lib/axios';

// Match the web version's interfaces
interface RouteStop {
  id: string;
  address: string;
  isPickup: boolean;
  isCompleted: boolean;
  completedAt?: string;
}

interface DeliveryRoute {
  id: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
  totalDistance: number;
  estimatedDuration: number;
  stops: RouteStop[];
  batch?: {
    id: string;
    type: string;
    orderCount: number;
  }
  createdAt: string;
}

export const HistoryScreen = () => {
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setIsLoading(true);
      // Use the correct endpoint from web version
      const response = await api.get('/delivery-routes/driver');
      setRoutes(response.data);
    } catch (err) {
      console.error('Failed to load routes:', err);
      setError('Failed to load delivery history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return styles.statusCompleted;
      case 'IN_PROGRESS':
        return styles.statusInProgress;
      case 'FAILED':
        return styles.statusFailed;
      default:
        return styles.statusPending;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle" size={48} color={colors.destructive} />
          <Text style={styles.errorTitle}>Error Loading History</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchRoutes}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Delivery History</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{routes.length}</Text>
              <Text style={styles.statLabel}>Total Routes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {routes.filter(route => route.status === 'COMPLETED').length}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {routes.reduce((total, route) => total + (route.totalDistance || 0), 0).toFixed(1)} km
              </Text>
              <Text style={styles.statLabel}>Total Distance</Text>
            </View>
          </View>
        </View>

        {routes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyStateTitle}>No History Found</Text>
            <Text style={styles.emptyStateText}>
              Your completed deliveries will appear here
            </Text>
          </View>
        ) : (
          routes.map((route) => (
            <View key={route.id} style={styles.routeCard}>
              <View style={styles.routeHeader}>
                <View style={styles.routeIdContainer}>
                  <Text style={styles.routeId}>Route #{route.id.substring(0, 8)}</Text>
                  <View style={[styles.statusBadge, getStatusBadgeStyle(route.status)]}>
                    <Text style={styles.statusText}>
                      {route.status}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.routeMetadata}>
                  <View style={styles.metadataItem}>
                    <Ionicons name="calendar-outline" size={14} color={colors.muted} />
                    <Text style={styles.metadataText}>
                      {formatDate(route.completedAt || route.startedAt || route.createdAt)}
                    </Text>
                  </View>
                  
                  <View style={styles.metadataItem}>
                    <Ionicons name="navigate-outline" size={14} color={colors.muted} />
                    <Text style={styles.metadataText}>
                      {route.totalDistance?.toFixed(1) || '?'} km
                    </Text>
                  </View>
                  
                  <View style={styles.metadataItem}>
                    <Ionicons name="time-outline" size={14} color={colors.muted} />
                    <Text style={styles.metadataText}>
                      {formatDuration(route.estimatedDuration)}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.separator} />
              
              <View style={styles.stopsContainer}>
                {route.stops.slice(0, 2).map((stop) => (
                  <View key={stop.id} style={styles.stopItem}>
                    <View style={[
                      styles.stopStatusIndicator,
                      stop.isCompleted ? styles.stopCompleted : styles.stopPending
                    ]}>
                      {stop.isCompleted ? (
                        <Ionicons name="checkmark" size={12} color={colors.success} />
                      ) : (
                        <Ionicons name="time-outline" size={12} color={colors.muted} />
                      )}
                    </View>
                    <View style={styles.stopDetails}>
                      <View style={styles.stopTypeContainer}>
                        <View style={[
                          styles.stopTypeBadge,
                          stop.isPickup ? styles.pickupBadge : styles.deliveryBadge
                        ]}>
                          <Text style={[
                            styles.stopTypeText,
                            stop.isPickup ? styles.pickupText : styles.deliveryText
                          ]}>
                            {stop.isPickup ? 'Pickup' : 'Delivery'}
                          </Text>
                        </View>
                        {stop.completedAt && (
                          <Text style={styles.completedTime}>
                            {new Date(stop.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </Text>
                        )}
                      </View>
                      <View style={styles.addressContainer}>
                        <Ionicons name="location-outline" size={12} color={colors.muted} />
                        <Text style={styles.addressText} numberOfLines={1}>
                          {stop.address}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
                
                {route.stops.length > 2 && (
                  <View style={styles.moreStopsIndicator}>
                    <Text style={styles.moreStopsText}>
                      +{route.stops.length - 2} more stops
                    </Text>
                  </View>
                )}
              </View>
              
              {route.status === 'COMPLETED' && route.completedAt && (
                <View style={styles.completionInfo}>
                  <View style={styles.completionDateContainer}>
                    <View style={styles.dateCircle}>
                      <Text style={styles.dateCircleText}>
                        {new Date(route.completedAt).getDate()}
                      </Text>
                    </View>
                    <Text style={styles.completionDateText}>
                      Completed on {new Date(route.completedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: 16,
  },
  errorText: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
    marginHorizontal: 20,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.foreground,
    fontWeight: '600',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  statLabel: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: 16,
  },
  emptyStateText: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
  },
  routeCard: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  routeHeader: {
    padding: 16,
  },
  routeIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  routeId: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.4)',
    borderColor: 'rgba(34, 197, 94, 0.8)',
  },
  statusInProgress: {
    backgroundColor: 'rgba(59, 130, 246, 0.4)',
    borderColor: 'rgba(59, 130, 246, 0.8)',
  },
  statusFailed: {
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
    borderColor: 'rgba(239, 68, 68, 0.8)',
  },
  statusPending: {
    backgroundColor: 'rgba(100, 116, 139, 0.4)',
    borderColor: 'rgba(100, 116, 139, 0.8)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  routeMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 4,
  },
  metadataText: {
    fontSize: 13,
    color: colors.muted,
    marginLeft: 4,
  },
  separator: {
    height: 1,
    backgroundColor: colors.muted,
    opacity: 0.2,
    marginHorizontal: 16,
  },
  stopsContainer: {
    padding: 16,
  },
  stopItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stopStatusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  stopCompleted: {
    backgroundColor: `${colors.success}20`,
  },
  stopPending: {
    backgroundColor: colors.muted,
    opacity: 0.3,
  },
  stopDetails: {
    flex: 1,
  },
  stopTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stopTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  pickupBadge: {
    backgroundColor: `rgba(245, 158, 11, 0.2)`,
    borderWidth: 1,
    borderColor: `rgba(245, 158, 11, 0.3)`,
  },
  deliveryBadge: {
    backgroundColor: `rgba(59, 130, 246, 0.2)`,
    borderWidth: 1,
    borderColor: `rgba(59, 130, 246, 0.3)`,
  },
  stopTypeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  pickupText: {
    color: '#b45309',
  },
  deliveryText: {
    color: '#1d4ed8',
  },
  completedTime: {
    fontSize: 11,
    color: colors.muted,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 12,
    color: colors.muted,
    marginLeft: 4,
    flex: 1,
  },
  moreStopsIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: colors.muted,
    opacity: 0.2,
    borderRadius: 4,
    marginTop: 8,
  },
  moreStopsText: {
    fontSize: 12,
    color: colors.muted,
  },
  completionInfo: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.muted,
    borderStyle: 'dashed',
    opacity: 0.3,
  },
  completionDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  dateCircleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  completionDateText: {
    fontSize: 13,
    color: colors.foreground,
  },
}); 