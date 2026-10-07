import { Linking, Alert } from 'react-native';

export const HR_PHONE = '8252584025';
export const HR_PHONE_FORMATTED = '+91 8252584025';

/**
 * Open WhatsApp conversation with WECICE HR
 * @param {string} message - Optional pre-filled message
 */
export const openWhatsAppHR = async (message = 'Hello WECICE HR, I need assistance with the WECICE Attendance app.') => {
    const encoded = encodeURIComponent(message);
    const appUrl = `whatsapp://send?phone=91${HR_PHONE}&text=${encoded}`;
    const webUrl = `https://wa.me/91${HR_PHONE}?text=${encoded}`;

    try {
        const supported = await Linking.canOpenURL(appUrl);
        if (supported) {
            await Linking.openURL(appUrl);
        } else {
            await Linking.openURL(webUrl);
        }
    } catch (e) {
        try {
            await Linking.openURL(webUrl);
        } catch (err) {
            Alert.alert('Contact HR', `Please WhatsApp or call WECICE HR at ${HR_PHONE_FORMATTED}`);
        }
    }
};

/**
 * Trigger phone dialer to call WECICE HR
 */
export const openCallHR = async () => {
    try {
        await Linking.openURL(`tel:+91${HR_PHONE}`);
    } catch (err) {
        Alert.alert('Call HR', `Please call WECICE HR at ${HR_PHONE_FORMATTED}`);
    }
};

/**
 * Display interactive dialog with 1-tap WhatsApp and Call options
 */
export const showContactHROptions = (title = 'Contact WECICE HR', message = 'How would you like to contact HR?') => {
    Alert.alert(
        title,
        `${message}\n\nHR Support: ${HR_PHONE_FORMATTED}`,
        [
            {
                text: '💬 WhatsApp HR',
                onPress: () => openWhatsAppHR()
            },
            {
                text: '📞 Call HR',
                onPress: () => openCallHR()
            },
            { text: 'Cancel', style: 'cancel' }
        ]
    );
};

export default {
    HR_PHONE,
    HR_PHONE_FORMATTED,
    openWhatsAppHR,
    openCallHR,
    showContactHROptions
};
