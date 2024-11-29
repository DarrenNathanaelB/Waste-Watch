import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { getDatabase, ref, onValue } from "firebase/database";
import { app } from "../../firebase/config.js";
import { BarChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

const StatisticsPage = () => {
  const [weeklyWeights, setWeeklyWeights] = useState(Array(7).fill(0));
  const [leaderboard, setLeaderboard] = useState([]);
  const screenWidth = Dimensions.get("window").width;

  // Fungsi mendapatkan data historis dengan onValue untuk mendengarkan perubahan
  const loadHistoricalData = () => {
    const db = getDatabase(app);
    const historicalRef = ref(db, "historical_weights");

    onValue(historicalRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const weekDates = getWeekDates();
        const weights = Array(7).fill(0);

        // Mengisi data historis ke dalam array weeklyWeights
        Object.values(data).forEach((item) => {
          const dateIndex = weekDates.indexOf(item.date);
          if (dateIndex !== -1) {
            weights[dateIndex] = item.totalWeight;
          }
        });

        setWeeklyWeights(weights);
      }
    }, (error) => {
      console.error("Error loading historical data:", error);
    });
  };

  // Fungsi mendapatkan data leaderboard dengan onValue untuk mendengarkan perubahan
  const getLeaderboardData = () => {
    const db = getDatabase(app);
    const rootRef = ref(db, "/");

    onValue(rootRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const tongWeights = [];

        Object.keys(data).forEach((tongId) => {
          if (tongId.startsWith("tong")) {
            const tongData = data[tongId]?.sensor;
            if (tongData?.collectedWeight) {
              const collectedWeight = parseFloat(tongData.collectedWeight);
              if (!isNaN(collectedWeight)) {
                tongWeights.push({
                  tong: `Halte ${tongId.toUpperCase()}`,
                  collectedWeight: collectedWeight,
                });
              }
            }
          }
        });

        // Urutkan berdasarkan collectedWeight
        const sortedTongWeights = tongWeights.sort(
          (a, b) => b.collectedWeight - a.collectedWeight
        );

        setLeaderboard(sortedTongWeights.slice(0, 3));
      }
    }, (error) => {
      console.error("Error fetching leaderboard data:", error);
      Alert.alert("Error", "Gagal mendapatkan leaderboard data");
    });
  };

  // Dapatkan tanggal minggu ini (Senin hingga Minggu)
  const getWeekDates = () => {
    const monday = getMonday(new Date());
    const weekDates = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date.toISOString().split("T")[0]);
    }

    return weekDates;
  };

  // Fungsi mendapatkan Senin dari minggu ini
  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust jika hari Minggu
    return new Date(d.setDate(diff));
  };

  // Muat data historis dan leaderboard saat halaman terbuka
  useEffect(() => {
    loadHistoricalData();
    getLeaderboardData();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Statistics</Text>

      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Weekly Chart</Text>
        <BarChart
          data={{
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{ data: weeklyWeights.map((weight) => Math.max(weight, 0)) }],
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
            <Text style={styles.weight}>{item.collectedWeight.toFixed(1)} kg</Text>
          </View>
        ))}
      </View>
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
});

export default StatisticsPage;
