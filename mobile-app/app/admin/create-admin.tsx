import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Easing,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    SafeAreaView,
} from "react-native-safe-area-context";

import {
    router,
    useFocusEffect,
} from "expo-router";

import {
    getAdminLanguage,
    setAdminLanguage,
    AdminLanguage,
} from "../../lib/admin-language";

import {
    createAdmin,
    getAdminProfile,
    getCurrentAdmin,
    clearCurrentAdmin,
} from "../../lib/admin-api";


/* ========================================================================== */
/* TRANSLATIONS                                                               */
/* ========================================================================== */

const translations = {

    bn: {

        appName:
            "ক্ষুদ্র সঞ্চয়",

        appSubtitle:
            "সমবায় সমিতি",

        adminPanel:
            "অ্যাডমিন প্যানেল",

        dashboard:
            "ড্যাশবোর্ড",

        profile:
            "প্রোফাইল",

        changeEmail:
            "ইমেইল পরিবর্তন",

        changePassword:
            "পাসওয়ার্ড পরিবর্তন",

        weeklyRequest:
            "সাপ্তাহিক জমার রিকোয়েস্ট",

        weeklyDeposit:
            "সাপ্তাহিক জমা",

        weeklyHistory:
            "সাপ্তাহিক জমার হিস্টরি",

        createAdmin:
            "অ্যাডমিন তৈরি করুন",

        createMember:
            "সদস্য তৈরি করুন",

        accessMember:
            "সদস্য অ্যাকাউন্টে প্রবেশ",

        selectLanguage:
            "ভাষা নির্বাচন করুন",

        bangla:
            "বাংলা",

        english:
            "English",

        logout:
            "লগআউট",

        adminIdHeader:
            "অ্যাডমিন ID",

        title:
            "নতুন অ্যাডমিন তৈরি করুন",

        subtitle:
            "নতুন অ্যাডমিনের তথ্য যোগ করুন",

        adminInformation:
            "অ্যাডমিনের তথ্য",

        adminInformationDescription:
            "নতুন অ্যাডমিন অ্যাকাউন্টের তথ্য যোগ করুন",

        adminId:
            "অ্যাডমিন ID",

        adminIdPlaceholder:
            "যেমন: A002",

        adminName:
            "অ্যাডমিনের নাম",

        adminNamePlaceholder:
            "অ্যাডমিনের নাম লিখুন",

        phone:
            "মোবাইল নম্বর",

        phonePlaceholder:
            "01XXXXXXXXX",

        gmail:
            "জি-মেইল",

        gmailPlaceholder:
            "example@gmail.com",

        gmailInfo:
            "শুধুমাত্র @gmail.com ব্যবহার করুন।",

        password:
            "পাসওয়ার্ড",

        passwordPlaceholder:
            "কমপক্ষে ৬ অক্ষর",

        rePassword:
            "পুনরায় পাসওয়ার্ড",

        rePasswordPlaceholder:
            "পাসওয়ার্ড আবার লিখুন",

        createAdminButton:
            "অ্যাডমিন তৈরি করুন",

        creating:
            "অ্যাডমিন তৈরি হচ্ছে...",

        required:
            "তথ্য অসম্পূর্ণ",

        requiredMessage:
            "সবগুলো তথ্য পূরণ করুন",

        invalidEmail:
            "সঠিক Gmail দিন। Gmail অবশ্যই @gmail.com দিয়ে শেষ হতে হবে।",

        invalidPassword:
            "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।",

        passwordMismatch:
            "পাসওয়ার্ড এবং পুনরায় পাসওয়ার্ড মিলছে না।",

        invalidPhone:
            "সঠিক বাংলাদেশি মোবাইল নম্বর দিন। ১১ সংখ্যা, ০১ দিয়ে শুরু এবং ৩য় সংখ্যা ৩–৯ হতে হবে।",

        createError:
            "অ্যাডমিন তৈরি হয়নি",

        serverError:
            "অ্যাডমিন তৈরি করা যায়নি।",

        success:
            "সফল",

        successMessage:
            "অ্যাডমিন সফলভাবে তৈরি হয়েছে।",

        ok:
            "ঠিক আছে",

        error:
            "সমস্যা হয়েছে",

    },


    en: {

        appName:
            "Khudro Sanchoy",

        appSubtitle:
            "Cooperative Society",

        adminPanel:
            "Admin Panel",

        dashboard:
            "Dashboard",

        profile:
            "Profile",

        changeEmail:
            "Change Email",

        changePassword:
            "Change Password",

        weeklyRequest:
            "Weekly Deposit Requests",

        weeklyDeposit:
            "Weekly Deposit",

        weeklyHistory:
            "Weekly Deposit History",

        createAdmin:
            "Create Admin",

        createMember:
            "Create Member",

        accessMember:
            "Access Member Account",

        selectLanguage:
            "Select Language",

        bangla:
            "বাংলা",

        english:
            "English",

        logout:
            "Logout",

        adminIdHeader:
            "Admin ID",

        title:
            "Create New Admin",

        subtitle:
            "Add a new admin's information",

        adminInformation:
            "Admin Information",

        adminInformationDescription:
            "Add information for the new admin account",

        adminId:
            "Admin ID",

        adminIdPlaceholder:
            "Example: A002",

        adminName:
            "Admin Name",

        adminNamePlaceholder:
            "Enter admin name",

        phone:
            "Phone Number",

        phonePlaceholder:
            "01XXXXXXXXX",

        gmail:
            "Gmail",

        gmailPlaceholder:
            "example@gmail.com",

        gmailInfo:
            "Only @gmail.com addresses are allowed.",

        password:
            "Password",

        passwordPlaceholder:
            "Minimum 6 characters",

        rePassword:
            "Re-enter Password",

        rePasswordPlaceholder:
            "Enter password again",

        createAdminButton:
            "Create Admin",

        creating:
            "Creating Admin...",

        required:
            "Incomplete Information",

        requiredMessage:
            "Please fill in all fields.",

        invalidEmail:
            "Enter a valid Gmail address ending with @gmail.com.",

        invalidPassword:
            "Password must be at least 6 characters.",

        passwordMismatch:
            "Password and re-entered password do not match.",

        invalidPhone:
            "Enter a valid Bangladesh phone number. It must contain 11 digits, start with 01, and the 3rd digit must be 3–9.",

        createError:
            "Admin Not Created",

        serverError:
            "Admin could not be created.",

        success:
            "Success",

        successMessage:
            "Admin has been created successfully.",

        ok:
            "OK",

        error:
            "Something went wrong",

    },

};


