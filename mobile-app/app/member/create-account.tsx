import {
    useEffect,
    useState,
} from 'react';

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
} from 'expo-router';

import Ionicons from '@expo/vector-icons/Ionicons';

import {
    registerMemberAccount,
    verifyMemberRegistrationOTP,
    resendMemberRegistrationOTP,
} from '../../lib/member-api';

type Language = 'bn' | 'en';

const translations = {
    bn: {
        appName: 'ক্ষুদ্র সঞ্চয়',
        appSubtitle: 'সমবায় সমিতি',

        title: 'নতুন অ্যাকাউন্ট তৈরি করুন',
        subtitle:
            'আপনার সদস্য তথ্য যাচাই করে একটি নিরাপদ Member Account তৈরি করুন।',

        memberId: 'Member ID',
        memberIdPlaceholder: 'আপনার Member ID লিখুন',

        memberName: 'নাম',
        memberNamePlaceholder: 'আপনার নাম লিখুন',

        phone: 'ফোন নম্বর',
        phonePlaceholder: '01XXXXXXXX',

        email: 'Gmail',
        emailPlaceholder: 'example@gmail.com',

        pin: 'নতুন PIN',
        pinPlaceholder: '৪ থেকে ৬ সংখ্যার PIN দিন',

        confirmPin: 'RE-PIN',
        confirmPinPlaceholder: 'PIN আবার লিখুন',

        showPin: 'PIN দেখান',
        hidePin: 'PIN লুকান',

        createAccount: 'অ্যাকাউন্ট তৈরি করুন',
        creatingAccount: 'অ্যাকাউন্ট তৈরি হচ্ছে...',

        otpTitle: 'Gmail OTP যাচাই করুন',
        otpSubtitle:
            'আপনার Gmail-এ একটি ৬ সংখ্যার OTP পাঠানো হয়েছে। OTP লিখে অ্যাকাউন্ট তৈরি সম্পন্ন করুন।',

        otp: 'OTP',
        otpPlaceholder: '৬ সংখ্যার OTP লিখুন',

        verifyOTP: 'OTP যাচাই করুন',
        verifyingOTP: 'যাচাই করা হচ্ছে...',

        resendOTP: 'আবার OTP পাঠান',
        sendingOTP: 'OTP পাঠানো হচ্ছে...',
        resendIn: 'আবার OTP পাঠানো যাবে',

        alreadyHaveAccount: 'আগেই অ্যাকাউন্ট তৈরি করেছেন?',
        login: 'লগইন করুন',

        invalidId: 'Member ID লিখুন।',

        invalidName:
            'আপনার নাম লিখুন।',

        invalidPhone:
            'সঠিক ১১ সংখ্যার ফোন নম্বর দিন।',

        invalidPhoneFormat:
            'ফোন নম্বর অবশ্যই 01 দিয়ে শুরু হতে হবে এবং তৃতীয় সংখ্যা 3 থেকে 9-এর মধ্যে হতে হবে।',

        invalidEmail:
            'সঠিক Gmail address দিন।',

        invalidPin:
            'PIN লিখুন।',

        invalidPinLength:
            'PIN অবশ্যই ৪ থেকে ৬ সংখ্যার হতে হবে।',

        pinMismatch:
            'PIN এবং RE-PIN মিলছে না।',

        invalidOTP:
            '৬ সংখ্যার OTP লিখুন।',

        accountCreatedTitle:
            'অ্যাকাউন্ট তৈরি হয়েছে',

        accountCreated:
            'আপনার Member Account সফলভাবে তৈরি হয়েছে। এখন Login করতে পারবেন।',

        otpSentTitle:
            'OTP পাঠানো হয়েছে',

        otpSent:
            'আপনার Gmail-এ একটি OTP পাঠানো হয়েছে।',

        createFailed:
            'অ্যাকাউন্ট তৈরি করা যায়নি।',

        connectionError:
            'Server-এর সাথে সংযোগ করা যাচ্ছে না।',

        back:
            'ফিরে যান',

        footer:
            'ক্ষুদ্র সঞ্চয় সমবায় সমিতি',

        developer:
            'ডেভেলপার - আব্দুল আলিম সরকার',

        rights:
            'সর্বস্বত্ব সংরক্ষিত।',
    },

    en: {
        appName: 'Savings',
        appSubtitle: 'Cooperative Society',

        title: 'Create New Account',
        subtitle:
            'Verify your member information and create a secure Member Account.',

        memberId: 'Member ID',
        memberIdPlaceholder: 'Enter your Member ID',

        memberName: 'Name',
        memberNamePlaceholder: 'Enter your name',

        phone: 'Phone Number',
        phonePlaceholder: '01XXXXXXXX',

        email: 'Gmail',
        emailPlaceholder: 'example@gmail.com',

        pin: 'New PIN',
        pinPlaceholder: 'Enter a 4 to 6 digit PIN',

        confirmPin: 'RE-PIN',
        confirmPinPlaceholder: 'Enter your PIN again',

        showPin: 'Show PIN',
        hidePin: 'Hide PIN',

        createAccount: 'Create Account',
        creatingAccount: 'Creating Account...',

        otpTitle: 'Verify Gmail OTP',
        otpSubtitle:
            'A 6-digit OTP has been sent to your Gmail. Enter the OTP to complete account creation.',

        otp: 'OTP',
        otpPlaceholder: 'Enter 6-digit OTP',

        verifyOTP: 'Verify OTP',
        verifyingOTP: 'Verifying...',

        resendOTP: 'Resend OTP',
        sendingOTP: 'Sending OTP...',
        resendIn: 'You can resend OTP in',

        alreadyHaveAccount: 'Already have an account?',
        login: 'Login',

        invalidId:
            'Please enter your Member ID.',

        invalidName:
            'Please enter your name.',

        invalidPhone:
            'Please enter a valid 11-digit phone number.',

        invalidPhoneFormat:
            'Phone number must start with 01 and the third digit must be between 3 and 9.',

        invalidEmail:
            'Please enter a valid Gmail address.',

        invalidPin:
            'Please enter your PIN.',

        invalidPinLength:
            'PIN must be 4 to 6 digits.',

        pinMismatch:
            'PIN and RE-PIN do not match.',

        invalidOTP:
            'Please enter the 6-digit OTP.',

        accountCreatedTitle:
            'Account Created',

        accountCreated:
            'Your Member Account has been created successfully. You can now login.',

        otpSentTitle:
            'OTP Sent',

        otpSent:
            'An OTP has been sent to your Gmail.',

        createFailed:
            'Account could not be created.',

        connectionError:
            'Unable to connect to the server.',

        back:
            'Go Back',

        footer:
            'Savings Cooperative Society',

        developer:
            'Developer - Abdul Alim Sarkar',

        rights:
            'All rights reserved.',
    },
};

