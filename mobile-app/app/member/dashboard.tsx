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
   FIXED WEEK STATUS
   ========================================================================== */

const CURRENT_WEEK_NUMBER = 23;
const CURRENT_WEEK_START_DATE = '25-09-2026';
const CURRENT_WEEK_END_DATE = '01-10-2026';

const NEXT_WEEK_NUMBER = 24;
const NEXT_WEEK_START_DATE = '02-10-2026';
const NEXT_WEEK_END_DATE = '08-10-2026';


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
            'Gmail পরিবর্তন',

        changePin:
            'PIN পরিবর্তন',

        weeklyDeposit:
            'সাপ্তাহিক জমা',

        pendingDeposit:
            'অপেক্ষমাণ জমা',

        weeklyHistory:
            'সাপ্তাহিক জমার ইতিহাস',

        language:
            'ভাষা',

        bangla:
            'বাংলা',

        english:
            'EN',

        logout:
            'লগআউট',

        memberId:
            'সদস্য ID',

        totalDeposit:
            'মোট জমা',

        totalDepositDescription:
            'সাপ্তাহিক জমা + এডভান্স',

        weekly:
            'সাপ্তাহিক',

        advance:
            'এডভান্স',

        due:
            'বাকি',

        dueAmount:
            'মোট বাকি',

        dueWeeks:
            'বাকি সপ্তাহ',

        advanceAmount:
            'মোট এডভান্স',

        advanceWeeks:
            'এডভান্স সপ্তাহ',

        shareCount:
            'শেয়ার সংখ্যা',

        shareCountHint:
            'বর্তমান শেয়ার',

        weeklyAmount:
            'সাপ্তাহিক জমার পরিমাণ',

        weeklyAmountDescription:
            'প্রতি সপ্তাহে জমা দিতে হবে',

        lastDeposit:
            'সর্বশেষ জমা',

        lastDepositWeek:
            'সর্বশেষ জমার সপ্তাহ',

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
            'Savings',

        appSubtitle:
            'Cooperative Society',

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
            'Language',

        bangla:
            'বাংলা',

        english:
            'EN',

        logout:
            'Logout',

        memberId:
            'Member ID',

        totalDeposit:
            'Total Deposit',

        totalDepositDescription:
            'Weekly Deposit + Advance',

        weekly:
            'Weekly',

        advance:
            'Advance',

        due:
            'Due',

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

        shareCountHint:
            'Current shares',

        weeklyAmount:
            'Weekly Deposit Amount',

        weeklyAmountDescription:
            'Amount to deposit every week',

        lastDeposit:
            'Last Deposit',

        lastDepositWeek:
            'Last Deposit Week',

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

            clearCurrentMember();

            router.replace(
                '/member/login'
            );

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
                       TOTAL DEPOSIT
                       ========================================================== */}

                    <View
                        style={[
                            styles.mainCard,
                            styles.totalDepositCard,
                        ]}
                    >

                        <View
                            style={
                                styles.mainCardTop
                            }
                        >

                            <View>

                                <Text
                                    style={
                                        styles.mainCardLabel
                                    }
                                >
                                    {t.totalDeposit}
                                </Text>


                                <Text
                                    style={
                                        styles.mainCardDescription
                                    }
                                >
                                    {
                                        t.totalDepositDescription
                                    }
                                </Text>

                            </View>


                            <View
                                style={
                                    styles.mainIcon
                                }
                            >

                                <Ionicons
                                    name="wallet"
                                    size={25}
                                    color="#ffffff"
                                />

                            </View>

                        </View>


                        <Text
                            style={styles.mainAmount}
                        >
                            {formatMoney(
                                totalDeposit
                            )}
                        </Text>


                        <View
                            style={
                                styles.mainCardFooter
                            }
                        >

                            <Text
                                style={
                                    styles.footerAmountText
                                }
                            >
                                {t.weekly}{' '}
                                {formatMoney(
                                    summary.currentWeeklyPaid
                                )}
                            </Text>


                            <Text
                                style={
                                    styles.footerAmountText
                                }
                            >
                                {t.advance}{' '}
                                {formatMoney(
                                    advanceAmount
                                )}
                            </Text>

                        </View>

                    </View>


                    {/* ==========================================================
                       DUE + ADVANCE
                       ========================================================== */}

                    <View
                        style={styles.twoColumn}
                    >

                        {/* DUE */}

                        <View
                            style={[
                                styles.statCard,
                                styles.dueCard,
                            ]}
                        >

                            <View
                                style={
                                    styles.statCardHeader
                                }
                            >

                                <View
                                    style={[
                                        styles.statIcon,
                                        styles.dueIcon,
                                    ]}
                                >

                                    <Ionicons
                                        name="alert-circle-outline"
                                        size={21}
                                        color="#dc2626"
                                    />

                                </View>


                                <Text
                                    style={
                                        styles.statLabel
                                    }
                                >
                                    {t.due}
                                </Text>

                            </View>


                            <Text
                                style={[
                                    styles.statAmount,
                                    styles.dueAmount,
                                ]}
                            >
                                {formatMoney(
                                    dueAmount
                                )}
                            </Text>


                            <Text
                                style={
                                    styles.detailText
                                }
                            >
                                {t.dueAmount}
                            </Text>


                            <Text
                                style={
                                    styles.weekRangeText
                                }
                            >
                                {formatDueWeeks(
                                    summary,
                                    language,
                                    t
                                )}
                            </Text>

                        </View>


                        {/* ADVANCE */}

                        <View
                            style={[
                                styles.statCard,
                                styles.advanceCard,
                            ]}
                        >

                            <View
                                style={
                                    styles.statCardHeader
                                }
                            >

                                <View
                                    style={[
                                        styles.statIcon,
                                        styles.advanceIcon,
                                    ]}
                                >

                                    <Ionicons
                                        name="arrow-up-circle-outline"
                                        size={21}
                                        color="#2563eb"
                                    />

                                </View>


                                <Text
                                    style={
                                        styles.statLabel
                                    }
                                >
                                    {t.advance}
                                </Text>

                            </View>


                            <Text
                                style={[
                                    styles.statAmount,
                                    styles.advanceAmount,
                                ]}
                            >
                                {formatMoney(
                                    advanceAmount
                                )}
                            </Text>


                            <Text
                                style={
                                    styles.detailText
                                }
                            >
                                {t.advanceAmount}
                            </Text>


                            <Text
                                style={[
                                    styles.weekRangeText,
                                    styles.advanceWeekRangeText,
                                ]}
                            >
                                {formatAdvanceWeeks(
                                    summary,
                                    language,
                                    t
                                )}
                            </Text>

                        </View>

                    </View>


                    {/* ==========================================================
                       SHARE + WEEKLY AMOUNT
                       ========================================================== */}

                    <View
                        style={styles.twoColumn}
                    >

                        {/* SHARE */}

                        <View
                            style={
                                styles.smallCard
                            }
                        >

                            <View
                                style={
                                    styles.smallCardIcon
                                }
                            >

                                <Ionicons
                                    name="layers-outline"
                                    size={23}
                                    color="#0f172a"
                                />

                            </View>


                            <Text
                                style={
                                    styles.smallCardLabel
                                }
                            >
                                {t.shareCount}
                            </Text>


                            <Text
                                style={
                                    styles.smallCardValue
                                }
                            >
                                {
                                    member.currentShareCount ||
                                    0
                                }
                            </Text>


                            <Text
                                style={
                                    styles.smallCardHint
                                }
                            >
                                {t.shareCountHint}
                            </Text>

                        </View>


                        {/* WEEKLY AMOUNT */}

                        <View
                            style={
                                styles.smallCard
                            }
                        >

                            <View
                                style={
                                    styles.smallCardIcon
                                }
                            >

                                <Ionicons
                                    name="repeat-outline"
                                    size={23}
                                    color="#0f172a"
                                />

                            </View>


                            <Text
                                style={
                                    styles.smallCardLabel
                                }
                            >
                                {t.weeklyAmount}
                            </Text>


                            <Text
                                style={
                                    styles.smallCardValue
                                }
                            >
                                {formatMoney(
                                    member.currentWeeklyAmount
                                )}
                            </Text>


                            <Text
                                style={
                                    styles.smallCardHint
                                }
                            >
                                {t.weeklyAmountDescription}
                            </Text>

                        </View>

                    </View>


                    {/* ==========================================================
                       LAST DEPOSIT
                       ========================================================== */}

                    <View
                        style={
                            styles.lastDepositCard
                        }
                    >

                        <View
                            style={
                                styles.lastDepositLeft
                            }
                        >

                            <View
                                style={
                                    styles.lastDepositIcon
                                }
                            >

                                <Ionicons
                                    name="checkmark-circle-outline"
                                    size={23}
                                    color="#0f172a"
                                />

                            </View>


                            <View
                                style={
                                    styles.lastDepositTextContainer
                                }
                            >

                                <Text
                                    style={
                                        styles.lastDepositTitle
                                    }
                                >
                                    {t.lastDeposit}
                                </Text>


                                <Text
                                    style={
                                        styles.lastDepositDescription
                                    }
                                >
                                    {t.lastDepositWeek}
                                </Text>

                            </View>

                        </View>


                        <View
                            style={
                                styles.lastDepositRight
                            }
                        >

                            <Text
                                style={
                                    styles.lastDepositWeekValue
                                }
                            >
                                {t.week}{' '}
                                {summary.latestWeek || '-'}
                            </Text>


                            <Text
                                style={
                                    styles.lastDepositDate
                                }
                            >
                                {
                                    summary.lastPaymentDate
                                        ? formatDate(
                                            summary.lastPaymentDate,
                                            language
                                        )
                                        : '-'
                                }
                            </Text>

                        </View>

                    </View>


                    {/* ==========================================================
                       CURRENT + NEXT WEEK
                       ========================================================== */}

                    <View
                        style={
                            styles.weekProgressCard
                        }
                    >

                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            {t.weekStatus}
                        </Text>


                        <View
                            style={
                                styles.weekProgressRow
                            }
                        >

                            {/* CURRENT */}

                            <View
                                style={
                                    styles.currentWeekBox
                                }
                            >

                                <Text
                                    style={
                                        styles.weekBoxLabel
                                    }
                                >
                                    {
                                        t.currentWeek
                                    }
                                </Text>


                                <Text
                                    style={
                                        styles.currentWeekNumber
                                    }
                                >
                                    {t.week}{' '}
                                    {
                                        CURRENT_WEEK_NUMBER
                                    }
                                </Text>


                                <Text
                                    style={
                                        styles.currentWeekDate
                                    }
                                >
                                    {formatWeekDateRange(
                                        CURRENT_WEEK_START_DATE,
                                        CURRENT_WEEK_END_DATE,
                                        language
                                    )}
                                </Text>

                            </View>


                            {/* ARROW */}

                            <View
                                style={
                                    styles.weekArrow
                                }
                            >

                                <Ionicons
                                    name="arrow-forward"
                                    size={22}
                                    color="#94a3b8"
                                />

                            </View>


                            {/* NEXT */}

                            <View
                                style={
                                    styles.nextWeekBox
                                }
                            >

                                <Text
                                    style={
                                        styles.nextWeekLabel
                                    }
                                >
                                    {
                                        t.nextWeek
                                    }
                                </Text>


                                <Text
                                    style={
                                        styles.nextWeekNumber
                                    }
                                >
                                    {t.week}{' '}
                                    {
                                        NEXT_WEEK_NUMBER
                                    }
                                </Text>


                                <Text
                                    style={
                                        styles.nextWeekDate
                                    }
                                >
                                    {formatWeekDateRange(
                                        NEXT_WEEK_START_DATE,
                                        NEXT_WEEK_END_DATE,
                                        language
                                    )}
                                </Text>

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

    if (
        summary.dueFromWeek &&
        summary.dueToWeek
    ) {

        const range =
            summary.dueFromWeek ===
                summary.dueToWeek
                ? `${t.week} ${summary.dueFromWeek}`
                : `${t.week} ${summary.dueFromWeek} - ${summary.dueToWeek}`;


        if (
            summary.dueFromDate &&
            summary.dueToDate
        ) {

            return `${range} • ${formatDate(
                summary.dueFromDate,
                language
            )} - ${formatDate(
                summary.dueToDate,
                language
            )}`;

        }


        return range;

    }


    if (summary.dueWeeks) {

        return language === 'bn'
            ? `${summary.dueWeeks} সপ্তাহ বাকি`
            : `${summary.dueWeeks} weeks due`;

    }


    return '-';

}


