import AsyncStorage from '@react-native-async-storage/async-storage';

export type AdminLanguage = 'bn' | 'en';

const ADMIN_LANGUAGE_KEY = 'admin_language';

export async function getAdminLanguage(): Promise<AdminLanguage> {
    try {
        const savedLanguage =
            await AsyncStorage.getItem(
                ADMIN_LANGUAGE_KEY
            );

        if (
            savedLanguage === 'bn' ||
            savedLanguage === 'en'
        ) {
            return savedLanguage;
        }

        return 'bn';
    } catch (error) {
        console.error(
            'Admin language load error:',
            error
        );

        return 'bn';
    }
}

export async function setAdminLanguage(
    language: AdminLanguage
): Promise<void> {
    try {
        await AsyncStorage.setItem(
            ADMIN_LANGUAGE_KEY,
            language
        );
    } catch (error) {
        console.error(
            'Admin language save error:',
            error
        );
    }
}

