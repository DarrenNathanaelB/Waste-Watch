import React, { useState, useEffect, useRef } from "react";
import { Alert, Text, View, StyleSheet, TouchableOpacity } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Linking from "expo-linking";
import { getDatabase, ref, onValue } from "firebase/database";
import { useNavigation } from "@react-navigation/native";
import { app } from "../../firebase/config.js";
import Icon from 'react-native-vector-icons/Ionicons';
import { getAuth, signOut } from 'firebase/auth';

const MapComponent = ({ route }) => {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [markers, setMarkers] = useState([]);
  const navigation = useNavigation();
  const mapRef = useRef(null);

  const initialRegion = {
    latitude: -6.3628,
    longitude: 106.8269,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  // Function to animate to initial region
  const resetMapPosition = () => {
    mapRef.current?.animateToRegion(initialRegion, 1000);
  };

  // Listen for navigation params
  useEffect(() => {
    if (route?.params?.resetMap) {
      resetMapPosition();
      // Clear the parameter after using it
      navigation.setParams({ resetMap: undefined });
    }
  }, [route?.params?.resetMap]);

  // Your existing useEffect for Firebase data
  useEffect(() => {
    const db = getDatabase(app);
    const rootRef = ref(db, "/");

    const unsubscribe = onValue(rootRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const markerData = Object.keys(data)
          .filter((key) => key.startsWith("tong"))
          .map((key) => {
            const sensor = data[key]?.sensor;
            return {
              name: key.toUpperCase(),
              latitude: sensor?.latitude || 0,
              longitude: sensor?.longitude || 0,
              battery: sensor?.battery || 0,
              weight: sensor?.weight || 0,
            };
          });
        setMarkers(markerData);
      } else {
        console.log("No data available");
      }
    });

    return () => unsubscribe();
  }, []);

  // Rest of your existing component code...
  const handleMarkerPress = (marker) => {
    setSelectedMarker(marker);
  };

  const handleNavigateToBin = () => {
    if (selectedMarker) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedMarker.latitude},${selectedMarker.longitude}`;
      Linking.openURL(url);
      setSelectedMarker(null);
    }
  };

  const handleGetBinInfo = () => {
    if (selectedMarker) {
      Alert.alert("Bin Info", `Details for bin: ${selectedMarker.name}`);
      setSelectedMarker(null);
    }
  };

  const handleEmptyBin = () => {
    if (selectedMarker) {
      Alert.alert("Empty Bin", "Bin weight has been reset to 0!");
      setSelectedMarker(null);
    }
  };

  const handleViewDetails = () => {
    if (selectedMarker) {
      navigation.navigate("BinDetailsPage", { binName: selectedMarker.name.toLowerCase() });
      setSelectedMarker(null);
    }
  };

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth).then(() => {
      console.log('User signed out!');
      navigation.navigate('Login');
    }).catch((error) => {
      console.error('Error signing out: ', error);
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleLogout} style={styles.logoutIcon}>
          <Icon name="arrow-back" size={24} color="#866A42" />
      </TouchableOpacity>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {markers.map((marker, index) => (
          <Marker
            key={index}
            title={marker.name}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            onPress={() => handleMarkerPress(marker)}
          />
        ))}
      </MapView>

      {selectedMarker && (
        <View style={styles.infoContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedMarker(null)}
          >
            <Text style={styles.closeText}>X</Text>
          </TouchableOpacity>

          <Text style={styles.infoTitle}>{selectedMarker.name}</Text>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={handleNavigateToBin}
          >
            <Text style={styles.infoButtonText}>Navigate to Bin</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.infoButton} onPress={handleViewDetails}>
            <Text style={styles.infoButtonText}>Get Bin Info</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.infoButton} onPress={handleEmptyBin}>
            <Text style={styles.infoButtonText}>Empty Bin</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Add the missing styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#FFF5E4',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    padding: 5,
  },
  closeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  infoButton: {
    backgroundColor: '#6D4C41',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  infoButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  logoutIcon: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    backgroundColor: '#ffe8ad',
    borderRadius: 20,
    padding: 5,
    elevation: 5,
  },
});

export default MapComponent;