import React, {
    useEffect,
    useRef,
    useState,
} from 'react';

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
    Keyboard,
    Dimensions,
} from 'react-native';

import {
    SafeAreaView,
} from 'react-native-safe-area-context';

import {
    router,
} from 'expo-router';

import {
    Ionicons,
} from '@expo/vector-icons';

import {
    getAdminLanguage,
    setAdminLanguage,
    AdminLanguage,
} from '../../lib/admin-language';

import {
    changeAdminPassword,
    getCurrentAdmin,
} from '../../lib/admin-api';


/* ========================================================================== */
/* TRANSLATIONS                                                               */
/* ========================================================================== */

const translations = {

    bn: {

        appName:
            'ক্ষুদ্র সঞ্চয়',

        appSubtitle:
            'সমবায় সমিতি',

        adminPanel:
            'অ্যাডমিন প্যানেল',

        dashboard:
            'ড্যাশবোর্ড',

        profile:
            'প্রোফাইল',

        changeEmail:
            'ইমেইল পরিবর্তন',

        changePassword:
            'পাসওয়ার্ড পরিবর্তন',

        weeklyRequest:
            'সাপ্তাহিক জমার রিকোয়েস্ট',

        weeklyDeposit:
            'সাপ্তাহিক জমা',

        weeklyHistory:
            'সাপ্তাহিক জমার হিস্টরি',

        createAdmin:
            'অ্যাডমিন তৈরি করুন',

        createMember:
            'সদস্য তৈরি করুন',

        accessMember:
            'সদস্য অ্যাকাউন্টে প্রবেশ',

        selectLanguage:
            'ভাষা নির্বাচন করুন',

        bangla:
            'বাংলা',

        english:
            'English',

        logout:
            'লগআউট',

        adminId:
            'অ্যাডমিন ID',

        title:
            'পাসওয়ার্ড পরিবর্তন',

        subtitle:
            'আপনার অ্যাডমিন অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন করুন',

        currentPassword:
            'বর্তমান পাসওয়ার্ড',

        currentPasswordPlaceholder:
            'বর্তমান পাসওয়ার্ড লিখুন',

        newPassword:
            'নতুন পাসওয়ার্ড',

        newPasswordPlaceholder:
            'নতুন পাসওয়ার্ড লিখুন',

        confirmPassword:
            'নতুন পাসওয়ার্ড আবার দিন',

        confirmPasswordPlaceholder:
            'নতুন পাসওয়ার্ড আবার লিখুন',

        requirementTitle:
            'পাসওয়ার্ড নিরাপত্তা',

        requirement1:
            'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',

        requirement2:
            'নতুন পাসওয়ার্ড বর্তমান পাসওয়ার্ড থেকে আলাদা হতে হবে।',

        changing:
            'পাসওয়ার্ড পরিবর্তন হচ্ছে...',

        currentRequired:
            'বর্তমান পাসওয়ার্ড দিন।',

        newRequired:
            'নতুন পাসওয়ার্ড দিন।',

        confirmRequired:
            'নতুন পাসওয়ার্ড আবার দিন।',

        invalidNewPassword:
            'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',

        passwordMismatch:
            'নতুন পাসওয়ার্ড এবং নিশ্চিত পাসওয়ার্ড মিলছে না।',

        samePassword:
            'নতুন পাসওয়ার্ড বর্তমান পাসওয়ার্ড থেকে আলাদা হতে হবে।',

        adminNotFound:
            'বর্তমান অ্যাডমিন সেশন পাওয়া যায়নি।',

        successTitle:
            'সফল',

        successMessage:
            'আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।',

        error:
            'কিছু সমস্যা হয়েছে',

    },


    en: {

        appName:
            'ক্ষুদ্র সঞ্চয়',

        appSubtitle:
            'সমবায় সমিতি',

        adminPanel:
            'Admin Panel',

        dashboard:
            'Dashboard',

        profile:
            'Profile',

        changeEmail:
            'Change Email',

        changePassword:
            'Change Password',

        weeklyRequest:
            'Weekly Deposit Requests',

        weeklyDeposit:
            'Weekly Deposit',

        weeklyHistory:
            'Weekly Deposit History',

        createAdmin:
            'Create Admin',

        createMember:
            'Create Member',

        accessMember:
            'Access Member Account',

        selectLanguage:
            'Select Language',

        bangla:
            'বাংলা',

        english:
            'English',

        logout:
            'Logout',

        adminId:
            'Admin ID',

        title:
            'Change Password',

        subtitle:
            'Change your administrator account password',

        currentPassword:
            'Current Password',

        currentPasswordPlaceholder:
            'Enter current password',

        newPassword:
            'New Password',

        newPasswordPlaceholder:
            'Enter new password',

        confirmPassword:
            'Confirm New Password',

        confirmPasswordPlaceholder:
            'Re-enter new password',

        requirementTitle:
            'Password Security',

        requirement1:
            'Password must be at least 6 characters.',

        requirement2:
            'New password must be different from your current password.',

        changing:
            'Changing Password...',

        currentRequired:
            'Enter your current password.',

        newRequired:
            'Enter a new password.',

        confirmRequired:
            'Confirm your new password.',

        invalidNewPassword:
            'New password must be at least 6 characters.',

        passwordMismatch:
            'New password and confirm password do not match.',

        samePassword:
            'New password must be different from your current password.',

        adminNotFound:
            'Current admin session was not found.',

        successTitle:
            'Success',

        successMessage:
            'Your password has been changed successfully.',

        error:
            'Something went wrong',

    },

};


