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

import { SafeAreaView } from 'react-native-safe-area-context';

import {
    router,
    useFocusEffect,
} from 'expo-router';

import {
    getAdminLanguage,
    setAdminLanguage,
    AdminLanguage,
} from '../../lib/admin-language';

import {
    getAdminProfile,
    getCurrentAdmin,
    clearCurrentAdmin,
    getAdminAuthHeaders,
    restoreAdminSession,
} from '../../lib/admin-api';


/* ==========================================================================
   API CONFIG
   ========================================================================== */

const API_URL =
    process.env.EXPO_PUBLIC_API_URL;

/* ==========================================================================
   TYPES
   ========================================================================== */

type DashboardData = {
    totalDeposit: number;
    totalWeeklyDeposit: number;
    totalAdvance: number;
    totalMembers: number;
    totalShares: number;
    weeklyDepositAmount: number;
    currentWeek: number;
    currentWeekDate: string;
    nextWeek: number;
    nextWeekDate: string;
};

type DashboardApiResponse = {
    success: boolean;
    message: string;
    data?: DashboardData;
};


/* ==========================================================================
   TRANSLATIONS
   ========================================================================== */

const translations = {

    bn: {

        appName: 'ক্ষুদ্র সঞ্চয়',

        appSubtitle: 'সমবায় সমিতি',

        adminPanel: 'অ্যাডমিন প্যানেল',

        dashboard: 'ড্যাশবোর্ড',

        totalDeposit: 'মোট জমা টাকার পরিমান',

        totalDepositDescription:
            'মোট সাপ্তাহিক জমা + মোট এডভান্স',

        weekly: 'সাপ্তাহিক',

        advance: 'এডভান্স',

        totalWeeklyDeposit:
            'সাপ্তাহিক জমা',

        week: 'সপ্তাহ',

        totalAdvance: 'মোট এডভান্স',

        totalAdvanceBalance:
            'মোট এডভান্স ব্যালেন্স',

        totalMembers: 'মোট সদস্য',

        totalMembersHint:
            'মোট সদস্য সংখ্যা',

        totalShares: 'মোট শেয়ার',

        totalSharesHint:
            'মোট শেয়ার সংখ্যা',

        weeklyDepositAmount:
            'সাপ্তাহিক জমার পরিমাণ',

        weeklyDepositDescription:
            'প্রতি সপ্তাহে মোট জমা হওয়ার কথা',

        weekStatus: 'সপ্তাহের অবস্থা',

        currentWeekLabel:
            'বর্তমান সপ্তাহ',

        nextWeekLabel:
            'পরবর্তী সপ্তাহ',

        profile: 'প্রোফাইল',

        changeEmail: 'ইমেইল পরিবর্তন',

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

        bangla: 'বাংলা',

        english: 'English',

        logout: 'লগআউট',

        adminId: 'অ্যাডমিন ID',

        loading:
            'ড্যাশবোর্ডের তথ্য লোড হচ্ছে...',

        loadFailed:
            'ড্যাশবোর্ডের তথ্য লোড করা যায়নি',

        retry: 'আবার চেষ্টা করুন',

        connectionError:
            'Server-এর সাথে সংযোগ করা যাচ্ছে না',
    },


    en: {

        appName: 'ক্ষুদ্র সঞ্চয়',

        appSubtitle: 'সমবায় সমিতি',

        adminPanel: 'Admin Panel',

        dashboard: 'Dashboard',

        totalDeposit: 'Total Deposit',

        totalDepositDescription:
            'Weekly Deposit + Advance',

        weekly: 'Weekly',

        advance: 'Advance',

        totalWeeklyDeposit:
            'Total Weekly Deposit',

        week: 'Week',

        totalAdvance: 'Total Advance',

        totalAdvanceBalance:
            'Total Advance Balance',

        totalMembers: 'Total Members',

        totalMembersHint:
            'Number of Members',

        totalShares: 'Total Shares',

        totalSharesHint:
            'Number of Shares',

        weeklyDepositAmount:
            'Weekly Deposit Amount',

        weeklyDepositDescription:
            'Expected total deposit per week',

        weekStatus: 'Week Status',

        currentWeekLabel:
            'Current Week',

        nextWeekLabel:
            'Next Week',

        profile: 'Profile',

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

        bangla: 'বাংলা',

        english: 'English',

        logout: 'Logout',

        adminId: 'Admin ID',

        loading:
            'Loading dashboard data...',

        loadFailed:
            'Failed to load dashboard data',

        retry: 'Retry',

        connectionError:
            'Unable to connect to server',
    },

};


