import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../stores/auth.store';
import api from '../../lib/axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

type DriverApplicationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface DriverFormData {
  fullName: string;
  email: string;
  phone: string;
  emergencyContact: string;
  address: string;
  city: string;
  governorate: string;
  postalCode: string;
  licenseNumber: string;
  licenseType: string;
  licenseExpiry: string;
  vehicleType: "MOTORCYCLE" | "CAR" | "VAN" | "SMALL_TRUCK" | "LARGE_TRUCK";
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  capacity: number;
  maxWeight: number;
  lastMaintenance: Date;
  nextMaintenance: Date;
}

const TUNISIA_GOVERNORATES = [
  "Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul", "Zaghouan", "Bizerte",
  "Béja", "Jendouba", "Kef", "Siliana", "Sousse", "Monastir", "Mahdia",
  "Sfax", "Kairouan", "Kasserine", "Sidi Bouzid", "Gabès", "Medenine",
  "Tataouine", "Gafsa", "Tozeur", "Kebili"
];

const LICENSE_TYPES = [
  { value: "A", label: "Motorcycle License" },
  { value: "B", label: "Car License" },
  { value: "C", label: "Van License" },
  { value: "D", label: "Small Truck License" },
  { value: "E", label: "Large Truck License" }
];

const VEHICLE_TYPES = [
  { value: "MOTORCYCLE", label: "Motorcycle", description: "Two-wheeled vehicle" },
  { value: "CAR", label: "Car", description: "Standard passenger vehicle" },
  { value: "VAN", label: "Van", description: "Small cargo vehicle" },
  { value: "SMALL_TRUCK", label: "Small Truck", description: "Medium cargo vehicle" },
  { value: "LARGE_TRUCK", label: "Large Truck", description: "Heavy cargo vehicle" }
];

const steps = [
  {
    title: "Personal Information",
    description: "Tell us about yourself",
    fields: ["fullName", "email", "phone", "emergencyContact"],
  },
  {
    title: "Address Details",
    description: "Where can we reach you?",
    fields: ["address", "city", "governorate", "postalCode"],
  },
  {
    title: "License Information",
    description: "Your driving credentials",
    fields: ["licenseNumber", "licenseType", "licenseExpiry"],
  },
  {
    title: "Vehicle Information",
    description: "Tell us about your vehicle",
    fields: ["vehicleType", "make", "model", "year", "plateNumber"],
  },
  {
    title: "Vehicle Specifications",
    description: "Technical details of your vehicle",
    fields: ["capacity", "maxWeight", "lastMaintenance", "nextMaintenance"],
  }
];

