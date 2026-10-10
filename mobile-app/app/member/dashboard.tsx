import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import Ionicons from '@expo/vector-icons/Ionicons';

import {
    ActivityIndicator,
    Animated,
    Easing,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
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
} from '../../lib/member-api';

import {
    getMemberLanguage,
    setMemberLanguage,
    MemberLanguage,
} from '../../lib/member-language';


/* ==========================================================================
   TYPES
   ========================================================================== */

type ExtendedDashboardSummary =
    MemberDashboardSummary & {

        totalDeposit?: number;

        availableAdvance?: number;

        currentWeek?: number;

        currentWeekStartDate?: string;

        currentWeekEndDate?: string;

        nextWeek?: number;

        nextWeekStartDate?: string;

        nextWeekEndDate?: string;

        advanceAmount?: number;

        dueAmount?: number;

        dueWeeks?: number;

        dueFromWeek?: number;

        dueToWeek?: number;

        dueFromDate?: string;

        dueToDate?: string;

        advanceWeeks?: number;

        advanceFromWeek?: number;

        advanceToWeek?: number;

        advanceFromDate?: string;

        advanceToDate?: string;

        advanceUntilDate?: string;
    };


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

        totalDeposit:
            'মোট জমা টাকার পরিমান',

        totalDepositDescription:
            'মোট সাপ্তাহিক জমা + অগ্রিম জমা',

        weekly:
            'মোট সাপ্তাহিক জমা',

        advance:
            'অগ্রিম জমা',

        due:
            'মোট বকেয়া',

        dueAmount:
            'মোট বাকি',

        dueWeeks:
            'বাকি সপ্তাহ',

        advanceAmount:
            'মোট এডভান্স',

        advanceWeeks:
            'এডভান্স সপ্তাহ',

        shareCount:
            'বর্তমান শেয়ার সংখ্যা',

        weeklyAmount:
            'সাপ্তাহিক জমার পরিমাণ',

        lastDeposit:
            'সর্বশেষ জমা',

        lastDepositWeek:
            'সর্বশেষ জমার সপ্তাহ ও তারিখ',

        lastDepositDate:
            'সর্বশেষ জমার তারিখ',

        week:
            'সপ্তাহ',

        weekRange:
            'সপ্তাহ',

        until:
            'পর্যন্ত',

        date:
            'তারিখ',

        weekStatus:
            'সপ্তাহের অবস্থা',

        currentWeek:
            'বর্তমান সপ্তাহ',

        nextWeek:
            'পরবর্তী সপ্তাহ',

        loading:
            'ড্যাশবোর্ডের তথ্য লোড হচ্ছে...',

        loadFailed:
            'ড্যাশবোর্ডের তথ্য লোড করা যায়নি',

        retry:
            'আবার চেষ্টা করুন',

        login:
            'লগইন করুন',

        connectionError:
            'Server-এর সাথে সংযোগ করা যাচ্ছে না',

        sessionNotFound:
            'সদস্যের session পাওয়া যায়নি',

        noData:
            'তথ্য পাওয়া যায়নি',

        amount:
            'টাকা',

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

        totalDeposit:
            'Total Deposit Amount',

        totalDepositDescription:
            'Weekly Deposit + Advance',

        weekly:
            'Weekly Deposit',

        advance:
            'Total Advance',

        due:
            'Total Due',

        dueAmount:
            'Total Due',

        dueWeeks:
            'Due Weeks',

        advanceAmount:
            'Total Advance',

        advanceWeeks:
            'Advance Weeks',

        shareCount:
            'Share Count',

        weeklyAmount:
            'Weekly Deposit Amount',

        lastDeposit:
            'Last Deposit',

        lastDepositWeek:
            'Last Deposit Week & Date',

        lastDepositDate:
            'Last Deposit Date',

        week:
            'Week',

        weekRange:
            'Week',

        until:
            'Until',

        date:
            'Date',

        weekStatus:
            'Week Status',

        currentWeek:
            'Current Week',

        nextWeek:
            'Next Week',

        loading:
            'Loading dashboard data...',

        loadFailed:
            'Failed to load dashboard data',

        retry:
            'Retry',

        login:
            'Login',

        connectionError:
            'Unable to connect to server',

        sessionNotFound:
            'Member session was not found',

        noData:
            'No information available',

        amount:
            'Amount',

    },

};


