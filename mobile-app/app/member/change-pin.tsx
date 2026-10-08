import React, {
    useEffect,
    useRef,
    useState,
} from 'react';

import Ionicons from '@expo/vector-icons/Ionicons';

import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
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
    clearCurrentMember,
} from '../../lib/member-api';

import {
    getMemberLanguage,
    setMemberLanguage,
    MemberLanguage,
} from '../../lib/member-language';

/* ========================================================================== */
/* TRANSLATIONS                                                               */
/* ========================================================================== */

const translations = {
    bn: {
        appName:
            'ক্ষুদ্র সঞ্চয়',

        appSubtitle:
            'সমবায় সমিতি',

        memberPanel:
            'সদস্য প্যানেল',

        dashboard:
            'ড্যাশবোর্ড',

        profile:
            'প্রোফাইল',

        changeGmail:
            'জি-মেইল পরিবর্তন',

        changePin:
            'পিন পরিবর্তন',

        weeklyDeposit:
            'সাপ্তাহিক জমা',

        pendingDeposit:
            'অপেক্ষমাণ জমা',

        weeklyHistory:
            'সাপ্তাহিক জমার ইতিহাস',

        language:
            'ভাষা নির্বাচন করুন',

        bangla:
            'বাংলা',

        english:
            'EN',

        logout:
            'লগআউট',

        memberId:
            'সদস্য ID',

        title:
            'পিন পরিবর্তন',

        subtitle:
            'আপনার সদস্য অ্যাকাউন্টের পিন পরিবর্তন করুন',

        currentPin:
            'বর্তমান পিন',

        currentPinPlaceholder:
            'বর্তমান পিন লিখুন',

        newPin:
            'নতুন পিন',

        newPinPlaceholder:
            'নতুন পিন লিখুন',

        confirmPin:
            'নতুন পিন আবার দিন',

        confirmPinPlaceholder:
            'নতুন পিন আবার লিখুন',

        securityTitle:
            'পিন নিরাপত্তা',

        securityDescription:
            'আপনার সদস্য অ্যাকাউন্টের পিন নিরাপদ রাখুন।',

        requirementTitle:
            'পিন নিরাপত্তা',

        requirement1:
            'পিন ৪ থেকে ৬ সংখ্যার হতে হবে।',

        requirement2:
            'নতুন পিন বর্তমান পিন থেকে আলাদা হতে হবে।',

        changePinButton:
            'পিন পরিবর্তন করুন',

        changing:
            'পিন পরিবর্তন হচ্ছে...',

        currentRequired:
            'বর্তমান পিন দিন।',

        newRequired:
            'নতুন পিন দিন।',

        confirmRequired:
            'নতুন পিন আবার দিন।',

        invalidPin:
            'পিন ৪ থেকে ৬ সংখ্যার হতে হবে।',

        pinMismatch:
            'নতুন পিন এবং নিশ্চিত পিন মিলছে না।',

        samePin:
            'নতুন পিন বর্তমান পিন থেকে আলাদা হতে হবে।',

        memberNotFound:
            'বর্তমান সদস্য সেশন পাওয়া যায়নি। আবার লগইন করুন।',

        successTitle:
            'সফল',

        successMessage:
            'আপনার পিন সফলভাবে পরিবর্তন হয়েছে।',

        error:
            'কিছু সমস্যা হয়েছে',
    },

    en: {
        appName:
            'ক্ষুদ্র সঞ্চয়',

        appSubtitle:
            'সমবায় সমিতি',

        memberPanel:
            'Member Panel',

        dashboard:
            'Dashboard',

        profile:
            'Profile',

        changeGmail:
            'Change Gmail',

        changePin:
            'Change PIN',

        weeklyDeposit:
            'Weekly Deposit',

        pendingDeposit:
            'Pending Deposit',

        weeklyHistory:
            'Weekly Deposit History',

        language:
            'Select Language',

        bangla:
            'বাংলা',

        english:
            'EN',

        logout:
            'Logout',

        memberId:
            'Member ID',

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

        securityTitle:
            'PIN Security',

        securityDescription:
            'Keep your member account PIN secure.',

        requirementTitle:
            'PIN Security',

        requirement1:
            'PIN must be 4 to 6 digits.',

        requirement2:
            'New PIN must be different from your current PIN.',

        changePinButton:
            'Change PIN',

        changing:
            'Changing PIN...',

        currentRequired:
            'Enter your current PIN.',

        newRequired:
            'Enter a new PIN.',

        confirmRequired:
            'Confirm your new PIN.',

        invalidPin:
            'PIN must be 4 to 6 digits.',

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
    ] = useState<MemberLanguage>(
        'bn'
    );

    const t =
        translations[language];

    /* ---------------------------------------------------------------------- */
    /* MEMBER STATE                                                            */
    /* ---------------------------------------------------------------------- */

    const [
        member,
        setMember,
    ] = useState<{
        memberId: string;
        memberName: string;
    } | null>(null);

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

    /* ---------------------------------------------------------------------- */
    /* DRAWER STATE                                                            */
    /* ---------------------------------------------------------------------- */

    const [
        menuOpen,
        setMenuOpen,
    ] = useState(false);

    const [
        menuMounted,
        setMenuMounted,
    ] = useState(false);

    const drawerTranslateX =
        useRef(
            new Animated.Value(-330)
        ).current;

    const overlayOpacity =
        useRef(
            new Animated.Value(0)
        ).current;

    /* ====================================================================== */
    /* LOAD LANGUAGE                                                           */
    /* ====================================================================== */

    useEffect(() => {

        const loadLanguage =
            async () => {

                try {

                    const savedLanguage =
                        await getMemberLanguage();

                    setLanguage(
                        savedLanguage
                    );

                } catch (error) {

                    console.error(
                        'Member language load error:',
                        error
                    );

                }

            };

        loadLanguage();

    }, []);

    /* ====================================================================== */
    /* CHANGE LANGUAGE                                                         */
    /* ====================================================================== */

    const changeLanguage =
        async (
            newLanguage: MemberLanguage
        ) => {

            setLanguage(
                newLanguage
            );

            try {

                await setMemberLanguage(
                    newLanguage
                );

            } catch (error) {

                console.error(
                    'Member language save error:',
                    error
                );

            }

        };

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

                    setMember(
                        result.member
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
    /* DRAWER                                                                  */
    /* ====================================================================== */

    const openMenu = () => {

        if (menuMounted) {
            return;
        }

        setMenuMounted(true);
        setMenuOpen(true);

        drawerTranslateX.setValue(
            -330
        );

        overlayOpacity.setValue(
            0
        );

        requestAnimationFrame(() => {

            Animated.parallel([

                Animated.timing(
                    drawerTranslateX,
                    {
                        toValue: 0,
                        duration: 230,
                        easing:
                            Easing.out(
                                Easing.cubic
                            ),
                        useNativeDriver: true,
                    }
                ),

                Animated.timing(
                    overlayOpacity,
                    {
                        toValue: 1,
                        duration: 180,
                        easing:
                            Easing.out(
                                Easing.quad
                            ),
                        useNativeDriver: true,
                    }
                ),

            ]).start();

        });

    };

    const closeMenu = (
        callback?: () => void
    ) => {

        if (!menuMounted) {

            callback?.();

            return;
        }

        Animated.parallel([

            Animated.timing(
                drawerTranslateX,
                {
                    toValue: -330,
                    duration: 230,
                    easing:
                        Easing.in(
                            Easing.cubic
                        ),
                    useNativeDriver: true,
                }
            ),

            Animated.timing(
                overlayOpacity,
                {
                    toValue: 0,
                    duration: 180,
                    easing:
                        Easing.in(
                            Easing.quad
                        ),
                    useNativeDriver: true,
                }
            ),

        ]).start(() => {

            setMenuOpen(false);
            setMenuMounted(false);

            callback?.();

        });

    };

    /* ====================================================================== */
    /* MENU PRESS                                                              */
    /* ====================================================================== */

    const handleMenuPress = (
        route?: string
    ) => {

        if (!route) {

            closeMenu();

            return;
        }

        closeMenu(() => {

            router.push(
                route as any
            );

        });

    };

    /* ====================================================================== */
    /* LOGOUT                                                                  */
    /* ====================================================================== */

    const handleLogout = () => {

        closeMenu(() => {

            clearCurrentMember();

            router.replace(
                '/member/login'
            );

        });

    };

    /* ====================================================================== */
    /* PIN INPUT                                                               */
    /* ====================================================================== */

    const sanitizePin = (
        value: string
    ) => {

        return value
            .replace(
                /[^0-9]/g,
                ''
            )
            .slice(
                0,
                6
            );

    };

    /* ====================================================================== */
    /* CHANGE PIN                                                              */
    /* ====================================================================== */

    async function handleChangePin() {

        /* ------------------------------------------------------------------ */
        /* MEMBER SESSION                                                      */
        /* ------------------------------------------------------------------ */

        const currentMemberId = member?.memberId;

        if (!currentMemberId) {

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
            currentPin.length < 4 ||
            currentPin.length > 6 ||
            newPin.length < 4 ||
            newPin.length > 6 ||
            confirmPin.length < 4 ||
            confirmPin.length > 6
        ) {

            Alert.alert(
                t.error,
                t.invalidPin
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
                currentMemberId
            );

            const result =
                await changeMemberPin(
                    currentMemberId,
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

            setCurrentPin('');
            setNewPin('');
            setConfirmPin('');

            setShowCurrentPin(false);
            setShowNewPin(false);
            setShowConfirmPin(false);

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

                    {/* ====================================================== */}
                    {/* HEADER                                                 */}
                    {/* ====================================================== */}

                    <View
                        style={
                            styles.header
                        }
                    >

                        <View
                            style={
                                styles.headerLeft
                            }
                        >

                            <Pressable
                                onPress={
                                    openMenu
                                }
                                style={({ pressed }) => [

                                    styles.menuButton,

                                    pressed &&
                                    styles.menuButtonPressed,

                                ]}
                            >

                                <Ionicons
                                    name="menu-outline"
                                    size={24}
                                    color="#0f172a"
                                />

                            </Pressable>

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

                        <View
                            style={styles.memberInfo}
                        >

                            <Text
                                style={styles.memberName}
                                numberOfLines={1}
                            >
                                {member?.memberName || ''}
                            </Text>

                            <Text
                                style={styles.memberId}
                                numberOfLines={1}
                            >
                                {t.memberId}: {member?.memberId || ''}
                            </Text>

                        </View>

                    </View>

                    {/* ====================================================== */}
                    {/* CONTENT                                                */}
                    {/* ====================================================== */}

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
                        {/* SECURITY CARD                                       */}
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

                                <Ionicons
                                    name="lock-closed-outline"
                                    size={27}
                                    color="#ffffff"
                                />

                            </View>

                            <Text
                                style={
                                    styles.securityTitle
                                }
                            >
                                {t.title}
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
                        {/* FORM                                                */}
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
                                    onChangeText={(
                                        value
                                    ) =>
                                        setCurrentPin(
                                            sanitizePin(
                                                value
                                            )
                                        )
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
                                    keyboardType="number-pad"
                                    maxLength={6}
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
                                        styles.eyeButton
                                    }
                                    hitSlop={8}
                                >

                                    <Ionicons
                                        name={
                                            showCurrentPin
                                                ? 'eye-off-outline'
                                                : 'eye-outline'
                                        }
                                        size={21}
                                        color="#64748b"
                                    />

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
                                    onChangeText={(
                                        value
                                    ) =>
                                        setNewPin(
                                            sanitizePin(
                                                value
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
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="number-pad"
                                    maxLength={6}
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
                                        styles.eyeButton
                                    }
                                    hitSlop={8}
                                >

                                    <Ionicons
                                        name={
                                            showNewPin
                                                ? 'eye-off-outline'
                                                : 'eye-outline'
                                        }
                                        size={21}
                                        color="#64748b"
                                    />

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
                                    onChangeText={(
                                        value
                                    ) =>
                                        setConfirmPin(
                                            sanitizePin(
                                                value
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
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="number-pad"
                                    maxLength={6}
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
                                        styles.eyeButton
                                    }
                                    hitSlop={8}
                                >

                                    <Ionicons
                                        name={
                                            showConfirmPin
                                                ? 'eye-off-outline'
                                                : 'eye-outline'
                                        }
                                        size={21}
                                        color="#64748b"
                                    />

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
                                    !member?.memberId
                                }
                                style={({
                                    pressed,
                                }) => [

                                        styles.changeButton,

                                        (changing ||
                                            !member?.memberId) &&
                                        styles.changeButtonDisabled,

                                        pressed &&
                                        !changing &&
                                        !!member?.memberId &&
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
                                            t.changePinButton
                                        }
                                    </Text>

                                )}

                            </Pressable>

                        </View>

                        <View
                            style={
                                styles.bottomSpacing
                            }
                        />

                    </ScrollView>

                    {/* ====================================================== */}
                    {/* SIDE MENU                                               */}
                    {/* ====================================================== */}

                    {menuMounted && (

                        <View
                            style={
                                styles.menuOverlay
                            }
                        >

                            {/* OVERLAY */}

                            <Animated.View
                                pointerEvents={
                                    menuOpen
                                        ? 'auto'
                                        : 'none'
                                }
                                style={[
                                    styles.overlayBackground,
                                    {
                                        opacity:
                                            overlayOpacity,
                                    },
                                ]}
                            >

                                <Pressable
                                    style={
                                        styles.overlayPressable
                                    }
                                    onPress={() =>
                                        closeMenu()
                                    }
                                />

                            </Animated.View>

                            {/* DRAWER */}

                            <Animated.View
                                style={[
                                    styles.drawer,
                                    {
                                        transform: [
                                            {
                                                translateX:
                                                    drawerTranslateX,
                                            },
                                        ],
                                    },
                                ]}
                            >

                                <SafeAreaView
                                    style={
                                        styles.drawerSafeArea
                                    }
                                    edges={[
                                        'bottom',
                                    ]}
                                >

                                    {/* DRAWER HEADER */}

                                    <View
                                        style={
                                            styles.drawerHeader
                                        }
                                    >

                                        <View
                                            style={
                                                styles.drawerBrand
                                            }
                                        >

                                            <View
                                                style={
                                                    styles.drawerLogo
                                                }
                                            >

                                                <Text
                                                    style={
                                                        styles.takaIcon
                                                    }
                                                >
                                                    ৳
                                                </Text>

                                            </View>

                                            <View>

                                                <Text
                                                    style={
                                                        styles.drawerAppName
                                                    }
                                                >
                                                    {t.appName}
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.drawerSubtitle
                                                    }
                                                >
                                                    {
                                                        t.memberPanel
                                                    }
                                                </Text>

                                            </View>

                                        </View>

                                        <Pressable
                                            onPress={() =>
                                                closeMenu()
                                            }
                                            style={({
                                                pressed,
                                            }) => [

                                                    styles.closeButton,

                                                    pressed &&
                                                    styles.closeButtonPressed,

                                                ]}
                                        >

                                            <Ionicons
                                                name="close"
                                                size={23}
                                                color="#0f172a"
                                            />

                                        </Pressable>

                                    </View>

                                    {/* MENU */}

                                    <ScrollView
                                        showsVerticalScrollIndicator={
                                            false
                                        }
                                        contentContainerStyle={
                                            styles.menuScroll
                                        }
                                    >

                                        {/* DASHBOARD */}

                                        <View
                                            style={
                                                styles.firstMenuItem
                                            }
                                        >

                                            <MenuItem
                                                icon="grid-outline"
                                                label={
                                                    t.dashboard
                                                }
                                                onPress={() =>
                                                    handleMenuPress(
                                                        '/member/dashboard'
                                                    )
                                                }
                                            />

                                        </View>

                                        {/* PROFILE */}

                                        <MenuItem
                                            icon="person-outline"
                                            label={
                                                t.profile
                                            }
                                            onPress={() =>
                                                handleMenuPress(
                                                    '/member/profile'
                                                )
                                            }
                                        />

                                        {/* CHANGE GMAIL */}

                                        <MenuItem
                                            icon="mail-outline"
                                            label={
                                                t.changeGmail
                                            }
                                            onPress={() =>
                                                handleMenuPress(
                                                    '/member/change-email'
                                                )
                                            }
                                        />

                                        {/* CHANGE PIN */}

                                        <MenuItem
                                            icon="lock-closed-outline"
                                            label={
                                                t.changePin
                                            }
                                            active
                                            onPress={() =>
                                                closeMenu()
                                            }
                                        />

                                        <MenuDivider />

                                        {/* WEEKLY DEPOSIT */}

                                        <MenuItem
                                            icon="cash-outline"
                                            label={
                                                t.weeklyDeposit
                                            }
                                            onPress={() =>
                                                handleMenuPress(
                                                    '/member/deposit'
                                                )
                                            }
                                        />

                                        {/* PENDING DEPOSIT */}

                                        <MenuItem
                                            icon="hourglass-outline"
                                            label={
                                                t.pendingDeposit
                                            }
                                            onPress={() =>
                                                handleMenuPress(
                                                    '/member/pending-deposit'
                                                )
                                            }
                                        />

                                        {/* WEEKLY HISTORY */}

                                        <MenuItem
                                            icon="time-outline"
                                            label={
                                                t.weeklyHistory
                                            }
                                            onPress={() =>
                                                handleMenuPress(
                                                    '/member/deposit-history'
                                                )
                                            }
                                        />

                                        <MenuDivider />

                                        {/* LANGUAGE */}

                                        <View
                                            style={
                                                styles.languageMenu
                                            }
                                        >

                                            <View
                                                style={
                                                    styles.menuItemLeft
                                                }
                                            >

                                                <Ionicons
                                                    name="language-outline"
                                                    size={20}
                                                    color="#475569"
                                                />

                                                <Text
                                                    style={
                                                        styles.menuItemText
                                                    }
                                                >
                                                    {t.language}
                                                </Text>

                                            </View>

                                            <View
                                                style={
                                                    styles.languageOptions
                                                }
                                            >

                                                {/* BANGLA */}

                                                <Pressable
                                                    onPress={() =>
                                                        changeLanguage(
                                                            'bn'
                                                        )
                                                    }
                                                    style={
                                                        language ===
                                                            'bn'
                                                            ? styles.languageOptionActive
                                                            : styles.languageOption
                                                    }
                                                >

                                                    <Text
                                                        style={
                                                            language ===
                                                                'bn'
                                                                ? styles.languageOptionActiveText
                                                                : styles.languageOptionText
                                                        }
                                                    >
                                                        {t.bangla}
                                                    </Text>

                                                </Pressable>

                                                {/* ENGLISH */}

                                                <Pressable
                                                    onPress={() =>
                                                        changeLanguage(
                                                            'en'
                                                        )
                                                    }
                                                    style={
                                                        language ===
                                                            'en'
                                                            ? styles.languageOptionActive
                                                            : styles.languageOption
                                                    }
                                                >

                                                    <Text
                                                        style={
                                                            language ===
                                                                'en'
                                                                ? styles.languageOptionActiveText
                                                                : styles.languageOptionText
                                                        }
                                                    >
                                                        EN
                                                    </Text>

                                                </Pressable>

                                            </View>

                                        </View>

                                        <MenuDivider />

                                        {/* LOGOUT */}

                                        <Pressable
                                            onPress={
                                                handleLogout
                                            }
                                            style={({
                                                pressed,
                                            }) => [

                                                    styles.logoutButton,

                                                    pressed &&
                                                    styles.logoutButtonPressed,

                                                ]}
                                        >

                                            <Ionicons
                                                name="log-out-outline"
                                                size={21}
                                                color="#dc2626"
                                            />

                                            <Text
                                                style={
                                                    styles.logoutText
                                                }
                                            >
                                                {t.logout}
                                            </Text>

                                        </Pressable>

                                    </ScrollView>

                                </SafeAreaView>

                            </Animated.View>

                        </View>

                    )}

                </View>

            </KeyboardAvoidingView>

        </SafeAreaView>
    );
}

/* ========================================================================== */
/* MENU ITEM                                                                  */
/* ========================================================================== */

type MenuItemProps = {
    icon: React.ComponentProps<
        typeof Ionicons
    >['name'];

    label: string;

    active?: boolean;

    onPress: () => void;
};

function MenuItem({
    icon,
    label,
    active = false,
    onPress,
}: MenuItemProps) {

    return (

        <Pressable
            onPress={onPress}
        >

            {({ pressed }) => {

                const isHighlighted =
                    active ||
                    pressed;

                return (

                    <View
                        style={[
                            styles.menuItem,

                            isHighlighted &&
                            styles.menuItemActive,
                        ]}
                    >

                        <View
                            style={
                                styles.menuItemIconContainer
                            }
                        >

                            <Ionicons
                                name={icon}
                                size={20}
                                color={
                                    isHighlighted
                                        ? '#ffffff'
                                        : '#475569'
                                }
                            />

                        </View>

                        <Text
                            style={[
                                styles.menuItemText,

                                isHighlighted &&
                                styles.menuItemTextActive,
                            ]}
                        >
                            {label}
                        </Text>

                    </View>

                );

            }}

        </Pressable>

    );
}

/* ========================================================================== */
/* MENU DIVIDER                                                               */
/* ========================================================================== */

function MenuDivider() {

    return (

        <View
            style={
                styles.menuDivider
            }
        />

    );

}

/* ========================================================================== */
/* STYLES                                                                     */
/* ========================================================================== */

const styles =
    StyleSheet.create({

        /* ================================================================== */
        /* MAIN                                                                */
        /* ================================================================== */

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

        /* ================================================================== */
        /* HEADER                                                              */
        /* ================================================================== */

        header: {
            minHeight: 76,
            paddingHorizontal: 18,
            paddingVertical: 12,
            backgroundColor:
                '#ffffff',
            borderBottomWidth: 1,
            borderBottomColor:
                '#e2e8f0',
            flexDirection:
                'row',
            alignItems:
                'center',
            justifyContent:
                'space-between',
        },

        headerLeft: {
            flexDirection:
                'row',
            alignItems:
                'center',
            flex: 1,
        },

        menuButton: {
            width: 42,
            height: 42,
            borderRadius: 11,
            backgroundColor:
                '#f1f5f9',
            alignItems:
                'center',
            justifyContent:
                'center',
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

        memberInfo: {
            maxWidth: 145,
            alignItems: 'flex-end',
        },


        memberName: {
            fontSize: 13,
            fontWeight: '800',
            color: '#0f172a',
        },


        memberId: {
            marginTop: 2,
            fontSize: 10,
            color: '#64748b',
        },

        /* ================================================================== */
        /* CONTENT                                                             */
        /* ================================================================== */

        content: {
            paddingHorizontal: 18,
            paddingTop: 20,
            paddingBottom: 20,
        },

        /* ================================================================== */
        /* SECURITY CARD                                                       */
        /* ================================================================== */

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

        /* ================================================================== */
        /* FORM                                                                */
        /* ================================================================== */

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
            paddingVertical: 0,
            fontSize: 15,
            color: '#0f172a',
            letterSpacing: 1,
        },

        eyeButton: {
            width: 48,
            height: 48,
            alignItems:
                'center',
            justifyContent:
                'center',
        },

        /* ================================================================== */
        /* INFORMATION                                                         */
        /* ================================================================== */

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

        /* ================================================================== */
        /* BUTTON                                                              */
        /* ================================================================== */

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

        bottomSpacing: {
            height: 18,
        },

        /* ================================================================== */
        /* DRAWER                                                              */
        /* ================================================================== */

        menuOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            elevation: 1000,
        },

        overlayBackground: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor:
                'rgba(15, 23, 42, 0.42)',
        },

        overlayPressable: {
            flex: 1,
        },

        drawer: {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: 315,
            maxWidth: '86%',
            backgroundColor:
                '#ffffff',

            shadowColor:
                '#000000',

            shadowOpacity:
                0.16,

            shadowRadius:
                15,

            shadowOffset: {
                width: 4,
                height: 0,
            },

            elevation: 12,
        },

        drawerSafeArea: {
            flex: 1,
        },

        drawerHeader: {
            minHeight: 76,
            paddingHorizontal: 17,
            borderBottomWidth: 1,
            borderBottomColor:
                '#e2e8f0',
            flexDirection:
                'row',
            alignItems:
                'center',
            justifyContent:
                'space-between',
        },

        drawerBrand: {
            flexDirection:
                'row',
            alignItems:
                'center',
        },

        drawerLogo: {
            width: 43,
            height: 43,
            borderRadius: 12,
            backgroundColor:
                '#0f172a',
            alignItems:
                'center',
            justifyContent:
                'center',
            marginRight: 10,
        },

        takaIcon: {
            fontSize: 24,
            fontWeight: '900',
            color: '#ffffff',
            lineHeight: 28,
        },

        drawerAppName: {
            fontSize: 14,
            fontWeight: '800',
            color: '#0f172a',
        },

        drawerSubtitle: {
            marginTop: 2,
            fontSize: 10,
            color: '#64748b',
        },

        closeButton: {
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor:
                '#f1f5f9',
            alignItems:
                'center',
            justifyContent:
                'center',
        },

        closeButtonPressed: {
            opacity: 0.65,
        },

        /* ================================================================== */
        /* COMPACT MENU                                                        */
        /* ================================================================== */

        menuScroll: {
            paddingHorizontal: 9,
            paddingBottom: 15,
        },

        firstMenuItem: {
            marginTop: 7,
        },

        menuItem: {
            minHeight: 46,
            borderRadius: 10,
            paddingHorizontal: 12,
            flexDirection:
                'row',
            alignItems:
                'center',
            marginBottom: 2,
            overflow: 'hidden',
        },

        menuItemActive: {
            backgroundColor:
                '#0f172a',
        },

        menuItemIconContainer: {
            width: 20,
            height: 20,
            alignItems:
                'center',
            justifyContent:
                'center',
        },

        menuItemText: {
            marginLeft: 12,
            fontSize: 12,
            fontWeight: '700',
            flex: 1,
            color: '#334155',
        },

        menuItemTextActive: {
            color: '#ffffff',
        },

        menuDivider: {
            height: 1,
            backgroundColor:
                '#e2e8f0',
            marginVertical: 10,
            marginHorizontal: 7,
        },

        /* ================================================================== */
        /* LANGUAGE                                                            */
        /* ================================================================== */

        languageMenu: {
            minHeight: 55,
            paddingHorizontal: 12,
            flexDirection:
                'row',
            alignItems:
                'center',
            justifyContent:
                'space-between',
        },

        menuItemLeft: {
            flexDirection:
                'row',
            alignItems:
                'center',
            flex: 1,
        },

        languageOptions: {
            flexDirection:
                'row',
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
            paddingHorizontal: 8,
            paddingVertical: 5,
            borderRadius: 7,
            backgroundColor:
                '#0f172a',
        },

        languageOptionText: {
            fontSize: 9,
            fontWeight: '800',
            color: '#64748b',
        },

        languageOptionActiveText: {
            fontSize: 9,
            fontWeight: '800',
            color: '#ffffff',
        },

        /* ================================================================== */
        /* LOGOUT                                                              */
        /* ================================================================== */

        logoutButton: {
            minHeight: 46,
            borderRadius: 10,
            paddingHorizontal: 12,
            flexDirection:
                'row',
            alignItems:
                'center',
            backgroundColor:
                '#fef2f2',
        },

        logoutButtonPressed: {
            opacity: 0.65,
        },

        logoutText: {
            marginLeft: 12,
            fontSize: 12,
            fontWeight: '800',
            color: '#dc2626',
        },

    });