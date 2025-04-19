import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../lib/axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList } from '../../navigation/types';
import { RouteMapNavigation } from '../../components/RouteMapNavigation';

// Replace date-fns with custom formatter
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  
  return `${month} ${day}, ${formattedHours}:${minutes} ${ampm}`;
};

type ActiveRoutesScreenNavigationProp = NativeStackNavigationProp<MainTabParamList>;

interface Order {
  id: string;
  status: string;
  customerName: string;
  phone: string;
  totalAmount: number;
  notes?: string;
}

interface Warehouse {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}

interface RouteStop {
  id: string;
  routeId: string;
  orderId?: string;
  warehouseId?: string;
  latitude: number;
  longitude: number;
  address: string;
  isPickup: boolean;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
  sequenceOrder: number;
  createdAt: string;
  updatedAt: string;
  order?: Order;
  warehouse?: Warehouse;
}

interface Batch {
  id: string;
  type: string;
  status: string;
  orderCount: number;
  totalWeight: number;
  totalVolume: number;
  vehicleType: string;
}

interface DeliveryRoute {
  id: string;
  status: string;
  driverId: string;
  batchId?: string;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  startedAt?: string;
  completedAt?: string;
  batch?: Batch;
  stops: RouteStop[];
  fromWarehouse?: Warehouse;
  toWarehouse?: Warehouse;
}