export const DriverApplicationScreen = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<DriverFormData>({
    fullName: "",
    email: "",
    phone: "",
    emergencyContact: "",
    address: "",
    city: "",
    governorate: "",
    postalCode: "",
    licenseNumber: "",
    licenseType: "B",
    licenseExpiry: new Date().toISOString().split('T')[0],
    vehicleType: "CAR",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    plateNumber: "",
    capacity: 1,
    maxWeight: 1,
    lastMaintenance: new Date(),
    nextMaintenance: new Date(),
  });
  const [error, setError] = useState("");
  const progress = ((currentStep + 1) / steps.length) * 100;
  const navigation = useNavigation<DriverApplicationScreenNavigationProp>();
  const { logout } = useAuthStore();

  const handleChange = (name: keyof DriverFormData, value: string | number | Date) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep = () => {
    let isValid = true;
    let errorMessage = "";

    const currentFields = steps[currentStep].fields;
    
    for (const field of currentFields) {
      const value = formData[field as keyof DriverFormData];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errorMessage = `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`;
        isValid = false;
        break;
      }
    }

    if (!isValid) {
      setError(errorMessage);
    } else {
      setError("");
    }

    return isValid;
  };

  const updateUserRoleAndStorage = async () => {
    const { user, token } = useAuthStore.getState();
    
    if (!user || !token) {
      throw new Error('User or token not found');
    }

    const updatedUser = {
      ...user,
      role: [...user.role, 'DRIVER' as const],
      isVerifiedDriver: true
    };

    // Update auth store
    useAuthStore.setState({
      user: updatedUser,
      isVerifiedDriver: true
    });

    // Update AsyncStorage
    const authStorageKey = 'auth-storage';
    try {
      const authStorage = await AsyncStorage.getItem(authStorageKey);
      if (authStorage) {
        const parsedStorage = JSON.parse(authStorage);
        console.log("Current auth storage before update:", parsedStorage);
        parsedStorage.state.user = updatedUser;
        parsedStorage.state.isVerifiedDriver = true;
        await AsyncStorage.setItem(authStorageKey, JSON.stringify(parsedStorage));
        console.log("parsedStorage after adding the data",parsedStorage)

      }
    } catch (error) {
      console.error('Error updating AsyncStorage:', error);
      throw error;
    }
  };

  const handleComplete = async () => {
    try {
      const { token } = useAuthStore.getState();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await api.post('/drivers/register', {
        driver: {
          licenseNumber: formData.licenseNumber,
          licenseType: formData.licenseType,
          licenseExpiry: new Date(formData.licenseExpiry),
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          governorate: formData.governorate,
          phone: formData.phone,
          emergencyContact: formData.emergencyContact,
        },
        vehicle: {
          plateNumber: formData.plateNumber,
          type: formData.vehicleType,
          make: formData.make,
          model: formData.model,
          year: formData.year,
          capacity: formData.capacity,
          maxWeight: formData.maxWeight,
          lastMaintenance: formData.lastMaintenance.toISOString().split('T')[0],
          nextMaintenance: formData.nextMaintenance.toISOString().split('T')[0],
        },
      });

      if (response.data) {
        await updateUserRoleAndStorage();
        
        Alert.alert(
          "Registration Successful!",
          "Your driver account has been created and verified.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate('Main')
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Error registering driver:', error.response?.data);
      
      if (error.response?.data?.message?.includes('plate')) {
        setError("");
        Alert.alert(
          "Registration Failed",
          "A vehicle with this plate number already exists in our system.",
          [
            {
              text: "OK",
              onPress: () => setCurrentStep(3)
            }
          ]
        );
      } else {
        setError("");
        Alert.alert(
          "Registration Error",
          error.response?.data?.message || "Failed to register. Please try again."
        );
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? Your application progress will be lost.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderFormFields = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.formGroup}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={formData.fullName}
                onChangeText={(value) => handleChange('fullName', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                keyboardType="email-address"
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(value) => handleChange('phone', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Emergency Contact</Text>
              <TextInput
                style={styles.input}
                placeholder="Emergency contact phone number"
                keyboardType="phone-pad"
                value={formData.emergencyContact}
                onChangeText={(value) => handleChange('emergencyContact', value)}
              />
              <Text style={styles.helperText}>
                Phone number of someone we can contact in case of emergency
              </Text>
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.formGroup}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Street Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your complete street address"
                value={formData.address}
                onChangeText={(value) => handleChange('address', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your city name"
                value={formData.city}
                onChangeText={(value) => handleChange('city', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Governorate</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.governorate}
                  onValueChange={(value) => handleChange('governorate', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select your governorate" value="" />
                  {TUNISIA_GOVERNORATES.map((governorate) => (
                    <Picker.Item key={governorate} label={governorate} value={governorate} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Postal Code</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your 4-digit postal code"
                keyboardType="number-pad"
                value={formData.postalCode}
                onChangeText={(value) => handleChange('postalCode', value)}
              />
              <Text style={styles.helperText}>
                Standard 4-digit Tunisia postal code
              </Text>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.formGroup}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Driver's License Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your driver's license number"
                value={formData.licenseNumber}
                onChangeText={(value) => handleChange('licenseNumber', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>License Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.licenseType}
                  onValueChange={(value) => handleChange('licenseType', value)}
                  style={styles.picker}
                >
                  {LICENSE_TYPES.map((type) => (
                    <Picker.Item key={type.value} label={type.label} value={type.value} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>License Expiry Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={formData.licenseExpiry}
                onChangeText={(value) => handleChange('licenseExpiry', value)}
              />
              <Text style={styles.helperText}>
                Your license must be valid for at least 6 months
              </Text>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.formGroup}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vehicle Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.vehicleType}
                  onValueChange={(value) => handleChange('vehicleType', value)}
                  style={styles.picker}
                >
                  {VEHICLE_TYPES.map((type) => (
                    <Picker.Item key={type.value} label={type.label} value={type.value} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vehicle Brand</Text>
              <TextInput
                style={styles.input}
                placeholder="Vehicle Manufacturer (e.g., Peugeot, Toyota)"
                value={formData.make}
                onChangeText={(value) => handleChange('make', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vehicle Model</Text>
              <TextInput
                style={styles.input}
                placeholder="Vehicle Model (e.g., 208, Hilux)"
                value={formData.model}
                onChangeText={(value) => handleChange('model', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Manufacturing Year</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter vehicle manufacturing year"
                keyboardType="number-pad"
                value={formData.year.toString()}
                onChangeText={(value) => handleChange('year', parseInt(value) || 0)}
              />
              <Text style={styles.helperText}>
                Vehicle must be from 2015 or newer
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>License Plate Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Format: 123TUN4567"
                value={formData.plateNumber}
                onChangeText={(value) => handleChange('plateNumber', value)}
              />
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.formGroup}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cargo Capacity</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter cargo capacity in cubic meters (m³)"
                keyboardType="decimal-pad"
                value={formData.capacity.toString()}
                onChangeText={(value) => handleChange('capacity', parseFloat(value) || 0)}
              />
              <Text style={styles.helperText}>
                The maximum volume your vehicle can carry in cubic meters (m³)
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Maximum Load Weight</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter maximum weight capacity in kilograms (kg)"
                keyboardType="decimal-pad"
                value={formData.maxWeight.toString()}
                onChangeText={(value) => handleChange('maxWeight', parseFloat(value) || 0)}
              />
              <Text style={styles.helperText}>
                The maximum weight your vehicle can safely carry in kilograms (kg)
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Maintenance Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={formData.lastMaintenance.toISOString().split('T')[0]}
                onChangeText={(value) => handleChange('lastMaintenance', new Date(value))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Next Maintenance Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={formData.nextMaintenance.toISOString().split('T')[0]}
                onChangeText={(value) => handleChange('nextMaintenance', new Date(value))}
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep === steps.length - 1) {
        Alert.alert(
          "Processing Registration",
          "Please wait while we create your driver account...",
          [{ text: "OK" }]
        );
        handleComplete();
      } else {
        setCurrentStep((prev) => prev + 1);
        setError("");
      }
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
    setError("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>{steps[currentStep].title}</Text>
              <Text style={styles.subtitle}>{steps[currentStep].description}</Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={24} color={colors.destructive} />
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
            <Text style={styles.progressText}>
              Step {currentStep + 1} of {steps.length}
            </Text>
          </View>

          <View style={styles.formContainer}>
            {renderFormFields()}
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.previousButton]}
              onPress={handlePrevious}
              disabled={currentStep === 0}
            >
              <Text style={styles.buttonText}>Previous</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.nextButton]}
              onPress={handleNext}
            >
              <Text style={styles.buttonText}>
                {currentStep === steps.length - 1 ? "Apply" : "Next"}
              </Text>
            </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
  },
  logoutButton: {
    padding: 8,
    marginLeft: 16,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  formGroup: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.input,
    borderRadius: 8,
    padding: 12,
    color: colors.foreground,
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: colors.input,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    color: colors.foreground,
    height: 50,
  },
  helperText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  previousButton: {
    backgroundColor: colors.secondary,
  },
  nextButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
}); 