function formatAdvanceWeeks(
    summary: ExtendedDashboardSummary,
    language: MemberLanguage,
    t: typeof translations.bn
) {

    if (
        summary.advanceFromWeek &&
        summary.advanceToWeek
    ) {

        const range =
            summary.advanceFromWeek ===
                summary.advanceToWeek
                ? `${t.week} ${summary.advanceFromWeek}`
                : `${t.week} ${summary.advanceFromWeek} - ${summary.advanceToWeek}`;


        if (
            summary.advanceUntilDate
        ) {

            return `${range} • ${t.until} ${formatDate(
                summary.advanceUntilDate,
                language
            )}`;

        }


        if (
            summary.advanceFromDate &&
            summary.advanceToDate
        ) {

            return `${range} • ${formatDate(
                summary.advanceFromDate,
                language
            )} - ${formatDate(
                summary.advanceToDate,
                language
            )}`;

        }


        return range;

    }


    if (summary.advanceWeeks) {

        return language === 'bn'
            ? `${summary.advanceWeeks} সপ্তাহ এডভান্স`
            : `${summary.advanceWeeks} weeks advance`;

    }


    /*
     * এখানে currentAdvance ব্যবহার করে historical advance-কে
     * active dashboard advance হিসেবে দেখানো হবে না।
     */
    if (
        Number(summary.advanceAmount || 0) > 0
    ) {

        return language === 'bn'
            ? 'এডভান্স সক্রিয় আছে'
            : 'Advance is active';

    }


    return '-';

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
        paddingBottom: 30,
    },


    container: {
        width: '100%',
        maxWidth: 600,
        alignSelf: 'center',
        paddingHorizontal: 18,
        paddingTop: 22,
    },


    /* =========================================================================
       TOTAL DEPOSIT
       ========================================================================= */

    mainCard: {
        borderRadius: 18,
        padding: 20,
        backgroundColor: '#0f172a',
    },


    totalDepositCard: {
        shadowColor: '#000000',
        shadowOpacity: 0.10,
        shadowRadius: 12,
        shadowOffset: {
            width: 0,
            height: 5,
        },
        elevation: 4,
    },


    mainCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },


    mainCardLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#cbd5e1',
    },


    mainCardDescription: {
        marginTop: 3,
        fontSize: 11,
        color: '#94a3b8',
    },


    mainIcon: {
        width: 45,
        height: 45,
        borderRadius: 13,
        backgroundColor: '#1e293b',
        alignItems: 'center',
        justifyContent: 'center',
    },


    mainAmount: {
        marginTop: 13,
        fontSize: 32,
        fontWeight: '900',
        color: '#ffffff',
    },


    mainCardFooter: {
        marginTop: 10,
        paddingTop: 13,
        borderTopWidth: 1,
        borderTopColor: '#334155',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },


    footerAmountText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#cbd5e1',
    },


    /* =========================================================================
       TWO COLUMN
       ========================================================================= */

    twoColumn: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },


    statCard: {
        flex: 1,
        minHeight: 172,
        borderRadius: 16,
        padding: 16,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },


    dueCard: {
        borderColor: '#fecaca',
        backgroundColor: '#fff7f7',
    },


    advanceCard: {
        borderColor: '#bfdbfe',
        backgroundColor: '#f8fbff',
    },


    statCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },


    statIcon: {
        width: 38,
        height: 38,
        borderRadius: 11,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 9,
    },


    dueIcon: {
        backgroundColor: '#fee2e2',
    },


    advanceIcon: {
        backgroundColor: '#dbeafe',
    },


    statLabel: {
        flex: 1,
        fontSize: 11,
        fontWeight: '700',
        lineHeight: 16,
        color: '#475569',
    },


    statAmount: {
        marginTop: 15,
        fontSize: 21,
        fontWeight: '900',
        color: '#0f172a',
    },


    dueAmount: {
        color: '#dc2626',
    },


    advanceAmount: {
        color: '#2563eb',
    },


    detailText: {
        marginTop: 5,
        fontSize: 9,
        color: '#64748b',
    },


    weekRangeText: {
        marginTop: 7,
        fontSize: 9,
        lineHeight: 14,
        fontWeight: '700',
        color: '#b91c1c',
    },


    advanceWeekRangeText: {
        color: '#2563eb',
    },


    /* =========================================================================
       SMALL CARDS
       ========================================================================= */

    smallCard: {
        flex: 1,
        minHeight: 150,
        padding: 17,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },


    smallCardIcon: {
        width: 40,
        height: 40,
        borderRadius: 11,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },


    smallCardLabel: {
        marginTop: 11,
        fontSize: 11,
        fontWeight: '700',
        color: '#64748b',
    },


    smallCardValue: {
        marginTop: 3,
        fontSize: 22,
        fontWeight: '900',
        color: '#0f172a',
    },


    smallCardHint: {
        marginTop: 1,
        fontSize: 9,
        color: '#94a3b8',
    },


    /* =========================================================================
       LAST DEPOSIT
       ========================================================================= */

    lastDepositCard: {
        marginTop: 12,
        padding: 17,
        minHeight: 78,
        borderRadius: 16,
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
        width: 43,
        height: 43,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 11,
    },


    lastDepositTextContainer: {
        flex: 1,
    },


    lastDepositTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#334155',
    },


    lastDepositDescription: {
        marginTop: 3,
        fontSize: 9,
        color: '#94a3b8',
    },


    lastDepositRight: {
        alignItems: 'flex-end',
    },


    lastDepositWeekValue: {
        fontSize: 13,
        fontWeight: '900',
        color: '#0f172a',
    },


    lastDepositDate: {
        marginTop: 3,
        fontSize: 9,
        color: '#64748b',
    },


    /* =========================================================================
       WEEK STATUS
       ========================================================================= */

    weekProgressCard: {
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


    weekProgressRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },


    currentWeekBox: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },


    nextWeekBox: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#fff7f7',
        borderWidth: 1,
        borderColor: '#fecaca',
    },


    weekArrow: {
        width: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },


    weekBoxLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: '#64748b',
    },


    currentWeekNumber: {
        marginTop: 5,
        fontSize: 16,
        fontWeight: '900',
        color: '#0f172a',
    },


    currentWeekDate: {
        marginTop: 3,
        fontSize: 10,
        color: '#64748b',
    },


    nextWeekLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: '#dc2626',
    },


    nextWeekNumber: {
        marginTop: 5,
        fontSize: 16,
        fontWeight: '900',
        color: '#dc2626',
    },


    nextWeekDate: {
        marginTop: 3,
        fontSize: 10,
        color: '#ef4444',
    },


    bottomSpacing: {
        height: 25,
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


    /* =========================================================================
       LANGUAGE
       ========================================================================= */

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


    /* =========================================================================
       LOGOUT
       ========================================================================= */

    logoutButton: {
        minHeight: 42,
        borderRadius: 9,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
    },


    logoutButtonPressed: {
        opacity: 0.65,
    },


    logoutText: {
        marginLeft: 10,
        fontSize: 11,
        fontWeight: '800',
        color: '#dc2626',
    },

});