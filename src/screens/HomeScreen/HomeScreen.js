import React from 'react';
import { Text, Image, View, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import MapComponent from './MapComponent';
import FinishDayScreen from '../FinishDayScreen/FinishDayScreen';
import StatisticsScreen from '../StatisticsScreen/StatisticsScreen';

const Tab = createBottomTabNavigator();

export default function HomeScreen() {
  const navigation = useNavigation();

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth).then(() => {
      console.log('User signed out!');
      navigation.navigate('Login');
    }).catch((error) => {
      console.error('Error signing out: ', error);
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity onPress={handleLogout} style={styles.logoutIcon}>
          <Icon name="arrow-back" size={24} color="#866A42" />
      </TouchableOpacity>

      <Tab.Navigator
        screenOptions={({ navigation, route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#fffae8',
            height: 80,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            elevation: 10,
          },
        })}
      >
        <Tab.Screen
          name="Map"
          component={MapComponent}
          options={({ navigation }) => ({
            tabBarLabel: '',
            tabBarIcon: ({ focused }) => (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('Map', { resetMap: true });
                }}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image
                  source={require('../../../assets/home.png')}
                  style={{
                    width: 30,
                    height: 30,
                    marginTop: 45,
                    resizeMode: 'contain',
                    tintColor: focused ? '#007AFF' : '#8E8E93',
                  }}
                />
                <Text style={{ fontSize: 11, marginTop: 4, textAlign: 'center' }}>
                  Home
                </Text>
              </TouchableOpacity>
            ),
          })}
        />
        <Tab.Screen
          name="Finish Day"
          component={FinishDayScreen}
          options={{
            tabBarLabel: '',
            tabBarButton: (props) => (
              <TouchableOpacity
                {...props}
                style={{
                  position: 'absolute',
                  top: -15,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: '#ffe8ad',
                  borderTopLeftRadius: 30,
                  borderTopRightRadius: 30,
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 1,
                  elevation: 5,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.5,
                }}
              >
                <Image
                  source={require('../../../assets/finishDay.png')}
                  style={{
                    width: 50,
                    height: 50,
                    resizeMode: 'contain',
                    marginTop: 10,
                  }}
                />
              </TouchableOpacity>
            ),
          }}
        />
        <Tab.Screen
          name="Statistics"
          component={StatisticsScreen}
          options={{
            tabBarLabel: '',
            tabBarIcon: ({ focused }) => (
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Image
                  source={require('../../../assets/statistics.png')}
                  style={{
                    width: 30,
                    height: 30,
                    marginTop: 45,
                    resizeMode: 'contain',
                    tintColor: focused ? '#007AFF' : '#8E8E93',
                  }}
                />
                <Text style={{ fontSize: 11, marginTop: 4, textAlign: 'center' }}>
                  Stats
                </Text>
              </View>
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
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