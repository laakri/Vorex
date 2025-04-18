import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Switch,
  Alert,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../lib/axios';

// Define interfaces for the data
interface DriverProfile {
  driver: {
    id: string;
    licenseNumber: string;
    licenseType: string;
    licenseExpiry: string;
    address: string;
    city: string;
    postalCode: string;
    governorate: string;
    phone: string;
    emergencyContact: string;
    availabilityStatus: string;
  };
  user: {
    id: string;
    email: string;
    fullName: string;
    isVerifiedDriver: boolean;
    role: string[];
  };
  vehicle: {
    id: string;
    type: string;
    make: string;
    model: string;
    year: number;
    plateNumber: string;
    capacity: number;
    maxWeight: number;
    currentStatus: string;
    lastMaintenance: string;
    nextMaintenance: string;
  };
}

// Tunisia governorates
const TUNISIA_GOVERNORATES = [
  "Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul", "Zaghouan", "Bizerte", 
  "Béja", "Jendouba", "Kef", "Siliana", "Sousse", "Monastir", "Mahdia", 
  "Sfax", "Kairouan", "Kasserine", "Sidi Bouzid", "Gabès", "Medenine", 
  "Tataouine", "Gafsa", "Tozeur", "Kebili"
];

// License types
const LICENSE_TYPES = [
  { value: "A", label: "Class A - Heavy Vehicles" },
  { value: "B", label: "Class B - Cars & Light Trucks" },
  { value: "C", label: "Class C - Small Vehicles" },
  { value: "M", label: "Class M - Motorcycles" }
];

