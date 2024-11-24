// import React, { useState, useEffect } from 'react';
// import { StyleSheet, View, Text, ActivityIndicator, Button } from 'react-native';
// import { getDatabase, ref, onValue } from 'firebase/database';
// import { getAuth, signOut } from 'firebase/auth';
// import MapView from 'react-native-maps';
// import styles from './styles';

// export default function HomeScreen() {
//     const [sensorData, setSensorData] = useState(null);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const database = getDatabase();
//         const sensorRef = ref(database, 'sensor');
//         onValue(sensorRef, (snapshot) => {
//             const data = snapshot.val();
//             setSensorData(data);
//             setLoading(false);
//         }, (error) => {
//             console.error("Error fetching sensor data: ", error);
//             setLoading(false);
//         });
//     }, []);

//     const handleLogout = () => {
//         const auth = getAuth();
//         signOut(auth).then(() => {
//             console.log('User signed out!');
//         }).catch((error) => {
//             console.error('Error signing out: ', error);
//         });
//     };

//     return (
//         <View style={styles.container}>
//             <MapView style={StyleSheet.absoluteFill} />
//             {loading && <ActivityIndicator size="large" color="#0000ff" />}
//             {sensorData && (
//                 <View style={styles.sensorContainer}>
//                     <Text>Battery: {sensorData.battery}</Text>
//                     <Text>Distance: {sensorData.distance}</Text>
//                     <Text>Weight: {sensorData.weight}</Text>
//                 </View>
//             )}
//             <Button title="Log Out" onPress={handleLogout} />
//         </View>
//     );
// }

import React from 'react';
import { Text, Image, View, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import FinishDayScreen from '../FinishDayScreen/FinishDayScreen';
import StatisticsScreen from '../StatisticsScreen/StatisticsScreen';

// Bottom Tab Navigator
const Tab = createBottomTabNavigator();

const MapComponent = () => {
  const initialRegion = {
    latitude: -6.3628, // Latitude for Universitas Indonesia
    longitude: 106.8269, // Longitude for Universitas Indonesia
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      />
    </View>
  );
};

export default function HomeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={( ) => ({
          headerShown: false, // No headers for tabs
          tabBarStyle: {
            backgroundColor: '#fffae8',
            height: 80, // Make navbar taller
            borderTopLeftRadius: 30, // Rounded corners on top
            borderTopRightRadius: 30, // Rounded corners on top
            position: 'absolute', // Position navbar properly
            left: 0,
            right: 0,
            bottom: 0,
            elevation: 10, // Optional: for shadow effect
          },
        })}
      >
        <Tab.Screen
          name="Map"
          component={MapComponent}
          options={{
            tabBarLabel: '',
            tabBarIcon: ({ focused }) => (
              <View style={styles.tabItem}>
                <Image
                  source={require('../../../assets/home.png')}
                  style={[
                    styles.icon,
                    { tintColor: focused ? '#007AFF' : '#8E8E93', width: 30, height: 30 },
                  ]}
                />
                <View style={styles.labelWrapper}>
                  <Text style={{ fontSize: 11, marginTop: 4, textAlign: 'center' }}>
                    Home
                  </Text>
                </View>
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="Finish Day"
          component={FinishDayScreen}
          options={{
            tabBarLabel: '',
            tabBarButton: ( props ) => (
              <TouchableOpacity
                {...props}
                style={[
                  styles.centerButton, props.style, { backgroundColor: '#ffe8ad' },
                ]} 
              >
                <Image
                  source={require('../../../assets/finishDay.png')}
                  style={styles.centerIcon}
                />
              </TouchableOpacity>
            ),
          }}
        />
        <Tab.Screen
          name="Statistics"
          component={StatisticsScreen}
          options={{ 
            tabBarLabel: '',
            tabBarIcon: ({ focused }) => (
              <View style={styles.tabItem}>
                <Image
                  source={require('../../../assets/statistics.png')}
                  style={[
                    styles.icon,
                    { tintColor: focused ? '#007AFF' : '#8E8E93', width: 30, height: 30 },
                  ]}
                />
                <View style={styles.labelWrapper}>
                  <Text style={{ fontSize: 11, marginTop: 4, textAlign: 'center' }}>
                    Stats
                  </Text>
                </View>
              </View>
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 24, // Default icon size
    height: 24,
    marginTop: 45, 
    resizeMode: 'contain', // Ensure the icon fits nicely
  },
  centerButton: {
    position: 'absolute',
    top: -15, // Mendorong sedikit ke atas
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 30, // Rounded corners di bagian atas
    borderTopRightRadius: 30,
    justifyContent: 'center', // Memusatkan konten secara vertikal
    alignItems: 'center', // Memusatkan konten secara horizontal
    zIndex: 1, // Pastikan elemen ini berada di atas elemen lainnya
    elevation: 5, // Shadow untuk Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
  },
  centerIcon: {
    width: 50, // Bigger icon for center button
    height: 50,
    resizeMode: 'contain',
    marginTop: 20,
    alignSelf: 'center',
  },
});
