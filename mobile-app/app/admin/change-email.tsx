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
    getCurrentAdmin,
    verifyAdminEmailChangePassword,
    sendAdminEmailChangeOTP,
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
            'ইমেইল পরিবর্তন',

        subtitle:
            'আপনার অ্যাডমিন অ্যাকাউন্টের Gmail পরিবর্তন করুন',

        currentPassword:
            'বর্তমান পাসওয়ার্ড',

        currentPasswordPlaceholder:
            'বর্তমান পাসওয়ার্ড লিখুন',

        newEmail:
            'নতুন Gmail',

        newEmailPlaceholder:
            'নতুন Gmail ঠিকানা লিখুন',

        requirementTitle:
            'ইমেইল নিরাপত্তা',

        requirement1:
            'নতুন Gmail ঠিকানাটি অবশ্যই একটি বৈধ Gmail হতে হবে।',

        requirement2:
            'নতুন Gmail-এ OTP পাঠিয়ে পরিবর্তনটি যাচাই করা হবে।',

        continue:
            'এগিয়ে যান',

        sending:
            'OTP পাঠানো হচ্ছে...',

        verifying:
            'যাচাই করা হচ্ছে...',

        currentRequired:
            'বর্তমান পাসওয়ার্ড দিন।',

        newEmailRequired:
            'নতুন Gmail ঠিকানা দিন।',

        invalidEmail:
            'সঠিক Gmail ঠিকানা দিন।',

        sameEmail:
            'নতুন Gmail বর্তমান Gmail থেকে আলাদা হতে হবে।',

        adminNotFound:
            'বর্তমান অ্যাডমিন সেশন পাওয়া যায়নি।',

        authorizationMissing:
            'অনুমোদন টোকেন পাওয়া যায়নি। আবার চেষ্টা করুন।',

        passwordVerificationFailed:
            'বর্তমান পাসওয়ার্ড সঠিক নয়।',

        emailSendFailed:
            'নতুন Gmail-এ OTP পাঠানো যায়নি।',

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
            'Change Email',

        subtitle:
            'Change the Gmail address of your admin account',

        currentPassword:
            'Current Password',

        currentPasswordPlaceholder:
            'Enter current password',

        newEmail:
            'New Gmail',

        newEmailPlaceholder:
            'Enter new Gmail address',

        requirementTitle:
            'Email Security',

        requirement1:
            'The new Gmail address must be a valid Gmail address.',

        requirement2:
            'The change will be verified by an OTP sent to the new Gmail.',

        continue:
            'Continue',

        sending:
            'Sending OTP...',

        verifying:
            'Verifying...',

        currentRequired:
            'Enter your current password.',

        newEmailRequired:
            'Enter your new Gmail address.',

        invalidEmail:
            'Please enter a valid Gmail address.',

        sameEmail:
            'The new Gmail must be different from the current Gmail.',

        adminNotFound:
            'Current admin session was not found.',

        authorizationMissing:
            'Authorization token was not received. Please try again.',

        passwordVerificationFailed:
            'The current password is incorrect.',

        emailSendFailed:
            'Could not send OTP to the new Gmail address.',

        error:
            'Something went wrong',

    },

};


/* ========================================================================== */
/* SCREEN                                                                     */
/* ========================================================================== */

