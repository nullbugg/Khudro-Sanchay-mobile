import React, {
    useCallback,
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
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    RefreshControl,
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
    useFocusEffect,
} from 'expo-router';

import {
    getCurrentMember,
    getMemberDashboard,
    Member,
    clearCurrentMember,
    MemberDashboardSummary,
    createDepositRequest,
} from '../../lib/member-api';

import {
    getMemberLanguage,
    setMemberLanguage,
    MemberLanguage,
} from '../../lib/member-language';


/* ========================================================================== 
   TYPES 
   ========================================================================== */

type PaymentMethod =
    | 'cash'
    | 'bkash';


/* ========================================================================== 
   TRANSLATIONS 
   ========================================================================== */

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

        weeklyHistory:
            'সাপ্তাহিক জমার ইতিহাস',

        pendingDeposit:
            'অপেক্ষমাণ জমা',

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

        latestDeposit:
            'সর্বশেষ জমা',

        latestDepositDescription:
            'সর্বশেষ যে সপ্তাহ পর্যন্ত টাকা জমা হয়েছে',

        week:
            'সপ্তাহ',

        noDeposit:
            'এখনও কোনো জমা নেই',

        shareCount:
            'শেয়ার সংখ্যা',

        weeklyAmount:
            'সাপ্তাহিক জমা',

        weeklyAmountDescription:
            'প্রতি সপ্তাহের জমা',

        numberOfWeeks:
            'কত সপ্তাহের জন্য টাকা দিবেন?',

        weeksPlaceholder:
            'সপ্তাহের সংখ্যা লিখুন',

        paymentMethod:
            'টাকা দেওয়ার পদ্ধতি',

        cash:
            'ক্যাশ',

        bkash:
            'বিকাশ',

        totalDeposit:
            'মোট জমা',

        totalDepositDescription:
            'সাপ্তাহিক জমার মোট পরিমাণ',

        bkashCharge:
            'বিকাশ খরচ',

        perSharePerWeek:
            'প্রতি শেয়ার প্রতি সপ্তাহে ৳1',

        youNeedToPay:
            'আপনাকে দিতে হবে',

        pay:
            'সেন্ড মানি করুন',

        submit:
            'জমা দিন',

        bkashPayment:
            'বিকাশ পেমেন্ট',

        sendMoneyTo:
            'Send Money করুন',

        reference:
            'Reference',

        referenceDescription:
            'Reference হিসেবে আপনার Member ID দিন',

        senderNumber:
            'যে নম্বর থেকে Send Money করেছেন',

        senderNumberPlaceholder:
            'বিকাশ নম্বর লিখুন',

        continue:
            'চালিয়ে যান',

        pendingMessage:
            'আপনার অনুরোধ Admin approval-এর জন্য পাঠানো হবে।',

        loading:
            'তথ্য লোড হচ্ছে...',

        loadFailed:
            'তথ্য লোড করা যায়নি',

        retry:
            'আবার চেষ্টা করুন',

        login:
            'লগইন করুন',

        connectionError:
            'Server-এর সাথে সংযোগ করা যাচ্ছে না',

        noData:
            'তথ্য পাওয়া যায়নি',

        invalidWeeks:
            'সঠিক সপ্তাহের সংখ্যা লিখুন',

        invalidSender:
            'বিকাশ নম্বর দিন',

        pending:
            'Pending',

        back:
            'ফিরে যান',

        paymentAmount:
            'পেমেন্টের পরিমাণ',

        paymentInstruction:
            'উপরের নম্বরে Send Money করার পর নিচে যে নম্বর থেকে টাকা পাঠিয়েছেন সেটি দিন।',

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

        weeklyHistory:
            'Weekly Deposit History',

        pendingDeposit:
            'Pending Deposit',

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

        latestDeposit:
            'Latest Deposit',

        latestDepositDescription:
            'The latest week for which money was deposited',

        week:
            'Week',

        noDeposit:
            'No deposit yet',

        shareCount:
            'Share Count',

        weeklyAmount:
            'Weekly Deposit',

        weeklyAmountDescription:
            'Deposit per week',

        numberOfWeeks:
            'How many weeks do you want to pay?',

        weeksPlaceholder:
            'Enter number of weeks',

        paymentMethod:
            'Payment Method',

        cash:
            'Cash',

        bkash:
            'bKash',

        totalDeposit:
            'Total Deposit',

        totalDepositDescription:
            'Total weekly deposit amount',

        bkashCharge:
            'bKash Charge',

        perSharePerWeek:
            '৳1 per share per week',

        youNeedToPay:
            'You need to pay',

        pay:
            'Send Money',

        submit:
            'Submit',

        bkashPayment:
            'bKash Payment',

        sendMoneyTo:
            'Send Money to',

        reference:
            'Reference',

        referenceDescription:
            'Use your Member ID as reference',

        senderNumber:
            'Number used for Send Money',

        senderNumberPlaceholder:
            'Enter bKash number',

        continue:
            'Continue',

        pendingMessage:
            'Your request will be sent to Admin for approval.',

        loading:
            'Loading information...',

        loadFailed:
            'Failed to load information',

        retry:
            'Retry',

        login:
            'Login',

        connectionError:
            'Unable to connect to server',

        noData:
            'No information available',

        invalidWeeks:
            'Enter a valid number of weeks',

        invalidSender:
            'Enter the bKash number',

        pending:
            'Pending',

        back:
            'Back',

        paymentAmount:
            'Payment Amount',

        paymentInstruction:
            'After sending the money to the number above, enter the number you used to send the money.',

    },

};


/* ========================================================================== 
   SCREEN 
   ========================================================================== */

