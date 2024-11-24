import React, { useState, useEffect } from "react";
import { Alert, Text, View, StyleSheet, TouchableOpacity } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Linking from "expo-linking";
import { getDatabase, ref, onValue } from "firebase/database";
import { useNavigation } from "@react-navigation/native";
import { app } from "../../firebase/config.js"; // Pastikan ini adalah file konfigurasi Firebase Anda

const MapComponent = React.forwardRef((props, ref) => {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [markers, setMarkers] = useState([]);
  const navigation = useNavigation();

  const initialRegion = {
    latitude: -6.3628,
    longitude: 106.8269,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  // Fungsi untuk memuat data dari Firebase
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

  const handleMarkerPress = (marker) => {
    setSelectedMarker(marker);
  };

  const handleNavigateToBin = () => {
    if (selectedMarker) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedMarker.latitude},${selectedMarker.longitude}`;
      Linking.openURL(url); // Buka Google Maps
      setSelectedMarker(null); // Tutup infoContainer
    }
  };

  const handleGetBinInfo = () => {
    if (selectedMarker) {
      Alert.alert("Bin Info", `Details for bin: ${selectedMarker.name}`);
      setSelectedMarker(null); // Tutup infoContainer
    }
  };

  const handleEmptyBin = () => {
    if (selectedMarker) {
      Alert.alert("Empty Bin", "Bin weight has been reset to 0!");
      setSelectedMarker(null); // Tutup infoContainer
    }
  };

  const handleViewDetails = () => {
    if (selectedMarker) {
      navigation.navigate("BinDetailsPage", { binName: selectedMarker.name.toLowerCase() });
      setSelectedMarker(null); // Tutup infoContainer
    }
  };

  return (
    <View style={styles.container}>
      <MapView
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
            onPress={() => setSelectedMarker(null)} // Tutup infoContainer
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
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  infoContainer: {
    position: "absolute",
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: "#F8E9D3",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  infoButton: {
    backgroundColor: "#6D4C41",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginVertical: 5,
    alignItems: "center",
  },
  infoButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default MapComponent;
