import React, {
    useEffect,
    useRef,
    useState,
} from 'react';

import Ionicons from '@expo/vector-icons/Ionicons';

import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import {
    SafeAreaView,
} from 'react-native-safe-area-context';

import {
    router,
    useLocalSearchParams,
} from 'expo-router';

import {
    getMemberLanguage,
    MemberLanguage,
} from '../../lib/member-language';

import {
    resendMemberEmailChangeOTP,
    verifyMemberEmailChangeOTP,
} from '../../lib/member-api';


type Language = MemberLanguage;


const translations = {
    bn: {
        appName: 'ক্ষুদ্র সঞ্চয়',
        appSubtitle: 'সমবায় সমিতি',

        title: 'Gmail পরিবর্তন',
        subtitle: 'Gmail যাচাই করুন',

        verificationTitle: 'OTP যাচাই করুন',

        sentTo: 'OTP পাঠানো হয়েছে',
        verificationMessage:
            'আপনার নতুন Gmail ঠিকানায় একটি ৬ সংখ্যার OTP পাঠানো হয়েছে।',

        otpLabel: '৬ সংখ্যার OTP',
        otpPlaceholder: 'OTP লিখুন',

        verify: 'OTP যাচাই করুন',
        verifying: 'যাচাই হচ্ছে...',

        resend: 'আবার OTP পাঠান',
        resendIn: 'আবার পাঠাতে পারবেন',

        seconds: 'সেকেন্ড',

        changeEmail: 'Gmail পরিবর্তন করুন',
        back: 'পেছনে যান',

        successTitle: 'Gmail পরিবর্তন সফল',
        successMessage:
            'আপনার Gmail ঠিকানা সফলভাবে পরিবর্তন করা হয়েছে।',

        ok: 'ঠিক আছে',

        invalidOtp:
            'সঠিক ৬ সংখ্যার OTP লিখুন।',

        otpExpired:
            'OTP-এর মেয়াদ শেষ হয়েছে। নতুন OTP পাঠান।',

        failed:
            'OTP যাচাই করা যায়নি। আবার চেষ্টা করুন।',

        resendSuccess:
            'নতুন OTP আপনার Gmail-এ পাঠানো হয়েছে।',

        resendFailed:
            'নতুন OTP পাঠানো যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।',

        noAuthorization:
            'Verification session পাওয়া যায়নি। আবার Gmail পরিবর্তন প্রক্রিয়া শুরু করুন।',
    },

    en: {
        appName: 'Khudro Sanchoy',
        appSubtitle: 'Cooperative Society',

        title: 'Change Gmail',
        subtitle: 'Verify Gmail',

        verificationTitle: 'Verify OTP',

        sentTo: 'OTP sent to',
        verificationMessage:
            'A 6-digit OTP has been sent to your new Gmail address.',

        otpLabel: '6-digit OTP',
        otpPlaceholder: 'Enter OTP',

        verify: 'Verify OTP',
        verifying: 'Verifying...',

        resend: 'Resend OTP',
        resendIn: 'You can resend in',

        seconds: 'seconds',

        changeEmail: 'Change Gmail',
        back: 'Go Back',

        successTitle: 'Gmail Changed Successfully',
        successMessage:
            'Your Gmail address has been changed successfully.',

        ok: 'OK',

        invalidOtp:
            'Please enter the correct 6-digit OTP.',

        otpExpired:
            'The OTP has expired. Please request a new OTP.',

        failed:
            'OTP verification failed. Please try again.',

        resendSuccess:
            'A new OTP has been sent to your Gmail.',

        resendFailed:
            'Failed to send a new OTP. Please try again later.',

        noAuthorization:
            'Verification session not found. Please start the Gmail change process again.',
    },
};


