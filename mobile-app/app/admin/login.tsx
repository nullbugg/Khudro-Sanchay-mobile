import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { adminLogin } from '../../lib/admin-api';
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

        title: 'অ্যাডমিন লগইন',
        subtitle:
            'আপনার অ্যাডমিন অ্যাকাউন্ট-এ প্রবেশ করতে অ্যাডমিন আইডি ও পাসওয়ার্ড ব্যবহার করুন।',

        adminId: 'অ্যাডমিন আইডি',
        adminIdPlaceholder: 'আপনার অ্যাডমিন আইডি লিখুন',

        password: 'পাসওয়ার্ড',
        passwordPlaceholder: 'আপনার পাসওয়ার্ড লিখুন',

        forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?',

        login: 'লগইন করুন',
        loggingIn: 'লগইন হচ্ছে...',

        invalidId: 'অ্যাডমিন আইডি লিখুন।',
        invalidPassword: 'পাসওয়ার্ড লিখুন।',

        footer: 'ক্ষুদ্র সঞ্চয় সমবায় সমিতি',
        developer: 'ডেভেলপার - আব্দুল আলিম সরকার',
        rights: 'সর্বস্বত্ব সংরক্ষিত।',
    },

    en: {
        appName: 'ক্ষুদ্র সঞ্চয়',
        appSubtitle: 'সমবায় সমিতি',

        title: 'Admin Login',
        subtitle:
            'Use your Admin ID and Password to access the admin account.',

        adminId: 'Admin ID',
        adminIdPlaceholder: 'Enter your Admin ID',

        password: 'Password',
        passwordPlaceholder: 'Enter your Password',

        forgotPassword: 'Forgot Password?',

        login: 'Login',
        loggingIn: 'Logging in...',

        invalidId: 'Please enter your Admin ID.',
        invalidPassword: 'Please enter your Password.',

        footer: 'ক্ষুদ্র সঞ্চয় সমবায় সমিতি',
        developer: 'Developer - Abdul Alim Sarkar',
        rights: 'All rights reserved.',
    },
};

