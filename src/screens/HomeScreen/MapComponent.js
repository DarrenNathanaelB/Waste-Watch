import React, { useState, useEffect, useRef } from "react";
import {
  Alert,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Linking from "expo-linking";
import { getDatabase, get, ref, onValue, update } from "firebase/database";
import { useNavigation } from "@react-navigation/native";
import { app } from "../../firebase/config.js";
import Icon from "react-native-vector-icons/Ionicons";
import { getAuth, signOut } from "firebase/auth";

const MapComponent = ({ route }) => {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentWeight, setCurrentWeight] = useState(null);
  const [thresholdReached, setThresholdReached] = useState(false);
  const [initialWeight, setInitialWeight] = useState(null);
  const navigation = useNavigation();
  const mapRef = useRef(null);

  const initialRegion = {
    latitude: -6.3628,
    longitude: 106.8269,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const resetMapPosition = () => {
    mapRef.current?.animateToRegion(initialRegion, 1000);
  };

  useEffect(() => {
    if (route?.params?.resetMap) {
      resetMapPosition();
      navigation.setParams({ resetMap: undefined });
    }
  }, [route?.params?.resetMap]);

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

  const handleEmptyBin = () => {
    if (selectedMarker) {
      const db = getDatabase(app);
      const binRef = ref(db, `${selectedMarker.name.toLowerCase()}/sensor`);
  
      // Dapatkan data dari database sekali
      get(binRef).then((snapshot) => {
        if (snapshot.exists()) {
          const weight = snapshot.val()?.weight || 0;
          if (initialWeight === null) {
            setInitialWeight(weight); // Simpan berat awal hanya sekali
          }
        } else {
          Alert.alert("Error", "Data not available.");
        }
      });

      onValue(binRef, (snapshot) => {
        if (snapshot.exists()) {
          const weight = snapshot.val()?.weight || 0;
  
          setCurrentWeight(weight); // Set berat saat ini
          setThresholdReached(weight < 1); // Cek apakah berat di bawah threshold
        } else {
          Alert.alert("Error", "Data not available.");
        }
      });
  
      setModalVisible(true); // Tampilkan modal
    }
  };
  
  const handleConfirmEmptyBin = () => {
    if (selectedMarker) {
      const db = getDatabase(app);
      const binRef = ref(db, `${selectedMarker.name.toLowerCase()}/sensor`);
  
      // Dapatkan data dari database sekali
      get(binRef).then((snapshot) => {
        if (snapshot.exists()) {
          const currentData = snapshot.val();
          const finalWeight = currentData?.weight || 0; // Berat setelah pengosongan
  
          const weightLifted = initialWeight - finalWeight; // Berat sampah yang diangkat
  
          if (weightLifted > 0) {
            const collectedWeight = currentData?.collectedWeight || 0; // Berat total sebelumnya
            const updatedCollectedWeight = collectedWeight + weightLifted; // Tambahkan berat yang diangkat
  
            // Perbarui collectedWeight di database
            update(ref(db, `${selectedMarker.name.toLowerCase()}/sensor`), {
              collectedWeight: updatedCollectedWeight,
            });
  
            // Tampilkan notifikasi berhasil
            Alert.alert(
              "Success",
              `Terima kasih sudah mengangkat sampahnya! Total sampah yang diangkat: ${weightLifted.toFixed(2)} kg`
            );
  
            // Reset state setelah modal ditutup
            setModalVisible(false);
            setSelectedMarker(null);
            setInitialWeight(null); // Reset berat awal untuk tong berikutnya
          } else {
            Alert.alert("Error", "Weight lifted must be greater than 0.");
          }
        } else {
          Alert.alert("Error", "Failed to retrieve bin data.");
        }
      });
    }
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

  const handleViewDetails = () => {
    if (selectedMarker) {
      navigation.navigate("BinDetailsPage", { binName: selectedMarker.name.toLowerCase() });
      setSelectedMarker(null);
    }
  };

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        console.log("User signed out!");
        navigation.navigate("Login");
      })
      .catch((error) => {
        console.error("Error signing out: ", error);
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

      {/* Popup Modal */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Silahkan Kosongkan Tempat Sampah</Text>
            <Text style={styles.modalText}>
              Berat tempat sampah saat ini: {currentWeight} kg 
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  !thresholdReached && { backgroundColor: "gray" },
                ]}
                onPress={handleConfirmEmptyBin}
                disabled={!thresholdReached}
              >
                <Text style={styles.buttonText}>Konfirmasi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: "100%", height: "100%" },
  infoContainer: { 
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: "#FFF5E4",
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  closeButton: { position: "absolute", right: 10, top: 10, padding: 5 },
  closeText: { fontSize: 18, fontWeight: "bold" },
  infoTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  infoButton: { backgroundColor: "#6D4C41", padding: 10, borderRadius: 5, marginVertical: 5 },
  infoButtonText: { color: "white", textAlign: "center", fontSize: 16 },
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