/* ==========================================================================
   SCREEN
   ========================================================================== */

export default function AdminDashboardScreen() {

    /* ----------------------------------------------------------------------
       MENU STATE
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
    ] = useState<AdminLanguage>('bn');


    const t = translations[language];


    /* ----------------------------------------------------------------------
       ADMIN
       ---------------------------------------------------------------------- */

    const currentAdmin = getCurrentAdmin();


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
        currentAdmin?.adminId || ''
    );


    /* ----------------------------------------------------------------------
       DASHBOARD API STATE
       ---------------------------------------------------------------------- */

    const [
        dashboard,
        setDashboard,
    ] = useState<DashboardData | null>(null);


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
    ] = useState<string | null>(null);


    /* ==========================================================================
       LOAD LANGUAGE
       ========================================================================== */

    useEffect(() => {

        const loadLanguage = async () => {

            try {

                const savedLanguage =
                    await getAdminLanguage();

                setLanguage(
                    savedLanguage
                );

            } catch (error) {

                console.error(
                    'Admin language load error:',
                    error
                );

            }

        };

        loadLanguage();

    }, []);


    /* ==========================================================================
       CHANGE LANGUAGE
       ========================================================================== */

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


    /* ==========================================================================
       LOAD DASHBOARD
       ========================================================================== */

    const loadDashboard = useCallback(
        async (
            showLoading = true
        ) => {

            try {

                if (showLoading) {
                    setLoading(true);
                }

                setError(null);

                console.log(
                    'Loading admin dashboard...'
                );


                await restoreAdminSession();

                const sessionAdmin =
                    getCurrentAdmin();

                console.log(
                    'Admin dashboard request:',
                    {
                        adminId:
                            sessionAdmin?.adminId,
                        hasSessionToken:
                            Object.keys(
                                getAdminAuthHeaders()
                            ).length > 0,
                    }
                );

                const response =
                    await fetch(
                        `${API_URL}/api/admin/dashboard`,
                        {
                            method: 'GET',

                            headers: {
                                Accept:
                                    'application/json',

                                ...getAdminAuthHeaders(),
                            },
                        }
                    );


                const contentType =
                    response.headers.get(
                        'content-type'
                    ) || '';


                if (
                    !contentType.includes(
                        'application/json'
                    )
                ) {

                    const text =
                        await response.text();

                    console.error(
                        'Dashboard non-JSON response:',
                        text
                    );

                    throw new Error(
                        'Invalid server response'
                    );

                }


                const result:
                    DashboardApiResponse =
                    await response.json();


                console.log(
                    'Dashboard API response:',
                    result
                );


                if (
                    !response.ok ||
                    !result.success
                ) {

                    throw new Error(
                        result.message ||
                        'Dashboard data loading failed'
                    );

                }


                if (!result.data) {

                    throw new Error(
                        'Dashboard data পাওয়া যায়নি'
                    );

                }


                setDashboard(
                    result.data
                );


            } catch (error) {

                console.error(
                    'Dashboard API error:',
                    error
                );


                if (
                    error instanceof Error &&
                    error.message ===
                    'Dashboard data পাওয়া যায়নি'
                ) {

                    setError(
                        error.message
                    );

                } else {

                    setError(
                        t.connectionError
                    );

                }

            } finally {

                if (showLoading) {
                    setLoading(false);
                }

            }

        },
        [t.connectionError]
    );


    /* ==========================================================================
       LOAD LATEST ADMIN PROFILE
       ========================================================================== */

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

                            console.warn(
                                'No current admin session found'
                            );

                            return;

                        }


                        console.log(
                            'Loading latest admin profile:',
                            sessionAdmin.adminId
                        );


                        const result =
                            await getAdminProfile(
                                sessionAdmin.adminId
                            );


                        if (!isMounted) {
                            return;
                        }


                        if (!result.success) {

                            console.error(
                                'Admin profile refresh failed:',
                                result.message
                            );

                            return;

                        }


                        const latestProfile =
                            result.profile;


                        setAdminName(
                            latestProfile.adminName ||
                            'Admin'
                        );


                        setAdminId(
                            latestProfile.adminId ||
                            sessionAdmin.adminId
                        );


                        console.log(
                            'Dashboard admin profile updated:',
                            latestProfile
                        );


                    } catch (error) {

                        console.error(
                            'Admin profile refresh error:',
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


    /* ==========================================================================
       INITIAL DASHBOARD LOAD
       ========================================================================== */

    useEffect(() => {

        loadDashboard();

    }, [loadDashboard]);


    /* ==========================================================================
       REFRESH
       ========================================================================== */

    const handleRefresh = async () => {

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

    const closeMenu = (
        callback?: () => void
    ) => {

        if (!menuMounted) {

            if (callback) {
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


            if (callback) {
                callback();
            }

        });

    };


    /* ==========================================================================
       MENU PRESS
       ========================================================================== */

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


    /* ==========================================================================
       LOGOUT
       ========================================================================== */

    const handleLogout = () => {

        closeMenu(async () => {

            await clearCurrentAdmin();

            router.replace(
                '/admin/login'
            );

        });

    };


    /* ==========================================================================
       FORMAT NUMBER
       ========================================================================== */

    const formatAmount = (
        value: number
    ) => {

        return Number(
            value || 0
        ).toLocaleString(
            'en-BD'
        );

    };


    /* ==========================================================================
       LOADING SCREEN
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
                                style={styles.appName}
                            >
                                {t.appName}
                            </Text>


                            <Text
                                style={styles.appSubtitle}
                            >
                                {t.appSubtitle}
                            </Text>

                        </View>

                    </View>


                    <View
                        style={styles.adminInfo}
                    >

                        <Text
                            style={styles.adminName}
                            numberOfLines={1}
                        >
                            {adminName}
                        </Text>


                        <Text
                            style={styles.adminId}
                        >
                            {t.adminId}: {adminId}
                        </Text>

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
       ERROR SCREEN
       ========================================================================== */

    if (
        error &&
        !dashboard
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
                                style={styles.appName}
                            >
                                {t.appName}
                            </Text>


                            <Text
                                style={styles.appSubtitle}
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
                            style={styles.retryButtonText}
                        >
                            {t.retry}
                        </Text>

                    </Pressable>

                </View>

            </SafeAreaView>

        );

    }


    /* ==========================================================================
       MAIN RETURN
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

            {/* HEADER */}

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
                            style={styles.appSubtitle}
                        >
                            {t.appSubtitle}
                        </Text>

                    </View>

                </View>


                <View
                    style={styles.adminInfo}
                >

                    <Text
                        style={styles.adminName}
                        numberOfLines={1}
                    >
                        {adminName}
                    </Text>


                    <Text
                        style={styles.adminId}
                    >
                        {t.adminId}: {adminId}
                    </Text>

                </View>

            </View>


            {/* DASHBOARD */}

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                    />
                }
                contentContainerStyle={
                    styles.scrollContent
                }
            >

                <View
                    style={styles.container}
                >

                    {/* TOTAL DEPOSIT */}

                    <View
                        style={[
                            styles.mainCard,
                            styles.totalDepositCard,
                        ]}
                    >

                        <View
                            style={styles.mainCardTop}
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
                                    {t.totalDepositDescription}
                                </Text>

                            </View>


                            <View
                                style={styles.mainIcon}
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
                            ৳{' '}
                            {formatAmount(
                                dashboard?.totalDeposit  || 0
                            )}
                        </Text>


                        <View
                            style={styles.mainCardFooter}
                        >

                            <Text
                                style={
                                    styles.footerAmountText
                                }
                            >
                                {t.weekly} ৳{' '}
                                {formatAmount(
                                    dashboard?.totalWeeklyDeposit ||
                                    0
                                )}
                            </Text>


                            <Text
                                style={
                                    styles.footerAmountText
                                }
                            >
                                {t.advance} ৳{' '}
                                {formatAmount(
                                    dashboard?.totalAdvance ||
                                    0
                                )}
                            </Text>

                        </View>

                    </View>


                    {/* WEEKLY + ADVANCE */}

                    <View
                        style={styles.twoColumn}
                    >

                        {/* WEEKLY */}

                        <View
                            style={[
                                styles.statCard,
                                styles.weeklyCard,
                            ]}
                        >

                            <View
                                style={
                                    styles.statCardHeader
                                }
                            >

                                <View
                                    style={styles.statIcon}
                                >

                                    <Ionicons
                                        name="cash-outline"
                                        size={21}
                                        color="#0f172a"
                                    />

                                </View>


                                <Text
                                    style={styles.statLabel}
                                >
                                    {
                                        t.totalWeeklyDeposit
                                    }
                                </Text>

                            </View>


                            <Text
                                style={styles.statAmount}
                            >
                                ৳{' '}
                                {formatAmount(
                                    dashboard?.weeklyDepositAmount  ||
                                    0
                                )}
                            </Text>


                            <View
                                style={styles.weekInfo}
                            >

                                <Text
                                    style={
                                        styles.weekInfoText
                                    }
                                >
                                    {t.week}{' '}
                                    {
                                        dashboard?.currentWeek ||
                                        0
                                    }
                                </Text>


                                <Text
                                    style={
                                        styles.weekInfoText
                                    }
                                >
                                    {
                                        dashboard?.currentWeekDate ||
                                        '-'
                                    }
                                </Text>

                            </View>

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
                                    style={styles.statLabel}
                                >
                                    {t.totalAdvance}
                                </Text>

                            </View>


                            <Text
                                style={[
                                    styles.statAmount,
                                    styles.advanceAmount,
                                ]}
                            >
                                ৳{' '}
                                {formatAmount(
                                    dashboard?.totalAdvance ||
                                    0
                                )}
                            </Text>


                            <Text
                                style={
                                    styles.advanceDescription
                                }
                            >
                                {
                                    t.totalAdvanceBalance
                                }
                            </Text>

                        </View>

                    </View>


                    {/* MEMBERS + SHARES */}

                    <View
                        style={styles.twoColumn}
                    >

                        {/* MEMBERS */}

                        <View
                            style={styles.smallCard}
                        >

                            <View
                                style={
                                    styles.smallCardIcon
                                }
                            >

                                <Ionicons
                                    name="people-outline"
                                    size={23}
                                    color="#0f172a"
                                />

                            </View>


                            <Text
                                style={
                                    styles.smallCardLabel
                                }
                            >
                                {t.totalMembers}
                            </Text>


                            <Text
                                style={
                                    styles.smallCardValue
                                }
                            >
                                {
                                    dashboard?.totalMembers ||
                                    0
                                }
                            </Text>


                            <Text
                                style={
                                    styles.smallCardHint
                                }
                            >
                                {t.totalMembersHint}
                            </Text>

                        </View>


                        {/* SHARES */}

                        <View
                            style={styles.smallCard}
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
                                {t.totalShares}
                            </Text>


                            <Text
                                style={
                                    styles.smallCardValue
                                }
                            >
                                {
                                    dashboard?.totalShares ||
                                    0
                                }
                            </Text>


                            <Text
                                style={
                                    styles.smallCardHint
                                }
                            >
                                {t.totalSharesHint}
                            </Text>

                        </View>

                    </View>


                    {/* WEEKLY AMOUNT */}

                    <View
                        style={
                            styles.weeklyAmountCard
                        }
                    >

                        <View
                            style={
                                styles.weeklyAmountLeft
                            }
                        >

                            <View
                                style={
                                    styles.weeklyAmountIcon
                                }
                            >

                                <Ionicons
                                    name="repeat-outline"
                                    size={23}
                                    color="#0f172a"
                                />

                            </View>


                            <View>

                                <Text
                                    style={
                                        styles.weeklyAmountTitle
                                    }
                                >
                                    {
                                        t.weeklyDepositAmount
                                    }
                                </Text>


                                <Text
                                    style={
                                        styles.weeklyAmountDescription
                                    }
                                >
                                    {
                                        t.weeklyDepositDescription
                                    }
                                </Text>

                            </View>

                        </View>


                        <Text
                            style={
                                styles.weeklyAmountValue
                            }
                        >
                            ৳{' '}
                            {formatAmount(
                                (dashboard?.totalShares || 0) * 50
                            )}
                        </Text>

                    </View>


                    {/* WEEK PROGRESS */}

                    <View
                        style={
                            styles.weekProgressCard
                        }
                    >

                        <Text
                            style={styles.sectionTitle}
                        >
                            {t.weekStatus}
                        </Text>


                        <View
                            style={
                                styles.weekProgressRow
                            }
                        >

                            {/* CURRENT WEEK */}

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
                                        t.currentWeekLabel
                                    }
                                </Text>


                                <Text
                                    style={
                                        styles.currentWeekNumber
                                    }
                                >
                                    {t.week}{' '}
                                    {
                                        dashboard?.currentWeek ||
                                        0
                                    }
                                </Text>


                                <Text
                                    style={
                                        styles.currentWeekDate
                                    }
                                >
                                    {
                                        dashboard?.currentWeekDate ||
                                        '-'
                                    }
                                </Text>

                            </View>


                            {/* ARROW */}

                            <View
                                style={styles.weekArrow}
                            >

                                <Ionicons
                                    name="arrow-forward"
                                    size={22}
                                    color="#94a3b8"
                                />

                            </View>


                            {/* NEXT WEEK */}

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
                                        t.nextWeekLabel
                                    }
                                </Text>


                                <Text
                                    style={
                                        styles.nextWeekNumber
                                    }
                                >
                                    {t.week}{' '}
                                    {
                                        dashboard?.nextWeek ||
                                        0
                                    }
                                </Text>


                                <Text
                                    style={
                                        styles.nextWeekDate
                                    }
                                >
                                    {
                                        dashboard?.nextWeekDate ||
                                        '-'
                                    }
                                </Text>

                            </View>

                        </View>

                    </View>


                    <View
                        style={styles.bottomSpacing}
                    />

                </View>

            </ScrollView>


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


                                {/* CLOSE */}

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

                                <View style={styles.firstMenuItem}>
                                    <MenuItem
                                        icon="grid-outline"
                                        label={t.dashboard}
                                        active={true}
                                        onPress={() =>
                                            closeMenu()
                                        }
                                    />
                                </View>


                                {/* PROFILE */}

                                <MenuItem
                                    icon="person-outline"
                                    label={t.profile}
                                    onPress={() =>
                                        handleMenuPress(
                                            '/admin/profile'
                                        )
                                    }
                                />


                                {/* CHANGE EMAIL */}

                                <MenuItem
                                    icon="mail-outline"
                                    label={t.changeEmail}
                                    onPress={() =>
                                        handleMenuPress(
                                            '/admin/change-email'
                                        )
                                    }
                                />


                                {/* CHANGE PASSWORD */}

                                <MenuItem
                                    icon="lock-closed-outline"
                                    label={t.changePassword}
                                    onPress={() =>
                                        handleMenuPress(
                                            '/admin/change-password'
                                        )
                                    }
                                />


                                <MenuDivider />


                                {/* COLLECTION */}

                                <MenuItem
                                    icon="notifications-outline"
                                    label={t.weeklyRequest}
                                    onPress={() =>
                                        handleMenuPress(
                                            '/admin/weekly-request'
                                        )
                                    }
                                />


                                <MenuItem
                                    icon="cash-outline"
                                    label={t.weeklyDeposit}
                                    onPress={() =>
                                        handleMenuPress(
                                            '/admin/weekly-deposit'
                                        )
                                    }
                                />


                                <MenuItem
                                    icon="time-outline"
                                    label={t.weeklyHistory}
                                    onPress={() =>
                                        handleMenuPress(
                                            '/admin/weekly-deposit-history'
                                        )
                                    }
                                />


                                <MenuDivider />


                                {/* ACCOUNT MANAGEMENT */}

                                <MenuItem
                                    icon="person-add-outline"
                                    label={t.createAdmin}
                                    onPress={() =>
                                        handleMenuPress(
                                            '/admin/create-admin'
                                        )
                                    }
                                />


                                <MenuItem
                                    icon="people-outline"
                                    label={t.createMember}
                                    onPress={() =>
                                        handleMenuPress(
                                            '/admin/create-member'
                                        )
                                    }
                                />


                                <MenuItem
                                    icon="log-in-outline"
                                    label={t.accessMember}
                                    onPress={() =>
                                        handleMenuPress(
                                            '/admin/access-member'
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

    const pressAnimation =
        useRef(
            new Animated.Value(
                active ? 1 : 0
            )
        ).current;


    const handlePressIn = () => {

        if (active) {
            return;
        }

        Animated.timing(
            pressAnimation,
            {
                toValue: 1,
                duration: 120,
                easing: Easing.out(
                    Easing.quad
                ),
                useNativeDriver: false,
            }
        ).start();

    };


    const handlePressOut = () => {

        if (active) {
            return;
        }

        Animated.timing(
            pressAnimation,
            {
                toValue: 0,
                duration: 180,
                easing: Easing.out(
                    Easing.quad
                ),
                useNativeDriver: false,
            }
        ).start();

    };


    const backgroundColor =
        pressAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [
                'rgba(15, 23, 42, 0)',
                '#0f172a',
            ],
        });


    const color =
        pressAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [
                '#475569',
                '#ffffff',
            ],
        });


    return (

        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
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

                <Animated.Text
                    style={[
                        styles.menuItemIcon,
                        {
                            color:
                                active
                                    ? '#ffffff'
                                    : color,
                        },
                    ]}
                >
                    <Ionicons
                        name={icon}
                        size={20}
                    />
                </Animated.Text>


                <Animated.Text
                    style={[
                        styles.menuItemText,
                        {
                            color:
                                active
                                    ? '#ffffff'
                                    : color,
                        },
                    ]}
                >
                    {label}
                </Animated.Text>

            </Animated.View>

        </Pressable>

    );

}