export const SettingsScreen = () => {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingLicense, setSavingLicense] = useState(false);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'license' | 'vehicle' | 'notifications'>('personal');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Form states
  const [personalForm, setPersonalForm] = useState({
    address: '',
    city: '',
    postalCode: '',
    governorate: '',
    phone: '',
    emergencyContact: ''
  });
  
  const [licenseForm, setLicenseForm] = useState({
    licenseNumber: '',
    licenseType: '',
    licenseExpiry: new Date()
  });
  
  const [vehicleForm, setVehicleForm] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    plateNumber: '',
    capacity: 1,
    maxWeight: 100
  });
  
  const [notificationForm, setNotificationForm] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false
  });

  // Fetch driver profile
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/drivers/profile');
      setProfile(response.data);
      
      // Set form values
      setPersonalForm({
        address: response.data.driver.address || '',
        city: response.data.driver.city || '',
        postalCode: response.data.driver.postalCode || '',
        governorate: response.data.driver.governorate || '',
        phone: response.data.driver.phone || '',
        emergencyContact: response.data.driver.emergencyContact || ''
      });
      
      setLicenseForm({
        licenseNumber: response.data.driver.licenseNumber || '',
        licenseType: response.data.driver.licenseType || '',
        licenseExpiry: response.data.driver.licenseExpiry ? new Date(response.data.driver.licenseExpiry) : new Date()
      });
      
      setVehicleForm({
        make: response.data.vehicle.make || '',
        model: response.data.vehicle.model || '',
        year: response.data.vehicle.year || new Date().getFullYear(),
        plateNumber: response.data.vehicle.plateNumber || '',
        capacity: response.data.vehicle.capacity || 1,
        maxWeight: response.data.vehicle.maxWeight || 100
      });
      
      // You could also set notification preferences here if you had them in the API
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to load profile data'
      );
    } finally {
      setLoading(false);
    }
  };

  // Form submission handlers
  const onSubmitPersonal = async () => {
    try {
      setSavingPersonal(true);
      await api.patch('/drivers/profile', personalForm);
      
      Alert.alert(
        'Profile Updated',
        'Your personal information has been updated successfully.'
      );
      
      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          driver: {
            ...profile.driver,
            ...personalForm
          }
        });
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to update profile'
      );
    } finally {
      setSavingPersonal(false);
    }
  };

  const onSubmitLicense = async () => {
    try {
      setSavingLicense(true);
      await api.patch('/drivers/profile', {
        ...licenseForm,
        licenseExpiry: licenseForm.licenseExpiry.toISOString()
      });
      
      Alert.alert(
        'License Updated',
        'Your license information has been updated successfully.'
      );
      
      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          driver: {
            ...profile.driver,
            licenseNumber: licenseForm.licenseNumber,
            licenseType: licenseForm.licenseType,
            licenseExpiry: licenseForm.licenseExpiry.toISOString()
          }
        });
      }
    } catch (err: any) {
      console.error('Error updating license:', err);
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to update license information'
      );
    } finally {
      setSavingLicense(false);
    }
  };

  const onSubmitVehicle = async () => {
    try {
      setSavingVehicle(true);
      await api.patch('/drivers/vehicle', vehicleForm);
      
      Alert.alert(
        'Vehicle Updated',
        'Your vehicle information has been updated successfully.'
      );
      
      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          vehicle: {
            ...profile.vehicle,
            ...vehicleForm
          }
        });
      }
    } catch (err: any) {
      console.error('Error updating vehicle:', err);
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to update vehicle information'
      );
    } finally {
      setSavingVehicle(false);
    }
  };

  const onSubmitNotifications = async () => {
    try {
      setSavingNotifications(true);
      // Mock API call - would need a real endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Notification Preferences Updated',
        'Your notification preferences have been updated successfully.'
      );
    } catch (err: any) {
      console.error('Error updating notifications:', err);
      Alert.alert(
        'Error',
        'Failed to update notification preferences'
      );
    } finally {
      setSavingNotifications(false);
    }
  };

  const updateAvailability = async (status: string) => {
    try {
      setLoading(true);
      await api.patch('/drivers/availability', { status });
      
      Alert.alert(
        'Status Updated',
        `You are now ${status.toLowerCase()}.`
      );
      
      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          driver: {
            ...profile.driver,
            availabilityStatus: status
          }
        });
      }
    } catch (err: any) {
      console.error('Error updating availability:', err);
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to update availability'
      );
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  // Loading state
  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert" size={48} color={colors.destructive} />
          <Text style={styles.errorTitle}>Profile Not Found</Text>
          <Text style={styles.errorText}>Unable to load your profile data.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
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
          <Text style={styles.title}>Settings</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchProfile}>
            <Ionicons name="refresh" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Driver Settings</Text>
            <Text style={styles.cardDescription}>
              Update your driver profile, vehicle information, and preferences.
            </Text>
          </View>
          
          <View style={styles.tabsContainer}>
            <View style={styles.tabsHeader}>
              <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'personal' && styles.activeTabButton]} 
                onPress={() => setActiveTab('personal')}
              >
                <Text style={[styles.tabButtonText, activeTab === 'personal' && styles.activeTabButtonText]}>
                  Personal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'license' && styles.activeTabButton]} 
                onPress={() => setActiveTab('license')}
              >
                <Text style={[styles.tabButtonText, activeTab === 'license' && styles.activeTabButtonText]}>
                  License
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'vehicle' && styles.activeTabButton]} 
                onPress={() => setActiveTab('vehicle')}
              >
                <Text style={[styles.tabButtonText, activeTab === 'vehicle' && styles.activeTabButtonText]}>
                  Vehicle
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'notifications' && styles.activeTabButton]} 
                onPress={() => setActiveTab('notifications')}
              >
                <Text style={[styles.tabButtonText, activeTab === 'notifications' && styles.activeTabButtonText]}>
                  Notifications
                </Text>
              </TouchableOpacity>
            </View>
            
            {activeTab === 'personal' && (
              <View style={styles.tabContent}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123 Main St"
                    value={personalForm.address}
                    onChangeText={(text) => setPersonalForm({...personalForm, address: text})}
                    placeholderTextColor={colors.muted}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>City</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="City"
                    value={personalForm.city}
                    onChangeText={(text) => setPersonalForm({...personalForm, city: text})}
                    placeholderTextColor={colors.muted}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Postal Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="12345"
                    value={personalForm.postalCode}
                    onChangeText={(text) => setPersonalForm({...personalForm, postalCode: text})}
                    placeholderTextColor={colors.muted}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Governorate</Text>
                  <View style={styles.selectContainer}>
                    <TextInput
                      style={styles.selectInput}
                      placeholder="Select your governorate"
                      value={personalForm.governorate}
                      editable={false}
                      placeholderTextColor={colors.muted}
                    />
                    <TouchableOpacity style={styles.selectButton}>
                      <Ionicons name="chevron-down" size={20} color={colors.foreground} />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+1234567890"
                    value={personalForm.phone}
                    onChangeText={(text) => setPersonalForm({...personalForm, phone: text})}
                    placeholderTextColor={colors.muted}
                    keyboardType="phone-pad"
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Emergency Contact</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+1234567890"
                    value={personalForm.emergencyContact}
                    onChangeText={(text) => setPersonalForm({...personalForm, emergencyContact: text})}
                    placeholderTextColor={colors.muted}
                    keyboardType="phone-pad"
                  />
                </View>
                
                <View style={styles.statusSection}>
                  <Text style={styles.statusTitle}>Availability Status</Text>
                  <View style={styles.statusButtons}>
                    {["ONLINE", "OFFLINE", "BUSY", "ON_BREAK"].map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusButton,
                          profile.driver.availabilityStatus === status && styles.activeStatusButton
                        ]}
                        onPress={() => updateAvailability(status)}
                        disabled={loading}
                      >
                        <Text style={[
                          styles.statusButtonText,
                          profile.driver.availabilityStatus === status && styles.activeStatusButtonText
                        ]}>
                          {status === "ONLINE" && "🟢 "}
                          {status === "OFFLINE" && "⚫ "}
                          {status === "BUSY" && "🔴 "}
                          {status === "ON_BREAK" && "🟠 "}
                          {status.replace("_", " ")}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={onSubmitPersonal}
                  disabled={savingPersonal}
                >
                  {savingPersonal ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.submitButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
            
            {activeTab === 'license' && (
              <View style={styles.tabContent}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>License Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="DL12345678"
                    value={licenseForm.licenseNumber}
                    onChangeText={(text) => setLicenseForm({...licenseForm, licenseNumber: text})}
                    placeholderTextColor={colors.muted}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>License Type</Text>
                  <View style={styles.selectContainer}>
                    <TextInput
                      style={styles.selectInput}
                      placeholder="Select license type"
                      value={LICENSE_TYPES.find(type => type.value === licenseForm.licenseType)?.label || ''}
                      editable={false}
                      placeholderTextColor={colors.muted}
                    />
                    <TouchableOpacity style={styles.selectButton}>
                      <Ionicons name="chevron-down" size={20} color={colors.foreground} />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>License Expiry Date</Text>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.datePickerButtonText}>
                      {licenseForm.licenseExpiry ? formatDate(licenseForm.licenseExpiry) : 'Pick a date'}
                    </Text>
                    <Ionicons name="calendar" size={20} color={colors.muted} />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={onSubmitLicense}
                  disabled={savingLicense}
                >
                  {savingLicense ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.submitButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
            
            {activeTab === 'vehicle' && (
              <View style={styles.tabContent}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Make</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Toyota"
                    value={vehicleForm.make}
                    onChangeText={(text) => setVehicleForm({...vehicleForm, make: text})}
                    placeholderTextColor={colors.muted}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Model</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Corolla"
                    value={vehicleForm.model}
                    onChangeText={(text) => setVehicleForm({...vehicleForm, model: text})}
                    placeholderTextColor={colors.muted}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Year</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="2023"
                    value={vehicleForm.year.toString()}
                    onChangeText={(text) => setVehicleForm({...vehicleForm, year: parseInt(text) || new Date().getFullYear()})}
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>License Plate</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="ABC-1234"
                    value={vehicleForm.plateNumber}
                    onChangeText={(text) => setVehicleForm({...vehicleForm, plateNumber: text})}
                    placeholderTextColor={colors.muted}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Capacity (cubic meters)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    value={vehicleForm.capacity.toString()}
                    onChangeText={(text) => setVehicleForm({...vehicleForm, capacity: parseInt(text) || 1})}
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Max Weight (kg)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="100"
                    value={vehicleForm.maxWeight.toString()}
                    onChangeText={(text) => setVehicleForm({...vehicleForm, maxWeight: parseInt(text) || 100})}
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                  />
                </View>
                
                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={onSubmitVehicle}
                  disabled={savingVehicle}
                >
                  {savingVehicle ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.submitButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
            
            {activeTab === 'notifications' && (
              <View style={styles.tabContent}>
                <View style={styles.notificationItem}>
                  <View style={styles.notificationInfo}>
                    <Text style={styles.notificationTitle}>Email Notifications</Text>
                    <Text style={styles.notificationDescription}>
                      Receive notifications about new deliveries and updates via email.
                    </Text>
                  </View>
                  <Switch
                    value={notificationForm.emailNotifications}
                    onValueChange={(value) => setNotificationForm({...notificationForm, emailNotifications: value})}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={notificationForm.emailNotifications ? colors.background : colors.muted}
                  />
                </View>
                
                <View style={styles.notificationItem}>
                  <View style={styles.notificationInfo}>
                    <Text style={styles.notificationTitle}>Push Notifications</Text>
                    <Text style={styles.notificationDescription}>
                      Receive real-time alerts on your device about delivery status changes.
                    </Text>
                  </View>
                  <Switch
                    value={notificationForm.pushNotifications}
                    onValueChange={(value) => setNotificationForm({...notificationForm, pushNotifications: value})}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={notificationForm.pushNotifications ? colors.background : colors.muted}
                  />
                </View>
                
                <View style={styles.notificationItem}>
                  <View style={styles.notificationInfo}>
                    <Text style={styles.notificationTitle}>SMS Notifications</Text>
                    <Text style={styles.notificationDescription}>
                      Receive text messages for urgent updates and delivery confirmations.
                    </Text>
                  </View>
                  <Switch
                    value={notificationForm.smsNotifications}
                    onValueChange={(value) => setNotificationForm({...notificationForm, smsNotifications: value})}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={notificationForm.smsNotifications ? colors.background : colors.muted}
                  />
                </View>
                
                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={onSubmitNotifications}
                  disabled={savingNotifications}
                >
                  {savingNotifications ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.submitButtonText}>Save Preferences</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        
        {/* Account Danger Zone */}
        <View style={styles.dangerZoneCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
            <Text style={styles.cardDescription}>
              Actions here can't be undone. Be careful.
            </Text>
          </View>
          
          <View style={styles.dangerZoneContent}>
            <View style={styles.dangerZoneItem}>
              <View style={styles.dangerZoneInfo}>
                <Text style={styles.dangerZoneItemTitle}>Delete Account</Text>
                <Text style={styles.dangerZoneItemDescription}>
                  Permanently delete your account and all associated data.
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.dangerZoneButton}
                onPress={() => {
                  Alert.alert(
                    'Delete Account',
                    'Are you sure you want to delete your account? This action cannot be undone.',
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel'
                      },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => {
                          Alert.alert(
                            'Account deletion requested',
                            "We've received your request. Our team will contact you shortly."
                          );
                        }
                      }
                    ]
                  );
                }}
              >
                <Text style={styles.dangerZoneButtonText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePickerContainer}>
              {/* This is a simplified date picker. In a real app, you would use a proper date picker component */}
              <Text style={styles.datePickerText}>
                Select a date for your license expiry
              </Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                onChangeText={(text) => {
                  const date = new Date(text);
                  if (!isNaN(date.getTime())) {
                    setSelectedDate(date);
                    setLicenseForm({...licenseForm, licenseExpiry: date});
                  }
                }}
                placeholderTextColor={colors.muted}
              />
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.submitButtonText}>Confirm</Text>
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
  cardDescription: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },
  tabsContainer: {
    marginBottom: 16,
    backgroundColor: colors.background,
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
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectButton: {
    padding: 12,
    marginLeft: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  datePickerButtonText: {
    fontSize: 14,
    color: colors.foreground,
  },
  statusSection: {
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: `${colors.card}20`,
    borderRadius: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  statusButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    margin: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeStatusButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusButtonText: {
    fontSize: 14,
    color: colors.foreground,
  },
  activeStatusButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notificationInfo: {
    flex: 1,
    marginRight: 16,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.foreground,
  },
  notificationDescription: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },
  dangerZoneCard: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    margin: 16,
    marginBottom: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${colors.destructive}50`,
  },
  dangerZoneTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.destructive,
  },
  dangerZoneContent: {
    padding: 16,
  },
  dangerZoneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dangerZoneInfo: {
    flex: 1,
    marginRight: 16,
  },
  dangerZoneItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.foreground,
  },
  dangerZoneItemDescription: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },
  dangerZoneButton: {
    backgroundColor: colors.destructive,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  dangerZoneButtonText: {
    color: 'white',
    fontWeight: '600',
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
  datePickerContainer: {
    padding: 16,
  },
  datePickerText: {
    fontSize: 16,
    color: colors.foreground,
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
}); 