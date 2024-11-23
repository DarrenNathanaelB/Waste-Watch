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
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';

export default function App() {
  const initialRegion = {
    latitude: -6.3628,         // Latitude for Universitas Indonesia
    longitude: 106.8269,      // Longitude for Universitas Indonesia
    latitudeDelta: 0.01,      // Zoom level (smaller value = closer zoom)
    longitudeDelta: 0.01,     // Zoom level
  };  
  
  return (
		<View style={{ flex: 1 }}>
			<MapView 
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE} 
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton={true}
      />
		</View>
	);
} 