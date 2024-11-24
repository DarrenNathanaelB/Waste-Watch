import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

const StatisticsScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Statistics Page</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StatisticsScreen;
