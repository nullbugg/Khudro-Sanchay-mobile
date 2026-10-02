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
    getAdminPasswordResetInfo,
    sendAdminPasswordResetOTP,
    verifyAdminPasswordResetOTP,
    resetAdminPassword,
} from '../../lib/admin-api';


/* ==========================================================================
   Language
   ========================================================================== */

type Language = 'bn' | 'en';


/* ==========================================================================
   Step
   ========================================================================== */

type Step =
    | 'admin'
    | 'otp'
    | 'password';


/* ==========================================================================
   Translations
   ========================================================================== */

const translations = {
    bn: {
        appName: 'ক্ষুদ্র সঞ্চয়',
        appSubtitle: 'সমবায় সমিতি',

        title: 'পাসওয়ার্ড রিসেট',
        subtitle:
            'আপনার Admin account-এর password reset করতে নিচের ধাপগুলো অনুসরণ করুন।',

        adminId: 'অ্যাডমিন আইডি',
        adminIdPlaceholder:
            'আপনার অ্যাডমিন আইডি লিখুন',

        continue: 'চালিয়ে যান',
        processing: 'প্রক্রিয়াধীন...',

        otpTitle: 'OTP ভেরিফিকেশন',
        otpSubtitle:
            'আপনার Gmail-এ পাঠানো ৬ সংখ্যার OTP দিন।',

        otp: 'OTP',
        otpPlaceholder: '৬ সংখ্যার OTP লিখুন',

        verifyOTP: 'OTP ভেরিফাই করুন',
        verifying: 'ভেরিফাই হচ্ছে...',

        resendOTP: 'আবার OTP পাঠান',
        resendIn: 'আবার পাঠাতে',
        seconds: 'সেকেন্ড',

        emailSentTo: 'OTP পাঠানো হয়েছে',
        newPassword: 'নতুন পাসওয়ার্ড',
        newPasswordPlaceholder:
            'নতুন পাসওয়ার্ড লিখুন',

        confirmPassword: 'পাসওয়ার্ড নিশ্চিত করুন',
        confirmPasswordPlaceholder:
            'পাসওয়ার্ড আবার লিখুন',

        resetPassword: 'পাসওয়ার্ড রিসেট করুন',
        resetting: 'রিসেট হচ্ছে...',

        backToLogin: 'Admin Login-এ ফিরে যান',

        invalidAdminId:
            'Admin ID লিখুন।',

        invalidOTP:
            '৬ সংখ্যার OTP লিখুন।',

        invalidPassword:
            'নতুন Password কমপক্ষে ৬ অক্ষরের হতে হবে।',

        passwordMismatch:
            'নতুন Password এবং Confirm Password মিলছে না।',

        footer:
            'ক্ষুদ্র সঞ্চয় সমবায় সমিতি',

        developer:
            'ডেভেলপার - আব্দুল আলিম সরকার',

        rights:
            'সর্বস্বত্ব সংরক্ষিত।',
    },

    en: {
        appName: 'ক্ষুদ্র সঞ্চয়',
        appSubtitle: 'সমবায় সমিতি',

        title: 'Reset Password',
        subtitle:
            'Follow the steps below to reset your Admin account password.',

        adminId: 'Admin ID',
        adminIdPlaceholder:
            'Enter your Admin ID',

        continue: 'Continue',
        processing: 'Processing...',

        otpTitle: 'OTP Verification',
        otpSubtitle:
            'Enter the 6-digit OTP sent to your Gmail.',

        otp: 'OTP',
        otpPlaceholder: 'Enter 6-digit OTP',

        verifyOTP: 'Verify OTP',
        verifying: 'Verifying...',

        resendOTP: 'Resend OTP',
        resendIn: 'Resend in',
        seconds: 'seconds',

        emailSentTo: 'OTP sent to',

        newPassword: 'New Password',
        newPasswordPlaceholder:
            'Enter your new password',

        confirmPassword: 'Confirm Password',
        confirmPasswordPlaceholder:
            'Re-enter your password',

        resetPassword: 'Reset Password',
        resetting: 'Resetting...',

        backToLogin: 'Back to Admin Login',

        invalidAdminId:
            'Please enter your Admin ID.',

        invalidOTP:
            'Please enter the 6-digit OTP.',

        invalidPassword:
            'New Password must be at least 6 characters.',

        passwordMismatch:
            'New Password and Confirm Password do not match.',

        footer:
            'ক্ষুদ্র সঞ্চয় সমবায় সমিতি',

        developer:
            'Developer - Abdul Alim Sarkar',

        rights:
            'All rights reserved.',
    },
};


