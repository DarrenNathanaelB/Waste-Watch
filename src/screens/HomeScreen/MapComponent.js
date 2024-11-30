import React, { useState, useEffect, useRef } from "react";
import {
  Alert,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
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
  const [userLocation, setUserLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);

  const navigation = useNavigation();
  const mapRef = useRef(null);

  // Ganti dengan GOOGLE_MAPS_API_KEY milik Anda
  const GOOGLE_MAPS_API_KEY = 'AIzaSyAJx87nta76WLdlVkvRsYwO3t5mxNxByMc'; 

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

  // Fungsi untuk mendapatkan rute
  const fetchRoute = async (origin, destination) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
  
      if (data.routes.length > 0) {
        const points = data.routes[0].overview_polyline.points;
        const decodedPoints = decodePolyline(points);
        setRouteCoordinates(decodedPoints);
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  // Fungsi untuk mendekode polyline
  const decodePolyline = (encoded) => {
    let points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charAt(index++).charCodeAt(0) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charAt(index++).charCodeAt(0) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 100000,
        longitude: lng / 100000
      });
    }
    return points;
  };

  // Fungsi untuk mendapatkan lokasi pengguna secara real-time
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      const locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 10,
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          setUserLocation({ latitude, longitude });

          // Update rute jika sedang navigasi
          if (isNavigating && selectedMarker) {
            fetchRoute(
              { latitude, longitude }, 
              { 
                latitude: selectedMarker.latitude, 
                longitude: selectedMarker.longitude 
              }
            );
          }
        }
      );

      return () => {
        if (locationSubscription) {
          locationSubscription.remove();
        }
      };
    })();
  }, [isNavigating, selectedMarker]);

  // Fungsi dari kode asli tetap sama
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
    setRouteCoordinates([]); // Reset rute saat marker baru dipilih
    setIsNavigating(false);
  };

  const handleEmptyBin = () => {
    if (selectedMarker) {
      const db = getDatabase(app);
      const binRef = ref(db, `${selectedMarker.name.toLowerCase()}/sensor`);
  
      get(binRef).then((snapshot) => {
        if (snapshot.exists()) {
          const weight = snapshot.val()?.weight || 0;
          if (initialWeight === null) {
            setInitialWeight(weight);
          }
        } else {
          Alert.alert("Error", "Data not available.");
        }
      });

      onValue(binRef, (snapshot) => {
        if (snapshot.exists()) {
          const weight = snapshot.val()?.weight || 0;
  
          setCurrentWeight(weight);
          setThresholdReached(weight < 1);
        } else {
          Alert.alert("Error", "Data not available.");
        }
      });
  
      setModalVisible(true);
    }
  };
  
  const handleConfirmEmptyBin = () => {
    if (selectedMarker) {
      const db = getDatabase(app);
      const binRef = ref(db, `${selectedMarker.name.toLowerCase()}/sensor`);
  
      get(binRef).then((snapshot) => {
        if (snapshot.exists()) {
          const currentData = snapshot.val();
          const finalWeight = currentData?.weight || 0;
  
          const weightLifted = initialWeight - finalWeight;
  
          if (weightLifted > 0) {
            const collectedWeight = currentData?.collectedWeight || 0;
            const updatedCollectedWeight = collectedWeight + weightLifted;
  
            update(ref(db, `${selectedMarker.name.toLowerCase()}/sensor`), {
              collectedWeight: updatedCollectedWeight,
            });
  
            Alert.alert(
              "Success",
              `Terima kasih sudah mengangkat sampahnya! Total sampah yang diangkat: ${weightLifted.toFixed(2)} kg`
            );
  
            setModalVisible(false);
            setSelectedMarker(null);
            setInitialWeight(null);
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
    if (selectedMarker && userLocation) {
      fetchRoute(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { 
          latitude: selectedMarker.latitude, 
          longitude: selectedMarker.longitude 
        }
      );
      setIsNavigating(true);
    }
  };

  const handleStopNavigation = () => {
    setRouteCoordinates([]);
    setIsNavigating(false);
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
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={4}
            strokeColor="blue"
          />
        )}

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
            onPress={!isNavigating ? handleNavigateToBin : handleStopNavigation}
          >
            <Text style={styles.infoButtonText}>
              {!isNavigating ? "Navigate to Bin" : "Stop Navigation"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.infoButton} onPress={handleViewDetails}>
            <Text style={styles.infoButtonText}>Get Bin Info</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.infoButton} onPress={handleEmptyBin}>
            <Text style={styles.infoButtonText}>Empty Bin</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal untuk mengosongkan bin tetap sama */}
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
  // Style tetap sama seperti sebelumnya
  // ...
});

export default MapComponent;