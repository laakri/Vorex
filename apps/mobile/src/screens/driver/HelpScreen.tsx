import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export const HelpScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Help Center</Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.button}>
            <Ionicons name="help-circle-outline" size={24} color="#fff" />
            <Text style={styles.buttonText}>FAQs</Text>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.button}>
            <Ionicons name="call-outline" size={24} color="#fff" />
            <Text style={styles.buttonText}>Contact Support</Text>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.button}>
            <Ionicons name="document-text-outline" size={24} color="#fff" />
            <Text style={styles.buttonText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.button}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#fff" />
            <Text style={styles.buttonText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    marginTop: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  buttonText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    color: '#fff',
  },
}); 