/* ==========================================================================
   SCREEN
   ========================================================================== */

export default function MemberDashboard() {

    /* ----------------------------------------------------------------------
       MEMBER
       ---------------------------------------------------------------------- */

    const [
        member,
        setMember,
    ] = useState<Member | null>(null);


    /* ----------------------------------------------------------------------
       DASHBOARD
       ---------------------------------------------------------------------- */

    const [
        summary,
        setSummary,
    ] = useState<ExtendedDashboardSummary | null>(
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
       LANGUAGE
       ---------------------------------------------------------------------- */

    const [
        language,
        setLanguage,
    ] = useState<MemberLanguage>(
        'bn'
    );


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
       LOAD DASHBOARD
       ========================================================================== */

    const loadDashboard =
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


                    console.log(
                        'Current member result:',
                        memberResult
                    );


                    if (
                        !memberResult.success ||
                        !memberResult.member
                    ) {

                        setError(
                            memberResult.message ||
                            t.sessionNotFound
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


                    console.log(
                        'Member dashboard result:',
                        dashboardResult
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


                    const dashboardSummary =
                        dashboardResult.summary;


                    if (!dashboardSummary) {

                        setError(
                            t.noData
                        );

                        return;

                    }


                    setSummary(
                        dashboardSummary as ExtendedDashboardSummary
                    );

                } catch (error) {

                    console.error(
                        'Member dashboard load error:',
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
                t.noData,
                t.sessionNotFound,
            ]
        );


    /* ==========================================================================
       INITIAL LOAD
       ========================================================================== */

    useEffect(() => {

        loadDashboard();

    }, [loadDashboard]);


    /* ==========================================================================
       REFRESH WHEN SCREEN FOCUSED
       ========================================================================== */

    useFocusEffect(
        useCallback(() => {

            if (member) {

                loadDashboard(false);

            }

        }, [member, loadDashboard])
    );


    /* ==========================================================================
       REFRESH
       ========================================================================== */

    const handleRefresh =
        async () => {

            setRefreshing(true);

            await loadDashboard(false);

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
            void (async () => {
                try {
                    await clearCurrentMember();
                    router.replace('/');
                } catch (error) {
                    console.error('Logout error:', error);
                }
            })();
        });
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
        !summary
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
                            loadDashboard()
                        }
                        style={({ pressed }) => [
                            styles.retryButton,

                            pressed &&
                            styles.retryButtonPressed,
                        ]}
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
                        style={({ pressed }) => [
                            styles.loginButton,

                            pressed &&
                            styles.loginButtonPressed,
                        ]}
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


    if (!member || !summary) {
        return null;
    }


    /* ==========================================================================
       DATA
       ========================================================================== */

    const currentWeek =
        Number(
            summary.currentWeek || 0
        );


    const latestWeek =
        Number(
            summary.latestWeek || 0
        );


    const weeklyAmount =
        Number(
            member.currentWeeklyAmount || 0
        );


    /*
     * Backend latestWeek অনুযায়ী বাকি সপ্তাহ।
     *
     * উদাহরণ:
     * currentWeek = 23
     * latestWeek = 20
     * weeklyAmount = 100
     *
     * Due = 3 × 100 = 300
     */
    const calculatedDueWeeks =
        Math.max(
            0,
            currentWeek - latestWeek
        );


    const dueAmount =
        calculatedDueWeeks *
        weeklyAmount;


    /*
     * Advance-এর জন্য availableAdvance ব্যবহার করা যাবে না।
     *
     * কারণ backend FIFO projection-এর সময় future weeks-এর জন্য
     * advance consume করে availableAdvance = 0 হয়ে যেতে পারে।
     *
     * তাই backend-এর dashboardAdvanceAmount / advanceAmount ব্যবহার
     * করতে হবে।
     */
    const advanceAmount =
        Number(
            summary.advanceAmount ?? 0
        );


    /*
     * Backend-এর totalDeposit হলো Collections-এর সব Paid Amount-এর
     * যোগফল — WEEKLY এবং ADVANCE উভয় type সহ।
     */
    const totalDeposit =
        Number(
            summary.totalDeposit ?? 0
        );


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

            {/* ==================================================================
               HEADER
               ================================================================== */}

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


            {/* ==================================================================
               DASHBOARD
               ================================================================== */}

            <ScrollView
                showsVerticalScrollIndicator={
                    false
                }
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
                    {/* ==========================================================
                        COMPACT DASHBOARD SUMMARY
                        ========================================================== */}

                    {/* TOTAL DEPOSIT */}

                    <View style={styles.totalDepositCard}>

                        <View style={styles.totalDepositTop}>

                            <View style={styles.totalDepositTitleArea}>

                                <View style={styles.totalDepositIcon}>
                                    <Ionicons
                                        name="wallet-outline"
                                        size={20}
                                        color="#ffffff"
                                    />
                                </View>

                                <View>
                                    <Text style={styles.totalDepositLabel}>
                                        {t.totalDeposit}
                                    </Text>

                                    <Text style={styles.totalDepositDescription}>
                                        {t.totalDepositDescription}
                                    </Text>
                                </View>

                            </View>

                            <View style={styles.totalDepositAmountArea}>

                                <Text style={styles.totalDepositAmount}>
                                    {formatMoney(totalDeposit)}
                                </Text>

                            </View>

                        </View>

                        <View style={styles.totalDepositFooter}>

                            <View style={styles.totalDepositFooterItem}>

                                <Text style={styles.totalDepositFooterLabel}>
                                    {t.weekly}
                                </Text>

                                <Text style={styles.totalDepositFooterValue}>
                                    {formatMoney(summary.currentWeeklyPaid)}
                                </Text>

                            </View>


                            <View style={styles.totalDepositFooterDivider} />


                            <View style={styles.totalDepositFooterItem}>

                                <Text style={styles.totalDepositFooterLabel}>
                                    {t.advance}
                                </Text>

                                <Text style={styles.totalDepositFooterValue}>
                                    {formatMoney(advanceAmount)}
                                </Text>

                            </View>

                        </View>

                    </View>


                    {/* ==========================================================
                        DUE + ADVANCE
                        ========================================================== */}

                    <View style={styles.twoColumn}>

                        {/* DUE */}

                        <View style={[
                            styles.compactStatCard,
                            styles.dueCard,
                        ]}>

                            <View style={styles.compactStatTop}>

                                <View style={[
                                    styles.compactStatIcon,
                                    styles.dueIcon,
                                ]}>
                                    <Ionicons
                                        name="alert-circle-outline"
                                        size={18}
                                        color="#dc2626"
                                    />
                                </View>

                                <Text style={styles.compactStatLabel}>
                                    {t.due}
                                </Text>

                            </View>

                            <Text style={[
                                styles.compactStatAmount,
                                styles.dueAmount,
                            ]}>
                                {formatMoney(dueAmount)}
                            </Text>

                            <Text style={styles.compactStatDetail}>
                                {formatDueWeeks(
                                    summary,
                                    language,
                                    t
                                )}
                            </Text>

                        </View>


                        {/* ADVANCE */}

                        <View style={[
                            styles.compactStatCard,
                            styles.advanceCard,
                        ]}>

                            <View style={styles.compactStatTop}>

                                <View style={[
                                    styles.compactStatIcon,
                                    styles.advanceIcon,
                                ]}>
                                    <Ionicons
                                        name="arrow-up-circle-outline"
                                        size={18}
                                        color="#2563eb"
                                    />
                                </View>

                                <Text style={styles.compactStatLabel}>
                                    {t.advance}
                                </Text>

                            </View>

                            <Text style={[
                                styles.compactStatAmount,
                                styles.advanceAmount,
                            ]}>
                                {formatMoney(advanceAmount)}
                            </Text>

                            <Text style={[
                                styles.compactStatDetail,
                                styles.advanceWeekRangeText,
                            ]}>
                                {formatAdvanceWeeks(
                                    summary,
                                    language,
                                    t,
                                    weeklyAmount
                                )}
                            </Text>

                        </View>

                    </View>


                    {/* ==========================================================
                        SHARE + WEEKLY DEPOSIT
                        ========================================================== */}

                    <View style={styles.twoColumn}>

                        {/* SHARE */}

                        <View style={styles.infoCard}>

                            <View style={styles.infoCardIcon}>
                                <Ionicons
                                    name="layers-outline"
                                    size={19}
                                    color="#334155"
                                />
                            </View>

                            <View style={styles.infoCardContent}>

                                <Text style={styles.infoCardLabel}>
                                    {t.shareCount}
                                </Text>

                                <Text style={styles.infoCardValue}>
                                    {member.currentShareCount || 0}
                                </Text>

                            </View>

                        </View>


                        {/* WEEKLY AMOUNT */}

                        <View style={styles.infoCard}>

                            <View style={styles.infoCardIcon}>
                                <Ionicons
                                    name="repeat-outline"
                                    size={19}
                                    color="#334155"
                                />
                            </View>

                            <View style={styles.infoCardContent}>

                                <Text
                                    style={styles.infoCardLabel}
                                    numberOfLines={1}
                                >
                                    {t.weeklyAmount}
                                </Text>

                                <Text style={styles.infoCardValue}>
                                    {formatMoney(
                                        member.currentWeeklyAmount
                                    )}
                                </Text>

                            </View>

                        </View>

                    </View>


                    {/* ==========================================================
                        LAST DEPOSIT
                        ========================================================== */}

                    <View style={styles.lastDepositCard}>

                        <View style={styles.lastDepositLeft}>

                            <View style={styles.lastDepositIcon}>
                                <Ionicons
                                    name="checkmark-circle-outline"
                                    size={20}
                                    color="#16a34a"
                                />
                            </View>

                            <View style={styles.lastDepositTextContainer}>

                                <Text style={styles.lastDepositTitle}>
                                    {t.lastDeposit}
                                </Text>

                                <Text style={styles.lastDepositDescription}>
                                    {t.lastDepositWeek}
                                </Text>

                            </View>

                        </View>


                        <View style={styles.lastDepositRight}>

                            <Text style={styles.lastDepositWeekValue}>
                                {t.week}{' '}
                                {summary.latestWeek || '-'}
                            </Text>

                            <Text style={styles.lastDepositDate}>
                                {formatDate(
                                    getWeekStartDate(
                                        Number(summary.latestWeek || 0)
                                    ),
                                    language
                                )}
                            </Text>

                        </View>

                    </View>


                    {/* ==========================================================
                        WEEK STATUS
                        ========================================================== */}

                    <View style={styles.weekProgressCard}>

                        <View style={styles.weekStatusHeader}>

                            <View style={styles.weekStatusTitleArea}>

                                <View style={styles.weekStatusIcon}>
                                    <Ionicons
                                        name="calendar-outline"
                                        size={17}
                                        color="#334155"
                                    />
                                </View>

                                <Text style={styles.sectionTitle}>
                                    {t.weekStatus}
                                </Text>

                            </View>

                        </View>


                        <View style={styles.weekProgressRow}>

                            {/* CURRENT WEEK */}

                            <View style={styles.currentWeekBox}>

                                <Text style={styles.weekBoxLabel}>
                                    {t.currentWeek}
                                </Text>

                                <View style={styles.weekInfoRow}>

                                    <Text style={styles.currentWeekNumber}>
                                        {t.week}{' '}
                                        {summary?.currentWeek || 0}
                                    </Text>

                                    <Text style={styles.currentWeekDate}>
                                        {
                                            summary?.currentWeekStartDate
                                                ? formatDate(
                                                    summary.currentWeekStartDate,
                                                    language
                                                )
                                                : '-'
                                        }
                                    </Text>

                                </View>

                            </View>


                            {/* ARROW */}

                            <View style={styles.weekArrow}>

                                <View style={styles.weekArrowCircle}>
                                    <Ionicons
                                        name="arrow-forward"
                                        size={15}
                                        color="#64748b"
                                    />
                                </View>

                            </View>


                            {/* NEXT WEEK */}

                            <View style={styles.nextWeekBox}>

                                <Text style={styles.nextWeekLabel}>
                                    {t.nextWeek}
                                </Text>

                                <View style={styles.weekInfoRow}>

                                    <Text style={styles.nextWeekNumber}>
                                        {t.week}{' '}
                                        {summary?.nextWeek || 0}
                                    </Text>

                                    <Text style={styles.nextWeekDate}>
                                        {
                                            summary?.nextWeekStartDate
                                                ? formatDate(
                                                    summary.nextWeekStartDate,
                                                    language
                                                )
                                                : '-'
                                        }
                                    </Text>

                                </View>

                            </View>

                        </View>

                    </View>





                    <View
                        style={
                            styles.bottomSpacing
                        }
                    />

                </View>

            </ScrollView>


            {/* ==================================================================
               SIDE MENU
               ================================================================== */}

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
                                        active
                                        onPress={() =>
                                            closeMenu()
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
                                    onPress={() =>
                                        handleMenuPress(
                                            '/member/change-pin'
                                        )
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

function getWeekStartDate(
    weekNumber: number
): string {
    if (
        !Number.isInteger(weekNumber) ||
        weekNumber < 1
    ) {
        return "";
    }

    const WEEK_1_START = new Date(
        "2026-04-24T00:00:00"
    );

    const date = new Date(
        WEEK_1_START.getTime() +
        (
            (weekNumber - 1) *
            7 *
            24 *
            60 *
            60 *
            1000
        )
    );

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
}


function formatDate(
    date: string,
    language: MemberLanguage
) {

    if (!date) {
        return '-';
    }

    const raw = String(date).trim();

    /*
     * Backend থেকে DD-MM-YYYY / DD/MM/YYYY
     * অথবা YYYY-MM-DD এলে manually parse করা হবে।
     */
    let parsed: Date | null = null;

    const ddmmyyyyMatch =
        raw.match(
            /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/
        );

    if (ddmmyyyyMatch) {

        const day =
            Number(ddmmyyyyMatch[1]);

        const month =
            Number(ddmmyyyyMatch[2]);

        const year =
            Number(ddmmyyyyMatch[3]);

        parsed = new Date(
            year,
            month - 1,
            day
        );

    } else {

        const yyyymmddMatch =
            raw.match(
                /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/
            );

        if (yyyymmddMatch) {

            const year =
                Number(yyyymmddMatch[1]);

            const month =
                Number(yyyymmddMatch[2]);

            const day =
                Number(yyyymmddMatch[3]);

            parsed = new Date(
                year,
                month - 1,
                day
            );

        } else {

            const fallback =
                new Date(raw);

            if (
                !Number.isNaN(
                    fallback.getTime()
                )
            ) {
                parsed = fallback;
            }

        }

    }

    if (
        !parsed ||
        Number.isNaN(
            parsed.getTime()
        )
    ) {

        return raw;

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


function formatWeekDateRange(
    startDate: string | undefined,
    endDate: string | undefined,
    language: MemberLanguage
) {

    if (!startDate || !endDate) {
        return '-';
    }

    return `${formatDate(
        startDate,
        language
    )} - ${formatDate(
        endDate,
        language
    )}`;

}


function formatDueWeeks(
    summary: ExtendedDashboardSummary,
    language: MemberLanguage,
    t: typeof translations.bn
) {
    const currentWeek = Number(
        summary.currentWeek || 0
    );

    const latestWeek = Number(
        summary.latestWeek || 0
    );

    const dueFromWeek = latestWeek + 1;
    const dueToWeek = currentWeek;

    // কোনো বকেয়া নেই
    if (
        currentWeek <= 0 ||
        latestWeek >= currentWeek
    ) {
        return language === 'bn'
            ? 'কোন বকেয়া নাই!'
            : 'No Outstanding Dues!';
    }

    // শুধু ১ সপ্তাহ বাকি
    if (dueFromWeek === dueToWeek) {
        return language === 'bn'
            ? `সপ্তাহ ${dueFromWeek} এর বকেয়া!`
            : `Due for Week ${dueFromWeek}!`;
    }

    // একাধিক সপ্তাহ বাকি
    return language === 'bn'
        ? `সপ্তাহ ${dueFromWeek} - সপ্তাহ ${dueToWeek} পর্যন্ত বকেয়া!`
        : `Due from Week ${dueFromWeek} - Week ${dueToWeek}!`;
}


function formatAdvanceWeeks(
    summary: ExtendedDashboardSummary,
    language: MemberLanguage,
    t: typeof translations.bn,
    weeklyAmount: number
) {
    const advanceAmount = Number(
        summary.advanceAmount || 0
    );

    if (advanceAmount > 0) {
        const currentWeek = Number(
            summary.currentWeek || 0
        );

        const advanceWeeks =
            weeklyAmount > 0
                ? Math.floor(
                    advanceAmount / weeklyAmount
                )
                : 0;

        const calculatedAdvanceToWeek =
            currentWeek + advanceWeeks;

        return language === 'bn'
            ? `সপ্তাহ ${calculatedAdvanceToWeek} পর্যন্ত অগ্রিম জমা আছে!`
            : `Advance paid up to Week ${calculatedAdvanceToWeek}`;
    }

    return language === 'bn'
        ? 'কোন অগ্রিম জমা নেই!'
        : 'No Advance Deposit!';
}


/* ==========================================================================
   STYLES
   ========================================================================== */

const styles = StyleSheet.create({

    safeArea: {
        flex: 1,
        backgroundColor: '#f6f8fb',
    },


    /* =========================================================================
       HEADER
       ========================================================================= */

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


    /* =========================================================================
       STATE
       ========================================================================= */

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


    retryButtonPressed: {
        opacity: 0.65,
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


    loginButtonPressed: {
        opacity: 0.65,
    },


    loginButtonText: {
        marginLeft: 8,
        fontSize: 12,
        fontWeight: '800',
        color: '#334155',
    },


    /* =========================================================================
   DASHBOARD
   ========================================================================= */

    scrollContent: {
        flexGrow: 1,
        paddingBottom: 24,
    },

    container: {
        width: '100%',
        maxWidth: 600,
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingTop: 14,
    },


    /* =========================================================================
       TOTAL DEPOSIT
       ========================================================================= */

    totalDepositCard: {
        borderRadius: 15,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 12,
        backgroundColor: '#0f172a',

        shadowColor: '#000000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 3,
        },

        elevation: 3,
    },

    totalDepositTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    totalDepositTitleArea: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },

    totalDepositIcon: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: '#1e293b',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    totalDepositLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#f8fafc',
    },

    totalDepositDescription: {
        marginTop: 2,
        fontSize: 9,
        color: '#94a3b8',
    },

    totalDepositAmountArea: {
        alignItems: 'flex-end',
    },

    totalDepositAmount: {
        fontSize: 23,
        fontWeight: '900',
        color: '#ffffff',
    },

    totalDepositFooter: {
        marginTop: 11,
        paddingTop: 9,
        borderTopWidth: 1,
        borderTopColor: '#334155',
        flexDirection: 'row',
        alignItems: 'center',
    },

    totalDepositFooterItem: {
        flex: 1,
    },

    totalDepositFooterDivider: {
        width: 1,
        height: 25,
        backgroundColor: '#334155',
        marginHorizontal: 12,
    },

    totalDepositFooterLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: '#94a3b8',
    },

    totalDepositFooterValue: {
        marginTop: 2,
        fontSize: 11,
        fontWeight: '800',
        color: '#e2e8f0',
    },


    /* =========================================================================
       TWO COLUMN
       ========================================================================= */

    twoColumn: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },


    /* =========================================================================
       COMPACT STAT CARDS
       ========================================================================= */

    compactStatCard: {
        flex: 1,
        minHeight: 118,
        borderRadius: 14,
        padding: 13,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },

    dueCard: {
        borderColor: '#fecaca',
        backgroundColor: '#fffafa',
    },

    advanceCard: {
        borderColor: '#bfdbfe',
        backgroundColor: '#f8fbff',
    },

    compactStatTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    compactStatIcon: {
        width: 32,
        height: 32,
        borderRadius: 9,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },

    dueIcon: {
        backgroundColor: '#fee2e2',
    },

    advanceIcon: {
        backgroundColor: '#dbeafe',
    },

    compactStatLabel: {
        flex: 1,
        fontSize: 10,
        fontWeight: '800',
        color: '#475569',
    },

    compactStatAmount: {
        marginTop: 10,
        fontSize: 19,
        fontWeight: '900',
        color: '#0f172a',
    },

    dueAmount: {
        color: '#dc2626',
    },

    advanceAmount: {
        color: '#2563eb',
    },

    compactStatDetail: {
        marginTop: 4,
        fontSize: 8.5,
        lineHeight: 13,
        fontWeight: '700',
        color: '#b91c1c',
    },

    advanceWeekRangeText: {
        color: '#2563eb',
    },


    /* =========================================================================
       INFO CARDS
       ========================================================================= */

    infoCard: {
        flex: 1,
        minHeight: 82,
        padding: 12,
        borderRadius: 14,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
    },

    infoCardIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    infoCardContent: {
        flex: 1,
    },

    infoCardLabel: {
        fontSize: 9.5,
        fontWeight: '700',
        color: '#64748b',
    },

    infoCardValue: {
        marginTop: 3,
        fontSize: 22,
        fontWeight: '900',
        color: '#0f172a',
    },


    /* =========================================================================
       LAST DEPOSIT
       ========================================================================= */

    lastDepositCard: {
        marginTop: 10,
        minHeight: 68,
        paddingHorizontal: 13,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    lastDepositLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },

    lastDepositIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#f0fdf4',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    lastDepositTextContainer: {
        flex: 1,
    },

    lastDepositTitle: {
        fontSize: 10.5,
        fontWeight: '800',
        color: '#334155',
    },

    lastDepositDescription: {
        marginTop: 2,
        fontSize: 8,
        color: '#94a3b8',
    },

    lastDepositRight: {
        alignItems: 'flex-end',
    },

    lastDepositWeekValue: {
        fontSize: 11,
        fontWeight: '900',
        color: '#0f172a',
    },

    lastDepositDate: {
        marginTop: 2,
        fontSize: 9,
        fontWeight: '600',
        color: '#64748b',
    },


    /* =========================================================================
       WEEK STATUS
       ========================================================================= */

    weekProgressCard: {
        marginTop: 10,
        padding: 13,
        borderRadius: 14,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },

    weekStatusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },

    weekStatusTitleArea: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    weekStatusIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },

    sectionTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#0f172a',
    },

    weekProgressRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },

    currentWeekBox: {
        flex: 1,
        paddingHorizontal: 11,
        paddingVertical: 10,
        borderRadius: 11,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },

    nextWeekBox: {
        flex: 1,
        paddingHorizontal: 11,
        paddingVertical: 10,
        borderRadius: 11,
        backgroundColor: '#fff7f7',
        borderWidth: 1,
        borderColor: '#fecaca',
    },

    weekArrow: {
        width: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },

    weekArrowCircle: {
        width: 25,
        height: 25,
        borderRadius: 13,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },

    weekBoxLabel: {
        fontSize: 8.5,
        fontWeight: '700',
        color: '#64748b',
    },

    weekInfoRow: {
        marginTop: 4,
    },

    currentWeekNumber: {
        fontSize: 13,
        fontWeight: '900',
        color: '#0f172a',
    },

    currentWeekDate: {
        marginTop: 2,
        fontSize: 8.5,
        color: '#64748b',
    },

    nextWeekLabel: {
        fontSize: 8.5,
        fontWeight: '700',
        color: '#dc2626',
    },

    nextWeekNumber: {
        fontSize: 13,
        fontWeight: '900',
        color: '#dc2626',
    },

    nextWeekDate: {
        marginTop: 2,
        fontSize: 8.5,
        color: '#ef4444',
    },

    bottomSpacing: {
        height: 18,
    },


    /* =========================================================================
       DRAWER
       ========================================================================= */

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


    closeButtonPressed: {
        opacity: 0.65,
    },


    /* =========================================================================
       COMPACT MENU
       ========================================================================= */

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
        backgroundColor: '#e2e8f0',
        marginVertical: 10,
        marginHorizontal: 7,
    },


    /* =========================================================================
       LANGUAGE
       ========================================================================= */

    languageMenu: {
        minHeight: 55,
        paddingHorizontal: 12,
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
        paddingVertical: 6,
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


    /* =========================================================================
       LOGOUT
       ========================================================================= */

    logoutButton: {
        minHeight: 46,
        borderRadius: 10,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
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