/* ==========================================================================
   Helpers
   ========================================================================== */

function maskEmail(
    email: string
): string {

    const value =
        String(email ?? '')
            .trim()
            .toLowerCase();

    const atIndex =
        value.indexOf('@');

    if (atIndex <= 0) {
        return value;
    }

    const username =
        value.slice(0, atIndex);

    const domain =
        value.slice(atIndex);

    if (username.length <= 2) {
        return `${username[0] ?? ''}***${domain}`;
    }

    return (
        `${username.slice(0, 2)}***${domain}`
    );
}


/* ==========================================================================
   Main Component
   ========================================================================== */

export default function ForgotPasswordScreen() {

    const [language, setLanguage] =
        useState<Language>('bn');

    const [step, setStep] =
        useState<Step>('admin');

    const [adminId, setAdminId] =
        useState('');

    const [email, setEmail] =
        useState('');

    const [otp, setOtp] =
        useState('');

    const [newPassword, setNewPassword] =
        useState('');

    const [confirmPassword, setConfirmPassword] =
        useState('');

    const [resetToken, setResetToken] =
        useState('');

    const [resendCountdown, setResendCountdown] =
        useState(0);

    const [showNewPassword, setShowNewPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [resending, setResending] =
        useState(false);

    const [error, setError] =
        useState('');

    const t =
        translations[language];


    /* ----------------------------------------------------------------------
       Resend Countdown
       ---------------------------------------------------------------------- */

    useEffect(() => {

        if (resendCountdown <= 0) {
            return;
        }

        const timer =
            setInterval(() => {

                setResendCountdown(
                    previous =>
                        previous > 0
                            ? previous - 1
                            : 0
                );

            }, 1000);

        return () =>
            clearInterval(timer);

    }, [resendCountdown]);


    /* ----------------------------------------------------------------------
       Admin ID Continue
       ---------------------------------------------------------------------- */

    const handleAdminContinue = async () => {

        setError('');

        const trimmedAdminId =
            adminId.trim().toUpperCase();

        if (!trimmedAdminId) {

            setError(
                t.invalidAdminId
            );

            return;
        }

        setLoading(true);

        try {

            /*
             * First get the Admin's Gmail information.
             */

            const info =
                await getAdminPasswordResetInfo(
                    trimmedAdminId
                );

            if (!info?.success) {

                throw new Error(
                    info?.message ||
                        (
                            language === 'bn'
                                ? 'Admin account যাচাই করা যায়নি।'
                                : 'Unable to verify Admin account.'
                        )
                );
            }

            setAdminId(
                info.adminId ||
                    trimmedAdminId
            );

            setEmail(
                info.email || ''
            );

            /*
             * Send OTP immediately after
             * successful Admin ID verification.
             */

            const otpResult =
                await sendAdminPasswordResetOTP(
                    info.adminId ||
                        trimmedAdminId
                );

            if (!otpResult?.success) {

                throw new Error(
                    otpResult?.message ||
                        (
                            language === 'bn'
                                ? 'OTP পাঠানো যায়নি।'
                                : 'OTP could not be sent.'
                        )
                );
            }

            setOtp('');

            setResendCountdown(
                Number(
                    otpResult.resendAfter
                ) || 60
            );

            setStep('otp');

        } catch (error) {

            setError(
                error instanceof Error
                    ? error.message
                    : (
                        language === 'bn'
                            ? 'Admin account যাচাই করা যায়নি।'
                            : 'Unable to verify Admin account.'
                    )
            );

        } finally {

            setLoading(false);
        }
    };


    /* ----------------------------------------------------------------------
       Verify OTP
       ---------------------------------------------------------------------- */

    const handleVerifyOTP = async () => {

        setError('');

        const trimmedOTP =
            otp.trim();

        if (
            !/^\d{6}$/.test(
                trimmedOTP
            )
        ) {

            setError(
                t.invalidOTP
            );

            return;
        }

        setLoading(true);

        try {

            const result =
                await verifyAdminPasswordResetOTP(
                    adminId,
                    trimmedOTP
                );

            if (!result?.success) {

                throw new Error(
                    result?.message ||
                        (
                            language === 'bn'
                                ? 'OTP ভেরিফাই করা যায়নি।'
                                : 'OTP verification failed.'
                        )
                );
            }

            if (!result.resetToken) {

                throw new Error(
                    language === 'bn'
                        ? 'Reset token পাওয়া যায়নি।'
                        : 'Reset token was not received.'
                );
            }

            setResetToken(
                result.resetToken
            );

            setStep('password');

        } catch (error) {

            setError(
                error instanceof Error
                    ? error.message
                    : (
                        language === 'bn'
                            ? 'OTP ভেরিফাই করা যায়নি।'
                            : 'OTP verification failed.'
                    )
            );

        } finally {

            setLoading(false);
        }
    };


    /* ----------------------------------------------------------------------
       Resend OTP
       ---------------------------------------------------------------------- */

    const handleResendOTP = async () => {

        if (
            resendCountdown > 0 ||
            resending ||
            loading
        ) {
            return;
        }

        setError('');

        setResending(true);

        try {

            const result =
                await sendAdminPasswordResetOTP(
                    adminId
                );

            if (!result?.success) {

                throw new Error(
                    result?.message ||
                        (
                            language === 'bn'
                                ? 'OTP আবার পাঠানো যায়নি।'
                                : 'OTP could not be resent.'
                        )
                );
            }

            setOtp('');

            setResendCountdown(
                Number(
                    result.resendAfter
                ) || 60
            );

        } catch (error) {

            /*
             * Backend cooldown response may
             * contain resendAfter even when
             * the request is rejected.
             */

            if (
                typeof error === 'object' &&
                error !== null &&
                'resendAfter' in error
            ) {
                const value =
                    Number(
                        (
                            error as {
                                resendAfter?: number;
                            }
                        ).resendAfter
                    );

                if (value > 0) {
                    setResendCountdown(value);
                }
            }

            setError(
                error instanceof Error
                    ? error.message
                    : (
                        language === 'bn'
                            ? 'OTP আবার পাঠানো যায়নি।'
                            : 'OTP could not be resent.'
                    )
            );

        } finally {

            setResending(false);
        }
    };


    /* ----------------------------------------------------------------------
       Reset Password
       ---------------------------------------------------------------------- */

    /* ----------------------------------------------------------------------
   Reset Password
   ---------------------------------------------------------------------- */

const handleResetPassword = async () => {

    setError('');

    if (!newPassword.trim()) {

        setError(
            t.invalidPassword
        );

        return;
    }

    if (newPassword.length < 6) {

        setError(
            t.invalidPassword
        );

        return;
    }

    if (!confirmPassword.trim()) {

        setError(
            language === 'bn'
                ? 'Confirm Password লিখুন।'
                : 'Please enter Confirm Password.'
        );

        return;
    }

    if (newPassword !== confirmPassword) {

        setError(
            t.passwordMismatch
        );

        return;
    }

    if (!resetToken) {

        setError(
            language === 'bn'
                ? 'Password reset session-এর মেয়াদ শেষ হয়েছে। আবার চেষ্টা করুন।'
                : 'Password reset session has expired. Please try again.'
        );

        return;
    }

    setLoading(true);

    try {

        const result =
            await resetAdminPassword(
                adminId,
                resetToken,
                newPassword,
                confirmPassword
            );


        if (!result?.success) {

            setError(
                result?.message ||
                    (
                        language === 'bn'
                            ? 'Password reset করা যায়নি।'
                            : 'Password reset failed.'
                    )
            );

            return;
        }


        /*
         * ---------------------------------------------------------------
         * Password successfully changed.
         * Clear sensitive information.
         * ---------------------------------------------------------------
         */

        setNewPassword('');
        setConfirmPassword('');
        setOtp('');
        setResetToken('');


        /*
         * ---------------------------------------------------------------
         * Show confirmation message first.
         *
         * Login page will open only after
         * the user presses OK.
         * ---------------------------------------------------------------
         */

        Alert.alert(

            language === 'bn'
                ? 'সফল হয়েছে'
                : 'Success',

            language === 'bn'
                ? 'আপনার Password সফলভাবে পরিবর্তন হয়েছে।'
                : 'Your password has been changed successfully.',

            [
                {
                    text:
                        language === 'bn'
                            ? 'ঠিক আছে'
                            : 'OK',

                    onPress: () => {

                        router.replace(
                            '/admin/login'
                        );

                    },
                },
            ],

            {
                cancelable: false,
            }
        );

    } catch (error) {

        console.error(
            'Reset password error:',
            error
        );

        setError(
            error instanceof Error
                ? error.message
                : (
                    language === 'bn'
                        ? 'Password reset করা যায়নি।'
                        : 'Password reset failed.'
                )
        );

    } finally {

        setLoading(false);
    }
};


    /* ----------------------------------------------------------------------
       Back
       ---------------------------------------------------------------------- */

    const handleBack = () => {

        setError('');

        if (step === 'otp') {

            setStep('admin');

            return;
        }

        if (step === 'password') {

            setStep('otp');

            return;
        }

        router.back();
    };


    /* ==========================================================================
       Render
       ========================================================================== */

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
                    contentContainerStyle={
                        styles.scrollContent
                    }
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >

                    {/* ======================================================
                       Header
                       ====================================================== */}

                    <View
                        style={styles.header}
                    >

                        <Pressable
                            onPress={() =>
                                router.replace('/')
                            }
                            style={
                                styles.brandContainer
                            }
                        >

                            <View
                                style={
                                    styles.headerLogo
                                }
                            >
                                <Text
                                    style={
                                        styles.headerLogoText
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

                        </Pressable>


                        {/* Language */}

                        <View
                            style={
                                styles.languageSelector
                            }
                        >

                            <Pressable
                                onPress={() =>
                                    setLanguage('bn')
                                }
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
                                onPress={() =>
                                    setLanguage('en')
                                }
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


                    {/* ======================================================
                       Main
                       ====================================================== */}

                    <View
                        style={styles.container}
                    >

                        {/* Logo */}

                        <View
                            style={styles.logo}
                        >

                            <Ionicons
                                name={
                                    step === 'admin'
                                        ? 'lock-open-outline'
                                        : step === 'otp'
                                            ? 'mail-outline'
                                            : 'lock-closed-outline'
                                }
                                size={29}
                                color="#0f172a"
                            />

                        </View>


                        {/* Title */}

                        <Text
                            style={styles.title}
                        >
                            {step === 'admin'
                                ? t.title
                                : step === 'otp'
                                    ? t.otpTitle
                                    : t.newPassword}
                        </Text>


                        <Text
                            style={styles.subtitle}
                        >
                            {step === 'admin'
                                ? t.subtitle
                                : step === 'otp'
                                    ? t.otpSubtitle
                                    : language === 'bn'
                                        ? 'আপনার Admin account-এর জন্য নতুন password সেট করুন।'
                                        : 'Set a new password for your Admin account.'}
                        </Text>


                        {/* ==================================================
                           Card
                           ================================================== */}

                        <View
                            style={styles.card}
                        >

                            {/* ------------------------------------------------
                               STEP 1 — Admin ID
                               ------------------------------------------------ */}

                            {step === 'admin' && (

                                <>

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
                                                {t.adminId}
                                            </Text>

                                        </View>


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
                                                onChangeText={
                                                    text =>
                                                        setAdminId(
                                                            text
                                                        )
                                                }
                                                placeholder={
                                                    t.adminIdPlaceholder
                                                }
                                                placeholderTextColor="#94a3b8"
                                                autoCapitalize="characters"
                                                autoCorrect={false}
                                                editable={!loading}
                                                style={
                                                    styles.input
                                                }
                                            />

                                        </View>

                                    </View>


                                    {error !== '' && (

                                        <ErrorBox
                                            message={
                                                error
                                            }
                                        />

                                    )}


                                    <Pressable
                                        onPress={
                                            handleAdminContinue
                                        }
                                        disabled={
                                            loading
                                        }
                                        style={({ pressed }) => [
                                            styles.primaryButton,
                                            pressed &&
                                                styles.buttonPressed,
                                            loading &&
                                                styles.buttonDisabled,
                                        ]}
                                    >

                                        <Text
                                            style={
                                                styles.primaryButtonText
                                            }
                                        >
                                            {loading
                                                ? t.processing
                                                : t.continue}
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

                                </>

                            )}


                            {/* ------------------------------------------------
                               STEP 2 — OTP
                               ------------------------------------------------ */}

                            {step === 'otp' && (

                                <>

                                    <View
                                        style={
                                            styles.emailBox
                                        }
                                    >

                                        <View
                                            style={
                                                styles.emailIconCircle
                                            }
                                        >

                                            <Ionicons
                                                name="mail-outline"
                                                size={20}
                                                color="#0f172a"
                                            />

                                        </View>


                                        <View
                                            style={
                                                styles.emailContent
                                            }
                                        >

                                            <Text
                                                style={
                                                    styles.emailLabel
                                                }
                                            >
                                                {t.emailSentTo}
                                            </Text>

                                            <Text
                                                style={
                                                    styles.emailText
                                                }
                                            >
                                                {email
                                                    ? maskEmail(
                                                        email
                                                    )
                                                    : '••••••••@gmail.com'}
                                            </Text>

                                        </View>

                                    </View>


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


                                        <View
                                            style={
                                                styles.inputWrapper
                                            }
                                        >

                                            <Ionicons
                                                name="keypad-outline"
                                                size={17}
                                                color="#64748b"
                                                style={
                                                    styles.otpIcon
                                                }
                                            />

                                            <TextInput
                                                value={
                                                    otp
                                                }
                                                onChangeText={
                                                    text =>
                                                        setOtp(
                                                            text
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
                                                    t.otpPlaceholder
                                                }
                                                placeholderTextColor="#94a3b8"
                                                keyboardType="number-pad"
                                                maxLength={6}
                                                editable={
                                                    !loading &&
                                                    !resending
                                                }
                                                style={[
                                                    styles.input,
                                                    styles.otpInput,
                                                ]}
                                            />

                                        </View>

                                    </View>


                                    {error !== '' && (

                                        <ErrorBox
                                            message={
                                                error
                                            }
                                        />

                                    )}


                                    <Pressable
                                        onPress={
                                            handleVerifyOTP
                                        }
                                        disabled={
                                            loading ||
                                            resending
                                        }
                                        style={({ pressed }) => [
                                            styles.primaryButton,
                                            pressed &&
                                                styles.buttonPressed,
                                            (loading ||
                                                resending) &&
                                                styles.buttonDisabled,
                                        ]}
                                    >

                                        <Text
                                            style={
                                                styles.primaryButtonText
                                            }
                                        >
                                            {loading
                                                ? t.verifying
                                                : t.verifyOTP}
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


                                    <Pressable
                                        disabled={
                                            loading ||
                                            resending ||
                                            resendCountdown > 0
                                        }
                                        style={[
                                            styles.resendButton,
                                            (
                                                loading ||
                                                resending ||
                                                resendCountdown > 0
                                            ) &&
                                                styles.resendButtonDisabled,
                                        ]}
                                        onPress={
                                            handleResendOTP
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.resendText
                                            }
                                        >
                                            {resending
                                                ? (
                                                    language === 'bn'
                                                        ? 'OTP পাঠানো হচ্ছে...'
                                                        : 'Sending OTP...'
                                                )
                                                : resendCountdown > 0
                                                    ? `${t.resendIn} ${resendCountdown} ${t.seconds}`
                                                    : t.resendOTP}
                                        </Text>

                                    </Pressable>

                                </>

                            )}


                            {/* ------------------------------------------------
                               STEP 3 — New Password
                               ------------------------------------------------ */}

                            {step === 'password' && (

                                <>

                                    {/* New Password */}

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
                                            {t.newPassword}
                                        </Text>


                                        <View
                                            style={
                                                styles.inputWrapper
                                            }
                                        >

                                            <Ionicons
                                                name="lock-closed-outline"
                                                size={17}
                                                color="#64748b"
                                                style={
                                                    styles.passwordIcon
                                                }
                                            />

                                            <TextInput
                                                value={
                                                    newPassword
                                                }
                                                onChangeText={
                                                    setNewPassword
                                                }
                                                placeholder={
                                                    t.newPasswordPlaceholder
                                                }
                                                placeholderTextColor="#94a3b8"
                                                secureTextEntry={
                                                    !showNewPassword
                                                }
                                                editable={!loading}
                                                autoCapitalize="none"
                                                style={
                                                    styles.input
                                                }
                                            />

                                            <Pressable
                                                onPress={() =>
                                                    setShowNewPassword(
                                                        value =>
                                                            !value
                                                    )
                                                }
                                                style={
                                                    styles.showPasswordButton
                                                }
                                            >

                                                <Ionicons
                                                    name={
                                                        showNewPassword
                                                            ? 'eye-off-outline'
                                                            : 'eye-outline'
                                                    }
                                                    size={18}
                                                    color="#64748b"
                                                />

                                            </Pressable>

                                        </View>

                                    </View>


                                    {/* Confirm Password */}

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
                                            {t.confirmPassword}
                                        </Text>


                                        <View
                                            style={
                                                styles.inputWrapper
                                            }
                                        >

                                            <Ionicons
                                                name="lock-closed-outline"
                                                size={17}
                                                color="#64748b"
                                                style={
                                                    styles.passwordIcon
                                                }
                                            />

                                            <TextInput
                                                value={
                                                    confirmPassword
                                                }
                                                onChangeText={
                                                    setConfirmPassword
                                                }
                                                placeholder={
                                                    t.confirmPasswordPlaceholder
                                                }
                                                placeholderTextColor="#94a3b8"
                                                secureTextEntry={
                                                    !showConfirmPassword
                                                }
                                                editable={!loading}
                                                autoCapitalize="none"
                                                style={
                                                    styles.input
                                                }
                                            />

                                            <Pressable
                                                onPress={() =>
                                                    setShowConfirmPassword(
                                                        value =>
                                                            !value
                                                    )
                                                }
                                                style={
                                                    styles.showPasswordButton
                                                }
                                            >

                                                <Ionicons
                                                    name={
                                                        showConfirmPassword
                                                            ? 'eye-off-outline'
                                                            : 'eye-outline'
                                                    }
                                                    size={18}
                                                    color="#64748b"
                                                />

                                            </Pressable>

                                        </View>

                                    </View>


                                    {error !== '' && (

                                        <ErrorBox
                                            message={
                                                error
                                            }
                                        />

                                    )}


                                    <Pressable
                                        onPress={
                                            handleResetPassword
                                        }
                                        disabled={
                                            loading
                                        }
                                        style={({ pressed }) => [
                                            styles.primaryButton,
                                            pressed &&
                                                styles.buttonPressed,
                                            loading &&
                                                styles.buttonDisabled,
                                        ]}
                                    >

                                        <Text
                                            style={
                                                styles.primaryButtonText
                                            }
                                        >
                                            {loading
                                                ? t.resetting
                                                : t.resetPassword}
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

                                </>

                            )}


                            {/* ==================================================
                               Back
                               ================================================== */}

                            <Pressable
                                onPress={
                                    handleBack
                                }
                                disabled={loading}
                                style={
                                    styles.backButton
                                }
                            >

                                <Text
                                    style={
                                        styles.backIcon
                                    }
                                >
                                    ←
                                </Text>

                                <Text
                                    style={
                                        styles.backText
                                    }
                                >
                                    {step === 'admin'
                                        ? t.backToLogin
                                        : language === 'bn'
                                            ? 'পেছনে যান'
                                            : 'Go Back'}
                                </Text>

                            </Pressable>

                        </View>


                        {/* ==================================================
                           Footer
                           ================================================== */}

                        <View
                            style={styles.footer}
                        >

                            <Text
                                style={
                                    styles.footerText
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
                                    styles.copyright
                                }
                            >
                                © {new Date().getFullYear()} {t.rights}
                            </Text>

                        </View>

                    </View>

                </ScrollView>

            </KeyboardAvoidingView>

        </SafeAreaView>
    );
}


/* ==========================================================================
   Error Box
   ========================================================================== */

function ErrorBox({
    message,
}: {
    message: string;
}) {

    return (

        <View
            style={styles.errorBox}
        >

            <Text
                style={styles.errorIcon}
            >
                !
            </Text>

            <Text
                style={styles.errorText}
            >
                {message}
            </Text>

        </View>
    );
}


/* ==========================================================================
   Styles
   ========================================================================== */

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


    /* ----------------------------------------------------------------------
       Header
       ---------------------------------------------------------------------- */

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

    headerLogo: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#0f172a',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    headerLogoText: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '700',
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


    /* ----------------------------------------------------------------------
       Language
       ---------------------------------------------------------------------- */

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


    /* ----------------------------------------------------------------------
       Container
       ---------------------------------------------------------------------- */

    container: {
        width: '100%',
        maxWidth: 520,
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingTop: 38,
        flex: 1,
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


    /* ----------------------------------------------------------------------
       Card
       ---------------------------------------------------------------------- */

    card: {
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


    /* ----------------------------------------------------------------------
       Input
       ---------------------------------------------------------------------- */

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

    otpIcon: {
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

    otpInput: {
        letterSpacing: 4,
        fontWeight: '700',
    },

    showPasswordButton: {
        width: 42,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },


    /* ----------------------------------------------------------------------
       Email
       ---------------------------------------------------------------------- */

    emailBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginBottom: 20,
        borderRadius: 11,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },

    emailIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    emailContent: {
        flex: 1,
    },

    emailLabel: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: '600',
    },

    emailText: {
        marginTop: 2,
        fontSize: 13,
        color: '#0f172a',
        fontWeight: '800',
    },


    /* ----------------------------------------------------------------------
       Error
       ---------------------------------------------------------------------- */

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


    /* ----------------------------------------------------------------------
       Buttons
       ---------------------------------------------------------------------- */

    primaryButton: {
        minHeight: 50,
        borderRadius: 11,
        backgroundColor: '#0f172a',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    buttonPressed: {
        opacity: 0.85,
    },

    buttonDisabled: {
        opacity: 0.55,
    },

    primaryButtonText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '800',
    },

    arrow: {
        marginLeft: 9,
        color: '#ffffff',
        fontSize: 18,
    },

    resendButton: {
        alignItems: 'center',
        marginTop: 16,
        paddingVertical: 5,
    },

    resendButtonDisabled: {
        opacity: 0.5,
    },

    resendText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
    },

    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 18,
        paddingVertical: 5,
    },

    backIcon: {
        marginRight: 6,
        fontSize: 15,
        color: '#64748b',
    },

    backText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
    },


    /* ----------------------------------------------------------------------
       Footer
       ---------------------------------------------------------------------- */

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
        textAlign: 'center',
    },

    copyright: {
        marginTop: 4,
        fontSize: 10,
        color: '#94a3b8',
    },

});