export default function CreateAccountScreen() {
    const [language, setLanguage] =
        useState<Language>('bn');

    const t = translations[language];

    const [memberId, setMemberId] =
        useState('');

    const [memberName, setMemberName] =
        useState('');

    const [phone, setPhone] =
        useState('');

    const [email, setEmail] =
        useState('');

    const [pin, setPin] =
        useState('');

    const [confirmPin, setConfirmPin] =
        useState('');

    const [otp, setOtp] =
        useState('');

    const [showPin, setShowPin] =
        useState(false);

    const [showConfirmPin, setShowConfirmPin] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [otpLoading, setOtpLoading] =
        useState(false);

    const [resendLoading, setResendLoading] =
        useState(false);

    const [otpStep, setOtpStep] =
        useState(false);

    const [resendSeconds, setResendSeconds] =
        useState(0);

    /*
     * Resend OTP countdown
     */
    useEffect(() => {
        if (resendSeconds <= 0) {
            return;
        }

        const timer = setInterval(() => {
            setResendSeconds((current) => {
                if (current <= 1) {
                    return 0;
                }

                return current - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [resendSeconds]);

    const startResendTimer = (seconds: number) => {
        setResendSeconds(
            Math.max(0, Number(seconds) || 0)
        );
    };

    /*
     * Phone validation
     *
     * 01
     * third digit: 3-9
     * remaining: 8 digits
     *
     * Total = 11 digits
     */
    const validatePhone = (value: string) => {
        return /^01[3-9]\d{8}$/.test(value);
    };

    /*
     * Gmail validation
     *
     * Only @gmail.com addresses are allowed.
     */
    const validateEmail = (value: string) => {
        return /^[A-Z0-9._%+-]+@gmail\.com$/i.test(value);
    };

    /*
     * Phone input
     */
    const handlePhoneChange = (value: string) => {
        const digitsOnly = value
            .replace(/\D/g, '')
            .slice(0, 11);

        setPhone(digitsOnly);
    };

    /*
     * OTP input
     */
    const handleOTPChange = (value: string) => {
        const digitsOnly = value
            .replace(/\D/g, '')
            .slice(0, 6);

        setOtp(digitsOnly);
    };

    /*
     * Back button
     *
     * Form step -> previous page
     * OTP step -> back to form
     */
    const handleBack = () => {
        if (otpStep) {
            setOtpStep(false);
            setOtp('');
            return;
        }

        router.back();
    };

    /*
     * Create Account
     */
    const handleCreateAccount = async () => {
        const trimmedMemberId =
            memberId.trim();

        const trimmedName =
            memberName.trim();

        const trimmedPhone =
            phone.trim();

        const trimmedEmail =
            email.trim().toLowerCase();

        /*
         * Member ID
         */
        if (!trimmedMemberId) {
            Alert.alert(
                t.createFailed,
                t.invalidId
            );
            return;
        }

        /*
         * Name
         */
        if (!trimmedName) {
            Alert.alert(
                t.createFailed,
                t.invalidName
            );
            return;
        }

        /*
         * Phone
         */
        if (!trimmedPhone) {
            Alert.alert(
                t.createFailed,
                t.invalidPhone
            );
            return;
        }

        if (!validatePhone(trimmedPhone)) {
            Alert.alert(
                t.createFailed,
                t.invalidPhoneFormat
            );
            return;
        }

        /*
         * Gmail
         */
        if (!validateEmail(trimmedEmail)) {
            Alert.alert(
                t.createFailed,
                t.invalidEmail
            );
            return;
        }

        /*
         * PIN
         */
        if (!pin) {
            Alert.alert(
                t.createFailed,
                t.invalidPin
            );
            return;
        }

        if (!/^\d{4,6}$/.test(pin)) {
            Alert.alert(
                t.createFailed,
                t.invalidPinLength
            );
            return;
        }

        /*
         * RE-PIN
         */
        if (!confirmPin) {
            Alert.alert(
                t.createFailed,
                t.pinMismatch
            );
            return;
        }

        if (pin !== confirmPin) {
            Alert.alert(
                t.createFailed,
                t.pinMismatch
            );
            return;
        }

        try {
            setLoading(true);

            /*
             * Keep this function signature unchanged.
             *
             * memberName is collected from the user,
             * but backend should NOT compare it with
             * the Google Sheet memberName.
             *
             * Backend should verify:
             * Member ID + Phone Number
             */
            const result =
                await registerMemberAccount(
                    trimmedMemberId,
                    trimmedName,
                    trimmedPhone,
                    trimmedEmail,
                    pin,
                    confirmPin,
                    language,
                );

            if (!result.success) {
                Alert.alert(
                    t.createFailed,
                    result.message ||
                        t.createFailed
                );
                return;
            }

            /*
             * Keep normalized values
             */
            setMemberId(trimmedMemberId);
            setMemberName(trimmedName);
            setPhone(trimmedPhone);
            setEmail(trimmedEmail);

            setOtp('');
            setOtpStep(true);

            if (result.resendAfter) {
                startResendTimer(
                    result.resendAfter
                );
            }

            Alert.alert(
                t.otpSentTitle,
                result.message ||
                    t.otpSent
            );
        } catch (error) {
            console.error(
                'Create account error:',
                error
            );

            Alert.alert(
                t.createFailed,
                t.connectionError
            );
        } finally {
            setLoading(false);
        }
    };

    /*
     * Verify OTP
     */
    const handleVerifyOTP = async () => {
        if (!/^\d{6}$/.test(otp)) {
            Alert.alert(
                t.createFailed,
                t.invalidOTP
            );
            return;
        }

        try {
            setOtpLoading(true);

            const result =
                await verifyMemberRegistrationOTP(
                    memberId.trim(),
                    otp,
                    language,
                );

            if (!result.success) {
                Alert.alert(
                    t.createFailed,
                    result.message ||
                        t.createFailed
                );
                return;
            }

            Alert.alert(
                t.accountCreatedTitle,
                t.accountCreated,
                [
                    {
                        text: t.login,
                        onPress: () => {
                            router.replace(
                                '/member/login'
                            );
                        },
                    },
                ],
            );
        } catch (error) {
            console.error(
                'OTP verification error:',
                error
            );

            Alert.alert(
                t.createFailed,
                t.connectionError
            );
        } finally {
            setOtpLoading(false);
        }
    };

    /*
     * Resend OTP
     */
    const handleResendOTP = async () => {
        if (
            resendSeconds > 0 ||
            resendLoading
        ) {
            return;
        }

        try {
            setResendLoading(true);

            const result =
                await resendMemberRegistrationOTP(
                    memberId.trim(),
                    language,
                );

            if (!result.success) {
                Alert.alert(
                    t.createFailed,
                    result.message ||
                        t.createFailed
                );
                return;
            }

            setOtp('');

            if (result.resendAfter) {
                startResendTimer(
                    result.resendAfter
                );
            }

            Alert.alert(
                t.otpSentTitle,
                result.message ||
                    t.otpSent
            );
        } catch (error) {
            console.error(
                'Resend OTP error:',
                error
            );

            Alert.alert(
                t.createFailed,
                t.connectionError
            );
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <SafeAreaView
            style={styles.safeArea}
        >
            <KeyboardAvoidingView
                style={
                    styles.keyboardAvoidingView
                }
                behavior={
                    Platform.OS === 'ios'
                        ? 'padding'
                        : undefined
                }
            >
                <ScrollView
                    showsVerticalScrollIndicator={
                        false
                    }
                    contentContainerStyle={
                        styles.scrollContent
                    }
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View
                            style={
                                styles.headerLeft
                            }
                        >
                            <Pressable
                                onPress={
                                    handleBack
                                }
                                style={
                                    styles.backButton
                                }
                                accessibilityLabel={
                                    t.back
                                }
                            >
                                <Ionicons
                                    name="arrow-back"
                                    size={22}
                                    color="#0f172a"
                                />
                            </Pressable>

                            <View
                                style={
                                    styles.brandContainer
                                }
                            >

                                <View>
                                    <Text
                                        style={
                                            styles.appName
                                        }
                                    >
                                        {t.appName}
                                    </Text>

                                    <Text
                                        style={
                                            styles.appSubtitle
                                        }
                                    >
                                        {t.appSubtitle}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Language Selector */}
                        <View
                            style={
                                styles.languageSelector
                            }
                        >
                            <Pressable
                                onPress={() =>
                                    setLanguage(
                                        'bn'
                                    )
                                }
                                style={[
                                    styles.languageButton,
                                    language ===
                                        'bn' &&
                                        styles.languageButtonActive,
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
                                    setLanguage(
                                        'en'
                                    )
                                }
                                style={[
                                    styles.languageButton,
                                    language ===
                                        'en' &&
                                        styles.languageButtonActive,
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

                    {/* Main Content */}
                    <View style={styles.content}>
                        <View style={styles.hero}>
                            <View
                                style={
                                    styles.accountIconCircle
                                }
                            >
                                <Ionicons
                                    name={
                                        otpStep
                                            ? 'mail-outline'
                                            : 'person-add-outline'
                                    }
                                    size={28}
                                    color="#475569"
                                />
                            </View>

                            <Text
                                style={
                                    styles.title
                                }
                            >
                                {otpStep
                                    ? t.otpTitle
                                    : t.title}
                            </Text>

                            <Text
                                style={
                                    styles.subtitle
                                }
                            >
                                {otpStep
                                    ? t.otpSubtitle
                                    : t.subtitle}
                            </Text>
                        </View>

                        <View
                            style={
                                styles.formCard
                            }
                        >
                            {!otpStep ? (
                                <>
                                    {/* Member ID */}
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
                                            {t.memberId}
                                        </Text>

                                        <TextInput
                                            value={
                                                memberId
                                            }
                                            onChangeText={
                                                setMemberId
                                            }
                                            placeholder={
                                                t.memberIdPlaceholder
                                            }
                                            placeholderTextColor="#94a3b8"
                                            style={
                                                styles.input
                                            }
                                            autoCapitalize="none"
                                            autoCorrect={
                                                false
                                            }
                                        />
                                    </View>

                                    {/* Name */}
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
                                            {t.memberName}
                                        </Text>

                                        <TextInput
                                            value={
                                                memberName
                                            }
                                            onChangeText={
                                                setMemberName
                                            }
                                            placeholder={
                                                t.memberNamePlaceholder
                                            }
                                            placeholderTextColor="#94a3b8"
                                            style={
                                                styles.input
                                            }
                                            autoCapitalize="words"
                                            autoCorrect={
                                                false
                                            }
                                        />
                                    </View>

                                    {/* Phone */}
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
                                            {t.phone}
                                        </Text>

                                        <TextInput
                                            value={
                                                phone
                                            }
                                            onChangeText={
                                                handlePhoneChange
                                            }
                                            placeholder={
                                                t.phonePlaceholder
                                            }
                                            placeholderTextColor="#94a3b8"
                                            style={
                                                styles.input
                                            }
                                            keyboardType="phone-pad"
                                            maxLength={
                                                11
                                            }
                                        />
                                    </View>

                                    {/* Gmail */}
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
                                            {t.email}
                                        </Text>

                                        <TextInput
                                            value={
                                                email
                                            }
                                            onChangeText={
                                                setEmail
                                            }
                                            placeholder={
                                                t.emailPlaceholder
                                            }
                                            placeholderTextColor="#94a3b8"
                                            style={
                                                styles.input
                                            }
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={
                                                false
                                            }
                                        />
                                    </View>

                                    {/* PIN */}
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
                                            {t.pin}
                                        </Text>

                                        <View
                                            style={
                                                styles.passwordInputContainer
                                            }
                                        >
                                            <TextInput
                                                value={
                                                    pin
                                                }
                                                onChangeText={(
                                                    value
                                                ) =>
                                                    setPin(
                                                        value
                                                            .replace(
                                                                /\D/g,
                                                                ''
                                                            )
                                                            .slice(
                                                                0,
                                                                6
                                                            )
                                                    )
                                                }
                                                placeholder={
                                                    t.pinPlaceholder
                                                }
                                                placeholderTextColor="#94a3b8"
                                                style={
                                                    styles.passwordInput
                                                }
                                                keyboardType="number-pad"
                                                secureTextEntry={
                                                    !showPin
                                                }
                                                maxLength={
                                                    6
                                                }
                                            />

                                            <Pressable
                                                onPress={() =>
                                                    setShowPin(
                                                        !showPin
                                                    )
                                                }
                                                style={
                                                    styles.eyeButton
                                                }
                                                accessibilityLabel={
                                                    showPin
                                                        ? t.hidePin
                                                        : t.showPin
                                                }
                                            >
                                                <Ionicons
                                                    name={
                                                        showPin
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

                                        
                                    </View>

                                    {/* RE-PIN */}
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
                                            {t.confirmPin}
                                        </Text>

                                        <View
                                            style={
                                                styles.passwordInputContainer
                                            }
                                        >
                                            <TextInput
                                                value={
                                                    confirmPin
                                                }
                                                onChangeText={(
                                                    value
                                                ) =>
                                                    setConfirmPin(
                                                        value
                                                            .replace(
                                                                /\D/g,
                                                                ''
                                                            )
                                                            .slice(
                                                                0,
                                                                6
                                                            )
                                                    )
                                                }
                                                placeholder={
                                                    t.confirmPinPlaceholder
                                                }
                                                placeholderTextColor="#94a3b8"
                                                style={
                                                    styles.passwordInput
                                                }
                                                keyboardType="number-pad"
                                                secureTextEntry={
                                                    !showConfirmPin
                                                }
                                                maxLength={
                                                    6
                                                }
                                            />

                                            <Pressable
                                                onPress={() =>
                                                    setShowConfirmPin(
                                                        !showConfirmPin
                                                    )
                                                }
                                                style={
                                                    styles.eyeButton
                                                }
                                                accessibilityLabel={
                                                    showConfirmPin
                                                        ? t.hidePin
                                                        : t.showPin
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

                                    </View>

                                    {/* Create Account */}
                                    <Pressable
                                        onPress={
                                            handleCreateAccount
                                        }
                                        disabled={
                                            loading
                                        }
                                        style={[
                                            styles.primaryButton,
                                            loading &&
                                                styles.primaryButtonDisabled,
                                        ]}
                                    >
                                        {loading ? (
                                            <ActivityIndicator
                                                size="small"
                                                color="#ffffff"
                                            />
                                        ) : (
                                            <>
                                                <Text
                                                    style={
                                                        styles.primaryButtonText
                                                    }
                                                >
                                                    {
                                                        t.createAccount
                                                    }
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.primaryButtonIcon
                                                    }
                                                >
                                                    →
                                                </Text>
                                            </>
                                        )}
                                    </Pressable>
                                </>
                            ) : (
                                <>
                                    {/* OTP */}
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
                                            {t.otp}
                                        </Text>

                                        <TextInput
                                            value={
                                                otp
                                            }
                                            onChangeText={
                                                handleOTPChange
                                            }
                                            placeholder={
                                                t.otpPlaceholder
                                            }
                                            placeholderTextColor="#94a3b8"
                                            style={[
                                                styles.input,
                                                styles.otpInput,
                                            ]}
                                            keyboardType="number-pad"
                                            maxLength={
                                                6
                                            }
                                            
                                        />
                                    </View>

                                    {/* Verify OTP */}
                                    <Pressable
                                        onPress={
                                            handleVerifyOTP
                                        }
                                        disabled={
                                            otpLoading
                                        }
                                        style={[
                                            styles.primaryButton,
                                            otpLoading &&
                                                styles.primaryButtonDisabled,
                                        ]}
                                    >
                                        {otpLoading ? (
                                            <ActivityIndicator
                                                size="small"
                                                color="#ffffff"
                                            />
                                        ) : (
                                            <>
                                                <Text
                                                    style={
                                                        styles.primaryButtonText
                                                    }
                                                >
                                                    {
                                                        t.verifyOTP
                                                    }
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.primaryButtonIcon
                                                    }
                                                >
                                                    →
                                                </Text>
                                            </>
                                        )}
                                    </Pressable>

                                    {/* Resend OTP */}
                                    <Pressable
                                        onPress={
                                            handleResendOTP
                                        }
                                        disabled={
                                            resendSeconds >
                                                0 ||
                                            resendLoading
                                        }
                                        style={[
                                            styles.resendButton,
                                            (
                                                resendSeconds >
                                                    0 ||
                                                resendLoading
                                            ) &&
                                                styles.resendButtonDisabled,
                                        ]}
                                    >
                                        {resendLoading ? (
                                            <ActivityIndicator
                                                size="small"
                                                color="#475569"
                                            />
                                        ) : (
                                            <Text
                                                style={
                                                    styles.resendButtonText
                                                }
                                            >
                                                {resendSeconds >
                                                0
                                                    ? `${t.resendIn} ${resendSeconds}s`
                                                    : t.resendOTP}
                                            </Text>
                                        )}
                                    </Pressable>
                                </>
                            )}

                            {/* Login */}
                            <View
                                style={
                                    styles.loginRow
                                }
                            >
                                <Text
                                    style={
                                        styles.loginText
                                    }
                                >
                                    {
                                        t.alreadyHaveAccount
                                    }
                                </Text>

                                <Pressable
                                    onPress={() =>
                                        router.replace(
                                            '/member/login'
                                        )
                                    }
                                >
                                    <Text
                                        style={
                                            styles.loginLink
                                        }
                                    >
                                        {t.login}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>

                    {/* Footer */}
                    <View
                        style={
                            styles.footer
                        }
                    >
                        <Text
                            style={
                                styles.footerTitle
                            }
                        >
                            {t.footer}
                        </Text>

                        <Text
                            style={
                                styles.footerText
                            }
                        >
                            {t.developer}
                        </Text>

                        <Text
                            style={
                                styles.footerText
                            }
                        >
                            © {new Date().getFullYear()}{' '}
                            {t.rights}
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f6f8fb',
    },

    keyboardAvoidingView: {
        flex: 1,
    },

    scrollContent: {
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
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 0,
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

    brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
    flexShrink: 1,
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

    /* Language */
    languageSelector: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        padding: 3,
        marginLeft: 10,
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

    /* Content */
    content: {
        paddingHorizontal: 20,
    },

    hero: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
},

    accountIconCircle: {
        width: 62,
        height: 62,
        borderRadius: 18,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },

    title: {
        marginTop: 16,
        textAlign: 'center',
        fontSize: 25,
        lineHeight: 33,
        fontWeight: '800',
        color: '#0f172a',
    },

    subtitle: {
        marginTop: 9,
        maxWidth: 520,
        textAlign: 'center',
        fontSize: 12,
        lineHeight: 20,
        color: '#64748b',
    },

    /* Form */
    formCard: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        elevation: 2,
    },

    inputGroup: {
        marginBottom: 16,
    },

    label: {
        marginBottom: 7,
        fontSize: 12,
        fontWeight: '800',
        color: '#334155',
    },

    input: {
        height: 48,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 11,
        backgroundColor: '#f8fafc',
        paddingHorizontal: 14,
        fontSize: 13,
        color: '#0f172a',
    },

    passwordInputContainer: {
        height: 48,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 11,
        backgroundColor: '#f8fafc',
        flexDirection: 'row',
        alignItems: 'center',
    },

    passwordInput: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 14,
        fontSize: 13,
        color: '#0f172a',
    },

    eyeButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },

    helperText: {
        marginTop: 4,
        fontSize: 9,
        color: '#94a3b8',
        textAlign: 'right',
    },

    otpInput: {
        textAlign: 'center',
        letterSpacing: 7,
        fontSize: 20,
        fontWeight: '800',
    },

    /* Primary Button */
    primaryButton: {
        minHeight: 48,
        borderRadius: 11,
        backgroundColor: '#0f172a',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },

    primaryButtonDisabled: {
        opacity: 0.65,
    },

    primaryButtonText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#ffffff',
    },

    primaryButtonIcon: {
        marginLeft: 8,
        fontSize: 17,
        color: '#ffffff',
    },

    /* Resend */
    resendButton: {
        minHeight: 44,
        marginTop: 10,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
    },

    resendButtonDisabled: {
        opacity: 0.55,
    },

    resendButtonText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#475569',
    },

    /* Login */
    loginRow: {
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },

    loginText: {
        fontSize: 11,
        color: '#94a3b8',
    },

    loginLink: {
        marginLeft: 5,
        fontSize: 11,
        fontWeight: '800',
        color: '#0f172a',
    },

    /* Footer */
    footer: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 24,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },

    footerTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748b',
    },

    footerText: {
        marginTop: 4,
        fontSize: 10,
        color: '#94a3b8',
    },
});