export default function MemberDeposit() {

    /* ---------------------------------------------------------------------- 
       MEMBER 
       ---------------------------------------------------------------------- */

    const [
        member,
        setMember,
    ] = useState<Member | null>(null);


    /* ---------------------------------------------------------------------- 
       DASHBOARD SUMMARY 
       ---------------------------------------------------------------------- */

    const [
        summary,
        setSummary,
    ] = useState<MemberDashboardSummary | null>(
        null
    );


    /* ---------------------------------------------------------------------- 
       STATE 
       ---------------------------------------------------------------------- */

    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        refreshing,
        setRefreshing,
    ] = useState(false);


    const [
        error,
        setError,
    ] = useState('');


    /* ---------------------------------------------------------------------- 
       FORM 
       ---------------------------------------------------------------------- */

    const [
        weeks,
        setWeeks,
    ] = useState('');


    const [
        paymentMethod,
        setPaymentMethod,
    ] = useState<PaymentMethod>('cash');


    const [
        senderNumber,
        setSenderNumber,
    ] = useState('');


    const [
        showBkashForm,
        setShowBkashForm,
    ] = useState(false);


    /* ---------------------------------------------------------------------- 
       MENU 
       ---------------------------------------------------------------------- */

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

    /* ---------------------------------------------------------------------- 
   KEYBOARD ANIMATION 
   ---------------------------------------------------------------------- */

    const keyboardOffset =
        useRef(
            new Animated.Value(0)
        ).current;


    useEffect(() => {

        const keyboardShowEvent =
            Platform.OS === 'ios'
                ? 'keyboardWillShow'
                : 'keyboardDidShow';


        const keyboardHideEvent =
            Platform.OS === 'ios'
                ? 'keyboardWillHide'
                : 'keyboardDidHide';


        const showSubscription =
            Keyboard.addListener(
                keyboardShowEvent,
                (event) => {

                    const keyboardHeight =
                        event.endCoordinates.height;


                    const moveUp =
                        Math.min(
                            keyboardHeight * 0.45,
                            260
                        );


                    Animated.timing(
                        keyboardOffset,
                        {
                            toValue: moveUp,

                            duration:
                                Platform.OS === 'ios'
                                    ? event.duration || 250
                                    : 250,

                            easing:
                                Easing.out(
                                    Easing.cubic
                                ),

                            useNativeDriver: true,
                        }
                    ).start();

                }
            );


        const hideSubscription =
            Keyboard.addListener(
                keyboardHideEvent,
                (event) => {

                    Animated.timing(
                        keyboardOffset,
                        {
                            toValue: 0,

                            duration:
                                Platform.OS === 'ios'
                                    ? event.duration || 220
                                    : 220,

                            easing:
                                Easing.out(
                                    Easing.cubic
                                ),

                            useNativeDriver: true,
                        }
                    ).start();

                }
            );


        return () => {

            showSubscription.remove();

            hideSubscription.remove();

        };

    }, [keyboardOffset]);


    /* ---------------------------------------------------------------------- 
       LANGUAGE 
       ---------------------------------------------------------------------- */

    const [
        language,
        setLanguage,
    ] = useState<MemberLanguage>('bn');


    const t =
        translations[language];


    /* ========================================================================== 
       LOAD LANGUAGE 
       ========================================================================== */

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


    /* ========================================================================== 
       CHANGE LANGUAGE 
       ========================================================================== */

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


    /* ========================================================================== 
       LOAD DATA 
       ========================================================================== */

    const loadData =
        useCallback(
            async (
                showLoading = true
            ) => {

                try {

                    if (showLoading) {
                        setLoading(true);
                    }

                    setError('');


                    const memberResult =
                        await getCurrentMember();


                    if (
                        !memberResult.success ||
                        !memberResult.member
                    ) {

                        setError(
                            memberResult.message ||
                            t.connectionError
                        );

                        return;

                    }


                    const currentMember =
                        memberResult.member;


                    setMember(
                        currentMember
                    );


                    const dashboardResult =
                        await getMemberDashboard(
                            currentMember.memberId
                        );


                    if (
                        !dashboardResult.success
                    ) {

                        setError(
                            dashboardResult.message ||
                            t.connectionError
                        );

                        return;

                    }


                    if (dashboardResult.success) {
                        setSummary(
                            dashboardResult.summary ?? null
                        );
                    }

                } catch (error) {

                    console.error(
                        'Deposit page load error:',
                        error
                    );


                    setError(
                        error instanceof Error
                            ? error.message
                            : t.connectionError
                    );

                } finally {

                    if (showLoading) {
                        setLoading(false);
                    }

                }

            },
            [
                t.connectionError,
            ]
        );


    /* ========================================================================== 
       INITIAL LOAD 
       ========================================================================== */

    useEffect(() => {

        loadData();

    }, [loadData]);


    /* ========================================================================== 
       REFRESH ON FOCUS 
       ========================================================================== */

    useFocusEffect(
        useCallback(() => {

            if (member) {
                loadData(false);
            }

        }, [member, loadData])
    );


    /* ========================================================================== 
       REFRESH 
       ========================================================================== */

    const handleRefresh =
        async () => {

            setRefreshing(true);

            await loadData(false);

            setRefreshing(false);

        };


    /* ========================================================================== 
       OPEN MENU 
       ========================================================================== */

    const openMenu = () => {

        if (menuMounted) {
            return;
        }


        setMenuMounted(true);
        setMenuOpen(true);


        drawerTranslateX.setValue(-330);
        overlayOpacity.setValue(0);


        requestAnimationFrame(() => {

            Animated.parallel([

                Animated.timing(
                    drawerTranslateX,
                    {
                        toValue: 0,
                        duration: 230,
                        easing: Easing.out(
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
                        easing: Easing.out(
                            Easing.quad
                        ),
                        useNativeDriver: true,
                    }
                ),

            ]).start();

        });

    };


    /* ========================================================================== 
       CLOSE MENU 
       ========================================================================== */

    const closeMenu =
        (
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
                        easing: Easing.in(
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
                        easing: Easing.in(
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


    /* ========================================================================== 
       MENU PRESS 
       ========================================================================== */

    const handleMenuPress =
        (
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


    /* ========================================================================== 
       LOGOUT 
       ========================================================================== */

    const handleLogout = () => {

        closeMenu(() => {

            clearCurrentMember();

            router.replace(
                '/member/login'
            );

        });

    };


    /* ========================================================================== 
       FORM CALCULATIONS 
       ========================================================================== */

    const shareCount =
        Number(
            member?.currentShareCount || 0
        );


    const weeklyAmount =
        shareCount * 50;


    const weekCount =
        Math.max(
            0,
            Number(
                weeks || 0
            )
        );


    const depositAmount =
        weeklyAmount * weekCount;


    const bkashCharge =
        paymentMethod === 'bkash'
            ? shareCount * weekCount
            : 0;


    const payableAmount =
        depositAmount + bkashCharge;


    /* ========================================================================== 
       PAYMENT METHOD 
       ========================================================================== */

    const selectPaymentMethod =
        (
            method: PaymentMethod
        ) => {

            setPaymentMethod(
                method
            );

            if (method === 'cash') {
                setShowBkashForm(false);
            }

        };


    /* ========================================================================== 
       SUBMIT / PAY 
       ========================================================================== */

    const handleSubmit =
        async () => {

            if (
                !weekCount ||
                weekCount <= 0
            ) {

                return;

            }


            if (paymentMethod === 'bkash') {

                setShowBkashForm(true);

                return;

            }


            if (!member?.memberId) {

                Alert.alert(
                    'সমস্যা',
                    'Member information পাওয়া যায়নি। আবার login করুন।'
                );

                return;

            }


            try {

                const result =
                    await createDepositRequest(
                        member.memberId,
                        weekCount,
                        'cash'
                    );


                if (!result.success) {

                    Alert.alert(
                        'সমস্যা',
                        result.message
                    );

                    return;

                }


                console.log(
                    'Cash deposit request created:',
                    result.request
                );


                Alert.alert(
                    'সফল',
                    result.message,
                    [
                        {
                            text: 'ঠিক আছে',

                            onPress: () => {

                                router.replace(
                                    '/member/pending-deposit'
                                );

                            },
                        },
                    ]
                );


            } catch (error) {

                console.error(
                    'Cash deposit request error:',
                    error
                );


                Alert.alert(
                    'সমস্যা',
                    'Deposit request পাঠানো যায়নি। আবার চেষ্টা করুন।'
                );

            }

        };


    /* ========================================================================== 
       BACK FROM BKASH PAYMENT 
       ========================================================================== */

    const handleBkashBack = () => {

        setShowBkashForm(false);

    };


    /* ========================================================================== 
       BKASH SUBMIT 
       ========================================================================== */

    const handleBkashSubmit =
        async () => {

            const phone =
                senderNumber.trim();


            if (!/^01[3-9]\d{8}$/.test(phone)) {

                Alert.alert(
                    language === 'bn'
                        ? 'সমস্যা'
                        : 'Problem',

                    language === 'bn'
                        ? 'সঠিক ১১ ডিজিটের বিকাশ নম্বর দিন।'
                        : 'Enter a valid 11-digit bKash number.'
                );

                return;

            }


            if (!member?.memberId) {

                Alert.alert(
                    language === 'bn'
                        ? 'সমস্যা'
                        : 'Problem',

                    language === 'bn'
                        ? 'Member information পাওয়া যায়নি। আবার login করুন।'
                        : 'Member information not found. Please login again.'
                );

                return;

            }


            try {

                const result =
                    await createDepositRequest(
                        member.memberId,
                        weekCount,
                        'bkash',
                        phone
                    );


                if (!result.success) {

                    Alert.alert(
                        language === 'bn'
                            ? 'সমস্যা'
                            : 'Problem',

                        result.message
                    );

                    return;

                }


                Keyboard.dismiss();


                Alert.alert(
                    language === 'bn'
                        ? 'সফল'
                        : 'Success',

                    result.message,

                    [
                        {
                            text:
                                language === 'bn'
                                    ? 'ঠিক আছে'
                                    : 'OK',

                            onPress: () => {

                                router.replace(
                                    '/member/pending-deposit'
                                );

                            },
                        },
                    ]
                );


            } catch (error) {

                console.error(
                    'bKash deposit request error:',
                    error
                );


                Alert.alert(
                    language === 'bn'
                        ? 'সমস্যা'
                        : 'Problem',

                    language === 'bn'
                        ? 'Deposit request পাঠানো যায়নি। আবার চেষ্টা করুন।'
                        : 'Failed to send deposit request. Please try again.'
                );

            }

        };


    /* ========================================================================== 
       LOADING 
       ========================================================================== */

    if (loading) {

        return (

            <SafeAreaView
                style={styles.safeArea}
                edges={[
                    'top',
                    'left',
                    'right',
                ]}
            >

                <View
                    style={styles.header}
                >

                    <View
                        style={styles.headerLeft}
                    >

                        <View
                            style={styles.menuButton}
                        >

                            <Ionicons
                                name="menu"
                                size={25}
                                color="#0f172a"
                            />

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

                    </View>

                </View>


                <View
                    style={styles.centerState}
                >

                    <ActivityIndicator
                        size="large"
                        color="#0f172a"
                    />


                    <Text
                        style={styles.stateText}
                    >
                        {t.loading}
                    </Text>

                </View>

            </SafeAreaView>

        );

    }


    /* ========================================================================== 
       ERROR 
       ========================================================================== */

    if (
        error &&
        !member
    ) {

        return (

            <SafeAreaView
                style={styles.safeArea}
                edges={[
                    'top',
                    'left',
                    'right',
                ]}
            >

                <View
                    style={styles.header}
                >

                    <View
                        style={styles.headerLeft}
                    >

                        <Pressable
                            onPress={openMenu}
                            style={
                                styles.menuButton
                            }
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

                </View>


                <View
                    style={styles.centerState}
                >

                    <View
                        style={styles.errorIcon}
                    >

                        <Ionicons
                            name="cloud-offline-outline"
                            size={31}
                            color="#dc2626"
                        />

                    </View>


                    <Text
                        style={styles.errorTitle}
                    >
                        {t.loadFailed}
                    </Text>


                    <Text
                        style={styles.errorMessage}
                    >
                        {error}
                    </Text>


                    <Pressable
                        onPress={() =>
                            loadData()
                        }
                        style={
                            styles.retryButton
                        }
                    >

                        <Ionicons
                            name="refresh"
                            size={18}
                            color="#ffffff"
                        />


                        <Text
                            style={
                                styles.retryButtonText
                            }
                        >
                            {t.retry}
                        </Text>

                    </Pressable>


                    <Pressable
                        onPress={() => {

                            clearCurrentMember();

                            router.replace(
                                '/member/login'
                            );

                        }}
                        style={
                            styles.loginButton
                        }
                    >

                        <Ionicons
                            name="log-in-outline"
                            size={18}
                            color="#334155"
                        />


                        <Text
                            style={
                                styles.loginButtonText
                            }
                        >
                            {t.login}
                        </Text>

                    </Pressable>

                </View>

            </SafeAreaView>

        );

    }


    if (!member) {
        return null;
    }


    /* ========================================================================== 
       MAIN 
       ========================================================================== */

    return (

        <SafeAreaView
            style={styles.safeArea}
            edges={[
                'top',
                'left',
                'right',
            ]}
        >

            {/* ========================================================================== 
               HEADER 
               ========================================================================== */}

            <View
                style={styles.header}
            >

                <View
                    style={styles.headerLeft}
                >

                    <Pressable
                        onPress={openMenu}
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
                            style={styles.appName}
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
                        {member.memberName}
                    </Text>


                    <Text
                        style={styles.memberId}
                    >
                        {t.memberId}: {member.memberId}
                    </Text>

                </View>

            </View>


            {/* ========================================================================== 
               BODY 
               ========================================================================== */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={
                    Platform.OS === 'ios'
                        ? 'padding'
                        : 'height'
                }
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={
                                handleRefresh
                            }
                        />
                    }
                    contentContainerStyle={
                        styles.scrollContent
                    }
                >

                    <View
                        style={styles.container}
                    >

                        {/* 
                     * When bKash Pay is pressed, the complete 
                     * previous deposit UI is hidden and only 
                     * the bKash payment section is displayed. 
                     */}

                        {/* ======================================================
                        BKASH PAYMENT SCREEN
                        ====================================================== */}

                        {showBkashForm ? (

                            <Animated.View
                                style={[
                                    {
                                        transform: [
                                            {
                                                translateY:
                                                    Animated.multiply(
                                                        keyboardOffset,
                                                        -1
                                                    ),
                                            },
                                        ],
                                    },
                                ]}
                            >

                                {/* BACK BUTTON */}

                                <Pressable
                                    onPress={
                                        handleBkashBack
                                    }
                                    style={
                                        styles.bkashBackButton
                                    }
                                >

                                    <Ionicons
                                        name="arrow-back"
                                        size={20}
                                        color="#0f172a"
                                    />


                                    <Text
                                        style={
                                            styles.bkashBackText
                                        }
                                    >
                                        {t.back}
                                    </Text>

                                </Pressable>


                                {/* BKASH CARD */}

                                <View
                                    style={
                                        styles.bkashPaymentCard
                                    }
                                >

                                    <View
                                        style={
                                            styles.bkashHeader
                                        }
                                    >

                                        <View
                                            style={
                                                styles.bkashHeaderIcon
                                            }
                                        >

                                            <Ionicons
                                                name="phone-portrait-outline"
                                                size={22}
                                                color="#0f172a"
                                            />

                                        </View>


                                        <Text
                                            style={
                                                styles.bkashTitle
                                            }
                                        >
                                            {t.bkashPayment}
                                        </Text>

                                    </View>


                                    {/* PAYMENT AMOUNT */}

                                    <View
                                        style={
                                            styles.bkashAmountBox
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.bkashAmountLabel
                                            }
                                        >
                                            {t.paymentAmount}
                                        </Text>


                                        <Text
                                            style={
                                                styles.bkashAmount
                                            }
                                        >
                                            {
                                                formatMoney(
                                                    payableAmount
                                                )
                                            }
                                        </Text>

                                    </View>


                                    {/* SEND MONEY */}

                                    <Text
                                        style={
                                            styles.sendMoneyText
                                        }
                                    >
                                        {t.sendMoneyTo}
                                    </Text>


                                    <View
                                        style={
                                            styles.numberBox
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.numberText
                                            }
                                        >
                                            01767279755
                                        </Text>


                                        <Ionicons
                                            name="copy-outline"
                                            size={19}
                                            color="#64748b"
                                        />

                                    </View>


                                    {/* REFERENCE */}

                                    <Text
                                        style={
                                            styles.referenceTitle
                                        }
                                    >
                                        {t.reference}
                                    </Text>


                                    <View
                                        style={
                                            styles.referenceBox
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.referenceValue
                                            }
                                        >
                                            {
                                                member.memberId
                                            }
                                        </Text>

                                    </View>


                                    <Text
                                        style={
                                            styles.referenceHint
                                        }
                                    >
                                        {
                                            t.referenceDescription
                                        }
                                    </Text>


                                    {/* INSTRUCTION */}

                                    <View
                                        style={
                                            styles.bkashInstructionBox
                                        }
                                    >

                                        <Ionicons
                                            name="information-circle-outline"
                                            size={19}
                                            color="#475569"
                                        />


                                        <Text
                                            style={
                                                styles.bkashInstructionText
                                            }
                                        >
                                            {
                                                t.paymentInstruction
                                            }
                                        </Text>

                                    </View>


                                    {/* SENDER NUMBER */}

                                    <Text
                                        style={
                                            styles.senderTitle
                                        }
                                    >
                                        {
                                            t.senderNumber
                                        }
                                    </Text>


                                    <View
                                        style={
                                            styles.inputContainer
                                        }
                                    >

                                        <Ionicons
                                            name="call-outline"
                                            size={20}
                                            color="#64748b"
                                        />


                                        <TextInput
                                            value={senderNumber}
                                            onChangeText={(text) => {

                                                const numbersOnly =
                                                    text.replace(
                                                        /[^0-9]/g,
                                                        ''
                                                    );

                                                setSenderNumber(
                                                    numbersOnly.slice(0, 11)
                                                );

                                            }}
                                            placeholder="01XXXXXXXX"
                                            placeholderTextColor="#9ca3af"
                                            keyboardType="phone-pad"
                                            maxLength={11}
                                            autoCorrect={false}
                                            autoCapitalize="none"
                                            style={styles.senderNumberInput}
                                        />

                                    </View>


                                    {/* SUBMIT */}

                                    <Pressable
                                        onPress={
                                            handleBkashSubmit
                                        }
                                        style={({ pressed }) => [
                                            styles.submitButton,

                                            pressed &&
                                            styles.submitButtonPressed,
                                        ]}
                                    >

                                        <Text
                                            style={
                                                styles.submitButtonText
                                            }
                                        >
                                            {t.submit} {' '}
                                        </Text>

                                        {/*<Ionicons
                                            name="send-outline"
                                            size={20}
                                            color="#ffffff"
                                        />*/}

                                    </Pressable>

                                </View>


                                <View
                                    style={
                                        styles.bottomSpacing
                                    }
                                />

                            </Animated.View>

                        ) : (

                            /* ====================================================== 
                               ORIGINAL DEPOSIT UI 
                               ====================================================== */

                            <>

                                {/* ==================================================
   LATEST DEPOSIT
   ================================================== */}

                                <View
                                    style={
                                        styles.latestCard
                                    }
                                >

                                    {/* ICON */}

                                    <View
                                        style={
                                            styles.latestIcon
                                        }
                                    >
                                        <Ionicons
                                            name="checkmark-circle-outline"
                                            size={24}
                                            color="#0f172a"
                                        />
                                    </View>


                                    {/* TITLE + SUBTITLE */}

                                    <View
                                        style={
                                            styles.latestContent
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.cardTitle
                                            }
                                            numberOfLines={1}
                                        >
                                            {t.latestDeposit}
                                        </Text>


                                        <Text
                                            style={
                                                styles.cardDescription
                                            }
                                            numberOfLines={2}
                                        >
                                            {
                                                t.latestDepositDescription
                                            }
                                        </Text>

                                    </View>


                                    {/* WEEK + DATE */}

                                    <View
                                        style={
                                            styles.latestValueColumn
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.latestWeek
                                            }
                                            numberOfLines={1}
                                        >
                                            {
                                                summary?.latestWeek
                                                    ? `${t.week} ${summary.latestWeek}`
                                                    : '-'
                                            }
                                        </Text>


                                        <Text
                                            style={
                                                styles.latestDate
                                            }
                                            numberOfLines={1}
                                        >
                                            {
                                                summary?.latestWeek
                                                    ? formatDate(
                                                        getWeekStartDate(
                                                            Number(
                                                                summary.latestWeek
                                                            )
                                                        ),
                                                        language
                                                    )
                                                    : '-'
                                            }
                                        </Text>

                                    </View>

                                </View>


                                {/* ================================================== 
                               SHARE + WEEKLY AMOUNT 
                               ================================================== */}

                                <View
                                    style={
                                        styles.formCard
                                    }
                                >

                                    <Text
                                        style={
                                            styles.sectionTitle
                                        }
                                    >
                                        {t.weeklyDeposit}
                                    </Text>


                                    <View
                                        style={
                                            styles.twoColumn
                                        }
                                    >

                                        {/* SHARE */}

                                        <View
                                            style={
                                                styles.fieldBox
                                            }
                                        >

                                            <Text
                                                style={
                                                    styles.fieldLabel
                                                }
                                            >
                                                {t.shareCount}
                                            </Text>


                                            <View
                                                style={
                                                    styles.valueContainer
                                                }
                                            >

                                                <Ionicons
                                                    name="layers-outline"
                                                    size={20}
                                                    color="#475569"
                                                />


                                                <Text
                                                    style={
                                                        styles.valueText
                                                    }
                                                >
                                                    {
                                                        shareCount
                                                    }
                                                </Text>

                                            </View>

                                        </View>


                                        {/* WEEKLY */}

                                        <View
                                            style={
                                                styles.fieldBox
                                            }
                                        >

                                            <Text
                                                style={
                                                    styles.fieldLabel
                                                }
                                            >
                                                {t.weeklyAmount}
                                            </Text>


                                            <View
                                                style={
                                                    styles.valueContainer
                                                }
                                            >

                                                <Ionicons
                                                    name="cash-outline"
                                                    size={20}
                                                    color="#475569"
                                                />


                                                <Text
                                                    style={
                                                        styles.valueText
                                                    }
                                                >
                                                    {
                                                        formatMoney(
                                                            weeklyAmount
                                                        )
                                                    }
                                                </Text>

                                            </View>


                                            <Text
                                                style={
                                                    styles.fieldHint
                                                }
                                            >
                                                {t.weeklyAmountDescription}
                                            </Text>

                                        </View>

                                    </View>

                                </View>


                                {/* ================================================== 
                               NUMBER OF WEEKS 
                               ================================================== */}

                                <View
                                    style={
                                        styles.formCard
                                    }
                                >

                                    <Text
                                        style={
                                            styles.sectionTitle
                                        }
                                    >
                                        {t.numberOfWeeks}
                                    </Text>


                                    <View
                                        style={
                                            styles.inputContainer
                                        }
                                    >

                                        <Ionicons
                                            name="calendar-outline"
                                            size={20}
                                            color="#64748b"
                                        />


                                        <TextInput
                                            value={weeks}
                                            onChangeText={text =>
                                                setWeeks(
                                                    text.replace(
                                                        /[^0-9]/g,
                                                        ''
                                                    )
                                                )
                                            }
                                            keyboardType="number-pad"
                                            placeholder={
                                                t.weeksPlaceholder
                                            }
                                            placeholderTextColor="#94a3b8"
                                            style={
                                                styles.input
                                            }
                                        />

                                    </View>

                                </View>


                                {/* ================================================== 
                               PAYMENT METHOD 
                               ================================================== */}

                                <View
                                    style={
                                        styles.formCard
                                    }
                                >

                                    <Text
                                        style={
                                            styles.sectionTitle
                                        }
                                    >
                                        {t.paymentMethod}
                                    </Text>


                                    <View
                                        style={
                                            styles.paymentRow
                                        }
                                    >

                                        {/* CASH */}

                                        <Pressable
                                            onPress={() =>
                                                selectPaymentMethod(
                                                    'cash'
                                                )
                                            }
                                            style={[
                                                styles.paymentOption,

                                                paymentMethod ===
                                                'cash' &&
                                                styles.paymentOptionActive,
                                            ]}
                                        >

                                            <View
                                                style={[
                                                    styles.paymentIcon,

                                                    paymentMethod ===
                                                    'cash' &&
                                                    styles.paymentIconActive,
                                                ]}
                                            >

                                                <Ionicons
                                                    name="cash-outline"
                                                    size={22}
                                                    color={
                                                        paymentMethod ===
                                                            'cash'
                                                            ? '#ffffff'
                                                            : '#475569'
                                                    }
                                                />

                                            </View>


                                            <Text
                                                style={[
                                                    styles.paymentText,

                                                    paymentMethod ===
                                                    'cash' &&
                                                    styles.paymentTextActive,
                                                ]}
                                            >
                                                {t.cash}
                                            </Text>


                                            {paymentMethod ===
                                                'cash' && (

                                                    <Ionicons
                                                        name="checkmark-circle"
                                                        size={19}
                                                        color="#0f172a"
                                                        style={
                                                            styles.paymentCheck
                                                        }
                                                    />

                                                )}

                                        </Pressable>


                                        {/* BKASH */}

                                        <Pressable
                                            onPress={() =>
                                                selectPaymentMethod(
                                                    'bkash'
                                                )
                                            }
                                            style={[
                                                styles.paymentOption,

                                                paymentMethod ===
                                                'bkash' &&
                                                styles.paymentOptionActive,
                                            ]}
                                        >

                                            <View
                                                style={[
                                                    styles.paymentIcon,

                                                    paymentMethod ===
                                                    'bkash' &&
                                                    styles.paymentIconActive,
                                                ]}
                                            >

                                                <Ionicons
                                                    name="phone-portrait-outline"
                                                    size={22}
                                                    color={
                                                        paymentMethod ===
                                                            'bkash'
                                                            ? '#ffffff'
                                                            : '#475569'
                                                    }
                                                />

                                            </View>


                                            <Text
                                                style={[
                                                    styles.paymentText,

                                                    paymentMethod ===
                                                    'bkash' &&
                                                    styles.paymentTextActive,
                                                ]}
                                            >
                                                {t.bkash}
                                            </Text>


                                            {paymentMethod ===
                                                'bkash' && (

                                                    <Ionicons
                                                        name="checkmark-circle"
                                                        size={19}
                                                        color="#0f172a"
                                                        style={
                                                            styles.paymentCheck
                                                        }
                                                    />

                                                )}

                                        </Pressable>

                                    </View>

                                </View>


                                {/* ================================================== 
                               TOTAL 
                               ================================================== */}




                                {/* ================================================== 
                               CASH SUBMIT 
                               ================================================== */}

                                {paymentMethod ===
                                    'cash' && (

                                        <Pressable
                                            onPress={
                                                handleSubmit
                                            }
                                            style={({ pressed }) => [
                                                styles.submitButton,

                                                pressed &&
                                                styles.submitButtonPressed,
                                            ]}
                                        >

                                            <Text
                                                style={
                                                    styles.submitButtonText
                                                }
                                            >
                                                {formatMoney(
                                                    depositAmount
                                                )}{' '} 
                                                 {t.submit} {' '}
                                            </Text>

                                            <Ionicons
                                                name="send-outline"
                                                size={20}
                                                color="#ffffff"
                                            />

                                        </Pressable>

                                    )}


                                {/* ================================================== 
                               BKASH PAY BUTTON 
                               ================================================== */}

                                {paymentMethod ===
                                    'bkash' && (

                                        <Pressable
                                            onPress={
                                                handleSubmit
                                            }
                                            style={({ pressed }) => [
                                                styles.payButton,

                                                pressed &&
                                                styles.submitButtonPressed,
                                            ]}
                                        >

                                            <Text
                                                style={
                                                    styles.payButtonText
                                                }
                                            >
                                            
                                                {formatMoney(
                                                    payableAmount
                                                )}
                                                {' '} {t.pay} {' '}
                                            </Text>

                                            <Ionicons
                                                name="send-outline"
                                                size={19}
                                                color="#ffffff"
                                            />

                                        </Pressable>

                                    )}


                                <View
                                    style={
                                        styles.bottomSpacing
                                    }
                                />

                            </>

                        )}

                    </View>

                </ScrollView>
            </KeyboardAvoidingView>


            {/* ========================================================================== 
               SIDE MENU 
               ========================================================================== */}

            {menuMounted && (

                <View
                    style={styles.menuOverlay}
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
                                            {t.memberPanel}
                                        </Text>

                                    </View>

                                </View>


                                <Pressable
                                    onPress={() =>
                                        closeMenu()
                                    }
                                    style={
                                        styles.closeButton
                                    }
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
                                            '/member/change-gmail'
                                        )
                                    }
                                />


                                {/* CHANGE PIN */}

                                <MenuItem
                                    icon="lock-closed-outline"
                                    label={
                                        t.changePin
                                    }
                                    onPress={() =>
                                        handleMenuPress(
                                            '/member/change-pin'
                                        )
                                    }
                                />


                                <MenuDivider />


                                {/* DEPOSIT */}

                                <MenuItem
                                    icon="cash-outline"
                                    label={
                                        t.weeklyDeposit
                                    }
                                    active
                                    onPress={() =>
                                        closeMenu()
                                    }
                                />


                                {/* PENDING */}

                                <MenuItem
                                    icon="time-outline"
                                    label={
                                        t.pendingDeposit
                                    }
                                    onPress={() =>
                                        handleMenuPress(
                                            '/member/pending-deposit'
                                        )
                                    }
                                />


                                {/* HISTORY */}

                                <MenuItem
                                    icon="calendar-outline"
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
                                    style={
                                        styles.logoutButton
                                    }
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

        </SafeAreaView>

    );

}


/* ========================================================================== 
   MENU ITEM 
   ========================================================================== */

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
                    active || pressed;

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


/* ========================================================================== 
   MENU DIVIDER 
   ========================================================================== */

function MenuDivider() {

    return (

        <View
            style={styles.menuDivider}
        />

    );

}


/* ========================================================================== 
   HELPERS 
   ========================================================================== */

function formatMoney(
    amount: number
) {

    return `৳ ${Number(
        amount || 0
    ).toLocaleString(
        'en-BD'
    )}`;

}


function formatDate(
    date: string,
    language: MemberLanguage
) {
    if (!date) {
        return '-';
    }

    const raw = String(date).trim();

    // YYYY-MM-DD অথবা ISO date থেকে শুধু calendar date নেওয়া হচ্ছে
    const match = raw.match(
        /^(\d{4})-(\d{2})-(\d{2})/
    );

    if (match) {
        const [, year, month, day] = match;

        const dateOnly =
            new Date(
                Number(year),
                Number(month) - 1,
                Number(day)
            );

        if (
            Number.isNaN(
                dateOnly.getTime()
            )
        ) {
            return date;
        }

        return dateOnly.toLocaleDateString(
            language === 'bn'
                ? 'bn-BD'
                : 'en-GB',
            {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }
        );
    }

    // পুরোনো/অন্য format হলে fallback
    const parsed = new Date(raw);

    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {
        return date;
    }

    return parsed.toLocaleDateString(
        language === 'bn'
            ? 'bn-BD'
            : 'en-GB',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }
    );
}

function getWeekStartDate(
    weekNumber: number
): string {
    if (
        !Number.isInteger(weekNumber) ||
        weekNumber < 1
    ) {
        return '';
    }

    const week1Date =
        new Date(
            2026,
            3,
            24
        );

    const result =
        new Date(
            week1Date.getTime() +
            (weekNumber - 1) *
            7 *
            24 *
            60 *
            60 *
            1000
        );

    const year =
        result.getFullYear();

    const month =
        String(
            result.getMonth() + 1
        ).padStart(2, '0');

    const day =
        String(
            result.getDate()
        ).padStart(2, '0');

    return `${year}-${month}-${day}`;
}


/* ========================================================================== 
   STYLES 
   ========================================================================== */

const styles = StyleSheet.create({

    safeArea: {
        flex: 1,
        backgroundColor: '#f6f8fb',
    },


    /* ====================================================================== 
       HEADER 
       ====================================================================== */

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


    /* ====================================================================== 
       STATE 
       ====================================================================== */

    centerState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },


    stateText: {
        marginTop: 13,
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
        textAlign: 'center',
    },


    errorIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#fef2f2',
        alignItems: 'center',
        justifyContent: 'center',
    },


    errorTitle: {
        marginTop: 15,
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
        textAlign: 'center',
    },


    errorMessage: {
        marginTop: 7,
        fontSize: 11,
        lineHeight: 18,
        color: '#64748b',
        textAlign: 'center',
        maxWidth: 320,
    },


    retryButton: {
        marginTop: 18,
        minHeight: 43,
        paddingHorizontal: 18,
        borderRadius: 11,
        backgroundColor: '#0f172a',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },


    retryButtonText: {
        marginLeft: 8,
        fontSize: 12,
        fontWeight: '800',
        color: '#ffffff',
    },


    loginButton: {
        marginTop: 10,
        minHeight: 43,
        paddingHorizontal: 18,
        borderRadius: 11,
        backgroundColor: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },


    loginButtonText: {
        marginLeft: 8,
        fontSize: 12,
        fontWeight: '800',
        color: '#334155',
    },


    /* ====================================================================== 
       BODY 
       ====================================================================== */

    scrollContent: {
        flexGrow: 1,
        paddingBottom: 30,
    },


    container: {
        width: '100%',
        maxWidth: 600,
        alignSelf: 'center',
        paddingHorizontal: 18,
        paddingTop: 22,
    },


    /* ====================================================================== 
       LATEST 
       ====================================================================== */

    latestCard: {
        minHeight: 105,
        padding: 17,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
    },


    latestIcon: {
        width: 45,
        height: 45,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },


    latestContent: {
        flex: 1,
    },


    cardTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0f172a',
    },

    cardDescription: {
        marginTop: 3,
        fontSize: 9,
        lineHeight: 14,
        color: '#94a3b8',
    },

    latestValueColumn: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginLeft: 10,
    },


    latestWeek: {
        fontSize: 12,
        fontWeight: '900',
        color: '#0f172a',
    },


    latestDate: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748b',
    },


    /* ====================================================================== 
       FORM 
       ====================================================================== */

    formCard: {
        marginTop: 12,
        padding: 17,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },


    sectionTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 13,
    },


    twoColumn: {
        flexDirection: 'row',
        gap: 12,
    },


    fieldBox: {
        flex: 1,
        minHeight: 88,
        padding: 13,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },


    fieldLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748b',
    },


    valueContainer: {
        marginTop: 9,
        flexDirection: 'row',
        alignItems: 'center',
    },


    valueText: {
        marginLeft: 8,
        fontSize: 17,
        fontWeight: '900',
        color: '#0f172a',
    },


    fieldHint: {
        marginTop: 2,
        fontSize: 8,
        color: '#94a3b8',
    },


    inputContainer: {
        minHeight: 50,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
    },


    input: {
        flex: 1,
        marginLeft: 9,
        fontSize: 13,
        fontWeight: '700',
        color: '#0f172a',
    },

    senderNumberInput: {
        flex: 1,
        marginLeft: 9,
        minHeight: 48,
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
        paddingVertical: 0,
        letterSpacing: 0.5,
    },


    /* ====================================================================== 
       PAYMENT 
       ====================================================================== */

    paymentRow: {
        flexDirection: 'row',
        gap: 10,
    },


    paymentOption: {
        flex: 1,
        minHeight: 82,
        padding: 12,
        borderRadius: 13,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },


    paymentOptionActive: {
        backgroundColor: '#eef2f7',
        borderColor: '#0f172a',
    },


    paymentIcon: {
        width: 40,
        height: 40,
        borderRadius: 11,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },


    paymentIconActive: {
        backgroundColor: '#0f172a',
    },


    paymentText: {
        marginLeft: 9,
        fontSize: 11,
        fontWeight: '800',
        color: '#475569',
    },


    paymentTextActive: {
        color: '#0f172a',
    },


    paymentCheck: {
        position: 'absolute',
        right: 8,
        top: 8,
    },


    /* ====================================================================== 
       BUTTON 
       ====================================================================== */

    submitButton: {
        marginTop: 12,
        minHeight: 52,
        borderRadius: 13,
        backgroundColor: '#0f172a',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },


    submitButtonPressed: {
        opacity: 0.65,
    },


    submitButtonText: {
        marginLeft: 8,
        fontSize: 12,
        fontWeight: '900',
        color: '#ffffff',
    },


    /* ====================================================================== 
       BKASH 
       ====================================================================== */


    bkashPaymentCard: {
        marginTop: 12,
        padding: 17,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },


    bkashBackButton: {
        minHeight: 43,
        paddingHorizontal: 12,
        borderRadius: 11,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
    },


    bkashBackText: {
        marginLeft: 8,
        fontSize: 11,
        fontWeight: '800',
        color: '#0f172a',
    },


    bkashHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },


    bkashHeaderIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },


    bkashTitle: {
        fontSize: 13,
        fontWeight: '900',
        color: '#0f172a',
    },


    bkashAmountBox: {
        marginTop: 16,
        padding: 15,
        borderRadius: 13,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },


    bkashAmountLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748b',
    },


    bkashAmount: {
        marginTop: 5,
        fontSize: 26,
        fontWeight: '900',
        color: '#0f172a',
    },


    sendMoneyText: {
        marginTop: 17,
        fontSize: 10,
        fontWeight: '700',
        color: '#64748b',
    },


    numberBox: {
        marginTop: 7,
        minHeight: 48,
        paddingHorizontal: 13,
        borderRadius: 11,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },


    numberText: {
        fontSize: 17,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: 0.4,
    },


    referenceTitle: {
        marginTop: 14,
        fontSize: 10,
        fontWeight: '700',
        color: '#64748b',
    },


    referenceBox: {
        marginTop: 7,
        minHeight: 45,
        paddingHorizontal: 13,
        borderRadius: 11,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        justifyContent: 'center',
    },


    referenceValue: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0f172a',
    },


    referenceHint: {
        marginTop: 5,
        fontSize: 8,
        color: '#94a3b8',
    },


    bkashInstructionBox: {
        marginTop: 14,
        padding: 12,
        borderRadius: 11,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'flex-start',
    },


    bkashInstructionText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 9,
        lineHeight: 15,
        color: '#64748b',
    },


    payButton: {
        marginTop: 12,
        minHeight: 52,
        borderRadius: 13,
        backgroundColor: '#0f172a',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },


    payButtonText: {
        marginLeft: 8,
        fontSize: 12,
        fontWeight: '900',
        color: '#ffffff',
    },

    senderTitle: {
        marginTop: 16,
        marginBottom: 8,
        fontSize: 12,
        fontWeight: '800',
        color: '#334155',
    },


    bottomSpacing: {
        height: 25,
    },


    /* ====================================================================== 
       DRAWER 
       ====================================================================== */

    menuOverlay: {
        position: 'absolute',
        top: 30,
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
        backgroundColor: '#ffffff',
        shadowColor: '#000000',
        shadowOpacity: 0.16,
        shadowRadius: 15,
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
        borderBottomColor: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },


    drawerBrand: {
        flexDirection: 'row',
        alignItems: 'center',
    },


    drawerLogo: {
        width: 43,
        height: 43,
        borderRadius: 12,
        backgroundColor: '#0f172a',
        alignItems: 'center',
        justifyContent: 'center',
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
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },


    /* ====================================================================== 
       MENU 
       ====================================================================== */

    menuScroll: {
        paddingHorizontal: 9,
        paddingBottom: 15,
    },


    firstMenuItem: {
        marginTop: 7,
    },


    menuItem: {
        minHeight: 42,
        borderRadius: 9,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
        overflow: 'hidden',
    },


    menuItemActive: {
        backgroundColor: '#0f172a',
    },


    menuItemIconContainer: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },


    menuItemText: {
        marginLeft: 10,
        fontSize: 11,
        fontWeight: '700',
        flex: 1,
        color: '#334155',
    },


    menuItemTextActive: {
        color: '#ffffff',
    },


    menuDivider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 7,
        marginHorizontal: 6,
    },


    /* ====================================================================== 
       LANGUAGE 
       ====================================================================== */

    languageMenu: {
        minHeight: 50,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },


    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },


    languageOptions: {
        flexDirection: 'row',
        padding: 3,
        borderRadius: 9,
        backgroundColor: '#f1f5f9',
    },


    languageOption: {
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 7,
    },


    languageOptionActive: {
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 7,
        backgroundColor: '#0f172a',
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


    /* ====================================================================== 
       LOGOUT 
       ====================================================================== */

    logoutButton: {
        minHeight: 42,
        borderRadius: 9,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
    },


    logoutText: {
        marginLeft: 10,
        fontSize: 11,
        fontWeight: '800',
        color: '#dc2626',
    },

});
