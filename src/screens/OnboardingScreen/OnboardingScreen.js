import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, FlatList, Dimensions, Animated, TouchableOpacity } from "react-native";
import NavPhoto from "../../../assets/svg/navigationStart.js";
import FindPhoto from "../../../assets/svg/findStart.js";
import StatisticsPhoto from "../../../assets/svg/statisticsStart.js";
import { DotIndicator } from "./DotIndicator";

const { width, height } = Dimensions.get("window");

export default function OnboardingScreen({ navigation }) {
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onboardingData = [
    {
      svg: <NavPhoto width={270} height={270} />,
      title: "Find Smart Bins Around You",
      description:
        "Track smart bins across the city and monitor their capacity in real-time for more efficient waste management.",
    },
    {
      svg: <FindPhoto width={270} height={270} />,
      title: "Navigate to the Nearest Bin",
      description:
        "Get directions to the nearest bin to make waste disposal convenient and efficient.",
    },
    {
      svg: <StatisticsPhoto width={270} height={270} />,
      title: "View Waste Statistics",
      description:
        "Analyze waste collection statistics and optimize your waste management strategy.",
    },
  ];

  const handleViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const handleLoginPress = () => {
    console.log("Login button pressed");
    navigation.navigate("Login"); 
  };

  return (
    <View style={styles.container} backgroundColor="#fffae8">
      {/* FlatList untuk sliding */}
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {item.svg}
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />

      {/* Dot Indicator */}
      <View style={styles.dotIndicatorContainer}>
        <DotIndicator count={onboardingData.length} activeIndex={currentIndex} />
      </View>

      {currentIndex === onboardingData.length - 1 && (
        <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  slide: {
    width, // Lebar sesuai layar
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: "#000",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    color: "#858585",
  },
  dotIndicatorContainer: {
    position: "absolute",
    bottom: height * 0.15, // Letakkan di atas margin bawah layar
    alignSelf: "center",
  },
  loginButton: {
    position: "absolute",
    bottom: height * 0.07,
    backgroundColor: "#000",
    paddingVertical: 10,
    paddingHorizontal: 160,
    borderRadius: 25,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
