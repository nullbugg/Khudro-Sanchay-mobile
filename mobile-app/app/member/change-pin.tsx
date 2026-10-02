import React, {
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

import {
    getCurrentMember,
    changeMemberPin,
} from '../../lib/member-api';

/* ========================================================================== */
/* TRANSLATIONS                                                               */
/* ========================================================================== */

const translations = {
    bn: {
        title:
            'PIN পরিবর্তন',

        subtitle:
            'আপনার সদস্য অ্যাকাউন্টের PIN পরিবর্তন করুন',

        currentPin:
            'বর্তমান PIN',

        currentPinPlaceholder:
            'বর্তমান PIN লিখুন',

        newPin:
            'নতুন PIN',

        newPinPlaceholder:
            'নতুন PIN লিখুন',

        confirmPin:
            'নতুন PIN আবার দিন',

        confirmPinPlaceholder:
            'নতুন PIN আবার লিখুন',

        show:
            'দেখুন',

        hide:
            'লুকান',

        securityTitle:
            'PIN নিরাপত্তা',

        securityDescription:
            'আপনার সদস্য অ্যাকাউন্টের PIN নিরাপদ রাখুন।',

        requirementTitle:
            'PIN নিরাপত্তা',

        requirement1:
            'PIN কমপক্ষে ৬ অক্ষরের হতে হবে।',

        requirement2:
            'নতুন PIN বর্তমান PIN থেকে আলাদা হতে হবে।',

        changePin:
            'PIN পরিবর্তন করুন',

        changing:
            'PIN পরিবর্তন হচ্ছে...',

        currentRequired:
            'বর্তমান PIN দিন।',

        newRequired:
            'নতুন PIN দিন।',

        confirmRequired:
            'নতুন PIN আবার দিন।',

        invalidNewPin:
            'নতুন PIN কমপক্ষে ৬ অক্ষরের হতে হবে।',

        pinMismatch:
            'নতুন PIN এবং নিশ্চিত PIN মিলছে না।',

        samePin:
            'নতুন PIN বর্তমান PIN থেকে আলাদা হতে হবে।',

        memberNotFound:
            'বর্তমান সদস্য সেশন পাওয়া যায়নি। আবার login করুন।',

        successTitle:
            'সফল',

        successMessage:
            'আপনার PIN সফলভাবে পরিবর্তন হয়েছে।',

        error:
            'কিছু সমস্যা হয়েছে',

        back:
            'ড্যাশবোর্ডে ফিরে যান',
    },

    en: {
        title:
            'Change PIN',

        subtitle:
            'Change your member account PIN',

        currentPin:
            'Current PIN',

        currentPinPlaceholder:
            'Enter current PIN',

        newPin:
            'New PIN',

        newPinPlaceholder:
            'Enter new PIN',

        confirmPin:
            'Confirm New PIN',

        confirmPinPlaceholder:
            'Re-enter new PIN',

        show:
            'Show',

        hide:
            'Hide',

        securityTitle:
            'PIN Security',

        securityDescription:
            'Keep your member account PIN secure.',

        requirementTitle:
            'PIN Security',

        requirement1:
            'PIN must be at least 6 characters.',

        requirement2:
            'New PIN must be different from your current PIN.',

        changePin:
            'Change PIN',

        changing:
            'Changing PIN...',

        currentRequired:
            'Enter your current PIN.',

        newRequired:
            'Enter a new PIN.',

        confirmRequired:
            'Confirm your new PIN.',

        invalidNewPin:
            'New PIN must be at least 6 characters.',

        pinMismatch:
            'New PIN and confirm PIN do not match.',

        samePin:
            'New PIN must be different from your current PIN.',

        memberNotFound:
            'Current member session was not found. Please login again.',

        successTitle:
            'Success',

        successMessage:
            'Your PIN has been changed successfully.',

        error:
            'Something went wrong',

        back:
            'Back to Dashboard',
    },
};

/* ========================================================================== */
/* SCREEN                                                                     */
/* ========================================================================== */

export default function ChangePinScreen() {

    /* ---------------------------------------------------------------------- */
    /* LANGUAGE                                                                */
    /* ---------------------------------------------------------------------- */

    const [
        language,
        setLanguage,
    ] = useState<'bn' | 'en'>(
        'bn'
    );

    const t =
        translations[language];

    /* ---------------------------------------------------------------------- */
    /* MEMBER STATE                                                            */
    /* ---------------------------------------------------------------------- */

    const [
        memberId,
        setMemberId,
    ] = useState<string | null>(
        null
    );

    /* ---------------------------------------------------------------------- */
    /* FORM STATE                                                              */
    /* ---------------------------------------------------------------------- */

    const [
        currentPin,
        setCurrentPin,
    ] = useState('');

    const [
        newPin,
        setNewPin,
    ] = useState('');

    const [
        confirmPin,
        setConfirmPin,
    ] = useState('');

    /* ---------------------------------------------------------------------- */
    /* UI STATE                                                                */
    /* ---------------------------------------------------------------------- */

    const [
        changing,
        setChanging,
    ] = useState(false);

    const [
        showCurrentPin,
        setShowCurrentPin,
    ] = useState(false);

    const [
        showNewPin,
        setShowNewPin,
    ] = useState(false);

    const [
        showConfirmPin,
        setShowConfirmPin,
    ] = useState(false);

    /* ====================================================================== */
    /* LOAD MEMBER                                                             */
    /* ====================================================================== */

    useEffect(() => {

        const initialize =
            async () => {

                try {

                    const result =
                        await getCurrentMember();

                    if (
                        !result.success ||
                        !result.member?.memberId
                    ) {

                        Alert.alert(
                            t.error,
                            t.memberNotFound,
                            [
                                {
                                    text: 'OK',

                                    onPress: () => {
                                        router.replace(
                                            '/member/login'
                                        );
                                    },
                                },
                            ]
                        );

                        return;
                    }

                    setMemberId(
                        result.member.memberId
                    );

                } catch (error) {

                    console.error(
                        'Change PIN member loading error:',
                        error
                    );

                    Alert.alert(
                        t.error,
                        t.memberNotFound,
                        [
                            {
                                text: 'OK',

                                onPress: () => {
                                    router.replace(
                                        '/member/login'
                                    );
                                },
                            },
                        ]
                    );

                }

            };

        initialize();

    }, []);

    /* ====================================================================== */
    /* CHANGE PIN                                                              */
    /* ====================================================================== */

    async function handleChangePin() {

        /* ------------------------------------------------------------------ */
        /* MEMBER SESSION                                                      */
        /* ------------------------------------------------------------------ */

        if (!memberId) {

            Alert.alert(
                t.error,
                t.memberNotFound
            );

            return;
        }

        /* ------------------------------------------------------------------ */
        /* EMPTY FIELD VALIDATION                                             */
        /* ------------------------------------------------------------------ */

        if (
            !currentPin.trim()
        ) {

            Alert.alert(
                t.error,
                t.currentRequired
            );

            return;
        }

        if (
            !newPin.trim()
        ) {

            Alert.alert(
                t.error,
                t.newRequired
            );

            return;
        }

        if (
            !confirmPin.trim()
        ) {

            Alert.alert(
                t.error,
                t.confirmRequired
            );

            return;
        }

        /* ------------------------------------------------------------------ */
        /* PIN LENGTH                                                          */
        /* ------------------------------------------------------------------ */

        if (
            newPin.length < 6
        ) {

            Alert.alert(
                t.error,
                t.invalidNewPin
            );

            return;
        }

        /* ------------------------------------------------------------------ */
        /* PIN MATCH                                                           */
        /* ------------------------------------------------------------------ */

        if (
            newPin !==
            confirmPin
        ) {

            Alert.alert(
                t.error,
                t.pinMismatch
            );

            return;
        }

        /* ------------------------------------------------------------------ */
        /* SAME PIN                                                            */
        /* ------------------------------------------------------------------ */

        if (
            currentPin ===
            newPin
        ) {

            Alert.alert(
                t.error,
                t.samePin
            );

            return;
        }

        /* ------------------------------------------------------------------ */
        /* API                                                                 */
        /* ------------------------------------------------------------------ */

        try {

            setChanging(true);

            console.log(
                'Changing member PIN:',
                memberId
            );

            const result =
                await changeMemberPin(
                    memberId,
                    currentPin,
                    newPin
                );

            console.log(
                'Change member PIN response:',
                result
            );

            if (
                !result.success
            ) {

                Alert.alert(
                    t.error,
                    result.message
                );

                return;
            }

            /* -------------------------------------------------------------- */
            /* CLEAR FORM                                                      */
            /* -------------------------------------------------------------- */

            setCurrentPin('');
            setNewPin('');
            setConfirmPin('');

            /* -------------------------------------------------------------- */
            /* SUCCESS                                                         */
            /* -------------------------------------------------------------- */

            Alert.alert(
                t.successTitle,
                t.successMessage,
                [
                    {
                        text: 'OK',

                        onPress: () => {

                            router.replace(
                                '/member/dashboard'
                            );

                        },
                    },
                ]
            );

        } catch (error) {

            console.error(
                'Change member PIN error:',
                error
            );

            Alert.alert(
                t.error,
                t.error
            );

        } finally {

            setChanging(false);

        }
    }

    /* ====================================================================== */
    /* UI                                                                      */
    /* ====================================================================== */

    return (

        <SafeAreaView
            style={
                styles.safeArea
            }
        >

            <KeyboardAvoidingView
                style={
                    styles.keyboardView
                }
                behavior={
                    Platform.OS === 'ios'
                        ? 'padding'
                        : undefined
                }
            >

                <View
                    style={
                        styles.screen
                    }
                >

                    {/* ================================================== */}
                    {/* HEADER                                             */}
                    {/* ================================================== */}

                    <View
                        style={
                            styles.header
                        }
                    >

                        <Pressable
                            onPress={() =>
                                router.replace(
                                    '/member/dashboard'
                                )
                            }
                            style={
                                styles.backButton
                            }
                            hitSlop={8}
                        >

                            <Text
                                style={
                                    styles.backText
                                }
                            >
                                ‹
                            </Text>

                        </Pressable>

                        <View
                            style={
                                styles.headerTextContainer
                            }
                        >

                            <Text
                                style={
                                    styles.headerTitle
                                }
                            >
                                {t.title}
                            </Text>

                            <Text
                                style={
                                    styles.headerSubtitle
                                }
                            >
                                {t.subtitle}
                            </Text>

                        </View>

                    </View>

                    {/* ================================================== */}
                    {/* CONTENT                                             */}
                    {/* ================================================== */}

                    <ScrollView
                        showsVerticalScrollIndicator={
                            false
                        }
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={
                            styles.content
                        }
                    >

                        {/* ================================================== */}
                        {/* SECURITY CARD                                      */}
                        {/* ================================================== */}

                        <View
                            style={
                                styles.securityCard
                            }
                        >

                            <View
                                style={
                                    styles.securityIcon
                                }
                            >

                                <Text
                                    style={
                                        styles.securityIconText
                                    }
                                >
                                    •••
                                </Text>

                            </View>

                            <Text
                                style={
                                    styles.securityTitle
                                }
                            >
                                {t.securityTitle}
                            </Text>

                            <Text
                                style={
                                    styles.securityDescription
                                }
                            >
                                {t.securityDescription}
                            </Text>

                        </View>

                        {/* ================================================== */}
                        {/* FORM                                               */}
                        {/* ================================================== */}

                        <View
                            style={
                                styles.formCard
                            }
                        >

                            {/* CURRENT PIN */}

                            <Text
                                style={
                                    styles.label
                                }
                            >
                                {t.currentPin}
                            </Text>

                            <View
                                style={
                                    styles.inputContainer
                                }
                            >

                                <TextInput
                                    value={
                                        currentPin
                                    }
                                    onChangeText={
                                        setCurrentPin
                                    }
                                    placeholder={
                                        t.currentPinPlaceholder
                                    }
                                    placeholderTextColor="#94a3b8"
                                    secureTextEntry={
                                        !showCurrentPin
                                    }
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="numeric"
                                    style={
                                        styles.input
                                    }
                                />

                                <Pressable
                                    onPress={() =>
                                        setShowCurrentPin(
                                            previous =>
                                                !previous
                                        )
                                    }
                                    style={
                                        styles.showButton
                                    }
                                >

                                    <Text
                                        style={
                                            styles.showText
                                        }
                                    >
                                        {
                                            showCurrentPin
                                                ? t.hide
                                                : t.show
                                        }
                                    </Text>

                                </Pressable>

                            </View>

                            {/* NEW PIN */}

                            <Text
                                style={
                                    styles.label
                                }
                            >
                                {t.newPin}
                            </Text>

                            <View
                                style={
                                    styles.inputContainer
                                }
                            >

                                <TextInput
                                    value={
                                        newPin
                                    }
                                    onChangeText={
                                        setNewPin
                                    }
                                    placeholder={
                                        t.newPinPlaceholder
                                    }
                                    placeholderTextColor="#94a3b8"
                                    secureTextEntry={
                                        !showNewPin
                                    }
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="numeric"
                                    style={
                                        styles.input
                                    }
                                />

                                <Pressable
                                    onPress={() =>
                                        setShowNewPin(
                                            previous =>
                                                !previous
                                        )
                                    }
                                    style={
                                        styles.showButton
                                    }
                                >

                                    <Text
                                        style={
                                            styles.showText
                                        }
                                    >
                                        {
                                            showNewPin
                                                ? t.hide
                                                : t.show
                                        }
                                    </Text>

                                </Pressable>

                            </View>

                            {/* CONFIRM PIN */}

                            <Text
                                style={
                                    styles.label
                                }
                            >
                                {t.confirmPin}
                            </Text>

                            <View
                                style={
                                    styles.inputContainer
                                }
                            >

                                <TextInput
                                    value={
                                        confirmPin
                                    }
                                    onChangeText={
                                        setConfirmPin
                                    }
                                    placeholder={
                                        t.confirmPinPlaceholder
                                    }
                                    placeholderTextColor="#94a3b8"
                                    secureTextEntry={
                                        !showConfirmPin
                                    }
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="numeric"
                                    style={
                                        styles.input
                                    }
                                />

                                <Pressable
                                    onPress={() =>
                                        setShowConfirmPin(
                                            previous =>
                                                !previous
                                        )
                                    }
                                    style={
                                        styles.showButton
                                    }
                                >

                                    <Text
                                        style={
                                            styles.showText
                                        }
                                    >
                                        {
                                            showConfirmPin
                                                ? t.hide
                                                : t.show
                                        }
                                    </Text>

                                </Pressable>

                            </View>

                            {/* REQUIREMENTS */}

                            <View
                                style={
                                    styles.infoBox
                                }
                            >

                                <Text
                                    style={
                                        styles.infoTitle
                                    }
                                >
                                    {
                                        t.requirementTitle
                                    }
                                </Text>

                                <Text
                                    style={
                                        styles.infoText
                                    }
                                >
                                    • {t.requirement1}
                                </Text>

                                <Text
                                    style={
                                        styles.infoText
                                    }
                                >
                                    • {t.requirement2}
                                </Text>

                            </View>

                            {/* CHANGE BUTTON */}

                            <Pressable
                                onPress={
                                    handleChangePin
                                }
                                disabled={
                                    changing ||
                                    !memberId
                                }
                                style={({
                                    pressed,
                                }) => [

                                    styles.changeButton,

                                    (changing ||
                                        !memberId) &&
                                        styles.changeButtonDisabled,

                                    pressed &&
                                        !changing &&
                                        memberId &&
                                        styles.changeButtonPressed,

                                ]}
                            >

                                {changing ? (

                                    <View
                                        style={
                                            styles.buttonLoading
                                        }
                                    >

                                        <ActivityIndicator
                                            size="small"
                                            color="#ffffff"
                                        />

                                        <Text
                                            style={
                                                styles.changeButtonText
                                            }
                                        >
                                            {t.changing}
                                        </Text>

                                    </View>

                                ) : (

                                    <Text
                                        style={
                                            styles.changeButtonText
                                        }
                                    >
                                        {
                                            t.changePin
                                        }
                                    </Text>

                                )}

                            </Pressable>

                        </View>

                        {/* BACK TO DASHBOARD */}

                        <Pressable
                            onPress={() =>
                                router.replace(
                                    '/member/dashboard'
                                )
                            }
                            style={
                                styles.backDashboardButton
                            }
                        >

                            <Text
                                style={
                                    styles.backDashboardText
                                }
                            >
                                ‹
                            </Text>

                            <Text
                                style={
                                    styles.backDashboardTextLabel
                                }
                            >
                                {t.back}
                            </Text>

                        </Pressable>

                        <View
                            style={{
                                height: 30,
                            }}
                        />

                    </ScrollView>

                </View>

            </KeyboardAvoidingView>

        </SafeAreaView>
    );
}

/* ========================================================================== */
/* STYLES                                                                     */
/* ========================================================================== */

const styles =
    StyleSheet.create({

        safeArea: {
            flex: 1,
            backgroundColor:
                '#f6f8fb',
        },

        keyboardView: {
            flex: 1,
        },

        screen: {
            flex: 1,
            backgroundColor:
                '#f6f8fb',
        },

        /* ------------------------------------------------------------------ */
        /* HEADER                                                              */
        /* ------------------------------------------------------------------ */

        header: {
            height: 72,
            paddingHorizontal: 18,
            backgroundColor:
                '#ffffff',
            borderBottomWidth: 1,
            borderBottomColor:
                '#e2e8f0',
            flexDirection:
                'row',
            alignItems:
                'center',
        },

        backButton: {
            width: 42,
            height: 42,
            borderRadius: 11,
            alignItems:
                'center',
            justifyContent:
                'center',
        },

        backText: {
            fontSize: 35,
            lineHeight: 38,
            color: '#0f172a',
            fontWeight: '300',
        },

        headerTextContainer: {
            flex: 1,
            marginLeft: 7,
        },

        headerTitle: {
            fontSize: 15,
            fontWeight: '800',
            color: '#0f172a',
        },

        headerSubtitle: {
            marginTop: 2,
            fontSize: 10,
            color: '#64748b',
        },

        /* ------------------------------------------------------------------ */
        /* CONTENT                                                             */
        /* ------------------------------------------------------------------ */

        content: {
            paddingHorizontal: 18,
            paddingTop: 20,
        },

        /* ------------------------------------------------------------------ */
        /* SECURITY CARD                                                       */
        /* ------------------------------------------------------------------ */

        securityCard: {
            backgroundColor:
                '#0f172a',
            borderRadius: 18,
            padding: 22,
            alignItems:
                'center',
        },

        securityIcon: {
            width: 58,
            height: 58,
            borderRadius: 17,
            backgroundColor:
                '#1e293b',
            alignItems:
                'center',
            justifyContent:
                'center',
        },

        securityIconText: {
            color: '#ffffff',
            fontSize: 18,
            letterSpacing: 2,
            fontWeight: '900',
        },

        securityTitle: {
            marginTop: 13,
            color: '#ffffff',
            fontSize: 18,
            fontWeight: '800',
        },

        securityDescription: {
            marginTop: 5,
            color: '#94a3b8',
            fontSize: 11,
            textAlign:
                'center',
        },

        /* ------------------------------------------------------------------ */
        /* FORM                                                                */
        /* ------------------------------------------------------------------ */

        formCard: {
            marginTop: 14,
            padding: 18,
            borderRadius: 17,
            borderWidth: 1,
            borderColor:
                '#e2e8f0',
            backgroundColor:
                '#ffffff',
        },

        label: {
            marginBottom: 7,
            fontSize: 11,
            fontWeight: '700',
            color: '#475569',
        },

        inputContainer: {
            minHeight: 50,
            marginBottom: 17,
            paddingLeft: 13,
            borderWidth: 1,
            borderColor:
                '#cbd5e1',
            borderRadius: 11,
            backgroundColor:
                '#f8fafc',
            flexDirection:
                'row',
            alignItems:
                'center',
        },

        input: {
            flex: 1,
            minHeight: 48,
            fontSize: 15,
            color: '#0f172a',
        },

        showButton: {
            height: 48,
            paddingHorizontal: 13,
            alignItems:
                'center',
            justifyContent:
                'center',
        },

        showText: {
            fontSize: 10,
            fontWeight: '800',
            color: '#475569',
        },

        /* ------------------------------------------------------------------ */
        /* INFORMATION                                                         */
        /* ------------------------------------------------------------------ */

        infoBox: {
            marginTop: 2,
            padding: 13,
            borderRadius: 11,
            backgroundColor:
                '#f1f5f9',
        },

        infoTitle: {
            marginBottom: 5,
            fontSize: 11,
            fontWeight: '800',
            color: '#334155',
        },

        infoText: {
            marginTop: 3,
            fontSize: 10,
            lineHeight: 17,
            color: '#64748b',
        },

        /* ------------------------------------------------------------------ */
        /* BUTTON                                                              */
        /* ------------------------------------------------------------------ */

        changeButton: {
            minHeight: 50,
            marginTop: 20,
            borderRadius: 11,
            backgroundColor:
                '#0f172a',
            alignItems:
                'center',
            justifyContent:
                'center',
        },

        changeButtonDisabled: {
            opacity: 0.6,
        },

        changeButtonPressed: {
            opacity: 0.85,
        },

        changeButtonText: {
            color: '#ffffff',
            fontSize: 12,
            fontWeight: '800',
        },

        buttonLoading: {
            flexDirection:
                'row',
            alignItems:
                'center',
            gap: 9,
        },

        /* ------------------------------------------------------------------ */
        /* BACK TO DASHBOARD                                                   */
        /* ------------------------------------------------------------------ */

        backDashboardButton: {
            minHeight: 45,
            marginTop: 11,
            borderRadius: 11,
            backgroundColor:
                '#ffffff',
            borderWidth: 1,
            borderColor:
                '#e2e8f0',
            flexDirection:
                'row',
            alignItems:
                'center',
            justifyContent:
                'center',
        },

        backDashboardText: {
            fontSize: 25,
            lineHeight: 28,
            color: '#475569',
            fontWeight: '300',
        },

        backDashboardTextLabel: {
            marginLeft: 6,
            fontSize: 11,
            fontWeight: '700',
            color: '#475569',
        },

    });