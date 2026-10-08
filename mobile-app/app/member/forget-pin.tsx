import React, {
    useEffect,
    useState,
} from 'react';

import Ionicons from '@expo/vector-icons/Ionicons';

import {
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
} from 'expo-router';

import {
    getAdminLanguage,
} from '../../lib/admin-language';

import {
    sendMemberPinResetOTP,
    verifyMemberPinResetOTP,
    resendMemberPinResetOTP,
    resetMemberPin,
} from '../../lib/member-api';

type Language = 'bn' | 'en';

type Step =
    | 'phone'
    | 'otp'
    | 'pin';

export default function ForgotPinScreen() {
    const [language, setLanguage] =
        useState<Language>('bn');

    const [step, setStep] =
        useState<Step>('phone');

    const [phone, setPhone] =
        useState('');

    const [email, setEmail] =
        useState('');

    const [otp, setOtp] =
        useState('');

    const [newPin, setNewPin] =
        useState('');

    const [confirmPin, setConfirmPin] =
        useState('');

    const [resetToken, setResetToken] =
        useState('');

    const [resendCountdown, setResendCountdown] =
        useState(0);

    const [showNewPin, setShowNewPin] =
        useState(false);

    const [showConfirmPin, setShowConfirmPin] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [resending, setResending] =
        useState(false);

    const [error, setError] =
        useState('');

    /*
     * ---------------------------------------------------------------
     * Language
     * ---------------------------------------------------------------
     */

    useEffect(() => {
        const loadLanguage =
            async () => {
                try {
                    const saved =
                        await getAdminLanguage();

                    if (
                        saved === 'en' ||
                        saved === 'bn'
                    ) {
                        setLanguage(saved);
                    }
                } catch {
                    setLanguage('bn');
                }
            };

        loadLanguage();
    }, []);

    /*
     * ---------------------------------------------------------------
     * Countdown
     * ---------------------------------------------------------------
     */

    useEffect(() => {
        if (
            resendCountdown <= 0
        ) {
            return;
        }

        const timer =
            setInterval(() => {
                setResendCountdown(
                    (previous) =>
                        previous > 0
                            ? previous - 1
                            : 0
                );
            }, 1000);

        return () =>
            clearInterval(timer);
    }, [resendCountdown]);

    /*
     * ---------------------------------------------------------------
     * Translations
     * ---------------------------------------------------------------
     */

    const t =
        language === 'bn'
            ? {
                appName:
                    'ক্ষুদ্র সঞ্চয়',

                subtitle:
                    'সমবায় সমিতি',

                phoneTitle:
                    'PIN ভুলে গেছেন?',

                phoneSubtitle:
                    'আপনার Member account-এর সাথে যুক্ত মোবাইল নম্বর দিন',

                otpTitle:
                    'OTP যাচাই করুন',

                otpSubtitle:
                    'আপনার registered Gmail-এ পাঠানো OTP দিন',

                pinTitle:
                    'নতুন PIN সেট করুন',

                pinSubtitle:
                    'আপনার account-এর জন্য একটি নতুন PIN তৈরি করুন',

                phoneLabel:
                    'মোবাইল নম্বর',

                phonePlaceholder:
                    '01XXXXXXXXX',

                emailLabel:
                    'Registered Gmail',

                otpLabel:
                    'OTP',

                otpPlaceholder:
                    '৬ সংখ্যার OTP দিন',

                newPinLabel:
                    'নতুন PIN',

                newPinPlaceholder:
                    '৪–৬ সংখ্যার PIN দিন',

                confirmPinLabel:
                    'PIN আবার লিখুন',

                confirmPinPlaceholder:
                    'নতুন PIN আবার লিখুন',

                continue:
                    'এগিয়ে যান',

                verifyOtp:
                    'OTP যাচাই করুন',

                resetPin:
                    'PIN Reset করুন',

                resendOtp:
                    'আবার OTP পাঠান',

                resendIn:
                    'সেকেন্ড পরে আবার পাঠাতে পারবেন',

                back:
                    'পেছনে',

                memberLogin:
                    'Member Login',

                successTitle:
                    'PIN সফলভাবে পরিবর্তন হয়েছে',

                successMessage:
                    'আপনার নতুন PIN দিয়ে এখন Member Login করতে পারবেন।',

                invalidPhone:
                    'সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন',

                invalidOtp:
                    '৬ সংখ্যার OTP দিন',

                invalidPin:
                    'PIN অবশ্যই ৪ থেকে ৬ সংখ্যার হতে হবে',

                pinMismatch:
                    'PIN এবং Confirm PIN মিলছে না',

                otpSent:
                    'আপনার registered Gmail-এ OTP পাঠানো হয়েছে',

                failed:
                    'কাজটি সম্পন্ন করা যায়নি',
            }
            : {
                appName:
                    'Khudro Sanchoy',

                subtitle:
                    'Cooperative Society',

                phoneTitle:
                    'Forgot your PIN?',

                phoneSubtitle:
                    'Enter the mobile number linked to your Member account',

                otpTitle:
                    'Verify OTP',

                otpSubtitle:
                    'Enter the OTP sent to your registered Gmail',

                pinTitle:
                    'Set New PIN',

                pinSubtitle:
                    'Create a new PIN for your account',

                phoneLabel:
                    'Mobile Number',

                phonePlaceholder:
                    '01XXXXXXXXX',

                emailLabel:
                    'Registered Gmail',

                otpLabel:
                    'OTP',

                otpPlaceholder:
                    'Enter 6-digit OTP',

                newPinLabel:
                    'New PIN',

                newPinPlaceholder:
                    'Enter 4–6 digit PIN',

                confirmPinLabel:
                    'Confirm PIN',

                confirmPinPlaceholder:
                    'Enter PIN again',

                continue:
                    'Continue',

                verifyOtp:
                    'Verify OTP',

                resetPin:
                    'Reset PIN',

                resendOtp:
                    'Resend OTP',

                resendIn:
                    'seconds before resend',

                back:
                    'Back',

                memberLogin:
                    'Member Login',

                successTitle:
                    'PIN Reset Successful',

                successMessage:
                    'You can now login with your new PIN.',

                invalidPhone:
                    'Please enter a valid 11-digit mobile number',

                invalidOtp:
                    'Please enter the 6-digit OTP',

                invalidPin:
                    'PIN must contain 4 to 6 digits',

                pinMismatch:
                    'PIN and Confirm PIN do not match',

                otpSent:
                    'An OTP has been sent to your registered Gmail',

                failed:
                    'The operation could not be completed',
            };

    /*
     * ---------------------------------------------------------------
     * Change Language
     * ---------------------------------------------------------------
     */

    const changeLanguage = (
        nextLanguage: Language
    ) => {
        setLanguage(
            nextLanguage
        );

        setError('');
    };

    /*
     * ---------------------------------------------------------------
     * Send OTP
     * ---------------------------------------------------------------
     */

    const handleSendOTP =
        async () => {
            setError('');

            const normalizedPhone =
                phone.trim();

            if (
                !/^01[3-9]\d{8}$/.test(
                    normalizedPhone
                )
            ) {
                setError(
                    t.invalidPhone
                );

                return;
            }

            try {
                setLoading(true);

                const result =
                    await sendMemberPinResetOTP(
                        normalizedPhone,
                        language
                    );

                setPhone(
                    normalizedPhone
                );

                setEmail(
                    result?.email ||
                    ''
                );

                setOtp('');

                setResetToken('');

                setResendCountdown(
                    Number(
                        result?.resendAfter ||
                        60
                    )
                );

                setStep('otp');
            } catch (
            requestError: any
            ) {
                setError(
                    requestError?.message ||
                    t.failed
                );
            } finally {
                setLoading(false);
            }
        };

    /*
     * ---------------------------------------------------------------
     * Verify OTP
     * ---------------------------------------------------------------
     */

    const handleVerifyOTP =
        async () => {
            setError('');

            const normalizedOTP =
                otp.trim();

            if (
                !/^\d{6}$/.test(
                    normalizedOTP
                )
            ) {
                setError(
                    t.invalidOtp
                );

                return;
            }

            try {
                setLoading(true);

                const result =
                    await verifyMemberPinResetOTP(
                        phone.trim(),
                        normalizedOTP
                    );

                if (
                    !result?.resetToken
                ) {
                    throw new Error(
                        t.failed
                    );
                }

                setResetToken(
                    result.resetToken
                );

                setNewPin('');

                setConfirmPin('');

                setError('');

                setStep('pin');
            } catch (
            requestError: any
            ) {
                setError(
                    requestError?.message ||
                    t.failed
                );
            } finally {
                setLoading(false);
            }
        };

    /*
     * ---------------------------------------------------------------
     * Resend OTP
     * ---------------------------------------------------------------
     */

    const handleResendOTP =
        async () => {
            if (
                resendCountdown > 0 ||
                resending
            ) {
                return;
            }

            setError('');

            try {
                setResending(true);

                const result =
                    await resendMemberPinResetOTP(
                        phone.trim(),
                        language
                    );

                setOtp('');

                setResendCountdown(
                    Number(
                        result?.resendAfter ||
                        60
                    )
                );
            } catch (
            requestError: any
            ) {
                const cooldown =
                    Number(
                        requestError?.resendAfter ||
                        0
                    );

                if (
                    cooldown > 0
                ) {
                    setResendCountdown(
                        cooldown
                    );
                }

                setError(
                    requestError?.message ||
                    t.failed
                );
            } finally {
                setResending(false);
            }
        };

    /*
     * ---------------------------------------------------------------
     * Reset PIN
     * ---------------------------------------------------------------
     */

    const handleResetPin =
        async () => {
            setError('');

            const normalizedNewPin =
                newPin.trim();

            const normalizedConfirmPin =
                confirmPin.trim();

            if (
                !/^\d{4,6}$/.test(
                    normalizedNewPin
                )
            ) {
                setError(
                    t.invalidPin
                );

                return;
            }

            if (
                normalizedNewPin !==
                normalizedConfirmPin
            ) {
                setError(
                    t.pinMismatch
                );

                return;
            }

            if (!resetToken) {
                setError(
                    t.failed
                );

                return;
            }

            try {
                setLoading(true);

                await resetMemberPin(
                    phone.trim(),
                    resetToken,
                    normalizedNewPin,
                    normalizedConfirmPin
                );

                setPhone('');

                setEmail('');

                setOtp('');

                setNewPin('');

                setConfirmPin('');

                setResetToken('');

                Alert.alert(
                    t.successTitle,
                    t.successMessage,
                    [
                        {
                            text:
                                t.memberLogin,
                            onPress:
                                () =>
                                    router.replace(
                                        '/member/login'
                                    ),
                        },
                    ]
                );
            } catch (
            requestError: any
            ) {
                setError(
                    requestError?.message ||
                    t.failed
                );
            } finally {
                setLoading(false);
            }
        };

    /*
     * ---------------------------------------------------------------
     * Back
     * ---------------------------------------------------------------
     */

    const handleBack =
        () => {
            setError('');

            if (
                step === 'otp'
            ) {
                setOtp('');

                setResetToken('');

                setStep('phone');

                return;
            }

            if (
                step === 'pin'
            ) {
                setNewPin('');

                setConfirmPin('');

                setResetToken('');

                setStep('otp');

                return;
            }

            router.back();
        };

    /*
     * ---------------------------------------------------------------
     * Step Icon
     * ---------------------------------------------------------------
     */

    const getStepIcon =
        () => {
            if (
                step === 'phone'
            ) {
                return 'phone-portrait-outline';
            }

            if (
                step === 'otp'
            ) {
                return 'mail-outline';
            }

            return 'lock-closed-outline';
        };

    /*
     * ---------------------------------------------------------------
     * Main UI
     * ---------------------------------------------------------------
     */

    return (
        <SafeAreaView
            style={styles.safeArea}
            edges={['top', 'bottom']}
        >
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={
                    Platform.OS ===
                        'ios'
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
                    {/* ------------------------------------------------
                        Header
                    ------------------------------------------------ */}

                    <View
                        style={
                            styles.header
                        }
                    >
                        <View
                            style={
                                styles.brand
                            }
                        >
                            <View
                                style={
                                    styles.logo
                                }
                            >
                                <Text
                                    style={
                                        styles.logoText
                                    }
                                >
                                    ৳
                                </Text>
                            </View>

                            <View>
                                <Text
                                    style={
                                        styles.appName
                                    }
                                >
                                    {
                                        t.appName
                                    }
                                </Text>

                                <Text
                                    style={
                                        styles.subtitle
                                    }
                                >
                                    {
                                        t.subtitle
                                    }
                                </Text>
                            </View>
                        </View>

                        <View
                            style={
                                styles.languageSelector
                            }
                        >
                            <Pressable
                                onPress={() =>
                                    changeLanguage(
                                        'bn'
                                    )
                                }
                                style={[
                                    styles.languageOption,
                                    language ===
                                    'bn' &&
                                    styles.languageOptionActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.languageText,
                                        language ===
                                        'bn' &&
                                        styles.languageTextActive,
                                    ]}
                                >
                                    বাংলা
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={() =>
                                    changeLanguage(
                                        'en'
                                    )
                                }
                                style={[
                                    styles.languageOption,
                                    language ===
                                    'en' &&
                                    styles.languageOptionActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.languageText,
                                        language ===
                                        'en' &&
                                        styles.languageTextActive,
                                    ]}
                                >
                                    EN
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* ------------------------------------------------
                        Main
                    ------------------------------------------------ */}

                    <View
                        style={
                            styles.main
                        }
                    >
                        <View
                            style={
                                styles.iconCircle
                            }
                        >
                            <Ionicons
                                name={
                                    getStepIcon() as any
                                }
                                size={30}
                                color="#0f172a"
                            />
                        </View>

                        <Text
                            style={
                                styles.title
                            }
                        >
                            {step ===
                                'phone'
                                ? t.phoneTitle
                                : step ===
                                    'otp'
                                    ? t.otpTitle
                                    : t.pinTitle}
                        </Text>

                        <Text
                            style={
                                styles.description
                            }
                        >
                            {step ===
                                'phone'
                                ? t.phoneSubtitle
                                : step ===
                                    'otp'
                                    ? t.otpSubtitle
                                    : t.pinSubtitle}
                        </Text>

                        {/* ------------------------------------------------
                            Card
                        ------------------------------------------------ */}

                        <View
                            style={
                                styles.card
                            }
                        >
                            {/* ------------------------------------------------
                                Phone Step
                            ------------------------------------------------ */}

                            {step ===
                                'phone' && (
                                    <>
                                        <Text
                                            style={
                                                styles.inputLabel
                                            }
                                        >
                                            {
                                                t.phoneLabel
                                            }
                                        </Text>

                                        <View
                                            style={
                                                styles.inputWrapper
                                            }
                                        >
                                            <Ionicons
                                                name="phone-portrait-outline"
                                                size={
                                                    19
                                                }
                                                color="#64748b"
                                            />

                                            <TextInput
                                                style={
                                                    styles.input
                                                }
                                                value={
                                                    phone
                                                }
                                                onChangeText={(
                                                    value
                                                ) =>
                                                    setPhone(
                                                        value.replace(
                                                            /\D/g,
                                                            ''
                                                        )
                                                    )
                                                }
                                                placeholder={
                                                    t.phonePlaceholder
                                                }
                                                placeholderTextColor="#94a3b8"
                                                keyboardType="phone-pad"
                                                maxLength={
                                                    11
                                                }
                                                autoCapitalize="none"
                                                autoCorrect={
                                                    false
                                                }
                                                editable={
                                                    !loading
                                                }
                                            />
                                        </View>

                                        {error ? (
                                            <View
                                                style={
                                                    styles.errorBox
                                                }
                                            >
                                                <Ionicons
                                                    name="alert-circle-outline"
                                                    size={
                                                        17
                                                    }
                                                    color="#dc2626"
                                                />

                                                <Text
                                                    style={
                                                        styles.errorText
                                                    }
                                                >
                                                    {
                                                        error
                                                    }
                                                </Text>
                                            </View>
                                        ) : null}

                                        <Pressable
                                            disabled={
                                                loading
                                            }
                                            onPress={
                                                handleSendOTP
                                            }
                                            style={({ pressed }) => [
                                                styles.primaryButton,
                                                pressed &&
                                                styles.primaryButtonPressed,
                                                loading &&
                                                styles.primaryButtonDisabled,
                                            ]}
                                        >
                                            {loading ? (
                                                <Ionicons
                                                    name="hourglass-outline"
                                                    size={
                                                        19
                                                    }
                                                    color="#ffffff"
                                                />
                                            ) : (
                                                <Ionicons
                                                    name="arrow-forward-outline"
                                                    size={
                                                        19
                                                    }
                                                    color="#ffffff"
                                                />
                                            )}

                                            <Text
                                                style={
                                                    styles.primaryButtonText
                                                }
                                            >
                                                {
                                                    t.continue
                                                }
                                            </Text>
                                        </Pressable>
                                    </>
                                )}

                            {/* ------------------------------------------------
                                OTP Step
                            ------------------------------------------------ */}

                            {step ===
                                'otp' && (
                                    <>
                                        <Text
                                            style={
                                                styles.inputLabel
                                            }
                                        >
                                            {
                                                t.emailLabel
                                            }
                                        </Text>

                                        <View
                                            style={
                                                styles.emailBox
                                            }
                                        >
                                            <Ionicons
                                                name="mail-outline"
                                                size={
                                                    19
                                                }
                                                color="#64748b"
                                            />

                                            <Text
                                                style={
                                                    styles.emailText
                                                }
                                            >
                                                {
                                                    email
                                                }
                                            </Text>
                                        </View>

                                        <Text
                                            style={[
                                                styles.otpSentText,
                                                {
                                                    marginTop: 8,
                                                },
                                            ]}
                                        >
                                            {
                                                t.otpSent
                                            }
                                        </Text>

                                        <Text
                                            style={[
                                                styles.inputLabel,
                                                {
                                                    marginTop: 18,
                                                },
                                            ]}
                                        >
                                            {
                                                t.otpLabel
                                            }
                                        </Text>

                                        <View
                                            style={
                                                styles.inputWrapper
                                            }
                                        >
                                            <Ionicons
                                                name="keypad-outline"
                                                size={
                                                    19
                                                }
                                                color="#64748b"
                                            />

                                            <TextInput
                                                style={[
                                                    styles.input,
                                                    styles.otpInput,
                                                ]}
                                                value={
                                                    otp
                                                }
                                                onChangeText={(
                                                    value
                                                ) =>
                                                    setOtp(
                                                        value.replace(
                                                            /\D/g,
                                                            ''
                                                        )
                                                    )
                                                }
                                                placeholder={
                                                    t.otpPlaceholder
                                                }
                                                placeholderTextColor="#94a3b8"
                                                keyboardType="number-pad"
                                                maxLength={
                                                    6
                                                }
                                                autoCapitalize="none"
                                                autoCorrect={
                                                    false
                                                }
                                                editable={
                                                    !loading
                                                }
                                            />
                                        </View>

                                        {error ? (
                                            <View
                                                style={
                                                    styles.errorBox
                                                }
                                            >
                                                <Ionicons
                                                    name="alert-circle-outline"
                                                    size={
                                                        17
                                                    }
                                                    color="#dc2626"
                                                />

                                                <Text
                                                    style={
                                                        styles.errorText
                                                    }
                                                >
                                                    {
                                                        error
                                                    }
                                                </Text>
                                            </View>
                                        ) : null}

                                        <Pressable
                                            disabled={
                                                loading
                                            }
                                            onPress={
                                                handleVerifyOTP
                                            }
                                            style={({ pressed }) => [
                                                styles.primaryButton,
                                                pressed &&
                                                styles.primaryButtonPressed,
                                                loading &&
                                                styles.primaryButtonDisabled,
                                            ]}
                                        >
                                            {loading ? (
                                                <Ionicons
                                                    name="hourglass-outline"
                                                    size={
                                                        19
                                                    }
                                                    color="#ffffff"
                                                />
                                            ) : (
                                                <Ionicons
                                                    name="checkmark-circle-outline"
                                                    size={
                                                        19
                                                    }
                                                    color="#ffffff"
                                                />
                                            )}

                                            <Text
                                                style={
                                                    styles.primaryButtonText
                                                }
                                            >
                                                {
                                                    t.verifyOtp
                                                }
                                            </Text>
                                        </Pressable>

                                        <Pressable
                                            disabled={
                                                resendCountdown >
                                                0 ||
                                                resending
                                            }
                                            onPress={
                                                handleResendOTP
                                            }
                                            style={({ pressed }) => [
                                                styles.resendButton,
                                                pressed &&
                                                styles.resendButtonPressed,
                                                (resendCountdown >
                                                    0 ||
                                                    resending) &&
                                                styles.resendButtonDisabled,
                                            ]}
                                        >
                                            <Ionicons
                                                name="refresh-outline"
                                                size={
                                                    17
                                                }
                                                color={
                                                    resendCountdown >
                                                        0 ||
                                                        resending
                                                        ? '#94a3b8'
                                                        : '#0f172a'
                                                }
                                            />

                                            <Text
                                                style={[
                                                    styles.resendText,
                                                    (resendCountdown >
                                                        0 ||
                                                        resending) &&
                                                    styles.resendTextDisabled,
                                                ]}
                                            >
                                                {resendCountdown >
                                                    0
                                                    ? `${resendCountdown} ${t.resendIn}`
                                                    : t.resendOtp}
                                            </Text>
                                        </Pressable>
                                    </>
                                )}

                            {/* ------------------------------------------------
                                New PIN Step
                            ------------------------------------------------ */}

                            {step ===
                                'pin' && (
                                    <>
                                        <Text
                                            style={
                                                styles.inputLabel
                                            }
                                        >
                                            {
                                                t.newPinLabel
                                            }
                                        </Text>

                                        <View
                                            style={
                                                styles.inputWrapper
                                            }
                                        >
                                            <Ionicons
                                                name="lock-closed-outline"
                                                size={
                                                    19
                                                }
                                                color="#64748b"
                                            />

                                            <TextInput
                                                style={
                                                    styles.input
                                                }
                                                value={
                                                    newPin
                                                }
                                                onChangeText={(
                                                    value
                                                ) =>
                                                    setNewPin(
                                                        value.replace(
                                                            /\D/g,
                                                            ''
                                                        )
                                                    )
                                                }
                                                placeholder={
                                                    t.newPinPlaceholder
                                                }
                                                placeholderTextColor="#94a3b8"
                                                secureTextEntry={
                                                    !showNewPin
                                                }
                                                keyboardType="number-pad"
                                                maxLength={
                                                    6
                                                }
                                                autoCapitalize="none"
                                                autoCorrect={
                                                    false
                                                }
                                                editable={
                                                    !loading
                                                }
                                            />

                                            <Pressable
                                                onPress={() =>
                                                    setShowNewPin(
                                                        (
                                                            previous
                                                        ) =>
                                                            !previous
                                                    )
                                                }
                                                hitSlop={
                                                    10
                                                }
                                            >
                                                <Ionicons
                                                    name={
                                                        showNewPin
                                                            ? 'eye-off-outline'
                                                            : 'eye-outline'
                                                    }
                                                    size={
                                                        20
                                                    }
                                                    color="#64748b"
                                                />
                                            </Pressable>
                                        </View>

                                        <Text
                                            style={[
                                                styles.inputLabel,
                                                {
                                                    marginTop: 18,
                                                },
                                            ]}
                                        >
                                            {
                                                t.confirmPinLabel
                                            }
                                        </Text>

                                        <View
                                            style={
                                                styles.inputWrapper
                                            }
                                        >
                                            <Ionicons
                                                name="shield-checkmark-outline"
                                                size={
                                                    19
                                                }
                                                color="#64748b"
                                            />

                                            <TextInput
                                                style={
                                                    styles.input
                                                }
                                                value={
                                                    confirmPin
                                                }
                                                onChangeText={(
                                                    value
                                                ) =>
                                                    setConfirmPin(
                                                        value.replace(
                                                            /\D/g,
                                                            ''
                                                        )
                                                    )
                                                }
                                                placeholder={
                                                    t.confirmPinPlaceholder
                                                }
                                                placeholderTextColor="#94a3b8"
                                                secureTextEntry={
                                                    !showConfirmPin
                                                }
                                                keyboardType="number-pad"
                                                maxLength={
                                                    6
                                                }
                                                autoCapitalize="none"
                                                autoCorrect={
                                                    false
                                                }
                                                editable={
                                                    !loading
                                                }
                                            />

                                            <Pressable
                                                onPress={() =>
                                                    setShowConfirmPin(
                                                        (
                                                            previous
                                                        ) =>
                                                            !previous
                                                    )
                                                }
                                                hitSlop={
                                                    10
                                                }
                                            >
                                                <Ionicons
                                                    name={
                                                        showConfirmPin
                                                            ? 'eye-off-outline'
                                                            : 'eye-outline'
                                                    }
                                                    size={
                                                        20
                                                    }
                                                    color="#64748b"
                                                />
                                            </Pressable>
                                        </View>

                                        {error ? (
                                            <View
                                                style={
                                                    styles.errorBox
                                                }
                                            >
                                                <Ionicons
                                                    name="alert-circle-outline"
                                                    size={
                                                        17
                                                    }
                                                    color="#dc2626"
                                                />

                                                <Text
                                                    style={
                                                        styles.errorText
                                                    }
                                                >
                                                    {
                                                        error
                                                    }
                                                </Text>
                                            </View>
                                        ) : null}

                                        <Pressable
                                            disabled={
                                                loading
                                            }
                                            onPress={
                                                handleResetPin
                                            }
                                            style={({ pressed }) => [
                                                styles.primaryButton,
                                                pressed &&
                                                styles.primaryButtonPressed,
                                                loading &&
                                                styles.primaryButtonDisabled,
                                            ]}
                                        >
                                            {loading ? (
                                                <Ionicons
                                                    name="hourglass-outline"
                                                    size={
                                                        19
                                                    }
                                                    color="#ffffff"
                                                />
                                            ) : (
                                                <Ionicons
                                                    name="lock-open-outline"
                                                    size={
                                                        19
                                                    }
                                                    color="#ffffff"
                                                />
                                            )}

                                            <Text
                                                style={
                                                    styles.primaryButtonText
                                                }
                                            >
                                                {
                                                    t.resetPin
                                                }
                                            </Text>
                                        </Pressable>
                                    </>
                                )}

                            {/* ------------------------------------------------
                                Back
                            ------------------------------------------------ */}

                            <Pressable
                                onPress={
                                    handleBack
                                }
                                disabled={
                                    loading
                                }
                                style={({ pressed }) => [
                                    styles.backButton,
                                    pressed &&
                                    styles.backButtonPressed,
                                ]}
                            >
                                <Ionicons
                                    name="arrow-back-outline"
                                    size={
                                        17
                                    }
                                    color="#475569"
                                />

                                <Text
                                    style={
                                        styles.backText
                                    }
                                >
                                    {
                                        t.back
                                    }
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* ------------------------------------------------
                        Footer
                    ------------------------------------------------ */}

                    <View style={styles.footer}>
                        <Text style={styles.footerAppName}>
                            {t.appName} {t.subtitle}
                        </Text>

                        <Text style={styles.footerDeveloper}>
                            {language === 'bn'
                                ? 'ডেভেলপার - আব্দুল আলিম সরকার'
                                : 'Developer - Abdul Alim Sarkar'}
                        </Text>

                        <Text style={styles.footerCopyright}>
                            © {new Date().getFullYear()}{' '}
                            {language === 'bn'
                                ? 'সর্বস্বত্ব সংরক্ষিত'
                                : 'All rights reserved'}
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles =
    StyleSheet.create({
        flex: {
            flex: 1,
        },

        safeArea: {
            flex: 1,
            backgroundColor:
                '#f8fafc',
        },

        scrollContent: {
            flexGrow: 1,

            paddingBottom: 24,
        },

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

        brand: {
            flexDirection: 'row',
            alignItems: 'center',
        },

        logo: {
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor:
                '#0f172a',
            alignItems: 'center',
            justifyContent:
                'center',
            marginRight: 10,
        },

        logoText: {
            color: '#ffffff',
            fontSize: 21,
            fontWeight: '800',
        },

        appName: {
            fontSize: 15,
            fontWeight: '800',
            color: '#0f172a',
        },

        subtitle: {
            marginTop: 2,
            fontSize: 10,
            color: '#64748b',
        },

        languageSelector: {
            flexDirection: 'row',
            padding: 3,
            borderRadius: 9,
            backgroundColor:
                '#f1f5f9',
        },

        languageOption: {
            paddingHorizontal: 8,
            paddingVertical: 6,
            borderRadius: 7,
        },

        languageOptionActive: {
            backgroundColor:
                '#0f172a',
        },

        languageText: {
            fontSize: 11,
            fontWeight: '800',
            color: '#64748b',
        },

        languageTextActive: {
            color: '#ffffff',
        },

        main: {
            flex: 1,
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 38,
        },

        iconCircle: {
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor:
                '#e2e8f0',
            alignItems: 'center',
            justifyContent:
                'center',
            marginBottom: 16,
        },

        title: {
            fontSize: 22,
            fontWeight: '800',
            color: '#0f172a',
            textAlign: 'center',
        },

        description: {
            marginTop: 7,
            maxWidth: 330,
            fontSize: 12,
            lineHeight: 19,
            color: '#64748b',
            textAlign: 'center',
        },

        card: {
            width: '100%',
            maxWidth: 420,
            marginTop: 24,
            padding: 18,
            borderRadius: 16,
            backgroundColor:
                '#ffffff',
            borderWidth: 1,
            borderColor:
                '#e2e8f0',
            shadowColor: '#000000',
            shadowOpacity: 0.05,
            shadowRadius: 10,
            shadowOffset: {
                width: 0,
                height: 4,
            },
            elevation: 2,
        },

        inputLabel: {
            marginBottom: 8,
            fontSize: 11,
            fontWeight: '800',
            color: '#334155',
        },

        inputWrapper: {
            minHeight: 48,
            borderRadius: 11,
            borderWidth: 1,
            borderColor:
                '#cbd5e1',
            backgroundColor:
                '#ffffff',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 13,
        },

        input: {
            flex: 1,
            marginLeft: 10,
            paddingVertical: 0,
            fontSize: 14,
            color: '#0f172a',
        },

        otpInput: {
            letterSpacing: 4,
            fontWeight: '700',
        },

        emailBox: {
            minHeight: 48,
            borderRadius: 11,
            borderWidth: 1,
            borderColor:
                '#e2e8f0',
            backgroundColor:
                '#f8fafc',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 13,
        },

        emailText: {
            flex: 1,
            marginLeft: 10,
            fontSize: 13,
            fontWeight: '700',
            color: '#334155',
        },

        otpSentText: {
            fontSize: 10,
            lineHeight: 16,
            color: '#64748b',
        },

        errorBox: {
            marginTop: 12,
            paddingHorizontal: 11,
            paddingVertical: 9,
            borderRadius: 9,
            backgroundColor:
                '#fef2f2',
            flexDirection: 'row',
            alignItems: 'center',
        },

        errorText: {
            flex: 1,
            marginLeft: 7,
            fontSize: 11,
            lineHeight: 16,
            color: '#dc2626',
            fontWeight: '600',
        },

        primaryButton: {
            minHeight: 48,
            marginTop: 18,
            borderRadius: 11,
            backgroundColor:
                '#0f172a',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent:
                'center',
            paddingHorizontal: 16,
        },

        primaryButtonPressed: {
            opacity: 0.75,
        },

        primaryButtonDisabled: {
            opacity: 0.55,
        },

        primaryButtonText: {
            marginLeft: 8,
            fontSize: 13,
            fontWeight: '800',
            color: '#ffffff',
        },

        resendButton: {
            minHeight: 44,
            marginTop: 8,
            borderRadius: 11,
            backgroundColor:
                '#f1f5f9',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent:
                'center',
            paddingHorizontal: 14,
        },

        resendButtonPressed: {
            opacity: 0.65,
        },

        resendButtonDisabled: {
            opacity: 0.75,
        },

        resendText: {
            marginLeft: 7,
            fontSize: 11,
            fontWeight: '800',
            color: '#0f172a',
        },

        resendTextDisabled: {
            color: '#94a3b8',
        },

        backButton: {
            minHeight: 44,
            marginTop: 8,
            borderRadius: 11,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent:
                'center',
        },

        backButtonPressed: {
            opacity: 0.6,
        },

        backText: {
            marginLeft: 7,
            fontSize: 11,
            fontWeight: '700',
            color: '#475569',
        },

        footer: {
            alignItems: 'center',
            marginTop: 'auto',
            paddingTop: 35,
            paddingHorizontal: 20,
        },

        footerAppName: {
            fontSize: 10,
            fontWeight: '800',
            color: '#475569',
        },

        footerDeveloper: {
            marginTop: 5,
            fontSize: 9,
            color: '#94a3b8',
        },

        footerCopyright: {
            marginTop: 4,
            fontSize: 10,
            color: '#94a3b8',
        },
    });