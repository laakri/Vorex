import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import api from '../../lib/axios';
import { format } from 'date-fns';

type OrderDetailsScreenNavigationProp = NativeStackNavigationProp<MainTabParamList>;

interface OrderTrackingData {
  orderId: string;
  status: string;
  statusDescription: string;
  statusCategory: string;
  createdAt: string;
  updatedAt: string;
  customerInfo: {
    name: string;
    email: string;
    address: string;
    city: string;
    governorate: string;
    postalCode: string;
    phone: string;
  };
  sellerInfo: {
    businessName: string;
    city: string;
    governorate: string;
    phone: string;
    address: string;
  };
  currentLocation: {
    type: string;
    businessName: string;
    city: string;
    governorate: string;
  };
  estimatedDelivery: string;
  timeline: {
    status: string;
    timestamp: string;
    description: string;
  }[];
  itemsSummary: {
    name: string;
    quantity: number;
  }[];
  deliveryProgress: number;
  routeStops: {
    id: string;
    address: string;
    latitude: number;
    longitude: number;
    isPickup: boolean;
    sequenceOrder: number;
    isCompleted: boolean;
    completedAt: string | null;
    notes: string | null;
  }[];
  totalAmount: number;
  notes: string;
  batchInfo: {
    id: string;
    status: string;
    driver: {
      name: string;
      phone: string;
      rating: number;
      totalDeliveries: number;
      licenseType: string;
      status: string;
      vehicle: {
        type: string;
        model: string;
        make: string;
        plateNumber: string;
        year: number;
        capacity: number;
        status: string;
      };
    };
    routeInfo: {
      status: string;
      startedAt: string;
      completedAt: string | null;
      estimatedDuration: number;
      totalDistance: number;
      stops: any[];
    };
  };
  warehouseInfo: {
    name: string;
    address: string;
    city: string;
    governorate: string;
    phone: string;
    location: string;
  };
  isLocalDelivery: boolean;
}

export const OrderDetailsScreen = () => {
  const navigation = useNavigation<OrderDetailsScreenNavigationProp>();
  const route = useRoute();
  const { orderId } = route.params as { orderId: string };
  
  const [orderData, setOrderData] = useState<OrderTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderData();
  }, [orderId]);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/track/${orderId}`);
      setOrderData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching order data:', err);
      setError('Failed to load order details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatEstimatedDelivery = () => {
    if (!orderData?.estimatedDelivery) return 'Not available';
    
    const estimatedDate = new Date(orderData.estimatedDelivery);
    const today = new Date();
    
    if (estimatedDate.toDateString() === today.toDateString()) {
      return `Today, ${format(estimatedDate, 'h:mm a')}`;
    }
    
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    if (estimatedDate.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${format(estimatedDate, 'h:mm a')}`;
    }
    
    return `${format(estimatedDate, 'MMM d, yyyy')}, ${format(estimatedDate, 'h:mm a')}`;
  };

  const getStatusColor = () => {
    const category = orderData?.statusCategory;
    
    switch (category) {
      case 'PICKUP':
        return colors.warning;
      case 'TRANSIT':
        return colors.info;
      case 'DELIVERED':
        return colors.success;
      case 'DELAYED':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !orderData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error || 'Order information not found'}</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.foreground} />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Order Tracking</Text>
          <Text style={styles.orderId}>ID: {orderData.orderId}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Estimated Delivery Banner */}
        <View style={styles.deliveryBanner}>
          <View style={styles.deliveryInfo}>
            <View style={styles.calendarIcon}>
              <Ionicons name="calendar-outline" size={24} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.deliveryLabel}>Estimated Delivery</Text>
              <Text style={styles.deliveryTime}>{formatEstimatedDelivery()}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {orderData.status.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        {/* Delivery Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Delivery Progress</Text>
            <Text style={styles.progressPercentage}>{orderData.deliveryProgress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${orderData.deliveryProgress}%` }
              ]} 
            />
          </View>
        </View>

        {/* Current Location */}
        <View style={styles.locationSection}>
          <Text style={styles.sectionTitle}>Current Location</Text>
          <View style={styles.locationCard}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>
                {orderData.currentLocation.businessName || 'In Transit'}
              </Text>
              <Text style={styles.locationAddress}>
                {orderData.currentLocation.city}, {orderData.currentLocation.governorate}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{orderData.customerInfo.name}</Text>
            
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{orderData.customerInfo.phone}</Text>
            
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{orderData.customerInfo.address}</Text>
            <Text style={styles.infoValue}>
              {orderData.customerInfo.city}, {orderData.customerInfo.governorate}
            </Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <View style={styles.itemsCard}>
            {orderData.itemsSummary.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Timeline</Text>
          <View style={styles.timelineCard}>
            {orderData.timeline.map((event, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStatus}>{event.status}</Text>
                  <Text style={styles.timelineTime}>
                    {format(new Date(event.timestamp), 'MMM d, h:mm a')}
                  </Text>
                  <Text style={styles.timelineDescription}>{event.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textMuted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  orderId: {
    fontSize: 14,
    color: colors.textMuted,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    color: colors.foreground,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  deliveryBanner: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deliveryLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  deliveryTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressSection: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.secondary,
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    color: colors.textMuted,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.secondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  locationSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 12,
  },
  locationCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    alignItems: 'center',
  },
  locationInfo: {
    marginLeft: 12,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.foreground,
  },
  locationAddress: {
    fontSize: 14,
    color: colors.textMuted,
  },
  section: {
    margin: 16,
  },
  infoCard: {
    padding: 16,
    backgroundColor: colors.secondary,
    borderRadius: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: colors.foreground,
    marginBottom: 12,
  },
  itemsCard: {
    padding: 16,
    backgroundColor: colors.secondary,
    borderRadius: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  itemName: {
    fontSize: 16,
    color: colors.foreground,
  },
  itemQuantity: {
    fontSize: 16,
    color: colors.textMuted,
  },
  timelineCard: {
    padding: 16,
    backgroundColor: colors.secondary,
    borderRadius: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginRight: 12,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatus: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.foreground,
  },
  timelineTime: {
    fontSize: 14,
    color: colors.textMuted,
    marginVertical: 4,
  },
  timelineDescription: {
    fontSize: 14,
    color: colors.textMuted,
  },
}); 