/* ========================================================================== */
/* SCREEN                                                                     */
/* ========================================================================== */

export default function CreateAdminScreen() {

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


    const menuAnimating =
        useRef(false);


    const menuAnimationRef =
        useRef<Animated.CompositeAnimation | null>(null);


    const openMenu = () => {

        if (menuAnimating.current) {
            return;
        }


        menuAnimating.current = true;


        setMenuMounted(true);
        setMenuOpen(true);


        drawerTranslateX.setValue(-330);
        overlayOpacity.setValue(0);


        requestAnimationFrame(() => {

            menuAnimationRef.current =
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

                ]);


            menuAnimationRef.current.start(
                ({ finished }) => {

                    menuAnimationRef.current =
                        null;

                    if (finished) {
                        menuAnimating.current = false;
                    }

                }
            );

        });

    };


    const closeMenu = (
        callback?: () => void
    ) => {

        if (!menuMounted) {

            if (callback) {
                callback();
            }

            return;

        }


        if (
            menuAnimationRef.current
        ) {

            menuAnimationRef.current.stop();

            menuAnimationRef.current =
                null;

        }


        menuAnimating.current = true;


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

        ]).start(
            ({ finished }) => {

                if (!finished) {
                    return;
                }


                setMenuOpen(false);
                setMenuMounted(false);

                menuAnimating.current = false;


                if (callback) {
                    callback();
                }

            }
        );

    };


    /* ---------------------------------------------------------------------- */
    /* LANGUAGE                                                               */
    /* ---------------------------------------------------------------------- */

    const [
        language,
        setLanguage,
    ] = useState<AdminLanguage>("bn");


    const t =
        translations[language];


    /* ---------------------------------------------------------------------- */
    /* CURRENT ADMIN                                                          */
    /* ---------------------------------------------------------------------- */

    const currentAdmin =
        getCurrentAdmin();


    const [
        currentAdminName,
        setCurrentAdminName,
    ] = useState(
        currentAdmin?.adminName || "Admin"
    );


    const [
        currentAdminId,
        setCurrentAdminId,
    ] = useState(
        currentAdmin?.adminId || ""
    );


    /* ---------------------------------------------------------------------- */
    /* INPUT REFS                                                             */
    /* ---------------------------------------------------------------------- */

    const gmailInputRef =
        useRef<TextInput>(null);


    const passwordInputRef =
        useRef<TextInput>(null);


    const rePasswordInputRef =
        useRef<TextInput>(null);


    /* ---------------------------------------------------------------------- */
    /* FORM STATE                                                             */
    /* ---------------------------------------------------------------------- */

    const [
        adminId,
        setAdminId,
    ] = useState("");


    const [
        adminName,
        setAdminName,
    ] = useState("");


    const [
        phone,
        setPhone,
    ] = useState("");


    const [
        email,
        setEmail,
    ] = useState("");


    const [
        password,
        setPassword,
    ] = useState("");


    const [
        rePassword,
        setRePassword,
    ] = useState("");


    /* ---------------------------------------------------------------------- */
    /* UI STATE                                                               */
    /* ---------------------------------------------------------------------- */

    const [
        loading,
        setLoading,
    ] = useState(false);


    const [
        showPassword,
        setShowPassword,
    ] = useState(false);


    const [
        showRePassword,
        setShowRePassword,
    ] = useState(false);


    /* ====================================================================== */
    /* KEYBOARD / SMOOTH FORM SCROLL                                          */
    /* ====================================================================== */

    const scrollViewRef =
        useRef<ScrollView>(null);


    const scrollY =
        useRef(0);


    const keyboardHeight =
        useRef(0);


    const keyboardVisible =
        useRef(false);


    /* ---------------------------------------------------------------------- */
    /* KEYBOARD EVENTS                                                        */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {

        const keyboardWillShow =
            (event: any) => {

                keyboardVisible.current =
                    true;

                keyboardHeight.current =
                    event?.endCoordinates?.height || 0;


                /*
                 * iOS keyboard animation-এর সাথে
                 * React Native layout animation synchronize করে।
                 */

                if (Platform.OS === "ios") {

                    Keyboard.scheduleLayoutAnimation(
                        event
                    );

                }

            };


        const keyboardWillHide =
            (event: any) => {

                keyboardVisible.current =
                    false;

                keyboardHeight.current = 0;


                if (Platform.OS === "ios") {

                    Keyboard.scheduleLayoutAnimation(
                        event
                    );

                }

            };


        const keyboardDidShow =
            (event: any) => {

                keyboardVisible.current =
                    true;

                keyboardHeight.current =
                    event?.endCoordinates?.height || 0;

            };


        const keyboardDidHide =
            () => {

                keyboardVisible.current =
                    false;

                keyboardHeight.current = 0;

            };


        const subscriptions = [];


        if (Platform.OS === "ios") {

            subscriptions.push(
                Keyboard.addListener(
                    "keyboardWillShow",
                    keyboardWillShow
                )
            );


            subscriptions.push(
                Keyboard.addListener(
                    "keyboardWillHide",
                    keyboardWillHide
                )
            );

        } else {

            subscriptions.push(
                Keyboard.addListener(
                    "keyboardDidShow",
                    keyboardDidShow
                )
            );


            subscriptions.push(
                Keyboard.addListener(
                    "keyboardDidHide",
                    keyboardDidHide
                )
            );

        }


        return () => {

            subscriptions.forEach(
                subscription =>
                    subscription.remove()
            );

        };

    }, []);


    /* ---------------------------------------------------------------------- */
    /* SMOOTHLY SCROLL TO FOCUSED INPUT                                      */
    /* ---------------------------------------------------------------------- */

    const scrollToFocusedInput =
        (
            inputRef:
                React.RefObject<TextInput | null>
        ) => {

            /*
             * Keyboard পুরোপুরি উঠার জন্য
             * অল্প সময় অপেক্ষা করা হচ্ছে।
             */

            const delay =
                Platform.OS === "ios"
                    ? 80
                    : 180;


            setTimeout(() => {

                if (!inputRef.current) {
                    return;
                }


                inputRef.current.measureInWindow(
                    (
                        _x,
                        y,
                        _width,
                        height
                    ) => {

                        const screenHeight =
                            Dimensions.get(
                                "window"
                            ).height;


                        const currentKeyboardHeight =
                            keyboardHeight.current;


                        /*
                         * Keyboard-এর উপরে একটু
                         * comfortable space রাখা হচ্ছে।
                         */

                        const safeBottomSpace =
                            28;


                        const visibleBottom =
                            screenHeight -
                            currentKeyboardHeight -
                            safeBottomSpace;


                        const inputBottom =
                            y + height;


                        /*
                         * Input keyboard-এর নিচে চলে গেলে
                         * যতটুকু দরকার ততটুকুই scroll করবে।
                         */

                        if (
                            inputBottom >
                            visibleBottom
                        ) {

                            const requiredScroll =
                                inputBottom -
                                visibleBottom +
                                24;


                            const targetY =
                                Math.max(
                                    0,
                                    scrollY.current +
                                    requiredScroll
                                );


                            scrollViewRef.current?.scrollTo(
                                {
                                    y:
                                        targetY,

                                    animated:
                                        true,
                                }
                            );

                            return;

                        }


                        /*
                         * কোনো কোনো Android device-এ
                         * keyboard ওঠার পরে measure একটু
                         * late update হতে পারে।
                         *
                         * তাই keyboard visible থাকলে
                         * আরেকবার খুব ছোট delay দিয়ে check করা হয়।
                         */

                        if (
                            keyboardVisible.current &&
                            Platform.OS === "android"
                        ) {

                            setTimeout(() => {

                                if (!inputRef.current) {
                                    return;
                                }


                                inputRef.current.measureInWindow(
                                    (
                                        _x2,
                                        y2,
                                        _width2,
                                        height2
                                    ) => {

                                        const secondInputBottom =
                                            y2 +
                                            height2;


                                        const secondVisibleBottom =
                                            Dimensions.get(
                                                "window"
                                            ).height -
                                            keyboardHeight.current -
                                            safeBottomSpace;


                                        if (
                                            secondInputBottom >
                                            secondVisibleBottom
                                        ) {

                                            const secondScroll =
                                                secondInputBottom -
                                                secondVisibleBottom +
                                                24;


                                            scrollViewRef.current?.scrollTo(
                                                {
                                                    y:
                                                        Math.max(
                                                            0,
                                                            scrollY.current +
                                                            secondScroll
                                                        ),

                                                    animated:
                                                        true,
                                                }
                                            );

                                        }

                                    }
                                );

                            }, 120);

                        }

                    }
                );

            }, delay);

        };


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
                        "Create admin language error:",
                        error
                    );

                }

            };


        initialize();

    }, []);


    /* ====================================================================== */
    /* LOAD LATEST ADMIN PROFILE                                              */
    /* ====================================================================== */

    useFocusEffect(
        useCallback(() => {

            let isMounted = true;


            const loadLatestAdminProfile =
                async () => {

                    try {

                        const sessionAdmin =
                            getCurrentAdmin();


                        if (
                            !sessionAdmin?.adminId
                        ) {

                            return;

                        }


                        const result =
                            await getAdminProfile(
                                sessionAdmin.adminId
                            );


                        if (!isMounted) {
                            return;
                        }


                        if (!result.success) {
                            return;
                        }


                        const latestProfile =
                            result.profile;


                        setCurrentAdminName(
                            latestProfile.adminName ||
                            "Admin"
                        );


                        setCurrentAdminId(
                            latestProfile.adminId ||
                            sessionAdmin.adminId
                        );


                    } catch (error) {

                        console.error(
                            "Admin profile refresh error:",
                            error
                        );

                    }

                };


            loadLatestAdminProfile();


            return () => {

                isMounted = false;

            };

        }, [])
    );


    /* ====================================================================== */
    /* CLEANUP MENU ANIMATION                                                 */
    /* ====================================================================== */

    useEffect(() => {

        return () => {

            if (
                menuAnimationRef.current
            ) {

                menuAnimationRef.current.stop();

                menuAnimationRef.current =
                    null;

            }

        };

    }, []);


    /* ====================================================================== */
    /* CHANGE LANGUAGE                                                        */
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
                "Admin language save error:",
                error
            );

        }

    };


    /* ====================================================================== */
    /* MENU                                                                    */
    /* ====================================================================== */

    const handleMenuPress = (
        route?: string
    ) => {

        if (!route) {

            closeMenu();

            return;

        }


        closeMenu(() => {

            setTimeout(() => {

                router.push(
                    route as any
                );

            }, 10);

        });

    };


    /* ====================================================================== */
    /* LOGOUT                                                                  */
    /* ====================================================================== */

    const handleLogout = () => {

        closeMenu(() => {

            clearCurrentAdmin();

            router.replace(
                "/admin/login"
            );

        });

    };


    /* ====================================================================== */
    /* CREATE ADMIN                                                           */
    /* ====================================================================== */

    const handleCreateAdmin =
        async () => {

            /* ---------------------------------------------------------------- */
            /* REQUIRED FIELDS                                                  */
            /* ---------------------------------------------------------------- */

            if (

                !adminId.trim() ||

                !adminName.trim() ||

                !phone.trim() ||

                !email.trim() ||

                !password ||

                !rePassword

            ) {

                Alert.alert(

                    t.required,

                    t.requiredMessage

                );

                return;

            }


            /* ---------------------------------------------------------------- */
            /* GMAIL VALIDATION                                                 */
            /* ---------------------------------------------------------------- */

            const normalizedEmail =
                email
                    .trim()
                    .toLowerCase();


            const gmailRegex =
                /^[a-zA-Z0-9._%+-]+@gmail\.com$/;


            if (
                !gmailRegex.test(
                    normalizedEmail
                )
            ) {

                Alert.alert(
                    t.error,
                    t.invalidEmail
                );

                return;

            }


            /* ---------------------------------------------------------------- */
            /* PASSWORD VALIDATION                                              */
            /* ---------------------------------------------------------------- */

            if (
                password.length < 6
            ) {

                Alert.alert(
                    t.error,
                    t.invalidPassword
                );

                return;

            }


            /* ---------------------------------------------------------------- */
            /* PASSWORD MATCH                                                   */
            /* ---------------------------------------------------------------- */

            if (
                password !==
                rePassword
            ) {

                Alert.alert(
                    t.error,
                    t.passwordMismatch
                );

                return;

            }


            /* ---------------------------------------------------------------- */
            /* PHONE VALIDATION                                                  */
            /* ---------------------------------------------------------------- */

            const normalizedPhone =
                phone.trim();


            const phoneRegex =
                /^01[3-9]\d{8}$/;


            if (
                !phoneRegex.test(
                    normalizedPhone
                )
            ) {

                Alert.alert(
                    t.error,
                    t.invalidPhone
                );

                return;

            }


            /* ---------------------------------------------------------------- */
            /* CREATE ADMIN                                                      */
            /* ---------------------------------------------------------------- */

            try {

                setLoading(true);


                const result =
                    await createAdmin(

                        adminId.trim(),

                        adminName.trim(),

                        normalizedPhone,

                        normalizedEmail,

                        password,

                        rePassword

                    );


                if (
                    !result.success
                ) {

                    Alert.alert(

                        t.createError,

                        result.message ||
                        t.serverError

                    );

                    return;

                }


                /* ------------------------------------------------------------ */
                /* CLEAR FORM                                                    */
                /* ------------------------------------------------------------ */

                setAdminId("");
                setAdminName("");
                setPhone("");
                setEmail("");
                setPassword("");
                setRePassword("");

                setShowPassword(false);
                setShowRePassword(false);


                /* ------------------------------------------------------------ */
                /* SUCCESS                                                       */
                /* ------------------------------------------------------------ */

                Alert.alert(

                    t.success,

                    t.successMessage,

                    [

                        {

                            text:
                                t.ok,

                            onPress:
                                () => {

                                    router.replace(
                                        "/admin/dashboard"
                                    );

                                },

                        },

                    ]

                );


            } catch (error) {

                console.error(
                    "Create admin screen error:",
                    error
                );


                Alert.alert(
                    t.error,
                    t.serverError
                );


            } finally {

                setLoading(false);

            }

        };


    /* ====================================================================== */
    /* UI                                                                     */
    /* ====================================================================== */

    return (

        <SafeAreaView

            style={
                styles.safeArea
            }

            edges={[
                "top",
                "left",
                "right",
            ]}

        >

            <KeyboardAvoidingView

                style={
                    styles.keyboardView
                }

                behavior={
                    Platform.OS === "ios"
                        ? "padding"
                        : "height"
                }

                keyboardVerticalOffset={0}

            >

                <View
                    style={
                        styles.screen
                    }
                >

                    {/* ======================================================== */}
                    {/* HEADER                                                   */}
                    {/* ======================================================== */}

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
                                    styles.adminNameHeader
                                }

                                numberOfLines={1}

                            >
                                {currentAdminName}

                            </Text>


                            <Text
                                style={
                                    styles.adminIdHeader
                                }
                            >
                                {t.adminIdHeader}:{" "}
                                {currentAdminId}
                            </Text>

                        </View>

                    </View>


                    {/* ======================================================== */}
                    {/* CONTENT                                                   */}
                    {/* ======================================================== */}

                    <ScrollView

                        ref={scrollViewRef}

                        showsVerticalScrollIndicator={
                            false
                        }

                        keyboardShouldPersistTaps="handled"

                        keyboardDismissMode={
                            Platform.OS === "ios"
                                ? "interactive"
                                : "on-drag"
                        }

                        onScroll={(event) => {

                            scrollY.current =
                                event.nativeEvent.contentOffset.y;

                        }}

                        scrollEventThrottle={16}

                        contentContainerStyle={
                            styles.content
                        }

                    >

                        {/* ==================================================== */}
                        {/* INTRO CARD                                             */}
                        {/* ==================================================== */}

                        <View
                            style={
                                styles.introCard
                            }
                        >

                            <View
                                style={
                                    styles.introIcon
                                }
                            >

                                <Ionicons

                                    name="person-add-outline"

                                    size={29}

                                    color="#ffffff"

                                />

                            </View>


                            <Text
                                style={
                                    styles.introTitle
                                }
                            >
                                {t.adminInformation}
                            </Text>


                            <Text
                                style={
                                    styles.introDescription
                                }
                            >
                                {
                                    t.adminInformationDescription
                                }
                            </Text>

                        </View>


                        {/* ==================================================== */}
                        {/* FORM CARD                                             */}
                        {/* ==================================================== */}

                        <View
                            style={
                                styles.formCard
                            }
                        >

                            {/* ADMIN ID */}

                            <InputField

                                label={
                                    t.adminId
                                }

                                placeholder={
                                    t.adminIdPlaceholder
                                }

                                value={
                                    adminId
                                }

                                onChangeText={
                                    setAdminId
                                }

                                autoCapitalize="characters"

                                autoCorrect={false}

                            />


                            {/* ADMIN NAME */}

                            <InputField

                                label={
                                    t.adminName
                                }

                                placeholder={
                                    t.adminNamePlaceholder
                                }

                                value={
                                    adminName
                                }

                                onChangeText={
                                    setAdminName
                                }

                                autoCapitalize="words"

                            />


                            {/* PHONE */}

                            <InputField

                                label={
                                    t.phone
                                }

                                placeholder={
                                    t.phonePlaceholder
                                }

                                value={
                                    phone
                                }

                                onChangeText={(
                                    value
                                ) => {

                                    const cleaned =
                                        value.replace(
                                            /\D/g,
                                            ""
                                        );


                                    setPhone(
                                        cleaned.slice(
                                            0,
                                            11
                                        )
                                    );

                                }}

                                keyboardType="phone-pad"

                                maxLength={11}

                            />


                            {/* GMAIL */}

                            <InputField

                                inputRef={
                                    gmailInputRef
                                }

                                label={
                                    t.gmail
                                }

                                placeholder={
                                    t.gmailPlaceholder
                                }

                                value={
                                    email
                                }

                                onChangeText={
                                    setEmail
                                }

                                onFocus={() =>
                                    scrollToFocusedInput(
                                        gmailInputRef
                                    )
                                }

                                keyboardType="email-address"

                                autoCapitalize="none"

                                autoCorrect={false}

                            />


                            <Text
                                style={
                                    styles.helperText
                                }
                            >
                                {t.gmailInfo}
                            </Text>


                            {/* PASSWORD */}

                            <PasswordField

                                inputRef={
                                    passwordInputRef
                                }

                                label={
                                    t.password
                                }

                                placeholder={
                                    t.passwordPlaceholder
                                }

                                value={
                                    password
                                }

                                onChangeText={
                                    setPassword
                                }

                                visible={
                                    showPassword
                                }

                                onToggle={() =>
                                    setShowPassword(
                                        !showPassword
                                    )
                                }

                                onFocus={() =>
                                    scrollToFocusedInput(
                                        passwordInputRef
                                    )
                                }

                            />


                            {/* RE-PASSWORD */}

                            <PasswordField

                                inputRef={
                                    rePasswordInputRef
                                }

                                label={
                                    t.rePassword
                                }

                                placeholder={
                                    t.rePasswordPlaceholder
                                }

                                value={
                                    rePassword
                                }

                                onChangeText={
                                    setRePassword
                                }

                                visible={
                                    showRePassword
                                }

                                onToggle={() =>
                                    setShowRePassword(
                                        !showRePassword
                                    )
                                }

                                onFocus={() =>
                                    scrollToFocusedInput(
                                        rePasswordInputRef
                                    )
                                }

                            />


                            {/* CREATE BUTTON */}

                            <Pressable

                                onPress={
                                    handleCreateAdmin
                                }

                                disabled={
                                    loading
                                }

                                style={({ pressed }) => [

                                    styles.createButton,

                                    loading &&
                                    styles.createButtonDisabled,

                                    pressed &&
                                    !loading &&
                                    styles.createButtonPressed,

                                ]}

                            >

                                {loading ? (

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
                                                styles.createButtonText
                                            }
                                        >
                                            {t.creating}
                                        </Text>

                                    </View>

                                ) : (

                                    <View
                                        style={
                                            styles.buttonContent
                                        }
                                    >

                                        <Ionicons
                                            name="person-add-outline"
                                            size={19}
                                            color="#ffffff"
                                        />


                                        <Text
                                            style={
                                                styles.createButtonText
                                            }
                                        >
                                            {
                                                t.createAdminButton
                                            }
                                        </Text>

                                    </View>

                                )}

                            </Pressable>

                        </View>


                        <View
                            style={{
                                height: 30,
                            }}
                        />

                    </ScrollView>


                    {/* ======================================================== */}
                    {/* SIDE MENU                                                 */}
                    {/* ======================================================== */}

                    {menuMounted && (

                        <View
                            style={
                                styles.menuOverlay
                            }
                        >

                            {/* ------------------------------------------------ */}
                            {/* DARK OVERLAY                                       */}
                            {/* ------------------------------------------------ */}

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


                            {/* ------------------------------------------------ */}
                            {/* DRAWER                                             */}
                            {/* ------------------------------------------------ */}

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
                                        "bottom",
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

                                        <MenuItem

                                            icon="grid-outline"

                                            label={
                                                t.dashboard
                                            }

                                            onPress={() =>
                                                handleMenuPress(
                                                    "/admin/dashboard"
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
                                                    "/admin/profile"
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
                                                    "/admin/change-email"
                                                )
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
                                                    "/admin/change-password"
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
                                                    "/admin/weekly-request"
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
                                                    "/admin/weekly-deposit"
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
                                                    "/admin/weekly-deposit-history"
                                                )
                                            }

                                        />


                                        <MenuDivider />


                                        {/* CREATE ADMIN - ACTIVE */}

                                        <MenuItem

                                            icon="person-add-outline"

                                            label={
                                                t.createAdmin
                                            }

                                            active

                                            onPress={() =>
                                                closeMenu()
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
                                                    "/admin/create-member"
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
                                                    "/admin/access-member"
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
    >["name"];

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
                "transparent",
                "#0f172a",
            ],

        });


    const textColor =
        pressAnimation.interpolate({

            inputRange: [
                0,
                1,
            ],

            outputRange: [
                "#475569",
                "#ffffff",
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
                                ? "#0f172a"
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
                                ? "#ffffff"
                                : undefined
                        }

                    />


                    {!active && (

                        <Animated.View

                            style={{

                                position:
                                    "absolute",

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
                                    ? "#ffffff"
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
                            "bn"
                        )
                    }

                    style={
                        language === "bn"
                            ? styles.languageOptionActive
                            : styles.languageOption
                    }

                >

                    <Text

                        style={
                            language === "bn"
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
                            "en"
                        )
                    }

                    style={
                        language === "en"
                            ? styles.languageOptionActive
                            : styles.languageOption
                    }

                >

                    <Text

                        style={
                            language === "en"
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
/* INPUT FIELD                                                                */
/* ========================================================================== */

type InputFieldProps = {

    label: string;

    placeholder: string;

    value: string;

    onChangeText: (
        value: string
    ) => void;

    inputRef?:
        React.RefObject<TextInput | null>;

    onFocus?: () => void;

    keyboardType?:
    | "default"
    | "email-address"
    | "phone-pad";

    autoCapitalize?:
    | "none"
    | "sentences"
    | "words"
    | "characters";

    autoCorrect?: boolean;

    maxLength?: number;

};


function InputField({

    label,
    placeholder,
    value,
    onChangeText,
    inputRef,
    onFocus,
    keyboardType = "default",
    autoCapitalize = "sentences",
    autoCorrect = true,
    maxLength,

}: InputFieldProps) {

    return (

        <View
            style={
                styles.field
            }
        >

            <Text
                style={
                    styles.label
                }
            >
                {label}
            </Text>


            <TextInput

                ref={
                    inputRef
                }

                style={
                    styles.input
                }

                placeholder={
                    placeholder
                }

                placeholderTextColor="#94a3b8"

                value={
                    value
                }

                onChangeText={
                    onChangeText
                }

                onFocus={
                    onFocus
                }

                keyboardType={
                    keyboardType
                }

                autoCapitalize={
                    autoCapitalize
                }

                autoCorrect={
                    autoCorrect
                }

                maxLength={
                    maxLength
                }

                returnKeyType="next"

            />

        </View>

    );

}


/* ========================================================================== */
/* PASSWORD FIELD                                                             */
/* ========================================================================== */

type PasswordFieldProps = {

    label: string;

    placeholder: string;

    value: string;

    onChangeText: (
        value: string
    ) => void;

    visible: boolean;

    onToggle: () => void;

    inputRef?:
        React.RefObject<TextInput | null>;

    onFocus?: () => void;

};


function PasswordField({

    label,
    placeholder,
    value,
    onChangeText,
    visible,
    onToggle,
    inputRef,
    onFocus,

}: PasswordFieldProps) {

    return (

        <View
            style={
                styles.field
            }
        >

            <Text
                style={
                    styles.label
                }
            >
                {label}
            </Text>


            <View
                style={
                    styles.passwordContainer
                }
            >

                <TextInput

                    ref={
                        inputRef
                    }

                    style={
                        styles.passwordInput
                    }

                    placeholder={
                        placeholder
                    }

                    placeholderTextColor="#94a3b8"

                    value={
                        value
                    }

                    onChangeText={
                        onChangeText
                    }

                    onFocus={
                        onFocus
                    }

                    secureTextEntry={
                        !visible
                    }

                    autoCapitalize="none"

                    autoCorrect={false}

                    returnKeyType="next"

                />


                <Pressable

                    onPress={
                        onToggle
                    }

                    style={
                        styles.eyeButton
                    }

                    hitSlop={6}

                >

                    <Ionicons

                        name={
                            visible
                                ? "eye-off-outline"
                                : "eye-outline"
                        }

                        size={21}

                        color="#64748b"

                    />

                </Pressable>

            </View>

        </View>

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
                "#f6f8fb",
        },

        keyboardView: {
            flex: 1,
        },

        screen: {
            flex: 1,
            backgroundColor:
                "#f6f8fb",
        },


        /* ---------------------------------------------------------------------- */
        /* HEADER                                                                 */
        /* ---------------------------------------------------------------------- */

        header: {
            minHeight: 76,
            paddingHorizontal: 18,
            paddingVertical: 12,
            backgroundColor:
                "#ffffff",
            borderBottomWidth: 1,
            borderBottomColor:
                "#e2e8f0",
            flexDirection:
                "row",
            alignItems:
                "center",
            justifyContent:
                "space-between",
        },

        headerLeft: {
            flexDirection:
                "row",
            alignItems:
                "center",
            flex: 1,
        },

        menuButton: {
            width: 42,
            height: 42,
            borderRadius: 11,
            backgroundColor:
                "#f1f5f9",
            alignItems:
                "center",
            justifyContent:
                "center",
            marginRight: 11,
        },

        menuButtonPressed: {
            opacity: 0.65,
        },

        appName: {
            fontSize: 16,
            fontWeight:
                "800",
            color:
                "#0f172a",
        },

        appSubtitle: {
            marginTop: 2,
            fontSize: 9,
            color:
                "#64748b",
        },

        adminInfo: {
            maxWidth: 145,
            alignItems:
                "flex-end",
        },

        adminNameHeader: {
            fontSize: 13,
            fontWeight:
                "800",
            color:
                "#0f172a",
        },

        adminIdHeader: {
            marginTop: 2,
            fontSize: 10,
            color:
                "#64748b",
        },


        /* ---------------------------------------------------------------------- */
        /* CONTENT                                                                */
        /* ---------------------------------------------------------------------- */

        content: {
            paddingHorizontal: 18,
            paddingTop: 20,
            paddingBottom: 30,
        },


        /* ---------------------------------------------------------------------- */
        /* INTRO                                                                  */
        /* ---------------------------------------------------------------------- */

        introCard: {
            paddingVertical: 24,
            paddingHorizontal: 18,
            borderRadius: 17,
            backgroundColor:
                "#0f172a",
            alignItems:
                "center",
            justifyContent:
                "center",
        },

        introIcon: {
            width: 56,
            height: 56,
            borderRadius: 17,
            backgroundColor:
                "#1e293b",
            alignItems:
                "center",
            justifyContent:
                "center",
            marginBottom: 12,
        },

        introTitle: {
            color:
                "#ffffff",
            fontSize: 17,
            fontWeight:
                "800",
            textAlign:
                "center",
        },

        introDescription: {
            marginTop: 5,
            color:
                "#94a3b8",
            fontSize: 10,
            textAlign:
                "center",
        },


        /* ---------------------------------------------------------------------- */
        /* FORM                                                                   */
        /* ---------------------------------------------------------------------- */

        formCard: {
            marginTop: 14,
            padding: 18,
            borderRadius: 17,
            borderWidth: 1,
            borderColor:
                "#e2e8f0",
            backgroundColor:
                "#ffffff",
        },

        field: {
            marginBottom: 16,
        },

        label: {
            marginBottom: 7,
            fontSize: 11,
            fontWeight:
                "700",
            color:
                "#475569",
        },

        input: {
            minHeight: 50,
            paddingHorizontal: 13,
            borderWidth: 1,
            borderColor:
                "#cbd5e1",
            borderRadius: 11,
            backgroundColor:
                "#f8fafc",
            fontSize: 15,
            color:
                "#0f172a",
        },

        helperText: {
            marginTop: -10,
            marginBottom: 16,
            fontSize: 10,
            lineHeight: 15,
            color:
                "#94a3b8",
        },

        passwordContainer: {
            minHeight: 50,
            borderRadius: 11,
            backgroundColor:
                "#f8fafc",
            borderWidth: 1,
            borderColor:
                "#cbd5e1",
            flexDirection:
                "row",
            alignItems:
                "center",
        },

        passwordInput: {
            flex: 1,
            minHeight: 50,
            paddingHorizontal: 13,
            fontSize: 15,
            color:
                "#0f172a",
        },

        eyeButton: {
            width: 48,
            height: 50,
            alignItems:
                "center",
            justifyContent:
                "center",
        },


        /* ---------------------------------------------------------------------- */
        /* CREATE BUTTON                                                          */
        /* ---------------------------------------------------------------------- */

        createButton: {
            minHeight: 50,
            marginTop: 4,
            borderRadius: 11,
            backgroundColor:
                "#0f172a",
            alignItems:
                "center",
            justifyContent:
                "center",
        },

        createButtonDisabled: {
            opacity: 0.6,
        },

        createButtonPressed: {
            opacity: 0.85,
        },

        buttonContent: {
            flexDirection:
                "row",
            alignItems:
                "center",
            justifyContent:
                "center",
            gap: 9,
        },

        buttonLoading: {
            flexDirection:
                "row",
            alignItems:
                "center",
            justifyContent:
                "center",
            gap: 9,
        },

        createButtonText: {
            color:
                "#ffffff",
            fontSize: 12,
            fontWeight:
                "800",
        },


        /* ---------------------------------------------------------------------- */
        /* SIDE MENU                                                              */
        /* ---------------------------------------------------------------------- */

        menuOverlay: {
            position:
                "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            elevation: 1000,
        },

        overlayContainer: {
            position:
                "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
        },

        overlayBackground: {
            flex: 1,
            backgroundColor:
                "rgba(15, 23, 42, 0.42)",
        },

        drawerAnimated: {
            position:
                "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: 315,
            maxWidth: "86%",
            zIndex: 1001,
            elevation: 1001,
        },

        drawer: {
            flex: 1,
            backgroundColor:
                "#ffffff",
            shadowColor:
                "#000000",
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

        drawerHeader: {
            height: 76,
            paddingHorizontal: 17,
            borderBottomWidth: 1,
            borderBottomColor:
                "#e2e8f0",
            flexDirection:
                "row",
            alignItems:
                "center",
            justifyContent:
                "space-between",
        },

        drawerBrand: {
            flexDirection:
                "row",
            alignItems:
                "center",
        },

        drawerLogo: {
            width: 43,
            height: 43,
            borderRadius: 12,
            backgroundColor:
                "#0f172a",
            alignItems:
                "center",
            justifyContent:
                "center",
            marginRight: 10,
        },

        drawerLogoText: {
            color:
                "#ffffff",
            fontSize: 21,
            fontWeight:
                "800",
        },

        drawerAppName: {
            fontSize: 14,
            fontWeight:
                "800",
            color:
                "#0f172a",
        },

        drawerSubtitle: {
            marginTop: 2,
            fontSize: 10,
            color:
                "#64748b",
        },

        closeButton: {
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor:
                "#f1f5f9",
            alignItems:
                "center",
            justifyContent:
                "center",
        },

        closeButtonPressed: {
            opacity: 0.6,
        },

        menuScroll: {
            paddingHorizontal: 11,
            paddingTop: 10,
            paddingBottom: 20,
        },

        menuItemPressable: {
            borderRadius: 10,
            marginBottom: 3,
        },

        menuItem: {
            minHeight: 46,
            borderRadius: 10,
            paddingHorizontal: 12,
            flexDirection:
                "row",
            alignItems:
                "center",
        },

        menuItemText: {
            marginLeft: 12,
            fontSize: 12,
            fontWeight:
                "700",
            flex: 1,
        },

        menuDivider: {
            height: 1,
            backgroundColor:
                "#e2e8f0",
            marginVertical: 10,
            marginHorizontal: 7,
        },


        /* ---------------------------------------------------------------------- */
        /* LANGUAGE                                                               */
        /* ---------------------------------------------------------------------- */

        languageMenu: {
            minHeight: 55,
            paddingHorizontal: 12,
            flexDirection:
                "row",
            alignItems:
                "center",
            justifyContent:
                "space-between",
        },

        menuItemLeft: {
            flexDirection:
                "row",
            alignItems:
                "center",
            flex: 1,
        },

        languageOptions: {
            flexDirection:
                "row",
            padding: 3,
            borderRadius: 9,
            backgroundColor:
                "#f1f5f9",
        },

        languageOption: {
            paddingHorizontal: 8,
            paddingVertical: 6,
            borderRadius: 7,
        },

        languageOptionActive: {
            paddingHorizontal: 8,
            paddingVertical: 6,
            borderRadius: 7,
            backgroundColor:
                "#0f172a",
        },

        languageOptionText: {
            fontSize: 9,
            fontWeight:
                "800",
            color:
                "#64748b",
        },

        languageOptionActiveText: {
            fontSize: 9,
            fontWeight:
                "800",
            color:
                "#ffffff",
        },


        /* ---------------------------------------------------------------------- */
        /* LOGOUT                                                                 */
        /* ---------------------------------------------------------------------- */

        logoutButton: {
            minHeight: 46,
            borderRadius: 10,
            paddingHorizontal: 12,
            flexDirection:
                "row",
            alignItems:
                "center",
            backgroundColor:
                "#fef2f2",
        },

        logoutButtonPressed: {
            opacity: 0.65,
        },

        logoutText: {
            marginLeft: 12,
            fontSize: 12,
            fontWeight:
                "800",
            color:
                "#dc2626",
        },

    });