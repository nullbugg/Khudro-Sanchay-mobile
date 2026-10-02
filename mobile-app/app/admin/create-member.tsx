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
    createMember,
    getAdminProfile,
    getCurrentAdmin,
    clearCurrentAdmin,
} from "../../lib/admin-api";


/* ========================================================================== */
/* CONSTANTS                                                                  */
/* ========================================================================== */

const WEEKLY_RATE_PER_SHARE = 50;

const DEFAULT_JOIN_DATE =
    "24-04-2026";

const MAX_SHARES = 15;


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

        adminId:
            "অ্যাডমিন ID",

        title:
            "নতুন সদস্য তৈরি করুন",

        subtitle:
            "নতুন সদস্যের তথ্য যোগ করুন",

        memberInformation:
            "সদস্যের তথ্য",

        memberId:
            "সদস্য আইডি",

        memberIdPlaceholder:
            "যেমন: M001",

        memberName:
            "সদস্যের নাম",

        memberNamePlaceholder:
            "সদস্যের নাম লিখুন",

        phone:
            "মোবাইল নম্বর",

        phonePlaceholder:
            "01XXXXXXXXX",

        shareCount:
            "শেয়ার সংখ্যা",

        sharePlaceholder:
            "1 - 15",

        joinDate:
            "যোগদানের তারিখ",

        joinDatePlaceholder:
            "DD-MM-YYYY",

        weeklyAmount:
            "সাপ্তাহিক জমা",

        perShare:
            "প্রতি শেয়ার",

        calculation:
            "হিসাব",

        calculationText:
            "শেয়ার সংখ্যা × ৳৫০",

        joinDateInfo:
            "এই তারিখ থেকেই সদস্যের সঞ্চয়ের হিসাব শুরু হবে।",

        createMemberButton:
            "সদস্য তৈরি করুন",

        creating:
            "সদস্য তৈরি হচ্ছে...",

        required:
            "প্রয়োজনীয় তথ্য",

        memberIdRequired:
            "সদস্য আইডি দিন।",

        memberNameRequired:
            "সদস্যের নাম দিন।",

        phoneRequired:
            "মোবাইল নম্বর দিন।",

        invalidPhone:
            "সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন। নম্বরটি ০১ দিয়ে শুরু হবে এবং ৩য় সংখ্যা ৩ থেকে ৯ এর মধ্যে হতে হবে।",

        joinDateRequired:
            "যোগদানের তারিখ দিন।",

        invalidShare:
            "শেয়ার সংখ্যা ১ থেকে ১৫ এর মধ্যে হতে হবে।",

        invalidDate:
            "সঠিক তারিখ দিন। উদাহরণ: 24-04-2026",

        successTitle:
            "সফল",

        successMessage:
            "সদস্য সফলভাবে তৈরি হয়েছে।",

        error:
            "সমস্যা হয়েছে",

        ok:
            "ঠিক আছে",

        duplicateMember:
            "এই সদস্য আইডি ইতিমধ্যে রয়েছে।",

        serverError:
            "সদস্য তৈরি করা যায়নি.",

    },


    en: {

        appName:
            "ক্ষুদ্র সঞ্চয়",

        appSubtitle:
            "সমবায় সমিতি",

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

        adminId:
            "Admin ID",

        title:
            "Create New Member",

        subtitle:
            "Add a new member to the system",

        memberInformation:
            "Member Information",

        memberId:
            "Member ID",

        memberIdPlaceholder:
            "Example: M001",

        memberName:
            "Member Name",

        memberNamePlaceholder:
            "Enter member name",

        phone:
            "Phone Number",

        phonePlaceholder:
            "01XXXXXXXXX",

        shareCount:
            "Share Count",

        sharePlaceholder:
            "1 - 15",

        joinDate:
            "Join Date",

        joinDatePlaceholder:
            "DD-MM-YYYY",

        weeklyAmount:
            "Weekly Deposit",

        perShare:
            "Per Share",

        calculation:
            "Calculation",

        calculationText:
            "Share Count × ৳50",

        joinDateInfo:
            "The member's savings calculation will start from this date.",

        createMemberButton:
            "Create Member",

        creating:
            "Creating Member...",

        required:
            "Required Information",

        memberIdRequired:
            "Enter member ID.",

        memberNameRequired:
            "Enter member name.",

        phoneRequired:
            "Enter phone number.",

        invalidPhone:
            "Enter a valid 11-digit phone number. It must start with 01 and the 3rd digit must be between 3 and 9.",

        joinDateRequired:
            "Enter join date.",

        invalidShare:
            "Share count must be between 1 and 15.",

        invalidDate:
            "Enter a valid date. Example: 24-04-2026",

        successTitle:
            "Success",

        successMessage:
            "Member has been created successfully.",

        error:
            "Something went wrong",

        ok:
            "OK",

        duplicateMember:
            "This member ID already exists.",

        serverError:
            "Member could not be created.",

    },

};


