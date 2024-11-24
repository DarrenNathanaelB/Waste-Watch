import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF8E1', // Light cream background
        justifyContent: 'center',
    },
    logo: {
        height: 250, // Match size from login page
        width: 250,
        alignSelf: 'center',
    },
    input: {
        height: 48,
        borderRadius: 25, // Rounded edges for inputs
        backgroundColor: '#FFF8E1', // Match background to page
        borderColor: '#E8C547', // Yellowish border
        borderWidth: 1,
        marginHorizontal: 40,
        marginVertical: 10,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#000',
    },
    button: {
        backgroundColor: '#FFC107', // Bright yellow for button
        marginHorizontal: 40,
        marginTop: 20,
        height: 48,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footerView: {
        alignItems: 'center',
        marginTop: 20,
    },
    footerText: {
        fontSize: 14,
        color: '#6C753D', // Subtle greenish tone
    },
    footerLink: {
        color: '#FFC107', // Bright yellow for "Log in" link
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});