/* ==========================================================================
   ANIMATED IONICON
   ========================================================================== */

type AnimatedIonIconProps = {

    name: React.ComponentProps<
        typeof Ionicons
    >['name'];

    size: number;

    color: Animated.AnimatedInterpolation<
        string
    >;

};


function AnimatedIonIcon({
    name,
    size,
    color,
}: AnimatedIonIconProps) {

    return (

        <Animated.View>

            <Ionicons
                name={name}
                size={size}
                color="#475569"
            />

            <Animated.View
                pointerEvents="none"
                style={
                    styles.animatedIconOverlay
                }
            >

                <Ionicons
                    name={name}
                    size={size}
                    color="#ffffff"
                />

            </Animated.View>

        </Animated.View>

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
   STYLES
   ========================================================================== */

const styles = StyleSheet.create({

    safeArea: {
        flex: 1,
        backgroundColor: '#f6f8fb',
    },


    /* HEADER */

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


    adminInfo: {
        maxWidth: 145,
        alignItems: 'flex-end',
    },


    adminName: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0f172a',
    },


    adminId: {
        marginTop: 2,
        fontSize: 10,
        color: '#64748b',
    },


    /* STATE */

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


    /* DASHBOARD */

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


    /* TOTAL DEPOSIT */

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
        height: 30,
        borderRadius: 13,
        backgroundColor: '#1e293b',
        alignItems: 'center',
        justifyContent: 'center',
    },


    mainAmount: {
        marginTop: 0,
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


    /* TWO COLUMN */

    twoColumn: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },


    statCard: {
        flex: 1,
        minHeight: 155,
        borderRadius: 16,
        padding: 16,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },


    weeklyCard: {
        shadowColor: '#000000',
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        elevation: 1,
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


    advanceAmount: {
        color: '#2563eb',
    },


    weekInfo: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },


    weekInfoText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#64748b',
    },


    advanceDescription: {
        marginTop: 10,
        fontSize: 9,
        color: '#64748b',
    },


    /* SMALL CARDS */

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
        fontSize: 26,
        fontWeight: '900',
        color: '#0f172a',
    },


    smallCardHint: {
        marginTop: 1,
        fontSize: 9,
        color: '#94a3b8',
    },


    /* WEEKLY AMOUNT */

    weeklyAmountCard: {
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


    weeklyAmountLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },


    weeklyAmountIcon: {
        width: 43,
        height: 43,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 11,
    },


    weeklyAmountTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#334155',
    },


    weeklyAmountDescription: {
        marginTop: 3,
        fontSize: 9,
        color: '#94a3b8',
    },


    weeklyAmountValue: {
        fontSize: 19,
        fontWeight: '900',
        color: '#0f172a',
    },


    /* WEEK PROGRESS */

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


    /* ==========================================================================
       DRAWER
       ========================================================================== */

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


    drawerLogoText: {
        color: '#ffffff',
        fontSize: 21,
        fontWeight: '800',
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


    menuScroll: {
        paddingHorizontal: 11,
        paddingBottom: 20,
    },


    /* ----------------------------------------------------------------------
       MENU ITEM

       Same visual behavior as profile.tsx:
       - active = dark background
       - inactive = light/transparent
       - pressed inactive = animated dark background
       ---------------------------------------------------------------------- */

    menuItem: {
        minHeight: 46,
        borderRadius: 10,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3,
    },
    menuItemIcon: {
        width: 20,
        height: 22,
        color: '#475569',
        alignItems: 'center',
        justifyContent: 'center',
    },

    menuItemText: {
        marginLeft: 12,
        fontSize: 12,
        fontWeight: '700',
        flex: 1,
    },


    menuItemIconContainer: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },


    animatedIconOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
    },


    menuDivider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 10,
        marginHorizontal: 7,
    },

    firstMenuItem: {
        marginTop: 10,
    },


    /* LANGUAGE */

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
        paddingVertical: 6,
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


    /* LOGOUT */

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