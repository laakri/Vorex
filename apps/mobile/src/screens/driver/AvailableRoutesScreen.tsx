import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../lib/axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList } from '../../navigation/types';

type AvailableRoutesScreenNavigationProp = NativeStackNavigationProp<MainTabParamList>;

interface Route {
  id: string;
  batchId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  driverId: string | null;
  totalDistance: number;
  estimatedDuration: number;
  fromWarehouseId: string | null;
  toWarehouseId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  batch: {
    id: string;
    type: 'LOCAL_PICKUP' | 'LOCAL_DELIVERY' | 'INTERCITY' | 'LOCAL_SELLERS_WAREHOUSE' | 'LOCAL_WAREHOUSE_BUYERS';
    status: 'COLLECTING' | 'READY' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
    totalWeight: number;
    totalVolume: number;
    orderCount: number;
    vehicleType: 'MOTORCYCLE' | 'CAR' | 'VAN' | 'SMALL_TRUCK' | 'LARGE_TRUCK';
    scheduledTime: string | null;
  };
  fromWarehouse?: {
    id: string;
    name: string;
    address: string;
    city: string;
    governorate: string;
  };
  toWarehouse?: {
    id: string;
    name: string;
    address: string;
    city: string;
    governorate: string;
  };
  stops: Array<{
    id: string;
    orderId: string | null;
    warehouseId: string | null;
    address: string;
    latitude: number;
    longitude: number;
    isPickup: boolean;
    isCompleted: boolean;
    sequenceOrder: number;
    estimatedArrival: string | null;
    estimatedDeparture: string | null;
    actualArrival: string | null;
    actualDeparture: string | null;
  }>;
}

const vehicleTypeLabels = {
  MOTORCYCLE: 'Motorcycle',
  CAR: 'Car',
  VAN: 'Van',
  SMALL_TRUCK: 'Small Truck',
  LARGE_TRUCK: 'Large Truck',
};

const batchTypeLabels = {
  LOCAL_PICKUP: 'Local Pickup',
  LOCAL_DELIVERY: 'Local Delivery',
  INTERCITY: 'Intercity',
  LOCAL_SELLERS_WAREHOUSE: 'Seller to Warehouse',
  LOCAL_WAREHOUSE_BUYERS: 'Warehouse to Buyer',
};

