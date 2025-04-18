import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  StyleSheet,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../lib/axios';
import { formatCurrency } from '../../utils/format';

interface Earning {
  id: string;
  orderId: string;
  routeId: string;
  batchId: string;
  baseAmount: number;
  bonusAmount: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  order: {
    id: string;
    status: string;
    createdAt: string;
    isLocalDelivery: boolean;
  };
  route: {
    id: string;
    status: string;
    totalDistance: number;
  };
}

interface EarningsByStatus {
  status: string;
  count: number;
  amount: number;
}

interface EarningsByType {
  type: string;
  count: number;
  amount: number;
}

export const EarningsScreen = () => {
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/drivers/earnings?timeRange=${timeRange}&status=${filterStatus}`);
        setData(response.data);
      } catch (err) {
        setError('Failed to load earnings data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEarnings();
  }, [timeRange, filterStatus]);

  const { 
    earnings = [], 
    summary = {
      totalEarnings: 0,
      baseAmount: 0,
      bonusAmount: 0,
      pendingAmount: 0,
      paidAmount: 0,
      earningsByStatus: [],
      earningsByType: [],
    }
  } = data || {};

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
          <Text style={styles.errorTitle}>Error Loading Earnings</Text>
          <Text style={styles.errorText}>
            There was an error loading your earnings data. Please try again later.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Driver Earnings</Text>
          <Text style={styles.subtitle}>
            Track your earnings and payment status
          </Text>
        </View>

        <View style={styles.timeRangeContainer}>
          <TouchableOpacity 
            style={styles.timeRangeButton}
            onPress={() => setTimeRange('7d')}
          >
            <Ionicons name="calendar" size={16} color={colors.foreground} />
            <Text style={styles.timeRangeText}>Last 7 days</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.timeRangeButton}
            onPress={() => setTimeRange('30d')}
          >
            <Ionicons name="calendar" size={16} color={colors.foreground} />
            <Text style={styles.timeRangeText}>Last 30 days</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Total Earnings</Text>
              <Ionicons name="wallet" size={16} color={colors.muted} />
            </View>
            <Text style={styles.statValue}>
              {formatCurrency(summary.totalEarnings)}
            </Text>
            <Text style={styles.statSubtext}>
              From {earnings.length} deliveries
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Base Amount</Text>
              <Ionicons name="checkmark-circle" size={16} color={colors.muted} />
            </View>
            <Text style={styles.statValue}>
              {formatCurrency(summary.baseAmount)}
            </Text>
            <Text style={styles.statSubtext}>
              {((summary.baseAmount / summary.totalEarnings) * 100).toFixed(0)}% of total
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Bonus Amount</Text>
              <Ionicons name="gift" size={16} color={colors.muted} />
            </View>
            <Text style={styles.statValue}>
              {formatCurrency(summary.bonusAmount)}
            </Text>
            <Text style={styles.statSubtext}>
              {((summary.bonusAmount / summary.totalEarnings) * 100).toFixed(0)}% of total
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Pending Payment</Text>
              <Ionicons name="time" size={16} color={colors.muted} />
            </View>
            <Text style={styles.statValue}>
              {formatCurrency(summary.pendingAmount)}
            </Text>
            <Text style={styles.statSubtext}>
              {summary.earningsByStatus.find((s: EarningsByStatus) => s.status === 'PENDING')?.count || 0} pending payments
            </Text>
          </View>
        </View>

        <View style={styles.typeContainer}>
          <Text style={styles.sectionTitle}>Earnings by Type</Text>
          {summary.earningsByType.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="pie-chart" size={32} color={colors.muted} />
              <Text style={styles.emptyStateText}>No type data</Text>
            </View>
          ) : (
            <View style={styles.typeList}>
              {summary.earningsByType.map((type: EarningsByType) => (
                <View key={type.type} style={styles.typeItem}>
                  <View style={styles.typeHeader}>
                    <Text style={styles.typeLabel}>{type.type}</Text>
                    <Text style={styles.typeValue}>{formatCurrency(type.amount)}</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { width: `${(type.amount / summary.totalEarnings) * 100}%` }
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>Earnings History</Text>
          {earnings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="list" size={32} color={colors.muted} />
              <Text style={styles.emptyStateText}>No earnings history</Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {earnings.map((earning: Earning) => (
                <View key={earning.id} style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>
                      {new Date(earning.createdAt).toLocaleDateString()}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      earning.status === 'PAID' ? styles.statusPaid : styles.statusPending
                    ]}>
                      <Text style={[
                        styles.statusText,
                        earning.status === 'PAID' ? styles.statusTextPaid : styles.statusTextPending
                      ]}>
                        {earning.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.historyContent}>
                    <View>
                      <Text style={styles.orderId}>
                        Order {earning.order.id.substring(0, 8)}
                      </Text>
                      <Text style={styles.routeId}>
                        Route {earning.route.id.substring(0, 8)}
                      </Text>
                    </View>
                    <Text style={styles.amount}>
                      {formatCurrency(earning.totalAmount)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
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
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.foreground,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  timeRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.muted,
    borderRadius: 8,
  },
  timeRangeText: {
    color: colors.foreground,
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.foreground,
  },
  statSubtext: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    color: colors.muted,
    marginTop: 8,
  },
  typeContainer: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  typeList: {
    gap: 16,
  },
  typeItem: {
    gap: 8,
  },
  typeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  typeValue: {
    fontSize: 14,
    color: colors.foreground,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.muted,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  historyContainer: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
  },
  historyList: {
    gap: 16,
  },
  historyItem: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 14,
    color: colors.muted,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPaid: {
    backgroundColor: `${colors.success}20`,
  },
  statusPending: {
    backgroundColor: colors.muted,
  },
  statusText: {
    fontSize: 12,
  },
  statusTextPaid: {
    color: colors.success,
  },
  statusTextPending: {
    color: colors.muted,
  },
  historyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderId: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  routeId: {
    fontSize: 12,
    color: colors.muted,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  chartWrapper: {
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
});

