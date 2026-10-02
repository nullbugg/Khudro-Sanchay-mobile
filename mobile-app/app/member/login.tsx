import { useState } from 'react';

import Ionicons from '@expo/vector-icons/Ionicons';

import { memberLogin } from '../../lib/member-api';

import { saveMemberSession } from '../../lib/member-session';

import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';

type Language = 'bn' | 'en';

const translations = {
    bn: {
        appName: 'ক্ষুদ্র সঞ্চয়',
        appSubtitle: 'সমবায় সমিতি',

        title: 'মেম্বার লগইন',
        subtitle:
            'আপনার সদস্য অ্যাকাউন্টে প্রবেশ করতে ফোন নম্বর ও পিন ব্যবহার করুন।',

        phone: 'ফোন নম্বর',
        phonePlaceholder: '01XXXXXXXX',

        pin: 'পিন',
        pinPlaceholder: 'আপনার পিন লিখুন',

        forgotPin: 'পিন ভুলে গেছেন?',

        login: 'লগইন করুন',
        loggingIn: 'লগইন হচ্ছে...',

        noAccount: 'এখনও কোনো অ্যাকাউন্ট নেই?',
        register: 'মেম্বার অ্যাকাউন্ট তৈরি করুন',

        invalidPhone: 'সঠিক ফোন নম্বর লিখুন।',
        invalidPhoneFormat:
            'ফোন নম্বর অবশ্যই ১১ সংখ্যার হতে হবে এবং 01 দিয়ে শুরু হতে হবে।',

        invalidPin: 'PIN লিখুন।',
        invalidPinLength: 'পিন অবশ্যই ৪ থেকে ৬ সংখ্যার হতে হবে।',

        loginFailed: 'লগইন করা যায়নি।',
        loginSuccessNoMember:
            'লগইন সফল হলেও মেম্বার তথ্য পাওয়া যায়নি।',
        loginTryAgain: 'লগইন করা যায়নি। আবার চেষ্টা করুন।',

        footerTitle: 'ক্ষুদ্র সঞ্চয় সমবায় সমিতি',
        developer: 'ডেভেলপার - আব্দুল আলিম সরকার',
    },

    en: {
        appName: 'ক্ষুদ্র সঞ্চয়',
        appSubtitle: 'সমবায় সমিতি',

        title: 'Member Login',
        subtitle:
            'Use your phone number and PIN to access your member account.',

        phone: 'Phone Number',
        phonePlaceholder: '01XXXXXXXX',

        pin: 'PIN',
        pinPlaceholder: 'Enter your PIN',

        forgotPin: 'Forgot PIN?',

        login: 'Login',
        loggingIn: 'Logging in...',

        noAccount: 'Don’t have an account yet?',
        register: 'Create Member Account',

        invalidPhone: 'Please enter your phone number.',
        invalidPhoneFormat:
            'Phone number must be 11 digits and start with 01.',

        invalidPin: 'Please enter your PIN.',
        invalidPinLength: 'PIN must be 4 to 6 digits.',

        loginFailed: 'Login failed.',
        loginSuccessNoMember:
            'Login was successful, but member information was not found.',
        loginTryAgain: 'Login failed. Please try again.',

        footerTitle: 'ক্ষুদ্র সঞ্চয় সমবায় সমিতি',
        developer: 'Developer - Abdul Alim Sarkar',
    },
};