export const AvailableRoutesScreen = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('all');
  const [sortBy, setSortBy] = useState('distance');
  const [activeTab, setActiveTab] = useState('all');
  const [acceptingRouteId, setAcceptingRouteId] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const navigation = useNavigation<AvailableRoutesScreenNavigationProp>();

  const fetchRoutes = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await api.get('/delivery-routes/available');
      setRoutes(response.data);
    } catch (err: any) {
      console.error('Failed to fetch routes:', err);
      setError('Could not load available routes. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const filteredRoutes = routes
    .filter(route => {
      // Log each route's status for debugging
      console.log('Route status:', {
        id: route.id,
        status: route.status,
        driverId: route.driverId,
        batchType: route.batch.type
      });

      // Show routes that are PENDING and not assigned to any driver
      const isAvailable = route.status === 'PENDING' && !route.driverId;
      
      if (filterVehicle !== 'all' && route.batch.vehicleType !== filterVehicle) {
        return false;
      }
      
      if (activeTab === 'pending' && route.status !== 'PENDING') return false;
      if (activeTab === 'inProgress' && route.status !== 'IN_PROGRESS') return false;
      if (activeTab === 'completed' && route.status !== 'COMPLETED') return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fromWarehouse = route.fromWarehouse?.name?.toLowerCase() || '';
        const toWarehouse = route.toWarehouse?.name?.toLowerCase() || '';
        const addresses = route.stops.map(s => s.address.toLowerCase()).join(' ');
        const batchType = batchTypeLabels[route.batch.type]?.toLowerCase() || '';
        
        return (
          fromWarehouse.includes(query) || 
          toWarehouse.includes(query) || 
          addresses.includes(query) ||
          batchType.includes(query) ||
          route.id.toLowerCase().includes(query)
        );
      }
      
      return isAvailable;
    })
    .sort((a, b) => {
      if (sortBy === 'distance') {
        return a.totalDistance - b.totalDistance;
      } else if (sortBy === 'duration') {
        return a.estimatedDuration - b.estimatedDuration;
      } else if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'orders') {
        return b.batch.orderCount - a.batch.orderCount;
      }
      return 0;
    });

  // Add logging for filtered routes
  useEffect(() => {
    console.log('Filtered routes:', filteredRoutes.map(r => ({
      id: r.id,
      status: r.status,
      driverId: r.driverId
    })));
  }, [filteredRoutes]);

  const handleAcceptRoute = async (route: Route) => {
    try {
      setAcceptingRouteId(route.id);
      console.log('Attempting to accept route:', {
        routeId: route.id,
        batchId: route.batchId,
        driverId: route.driverId
      });
      
      const response = await api.post(`/delivery-routes/${route.id}/assign`, {
        driverId: route.driverId
      });
      
      console.log('Route acceptance response:', response.data);
      
      Alert.alert('Success', 'Route accepted successfully!');
      
      await fetchRoutes();
      
      setTimeout(() => {
        navigation.navigate('ActiveRoutes');
      }, 500);
      
    } catch (err: any) {
      console.error('Error accepting route:', {
        error: err,
        response: err.response?.data,
        status: err.response?.status,
        message: err.message
      });
      
      let errorMessage = 'Failed to accept route. Please try again.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      Alert.alert(
        'Error',
        errorMessage
      );
    } finally {
      setAcceptingRouteId(null);
    }
  };

  const getRouteDescription = (route: Route) => {
    if (route.batch.type === 'INTERCITY') {
      return `Intercity: ${route.fromWarehouse?.city || 'Origin'} → ${route.toWarehouse?.city || 'Destination'}`;
    } else if (route.batch.type === 'LOCAL_PICKUP' || route.batch.type === 'LOCAL_SELLERS_WAREHOUSE') {
      return `Pickup: ${route.stops.length - 1} stops → ${route.fromWarehouse?.name || 'Warehouse'}`;
    } else {
      return `Delivery: ${route.fromWarehouse?.name || 'Warehouse'} → ${route.stops.length - 1} stops`;
    }
  };

  const stats = {
    pending: routes.filter(r => r.status === 'PENDING').length,
    inProgress: routes.filter(r => r.status === 'IN_PROGRESS').length,
    avgDuration: Math.round(
      routes.reduce((acc, route) => acc + route.estimatedDuration, 0) / (routes.length || 1)
    ),
    uniqueWarehouses: new Set(
      routes.map(r => r.fromWarehouseId)
        .concat(routes.map(r => r.toWarehouseId).filter(Boolean) as string[])
    ).size,
  };

  const RouteDetailsModal = ({ route, onClose, onAccept }: { 
    route: Route; 
    onClose: () => void;
    onAccept: () => void;
  }) => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDetails}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Route Details</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Route Type and Status */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Route Type</Text>
                <Text style={styles.detailValue}>{batchTypeLabels[route.batch.type]}</Text>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={[
                  styles.detailValue,
                  route.status === 'PENDING' && styles.statusPending,
                  route.status === 'IN_PROGRESS' && styles.statusInProgress,
                  route.status === 'COMPLETED' && styles.statusCompleted,
                ]}>
                  {route.status}
                </Text>
              </View>

              {/* Key Metrics */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Key Metrics</Text>
                <View style={styles.metricsGrid}>
                  <View style={styles.metricItem}>
                    <Ionicons name="navigate-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.metricValue}>{route.totalDistance.toFixed(1)} km</Text>
                    <Text style={styles.metricLabel}>Distance</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.metricValue}>{route.estimatedDuration} min</Text>
                    <Text style={styles.metricLabel}>Duration</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Ionicons name="cube-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.metricValue}>{route.batch.orderCount}</Text>
                    <Text style={styles.metricLabel}>Orders</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Ionicons name="car-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.metricValue}>{vehicleTypeLabels[route.batch.vehicleType]}</Text>
                    <Text style={styles.metricLabel}>Vehicle</Text>
                  </View>
                </View>
              </View>

              {/* Route Description */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Route Description</Text>
                <Text style={styles.detailValue}>{getRouteDescription(route)}</Text>
              </View>

              {/* Stops */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Stops ({route.stops.length})</Text>
                {route.stops.map((stop, index) => (
                  <View key={stop.id} style={styles.stopItem}>
                    <View style={styles.stopHeader}>
                      <Text style={styles.stopNumber}>Stop {index + 1}</Text>
                      <Text style={styles.stopType}>
                        {stop.isPickup ? 'Pickup' : 'Delivery'}
                      </Text>
                    </View>
                    <Text style={styles.stopAddress}>{stop.address}</Text>
                    {stop.estimatedArrival && (
                      <Text style={styles.stopTime}>
                        Est. arrival: {new Date(stop.estimatedArrival).toLocaleTimeString()}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.acceptButton]}
                onPress={onAccept}
                disabled={!!acceptingRouteId || route.driverId !== null}
              >
                {acceptingRouteId === route.id ? (
                  <ActivityIndicator size="small" color={colors.foreground} />
                ) : route.driverId !== null ? (
                  <Text style={styles.acceptButtonText}>Already Assigned</Text>
                ) : (
                  <Text style={styles.acceptButtonText}>Accept Route</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchRoutes(true)} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Refresh Routes</Text>
          <TouchableOpacity onPress={() => fetchRoutes(true)}>
            <Ionicons name="refresh-outline" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="cube-outline" size={16} color={colors.primary} />
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="navigate-outline" size={16} color={colors.primary} />
            <Text style={styles.statValue}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={16} color={colors.primary} />
            <Text style={styles.statValue}>{stats.avgDuration} min</Text>
            <Text style={styles.statLabel}>Avg. Duration</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="business-outline" size={16} color={colors.primary} />
            <Text style={styles.statValue}>{stats.uniqueWarehouses}</Text>
            <Text style={styles.statLabel}>Warehouses</Text>
          </View>
        </View>

        {/* Search and Filters */}
        <View style={styles.filterSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search routes, warehouses, addresses..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterButton, activeTab === 'all' && styles.activeFilter]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.filterText, activeTab === 'all' && styles.activeFilterText]}>
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterButton, activeTab === 'pending' && styles.activeFilter]}
              onPress={() => setActiveTab('pending')}
            >
              <Text style={[styles.filterText, activeTab === 'pending' && styles.activeFilterText]}>
                Pending
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterButton, activeTab === 'inProgress' && styles.activeFilter]}
              onPress={() => setActiveTab('inProgress')}
            >
              <Text style={[styles.filterText, activeTab === 'inProgress' && styles.activeFilterText]}>
                In Progress
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterButton, filterVehicle === 'all' && styles.activeFilter]}
              onPress={() => setFilterVehicle('all')}
            >
              <Text style={[styles.filterText, filterVehicle === 'all' && styles.activeFilterText]}>
                All Vehicles
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterButton, filterVehicle === 'MOTORCYCLE' && styles.activeFilter]}
              onPress={() => setFilterVehicle('MOTORCYCLE')}
            >
              <Text style={[styles.filterText, filterVehicle === 'MOTORCYCLE' && styles.activeFilterText]}>
                Motorcycle
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterButton, filterVehicle === 'CAR' && styles.activeFilter]}
              onPress={() => setFilterVehicle('CAR')}
            >
              <Text style={[styles.filterText, filterVehicle === 'CAR' && styles.activeFilterText]}>
                Car
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Routes List */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchRoutes()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredRoutes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="map-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No routes found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || filterVehicle !== 'all' || activeTab !== 'all'
                ? 'Try adjusting your filters to see more results'
                : 'There are no available routes at the moment.'}
            </Text>
          </View>
        ) : (
          <View style={styles.routesList}>
            {filteredRoutes.map((route) => (
              <View key={route.id} style={styles.routeCard}>
                <View style={styles.routeHeader}>
                  <View style={styles.routeTitle}>
                    <Text style={styles.routeType}>{batchTypeLabels[route.batch.type]}</Text>
                    <Text style={styles.routeDescription}>{getRouteDescription(route)}</Text>
                  </View>
                  <View style={styles.routeStatus}>
                    <Text style={[
                      styles.statusText,
                      route.status === 'PENDING' && styles.statusPending,
                      route.status === 'IN_PROGRESS' && styles.statusInProgress,
                      route.status === 'COMPLETED' && styles.statusCompleted,
                    ]}>
                      {route.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.routeDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="navigate-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.detailText}>{route.totalDistance.toFixed(1)} km</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.detailText}>{route.estimatedDuration} min</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="cube-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.detailText}>{route.batch.orderCount} orders</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="car-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.detailText}>{vehicleTypeLabels[route.batch.vehicleType]}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.viewDetailsButton}
                  onPress={() => {
                    setSelectedRoute(route);
                    setShowDetails(true);
                  }}
                >
                  <Text style={styles.viewDetailsButtonText}>View Details</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Route Details Modal */}
      {selectedRoute && (
        <RouteDetailsModal
          route={selectedRoute}
          onClose={() => {
            setShowDetails(false);
            setSelectedRoute(null);
          }}
          onAccept={() => handleAcceptRoute(selectedRoute)}
        />
      )}
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
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  filterSection: {
    padding: 16,
    gap: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: colors.foreground,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.secondary,
  },
  activeFilter: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  activeFilterText: {
    color: colors.foreground,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  routesList: {
    padding: 16,
    gap: 16,
  },
  routeCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  routeTitle: {
    flex: 1,
    gap: 4,
  },
  routeType: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  routeDescription: {
    fontSize: 14,
    color: colors.textMuted,
  },
  routeStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusPending: {
    color: colors.warning,
  },
  statusInProgress: {
    color: colors.info,
  },
  statusCompleted: {
    color: colors.success,
  },
  routeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  viewDetailsButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.secondary,
  },
  cancelButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 24,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
    color: colors.foreground,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  stopItem: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  stopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stopNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  stopType: {
    fontSize: 12,
    color: colors.textMuted,
  },
  stopAddress: {
    fontSize: 14,
    color: colors.foreground,
    marginBottom: 4,
  },
  stopTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  acceptButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
}); 