/* ========================================================================== */
/* SCREEN                                                                     */
/* ========================================================================== */

export default function ChangePasswordScreen() {

    /* ---------------------------------------------------------------------- */
    /* LANGUAGE                                                               */
    /* ---------------------------------------------------------------------- */

    const [
        language,
        setLanguage,
    ] = useState<AdminLanguage>(
        'bn'
    );

    const t =
        translations[language];


    /* ---------------------------------------------------------------------- */
    /* ADMIN                                                                  */
    /* ---------------------------------------------------------------------- */

    const currentAdmin =
        getCurrentAdmin();

    const [
        adminName,
        setAdminName,
    ] = useState(
        currentAdmin?.adminName || 'Admin'
    );

    const [
        adminId,
        setAdminId,
    ] = useState(
        currentAdmin?.adminId || 'A001'
    );


    /* ---------------------------------------------------------------------- */
    /* MENU                                                                   */
    /* ---------------------------------------------------------------------- */

    const [
        menuOpen,
        setMenuOpen,
    ] = useState(false);

    const [
        menuMounted,
        setMenuMounted,
    ] = useState(false);


    /* ---------------------------------------------------------------------- */
    /* MENU ANIMATION                                                         */
    /* ---------------------------------------------------------------------- */

    const drawerTranslateX =
        useRef(
            new Animated.Value(-330)
        ).current;

    const overlayOpacity =
        useRef(
            new Animated.Value(0)
        ).current;


    const openMenu = () => {

        setMenuMounted(true);

        drawerTranslateX.setValue(-330);
        overlayOpacity.setValue(0);

        requestAnimationFrame(() => {

            Animated.parallel([

                Animated.timing(
                    drawerTranslateX,
                    {
                        toValue: 0,
                        duration: 280,
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
                        duration: 230,
                        easing:
                            Easing.out(
                                Easing.quad
                            ),
                        useNativeDriver: true,
                    }
                ),

            ]).start();

        });

        setMenuOpen(true);

    };


    const closeMenu = (
        callback?: () => void
    ) => {

        if (!menuMounted) {

            if (
                typeof callback === 'function'
            ) {

                callback();

            }

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

            if (
                typeof callback === 'function'
            ) {

                callback();

            }

        });

    };


    /* ---------------------------------------------------------------------- */
    /* SCROLL REF                                                             */
    /* ---------------------------------------------------------------------- */

    const scrollViewRef =
        useRef<ScrollView>(null);

    const confirmPasswordRef =
        useRef<TextInput>(null);

    const scrollAnimation =
        useRef(
            new Animated.Value(0)
        ).current;

    const currentScrollOffset =
        useRef(0);

    const confirmPasswordFocused =
        useRef(false);


    /* ---------------------------------------------------------------------- */
    /* FORM STATE                                                             */
    /* ---------------------------------------------------------------------- */

    const [
        currentPassword,
        setCurrentPassword,
    ] = useState('');

    const [
        newPassword,
        setNewPassword,
    ] = useState('');

    const [
        confirmPassword,
        setConfirmPassword,
    ] = useState('');


    /* ---------------------------------------------------------------------- */
    /* UI STATE                                                               */
    /* ---------------------------------------------------------------------- */

    const [
        changing,
        setChanging,
    ] = useState(false);

    const [
        showCurrentPassword,
        setShowCurrentPassword,
    ] = useState(false);

    const [
        showNewPassword,
        setShowNewPassword,
    ] = useState(false);

    const [
        showConfirmPassword,
        setShowConfirmPassword,
    ] = useState(false);


    /* ====================================================================== */
    /* LOAD LANGUAGE                                                          */
    /* ====================================================================== */

    useEffect(() => {

        const initialize =
            async () => {

                try {

                    const savedLanguage =
                        await getAdminLanguage();

                    setLanguage(
                        savedLanguage
                    );

                } catch (error) {

                    console.error(
                        'Change password language error:',
                        error
                    );

                }

            };

        initialize();

    }, []);


    /* ====================================================================== */
    /* SYNC SCROLL ANIMATION                                                  */
    /* ====================================================================== */

    useEffect(() => {

        const listener =
            scrollAnimation.addListener(
                ({ value }) => {

                    scrollViewRef.current?.scrollTo({
                        y: value,
                        animated: false,
                    });

                }
            );

        return () => {

            scrollAnimation.removeListener(
                listener
            );

        };

    }, [scrollAnimation]);


    /* ====================================================================== */
    /* KEYBOARD LISTENERS                                                     */
    /* ====================================================================== */

    useEffect(() => {

        const keyboardShowEvent =
            Platform.OS === 'ios'
                ? 'keyboardWillShow'
                : 'keyboardDidShow';

        const keyboardHideEvent =
            Platform.OS === 'ios'
                ? 'keyboardWillHide'
                : 'keyboardDidHide';


        const keyboardShowListener =
            Keyboard.addListener(
                keyboardShowEvent,
                () => {

                    if (
                        confirmPasswordFocused.current
                    ) {

                        requestAnimationFrame(() => {

                            requestAnimationFrame(() => {

                                smoothScrollToConfirmPassword();

                            });

                        });

                    }

                }
            );


        const keyboardHideListener =
            Keyboard.addListener(
                keyboardHideEvent,
                () => {

                    confirmPasswordFocused.current =
                        false;

                }
            );


        return () => {

            keyboardShowListener.remove();
            keyboardHideListener.remove();

        };

    }, []);


    /* ====================================================================== */
    /* CHANGE PASSWORD                                                        */
    /* ====================================================================== */

    async function handleChangePassword() {

        const admin =
            getCurrentAdmin();


        if (!admin?.adminId) {

            Alert.alert(
                t.error,
                t.adminNotFound
            );

            return;

        }


        if (
            !currentPassword.trim()
        ) {

            Alert.alert(
                t.error,
                t.currentRequired
            );

            return;

        }


        if (
            !newPassword.trim()
        ) {

            Alert.alert(
                t.error,
                t.newRequired
            );

            return;

        }


        if (
            !confirmPassword.trim()
        ) {

            Alert.alert(
                t.error,
                t.confirmRequired
            );

            return;

        }


        if (
            newPassword.length < 6
        ) {

            Alert.alert(
                t.error,
                t.invalidNewPassword
            );

            return;

        }


        if (
            newPassword !==
            confirmPassword
        ) {

            Alert.alert(
                t.error,
                t.passwordMismatch
            );

            return;

        }


        if (
            currentPassword ===
            newPassword
        ) {

            Alert.alert(
                t.error,
                t.samePassword
            );

            return;

        }


        try {

            setChanging(true);


            console.log(
                'Changing admin password:',
                admin.adminId
            );


            const result =
                await changeAdminPassword(
                    admin.adminId,
                    currentPassword,
                    newPassword,
                    confirmPassword
                );


            console.log(
                'Change password response:',
                result
            );


            if (!result.success) {

                Alert.alert(
                    t.error,
                    result.message
                );

                return;

            }


            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');


            Alert.alert(
                t.successTitle,
                t.successMessage,
                [
                    {
                        text: 'OK',

                        onPress: () => {

                            router.replace(
                                '/admin/dashboard'
                            );

                        },

                    },
                ]
            );


        } catch (error) {

            console.error(
                'Change password error:',
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
    /* MENU NAVIGATION                                                        */
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
    /* LOGOUT                                                                 */
    /* ====================================================================== */

    const handleLogout = () => {

        closeMenu(() => {

            /*
             * এখানে logout-এর existing behavior
             * পরিবর্তন করা হচ্ছে না।
             */

            router.replace(
                '/admin/login'
            );

        });

    };


    /* ====================================================================== */
    /* LANGUAGE                                                               */
    /* ====================================================================== */

    const changeLanguage = async (
        newLanguage: AdminLanguage
    ) => {

        setLanguage(
            newLanguage
        );


        try {

            await setAdminLanguage(
                newLanguage
            );

        } catch (error) {

            console.error(
                'Admin language save error:',
                error
            );

        }

    };


    /* ====================================================================== */
    /* SMOOTH SCROLL TO CONFIRM PASSWORD                                      */
    /* ====================================================================== */

    function smoothScrollToConfirmPassword() {

        if (
            !confirmPasswordRef.current
        ) {

            return;

        }


        confirmPasswordRef.current.measureInWindow(
            (
                _x,
                y,
                _width,
                height
            ) => {

                const screenHeight =
                    Dimensions.get('window').height;

                const keyboardApproxHeight =
                    Platform.OS === 'android'
                        ? 315
                        : 300;

                const safeBottomSpace =
                    28;

                const visibleBottom =
                    screenHeight -
                    keyboardApproxHeight -
                    safeBottomSpace;

                const fieldBottom =
                    y + height;


                if (
                    fieldBottom >
                    visibleBottom
                ) {

                    const requiredScroll =
                        fieldBottom -
                        visibleBottom;


                    const targetOffset =
                        Math.max(
                            0,
                            currentScrollOffset.current +
                            requiredScroll
                        );


                    scrollAnimation.stopAnimation(
                        currentValue => {

                            scrollAnimation.setValue(
                                currentValue
                            );


                            Animated.timing(
                                scrollAnimation,
                                {
                                    toValue:
                                        targetOffset,
                                    duration:
                                        420,
                                    easing:
                                        Easing.out(
                                            Easing.cubic
                                        ),
                                    useNativeDriver:
                                        false,
                                }
                            ).start();

                        }
                    );

                }

            }
        );

    }


    /* ====================================================================== */
    /* CONFIRM PASSWORD FOCUS                                                 */
    /* ====================================================================== */

    function handleConfirmPasswordFocus() {

        confirmPasswordFocused.current =
            true;


        setTimeout(() => {

            smoothScrollToConfirmPassword();

        }, 80);

    }


    /* ====================================================================== */
    /* UI                                                                     */
    /* ====================================================================== */

    return (

        <SafeAreaView
            style={
                styles.safeArea
            }
            edges={[
                'top',
                'left',
                'right',
            ]}
        >

            <KeyboardAvoidingView
                style={
                    styles.keyboardView
                }
                behavior={
                    Platform.OS === 'ios'
                        ? 'padding'
                        : 'height'
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
                                    name="menu"
                                    size={25}
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
                            style={
                                styles.adminInfo
                            }
                        >

                            <Text
                                style={
                                    styles.adminName
                                }
                                numberOfLines={1}
                            >
                                {adminName}
                            </Text>


                            <Text
                                style={
                                    styles.adminId
                                }
                            >
                                {t.adminId}: {adminId}
                            </Text>

                        </View>

                    </View>


                    {/* ====================================================== */}
                    {/* CONTENT                                                */}
                    {/* ====================================================== */}

                    <ScrollView
                        ref={
                            scrollViewRef
                        }
                        showsVerticalScrollIndicator={
                            false
                        }
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        scrollEventThrottle={
                            16
                        }
                        onScroll={
                            event => {

                                currentScrollOffset.current =
                                    event.nativeEvent.contentOffset.y;

                            }
                        }
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

                                <Ionicons
                                    name="lock-closed"
                                    size={28}
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
                                {t.subtitle}
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

                            {/* CURRENT PASSWORD */}

                            <Text
                                style={
                                    styles.label
                                }
                            >
                                {t.currentPassword}
                            </Text>


                            <View
                                style={
                                    styles.inputContainer
                                }
                            >

                                <TextInput
                                    value={
                                        currentPassword
                                    }
                                    onChangeText={
                                        setCurrentPassword
                                    }
                                    placeholder={
                                        t.currentPasswordPlaceholder
                                    }
                                    placeholderTextColor="#94a3b8"
                                    secureTextEntry={
                                        !showCurrentPassword
                                    }
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    style={
                                        styles.input
                                    }
                                />


                                <Pressable
                                    onPress={() =>
                                        setShowCurrentPassword(
                                            previous =>
                                                !previous
                                        )
                                    }
                                    style={
                                        styles.showButton
                                    }
                                    hitSlop={6}
                                >

                                    <Ionicons
                                        name={
                                            showCurrentPassword
                                                ? 'eye-off-outline'
                                                : 'eye-outline'
                                        }
                                        size={21}
                                        color="#475569"
                                    />

                                </Pressable>

                            </View>


                            {/* NEW PASSWORD */}

                            <Text
                                style={
                                    styles.label
                                }
                            >
                                {t.newPassword}
                            </Text>


                            <View
                                style={
                                    styles.inputContainer
                                }
                            >

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
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    style={
                                        styles.input
                                    }
                                />


                                <Pressable
                                    onPress={() =>
                                        setShowNewPassword(
                                            previous =>
                                                !previous
                                        )
                                    }
                                    style={
                                        styles.showButton
                                    }
                                    hitSlop={6}
                                >

                                    <Ionicons
                                        name={
                                            showNewPassword
                                                ? 'eye-off-outline'
                                                : 'eye-outline'
                                        }
                                        size={21}
                                        color="#475569"
                                    />

                                </Pressable>

                            </View>


                            {/* CONFIRM PASSWORD */}

                            <Text
                                style={
                                    styles.label
                                }
                            >
                                {t.confirmPassword}
                            </Text>


                            <View
                                style={
                                    styles.inputContainer
                                }
                            >

                                <TextInput
                                    ref={
                                        confirmPasswordRef
                                    }
                                    value={
                                        confirmPassword
                                    }
                                    onChangeText={
                                        setConfirmPassword
                                    }
                                    onFocus={
                                        handleConfirmPasswordFocus
                                    }
                                    placeholder={
                                        t.confirmPasswordPlaceholder
                                    }
                                    placeholderTextColor="#94a3b8"
                                    secureTextEntry={
                                        !showConfirmPassword
                                    }
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    style={
                                        styles.input
                                    }
                                />


                                <Pressable
                                    onPress={() =>
                                        setShowConfirmPassword(
                                            previous =>
                                                !previous
                                        )
                                    }
                                    style={
                                        styles.showButton
                                    }
                                    hitSlop={6}
                                >

                                    <Ionicons
                                        name={
                                            showConfirmPassword
                                                ? 'eye-off-outline'
                                                : 'eye-outline'
                                        }
                                        size={21}
                                        color="#475569"
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
                                    handleChangePassword
                                }
                                disabled={
                                    changing
                                }
                                style={({ pressed }) => [

                                    styles.changeButton,

                                    changing &&
                                    styles.changeButtonDisabled,

                                    pressed &&
                                    !changing &&
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
                                            t.changePassword
                                        }
                                    </Text>

                                )}

                            </Pressable>

                        </View>


                        <View
                            style={
                                styles.bottomSpace
                            }
                        />

                    </ScrollView>


                    {/* ====================================================== */}
                    {/* SIDE MENU                                              */}
                    {/* ====================================================== */}

                    {menuMounted && (

                        <View
                            style={
                                styles.menuOverlay
                            }
                        >

                            {/* ================================================== */}
                            {/* DARK OVERLAY                                         */}
                            {/* ================================================== */}

                            <Animated.View
                                pointerEvents="auto"
                                style={[
                                    styles.overlayContainer,
                                    {
                                        opacity:
                                            overlayOpacity,
                                    },
                                ]}
                            >

                                <Pressable
                                    style={
                                        styles.overlayBackground
                                    }
                                    onPress={() =>
                                        closeMenu()
                                    }
                                />

                            </Animated.View>


                            {/* ================================================== */}
                            {/* DRAWER                                               */}
                            {/* ================================================== */}

                            <Animated.View
                                style={[
                                    styles.drawerAnimated,
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
                                        styles.drawer
                                    }
                                    edges={[
                                        'bottom',
                                    ]}
                                >

                                    {/* ========================================== */}
                                    {/* DRAWER HEADER                               */}
                                    {/* ========================================== */}

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
                                                        styles.drawerLogoText
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
                                                    {t.adminPanel}
                                                </Text>

                                            </View>

                                        </View>


                                        <Pressable
                                            onPress={() =>
                                                closeMenu()
                                            }
                                            style={({ pressed }) => [

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


                                    {/* ========================================== */}
                                    {/* MENU                                         */}
                                    {/* ========================================== */}

                                    <ScrollView
                                        showsVerticalScrollIndicator={
                                            false
                                        }
                                        contentContainerStyle={
                                            styles.menuScroll
                                        }
                                    >

                                        {/* DASHBOARD */}

                                        <MenuItem
                                            icon="grid-outline"
                                            label={
                                                t.dashboard
                                            }
                                            onPress={() =>
                                                handleMenuPress(
                                                    '/admin/dashboard'
                                                )
                                            }
                                        />


                                        {/* PROFILE */}

                                        <MenuItem
                                            icon="person-outline"
                                            label={
                                                t.profile
                                            }
                                            onPress={() =>
                                                handleMenuPress(
                                                    '/admin/profile'
                                                )
                                            }
                                        />


                                        {/* CHANGE EMAIL */}

                                        <MenuItem
                                            icon="mail-outline"
                                            label={
                                                t.changeEmail
                                            }
                                            onPress={() =>
                                                handleMenuPress(
                                                    '/admin/change-email'
                                                )
                                            }
                                        />


                                        {/* CHANGE PASSWORD — ACTIVE */}

                                        <MenuItem
                                            icon="lock-closed-outline"
                                            label={
                                                t.changePassword
                                            }
                                            active
                                            onPress={() =>
                                                closeMenu()
                                            }
                                        />


                                        <MenuDivider />


                                        {/* WEEKLY REQUEST */}

                                        <MenuItem
                                            icon="notifications-outline"
                                            label={
                                                t.weeklyRequest
                                            }
                                            onPress={() =>
                                                handleMenuPress(
                                                    '/admin/weekly-request'
                                                )
                                            }
                                        />


                                        {/* WEEKLY DEPOSIT */}

                                        <MenuItem
                                            icon="cash-outline"
                                            label={
                                                t.weeklyDeposit
                                            }
                                            onPress={() =>
                                                handleMenuPress(
                                                    '/admin/weekly-deposit'
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
                                                    '/admin/weekly-deposit-history'
                                                )
                                            }
                                        />


                                        <MenuDivider />


                                        {/* CREATE ADMIN */}

                                        <MenuItem
                                            icon="person-add-outline"
                                            label={
                                                t.createAdmin
                                            }
                                            onPress={() =>
                                                handleMenuPress(
                                                    '/admin/create-admin'
                                                )
                                            }
                                        />


                                        {/* CREATE MEMBER */}

                                        <MenuItem
                                            icon="people-outline"
                                            label={
                                                t.createMember
                                            }
                                            onPress={() =>
                                                handleMenuPress(
                                                    '/admin/create-member'
                                                )
                                            }
                                        />


                                        {/* ACCESS MEMBER */}

                                        <MenuItem
                                            icon="log-in-outline"
                                            label={
                                                t.accessMember
                                            }
                                            onPress={() =>
                                                handleMenuPress(
                                                    '/admin/access-member'
                                                )
                                            }
                                        />


                                        <MenuDivider />


                                        {/* LANGUAGE */}

                                        <LanguageMenu
                                            language={
                                                language
                                            }
                                            t={
                                                t
                                            }
                                            onChangeLanguage={
                                                changeLanguage
                                            }
                                        />


                                        <MenuDivider />


                                        {/* LOGOUT */}

                                        <Pressable
                                            onPress={
                                                handleLogout
                                            }
                                            style={({ pressed }) => [

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

    const pressAnimation =
        useRef(
            new Animated.Value(
                active ? 1 : 0
            )
        ).current;


    const animatePressIn = () => {

        if (active) {
            return;
        }


        Animated.timing(
            pressAnimation,
            {
                toValue: 1,
                duration: 130,
                easing:
                    Easing.out(
                        Easing.quad
                    ),
                useNativeDriver: false,
            }
        ).start();

    };


    const animatePressOut = () => {

        if (active) {
            return;
        }


        Animated.timing(
            pressAnimation,
            {
                toValue: 0,
                duration: 180,
                easing:
                    Easing.out(
                        Easing.quad
                    ),
                useNativeDriver: false,
            }
        ).start();

    };


    const backgroundColor =
        pressAnimation.interpolate({

            inputRange: [
                0,
                1,
            ],

            outputRange: [
                'transparent',
                '#0f172a',
            ],

        });


    const textColor =
        pressAnimation.interpolate({

            inputRange: [
                0,
                1,
            ],

            outputRange: [
                '#475569',
                '#ffffff',
            ],

        });


    return (

        <Pressable
            onPress={
                onPress
            }
            onPressIn={
                animatePressIn
            }
            onPressOut={
                animatePressOut
            }
            style={
                styles.menuItemPressable
            }
        >

            <Animated.View
                style={[
                    styles.menuItem,
                    {
                        backgroundColor:
                            active
                                ? '#0f172a'
                                : backgroundColor,
                    },
                ]}
            >

                <Animated.View>

                    <Ionicons
                        name={
                            icon
                        }
                        size={20}
                        color={
                            active
                                ? '#ffffff'
                                : '#475569'
                        }
                    />


                    {!active && (

                        <Animated.View
                            style={{
                                position:
                                    'absolute',

                                opacity:
                                    pressAnimation,
                            }}
                        >

                            <Ionicons
                                name={
                                    icon
                                }
                                size={20}
                                color="#ffffff"
                            />

                        </Animated.View>

                    )}

                </Animated.View>


                <Animated.Text
                    style={[
                        styles.menuItemText,
                        {
                            color:
                                active
                                    ? '#ffffff'
                                    : textColor,
                        },
                    ]}
                >
                    {label}
                </Animated.Text>

            </Animated.View>

        </Pressable>

    );

}


/* ========================================================================== */
/* LANGUAGE MENU                                                              */
/* ========================================================================== */

type LanguageMenuProps = {

    language: AdminLanguage;

    t: typeof translations.bn;

    onChangeLanguage: (
        language: AdminLanguage
    ) => void;

};


function LanguageMenu({
    language,
    t,
    onChangeLanguage,
}: LanguageMenuProps) {

    return (

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
                    {
                        t.selectLanguage
                    }
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
                        onChangeLanguage(
                            'bn'
                        )
                    }
                    style={
                        language === 'bn'
                            ? styles.languageOptionActive
                            : styles.languageOption
                    }
                >

                    <Text
                        style={
                            language === 'bn'
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
                        onChangeLanguage(
                            'en'
                        )
                    }
                    style={
                        language === 'en'
                            ? styles.languageOptionActive
                            : styles.languageOption
                    }
                >

                    <Text
                        style={
                            language === 'en'
                                ? styles.languageOptionActiveText
                                : styles.languageOptionText
                        }
                    >
                        EN
                    </Text>

                </Pressable>

            </View>

        </View>

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
            opacity:
                0.65,
        },

        appName: {
            fontSize: 16,
            fontWeight:
                '800',
            color:
                '#0f172a',
        },

        appSubtitle: {
            marginTop: 2,
            fontSize: 9,
            fontWeight:
                '600',
            color:
                '#64748b',
        },

        adminInfo: {
            maxWidth: 145,
            alignItems:
                'flex-end',
        },

        adminName: {
            fontSize: 13,
            fontWeight:
                '800',
            color:
                '#0f172a',
        },

        adminId: {
            marginTop: 2,
            fontSize: 10,
            color:
                '#64748b',
        },


        /* ------------------------------------------------------------------ */
        /* CONTENT                                                             */
        /* ------------------------------------------------------------------ */

        content: {
            paddingHorizontal:
                18,
            paddingTop:
                20,
            paddingBottom:
                30,
        },


        /* ------------------------------------------------------------------ */
        /* SECURITY CARD                                                       */
        /* ------------------------------------------------------------------ */

        securityCard: {
            backgroundColor:
                '#0f172a',
            borderRadius:
                18,
            padding:
                22,
            alignItems:
                'center',
        },

        securityIcon: {
            width:
                58,
            height:
                58,
            borderRadius:
                17,
            backgroundColor:
                '#1e293b',
            alignItems:
                'center',
            justifyContent:
                'center',
        },

        securityTitle: {
            marginTop:
                13,
            color:
                '#ffffff',
            fontSize:
                18,
            fontWeight:
                '800',
        },

        securityDescription: {
            marginTop:
                5,
            color:
                '#94a3b8',
            fontSize:
                11,
            textAlign:
                'center',
        },


        /* ------------------------------------------------------------------ */
        /* FORM                                                                */
        /* ------------------------------------------------------------------ */

        formCard: {
            marginTop:
                14,
            padding:
                18,
            borderRadius:
                17,
            borderWidth:
                1,
            borderColor:
                '#e2e8f0',
            backgroundColor:
                '#ffffff',
        },

        label: {
            marginBottom:
                7,
            fontSize:
                11,
            fontWeight:
                '700',
            color:
                '#475569',
        },

        inputContainer: {
            minHeight:
                50,
            marginBottom:
                17,
            paddingLeft:
                13,
            borderWidth:
                1,
            borderColor:
                '#cbd5e1',
            borderRadius:
                11,
            backgroundColor:
                '#f8fafc',
            flexDirection:
                'row',
            alignItems:
                'center',
        },

        input: {
            flex:
                1,
            minHeight:
                48,
            fontSize:
                15,
            color:
                '#0f172a',
        },

        showButton: {
            width:
                48,
            height:
                48,
            alignItems:
                'center',
            justifyContent:
                'center',
        },


        /* ------------------------------------------------------------------ */
        /* INFORMATION                                                         */
        /* ------------------------------------------------------------------ */

        infoBox: {
            marginTop:
                2,
            padding:
                13,
            borderRadius:
                11,
            backgroundColor:
                '#f1f5f9',
        },

        infoTitle: {
            marginBottom:
                5,
            fontSize:
                11,
            fontWeight:
                '800',
            color:
                '#334155',
        },

        infoText: {
            marginTop:
                3,
            fontSize:
                10,
            lineHeight:
                17,
            color:
                '#64748b',
        },


        /* ------------------------------------------------------------------ */
        /* BUTTON                                                              */
        /* ------------------------------------------------------------------ */

        changeButton: {
            minHeight:
                50,
            marginTop:
                20,
            borderRadius:
                11,
            backgroundColor:
                '#0f172a',
            alignItems:
                'center',
            justifyContent:
                'center',
        },

        changeButtonDisabled: {
            opacity:
                0.6,
        },

        changeButtonPressed: {
            opacity:
                0.85,
        },

        changeButtonText: {
            color:
                '#ffffff',
            fontSize:
                12,
            fontWeight:
                '800',
        },

        buttonLoading: {
            flexDirection:
                'row',
            alignItems:
                'center',
            gap:
                9,
        },

        bottomSpace: {
            height:
                30,
        },


        /* ================================================================== */
        /* SIDE MENU                                                          */
        /* ================================================================== */

        menuOverlay: {
            position:
                'absolute',
            top:
                0,
            left:
                0,
            right:
                0,
            bottom:
                0,
            zIndex:
                1000,
            elevation:
                1000,
        },

        overlayContainer: {
            position:
                'absolute',
            top:
                0,
            left:
                0,
            right:
                0,
            bottom:
                0,
        },

        overlayBackground: {
            flex:
                1,
            backgroundColor:
                'rgba(15, 23, 42, 0.42)',
        },

        drawerAnimated: {
            position:
                'absolute',
            top:
                0,
            bottom:
                0,
            left:
                0,
            width:
                315,
            maxWidth:
                '86%',
            zIndex:
                1001,
            elevation:
                1001,
        },

        drawer: {
            flex:
                1,
            backgroundColor:
                '#ffffff',
            shadowColor:
                '#000000',
            shadowOpacity:
                0.16,
            shadowRadius:
                15,
            shadowOffset: {
                width:
                    4,
                height:
                    0,
            },
            elevation:
                12,
        },

        drawerHeader: {
            height:
                76,
            paddingHorizontal:
                17,
            borderBottomWidth:
                1,
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
            width:
                43,
            height:
                43,
            borderRadius:
                12,
            backgroundColor:
                '#0f172a',
            alignItems:
                'center',
            justifyContent:
                'center',
            marginRight:
                10,
        },

        drawerLogoText: {
            color:
                '#ffffff',
            fontSize:
                21,
            fontWeight:
                '800',
        },

        drawerAppName: {
            fontSize:
                14,
            fontWeight:
                '800',
            color:
                '#0f172a',
        },

        drawerSubtitle: {
            marginTop:
                2,
            fontSize:
                10,
            color:
                '#64748b',
        },

        closeButton: {
            width:
                38,
            height:
                38,
            borderRadius:
                10,
            backgroundColor:
                '#f1f5f9',
            alignItems:
                'center',
            justifyContent:
                'center',
        },

        closeButtonPressed: {
            opacity:
                0.6,
        },

        menuScroll: {
            paddingHorizontal:
                11,
            paddingTop:
                10,
            paddingBottom:
                20,
        },

        menuItemPressable: {
            borderRadius:
                10,
            marginBottom:
                3,
        },

        menuItem: {
            minHeight:
                46,
            borderRadius:
                10,
            paddingHorizontal:
                12,
            flexDirection:
                'row',
            alignItems:
                'center',
        },

        menuItemText: {
            marginLeft:
                12,
            fontSize:
                12,
            fontWeight:
                '700',
            flex:
                1,
        },

        menuDivider: {
            height:
                1,
            backgroundColor:
                '#e2e8f0',
            marginVertical:
                10,
            marginHorizontal:
                7,
        },


        /* ------------------------------------------------------------------ */
        /* LANGUAGE                                                            */
        /* ------------------------------------------------------------------ */

        languageMenu: {
            minHeight:
                55,
            paddingHorizontal:
                12,
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
            flex:
                1,
        },

        languageOptions: {
            flexDirection:
                'row',
            padding:
                3,
            borderRadius:
                9,
            backgroundColor:
                '#f1f5f9',
        },

        languageOption: {
            paddingHorizontal:
                8,
            paddingVertical:
                6,
            borderRadius:
                7,
        },

        languageOptionActive: {
            paddingHorizontal:
                8,
            paddingVertical:
                6,
            borderRadius:
                7,
            backgroundColor:
                '#0f172a',
        },

        languageOptionText: {
            fontSize:
                9,
            fontWeight:
                '800',
            color:
                '#64748b',
        },

        languageOptionActiveText: {
            fontSize:
                9,
            fontWeight:
                '800',
            color:
                '#ffffff',
        },


        /* ------------------------------------------------------------------ */
        /* LOGOUT                                                              */
        /* ------------------------------------------------------------------ */

        logoutButton: {
            minHeight:
                46,
            borderRadius:
                10,
            paddingHorizontal:
                12,
            flexDirection:
                'row',
            alignItems:
                'center',
            backgroundColor:
                '#fef2f2',
        },

        logoutButtonPressed: {
            opacity:
                0.65,
        },

        logoutText: {
            marginLeft:
                12,
            fontSize:
                12,
            fontWeight:
                '800',
            color:
                '#dc2626',
        },

    });