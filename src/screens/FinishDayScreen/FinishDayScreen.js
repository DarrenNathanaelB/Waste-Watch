import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';

const FinishDayScreen = () => {
  const [isModalVisible, setModalVisible] = useState(false);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleModal}>
        <Text style={styles.openModalText}>Open Calendar Options</Text>
      </TouchableOpacity>
      <Modal isVisible={isModalVisible} onBackdropPress={toggleModal}>
        <View style={styles.modal}>
          <Text style={styles.modalText}>Calendar Option 1</Text>
          <Text style={styles.modalText}>Calendar Option 2</Text>
          <Text style={styles.modalText}>Calendar Option 3</Text>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  openModalText: {
    fontSize: 18,
    color: '#007bff',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    marginVertical: 10,
  },
});

export default FinishDayScreen;