export const ActiveRoutesScreen = () => {
  const [activeRoute, setActiveRoute] = useState<DeliveryRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isMapVisible, setIsMapVisible] = useState(false);
  const navigation = useNavigation<ActiveRoutesScreenNavigationProp>();

  const fetchActiveRoute = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/delivery-routes/driver/active');
      console.log('Fetched active route:', response.data);
      setActiveRoute(response.data);
    } catch (error) {
      console.error('Failed to fetch active route:', error);
      Alert.alert('Error', 'Could not load your active delivery route');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Add polling effect
  useEffect(() => {
    const POLLING_INTERVAL = 30000; // 30 seconds

    // Initial fetch
    fetchActiveRoute();

    // Set up polling
    const pollingInterval = setInterval(fetchActiveRoute, POLLING_INTERVAL);

    // Cleanup
    return () => clearInterval(pollingInterval);
  }, [fetchActiveRoute]);

  // Add focus listener
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Screen focused, refreshing data...');
      fetchActiveRoute();
    });

    return unsubscribe;
  }, [navigation, fetchActiveRoute]);

  const refreshData = useCallback(() => {
    console.log('Manual refresh triggered');
    setRefreshing(true);
    fetchActiveRoute();
  }, [fetchActiveRoute]);

  const startNavigation = (stop: RouteStop) => {
    setSelectedStop(stop);
    setIsMapVisible(true);
  };

  const handleCompleteStop = (stop: RouteStop) => {
    setSelectedStop(stop);
    setNotes('');
    setIsCompleteDialogOpen(true);
  };

  const completeStop = async () => {
    if (!selectedStop) return;

    try {
      await api.patch(`/delivery-routes/stops/${selectedStop.id}/complete`, {
        notes: notes.trim() || undefined,
      });

      Alert.alert('Success', 'The stop has been marked as completed');
      setIsCompleteDialogOpen(false);
      fetchActiveRoute();
    } catch (error) {
      console.error('Error completing stop:', error);
      Alert.alert('Error', 'Failed to complete the stop');
    }
  };

  const completeRoute = async () => {
    if (!activeRoute) return;

    try {
      await api.patch(`/delivery-routes/${activeRoute.id}/complete`);
      Alert.alert('Success', 'The delivery route has been marked as completed');
      navigation.navigate('AvailableRoutes');
    } catch (error) {
      console.error('Error completing route:', error);
      Alert.alert('Error', 'Failed to complete the route');
    }
  };

  // Filter stops for pending and completed tabs
  const pendingStops = activeRoute?.stops?.filter((stop) => !stop.isCompleted) || [];
  const completedStops = activeRoute?.stops?.filter((stop) => stop.isCompleted) || [];

  // Calculate progress percentage
  const progressPercentage = activeRoute?.stops?.length
    ? Math.round((completedStops.length / activeRoute.stops.length) * 100)
    : 0;

  // Get next stop
  const nextStop = pendingStops.length > 0 ? pendingStops[0] : null;

  const handleDeliveryPress = (delivery: any) => {
    navigation.navigate('OrderDetails', { orderId: delivery.id });
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your active delivery...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activeRoute) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No active delivery found</Text>
          <Text style={styles.emptyText}>
            You don't have any active delivery routes at the moment.
          </Text>
          <TouchableOpacity
            style={styles.findRoutesButton}
            onPress={() => navigation.navigate('AvailableRoutes')}
          >
            <Text style={styles.findRoutesButtonText}>Find Available Routes</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshData} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Active Delivery</Text>
            <Text style={styles.subtitle}>Route #{activeRoute.id.slice(-8)}</Text>
          </View>
          <TouchableOpacity onPress={refreshData} disabled={refreshing}>
            <Ionicons
              name="refresh-outline"
              size={24}
              color={refreshing ? colors.textMuted : colors.foreground}
            />
          </TouchableOpacity>
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Delivery Progress</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressText}>
                {completedStops.length} of {activeRoute.stops.length} stops completed
              </Text>
              <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercentage}%` },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Route Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Ionicons name="cube-outline" size={20} color={colors.textMuted} />
            <Text style={styles.detailText}>
              {activeRoute.batch?.orderCount || 0} orders
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="scale-outline" size={20} color={colors.textMuted} />
            <Text style={styles.detailText}>
              {activeRoute.batch?.totalWeight || 0} kg
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color={colors.textMuted} />
            <Text style={styles.detailText}>
              {activeRoute.startedAt
                ? formatDate(activeRoute.startedAt)
                : 'Not started'}
            </Text>
          </View>
        </View>

        {/* Next Stop */}
        {nextStop && (
          <View style={styles.nextStopSection}>
            <Text style={styles.sectionTitle}>Next Stop</Text>
            <View style={styles.nextStopCard}>
              <View style={styles.nextStopHeader}>
                <View style={styles.nextStopType}>
                  <Ionicons
                    name={nextStop.isPickup ? 'arrow-down' : 'arrow-up'}
                    size={16}
                    color={colors.foreground}
                  />
                  <Text style={styles.nextStopTypeText}>
                    {nextStop.isPickup ? 'Pickup' : 'Delivery'}
                  </Text>
                </View>
                <Text style={styles.nextStopAddress}>{nextStop.address}</Text>
              </View>

              {nextStop.order && (
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>
                    {nextStop.order.customerName}
                  </Text>
                  <Text style={styles.customerPhone}>{nextStop.order.phone}</Text>
                  {nextStop.order.notes && (
                    <Text style={styles.customerNotes}>{nextStop.order.notes}</Text>
                  )}
                </View>
              )}

              <View style={styles.nextStopActions}>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => startNavigation(nextStop)}
                >
                  <Ionicons name="navigate-outline" size={20} color={colors.foreground} />
                  <Text style={styles.actionButtonText}>Navigate</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.completeButton]}
                  onPress={() => handleCompleteStop(nextStop)}
                >
                  <Ionicons name="checkmark-outline" size={20} color={colors.foreground} />
                  <Text style={styles.actionButtonText}>Complete</Text>
                </TouchableOpacity>
                
              </View>
            </View>
          </View>
        )}

        {/* Stops List */}
        <View style={styles.stopsSection}>
          <Text style={styles.sectionTitle}>Route Stops</Text>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
              onPress={() => setActiveTab('pending')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'pending' && styles.activeTabText,
                ]}
              >
                Pending ({pendingStops.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
              onPress={() => setActiveTab('completed')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'completed' && styles.activeTabText,
                ]}
              >
                Completed ({completedStops.length})
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'pending' ? (
            pendingStops.length === 0 ? (
              <View style={styles.emptyStopsContainer}>
                <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
                <Text style={styles.emptyStopsTitle}>All stops completed</Text>
                <Text style={styles.emptyText}>
                  You've completed all stops in this route. You can now complete the entire route.
                </Text>
                <TouchableOpacity
                  style={styles.completeRouteButton}
                  onPress={completeRoute}
                >
                  <Text style={styles.completeRouteButtonText}>Complete Route</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.stopsList}>
                {pendingStops.map((stop, index) => (
                  <View key={stop.id} style={styles.stopCard}>
                    <View style={styles.stopHeader}>
                      <View style={styles.stopType}>
                        <Ionicons
                          name={stop.isPickup ? 'arrow-down' : 'arrow-up'}
                          size={16}
                          color={colors.foreground}
                        />
                        <Text style={styles.stopTypeText}>
                          {stop.isPickup ? 'Pickup' : 'Delivery'}
                        </Text>
                        {index === 0 && (
                          <View style={styles.nextBadge}>
                            <Text style={styles.nextBadgeText}>Next</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.stopAddress}>{stop.address}</Text>
                    </View>

                    {stop.order && (
                      <View style={styles.stopCustomerInfo}>
                        <Text style={styles.stopCustomerName}>
                          {stop.order.customerName}
                        </Text>
                        {stop.order.phone && (
                          <Text style={styles.stopCustomerPhone}>
                            {stop.order.phone}
                          </Text>
                        )}
                        {stop.order.notes && (
                          <Text style={styles.stopCustomerNotes}>
                            {stop.order.notes}
                          </Text>
                        )}
                      </View>
                    )}

                    <View style={styles.stopActions}>
                      <TouchableOpacity
                        style={styles.stopActionButton}
                        onPress={() => startNavigation(stop)}
                      >
                        <Ionicons name="navigate-outline" size={20} color={colors.foreground} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.stopActionButton, styles.completeStopButton]}
                        onPress={() => handleCompleteStop(stop)}
                      >
                        <Ionicons name="checkmark-outline" size={20} color={colors.foreground} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )
          ) : (
            <View style={styles.stopsList}>
              {completedStops.length === 0 ? (
                <View style={styles.emptyStopsContainer}>
                  <Text style={styles.emptyText}>No stops completed yet</Text>
                </View>
              ) : (
                completedStops.map((stop) => (
                  <View key={stop.id} style={styles.stopCard}>
                    <View style={styles.stopHeader}>
                      <View style={styles.stopType}>
                        <Ionicons
                          name={stop.isPickup ? 'arrow-down' : 'arrow-up'}
                          size={16}
                          color={colors.foreground}
                        />
                        <Text style={styles.stopTypeText}>
                          {stop.isPickup ? 'Pickup' : 'Delivery'}
                        </Text>
                      </View>
                      <Text style={styles.stopAddress}>{stop.address}</Text>
                    </View>

                    {stop.completedAt && (
                      <Text style={styles.completedTime}>
                        Completed {formatDate(stop.completedAt)}
                      </Text>
                    )}

                    {stop.order && (
                      <Text style={styles.stopCustomerName}>
                        {stop.order.customerName}
                      </Text>
                    )}

                    {stop.notes && (
                      <Text style={styles.stopNotes}>{stop.notes}</Text>
                    )}
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Complete Stop Dialog */}
      <Modal
        visible={isCompleteDialogOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCompleteDialogOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedStop?.isPickup
                ? 'Confirm Pickup Completion'
                : 'Confirm Delivery Completion'}
            </Text>
            <Text style={styles.modalDescription}>
              Mark this stop as completed in your route
            </Text>

            <View style={styles.modalInfoContainer}>
              <Text style={styles.modalInfoLabel}>Address:</Text>
              <Text style={styles.modalInfoText}>{selectedStop?.address}</Text>

              {selectedStop?.order && (
                <View style={styles.modalCustomerInfo}>
                  <Text style={styles.modalInfoLabel}>Customer:</Text>
                  <Text style={styles.modalInfoText}>
                    {selectedStop?.order.customerName}
                  </Text>
                </View>
              )}
            </View>

            <TextInput
              style={styles.notesInput}
              placeholder="Add notes about this stop (optional)"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setIsCompleteDialogOpen(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={completeStop}
              >
                <Ionicons name="checkmark-outline" size={20} color={colors.foreground} />
                <Text style={styles.modalConfirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <RouteMapNavigation
        visible={isMapVisible}
        onClose={() => setIsMapVisible(false)}
        nextStop={selectedStop ? {
          latitude: selectedStop.latitude,
          longitude: selectedStop.longitude,
          address: selectedStop.address,
          isPickup: selectedStop.isPickup,
        } : null}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.foreground,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
  findRoutesButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  findRoutesButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
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
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  progressSection: {
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  progressContainer: {
    gap: 8,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  detailsSection: {
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 16,
    color: colors.foreground,
  },
  nextStopSection: {
    padding: 16,
    gap: 16,
  },
  nextStopCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  nextStopHeader: {
    gap: 8,
  },
  nextStopType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextStopTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  nextStopAddress: {
    fontSize: 16,
    color: colors.foreground,
  },
  customerInfo: {
    gap: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.foreground,
  },
  customerPhone: {
    fontSize: 14,
    color: colors.textMuted,
  },
  customerNotes: {
    fontSize: 14,
    color: colors.textMuted,
    backgroundColor: colors.border,
    padding: 8,
    borderRadius: 4,
  },
  nextStopActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
  },
  completeButton: {
    backgroundColor: colors.success,
  },
  actionButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  viewButton: {
    backgroundColor: colors.accent,
  },
  viewButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  stopsSection: {
    padding: 16,
    gap: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  tabText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  activeTabText: {
    color: colors.foreground,
    fontWeight: '500',
  },
  stopsList: {
    gap: 12,
  },
  stopCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  stopHeader: {
    gap: 8,
  },
  stopType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stopTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  nextBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  nextBadgeText: {
    fontSize: 12,
    color: colors.foreground,
    fontWeight: '500',
  },
  stopAddress: {
    fontSize: 16,
    color: colors.foreground,
  },
  stopCustomerInfo: {
    gap: 8,
  },
  stopCustomerName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.foreground,
  },
  stopCustomerPhone: {
    fontSize: 14,
    color: colors.textMuted,
  },
  stopCustomerNotes: {
    fontSize: 14,
    color: colors.textMuted,
    backgroundColor: colors.border,
    padding: 8,
    borderRadius: 4,
  },
  stopActions: {
    flexDirection: 'row',
    gap: 12,
  },
  stopActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    borderRadius: 8,
  },
  completeStopButton: {
    backgroundColor: colors.success,
  },
  completedTime: {
    fontSize: 14,
    color: colors.textMuted,
  },
  stopNotes: {
    fontSize: 14,
    color: colors.textMuted,
    backgroundColor: colors.border,
    padding: 8,
    borderRadius: 4,
  },
  emptyStopsContainer: {
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  emptyStopsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  completeRouteButton: {
    backgroundColor: colors.success,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  completeRouteButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: 24,
  },
  modalInfoContainer: {
    gap: 16,
    marginBottom: 24,
  },
  modalInfoLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  modalInfoText: {
    fontSize: 16,
    color: colors.foreground,
  },
  modalCustomerInfo: {
    marginTop: 8,
  },
  notesInput: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 12,
    color: colors.foreground,
    fontSize: 16,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalCancelButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalConfirmButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
}); 