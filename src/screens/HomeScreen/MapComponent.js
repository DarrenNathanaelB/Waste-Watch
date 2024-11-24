import React, { useState } from "react";
import { Alert, Text, View, StyleSheet, TouchableOpacity } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { markers } from "../../../assets/markers";
import * as Linking from "expo-linking";

const MapComponent = () => {
  const [selectedMarker, setSelectedMarker] = useState(null);

  const initialRegion = {
    latitude: -6.3628,
    longitude: 106.8269,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const handleMarkerPress = (marker) => {
    setSelectedMarker(marker);
  };

  const handleNavigateToBin = (marker) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${marker.latitude},${marker.longitude}`;
    Linking.openURL(url); // Buka Google Maps
    closeInfoContainer(); // Tutup infoContainer
  };

  const handleGetBinInfo = () => {
    Alert.alert("Bin Info", `Details for bin: ${selectedMarker.name}`);
    closeInfoContainer(); // Tutup infoContainer
  };

  const handleEmptyBin = () => {
    Alert.alert("Empty Bin", "Bin weight has been reset to 0!");
    closeInfoContainer(); // Tutup infoContainer
  };

  const closeInfoContainer = (  ) => {
    setSelectedMarker(null);
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {markers.map((marker, index) => (
          <Marker
            key={index}
            title={marker.name}
            coordinate={marker}
            onPress={() => handleMarkerPress(marker)}
          />
        ))}
      </MapView>

      {selectedMarker && (
        <View style={styles.infoContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
                closeInfoContainer(); // Pastikan ini dipanggil
            }}
          >
            <Text style={styles.closeText}>X</Text>
          </TouchableOpacity>

          <Text style={styles.infoTitle}>{selectedMarker.name}</Text>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => handleNavigateToBin(selectedMarker)}
          >
            <Text style={styles.infoButtonText}>Navigate to Bin</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={handleGetBinInfo}
          >
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

const styles = StyleSheet.create({
    // Info container remains the same
    infoContainer: {
      position: "absolute",
      bottom: 120, // Distance from the bottom (above the navbar)
      left: 20,
      right: 20,
      backgroundColor: "white",
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
      borderRadius: 30, // Bigger radius to make it more visible
      paddingHorizontal: 15, // Increase horizontal padding
      paddingVertical: 10, // Increase vertical padding
      justifyContent: "center", // Center the content vertically
      alignItems: "center", // Center the content horizontally
    },
    closeText: {
      fontSize: 18, // Increase font size for better visibility
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
      backgroundColor: "#007AFF",
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
