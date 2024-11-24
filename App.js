import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { OnboardingScreen, LoginScreen, HomeScreen, RegistrationScreen } from './src/screens';
import LoadScreen from './src/screens/LoadScreen/LoadScreen';
import StatisticsScreen from './src/screens/StatisticsScreen/StatisticsScreen';
import BinDetailsPage from './src/screens/Details/BinDetailsPage';
import MapComponent from './src/screens/HomeScreen/MapComponent';

import { decode, encode } from 'base-64';
if (!global.btoa) {
  global.btoa = encode;
}
if (!global.atob) {
  global.atob = decode;
}

const Stack = createStackNavigator();
const auth = getAuth();
const db = getFirestore();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = doc(db, 'users', user.uid);
          const docSnapshot = await getDoc(userDoc);
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            setUser(userData);
          } else {
            setUser(null); // Dokumen user tidak ditemukan
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null); // Tidak ada pengguna yang login
        setLoading(false);
      }
    });

    // Cleanup subscription saat komponen unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            {/* Halaman utama untuk user yang sudah login */}
            <Stack.Screen name="Home">
              {(props) => <HomeScreen {...props} extraData={user} />}
            </Stack.Screen>
            <Stack.Screen name="MapComponent" component={MapComponent} />
            <Stack.Screen name="Statistics" component={StatisticsScreen} />
            <Stack.Screen
              name="BinDetailsPage"
              component={BinDetailsPage}
              options={{ title: 'Bin Details' }}
            />
          </>
        ) : (
          <>
            {/* Halaman untuk user yang belum login */}
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Registration" component={RegistrationScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
