import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Button } from 'react-native';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getAuth, signOut } from 'firebase/auth';
import styles from './styles';

export default function HomeScreen() {
    const [sensorData, setSensorData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const database = getDatabase();
        const sensorRef = ref(database, 'sensor');
        onValue(sensorRef, (snapshot) => {
            const data = snapshot.val();
            setSensorData(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching sensor data: ", error);
            setLoading(false);
        });
    }, []);

    const handleLogout = () => {
        const auth = getAuth();
        signOut(auth).then(() => {
            console.log('User signed out!');
        }).catch((error) => {
            console.error('Error signing out: ', error);
        });
    };

    return (
        <View style={styles.container}>
            {loading && <ActivityIndicator size="large" color="#0000ff" />}
            {sensorData && (
                <View style={styles.sensorContainer}>
                    <Text>Battery: {sensorData.battery}</Text>
                    <Text>Distance: {sensorData.distance}</Text>
                    <Text>Weight: {sensorData.weight}</Text>
                </View>
            )}
            <Button title="Log Out" onPress={handleLogout} />
        </View>
    );
}