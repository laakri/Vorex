import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../lib/axios';

// Define interfaces for the data (matching web version)
interface MaintenanceRecord {
  id: string;
  type: string;
  date: string;
  odometer: number;
  description: string;
  cost: number;
  status: string;
}

interface VehicleIssue {
  id: string;
  title: string;
  description: string;
  reportedAt: string;
  status: string;
  priority: string;
}

interface Insurance {
  provider: string;
  policyNumber: string;
  coverage: string;
  startDate: string;
  endDate: string;
}

interface Vehicle {
  id: string;
  type: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  status: string;
  fuelType: string;
  fuelLevel: number;
  odometer: number;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  maintenanceRecords: MaintenanceRecord[];
  issues: VehicleIssue[];
  insurance: Insurance | null;
}

export const VehicleInfoScreen = () => {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'maintenance' | 'issues'>('maintenance');
  const [isReportingIssue, setIsReportingIssue] = useState(false);
  const [isAddingMaintenance, setIsAddingMaintenance] = useState(false);
  
  // New maintenance form state
  const [maintenanceType, setMaintenanceType] = useState('');
  const [maintenanceDate, setMaintenanceDate] = useState('');
  const [maintenanceOdometer, setMaintenanceOdometer] = useState('');
  const [maintenanceDescription, setMaintenanceDescription] = useState('');
  const [maintenanceCost, setMaintenanceCost] = useState('');
  const [maintenanceStatus, setMaintenanceStatus] = useState('COMPLETED');
  
  // Maintenance types
  const maintenanceTypes = [
    { value: 'OIL_CHANGE', label: 'Oil Change' },
    { value: 'TIRE_ROTATION', label: 'Tire Rotation' },
    { value: 'BRAKE_SERVICE', label: 'Brake Service' },
    { value: 'ENGINE_TUNING', label: 'Engine Tuning' },
    { value: 'GENERAL_INSPECTION', label: 'General Inspection' },
    { value: 'FILTER_REPLACEMENT', label: 'Filter Replacement' },
    { value: 'OTHER', label: 'Other Service' }
  ];

  // Fetch vehicle data
  useEffect(() => {
    fetchVehicle();
  }, []);

  const fetchVehicle = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vehicles/driver');
      setVehicle(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching vehicle:', err);
      setError(err.response?.data?.message || "Failed to load vehicle data");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get days until a date
  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Helper function to get status colors
  const getStatusColor = (status: string | undefined) => {
    switch (status?.toUpperCase()) {
      case 'VALID':
      case 'COMPLETED':
      case 'RESOLVED':
        return styles.statusCompleted;
      case 'PENDING':
      case 'IN_PROGRESS':
        return styles.statusInProgress;
      case 'EXPIRED':
      case 'FAILED':
        return styles.statusFailed;
      default:
        return styles.statusPending;
    }
  };

  // Helper function to get priority colors
  const getPriorityColor = (priority: string | undefined) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
        return styles.priorityHigh;
      case 'MEDIUM':
        return styles.priorityMedium;
      case 'LOW':
        return styles.priorityLow;
      default:
        return styles.priorityDefault;
    }
  };

  // Handle adding a new maintenance record
  const handleAddMaintenance = async () => {
    if (!vehicle) return;
    
    // Validate form
    if (!maintenanceType) {
      Alert.alert('Error', 'Please select a maintenance type');
      return;
    }
    
    if (!maintenanceDate) {
      Alert.alert('Error', 'Please select a date');
      return;
    }
    
    if (!maintenanceOdometer || isNaN(Number(maintenanceOdometer)) || Number(maintenanceOdometer) <= 0) {
      Alert.alert('Error', 'Please enter a valid odometer reading');
      return;
    }
    
    if (!maintenanceDescription || maintenanceDescription.length < 10) {
      Alert.alert('Error', 'Description must be at least 10 characters');
      return;
    }
    
    if (!maintenanceCost || isNaN(Number(maintenanceCost)) || Number(maintenanceCost) < 0) {
      Alert.alert('Error', 'Please enter a valid cost');
      return;
    }
    
    try {
      setLoading(true);
      
      const maintenanceData = {
        type: maintenanceType,
        date: new Date(maintenanceDate).toISOString(),
        odometer: Number(maintenanceOdometer),
        description: maintenanceDescription,
        cost: Number(maintenanceCost),
        status: maintenanceStatus
      };
      
      const response = await api.post(`/vehicles/${vehicle.id}/maintenance`, maintenanceData);
      
      // Update the vehicle state with the new maintenance record
      setVehicle({
        ...vehicle,
        maintenanceRecords: [response.data, ...vehicle.maintenanceRecords],
        lastMaintenanceDate: maintenanceData.date,
        nextMaintenanceDate: new Date(new Date(maintenanceData.date).getTime() + 180 * 24 * 60 * 60 * 1000).toISOString()
      });
      
      // Reset form and close modal
      setMaintenanceType('');
      setMaintenanceDate('');
      setMaintenanceOdometer('');
      setMaintenanceDescription('');
      setMaintenanceCost('');
      setMaintenanceStatus('COMPLETED');
      setIsAddingMaintenance(false);
      
      Alert.alert('Success', 'Maintenance record added successfully');
    } catch (err: any) {
      console.error('Error adding maintenance record:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to add maintenance record');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading && !vehicle) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading vehicle information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !vehicle) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert" size={48} color={colors.destructive} />
          <Text style={styles.errorTitle}>Vehicle Not Found</Text>
          <Text style={styles.errorText}>{error || "No vehicle is assigned to your account."}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchVehicle}>
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
          <Text style={styles.title}>My Vehicle</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchVehicle}>
            <Ionicons name="refresh" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Vehicle Overview Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Vehicle Overview</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.vehicleHeader}>
              <View style={styles.vehicleIconContainer}>
                <Ionicons name="car" size={24} color={colors.primary} />
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>{vehicle.make} {vehicle.model}</Text>
                <Text style={styles.vehicleYear}>{vehicle.year} • {vehicle.type}</Text>
              </View>
              <View style={[styles.statusBadge, getStatusColor(vehicle.status)]}>
                <Text style={styles.statusText}>{vehicle.status}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>License Plate:</Text>
              <Text style={styles.infoValue}>{vehicle.licensePlate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>VIN:</Text>
              <Text style={styles.infoValue}>{vehicle.vin}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Odometer:</Text>
              <Text style={styles.infoValue}>{vehicle.odometer.toLocaleString()} km</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fuel Type:</Text>
              <Text style={styles.infoValue}>{vehicle.fuelType}</Text>
            </View>
          </View>
        </View>

        {/* Fuel & Maintenance Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Fuel & Maintenance</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.fuelSection}>
              <View style={styles.fuelHeader}>
                <View style={styles.fuelIconContainer}>
                  <Ionicons name="water" size={16} color={colors.muted} />
                </View>
                <Text style={styles.fuelLabel}>Fuel Level</Text>
                <Text style={styles.fuelValue}>{vehicle.fuelLevel}%</Text>
              </View>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${vehicle.fuelLevel}%` }]} />
              </View>
            </View>

            <View style={styles.maintenanceSection}>
              <View style={styles.maintenanceHeader}>
                <View style={styles.maintenanceIconContainer}>
                  <Ionicons name="construct" size={16} color={colors.muted} />
                </View>
                <Text style={styles.maintenanceLabel}>Maintenance Status</Text>
              </View>

              <View style={styles.maintenanceInfo}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Last Service:</Text>
                  <Text style={styles.infoValue}>{formatDate(vehicle.lastMaintenanceDate)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Next Service:</Text>
                  <View style={styles.nextServiceContainer}>
                    <Text style={styles.infoValue}>{formatDate(vehicle.nextMaintenanceDate)}</Text>
                    <View style={[
                      styles.daysBadge,
                      getDaysUntil(vehicle.nextMaintenanceDate) < 7 
                        ? styles.daysBadgeUrgent 
                        : getDaysUntil(vehicle.nextMaintenanceDate) < 30 
                          ? styles.daysBadgeWarning
                          : styles.daysBadgeGood
                    ]}>
                      <Text style={styles.daysBadgeText}>
                        {getDaysUntil(vehicle.nextMaintenanceDate)} days
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Insurance Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Insurance Information</Text>
          </View>
          <View style={styles.cardContent}>
            {vehicle.insurance ? (
              <>
                <View style={styles.insuranceHeader}>
                  <View style={styles.insuranceIconContainer}>
                    <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.insuranceInfo}>
                    <Text style={styles.insuranceProvider}>{vehicle.insurance.provider}</Text>
                    <Text style={styles.insuranceCoverage}>{vehicle.insurance.coverage}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Policy Number:</Text>
                  <Text style={styles.infoValue}>{vehicle.insurance.policyNumber}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Valid From:</Text>
                  <Text style={styles.infoValue}>{formatDate(vehicle.insurance.startDate)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Valid Until:</Text>
                  <View style={styles.nextServiceContainer}>
                    <Text style={styles.infoValue}>{formatDate(vehicle.insurance.endDate)}</Text>
                    <View style={[
                      styles.daysBadge,
                      getDaysUntil(vehicle.insurance.endDate) < 30 
                        ? styles.daysBadgeUrgent 
                        : styles.daysBadgeGood
                    ]}>
                      <Text style={styles.daysBadgeText}>
                        {getDaysUntil(vehicle.insurance.endDate)} days
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.emptyInsurance}>
                <Ionicons name="shield-outline" size={40} color={colors.muted} />
                <Text style={styles.emptyInsuranceTitle}>No Insurance Information</Text>
                <Text style={styles.emptyInsuranceText}>
                  Insurance details are not available for this vehicle.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Maintenance and Issues Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabsHeader}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'maintenance' && styles.activeTabButton]} 
              onPress={() => setActiveTab('maintenance')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'maintenance' && styles.activeTabButtonText]}>
                Maintenance History
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'issues' && styles.activeTabButton]} 
              onPress={() => setActiveTab('issues')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'issues' && styles.activeTabButtonText]}>
                Reported Issues
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'maintenance' ? (
            <View style={styles.tabContent}>
              {vehicle.maintenanceRecords.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="construct-outline" size={40} color={colors.muted} />
                  <Text style={styles.emptyStateTitle}>No Maintenance Records</Text>
                  <Text style={styles.emptyStateText}>
                    No maintenance records are available for this vehicle.
                  </Text>
                </View>
              ) : (
                <>
                  {vehicle.maintenanceRecords.map((record) => (
                    <View key={record.id} style={styles.recordItem}>
                      <View style={styles.recordIconContainer}>
                        <Ionicons name="construct" size={20} color={colors.primary} />
                      </View>
                      <View style={styles.recordContent}>
                        <View style={styles.recordHeader}>
                          <Text style={styles.recordTitle}>{record.type.replace(/_/g, ' ')}</Text>
                          <View style={[styles.statusBadge, getStatusColor(record.status)]}>
                            <Text style={styles.statusText}>{record.status}</Text>
                          </View>
                        </View>
                        <Text style={styles.recordDescription}>{record.description}</Text>
                        <View style={styles.recordDetails}>
                          <View style={styles.recordDetail}>
                            <Ionicons name="calendar-outline" size={14} color={colors.muted} />
                            <Text style={styles.recordDetailText}>{formatDate(record.date)}</Text>
                          </View>
                          <View style={styles.recordDetail}>
                            <Ionicons name="speedometer-outline" size={14} color={colors.muted} />
                            <Text style={styles.recordDetailText}>{record.odometer.toLocaleString()} km</Text>
                          </View>
                          <View style={styles.recordDetail}>
                            <Text style={styles.recordCost}>${record.cost.toFixed(2)}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                  <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => setIsAddingMaintenance(true)}
                  >
                    <Ionicons name="add-circle-outline" size={16} color={colors.foreground} />
                    <Text style={styles.addButtonText}>Add Maintenance Record</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            <View style={styles.tabContent}>
              {vehicle.issues.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="checkmark-circle" size={40} color={colors.success} />
                  <Text style={styles.emptyStateTitle}>No Issues Reported</Text>
                  <Text style={styles.emptyStateText}>
                    Your vehicle has no reported issues. Use the "Report Issue" button if you encounter any problems.
                  </Text>
                </View>
              ) : (
                <>
                  {vehicle.issues.map((issue) => (
                    <View key={issue.id} style={styles.issueItem}>
                      <View style={styles.issueIconContainer}>
                        <Ionicons 
                          name="warning" 
                          size={20} 
                          color={
                            issue.priority === "HIGH" 
                              ? colors.destructive 
                              : issue.priority === "MEDIUM"
                                ? colors.warning
                                : colors.primary
                          } 
                        />
                      </View>
                      <View style={styles.issueContent}>
                        <View style={styles.issueHeader}>
                          <Text style={styles.issueTitle}>{issue.title}</Text>
                          <View style={[styles.priorityBadge, getPriorityColor(issue.priority)]}>
                            <Text style={styles.priorityText}>{issue.priority}</Text>
                          </View>
                        </View>
                        <Text style={styles.issueDescription}>{issue.description}</Text>
                        <View style={styles.issueFooter}>
                          <Text style={styles.issueDate}>
                            Reported on {formatDate(issue.reportedAt)}
                          </Text>
                          <View style={[styles.statusBadge, getStatusColor(issue.status)]}>
                            <Text style={styles.statusText}>{issue.status.replace(/_/g, ' ')}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                  <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => setIsReportingIssue(true)}
                  >
                    <Ionicons name="warning-outline" size={16} color={colors.foreground} />
                    <Text style={styles.addButtonText}>Report New Issue</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Add Maintenance Modal */}
      <Modal
        visible={isAddingMaintenance}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddingMaintenance(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Maintenance Record</Text>
              <TouchableOpacity onPress={() => setIsAddingMaintenance(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Maintenance Type</Text>
                <View style={styles.typeSelector}>
                  {maintenanceTypes.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.typeOption,
                        maintenanceType === type.value && styles.selectedTypeOption
                      ]}
                      onPress={() => setMaintenanceType(type.value)}
                    >
                      <Text style={[
                        styles.typeOptionText,
                        maintenanceType === type.value && styles.selectedTypeOptionText
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={maintenanceDate}
                  onChangeText={setMaintenanceDate}
                  placeholderTextColor={colors.muted}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Odometer (km)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter odometer reading"
                  value={maintenanceOdometer}
                  onChangeText={setMaintenanceOdometer}
                  keyboardType="numeric"
                  placeholderTextColor={colors.muted}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Details of the maintenance performed"
                  value={maintenanceDescription}
                  onChangeText={setMaintenanceDescription}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor={colors.muted}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Cost ($)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter cost"
                  value={maintenanceCost}
                  onChangeText={setMaintenanceCost}
                  keyboardType="numeric"
                  placeholderTextColor={colors.muted}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Status</Text>
                <View style={styles.statusSelector}>
                  <TouchableOpacity
                    style={[
                      styles.statusOption,
                      maintenanceStatus === 'COMPLETED' && styles.selectedStatusOption
                    ]}
                    onPress={() => setMaintenanceStatus('COMPLETED')}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      maintenanceStatus === 'COMPLETED' && styles.selectedStatusOptionText
                    ]}>
                      Completed
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusOption,
                      maintenanceStatus === 'IN_PROGRESS' && styles.selectedStatusOption
                    ]}
                    onPress={() => setMaintenanceStatus('IN_PROGRESS')}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      maintenanceStatus === 'IN_PROGRESS' && styles.selectedStatusOptionText
                    ]}>
                      In Progress
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusOption,
                      maintenanceStatus === 'SCHEDULED' && styles.selectedStatusOption
                    ]}
                    onPress={() => setMaintenanceStatus('SCHEDULED')}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      maintenanceStatus === 'SCHEDULED' && styles.selectedStatusOptionText
                    ]}>
                      Scheduled
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setIsAddingMaintenance(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleAddMaintenance}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Save Record</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.secondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.foreground,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    margin: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  cardContent: {
    padding: 16,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vehicleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  vehicleYear: {
    fontSize: 14,
    color: colors.muted,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.muted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  fuelSection: {
    marginBottom: 16,
  },
  fuelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fuelIconContainer: {
    marginRight: 8,
  },
  fuelLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
    flex: 1,
  },
  fuelValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  progressContainer: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  maintenanceSection: {
    marginTop: 16,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  maintenanceIconContainer: {
    marginRight: 8,
  },
  maintenanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  maintenanceInfo: {
    backgroundColor: `${colors.muted}20`,
    borderRadius: 8,
    padding: 12,
  },
  nextServiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  daysBadgeUrgent: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  daysBadgeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  daysBadgeGood: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  daysBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  insuranceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insuranceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  insuranceInfo: {
    flex: 1,
  },
  insuranceProvider: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  insuranceCoverage: {
    fontSize: 14,
    color: colors.muted,
  },
  emptyInsurance: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyInsuranceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: 12,
  },
  emptyInsuranceText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
  },
  tabsContainer: {
    margin: 16,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tabsHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
  },
  activeTabButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
  },
  recordItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  recordIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recordContent: {
    flex: 1,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recordTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  recordDescription: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 8,
  },
  recordDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recordDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  recordDetailText: {
    fontSize: 12,
    color: colors.muted,
    marginLeft: 4,
  },
  recordCost: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.foreground,
  },
  issueItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  issueIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.destructive}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  issueContent: {
    flex: 1,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  issueTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  priorityMedium: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  priorityLow: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  priorityDefault: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  issueDescription: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 8,
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  issueDate: {
    fontSize: 12,
    color: colors.muted,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginLeft: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: colors.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  modalForm: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 12,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  typeOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    margin: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedTypeOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeOptionText: {
    fontSize: 14,
    color: colors.foreground,
  },
  selectedTypeOptionText: {
    color: 'white',
    fontWeight: '600',
  },
  statusSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  selectedStatusOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusOptionText: {
    fontSize: 14,
    color: colors.foreground,
  },
  selectedStatusOptionText: {
    color: 'white',
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  submitButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.primary,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});