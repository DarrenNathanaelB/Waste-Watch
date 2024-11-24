import React, { useState, useRef } from "react";
import { Alert, Text, View, StyleSheet, TouchableOpacity } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { markers } from "../../../assets/markers";
import * as Linking from "expo-linking";

const MapComponent = React.forwardRef((props, ref) => {
  const [selectedMarker, setSelectedMarker] = useState(null);

  const initialRegion = {
    latitude: -6.3628,
    longitude: 106.8269,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const mapRef = useRef(null); // Ref untuk MapView
  React.useImperativeHandle(ref, () => ({
    resetToInitialRegion: () => {
      mapRef.current.animateToRegion(initialRegion, 1000);
    },
  }));

  const handleMarkerPress = (marker) => {
    setSelectedMarker(marker);
  };

  const handleNavigateToBin = (marker) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${marker.latitude},${marker.longitude}`;
    Linking.openURL(url);
    closeInfoContainer();
  };

  const handleGetBinInfo = () => {
    Alert.alert("Bin Info", `Details for bin: ${selectedMarker.name}`);
    closeInfoContainer();
  };

  const handleEmptyBin = () => {
    Alert.alert("Empty Bin", "Bin weight has been reset to 0!");
    closeInfoContainer();
  };

  const closeInfoContainer = () => {
    setSelectedMarker(null);
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
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
          <View style={styles.header}>
            <TouchableOpacity onPress={closeInfoContainer}>
              <Text style={styles.closeText}>X</Text>
            </TouchableOpacity>
            <Text style={styles.infoTitle}>{selectedMarker.name}</Text>
          </View>

          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => handleNavigateToBin(selectedMarker)}
          >
            <Text style={styles.infoButtonText}>Navigate to Bin</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.infoButton} onPress={handleGetBinInfo}>
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
  header: {
    flexDirection: "row", // Membuat nama dan tombol X berada dalam satu baris
    justifyContent: "space-between", // Mengatur tombol X ke sebelah kanan
    alignItems: "center", // Menjaga agar nama dan tombol X sejajar secara vertikal
  },
  closeText: {
    fontSize: 14, 
    color: "#555",
    marginBottom: 10,
    left: 5, // Mendorong tombol X ke kiri
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center", // Agar nama berada di tengah secara horizontal
    left: -5, // Mendorong nama ke kiri
    flex: 1, // Mengambil ruang yang tersisa di tengah
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
