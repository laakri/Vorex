import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth.store';
import api from '../../lib/axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList } from '../../navigation/types';

type DashboardScreenNavigationProp = NativeStackNavigationProp<MainTabParamList>;

interface DashboardData {
  deliveryMetrics: {
    completed: number;
    earnings: number;
    totalDistance: number;
  };
  vehicleInfo: {
    type: string;
    status: string;
    lastMaintenance: string | null;
    nextMaintenance: string | null;
  };
  earningsData: {
    daily: Array<{
      date: string;
      earnings: number;
      deliveries: number;
    }>;
    byType: Array<{
      name: string;
      count: number;
      percentage: number;
    }>;
  };
  recentDeliveries: Array<{
    id: string;
    route: string;
    packages: number;
    distance: number;
    status: string;
    earnings: string;
    completedAt: string;
  }>;
  performanceStats: {
    rating: number;
    onTimeDelivery: number;
    successRate: number;
  };
}

export const DashboardScreen = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { logout } = useAuthStore();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/drivers/dashboard?timeRange=7d');
      setDashboardData(response.data);
    } catch (err: any) {
      console.error('Dashboard error:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ],
      { cancelable: false }
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchDashboardData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.subtitle}>Here's your performance overview</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{dashboardData?.deliveryMetrics.completed || 0}</Text>
            <Text style={styles.statLabel}>Completed Deliveries</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={24} color={colors.primary} />
            <Text style={styles.statValue}>${dashboardData?.deliveryMetrics.earnings.toFixed(2) || '0.00'}</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="navigate-outline" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{dashboardData?.deliveryMetrics.totalDistance.toFixed(1) || '0.0'} km</Text>
            <Text style={styles.statLabel}>Total Distance</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="star-outline" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{dashboardData?.performanceStats.rating.toFixed(1) || '0.0'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Status</Text>
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleLabel}>Type</Text>
              <Text style={styles.vehicleValue}>{dashboardData?.vehicleInfo.type || 'N/A'}</Text>
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleLabel}>Status</Text>
              <Text style={styles.vehicleValue}>{dashboardData?.vehicleInfo.status || 'N/A'}</Text>
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleLabel}>Next Maintenance</Text>
              <Text style={styles.vehicleValue}>
                {dashboardData?.vehicleInfo.nextMaintenance 
                  ? new Date(dashboardData.vehicleInfo.nextMaintenance).toLocaleDateString()
                  : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Deliveries</Text>
          {dashboardData?.recentDeliveries.map((delivery) => (
            <View key={delivery.id} style={styles.deliveryCard}>
              <View style={styles.deliveryHeader}>
                <Text style={styles.deliveryRoute}>{delivery.route}</Text>
                <Text style={styles.deliveryStatus}>{delivery.status}</Text>
              </View>
              <View style={styles.deliveryDetails}>
                <View style={styles.deliveryInfo}>
                  <Ionicons name="cube-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.deliveryText}>{delivery.packages} packages</Text>
                </View>
                <View style={styles.deliveryInfo}>
                  <Ionicons name="navigate-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.deliveryText}>{delivery.distance.toFixed(1)} km</Text>
                </View>
                <View style={styles.deliveryInfo}>
                  <Ionicons name="cash-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.deliveryText}>${delivery.earnings}</Text>
                </View>
              </View>
              <Text style={styles.deliveryTime}>
                {new Date(delivery.completedAt).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceValue}>{dashboardData?.performanceStats.onTimeDelivery || 0}%</Text>
              <Text style={styles.performanceLabel}>On-time Delivery</Text>
            </View>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceValue}>{dashboardData?.performanceStats.successRate || 0}%</Text>
              <Text style={styles.performanceLabel}>Success Rate</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('ActiveRoutes')}
          >
            <Ionicons name="navigate" size={24} color={colors.foreground} />
            <Text style={styles.actionText}>Start Delivery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Earnings')}
          >
            <Ionicons name="wallet-outline" size={24} color="#fff" />
            <Text style={styles.quickActionText}>Earnings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="help-circle-outline" size={24} color="#fff" />
            <Text style={styles.quickActionText}>Help</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
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
  welcomeSection: {
    padding: 16,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 12,
  },
  vehicleCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  vehicleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  vehicleValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  deliveryCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryRoute: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  deliveryStatus: {
    fontSize: 14,
    color: colors.success,
  },
  deliveryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deliveryText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  deliveryTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  performanceGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  performanceCard: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  performanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  performanceLabel: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    color: colors.foreground,
    textAlign: 'center',
  },
  quickActionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: colors.foreground,
    textAlign: 'center',
  },
}); 