import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth.store';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';

type ProfileScreenNavigationProp = NativeStackNavigationProp<any, 'ProfileMain'>;

export const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout, isVerifiedDriver } = useAuthStore();

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
          onPress: async () => {
            await logout();
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Format a role from UPPERCASE_WITH_UNDERSCORES to Normal Case
  const formatRole = (role: string) => {
    return role
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* User info card */}
        <View style={styles.userInfoCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            {isVerifiedDriver && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color="white" />
              </View>
            )}
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.fullName || 'Unknown User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
            
            <View style={styles.rolesContainer}>
              {user?.role && user.role.length > 0 ? (
                user.role.map((role, index) => (
                  <View key={index} style={styles.roleBadge}>
                    <Text style={styles.roleText}>{formatRole(role)}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>No role assigned</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Navigation section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('History')}
          >
            <View style={[styles.iconContainer, styles.iconHistory]}>
              <Ionicons name="time-outline" size={20} color="white" />
            </View>
            <Text style={styles.buttonText}>Delivery History</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Vehicle')}
          >
            <View style={[styles.iconContainer, styles.iconVehicle]}>
              <Ionicons name="car-outline" size={20} color="white" />
            </View>
            <Text style={styles.buttonText}>Vehicle Information</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Settings')}
          >
            <View style={[styles.iconContainer, styles.iconSettings]}>
              <Ionicons name="settings-outline" size={20} color="white" />
            </View>
            <Text style={styles.buttonText}>App Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Account Actions</Text>
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleLogout}
          >
            <View style={[styles.iconContainer, styles.iconLogout]}>
              <Ionicons name="log-out-outline" size={20} color="white" />
            </View>
            <Text style={styles.logoutText}>Disconnect Account</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.destructive} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>App Version 1.0.0</Text>
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  userInfoCard: {
    backgroundColor: colors.secondary,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.success,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  userEmail: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  roleBadge: {
    backgroundColor: `${colors.primary}30`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    color: colors.foreground,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 16,
  },
  section: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.muted}30`,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconHistory: {
    backgroundColor: '#3b82f6', // blue
  },
  iconVehicle: {
    backgroundColor: '#10b981', // green
  },
  iconSettings: {
    backgroundColor: '#6366f1', // indigo
  },
  iconLogout: {
    backgroundColor: '#ef4444', // red
  },
  buttonText: {
    flex: 1,
    fontSize: 16,
    color: colors.foreground,
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    color: colors.destructive,
  },
  footer: {
    marginTop: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.muted,
  },
}); 