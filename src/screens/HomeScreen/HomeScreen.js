import React, { useState, useEffect } from 'react';
import { Text, Image, View, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MapComponent from './MapComponent';
import StatisticsScreen from '../StatisticsScreen/StatisticsScreen';
import { get, getDatabase, ref, push, set, update } from "firebase/database";
import { app } from '../../firebase/config.js';

const Tab = createBottomTabNavigator();

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);

  // Function to get last update date from Firebase
  const getLastUpdateDate = async () => {
    try {
      const db = getDatabase(app);
      const lastUpdateRef = ref(db, 'last_update_date');
      const snapshot = await get(lastUpdateRef);
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;  // Return null if there's no data
    } catch (error) {
      console.error("Error fetching last update date:", error);
      return null;
    }
  };

  // Function to save current date as last update date in Firebase
  const saveLastUpdateDate = async () => {
    try {
      const db = getDatabase(app);
      const lastUpdateRef = ref(db, 'last_update_date');
      const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      await set(lastUpdateRef, today);
    } catch (error) {
      console.error("Error saving last update date:", error);
    }
  };

  // Function to reset collectedWaste to 0 if today is Monday or new week
  const resetCollectedWasteIfNewWeek = async () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const currentDate = today.toISOString().split('T')[0]; // Current date in YYYY-MM-DD format

    // Check if today is Monday or if it's a new week
    const lastUpdate = await getLastUpdateDate();
    
    if (lastUpdate && lastUpdate !== currentDate) { // If the last update is different from today
      // Check if today is Monday (1) or if a new week has started
      if (dayOfWeek === 1) {
        try {
          const db = getDatabase(app);
          const dataRef = ref(db);

          // Loop through all tong and reset their collectedWeight to 0
          const snapshot = await get(dataRef);

          if (snapshot.exists()) {
            const data = snapshot.val();
            const updates = {};

            Object.keys(data).forEach((tongId) => {
              if (tongId.startsWith('tong')) {
                updates[`${tongId}/sensor/collectedWeight`] = 0; // Reset collectedWeight to 0
              }
            });

            // Apply the updates to Firebase
            await update(ref(db), updates);
            Alert.alert("Data Reset", "Data collectedWaste telah direset ke 0.");
          }
        } catch (error) {
          console.error("Error resetting collectedWaste:", error);
          Alert.alert("Error", "Gagal mereset collectedWaste.");
        }

        // Save the current date as the new last update date
        await saveLastUpdateDate();
      }
    }
  };

  // Function to save daily total to historical data
  const saveDailyTotal = async (totalWeight) => {
    try {
      const db = getDatabase(app);
      const historicalRef = ref(db, 'historical_weights');
      const today = new Date().toISOString().split('T')[0];

      // Create new entry
      const newDayRef = push(historicalRef);
      await set(newDayRef, {
        date: today,
        totalWeight: totalWeight
      });
    } catch (error) {
      console.error("Error saving historical data:", error);
      Alert.alert("Error", "Failed to save historical data");
    }
  };

  // Function to get current weights from Firebase
  const getCurrentWeights = async () => {
    try {
      const db = getDatabase(app);
      const snapshot = await get(ref(db, '/'));

      if (snapshot.exists()) {
        const data = snapshot.val();
        const tongWeights = [];

        Object.keys(data).forEach((tongId) => {
          if (tongId.startsWith('tong')) { // Hanya memproses data tong
            const tongData = data[tongId]?.sensor;
            if (tongData?.collectedWeight) {
              const weight = parseFloat(tongData.collectedWeight) || 0;
              tongWeights.push({ id: tongId, weight });
            }
          }
        });

        return tongWeights;
      }

      return [];
    } catch (error) {
      console.error("Error fetching current weights:", error);
      Alert.alert("Error", "Failed to fetch current weights");
      return [];
    }
  };

  // Function to calculate daily data and update chart
  const handleFinishDay = async () => {
    setModalVisible(false);
    try {
      const tongWeights = await getCurrentWeights();

      if (tongWeights.length > 0) {
        // Calculate total weight for today
        const totalWeight = tongWeights.reduce((sum, item) => sum + item.weight, 0);

        // Save to historical data
        await saveDailyTotal(totalWeight);

        Alert.alert("Success", "Data berhasil diperbarui");
      } else {
        Alert.alert("Info", "Tidak ada data baru ditemukan");
      }
    } catch (error) {
      console.error("Error calculating daily data:", error);
      Alert.alert("Error", "Gagal memperbarui data");
    }
  };

  useEffect(() => {
    // Check for new week or Monday when app is opened
    resetCollectedWasteIfNewWeek();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ navigation, route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#fffae8',
            height: 80,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            elevation: 10,
          },
        })}
      >
        <Tab.Screen
          name="Map"
          component={MapComponent}
          options={({ navigation }) => ({
            tabBarLabel: '',
            tabBarIcon: ({ focused }) => (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('Map', { resetMap: true });
                }}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image
                  source={require('../../../assets/home.png')}
                  style={{
                    width: 30,
                    height: 30,
                    marginTop: 45,
                    resizeMode: 'contain',
                    tintColor: focused ? '#007AFF' : '#8E8E93',
                  }}
                />
                <Text style={{ fontSize: 11, marginTop: 4, textAlign: 'center' }}>
                  Home
                </Text>
              </TouchableOpacity>
            ),
          })}
        />
        <Tab.Screen
          name="Finish Day"
          options={{
            tabBarLabel: '',
            tabBarButton: (props) => (
              <>
                <TouchableOpacity
                  {...props}
                  onPress={() => setModalVisible(true)}
                  style={{
                    position: 'absolute',
                    top: -15,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: '#ffe8ad',
                    borderTopLeftRadius: 30,
                    borderTopRightRadius: 30,
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1,
                    elevation: 5,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.5,
                  }}
                >
                  <Image
                    source={require('../../../assets/finishDay.png')}
                    style={{
                      width: 50,
                      height: 50,
                      resizeMode: 'contain',
                      marginTop: 10,
                    }}
                  />
                </TouchableOpacity>

                {/* Popup Modal */}
                <Modal
                  transparent={true}
                  animationType="fade"
                  visible={modalVisible}
                  onRequestClose={() => setModalVisible(false)}
                >
                  <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                      <Text style={styles.modalTitle}>Konfirmasi</Text>
                      <Text style={styles.modalText}>
                        Apakah Anda Yakin Sudah Menyelesaikan Pekerjaan Hari Ini?
                      </Text>
                      <View style={styles.buttonContainer}>
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => setModalVisible(false)}
                        >
                          <Text style={styles.buttonText}>Batal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.confirmButton}
                          onPress={handleFinishDay}
                        >
                          <Text style={styles.buttonText}>Selesaikan</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              </>
            ),
          }}
        >
          {/* Children kosong karena layar ini tidak digunakan */}
          {() => null}
        </Tab.Screen>
        <Tab.Screen
          name="Statistics"
          component={StatisticsScreen}
          options={{
            tabBarLabel: '',
            tabBarIcon: ({ focused }) => (
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Image
                  source={require('../../../assets/statistics.png')}
                  style={{
                    width: 30,
                    height: 30,
                    marginTop: 45,
                    resizeMode: 'contain',
                    tintColor: focused ? '#007AFF' : '#8E8E93',
                  }}
                />
                <Text style={{ fontSize: 11, marginTop: 4, textAlign: 'center' }}>
                  Stats
                </Text>
              </View>
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: '#866A42',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  confirmButton: {
    backgroundColor: '#FFC107',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