export default function ChangeEmailScreen() {

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

    const newEmailRef =
        useRef<TextInput>(null);

    const scrollAnimation =
        useRef(
            new Animated.Value(0)
        ).current;

    const currentScrollOffset =
        useRef(0);

    const newEmailFocused =
        useRef(false);


    /* ---------------------------------------------------------------------- */
    /* FORM STATE                                                             */
    /* ---------------------------------------------------------------------- */

    const [
        currentPassword,
        setCurrentPassword,
    ] = useState('');

    const [
        newEmail,
        setNewEmail,
    ] = useState('');

    const [
        authorizationToken,
        setAuthorizationToken,
    ] = useState('');


    /* ---------------------------------------------------------------------- */
    /* UI STATE                                                               */
    /* ---------------------------------------------------------------------- */

    const [
        step,
        setStep,
    ] = useState<1 | 2>(1);

    const [
        submitting,
        setSubmitting,
    ] = useState(false);

    const [
        showCurrentPassword,
        setShowCurrentPassword,
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

                    const admin =
                        getCurrentAdmin();

                    if (admin) {

                        setAdminName(
                            admin.adminName ||
                            'Admin'
                        );

                        setAdminId(
                            admin.adminId ||
                            'A001'
                        );

                    }

                } catch (error) {

                    console.error(
                        'Change email language error:',
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
                        newEmailFocused.current
                    ) {

                        requestAnimationFrame(() => {

                            requestAnimationFrame(() => {

                                smoothScrollToNewEmail();

                            });

                        });

                    }

                }
            );


        const keyboardHideListener =
            Keyboard.addListener(
                keyboardHideEvent,
                () => {

                    newEmailFocused.current =
                        false;

                }
            );


        return () => {

            keyboardShowListener.remove();
            keyboardHideListener.remove();

        };

    }, []);


    /* ====================================================================== */
    /* GMAIL VALIDATION                                                       */
    /* ====================================================================== */

    function isValidGmail(
        email: string
    ) {

        return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(
            email.trim()
        );

    }


    /* ====================================================================== */
    /* STEP 1 — VERIFY CURRENT PASSWORD                                      */
    /* ====================================================================== */

    async function handleVerifyPassword() {

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


        try {

            setSubmitting(true);


            console.log(
                'Verifying admin password for email change:',
                admin.adminId
            );


            const result =
                await verifyAdminEmailChangePassword(
                    admin.adminId,
                    currentPassword
                );


            console.log(
                'Email change password verification response:',
                result
            );


            if (!result.success) {

                Alert.alert(
                    t.error,
                    result.message ||
                    t.passwordVerificationFailed
                );

                return;

            }


            if (
                !result.authorizationToken
            ) {

                Alert.alert(
                    t.error,
                    t.authorizationMissing
                );

                return;

            }


            setAuthorizationToken(
                result.authorizationToken
            );

            setStep(2);


            setTimeout(() => {

                newEmailRef.current?.focus();

            }, 250);


        } catch (error: any) {

            console.error(
                'Verify email change password error:',
                error
            );


            Alert.alert(
                t.error,
                error?.message ||
                t.passwordVerificationFailed
            );

        } finally {

            setSubmitting(false);

        }

    }


    /* ====================================================================== */
    /* STEP 2 — SEND OTP                                                     */
    /* ====================================================================== */

    async function handleSendOTP() {

        const admin =
            getCurrentAdmin();


        if (!admin?.adminId) {

            Alert.alert(
                t.error,
                t.adminNotFound
            );

            return;

        }


        const email =
            newEmail.trim().toLowerCase();


        if (!email) {

            Alert.alert(
                t.error,
                t.newEmailRequired
            );

            return;

        }


        if (!isValidGmail(email)) {

            Alert.alert(
                t.error,
                t.invalidEmail
            );

            return;

        }


        if (
            admin.email &&
            email ===
            admin.email.trim().toLowerCase()
        ) {

            Alert.alert(
                t.error,
                t.sameEmail
            );

            return;

        }


        if (!authorizationToken) {

            Alert.alert(
                t.error,
                t.authorizationMissing
            );

            setStep(1);

            return;

        }


        try {

            setSubmitting(true);


            console.log(
                'Sending admin email change OTP:',
                admin.adminId
            );


            const result =
                await sendAdminEmailChangeOTP(
                    admin.adminId,
                    authorizationToken,
                    email
                );


            console.log(
                'Email change OTP response:',
                result
            );


            if (!result.success) {

                Alert.alert(
                    t.error,
                    result.message ||
                    t.emailSendFailed
                );

                return;

            }


            /*
             * OTP has already been sent here.
             *
             * email-verification.tsx receives:
             * - mode
             * - adminId
             * - authorizationToken
             * - newEmail
             * - language
             *
             * In change-email mode it must NOT
             * automatically send another OTP.
             */
            router.push({
                pathname:
                    '/admin/email-verification',

                params: {
                    mode:
                        'change-email',

                    adminId:
                        admin.adminId,

                    authorizationToken:
                        authorizationToken,

                    newEmail:
                        email,

                    language:
                        language,
                },

            } as any);


        } catch (error: any) {

            console.error(
                'Send email change OTP error:',
                error
            );


            Alert.alert(
                t.error,
                error?.message ||
                t.emailSendFailed
            );

        } finally {

            setSubmitting(false);

        }

    }


    /* ====================================================================== */
    /* SUBMIT                                                                 */
    /* ====================================================================== */

    function handleSubmit() {

        if (step === 1) {

            handleVerifyPassword();

        } else {

            handleSendOTP();

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
    /* SMOOTH SCROLL TO NEW EMAIL                                             */
    /* ====================================================================== */

    function smoothScrollToNewEmail() {

        if (
            !newEmailRef.current
        ) {

            return;

        }


        newEmailRef.current.measureInWindow(
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
    /* NEW EMAIL FOCUS                                                        */
    /* ====================================================================== */

    function handleNewEmailFocus() {

        newEmailFocused.current =
            true;


        setTimeout(() => {

            smoothScrollToNewEmail();

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
                                    name="mail"
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
                                    editable={
                                        step === 1 &&
                                        !submitting
                                    }
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


                            {/* NEW EMAIL */}

                            {step === 2 && (

                                <>

                                    <Text
                                        style={
                                            styles.label
                                        }
                                    >
                                        {t.newEmail}
                                    </Text>


                                    <View
                                        style={
                                            styles.inputContainer
                                        }
                                    >

                                        <TextInput
                                            ref={
                                                newEmailRef
                                            }
                                            value={
                                                newEmail
                                            }
                                            onChangeText={
                                                setNewEmail
                                            }
                                            onFocus={
                                                handleNewEmailFocus
                                            }
                                            placeholder={
                                                t.newEmailPlaceholder
                                            }
                                            placeholderTextColor="#94a3b8"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            editable={
                                                !submitting
                                            }
                                            style={
                                                styles.input
                                            }
                                        />

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

                                </>

                            )}


                            {/* REQUIREMENTS FOR STEP 1 */}

                            {step === 1 && (

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

                            )}


                            {/* BUTTON */}

                            <Pressable
                                onPress={
                                    handleSubmit
                                }
                                disabled={
                                    submitting
                                }
                                style={({ pressed }) => [

                                    styles.changeButton,

                                    submitting &&
                                    styles.changeButtonDisabled,

                                    pressed &&
                                    !submitting &&
                                    styles.changeButtonPressed,

                                ]}
                            >

                                {submitting ? (

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
                                            {
                                                step === 1
                                                    ? t.verifying
                                                    : t.sending
                                            }
                                        </Text>

                                    </View>

                                ) : (

                                    <Text
                                        style={
                                            styles.changeButtonText
                                        }
                                    >
                                        {
                                            step === 1
                                                ? t.continue
                                                : t.continue
                                        }
                                    </Text>

                                )}

                            </Pressable>


                            {/* BACK BUTTON */}

                            {step === 2 && (

                                <Pressable
                                    onPress={() => {

                                        if (
                                            !submitting
                                        ) {

                                            setStep(1);
                                            setNewEmail('');
                                            setAuthorizationToken('');

                                        }

                                    }}
                                    disabled={
                                        submitting
                                    }
                                    style={
                                        styles.backButton
                                    }
                                >

                                    <Text
                                        style={
                                            styles.backButtonText
                                        }
                                    >
                                        {
                                            language === 'bn'
                                                ? 'পিছনে যান'
                                                : 'Go Back'
                                        }
                                    </Text>

                                </Pressable>

                            )}

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


                                        {/* CHANGE EMAIL — ACTIVE */}

                                        <MenuItem
                                            icon="mail-outline"
                                            label={
                                                t.changeEmail
                                            }
                                            active
                                            onPress={() =>
                                                closeMenu()
                                            }
                                        />


                                        {/* CHANGE PASSWORD */}

                                        <MenuItem
                                            icon="lock-closed-outline"
                                            label={
                                                t.changePassword
                                            }
                                            onPress={() =>
                                                handleMenuPress(
                                                    '/admin/change-password'
                                                )
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

        backButton: {
            minHeight:
                44,
            alignItems:
                'center',
            justifyContent:
                'center',
            marginTop:
                5,
        },

        backButtonText: {
            fontSize:
                11,
            fontWeight:
                '700',
            color:
                '#475569',
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

