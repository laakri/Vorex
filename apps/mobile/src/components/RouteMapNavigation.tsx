import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Modal,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import * as Location from 'expo-location';

interface RouteMapNavigationProps {
  visible: boolean;
  onClose: () => void;
  nextStop: {
    latitude: number;
    longitude: number;
    address: string;
    isPickup: boolean;
  } | null;
}

export const RouteMapNavigation: React.FC<RouteMapNavigationProps> = ({
  visible,
  onClose,
  nextStop,
}) => {
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  const handleOpenMaps = async () => {
    if (!nextStop) return;
    
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${nextStop.latitude},${nextStop.longitude}`;
    const label = nextStop.isPickup ? 'Pickup Location' : 'Delivery Location';
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    try {
      await Linking.openURL(url!);
    } catch (error) {
      console.error('Error opening maps:', error);
      Alert.alert('Error', 'Could not open maps application');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.title}>Navigation</Text>
        </View>

        <View style={styles.mapContainer}>
          {errorMsg ? (
            <Text style={styles.errorText}>{errorMsg}</Text>
          ) : (
            <MapView
              style={styles.map}
              initialRegion={
                currentLocation
                  ? {
                      latitude: currentLocation.latitude,
                      longitude: currentLocation.longitude,
                      latitudeDelta: 0.0922,
                      longitudeDelta: 0.0421,
                    }
                  : undefined
              }
            >
              {currentLocation && (
                <Marker
                  coordinate={{
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                  }}
                  title="Your Location"
                  pinColor={colors.primary}
                />
              )}
              {nextStop && (
                <Marker
                  coordinate={{
                    latitude: nextStop.latitude,
                    longitude: nextStop.longitude,
                  }}
                  title={nextStop.isPickup ? 'Pickup Location' : 'Delivery Location'}
                  description={nextStop.address}
                  pinColor={colors.success}
                />
              )}
            </MapView>
          )}
        </View>

        {nextStop && (
          <View style={styles.footer}>
            <View style={styles.stopInfo}>
              <Ionicons
                name={nextStop.isPickup ? 'arrow-down' : 'arrow-up'}
                size={20}
                color={colors.foreground}
              />
              <Text style={styles.stopType}>
                {nextStop.isPickup ? 'Pickup' : 'Delivery'}
              </Text>
              <Text style={styles.stopAddress}>{nextStop.address}</Text>
            </View>
            <TouchableOpacity
              style={styles.navigateButton}
              onPress={handleOpenMaps}
            >
              <Ionicons name="navigate" size={20} color={colors.foreground} />
              <Text style={styles.navigateButtonText}>Open in Maps</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.foreground,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: '100%',
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    padding: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 16,
  },
  stopInfo: {
    gap: 8,
  },
  stopType: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.foreground,
  },
  stopAddress: {
    fontSize: 14,
    color: colors.textMuted,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
  },
  navigateButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
}); 