import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const EarningsScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold text-foreground">Earnings</Text>
      </View>
    </SafeAreaView>
  );
};
