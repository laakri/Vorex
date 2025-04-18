import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const VehicleInfoScreen = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'background' }}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'foreground' }}>Vehicle Info</Text>
      </View>
    </SafeAreaView>
  );
}