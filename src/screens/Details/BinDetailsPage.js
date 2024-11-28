import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { app } from '../../firebase/config';
import { useRoute } from "@react-navigation/native";

const BinDetailsPage = () => {
  const route = useRoute();
  const { binName } = route.params; // Mendapatkan nama tong dari parameter navigasi
  const [binData, setBinData] = useState(null);

  useEffect(() => {
    const db = getDatabase(app);
    const binRef = ref(db, `${binName}/sensor`); // Menggunakan parameter untuk referensi database

    const unsubscribe = onValue(binRef, (snapshot) => {
      if (snapshot.exists()) {
        setBinData(snapshot.val());
      }
    });

    return () => unsubscribe();
  }, [binName]); // Memastikan useEffect berjalan ulang jika binName berubah

  const handleCloseBinToggle = async () => {
    if (binData && binData.closebin !== undefined) {
      const db = getDatabase(app);
      const binRef = ref(db, `${binName}/sensor/closebin`);

      // Toggle nilai closebin
      const newClosebinValue = binData.closebin === 1 ? 0 : 1;

      try {
        await set(binRef, newClosebinValue); // Update field closebin di database
        setBinData({ ...binData, closebin: newClosebinValue }); // Perbarui state lokal
      } catch (error) {
        console.error("Error updating closebin:", error);
      }
    } else {
      console.error("closebin property is missing from binData");
    }
  };

  if (!binData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const { battery, distance, weight, closebin } = binData;

  // Menghitung kapasitas bar berdasarkan jarak
  const maxDistance = 100; // Asumsi jarak maksimum adalah 100 (ubah sesuai dengan sensornya)
  const capacityWidth = Math.min(100, Math.max(0, (maxDistance - distance) / maxDistance * 100));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Bin Info</Text>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Location:</Text>
        <Text style={styles.value}>{binName}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Capacity:</Text>
        <View style={styles.capacityBarContainer}>
          <View style={[styles.capacityBar, { width: `${capacityWidth}%` }]} />
        </View>
        <View style={styles.capacityTextContainer}>
          <Text style={styles.capacityText}>Empty</Text>
          <Text style={styles.capacityTextRight}>Full</Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Smart Bin Battery:</Text>
        <Text style={styles.value}>{battery}%</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Bin Weight:</Text>
        <Text style={styles.value}>{weight} Kg</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Bin Status:</Text>
        <Text style={styles.value}>
          {closebin === 1 ? "Closed" : "Open"}
        </Text>
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={handleCloseBinToggle}>
        <Text style={styles.closeButtonText}>
          {closebin === 1 ? "Open Bin" : "Close Bin"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#FFF5E4",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#6D4C41",
  },
  infoContainer: {
    backgroundColor: "#F8E9D3",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#5D4037",
  },
  value: {
    fontSize: 16,
    color: "#795548",
  },
  capacityBarContainer: {
    width: "100%", // Bar akan mengambil seluruh lebar
    height: 40, // Tinggi bar
    borderWidth: 2,
    borderColor: "#BDBDBD",
    borderRadius: 8,
    backgroundColor: "#FFF",
    marginVertical: 8,
    overflow: "hidden", // Pastikan bar tidak melampaui kontainer
  },
  capacityBar: {
    height: "100%", // Bar mengambil tinggi penuh kontainer
    backgroundColor: "#FF7043",
    borderTopLeftRadius: 8, // Untuk menyelaraskan sisi kiri
    borderBottomLeftRadius: 8, // Untuk menyelaraskan sisi kiri
  },
  capacityTextContainer: {
    flexDirection: "row", // Put text next to each other
    justifyContent: "space-between", // Ensure they align at both ends
    width: "100%",
  },
  capacityText: {
    color: "#6D4C41",
  },
  capacityTextRight: {
    color: "#6D4C41",
    textAlign: "right",
  },
  closeButton: {
    backgroundColor: "#FF5252",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "#6D4C41",
  },
});

export default BinDetailsPage;
