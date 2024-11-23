import * as React from "react";
import { View, StyleSheet } from "react-native";

export function DotIndicator({ count, activeIndex }) {
  return (
    <View style={styles.dotContainer}>
      {[...Array(count)].map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === activeIndex && styles.activeDot
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dotContainer: {
    display: "flex",
    marginTop: 30,
    width: 67,
    alignItems: "stretch",
    gap: 9,
    flexDirection: "row",
  },
  dot: {
    borderRadius: 50,
    width: 16,
    height: 16,
    backgroundColor: "#E5E5E5",
  },
  activeDot: {
    backgroundColor: "#000000",
  },
});