import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { getDatabase, ref, onValue, get, set, push } from "firebase/database";
import { app } from '../../firebase/config.js';
import { BarChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

const StatisticsPage = () => {
  const [weeklyWeights, setWeeklyWeights] = useState(Array(7).fill(0));
  const [leaderboard, setLeaderboard] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Function to get the Monday of the current week
  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Function to get the week dates (Monday to Sunday)
  const getWeekDates = () => {
    const monday = getMonday(new Date());
    const weekDates = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date.toISOString().split('T')[0]);
    }

    return weekDates;
  };

  // Get day labels for the chart
  const getWeekDayLabels = () => {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  };

  // Modified function to load historical data
  const loadHistoricalData = async () => {
    try {
      const db = getDatabase(app);
      const historicalRef = ref(db, 'historical_weights');
      const snapshot = await get(historicalRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const weekDates = getWeekDates();
        const weights = Array(7).fill(0);

        // Process the data
        Object.values(data).forEach(item => {
          const dateIndex = weekDates.indexOf(item.date);
          if (dateIndex !== -1) {
            weights[dateIndex] = item.totalWeight;
          }
        });

        setWeeklyWeights(weights);
      }
    } catch (error) {
      console.error("Error loading historical data:", error);
    }
  };

  // Function to save daily total to historical data
  const saveDailyTotal = async (totalWeight) => {
    try {
      const db = getDatabase(app);
      const historicalRef = ref(db, 'historical_weights');
      const today = new Date().toISOString().split('T')[0];

      // Create new entry
      const newDayRef = push(historicalRef);
      await set(newDayRef, {
        date: today,
        totalWeight: totalWeight
      });

      // Reload historical data to update chart
      await loadHistoricalData();
    } catch (error) {
      console.error("Error saving historical data:", error);
      Alert.alert("Error", "Failed to save historical data");
    }
  };

  // Function to get current weights from Firebase
  const getCurrentWeights = async () => {
    try {
      const db = getDatabase(app);
      const snapshot = await get(ref(db, '/'));

      if (snapshot.exists()) {
        const data = snapshot.val();
        const tongWeights = [];

        Object.keys(data).forEach((tongId) => {
          if (tongId.startsWith('tong')) { // Only process tong data
            const tongData = data[tongId]?.sensor;
            if (tongData?.weight) {
              const weight = parseFloat(tongData.weight);
              if (!isNaN(weight)) {
                tongWeights.push({
                  tong: `Halte ${tongId.toUpperCase()}`,
                  weight: weight
                });
              }
            }
          }
        });

        return tongWeights;
      }
      return [];
    } catch (error) {
      console.error("Error fetching current weights:", error);
      Alert.alert("Error", "Failed to fetch current weights");
      return [];
    }
  };

  // Function to calculate daily data and update chart
  const calculateDailyData = async () => {
    try {
      const today = new Date().toDateString();

      if (lastUpdate === today) {
        Alert.alert("Info", "Data sudah diperbarui hari ini");
        return;
      }

      const tongWeights = await getCurrentWeights();

      if (tongWeights.length > 0) {
        // Calculate total weight for today
        const totalWeight = tongWeights.reduce((sum, item) => sum + item.weight, 0);

        // Save to historical data
        await saveDailyTotal(totalWeight);

        // Update leaderboard
        const sortedTongWeights = tongWeights.sort((a, b) => b.weight - a.weight);
        setLeaderboard(sortedTongWeights.slice(0, 3));

        // Update last update timestamp
        setLastUpdate(today);

        Alert.alert("Success", "Data berhasil diperbarui");
      } else {
        Alert.alert("Info", "Tidak ada data baru ditemukan");
      }
    } catch (error) {
      console.error("Error calculating daily data:", error);
      Alert.alert("Error", "Gagal memperbarui data");
    }
  };

  // Load historical data on component mount
  useEffect(() => {
    loadHistoricalData();
  }, []);

  // Set up real-time listener for leaderboard updates
  useEffect(() => {
    const db = getDatabase(app);
    const rootRef = ref(db, '/');

    const unsubscribe = onValue(rootRef, async (snapshot) => {
      if (snapshot.exists()) {
        const tongWeights = await getCurrentWeights();
        const sortedTongWeights = tongWeights.sort((a, b) => b.weight - a.weight);
        setLeaderboard(sortedTongWeights.slice(0, 3));
      }
    });

    return () => unsubscribe();
  }, []);

  const screenWidth = Dimensions.get("window").width;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Statistics</Text>

      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Weekly Chart</Text>
        <BarChart
          data={{
            labels: getWeekDayLabels(),
            datasets: [{ 
              data: weeklyWeights.map(weight => Math.max(weight, 0))
            }],
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: "#fff",
            backgroundGradientFrom: "#f5e8d6",
            backgroundGradientTo: "#f5e8d6",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(131, 86, 35, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: { borderRadius: 16 },
          }}
          style={{ marginVertical: 8, borderRadius: 16 }}
        />
      </View>

      <View style={styles.leaderboardContainer}>
        <Text style={styles.sectionTitle}>Leaderboard</Text>
        {leaderboard.map((item, index) => (
          <View style={styles.leaderboardItem} key={item.tong}>
            <Text style={styles.rank}>
              {index + 1 === 1 ? "🏆" : index + 1 === 2 ? "🥈" : "🥉"}
            </Text>
            <Text style={styles.tongName}>{item.tong}</Text>
            <Text style={styles.weight}>{item.weight.toFixed(1)} kg</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.calculateButton} 
        onPress={calculateDailyData}
      >
        <Text style={styles.calculateButtonText}>Kalkulasi Data Hari Ini</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5e8d6", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  chartContainer: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  leaderboardContainer: { marginTop: 20 },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 10,
  },
  rank: { fontSize: 18, fontWeight: "bold" },
  tongName: { fontSize: 16, flex: 1, marginHorizontal: 10 },
  weight: { fontSize: 16, fontWeight: "bold" },
  calculateButton: {
    backgroundColor: "#835623",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  calculateButtonText: { fontSize: 16, fontWeight: "bold", color: "#fff" },
});

export default StatisticsPage;