export default function MemberLoginScreen() {
    const [language, setLanguage] = useState<Language>('bn');

    const [phone, setPhone] = useState('');

    const [pin, setPin] = useState('');

    const [showPin, setShowPin] = useState(false);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState('');

    const t = translations[language];

    const handleLogin = async () => {
        setError('');

        const trimmedPhone = phone.trim();

        const trimmedPin = pin.trim();

        /*
         * Phone validation
         *
         * 11 digits
         * Starts with 01
         * 3rd digit must be 3-9
         */
        if (!trimmedPhone) {
            setError(t.invalidPhone);
            return;
        }

        if (!/^01[3-9]\d{8}$/.test(trimmedPhone)) {
            setError(t.invalidPhoneFormat);
            return;
        }

        if (!trimmedPin) {
            setError(t.invalidPin);
            return;
        }

        if (!/^\d{4,6}$/.test(trimmedPin)) {
            setError(t.invalidPinLength);
            return;
        }

        try {
            setLoading(true);

            const result = await memberLogin(
                trimmedPhone,
                trimmedPin
            );

            console.log(
                'Login result:',
                result
            );

            if (!result.success) {
                setError(
                    result.message ||
                    t.loginFailed
                );

                return;
            }

            /*
             * Backend থেকে member information না এলে
             * dashboard-এ যাওয়া যাবে না।
             */
            if (!result.member) {
                setError(
                    t.loginSuccessNoMember
                );

                return;
            }

            /*
             * Member information securely save করা হচ্ছে।
             */
            await saveMemberSession(
                result.member
            );

            console.log(
                'Member session saved:',
                result.member.memberId
            );

            /*
             * এবার dashboard-এ যাবে।
             */
            router.replace(
                '/member/dashboard'
            );
        } catch (error) {
            console.error(
                'Member login error:',
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : t.loginTryAgain
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={
                    Platform.OS === 'ios'
                        ? 'padding'
                        : undefined
                }
            >
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={
                        styles.scrollContent
                    }
                >
                    {/* Header */}
                    <View style={styles.header}>

                        {/* Back + Brand */}
                        <View style={styles.headerLeft}>
                            <Pressable
                                onPress={() =>
                                    router.replace('/')
                                }
                                style={({ pressed }) => [
                                    styles.backButton,
                                    pressed &&
                                    styles.backButtonPressed,
                                ]}
                                hitSlop={8}
                            >
                                <Ionicons
                                    name="arrow-back"
                                    size={22}
                                    color="#0f172a"
                                />
                            </Pressable>

                            <View style={styles.brandTextContainer}>
                                <Text
                                    style={styles.appName}
                                >
                                    {t.appName}
                                </Text>

                                <Text
                                    style={styles.appSubtitle}
                                >
                                    {t.appSubtitle}
                                </Text>
                            </View>
                        </View>

                        {/* Language Selector */}
                        <View
                            style={
                                styles.languageSelector
                            }
                        >
                            <Pressable
                                onPress={() => {
                                    setLanguage('bn');
                                    setError('');
                                }}
                                style={[
                                    styles.languageButton,
                                    language === 'bn' &&
                                    styles.languageButtonActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.languageText,
                                        language === 'bn' &&
                                        styles.languageTextActive,
                                    ]}
                                >
                                    বাংলা
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={() => {
                                    setLanguage('en');
                                    setError('');
                                }}
                                style={[
                                    styles.languageButton,
                                    language === 'en' &&
                                    styles.languageButtonActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.languageText,
                                        language === 'en' &&
                                        styles.languageTextActive,
                                    ]}
                                >
                                    EN
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* Main */}
                    <View style={styles.container}>
                        {/* Logo */}
                        <View style={styles.logo}>
                            <Text style={styles.logoText}>
                                👥
                            </Text>
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>
                            {t.title}
                        </Text>

                        <Text style={styles.subtitle}>
                            {t.subtitle}
                        </Text>

                        {/* Login Card */}
                        <View style={styles.loginCard}>

                            {/* Phone Number */}
                            <View
                                style={styles.inputGroup}
                            >
                                <Text style={styles.label}>
                                    {t.phone}
                                </Text>

                                <View
                                    style={
                                        styles.inputWrapper
                                    }
                                >
                                    <Ionicons
                                        name="call-outline"
                                        size={19}
                                        color="#64748b"
                                        style={
                                            styles.inputIcon
                                        }
                                    />

                                    <TextInput
                                        value={phone}
                                        onChangeText={(
                                            value
                                        ) => {
                                            const numericValue =
                                                value.replace(
                                                    /\D/g,
                                                    ''
                                                );

                                            setPhone(
                                                numericValue.slice(
                                                    0,
                                                    11
                                                )
                                            );

                                            setError('');
                                        }}
                                        placeholder={
                                            t.phonePlaceholder
                                        }
                                        placeholderTextColor="#94a3b8"
                                        style={
                                            styles.input
                                        }
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        keyboardType="phone-pad"
                                        maxLength={11}
                                        returnKeyType="next"
                                    />
                                </View>
                            </View>

                            {/* PIN */}
                            <View
                                style={styles.inputGroup}
                            >
                                <View
                                    style={
                                        styles.labelRow
                                    }
                                >
                                    <Text
                                        style={
                                            styles.label
                                        }
                                    >
                                        {t.pin}
                                    </Text>
                                </View>

                                <View
                                    style={
                                        styles.inputWrapper
                                    }
                                >
                                    <Ionicons
                                        name="lock-closed-outline"
                                        size={19}
                                        color="#64748b"
                                        style={
                                            styles.inputIcon
                                        }
                                    />

                                    <TextInput
                                        value={pin}
                                        onChangeText={(
                                            value
                                        ) => {
                                            const numericValue =
                                                value.replace(
                                                    /\D/g,
                                                    ''
                                                );

                                            setPin(
                                                numericValue.slice(
                                                    0,
                                                    6
                                                )
                                            );

                                            setError('');
                                        }}
                                        placeholder={
                                            t.pinPlaceholder
                                        }
                                        placeholderTextColor="#94a3b8"
                                        style={
                                            styles.input
                                        }
                                        secureTextEntry={
                                            !showPin
                                        }
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        returnKeyType="done"
                                        onSubmitEditing={
                                            handleLogin
                                        }
                                    />

                                    {/* PIN Show / Hide Icon */}
                                    <Pressable
                                        onPress={() =>
                                            setShowPin(
                                                (
                                                    previous
                                                ) =>
                                                    !previous
                                            )
                                        }
                                        style={
                                            styles.showPinButton
                                        }
                                        hitSlop={10}
                                    >
                                        <Ionicons
                                            name={
                                                showPin
                                                    ? 'eye'
                                                    : 'eye-off'
                                            }
                                            size={21}
                                            color="#0f172a"
                                        />
                                    </Pressable>
                                </View>
                            </View>

                            {/* Forgot PIN */}
                            <Pressable
                                style={
                                    styles.forgotButton
                                }
                                onPress={() =>
                                    router.push(
                                        '/member/forget-pin'
                                    )
                                }
                            >
                                <Text
                                    style={
                                        styles.forgotText
                                    }
                                >
                                    {t.forgotPin}
                                </Text>
                            </Pressable>

                            {/* Error */}
                            {error ? (
                                <View
                                    style={
                                        styles.errorBox
                                    }
                                >
                                    <Text
                                        style={
                                            styles.errorIcon
                                        }
                                    >
                                        !
                                    </Text>

                                    <Text
                                        style={
                                            styles.errorText
                                        }
                                    >
                                        {error}
                                    </Text>
                                </View>
                            ) : null}

                            {/* Login Button */}
                            <Pressable
                                onPress={handleLogin}
                                disabled={loading}
                                style={({
                                    pressed,
                                }) => [
                                    styles.loginButton,
                                    pressed &&
                                    styles.loginButtonPressed,
                                    loading &&
                                    styles.loginButtonDisabled,
                                ]}
                            >
                                <Text
                                    style={
                                        styles.loginButtonText
                                    }
                                >
                                    {loading
                                        ? t.loggingIn
                                        : t.login}
                                </Text>

                                {!loading && (
                                    <Text
                                        style={
                                            styles.arrow
                                        }
                                    >
                                        →
                                    </Text>
                                )}
                            </Pressable>
                        </View>

                        {/* Registration */}
                        <View
                            style={
                                styles.registration
                            }
                        >
                            <Text
                                style={
                                    styles.registrationText
                                }
                            >
                                {t.noAccount}
                            </Text>

                            <Pressable
                                onPress={() =>
                                    router.push(
                                        '/member/create-account'
                                    )
                                }
                            >
                                <Text
                                    style={
                                        styles.registerText
                                    }
                                >
                                    {t.register}
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>

                        {/* Society Name */}
                        <Text
                            style={
                                styles.footerSociety
                            }
                        >
                            {t.footerTitle}
                        </Text>

                        {/* Developer */}
                        <Text
                            style={
                                styles.footerText
                            }
                        >
                            {t.developer}
                        </Text>

                        <Text
                            style={
                                styles.copyright
                            }
                        >
                            © {new Date().getFullYear()} All
                            rights reserved.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f6f8fb',
    },

    keyboardView: {
        flex: 1,
    },

    scrollContent: {
        flexGrow: 1,
        paddingBottom: 30,
    },

    /* Header */

    header: {
        minHeight: 76,
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },

    backButtonPressed: {
        backgroundColor: '#e2e8f0',
        opacity: 0.85,
    },

    brandTextContainer: {
        marginLeft: 10,
    },

    appName: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0f172a',
    },

    appSubtitle: {
        marginTop: 2,
        fontSize: 11,
        color: '#64748b',
    },

    languageSelector: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        padding: 3,
    },

    languageButton: {
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 8,
    },

    languageButtonActive: {
        backgroundColor: '#0f172a',
    },

    languageText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748b',
    },

    languageTextActive: {
        color: '#ffffff',
    },

    /* Main */

    container: {
        width: '100%',
        maxWidth: 520,
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingTop: 38,
    },

    logo: {
        width: 58,
        height: 58,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 3,
        },
        elevation: 3,
    },

    logoText: {
        fontSize: 28,
        fontWeight: '800',
    },

    title: {
        marginTop: 20,
        textAlign: 'center',
        fontSize: 27,
        lineHeight: 36,
        fontWeight: '800',
        color: '#0f172a',
    },

    subtitle: {
        marginTop: 8,
        textAlign: 'center',
        fontSize: 13,
        lineHeight: 21,
        color: '#64748b',
    },

    /* Login Card */

    loginCard: {
        marginTop: 28,
        padding: 22,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
        shadowColor: '#000000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 3,
        },
        elevation: 2,
    },

    inputGroup: {
        marginBottom: 18,
    },

    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    label: {
        marginBottom: 7,
        fontSize: 12,
        fontWeight: '800',
        color: '#334155',
    },

    inputWrapper: {
        minHeight: 50,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 11,
        backgroundColor: '#f8fafc',
        flexDirection: 'row',
        alignItems: 'center',
    },

    inputIcon: {
        width: 42,
        textAlign: 'center',
    },

    input: {
        flex: 1,
        minHeight: 48,
        paddingHorizontal: 4,
        paddingVertical: 10,
        fontSize: 14,
        color: '#0f172a',
    },

    showPinButton: {
        width: 42,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },

    forgotButton: {
        alignSelf: 'flex-end',
        marginTop: -4,
        marginBottom: 16,
    },

    forgotText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
    },

    /* Error */

    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
        borderRadius: 10,
        paddingHorizontal: 11,
        paddingVertical: 10,
        marginBottom: 15,
    },

    errorIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#dc2626',
        color: '#ffffff',
        textAlign: 'center',
        lineHeight: 20,
        fontSize: 12,
        fontWeight: '900',
        marginRight: 8,
    },

    errorText: {
        flex: 1,
        fontSize: 11,
        lineHeight: 17,
        color: '#b91c1c',
        fontWeight: '600',
    },

    /* Login Button */

    loginButton: {
        minHeight: 50,
        borderRadius: 11,
        backgroundColor: '#0f172a',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    loginButtonPressed: {
        opacity: 0.85,
    },

    loginButtonDisabled: {
        opacity: 0.55,
    },

    loginButtonText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '800',
    },

    arrow: {
        marginLeft: 9,
        color: '#ffffff',
        fontSize: 18,
    },

    /* Registration */

    registration: {
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 10,
    },

    registrationText: {
        fontSize: 11,
        color: '#94a3b8',
    },

    registerText: {
        marginTop: 5,
        fontSize: 12,
        fontWeight: '800',
        color: '#334155',
    },

    /* Footer */

    footer: {
        marginTop: 'auto',
        paddingTop: 35,
        paddingHorizontal: 20,
        alignItems: 'center',
    },

    footerSociety: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748b',
    },

    footerText: {
        marginTop: 3,
        fontSize: 11,
        fontWeight: '700',
        color: '#64748b',
    },

    copyright: {
        marginTop: 4,
        fontSize: 10,
        color: '#94a3b8',
    },
});