import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export const Logo = ({ size = 'md' }: LogoProps) => {
  const sizes = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  const fontSize = {
    sm: 20,
    md: 24,
    lg: 32,
  };

  const iconSize = sizes[size];
  const textSize = fontSize[size];

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {/* Background shape */}
        <View style={styles.backgroundShape} />
        <View style={styles.iconWrapper}>
          <View style={styles.iconBackground}>
            <MaterialCommunityIcons 
              name="package-variant" 
              size={iconSize} 
              color={colors.text} 
            />
            <MaterialCommunityIcons 
              name="magnify" 
              size={iconSize * 0.7} 
              color={colors.primary}
              style={styles.searchIcon}
            />
          </View>
        </View>
      </View>
      <Text style={[styles.text, { fontSize: textSize }]}>
        Vorex<Text style={styles.primaryDot}>.</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    position: 'relative',
  },
  backgroundShape: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 8,
    backgroundColor: colors.primary + '20',
  },
  iconWrapper: {
    position: 'relative',
    borderRadius: 8,
    backgroundColor: colors.background,
    padding: 6,
  },
  iconBackground: {
    position: 'relative',
    backgroundColor: colors.primary,
    borderRadius: 4,
    padding: 4,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -10 }, { translateY: -10 }],
  },
  text: {
    fontWeight: 'bold',
    color: colors.text,
  },
  primaryDot: {
    color: colors.primary,
  },
}); 