export default function MemberEmailVerificationScreen() {

    const params = useLocalSearchParams<{
        authorizationToken?: string;
        newEmail?: string;
        language?: string;
        resendAfter?: string;
    }>();

    const [language, setLanguage] = useState<Language>('bn');

    const [otp, setOtp] = useState('');

    const [submitting, setSubmitting] = useState(false);

    const [resending, setResending] = useState(false);

    const [error, setError] = useState('');

    const [resendCountdown, setResendCountdown] = useState(
        Number(params.resendAfter) || 60
    );

    const otpInputRef = useRef<TextInput>(null);

    const t = translations[language];

    const authorizationToken =
        typeof params.authorizationToken === 'string'
            ? params.authorizationToken
            : '';

    const newEmail =
        typeof params.newEmail === 'string'
            ? params.newEmail
            : '';


    useEffect(() => {
        const loadLanguage = async () => {
            try {
                const savedLanguage = await getMemberLanguage();

                if (
                    savedLanguage === 'bn' ||
                    savedLanguage === 'en'
                ) {
                    setLanguage(savedLanguage);
                    return;
                }
            } catch {
                // Ignore language loading error.
            }

            if (params.language === 'en') {
                setLanguage('en');
            } else {
                setLanguage('bn');
            }
        };

        loadLanguage();
    }, [params.language]);


    useEffect(() => {
        if (resendCountdown <= 0) {
            return;
        }

        const timer = setInterval(() => {
            setResendCountdown((current) => {
                if (current <= 1) {
                    clearInterval(timer);
                    return 0;
                }

                return current - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [resendCountdown]);


    useEffect(() => {
        if (!authorizationToken || !newEmail) {
            return;
        }

        const timer = setTimeout(() => {
            otpInputRef.current?.focus();
        }, 350);

        return () => clearTimeout(timer);
    }, [authorizationToken, newEmail]);


    const handleOtpChange = (value: string) => {
        const numericValue = value
            .replace(/\D/g, '')
            .slice(0, 6);

        setOtp(numericValue);

        if (error) {
            setError('');
        }
    };


    const handleVerify = async () => {

        if (!authorizationToken) {
            setError(t.noAuthorization);
            return;
        }

        if (!newEmail) {
            setError(t.noAuthorization);
            return;
        }

        if (!/^\d{6}$/.test(otp)) {
            setError(t.invalidOtp);
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            await verifyMemberEmailChangeOTP(
                authorizationToken,
                otp
            );

            Alert.alert(
                t.successTitle,
                t.successMessage,
                [
                    {
                        text: t.ok,
                        onPress: () => {
                            router.replace('/member/profile');
                        },
                    },
                ],
                {
                    cancelable: false,
                }
            );

        } catch (err: any) {

            const code = err?.code;

            if (code === 'OTP_EXPIRED') {
                setError(t.otpExpired);
            } else if (code === 'INVALID_OTP') {
                setError(t.invalidOtp);
            } else {
                setError(
                    err?.message || t.failed
                );
            }

        } finally {
            setSubmitting(false);
        }
    };


    const handleResend = async () => {

        if (!authorizationToken || !newEmail) {
            setError(t.noAuthorization);
            return;
        }

        if (resendCountdown > 0 || resending) {
            return;
        }

        try {
            setResending(true);
            setError('');

            const result =
                await resendMemberEmailChangeOTP(
                    authorizationToken,
                    newEmail
                );

            const resendAfter =
                Number(result?.resendAfter) || 60;

            setResendCountdown(resendAfter);
            setOtp('');

            Alert.alert(
                language === 'bn'
                    ? 'OTP পাঠানো হয়েছে'
                    : 'OTP Sent',
                t.resendSuccess
            );

            setTimeout(() => {
                otpInputRef.current?.focus();
            }, 250);

        } catch (err: any) {

            const serverResendAfter =
                Number(err?.resendAfter);

            if (
                Number.isFinite(serverResendAfter) &&
                serverResendAfter > 0
            ) {
                setResendCountdown(serverResendAfter);
            }

            setError(
                err?.message || t.resendFailed
            );

        } finally {
            setResending(false);
        }
    };


    const handleBack = () => {
        router.back();
    };


    if (!authorizationToken || !newEmail) {
        return (
            <SafeAreaView
                style={styles.safeArea}
                edges={['top', 'bottom']}
            >
                <View style={styles.header}>
                    <View style={styles.headerLeft}>

                        <Pressable
                            onPress={handleBack}
                            style={({ pressed }) => [
                                styles.menuButton,
                                pressed &&
                                    styles.menuButtonPressed,
                            ]}
                        >
                            <Ionicons
                                name="arrow-back"
                                size={23}
                                color="#0f172a"
                            />
                        </Pressable>

                        <View>
                            <Text style={styles.appName}>
                                {t.appName}
                            </Text>

                            <Text style={styles.appSubtitle}>
                                {t.appSubtitle}
                            </Text>
                        </View>

                    </View>
                </View>

                <View style={styles.invalidContainer}>
                    <View style={styles.invalidIcon}>
                        <Ionicons
                            name="alert-circle-outline"
                            size={32}
                            color="#dc2626"
                        />
                    </View>

                    <Text style={styles.invalidTitle}>
                        {t.noAuthorization}
                    </Text>

                    <Pressable
                        onPress={handleBack}
                        style={({ pressed }) => [
                            styles.backButton,
                            pressed &&
                                styles.buttonPressed,
                        ]}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={18}
                            color="#ffffff"
                        />

                        <Text style={styles.backButtonText}>
                            {t.back}
                        </Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }


    return (
        <SafeAreaView
            style={styles.safeArea}
            edges={['top', 'bottom']}
        >

            <KeyboardAvoidingView
                style={styles.container}
                behavior={
                    Platform.OS === 'ios'
                        ? 'padding'
                        : undefined
                }
            >

                {/* Header */}
                <View style={styles.header}>

                    <View style={styles.headerLeft}>

                        <Pressable
                            onPress={handleBack}
                            style={({ pressed }) => [
                                styles.menuButton,
                                pressed &&
                                    styles.menuButtonPressed,
                            ]}
                        >
                            <Ionicons
                                name="arrow-back"
                                size={23}
                                color="#0f172a"
                            />
                        </Pressable>

                        <View>
                            <Text style={styles.appName}>
                                {t.appName}
                            </Text>

                            <Text style={styles.appSubtitle}>
                                {t.appSubtitle}
                            </Text>
                        </View>

                    </View>

                </View>


                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={
                        styles.scrollContent
                    }
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >

                    <View style={styles.main}>

                        {/* Page title */}
                        <View style={styles.pageHeading}>

                            <View style={styles.pageIcon}>
                                <Ionicons
                                    name="mail-outline"
                                    size={25}
                                    color="#2563eb"
                                />
                            </View>

                            <View style={styles.pageHeadingText}>
                                <Text style={styles.title}>
                                    {t.title}
                                </Text>

                                <Text style={styles.subtitle}>
                                    {t.subtitle}
                                </Text>
                            </View>

                        </View>


                        {/* Security card */}
                        <View style={styles.securityCard}>

                            <View style={styles.securityIcon}>
                                <Ionicons
                                    name="shield-checkmark-outline"
                                    size={25}
                                    color="#ffffff"
                                />
                            </View>

                            <View style={styles.securityContent}>

                                <Text style={styles.securityTitle}>
                                    {t.verificationTitle}
                                </Text>

                                <Text style={styles.securityText}>
                                    {t.verificationMessage}
                                </Text>

                            </View>

                        </View>


                        {/* Form card */}
                        <View style={styles.formCard}>

                            <Text style={styles.formTitle}>
                                {t.otpLabel}
                            </Text>

                            <Text style={styles.sentToText}>
                                {t.sentTo}
                            </Text>

                            <Text
                                style={styles.emailText}
                                numberOfLines={1}
                            >
                                {newEmail}
                            </Text>


                            {/* OTP input */}
                            <View style={styles.inputContainer}>

                                <Ionicons
                                    name="keypad-outline"
                                    size={20}
                                    color="#64748b"
                                    style={styles.inputIcon}
                                />

                                <TextInput
                                    ref={otpInputRef}
                                    value={otp}
                                    onChangeText={
                                        handleOtpChange
                                    }
                                    placeholder={
                                        t.otpPlaceholder
                                    }
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    returnKeyType="done"
                                    onSubmitEditing={
                                        handleVerify
                                    }
                                    textContentType="oneTimeCode"
                                    autoComplete="sms-otp"
                                    style={styles.otpInput}
                                    selectionColor="#2563eb"
                                />

                                <Text style={styles.otpCounter}>
                                    {otp.length}/6
                                </Text>

                            </View>


                            {/* OTP boxes */}
                            <View style={styles.otpBoxes}>

                                {Array.from({
                                    length: 6,
                                }).map((_, index) => {

                                    const digit =
                                        otp[index] || '';

                                    const isActive =
                                        index === otp.length;

                                    return (
                                        <View
                                            key={index}
                                            style={[
                                                styles.otpBox,
                                                digit &&
                                                    styles.otpBoxFilled,
                                                isActive &&
                                                    styles.otpBoxActive,
                                            ]}
                                        >
                                            <Text
                                                style={
                                                    styles.otpDigit
                                                }
                                            >
                                                {digit}
                                            </Text>
                                        </View>
                                    );
                                })}

                            </View>


                            {/* Error */}
                            {error ? (
                                <View style={styles.errorBox}>

                                    <Ionicons
                                        name="alert-circle-outline"
                                        size={18}
                                        color="#dc2626"
                                    />

                                    <Text
                                        style={
                                            styles.errorText
                                        }
                                    >
                                        {error}
                                    </Text>

                                </View>
                            ) : null}


                            {/* Verify */}
                            <Pressable
                                onPress={handleVerify}
                                disabled={
                                    submitting ||
                                    otp.length !== 6
                                }
                                style={({ pressed }) => [
                                    styles.primaryButton,

                                    (
                                        submitting ||
                                        otp.length !== 6
                                    ) &&
                                        styles.primaryButtonDisabled,

                                    pressed &&
                                        !submitting &&
                                        otp.length === 6 &&
                                        styles.buttonPressed,
                                ]}
                            >

                                {submitting ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#ffffff"
                                    />
                                ) : (
                                    <Ionicons
                                        name="checkmark-circle-outline"
                                        size={20}
                                        color="#ffffff"
                                    />
                                )}

                                <Text
                                    style={
                                        styles.primaryButtonText
                                    }
                                >
                                    {submitting
                                        ? t.verifying
                                        : t.verify}
                                </Text>

                            </Pressable>


                            {/* Resend */}
                            <Pressable
                                onPress={handleResend}
                                disabled={
                                    resendCountdown > 0 ||
                                    resending
                                }
                                style={({ pressed }) => [
                                    styles.resendButton,

                                    (
                                        resendCountdown > 0 ||
                                        resending
                                    ) &&
                                        styles.resendButtonDisabled,

                                    pressed &&
                                        resendCountdown <= 0 &&
                                        styles.resendPressed,
                                ]}
                            >

                                {resending ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#2563eb"
                                    />
                                ) : (
                                    <Ionicons
                                        name="refresh-outline"
                                        size={18}
                                        color={
                                            resendCountdown > 0
                                                ? '#94a3b8'
                                                : '#2563eb'
                                        }
                                    />
                                )}

                                <Text
                                    style={[
                                        styles.resendText,

                                        resendCountdown > 0 &&
                                            styles.resendTextDisabled,
                                    ]}
                                >
                                    {resendCountdown > 0
                                        ? `${t.resendIn} ${resendCountdown} ${t.seconds}`
                                        : t.resend}
                                </Text>

                            </Pressable>


                            {/* Back */}
                            <Pressable
                                onPress={handleBack}
                                style={({ pressed }) => [
                                    styles.secondaryButton,
                                    pressed &&
                                        styles.secondaryPressed,
                                ]}
                            >

                                <Ionicons
                                    name="arrow-back"
                                    size={18}
                                    color="#475569"
                                />

                                <Text
                                    style={
                                        styles.secondaryButtonText
                                    }
                                >
                                    {t.back}
                                </Text>

                            </Pressable>

                        </View>


                        {/* Footer */}
                        <View style={styles.footer}>

                            <Text style={styles.footerAppName}>
                                {t.appName} {t.appSubtitle}
                            </Text>

                            <Text
                                style={styles.footerDeveloper}
                            >
                                {language === 'bn'
                                    ? 'ডেভেলপার - আব্দুল আলিম সরকার'
                                    : 'Developer - Abdul Alim Sarkar'}
                            </Text>

                            <Text
                                style={styles.footerCopyright}
                            >
                                © {new Date().getFullYear()}{' '}
                                {language === 'bn'
                                    ? 'সর্বস্বত্ব সংরক্ষিত'
                                    : 'All rights reserved'}
                            </Text>

                        </View>

                    </View>

                </ScrollView>

            </KeyboardAvoidingView>

        </SafeAreaView>
    );
}


const styles = StyleSheet.create({

    safeArea: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },

    container: {
        flex: 1,
    },

    scrollView: {
        flex: 1,
    },

    scrollContent: {
        flexGrow: 1,
    },


    /* Header */

    header: {
        minHeight: 76,
        paddingHorizontal: 18,
        paddingVertical: 12,
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
        flex: 1,
    },

    menuButton: {
        width: 42,
        height: 42,
        borderRadius: 11,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 11,
    },

    menuButtonPressed: {
        opacity: 0.65,
    },

    appName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
    },

    appSubtitle: {
        marginTop: 2,
        fontSize: 10,
        color: '#64748b',
    },


    /* Main */

    main: {
        width: '100%',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 30,
    },

    pageHeading: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },

    pageIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    pageHeadingText: {
        flex: 1,
    },

    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0f172a',
    },

    subtitle: {
        marginTop: 3,
        fontSize: 12,
        color: '#64748b',
    },


    /* Security */

    securityCard: {
        backgroundColor: '#0f172a',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },

    securityIcon: {
        width: 45,
        height: 45,
        borderRadius: 13,
        backgroundColor: '#1e293b',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 13,
    },

    securityContent: {
        flex: 1,
    },

    securityTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 4,
    },

    securityText: {
        fontSize: 11,
        lineHeight: 17,
        color: '#cbd5e1',
    },


    /* Form */

    formCard: {
        backgroundColor: '#ffffff',
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },

    formTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 5,
    },

    sentToText: {
        fontSize: 11,
        color: '#64748b',
    },

    emailText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#2563eb',
        marginTop: 3,
        marginBottom: 17,
    },


    /* OTP input */

    inputContainer: {
        minHeight: 52,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 13,
    },

    inputIcon: {
        marginRight: 10,
    },

    otpInput: {
        flex: 1,
        height: 50,
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 2,
        color: '#0f172a',
        paddingVertical: 0,
    },

    otpCounter: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94a3b8',
        marginLeft: 6,
    },


    /* OTP boxes */

    otpBoxes: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
        marginBottom: 4,
    },

    otpBox: {
        width: 42,
        height: 48,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 10,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
    },

    otpBoxFilled: {
        borderColor: '#2563eb',
        backgroundColor: '#eff6ff',
    },

    otpBoxActive: {
        borderColor: '#2563eb',
        borderWidth: 1.5,
    },

    otpDigit: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
    },


    /* Error */

    errorBox: {
        marginTop: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
        flexDirection: 'row',
        alignItems: 'center',
    },

    errorText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 11,
        lineHeight: 16,
        color: '#dc2626',
    },


    /* Primary button */

    primaryButton: {
        minHeight: 50,
        borderRadius: 12,
        backgroundColor: '#2563eb',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginTop: 18,
    },

    primaryButtonDisabled: {
        backgroundColor: '#94a3b8',
    },

    primaryButtonText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '800',
        color: '#ffffff',
    },

    buttonPressed: {
        opacity: 0.78,
    },


    /* Resend */

    resendButton: {
        minHeight: 46,
        marginTop: 8,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },

    resendButtonDisabled: {
        opacity: 0.85,
    },

    resendPressed: {
        backgroundColor: '#eff6ff',
    },

    resendText: {
        marginLeft: 7,
        fontSize: 12,
        fontWeight: '800',
        color: '#2563eb',
    },

    resendTextDisabled: {
        color: '#94a3b8',
    },


    /* Secondary */

    secondaryButton: {
        minHeight: 46,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginTop: 4,
    },

    secondaryPressed: {
        opacity: 0.7,
    },

    secondaryButtonText: {
        marginLeft: 7,
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
    },


    /* Footer */

    footer: {
        alignItems: 'center',
        marginTop: 35,
        paddingHorizontal: 20,
    },

    footerAppName: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748b',
    },

    footerDeveloper: {
        marginTop: 4,
        fontSize: 10,
        color: '#94a3b8',
    },

    footerCopyright: {
        marginTop: 4,
        fontSize: 10,
        color: '#94a3b8',
    },


    /* Invalid session */

    invalidContainer: {
        flex: 1,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },

    invalidIcon: {
        width: 64,
        height: 64,
        borderRadius: 18,
        backgroundColor: '#fef2f2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },

    invalidTitle: {
        maxWidth: 330,
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 21,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 20,
    },

    backButton: {
        minHeight: 48,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#2563eb',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    backButtonText: {
        marginLeft: 7,
        fontSize: 13,
        fontWeight: '800',
        color: '#ffffff',
    },

});