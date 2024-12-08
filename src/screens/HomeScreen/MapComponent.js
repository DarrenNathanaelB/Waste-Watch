import React, { useState, useEffect, useRef } from "react";
import { 
  Alert, 
  Text, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  Linking
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { 
  getDatabase, 
  ref, 
  onValue, 
  get, 
  update 
} from "firebase/database";
import { 
  getAuth, 
  signOut 
} from "firebase/auth";
import { 
  useNavigation, 
  useIsFocused 
} from "@react-navigation/native";
import * as Location from "expo-location"; // Import expo-location
import { app } from "../../firebase/config.js";

const MapComponent = ({ route }) => {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [destination, setDestination] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showNavigation, setShowNavigation] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [initialWeight, setInitialWeight] = useState(null);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [thresholdReached, setThresholdReached] = useState(false);
  const [showGoogleMapsButton, setShowGoogleMapsButton] = useState(false);

  const navigation = useNavigation();
  const mapRef = useRef(null);
  const isFocused = useIsFocused();

  const GOOGLE_MAPS_APIKEY = 'AIzaSyAJx87nta76WLdlVkvRsYwO3t5mxNxByMc'; 

  const initialRegion = {
    latitude: -6.3628,
    longitude: 106.8269,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  // Check authentication before performing sensitive actions
  const checkAuthentication = () => {
    const auth = getAuth();
    if (!auth.currentUser) {
      Alert.alert("Error", "Please log in first");
      navigation.navigate("Login");
      return false;
    }
    return true;
  };

  const openGoogleMaps = () => {
    if (!selectedMarker) {
      Alert.alert("Error", "No marker selected");
      return;
    }
  
    const { latitude, longitude } = selectedMarker; // Gunakan selectedMarker
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert("Error", "Google Maps app is not installed or cannot be opened.");
        }
      })
      .catch((err) => {
        console.error("An error occurred", err);
        Alert.alert("Error", "Could not open Google Maps");
      });
  };
  


  const requestLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Location permission is required to use this feature."
      );
      return false;
    }

    const location = await Location.getCurrentPositionAsync({});
    setUserLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    return true;
  };

  useEffect(() => {
    const fetchLocation = async () => {
      const permissionGranted = await requestLocationPermission();
      if (!permissionGranted) {
        Alert.alert(
          "Error",
          "Please enable location services to use the map functionality."
        );
      }
    };

    fetchLocation();
  }, []);

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

    const unsubscribe = onValue(
      rootRef, 
      (snapshot) => {
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
      },
      (error) => {
        console.error("Firebase database error:", error);
        Alert.alert("Error", "Failed to fetch bin data");
      }
    );

    return () => unsubscribe();
  }, []);

  const handleMarkerPress = (marker) => {
    setSelectedMarker(marker);
    setDestination(null);
    setShowNavigation(false);
    setShowGoogleMapsButton(true);
  };

  const handleNavigateToBin = () => {
    if (!checkAuthentication()) return;
  
    if (!selectedMarker) {
      Alert.alert("Error", "No bin selected.");
      return;
    }
  
    if (!userLocation) {
      Alert.alert("Error", "User location is not available.");
      return;
    }
  
    setDestination({
      latitude: selectedMarker.latitude,
      longitude: selectedMarker.longitude,
    });
  
    setShowNavigation(true);
    setShowGoogleMapsButton(true); // Ensure this is set to true
    setModalVisible(false);
  
    mapRef.current.fitToCoordinates(
      [
        userLocation,
        { latitude: selectedMarker.latitude, longitude: selectedMarker.longitude },
      ],
      {
        edgePadding: {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50,
        },
        animated: true,
      }
    );
  
    setSelectedMarker(null);
  };

  const handleGetBinInfo = () => {
    if (selectedMarker) {
      navigation.navigate("BinDetailsPage", { binName: selectedMarker.name.toLowerCase() });
      setSelectedMarker(null);
    }
  };

  const handleEmptyBin = () => {
    if (!checkAuthentication()) return;

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
    if (!checkAuthentication()) return;

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
              `Bin emptied successfully! Total waste collected: ${weightLifted.toFixed(2)} kg`
            );
  
            setModalVisible(false);
            setSelectedMarker(null);
            setInitialWeight(null);
          } else {
            Alert.alert("Error", "No waste to collect.");
          }
        } else {
          Alert.alert("Error", "Failed to retrieve bin data.");
        }
      });
    }
  };

  const clearNavigation = () => {
    setDestination(null);
    setSelectedMarker(null);
    setShowNavigation(false);
  };

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            if (showNavigation) {
              setShowNavigation(false);
              setDestination(null);
            } else {
              navigation.goBack();
            }
          }}
          style={styles.backButton}
        >
          <Text style={styles.backText}>{showNavigation ? "Back" : "Close"}</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            if (userLocation) {
              mapRef.current?.animateToRegion(
                {
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                },
                1000
              );
            } else {
              Alert.alert(
                "Error",
                "User location is not available. Please enable location services."
              );
            }
          }}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>My Location</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, showNavigation, userLocation]);  
  
  

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        onUserLocationChange={(event) => {
          const { latitude, longitude } = event.nativeEvent.coordinate;
          setUserLocation({ latitude, longitude });
        }}
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
  
        {showNavigation && userLocation && destination && (
          <MapViewDirections
            origin={userLocation}
            destination={destination}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={3}
            strokeColor="hotpink"
            mode="DRIVING"
            onError={(errorMessage) => {
              if (errorMessage.includes("ZERO_RESULTS")) {
                Alert.alert(
                  "No Route Found",
                  "Google Maps couldn't find a route between the selected locations."
                );
              } else {
                Alert.alert("Error", `Directions Error: ${errorMessage}`);
              }
            }}
            onReady={(result) => {
              mapRef.current.fitToCoordinates(result.coordinates, {
                edgePadding: {
                  top: 50,
                  right: 50,
                  bottom: 50,
                  left: 50,
                },
                animated: true,
              });
            }}
          />
        )}
      </MapView>
  
      {selectedMarker && (
  <View style={styles.infoContainer}>
    <TouchableOpacity
      style={styles.closeButton}
      onPress={() => {
        setSelectedMarker(null);
        clearNavigation();
      }}
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
    <TouchableOpacity 
      style={styles.infoButton} 
      onPress={handleGetBinInfo}
    >
      <Text style={styles.infoButtonText}>Get Bin Info</Text>
    </TouchableOpacity>
    <TouchableOpacity 
      style={styles.infoButton} 
      onPress={handleEmptyBin}
    >
      <Text style={styles.infoButtonText}>Empty Bin</Text>
    </TouchableOpacity>
    <TouchableOpacity 
      style={styles.infoButton} 
      onPress={openGoogleMaps}
    >
      <Text style={styles.infoButtonText}>Open in Google Maps</Text>
    </TouchableOpacity>
  </View>
)}

  
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Empty Bin Confirmation</Text>
          <Text>Initial Weight: {initialWeight} kg</Text>
          <Text>Current Weight: {currentWeight} kg</Text>
          {thresholdReached && (
            <Text style={{color: 'green'}}>Bin is ready to be emptied!</Text>
          )}
          <TouchableOpacity 
            style={styles.modalButton} 
            onPress={handleConfirmEmptyBin}
          >
            <Text style={styles.modalButtonText}>Confirm Empty</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.modalButton} 
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.modalButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
  
        {showNavigation && (
  <View style={styles.infoContainer}>
    <TouchableOpacity
      style={styles.closeButton}
      onPress={() => {
        setShowNavigation(false);
        setDestination(null);
        setShowGoogleMapsButton(false);
      }}
    >
      <Text style={styles.closeText}>X</Text>
    </TouchableOpacity>

    <Text style={styles.infoTitle}>Navigation</Text>
    <TouchableOpacity
      style={styles.infoButton}
      onPress={openGoogleMaps}
    >
      <Text style={styles.infoButtonText}>Open in Google Maps</Text>
    </TouchableOpacity>
  </View>
)}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  headerButton: {
    marginRight: 15,
    padding: 10,
    backgroundColor: '#6D4C41',
    borderRadius: 5,
  },
  headerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },  
  navigationContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoContainer: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: "#FFF5E4",
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  closeButton: {
    position: "absolute",
    right: 10,
    top: 10,
    padding: 5,
  },
  closeText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  infoButton: {
    backgroundColor: "#6D4C41",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    alignItems: "center",
  },
  infoButtonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
  },
  backButton: {
    paddingLeft: 10,
  },
  backText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalButton: {
    backgroundColor: '#6D4C41',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    width: '100%',
  },
  modalButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  }
});

export default MapComponent;