export default function AdminLoginScreen() {
    const [language, setLanguage] =
        useState<Language>('bn');

    const [adminId, setAdminId] =
        useState('');

    const [password, setPassword] =
        useState('');

    const [showPassword, setShowPassword] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState('');

    const t =
        translations[language];

    /*
    |--------------------------------------------------------------------------
    | Admin Login
    |--------------------------------------------------------------------------
    */

    const handleLogin = async () => {
        setError('');

        const trimmedAdminId =
            adminId.trim();

        const trimmedPassword =
            password.trim();

        /*
         * Admin ID validation
         */

        if (!trimmedAdminId) {
            setError(t.invalidId);
            return;
        }

        /*
         * Password validation
         */

        if (!trimmedPassword) {
            setError(t.invalidPassword);
            return;
        }

        try {
            setLoading(true);

            const result =
                await adminLogin(
                    trimmedAdminId,
                    trimmedPassword
                );

            console.log(
                'Admin login result:',
                result
            );

            /*
             * Login failed
             */

            if (!result.success) {
                setError(
                    result.message ||
                    'Login করা যায়নি।'
                );

                return;
            }

            /*
             * Login successful
             */

            console.log(
                'Admin login successful:',
                trimmedAdminId
            );

            /*
             * Admin Dashboard
             */

            router.replace(
                '/admin/dashboard'
            );
        } catch (error) {
            console.error(
                'Admin login error:',
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : 'Login করা যায়নি। আবার চেষ্টা করুন।'
            );
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | UI
    |--------------------------------------------------------------------------
    */

    return (
        <SafeAreaView
            style={styles.safeArea}
        >
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
                    showsVerticalScrollIndicator={
                        false
                    }
                    contentContainerStyle={
                        styles.scrollContent
                    }
                >
                    {/* Header */}

                    <View style={styles.header}>
                        <Pressable
                            onPress={() => router.replace('/')}
                            style={styles.brandContainer}
                        >
                            <View style={styles.backButton}>
                                <Ionicons
                                    name="arrow-back"
                                    size={22}
                                    color="#0f172a"
                                />
                            </View>

                            <View>
                                <Text style={styles.appName}>
                                    {t.appName}
                                </Text>

                                <Text style={styles.appSubtitle}>
                                    {t.appSubtitle}
                                </Text>
                            </View>
                        </Pressable>

                        {/* Language Selector */}

                        <View style={styles.languageSelector}>
                            <Pressable
                                onPress={() => setLanguage('bn')}
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
                                onPress={() => setLanguage('en')}
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

                    <View
                        style={styles.container}
                    >
                        {/* Admin Logo */}

                        <View
                            style={styles.logo}
                        >
                            <Ionicons
                                name="shield-checkmark"
                                size={30}
                                color="#0f172a"
                            />
                        </View>

                        {/* Title */}

                        <Text
                            style={styles.title}
                        >
                            {t.title}
                        </Text>

                        <Text
                            style={styles.subtitle}
                        >
                            {t.subtitle}
                        </Text>

                        {/* Login Card */}

                        <View
                            style={
                                styles.loginCard
                            }
                        >
                            {/* Admin ID */}

                            <View
                                style={
                                    styles.inputGroup
                                }
                            >
                                <Text
                                    style={
                                        styles.label
                                    }
                                >
                                    {t.adminId}
                                </Text>

                                <View
                                    style={
                                        styles.inputWrapper
                                    }
                                >
                                    <Text
                                        style={
                                            styles.inputIcon
                                        }
                                    >
                                        #
                                    </Text>

                                    <TextInput
                                        value={
                                            adminId
                                        }
                                        onChangeText={(
                                            value
                                        ) => {
                                            setAdminId(
                                                value
                                            );

                                            setError(
                                                ''
                                            );
                                        }}
                                        placeholder={
                                            t.adminIdPlaceholder
                                        }
                                        placeholderTextColor="#94a3b8"
                                        style={
                                            styles.input
                                        }
                                        autoCapitalize="none"
                                        autoCorrect={
                                            false
                                        }
                                        keyboardType="default"
                                        returnKeyType="next"
                                    />
                                </View>
                            </View>

                            {/* Password */}

                            <View
                                style={
                                    styles.inputGroup
                                }
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
                                        {t.password}
                                    </Text>
                                </View>

                                <View
                                    style={
                                        styles.inputWrapper
                                    }
                                >
                                    <Ionicons
                                        name="lock-closed-outline"
                                        size={18}
                                        color="#64748b"
                                        style={
                                            styles.passwordIcon
                                        }
                                    />

                                    <TextInput
                                        value={
                                            password
                                        }
                                        onChangeText={(
                                            value
                                        ) => {
                                            setPassword(
                                                value
                                            );

                                            setError(
                                                ''
                                            );
                                        }}
                                        placeholder={
                                            t.passwordPlaceholder
                                        }
                                        placeholderTextColor="#94a3b8"
                                        style={
                                            styles.input
                                        }
                                        secureTextEntry={
                                            !showPassword
                                        }
                                        autoCapitalize="none"
                                        autoCorrect={
                                            false
                                        }
                                        keyboardType="default"
                                        returnKeyType="done"
                                        onSubmitEditing={
                                            handleLogin
                                        }
                                    />

                                    {/* Show / Hide Password */}

                                    <Pressable
                                        onPress={() =>
                                            setShowPassword(
                                                (
                                                    previous
                                                ) =>
                                                    !previous
                                            )
                                        }
                                        style={
                                            styles.showPasswordButton
                                        }
                                        hitSlop={
                                            10
                                        }
                                    >
                                        <Ionicons
                                            name={
                                                showPassword
                                                    ? 'eye'
                                                    : 'eye-off'
                                            }
                                            size={
                                                21
                                            }
                                            color="#0f172a"
                                        />
                                    </Pressable>
                                </View>
                            </View>

                            {/* Forgot Password */}

                            <Pressable
                                style={styles.forgotButton}
                                onPress={() => {
                                    router.push('/admin/forgot-password');
                                }}
                            >
                                <Text
                                    style={
                                        styles.forgotText
                                    }
                                >
                                    {
                                        t.forgotPassword
                                    }
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
                                onPress={
                                    handleLogin
                                }
                                disabled={
                                    loading
                                }
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
                    </View>

                    {/* Footer */}

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            {t.footer}
                        </Text>

                        <Text style={styles.footerText}>
                            {t.developer}
                        </Text>

                        <Text style={styles.copyright}>
                            © {new Date().getFullYear()} {t.rights}
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

    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
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
        fontSize: 13,
        fontWeight: '800',
        color: '#64748b',
    },

    passwordIcon: {
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

    showPasswordButton: {
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

    /* Footer */

    footer: {
        marginTop: 'auto',
        paddingTop: 35,
        paddingHorizontal: 20,
        alignItems: 'center',
    },

    footerText: {
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

