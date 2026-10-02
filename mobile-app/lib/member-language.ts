import AsyncStorage from '@react-native-async-storage/async-storage';

export type MemberLanguage =
    | 'bn'
    | 'en';

const LANGUAGE_KEY =
    '@khudro_sanchoy_member_language';

export async function getMemberLanguage(): Promise<MemberLanguage> {
    try {
        const value =
            await AsyncStorage.getItem(
                LANGUAGE_KEY
            );

        if (value === 'en') {
            return 'en';
        }

        return 'bn';
    } catch {
        return 'bn';
    }
}

export async function setMemberLanguage(
    language: MemberLanguage
): Promise<void> {
    await AsyncStorage.setItem(
        LANGUAGE_KEY,
        language
    );
}