/* ========================================================================== */
/* SCREEN                                                                     */
/* ========================================================================== */

export default function CreateMemberScreen() {

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


    const openMenu = () => {

        if (menuAnimating.current) {
            return;
        }


        drawerTranslateX.stopAnimation();
        overlayOpacity.stopAnimation();

        menuAnimating.current = true;

        setMenuMounted(true);
        setMenuOpen(true);


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

            ]).start(() => {

                menuAnimating.current = false;

            });

        });

    };


    const closeMenu = (
        callback?: () => void
    ) => {

        drawerTranslateX.stopAnimation();
        overlayOpacity.stopAnimation();


        if (!menuMounted) {

            setMenuOpen(false);
            setMenuMounted(false);

            if (
                typeof callback === "function"
            ) {

                callback();

            }

            return;

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

        ]).start(() => {

            setMenuOpen(false);
            setMenuMounted(false);

            menuAnimating.current = false;


            if (
                typeof callback === "function"
            ) {

                callback();

            }

        });

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
    /* ADMIN                                                                  */
    /* ---------------------------------------------------------------------- */

    const currentAdmin =
        getCurrentAdmin();


    const [
        adminName,
        setAdminName,
    ] = useState(
        currentAdmin?.adminName || "Admin"
    );


    const [
        adminId,
        setAdminId,
    ] = useState(
        currentAdmin?.adminId || ""
    );


    /* ---------------------------------------------------------------------- */
    /* FORM STATE                                                             */
    /* ---------------------------------------------------------------------- */

    const [
        memberId,
        setMemberId,
    ] = useState("");


    const [
        memberName,
        setMemberName,
    ] = useState("");


    const [
        phone,
        setPhone,
    ] = useState("");


    const [
        shareCount,
        setShareCount,
    ] = useState("");


    const [
        joinDate,
        setJoinDate,
    ] = useState(
        DEFAULT_JOIN_DATE
    );


    /* ---------------------------------------------------------------------- */
    /* UI STATE                                                               */
    /* ---------------------------------------------------------------------- */

    const [
        creating,
        setCreating,
    ] = useState(false);


    /* ---------------------------------------------------------------------- */
    /* KEYBOARD / INPUT REFS                                                  */
    /* ---------------------------------------------------------------------- */

    const scrollViewRef =
        useRef<ScrollView>(null);


    const scrollOffsetY =
        useRef(0);


    const keyboardHeight =
        useRef(0);


    const memberIdInputRef =
        useRef<TextInput>(null);


    const memberNameInputRef =
        useRef<TextInput>(null);


    const phoneInputRef =
        useRef<TextInput>(null);


    const shareCountInputRef =
        useRef<TextInput>(null);


    const joinDateInputRef =
        useRef<TextInput>(null);


    /* ====================================================================== */
    /* KEYBOARD LISTENERS                                                     */
    /* ====================================================================== */

    useEffect(() => {

        const showEvent =
            Platform.OS === "ios"
                ? "keyboardWillShow"
                : "keyboardDidShow";


        const hideEvent =
            Platform.OS === "ios"
                ? "keyboardWillHide"
                : "keyboardDidHide";


        const keyboardShowSubscription =
            Keyboard.addListener(
                showEvent,
                (event) => {

                    keyboardHeight.current =
                        event.endCoordinates?.height || 0;


                    if (
                        Platform.OS === "ios"
                    ) {

                        Keyboard.scheduleLayoutAnimation(
                            event
                        );

                    }

                }
            );


        const keyboardHideSubscription =
            Keyboard.addListener(
                hideEvent,
                (event) => {

                    keyboardHeight.current = 0;


                    if (
                        Platform.OS === "ios"
                    ) {

                        Keyboard.scheduleLayoutAnimation(
                            event
                        );

                    }

                }
            );


        return () => {

            keyboardShowSubscription.remove();

            keyboardHideSubscription.remove();

        };

    }, []);


    /* ====================================================================== */
    /* SMOOTH INPUT AUTO SCROLL                                               */
    /* ====================================================================== */

    const scrollToFocusedInput = useCallback(
        (
            inputRef: React.RefObject<TextInput | null>
        ) => {

            const performScroll =
                (
                    attempt: number
                ) => {

                    const input =
                        inputRef.current;


                    const scrollView =
                        scrollViewRef.current;


                    if (
                        !input ||
                        !scrollView
                    ) {

                        return;

                    }


                    input.measureInWindow(
                        (
                            _x,
                            y,
                            _width,
                            height
                        ) => {

                            const screenHeight =
                                Dimensions.get(
                                    "screen"
                                ).height;


                            const currentKeyboardHeight =
                                keyboardHeight.current;


                            const visibleBottom =
                                screenHeight -
                                currentKeyboardHeight -
                                28;


                            const inputTop =
                                y;


                            const inputBottom =
                                y + height;


                            let scrollDistance =
                                0;


                            if (
                                inputBottom >
                                visibleBottom
                            ) {

                                scrollDistance =
                                    inputBottom -
                                    visibleBottom +
                                    18;

                            }

                            else if (
                                inputTop < 95
                            ) {

                                scrollDistance =
                                    inputTop -
                                    95;

                            }


                            if (
                                Math.abs(
                                    scrollDistance
                                ) > 2
                            ) {

                                const targetY =
                                    Math.max(
                                        0,
                                        scrollOffsetY.current +
                                        scrollDistance
                                    );


                                scrollView.scrollTo({

                                    y:
                                        targetY,

                                    animated:
                                        true,

                                });

                            }


                            if (
                                attempt < 3 &&
                                currentKeyboardHeight === 0
                            ) {

                                setTimeout(
                                    () => {

                                        performScroll(
                                            attempt + 1
                                        );

                                    },
                                    90
                                );

                            }

                        }
                    );

                };


            setTimeout(
                () => {

                    performScroll(0);

                },
                Platform.OS === "ios"
                    ? 60
                    : 130
            );

        },
        []
    );


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
                        "Create member language error:",
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


                        setAdminName(
                            latestProfile.adminName ||
                            "Admin"
                        );


                        setAdminId(
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

            try {

                clearCurrentAdmin();

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }


            router.replace(
                "/admin/login"
            );

        });

    };


    /* ====================================================================== */
    /* WEEKLY AMOUNT                                                          */
    /* ====================================================================== */

    const numericShareCount =
        Number(
            shareCount
        );


    const weeklyAmount =
        Number.isInteger(
            numericShareCount
        ) &&
            numericShareCount >= 1 &&
            numericShareCount <= MAX_SHARES
            ? numericShareCount *
            WEEKLY_RATE_PER_SHARE
            : 0;


    /* ====================================================================== */
    /* DATE VALIDATION                                                        */
    /* ====================================================================== */

    function isValidDate(
        value: string
    ): boolean {

        const match =
            value.match(
                /^(\d{2})-(\d{2})-(\d{4})$/
            );


        if (!match) {
            return false;
        }


        const day =
            Number(
                match[1]
            );


        const month =
            Number(
                match[2]
            );


        const year =
            Number(
                match[3]
            );


        if (
            month < 1 ||
            month > 12
        ) {

            return false;

        }


        if (
            day < 1 ||
            day > 31
        ) {

            return false;

        }


        const date =
            new Date(
                year,
                month - 1,
                day
            );


        return (
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day
        );

    }


    /* ====================================================================== */
    /* PHONE VALIDATION                                                       */
    /* ====================================================================== */

    function isValidPhone(
        value: string
    ): boolean {

        return /^01[3-9]\d{8}$/.test(
            value
        );

    }


    /* ====================================================================== */
    /* CREATE MEMBER                                                          */
    /* ====================================================================== */

    async function handleCreateMember() {

        if (
            !memberId.trim()
        ) {

            Alert.alert(
                t.required,
                t.memberIdRequired
            );

            return;

        }


        if (
            !memberName.trim()
        ) {

            Alert.alert(
                t.required,
                t.memberNameRequired
            );

            return;

        }


        if (
            !phone.trim()
        ) {

            Alert.alert(
                t.required,
                t.phoneRequired
            );

            return;

        }


        if (
            !isValidPhone(
                phone.trim()
            )
        ) {

            Alert.alert(
                t.error,
                t.invalidPhone
            );

            return;

        }


        const shares =
            Number(
                shareCount
            );


        if (
            !Number.isInteger(
                shares
            ) ||
            shares < 1 ||
            shares > MAX_SHARES
        ) {

            Alert.alert(
                t.error,
                t.invalidShare
            );

            return;

        }


        if (
            !joinDate.trim()
        ) {

            Alert.alert(
                t.required,
                t.joinDateRequired
            );

            return;

        }


        if (
            !isValidDate(
                joinDate.trim()
            )
        ) {

            Alert.alert(
                t.error,
                t.invalidDate
            );

            return;

        }


        try {

            setCreating(true);


            const result =
                await createMember(

                    memberId.trim(),

                    memberName.trim(),

                    phone.trim(),

                    joinDate.trim(),

                    shares

                );


            console.log(
                "Create member result:",
                result
            );


            if (
                !result.success
            ) {

                let message =
                    result.message ||
                    t.serverError;


                if (
                    message.includes(
                        "ইতিমধ্যে"
                    ) ||
                    message
                        .toLowerCase()
                        .includes(
                            "already exists"
                        )
                ) {

                    message =
                        t.duplicateMember;

                }


                Alert.alert(
                    t.error,
                    message
                );


                return;

            }


            setMemberId("");

            setMemberName("");

            setPhone("");

            setShareCount("");

            setJoinDate(
                DEFAULT_JOIN_DATE
            );


            Alert.alert(

                t.successTitle,

                t.successMessage,

                [

                    {

                        text:
                            t.ok,

                        onPress: () => {

                            router.replace(
                                "/admin/dashboard"
                            );

                        },

                    },

                ]

            );


        } catch (error) {

            console.error(
                "Create member error:",
                error
            );


            Alert.alert(
                t.error,
                t.serverError
            );


        } finally {

            setCreating(false);

        }

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
            >

                <View
                    style={
                        styles.screen
                    }
                >

                    {/* ============================================================ */}
                    {/* DASHBOARD STYLE HEADER                                       */}
                    {/* ============================================================ */}

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


                    {/* ============================================================ */}
                    {/* CONTENT                                                      */}
                    {/* ============================================================ */}

                    <ScrollView

                        ref={
                            scrollViewRef
                        }

                        onScroll={(event) => {

                            scrollOffsetY.current =
                                event.nativeEvent.contentOffset.y;

                        }}

                        scrollEventThrottle={
                            16
                        }

                        showsVerticalScrollIndicator={
                            false
                        }

                        keyboardShouldPersistTaps="handled"

                        keyboardDismissMode={
                            Platform.OS === "ios"
                                ? "interactive"
                                : "on-drag"
                        }

                        contentContainerStyle={
                            styles.content
                        }

                    >

                        {/* ======================================================== */}
                        {/* INTRO CARD                                               */}
                        {/* ======================================================== */}

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

                                <Text
                                    style={
                                        styles.introIconText
                                    }
                                >
                                    +
                                </Text>

                            </View>


                            <Text
                                style={
                                    styles.introTitle
                                }
                            >
                                {t.memberInformation}
                            </Text>


                            <Text
                                style={
                                    styles.introDescription
                                }
                            >
                                {t.subtitle}
                            </Text>

                        </View>


                        {/* ======================================================== */}
                        {/* FORM CARD                                                 */}
                        {/* ======================================================== */}

                        <View
                            style={
                                styles.formCard
                            }
                        >

                            {/* MEMBER ID */}

                            <Text
                                style={
                                    styles.label
                                }
                            >
                                {t.memberId}
                            </Text>


                            <TextInput

                                ref={
                                    memberIdInputRef
                                }

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

                                autoCapitalize="characters"

                                autoCorrect={false}

                                returnKeyType="next"

                                onFocus={() =>
                                    scrollToFocusedInput(
                                        memberIdInputRef
                                    )
                                }

                                style={
                                    styles.input
                                }

                            />


                            {/* MEMBER NAME */}

                            <Text
                                style={
                                    styles.label
                                }
                            >
                                {t.memberName}
                            </Text>


                            <TextInput

                                ref={
                                    memberNameInputRef
                                }

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

                                autoCapitalize="words"

                                autoCorrect={false}

                                returnKeyType="next"

                                onFocus={() =>
                                    scrollToFocusedInput(
                                        memberNameInputRef
                                    )
                                }

                                style={
                                    styles.input
                                }

                            />


                            {/* PHONE */}

                            <Text
                                style={
                                    styles.label
                                }
                            >
                                {t.phone}
                            </Text>


                            <TextInput

                                ref={
                                    phoneInputRef
                                }

                                value={
                                    phone
                                }

                                onChangeText={(
                                    value
                                ) => {

                                    let digits =
                                        value.replace(
                                            /\D/g,
                                            ""
                                        ).slice(
                                            0,
                                            11
                                        );


                                    /* First digit must be 0 */

                                    if (
                                        digits.length >= 1 &&
                                        digits[0] !== "0"
                                    ) {

                                        digits = "";

                                    }


                                    /* Second digit must be 1 */

                                    if (
                                        digits.length >= 2 &&
                                        digits[1] !== "1"
                                    ) {

                                        digits =
                                            digits.slice(
                                                0,
                                                1
                                            );

                                    }


                                    /* Third digit must be 3-9 */

                                    if (
                                        digits.length >= 3 &&
                                        !/[3-9]/.test(
                                            digits[2]
                                        )
                                    ) {

                                        digits =
                                            digits.slice(
                                                0,
                                                2
                                            );

                                    }


                                    setPhone(
                                        digits
                                    );

                                }}

                                placeholder={
                                    t.phonePlaceholder
                                }

                                placeholderTextColor="#94a3b8"

                                keyboardType="phone-pad"

                                maxLength={11}

                                returnKeyType="next"

                                onFocus={() =>
                                    scrollToFocusedInput(
                                        phoneInputRef
                                    )
                                }

                                style={
                                    styles.input
                                }

                            />


                            {/* SHARE COUNT */}

                            <Text
                                style={
                                    styles.label
                                }
                            >
                                {t.shareCount}
                            </Text>


                            <TextInput

                                ref={
                                    shareCountInputRef
                                }

                                value={
                                    shareCount
                                }

                                onChangeText={(
                                    value
                                ) => {

                                    const cleaned =
                                        value.replace(
                                            /\D/g,
                                            ""
                                        ).slice(
                                            0,
                                            2
                                        );


                                    setShareCount(
                                        cleaned
                                    );

                                }}

                                placeholder={
                                    t.sharePlaceholder
                                }

                                placeholderTextColor="#94a3b8"

                                keyboardType="number-pad"

                                maxLength={2}

                                returnKeyType="next"

                                onFocus={() =>
                                    scrollToFocusedInput(
                                        shareCountInputRef
                                    )
                                }

                                style={
                                    styles.input
                                }

                            />


                            {/* JOIN DATE */}

                            <Text
                                style={
                                    styles.label
                                }
                            >
                                {t.joinDate}
                            </Text>


                            <TextInput

                                ref={
                                    joinDateInputRef
                                }

                                value={
                                    joinDate
                                }

                                onChangeText={
                                    setJoinDate
                                }

                                placeholder={
                                    t.joinDatePlaceholder
                                }

                                placeholderTextColor="#94a3b8"

                                keyboardType="numbers-and-punctuation"

                                maxLength={10}

                                returnKeyType="done"

                                onFocus={() =>
                                    scrollToFocusedInput(
                                        joinDateInputRef
                                    )
                                }

                                style={
                                    styles.input
                                }

                            />


                            {/* JOIN DATE INFO */}

                            <Text
                                style={
                                    styles.dateInfo
                                }
                            >
                                {t.joinDateInfo}
                            </Text>


                            {/* WEEKLY CARD */}

                            <View
                                style={
                                    styles.weeklyCard
                                }
                            >

                                <View
                                    style={
                                        styles.weeklyHeader
                                    }
                                >

                                    <Text
                                        style={
                                            styles.weeklyTitle
                                        }
                                    >
                                        {t.weeklyAmount}
                                    </Text>


                                    <Text
                                        style={
                                            styles.weeklyAmount
                                        }
                                    >
                                        ৳{weeklyAmount}
                                    </Text>

                                </View>


                                <View
                                    style={
                                        styles.divider
                                    }
                                />


                                <View
                                    style={
                                        styles.calculationRow
                                    }
                                >

                                    <Text
                                        style={
                                            styles.calculationLabel
                                        }
                                    >
                                        {t.calculation}
                                    </Text>


                                    <Text
                                        style={
                                            styles.calculationValue
                                        }
                                    >
                                        {numericShareCount >= 1 &&
                                            numericShareCount <= 15
                                            ? `${numericShareCount} × ৳50 = ৳${weeklyAmount}`
                                            : t.calculationText}
                                    </Text>

                                </View>


                                <View
                                    style={
                                        styles.calculationRow
                                    }
                                >

                                    <Text
                                        style={
                                            styles.calculationLabel
                                        }
                                    >
                                        {t.perShare}
                                    </Text>


                                    <Text
                                        style={
                                            styles.calculationValue
                                        }
                                    >
                                        ৳50
                                    </Text>

                                </View>

                            </View>


                            {/* CREATE BUTTON */}

                            <Pressable

                                onPress={
                                    handleCreateMember
                                }

                                disabled={
                                    creating
                                }

                                style={({ pressed }) => [

                                    styles.createButton,

                                    creating &&
                                    styles.createButtonDisabled,

                                    pressed &&
                                    !creating &&
                                    styles.createButtonPressed,

                                ]}

                            >

                                {creating ? (

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

                                    <Text
                                        style={
                                            styles.createButtonText
                                        }
                                    >
                                        {t.createMemberButton}
                                    </Text>

                                )}

                            </Pressable>

                        </View>


                        <View
                            style={{
                                height: 180,
                            }}
                        />

                    </ScrollView>


                    {/* ============================================================ */}
                    {/* SIDE MENU                                                    */}
                    {/* ============================================================ */}

                    {menuMounted && (

                        <View
                            style={
                                styles.menuOverlay
                            }
                        >

                            {/* -------------------------------------------------------- */}
                            {/* DARK OVERLAY                                             */}
                            {/* -------------------------------------------------------- */}

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


                            {/* -------------------------------------------------------- */}
                            {/* DRAWER                                                   */}
                            {/* -------------------------------------------------------- */}

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


                                        {/* CREATE ADMIN */}

                                        <MenuItem
                                            icon="person-add-outline"
                                            label={
                                                t.createAdmin
                                            }
                                            onPress={() =>
                                                handleMenuPress(
                                                    "/admin/create-admin"
                                                )
                                            }
                                        />


                                        {/* ACTIVE CREATE MEMBER */}

                                        <MenuItem
                                            icon="people-outline"
                                            label={
                                                t.createMember
                                            }
                                            active
                                            onPress={() =>
                                                closeMenu()
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
                                            t={t}
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


    const iconColor =
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

        adminName: {
            fontSize: 13,
            fontWeight:
                "800",
            color:
                "#0f172a",
        },

        adminId: {
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
            paddingBottom: 80,
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

        introIconText: {
            color:
                "#ffffff",
            fontSize: 31,
            fontWeight:
                "300",
            lineHeight: 36,
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
            marginBottom: 17,
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

        dateInfo: {
            marginTop: -9,
            marginBottom: 13,
            fontSize: 10,
            lineHeight: 16,
            color:
                "#64748b",
        },


        /* ---------------------------------------------------------------------- */
        /* WEEKLY CARD                                                            */
        /* ---------------------------------------------------------------------- */

        weeklyCard: {
            marginTop: 3,
            padding: 14,
            borderRadius: 13,
            backgroundColor:
                "#f1f5f9",
        },

        weeklyHeader: {
            flexDirection:
                "row",
            alignItems:
                "center",
            justifyContent:
                "space-between",
        },

        weeklyTitle: {
            fontSize: 12,
            fontWeight:
                "800",
            color:
                "#334155",
        },

        weeklyAmount: {
            fontSize: 20,
            fontWeight:
                "900",
            color:
                "#0f172a",
        },

        divider: {
            height: 1,
            marginVertical: 11,
            backgroundColor:
                "#e2e8f0",
        },

        calculationRow: {
            flexDirection:
                "row",
            justifyContent:
                "space-between",
            alignItems:
                "center",
            marginTop: 5,
        },

        calculationLabel: {
            fontSize: 10,
            color:
                "#64748b",
        },

        calculationValue: {
            maxWidth: "65%",
            fontSize: 10,
            fontWeight:
                "700",
            textAlign:
                "right",
            color:
                "#475569",
        },


        /* ---------------------------------------------------------------------- */
        /* CREATE BUTTON                                                          */
        /* ---------------------------------------------------------------------- */

        createButton: {
            minHeight: 50,
            marginTop: 20,
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

        createButtonText: {
            color:
                "#ffffff",
            fontSize: 12,
            fontWeight:
                "800",
        },

        buttonLoading: {
            flexDirection:
                "row",
            alignItems:
                "center",
            gap: 9,
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