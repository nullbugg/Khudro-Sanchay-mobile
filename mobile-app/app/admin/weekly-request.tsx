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
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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
    getPendingAdminDeposits,
    approvePendingAdminDeposit,
    rejectPendingAdminDeposit,
    clearCurrentAdmin,
} from '../../lib/admin-api';


/* ==========================================================================
   TYPES
   ========================================================================== */

type PaymentMethod = 'cash' | 'bkash';


type PendingDeposit = {
    rowIndex?: number;

    requestId: string;

    memberId: string;

    memberName: string;

    shareCount: number;

    weeklyAmount: number;

    weeks: number;

    depositAmount: number;

    bkashCharge: number;

    payableAmount: number;

    paymentMethod: PaymentMethod;

    senderNumber: string;

    status: string;

    requestDate: string;

    approvedDate?: string;

    adminId?: string;

    notes?: string;
};


/* ==========================================================================
   TRANSLATIONS
   ========================================================================== */

const translations = {

    bn: {

        appName: 'ক্ষুদ্র সঞ্চয়',

        appSubtitle: 'সমবায় সমিতি',

        adminPanel: 'অ্যাডমিন প্যানেল',

        adminId: 'অ্যাডমিন ID',

        dashboard: 'ড্যাশবোর্ড',

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

        bangla:
            'বাংলা',

        english:
            'English',

        logout:
            'লগআউট',

        title:
            'সাপ্তাহিক জমার রিকোয়েস্ট',

        subtitle:
            'সদস্যদের জমার রিকোয়েস্ট অনুমোদন বা বাতিল করুন',

        refresh:
            'রিফ্রেশ',

        loading:
            'রিকোয়েস্ট লোড হচ্ছে...',

        pendingRequests:
            'পেন্ডিং রিকোয়েস্ট',

        noRequests:
            'কোনো পেন্ডিং রিকোয়েস্ট নেই',

        noSearchResults:
            'সার্চ অনুযায়ী কোনো রিকোয়েস্ট পাওয়া যায়নি',

        searchPlaceholder:
            'সদস্য ID অথবা নাম দিয়ে সার্চ করুন',

        member:
            'সদস্য',

        memberId:
            'সদস্য ID',

        memberName:
            'সদস্যের নাম',

        shares:
            'শেয়ার',

        weeklyAmount:
            'সাপ্তাহিক জমা',

        weeks:
            'সপ্তাহ',

        depositAmount:
            'জমার পরিমাণ',

        bkashCharge:
            'bKash চার্জ',

        payableAmount:
            'পরিশোধযোগ্য',

        paymentMethod:
            'পেমেন্ট পদ্ধতি',

        senderNumber:
            'প্রেরকের নম্বর',

        requestDate:
            'রিকোয়েস্টের তারিখ',

        status:
            'স্ট্যাটাস',

        cash:
            'ক্যাশ',

        bkash:
            'bKash',

        pending:
            'পেন্ডিং',

        approve:
            'অনুমোদন',

        reject:
            'বাতিল',

        approveTitle:
            'রিকোয়েস্ট অনুমোদন',

        approveMessage:
            'আপনি কি এই জমার রিকোয়েস্টটি অনুমোদন করতে চান?',

        rejectTitle:
            'রিকোয়েস্ট বাতিল',

        rejectMessage:
            'আপনি কি এই জমার রিকোয়েস্টটি বাতিল করতে চান?',

        rejectNotesPlaceholder:
            'বাতিল করার কারণ লিখুন (ঐচ্ছিক)',

        cancel:
            'বাতিল',

        confirm:
            'নিশ্চিত করুন',

        approving:
            'অনুমোদন করা হচ্ছে...',

        rejecting:
            'বাতিল করা হচ্ছে...',

        success:
            'সফল',

        error:
            'ত্রুটি',

        approveSuccess:
            'রিকোয়েস্ট সফলভাবে অনুমোদন করা হয়েছে',

        rejectSuccess:
            'রিকোয়েস্ট সফলভাবে বাতিল করা হয়েছে',

        loginRequired:
            'অ্যাডমিন লগইন প্রয়োজন',

        failedToLoad:
            'রিকোয়েস্ট লোড করা যায়নি',

        failedToApprove:
            'রিকোয়েস্ট অনুমোদন করা যায়নি',

        failedToReject:
            'রিকোয়েস্ট বাতিল করা যায়নি',

    },


    en: {

        appName:
            'ক্ষুদ্র সঞ্চয়',

        appSubtitle:
            'সমবায় সমিতি',

        adminPanel:
            'Admin Panel',

        adminId:
            'Admin ID',

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

        title:
            'Weekly Deposit Requests',

        subtitle:
            'Approve or reject member deposit requests',

        refresh:
            'Refresh',

        loading:
            'Loading requests...',

        pendingRequests:
            'Pending Requests',

        noRequests:
            'No pending requests',

        noSearchResults:
            'No requests found for your search',

        searchPlaceholder:
            'Search by member ID or name',

        member:
            'Member',

        memberId:
            'Member ID',

        memberName:
            'Member Name',

        shares:
            'Shares',

        weeklyAmount:
            'Weekly Deposit',

        weeks:
            'Weeks',

        depositAmount:
            'Deposit Amount',

        bkashCharge:
            'bKash Charge',

        payableAmount:
            'Payable Amount',

        paymentMethod:
            'Payment Method',

        senderNumber:
            'Sender Number',

        requestDate:
            'Request Date',

        status:
            'Status',

        cash:
            'Cash',

        bkash:
            'bKash',

        pending:
            'Pending',

        approve:
            'Approve',

        reject:
            'Reject',

        approveTitle:
            'Approve Request',

        approveMessage:
            'Do you want to approve this deposit request?',

        rejectTitle:
            'Reject Request',

        rejectMessage:
            'Do you want to reject this deposit request?',

        rejectNotesPlaceholder:
            'Enter rejection reason (optional)',

        cancel:
            'Cancel',

        confirm:
            'Confirm',

        approving:
            'Approving...',

        rejecting:
            'Rejecting...',

        success:
            'Success',

        error:
            'Error',

        approveSuccess:
            'Request approved successfully',

        rejectSuccess:
            'Request rejected successfully',

        loginRequired:
            'Admin login required',

        failedToLoad:
            'Failed to load requests',

        failedToApprove:
            'Failed to approve request',

        failedToReject:
            'Failed to reject request',

    },

};


/* ==========================================================================
   HELPERS
   ========================================================================== */

const formatCurrency = (
    value: number
) => {

    return Number(
        value || 0
    ).toLocaleString(
        'en-BD'
    );

};


const formatDate = (
    value: string
) => {

    if (!value) {
        return '-';
    }

    try {

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return value;
        }

        return date.toLocaleDateString(
            'en-GB'
        );

    } catch {

        return value;

    }

};


const getResultMessage = (
    result: any,
    fallback: string
) => {

    if (
        result &&
        typeof result.message === 'string' &&
        result.message.trim()
    ) {

        return result.message;

    }

    return fallback;

};


const getRequestsFromResult = (
    result: any
): PendingDeposit[] => {

    if (
        Array.isArray(result)
    ) {

        return result;

    }

    if (
        result &&
        Array.isArray(result.requests)
    ) {

        return result.requests;

    }

    if (
        result &&
        Array.isArray(result.data)
    ) {

        return result.data;

    }

    if (
        result &&
        result.data &&
        Array.isArray(result.data.requests)
    ) {

        return result.data.requests;

    }

    return [];

};


/* ==========================================================================
   SCREEN
   ========================================================================== */

export default function AdminWeeklyRequestScreen() {

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


    const t =
        translations[language];


    /* ----------------------------------------------------------------------
       ADMIN
       ---------------------------------------------------------------------- */

    const currentAdmin =
        getCurrentAdmin();


    const [
        adminName,
        setAdminName,
    ] = useState(
        currentAdmin?.adminName ||
        'Admin'
    );


    const [
        adminId,
        setAdminId,
    ] = useState(
        currentAdmin?.adminId ||
        ''
    );


    /* ----------------------------------------------------------------------
       REQUEST STATE
       ---------------------------------------------------------------------- */

    const [
        requests,
        setRequests,
    ] = useState<PendingDeposit[]>([]);


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        refreshing,
        setRefreshing,
    ] = useState(false);


    const [
        searchText,
        setSearchText,
    ] = useState('');


    /* ----------------------------------------------------------------------
       REJECT MODAL
       ---------------------------------------------------------------------- */

    const [
        rejectModalVisible,
        setRejectModalVisible,
    ] = useState(false);


    const [
        selectedRequest,
        setSelectedRequest,
    ] = useState<PendingDeposit | null>(
        null
    );


    const [
        rejectNotes,
        setRejectNotes,
    ] = useState('');


    const [
        rejecting,
        setRejecting,
    ] = useState(false);


    /* ----------------------------------------------------------------------
       APPROVE STATE
       ---------------------------------------------------------------------- */

    const [
        approvingRequestId,
        setApprovingRequestId,
    ] = useState<string | null>(
        null
    );


    /* ======================================================================
       LOAD LANGUAGE
       ====================================================================== */

    useEffect(() => {

        const loadLanguage =
            async () => {

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


    /* ======================================================================
       CHANGE LANGUAGE
       ====================================================================== */

    const changeLanguage =
        async (
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


    /* ======================================================================
       LOAD ADMIN PROFILE
       ====================================================================== */

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


                        if (
                            !result.success ||
                            !result.profile
                        ) {

                            return;

                        }


                        setAdminName(
                            result.profile.adminName ||
                            'Admin'
                        );


                        setAdminId(
                            result.profile.adminId ||
                            sessionAdmin.adminId
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


    /* ======================================================================
       LOAD REQUESTS
       ====================================================================== */

    const loadRequests =
        useCallback(
            async (
                showLoading = true
            ) => {

                try {

                    if (showLoading) {
                        setLoading(true);
                    }


                    const sessionAdmin =
                        getCurrentAdmin();


                    if (
                        !sessionAdmin?.adminId
                    ) {

                        throw new Error(
                            t.loginRequired
                        );

                    }


                    const result =
                        await getPendingAdminDeposits();


                    const loadedRequests =
                        getRequestsFromResult(
                            result
                        );


                    setRequests(
                        loadedRequests
                    );


                } catch (error) {

                    console.error(
                        'Weekly request loading error:',
                        error
                    );


                    const message =
                        error instanceof Error
                            ? error.message
                            : t.failedToLoad;


                    if (
                        message ===
                        t.loginRequired
                    ) {

                        Alert.alert(
                            t.error,
                            t.loginRequired
                        );

                    } else {

                        Alert.alert(
                            t.error,
                            message ||
                            t.failedToLoad
                        );

                    }

                } finally {

                    if (showLoading) {
                        setLoading(false);
                    }

                }

            },
            [
                t.error,
                t.failedToLoad,
                t.loginRequired,
            ]
        );


    /* ======================================================================
       INITIAL / FOCUS LOAD
       ====================================================================== */

    useFocusEffect(
        useCallback(() => {

            loadRequests(true);

        }, [loadRequests])
    );


    /* ======================================================================
       REFRESH
       ====================================================================== */

    const handleRefresh =
        async () => {

            setRefreshing(true);

            await loadRequests(false);

            setRefreshing(false);

        };


    /* ======================================================================
       SEARCH
       ====================================================================== */

    const filteredRequests =
        requests.filter(
            (request) => {

                const query =
                    searchText
                        .trim()
                        .toLowerCase();


                if (!query) {
                    return true;
                }


                return (
                    String(
                        request.memberId || ''
                    )
                        .toLowerCase()
                        .includes(query)
                    ||
                    String(
                        request.memberName || ''
                    )
                        .toLowerCase()
                        .includes(query)
                );

            }
        );


    /* ======================================================================
       OPEN MENU
       ====================================================================== */

    const openMenu = () => {

        if (menuMounted) {
            return;
        }


        setMenuMounted(true);


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
                        duration: 280,
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
                        duration: 230,
                        easing: Easing.out(
                            Easing.quad
                        ),
                        useNativeDriver: true,
                    }
                ),

            ]).start();

        });

    };


    /* ======================================================================
       CLOSE MENU
       ====================================================================== */

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


    /* ======================================================================
       MENU PRESS
       ====================================================================== */

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


    /* ======================================================================
       LOGOUT
       ====================================================================== */

    const handleLogout = () => {

        closeMenu(async () => {

            await clearCurrentAdmin();

            router.replace(
                '/admin/login'
            );

        });

    };


    /* ======================================================================
       APPROVE
       ====================================================================== */

    const handleApprove = (
        request: PendingDeposit
    ) => {

        Alert.alert(
            t.approveTitle,
            `${t.memberName}: ${request.memberName}\n${t.memberId}: ${request.memberId}\n${t.depositAmount}: ৳ ${formatCurrency(request.depositAmount)}\n${t.weeks}: ${request.weeks}`,
            [
                {
                    text: t.cancel,
                    style: 'cancel',
                },

                {
                    text: t.confirm,
                    onPress: async () => {

                        try {

                            setApprovingRequestId(
                                request.requestId
                            );


                            const result =
                                await approvePendingAdminDeposit(
                                    request.requestId
                                );


                            if (
                                !result ||
                                result.success === false
                            ) {

                                throw new Error(
                                    getResultMessage(
                                        result,
                                        t.failedToApprove
                                    )
                                );

                            }


                            setRequests(
                                (current) =>
                                    current.filter(
                                        (item) =>
                                            item.requestId !==
                                            request.requestId
                                    )
                            );


                            Alert.alert(
                                t.success,
                                getResultMessage(
                                    result,
                                    t.approveSuccess
                                )
                            );


                        } catch (error) {

                            console.error(
                                'Approve request error:',
                                error
                            );


                            Alert.alert(
                                t.error,
                                error instanceof Error
                                    ? error.message
                                    : t.failedToApprove
                            );

                        } finally {

                            setApprovingRequestId(
                                null
                            );

                        }

                    },
                },
            ]
        );

    };


    /* ======================================================================
       OPEN REJECT MODAL
       ====================================================================== */

    const openRejectModal = (
        request: PendingDeposit
    ) => {

        setSelectedRequest(
            request
        );

        setRejectNotes('');

        setRejectModalVisible(
            true
        );

    };


    /* ======================================================================
       CLOSE REJECT MODAL
       ====================================================================== */

    const closeRejectModal = () => {

        if (rejecting) {
            return;
        }

        setRejectModalVisible(
            false
        );

        setSelectedRequest(
            null
        );

        setRejectNotes('');

    };


    /* ======================================================================
       REJECT
       ====================================================================== */

    const handleReject = async () => {

        if (
            !selectedRequest ||
            rejecting
        ) {

            return;

        }


        try {

            setRejecting(true);


            const result =
                await rejectPendingAdminDeposit(
                    selectedRequest.requestId,
                    rejectNotes.trim()
                );


            if (
                !result ||
                result.success === false
            ) {

                throw new Error(
                    getResultMessage(
                        result,
                        t.failedToReject
                    )
                );

            }


            const rejectedRequestId =
                selectedRequest.requestId;


            setRequests(
                (current) =>
                    current.filter(
                        (item) =>
                            item.requestId !==
                            rejectedRequestId
                    )
            );


            setRejectModalVisible(
                false
            );

            setSelectedRequest(
                null
            );

            setRejectNotes('');


            Alert.alert(
                t.success,
                getResultMessage(
                    result,
                    t.rejectSuccess
                )
            );


        } catch (error) {

            console.error(
                'Reject request error:',
                error
            );


            Alert.alert(
                t.error,
                error instanceof Error
                    ? error.message
                    : t.failedToReject
            );

        } finally {

            setRejecting(false);

        }

    };


    /* ======================================================================
       LOADING
       ====================================================================== */

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


    /* ======================================================================
       MAIN
       ====================================================================== */

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


            {/* CONTENT */}

            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
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

                    {/* SEARCH */}

                    <View
                        style={styles.searchContainer}
                    >

                        <Ionicons
                            name="search-outline"
                            size={19}
                            color="#64748b"
                        />


                        <TextInput
                            value={searchText}
                            onChangeText={
                                setSearchText
                            }
                            placeholder={
                                t.searchPlaceholder
                            }
                            placeholderTextColor="#94a3b8"
                            style={
                                styles.searchInput
                            }
                            autoCapitalize="none"
                            autoCorrect={false}
                        />


                        {searchText.length > 0 && (

                            <Pressable
                                onPress={() =>
                                    setSearchText('')
                                }
                                style={
                                    styles.searchClear
                                }
                            >

                                <Ionicons
                                    name="close-circle"
                                    size={19}
                                    color="#94a3b8"
                                />

                            </Pressable>

                        )}

                    </View>


                    {/* COUNT */}

                    <View
                        style={styles.countRow}
                    >

                        <View
                            style={
                                styles.countBadge
                            }
                        >

                            <Ionicons
                                name="notifications-outline"
                                size={17}
                                color="#0f172a"
                            />

                            <Text
                                style={
                                    styles.countText
                                }
                            >
                                {t.pendingRequests}
                            </Text>

                        </View>


                        <Text
                            style={styles.countNumber}
                        >
                            {filteredRequests.length}
                        </Text>

                    </View>


                    {/* REQUESTS */}

                    {filteredRequests.length === 0 ? (

                        <View
                            style={styles.emptyCard}
                        >

                            <View
                                style={
                                    styles.emptyIcon
                                }
                            >

                                <Ionicons
                                    name={
                                        searchText.trim()
                                            ? 'search-outline'
                                            : 'checkmark-done-outline'
                                    }
                                    size={29}
                                    color="#64748b"
                                />

                            </View>


                            <Text
                                style={
                                    styles.emptyTitle
                                }
                            >
                                {
                                    searchText.trim()
                                        ? t.noSearchResults
                                        : t.noRequests
                                }
                            </Text>

                        </View>

                    ) : (

                        filteredRequests.map(
                            (request) => (

                                <View
                                    key={
                                        request.requestId
                                    }
                                    style={
                                        styles.requestCard
                                    }
                                >

                                    {/* CARD HEADER */}

                                    <View
                                        style={
                                            styles.requestHeader
                                        }
                                    >

                                        <View
                                            style={
                                                styles.memberHeader
                                            }
                                        >

                                            <View
                                                style={
                                                    styles.memberIcon
                                                }
                                            >

                                                <Ionicons
                                                    name="person-outline"
                                                    size={20}
                                                    color="#0f172a"
                                                />

                                            </View>


                                            <View
                                                style={
                                                    styles.memberHeaderText
                                                }
                                            >

                                                <Text
                                                    style={
                                                        styles.memberName
                                                    }
                                                    numberOfLines={1}
                                                >
                                                    {
                                                        request.memberName
                                                    }
                                                </Text>


                                                <Text
                                                    style={
                                                        styles.memberIdText
                                                    }
                                                >
                                                    {
                                                        t.memberId
                                                    }: {request.memberId}
                                                </Text>

                                            </View>

                                        </View>


                                        <View
                                            style={
                                                styles.pendingBadge
                                            }
                                        >

                                            <Text
                                                style={
                                                    styles.pendingBadgeText
                                                }
                                            >
                                                {t.pending}
                                            </Text>

                                        </View>

                                    </View>


                                    {/* DETAILS */}

                                    <View
                                        style={
                                            styles.details
                                        }
                                    >

                                        <View
                                            style={
                                                styles.detailRow
                                            }
                                        >

                                            <DetailItem
                                                icon="layers-outline"
                                                label={t.shares}
                                                value={String(
                                                    request.shareCount ??
                                                    0
                                                )}
                                            />


                                            <DetailItem
                                                icon="repeat-outline"
                                                label={
                                                    t.weeklyAmount
                                                }
                                                value={`৳ ${formatCurrency(
                                                    request.weeklyAmount
                                                )}`}
                                            />

                                        </View>


                                        <View
                                            style={
                                                styles.detailRow
                                            }
                                        >

                                            <DetailItem
                                                icon="calendar-outline"
                                                label={t.weeks}
                                                value={String(
                                                    request.weeks ??
                                                    0
                                                )}
                                            />


                                            <DetailItem
                                                icon="cash-outline"
                                                label={
                                                    t.depositAmount
                                                }
                                                value={`৳ ${formatCurrency(
                                                    request.depositAmount
                                                )}`}
                                            />

                                        </View>


                                        <View
                                            style={
                                                styles.detailRow
                                            }
                                        >

                                            <DetailItem
                                                icon="card-outline"
                                                label={
                                                    t.paymentMethod
                                                }
                                                value={
                                                    request.paymentMethod ===
                                                    'bkash'
                                                        ? t.bkash
                                                        : t.cash
                                                }
                                            />


                                            <DetailItem
                                                icon="time-outline"
                                                label={
                                                    t.requestDate
                                                }
                                                value={
                                                    formatDate(
                                                        request.requestDate
                                                    )
                                                }
                                            />

                                        </View>


                                        {/* BKASH ONLY */}

                                        {request.paymentMethod ===
                                            'bkash' && (

                                            <>

                                                <View
                                                    style={
                                                        styles.detailRow
                                                    }
                                                >

                                                    <DetailItem
                                                        icon="phone-portrait-outline"
                                                        label={
                                                            t.senderNumber
                                                        }
                                                        value={
                                                            request.senderNumber ||
                                                            '-'
                                                        }
                                                    />


                                                    <DetailItem
                                                        icon="receipt-outline"
                                                        label={
                                                            t.bkashCharge
                                                        }
                                                        value={`৳ ${formatCurrency(
                                                            request.bkashCharge
                                                        )}`}
                                                    />

                                                </View>


                                                <View
                                                    style={
                                                        styles.detailRow
                                                    }
                                                >

                                                    <DetailItem
                                                        icon="wallet-outline"
                                                        label={
                                                            t.payableAmount
                                                        }
                                                        value={`৳ ${formatCurrency(
                                                            request.payableAmount
                                                        )}`}
                                                    />

                                                    <View
                                                        style={
                                                            styles.detailItem
                                                        }
                                                    />

                                                </View>

                                            </>

                                        )}

                                    </View>


                                    {/* ACTIONS */}

                                    <View
                                        style={
                                            styles.actions
                                        }
                                    >

                                        <Pressable
                                            disabled={
                                                approvingRequestId !==
                                                null ||
                                                rejecting
                                            }
                                            onPress={() =>
                                                handleApprove(
                                                    request
                                                )
                                            }
                                            style={({ pressed }) => [
                                                styles.approveButton,

                                                pressed &&
                                                styles.actionPressed,

                                                (
                                                    approvingRequestId !==
                                                    null ||
                                                    rejecting
                                                ) &&
                                                styles.disabledButton,
                                            ]}
                                        >

                                            {approvingRequestId ===
                                            request.requestId ? (

                                                <ActivityIndicator
                                                    size="small"
                                                    color="#ffffff"
                                                />

                                            ) : (

                                                <Ionicons
                                                    name="checkmark-circle-outline"
                                                    size={18}
                                                    color="#ffffff"
                                                />

                                            )}


                                            <Text
                                                style={
                                                    styles.approveButtonText
                                                }
                                            >
                                                {
                                                    approvingRequestId ===
                                                    request.requestId
                                                        ? t.approving
                                                        : t.approve
                                                }
                                            </Text>

                                        </Pressable>


                                        <Pressable
                                            disabled={
                                                approvingRequestId !==
                                                null ||
                                                rejecting
                                            }
                                            onPress={() =>
                                                openRejectModal(
                                                    request
                                                )
                                            }
                                            style={({ pressed }) => [
                                                styles.rejectButton,

                                                pressed &&
                                                styles.actionPressed,

                                                (
                                                    approvingRequestId !==
                                                    null ||
                                                    rejecting
                                                ) &&
                                                styles.disabledButton,
                                            ]}
                                        >

                                            <Ionicons
                                                name="close-circle-outline"
                                                size={18}
                                                color="#dc2626"
                                            />


                                            <Text
                                                style={
                                                    styles.rejectButtonText
                                                }
                                            >
                                                {t.reject}
                                            </Text>

                                        </Pressable>

                                    </View>

                                </View>

                            )
                        )

                    )}


                    <View
                        style={styles.bottomSpacing}
                    />

                </View>

            </ScrollView>


            {/* ==================================================================
               SIDE MENU — SAME AS PROFILE
               ================================================================== */}

            {menuMounted && (

                <View
                    style={styles.menuOverlay}
                >

                    {/* OVERLAY */}

                    <Animated.View
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


                    {/* DRAWER */}

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
                                    label={t.dashboard}
                                    active={false}
                                    onPress={() =>
                                        handleMenuPress(
                                            '/admin/dashboard'
                                        )
                                    }
                                />


                                {/* PROFILE */}

                                <MenuItem
                                    icon="person-outline"
                                    label={t.profile}
                                    active={false}
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
                                    active={false}
                                    onPress={() =>
                                        handleMenuPress(
                                            '/admin/change-email'
                                        )
                                    }
                                />


                                {/* CHANGE PASSWORD */}

                                <MenuItem
                                    icon="lock-closed-outline"
                                    label={
                                        t.changePassword
                                    }
                                    active={false}
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
                                    label={
                                        t.weeklyRequest
                                    }
                                    active={true}
                                    onPress={() =>
                                        closeMenu()
                                    }
                                />


                                <MenuItem
                                    icon="cash-outline"
                                    label={
                                        t.weeklyDeposit
                                    }
                                    active={false}
                                    onPress={() =>
                                        handleMenuPress(
                                            '/admin/weekly-deposit'
                                        )
                                    }
                                />


                                <MenuItem
                                    icon="time-outline"
                                    label={
                                        t.weeklyHistory
                                    }
                                    active={false}
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
                                    label={
                                        t.createAdmin
                                    }
                                    active={false}
                                    onPress={() =>
                                        handleMenuPress(
                                            '/admin/create-admin'
                                        )
                                    }
                                />


                                <MenuItem
                                    icon="people-outline"
                                    label={
                                        t.createMember
                                    }
                                    active={false}
                                    onPress={() =>
                                        handleMenuPress(
                                            '/admin/create-member'
                                        )
                                    }
                                />


                                <MenuItem
                                    icon="log-in-outline"
                                    label={
                                        t.accessMember
                                    }
                                    active={false}
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


            {/* ==================================================================
               REJECT MODAL
               ================================================================== */}

            <Modal
                visible={
                    rejectModalVisible
                }
                transparent
                animationType="fade"
                onRequestClose={
                    closeRejectModal
                }
            >

                <View
                    style={
                        styles.modalOverlay
                    }
                >

                    <View
                        style={
                            styles.modalCard
                        }
                    >

                        <View
                            style={
                                styles.modalIcon
                            }
                        >

                            <Ionicons
                                name="close-circle-outline"
                                size={28}
                                color="#dc2626"
                            />

                        </View>


                        <Text
                            style={
                                styles.modalTitle
                            }
                        >
                            {t.rejectTitle}
                        </Text>


                        <Text
                            style={
                                styles.modalMessage
                            }
                        >
                            {t.rejectMessage}
                        </Text>


                        {selectedRequest && (

                            <View
                                style={
                                    styles.selectedRequest
                                }
                            >

                                <Text
                                    style={
                                        styles.selectedRequestName
                                    }
                                >
                                    {
                                        selectedRequest.memberName
                                    }
                                </Text>


                                <Text
                                    style={
                                        styles.selectedRequestId
                                    }
                                >
                                    {t.memberId}:{' '}
                                    {
                                        selectedRequest.memberId
                                    }
                                </Text>

                            </View>

                        )}


                        <TextInput
                            value={rejectNotes}
                            onChangeText={
                                setRejectNotes
                            }
                            placeholder={
                                t.rejectNotesPlaceholder
                            }
                            placeholderTextColor="#94a3b8"
                            multiline
                            textAlignVertical="top"
                            style={
                                styles.rejectInput
                            }
                            editable={!rejecting}
                        />


                        <View
                            style={
                                styles.modalActions
                            }
                        >

                            <Pressable
                                disabled={
                                    rejecting
                                }
                                onPress={
                                    closeRejectModal
                                }
                                style={({ pressed }) => [
                                    styles.modalCancelButton,

                                    pressed &&
                                    styles.actionPressed,

                                    rejecting &&
                                    styles.disabledButton,
                                ]}
                            >

                                <Text
                                    style={
                                        styles.modalCancelText
                                    }
                                >
                                    {t.cancel}
                                </Text>

                            </Pressable>


                            <Pressable
                                disabled={
                                    rejecting
                                }
                                onPress={
                                    handleReject
                                }
                                style={({ pressed }) => [
                                    styles.modalConfirmButton,

                                    pressed &&
                                    styles.actionPressed,

                                    rejecting &&
                                    styles.disabledButton,
                                ]}
                            >

                                {rejecting ? (

                                    <ActivityIndicator
                                        size="small"
                                        color="#ffffff"
                                    />

                                ) : (

                                    <Ionicons
                                        name="close-circle-outline"
                                        size={18}
                                        color="#ffffff"
                                    />

                                )}


                                <Text
                                    style={
                                        styles.modalConfirmText
                                    }
                                >
                                    {
                                        rejecting
                                            ? t.rejecting
                                            : t.confirm
                                    }
                                </Text>

                            </Pressable>

                        </View>

                    </View>

                </View>

            </Modal>

        </SafeAreaView>

    );

}


/* ==========================================================================
   DETAIL ITEM
   ========================================================================== */

type DetailItemProps = {

    icon: React.ComponentProps<
        typeof Ionicons
    >['name'];

    label: string;

    value: string;

};


function DetailItem({
    icon,
    label,
    value,
}: DetailItemProps) {

    return (

        <View
            style={styles.detailItem}
        >

            <View
                style={
                    styles.detailIcon
                }
            >

                <Ionicons
                    name={icon}
                    size={17}
                    color="#475569"
                />

            </View>


            <View
                style={
                    styles.detailContent
                }
            >

                <Text
                    style={
                        styles.detailLabel
                    }
                >
                    {label}
                </Text>


                <Text
                    style={
                        styles.detailValue
                    }
                    numberOfLines={2}
                >
                    {value}
                </Text>

            </View>

        </View>

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
            style={styles.menuItemPressable}
            onPress={onPress}
        >
            {({ pressed }) => (
                <View
                    style={[
                        styles.menuItem,
                        {
                            backgroundColor: active
                                ? '#0f172a'
                                : pressed
                                    ? '#0f172a'
                                    : 'transparent',
                        },
                    ]}
                >
                    <View style={styles.menuItemIcon}>
                        <Ionicons
                            name={icon}
                            size={20}
                            color={
                                active
                                    ? '#ffffff'
                                    : pressed
                                        ? '#ffffff'
                                        : '#475569'
                            }
                        />
                    </View>

                    <Text
                        style={[
                            styles.menuItemText,
                            {
                                color: active
                                    ? '#ffffff'
                                    : pressed
                                        ? '#ffffff'
                                        : '#475569',
                            },
                        ]}
                    >
                        {label}
                    </Text>
                </View>
            )}
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


    /* CONTENT */

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


    pageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },


    pageTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0f172a',
    },


    pageSubtitle: {
        marginTop: 4,
        fontSize: 10,
        color: '#64748b',
    },


    refreshButton: {
        width: 42,
        height: 42,
        borderRadius: 11,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },


    refreshButtonPressed: {
        opacity: 0.65,
    },


    /* SEARCH */

    searchContainer: {
        minHeight: 48,
        paddingHorizontal: 14,
        borderRadius: 13,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
    },


    searchInput: {
        flex: 1,
        minHeight: 46,
        marginLeft: 9,
        paddingVertical: 0,
        fontSize: 12,
        color: '#0f172a',
    },


    searchClear: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },


    /* COUNT */

    countRow: {
        minHeight: 46,
        marginTop: 12,
        paddingHorizontal: 3,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },


    countBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },


    countText: {
        marginLeft: 7,
        fontSize: 12,
        fontWeight: '800',
        color: '#334155',
    },


    countNumber: {
        minWidth: 28,
        height: 28,
        paddingHorizontal: 7,
        borderRadius: 9,
        backgroundColor: '#e2e8f0',
        textAlign: 'center',
        textAlignVertical: 'center',
        fontSize: 11,
        fontWeight: '900',
        color: '#0f172a',
    },


    /* EMPTY */

    emptyCard: {
        marginTop: 3,
        minHeight: 190,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 25,
    },


    emptyIcon: {
        width: 58,
        height: 58,
        borderRadius: 18,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },


    emptyTitle: {
        marginTop: 13,
        fontSize: 13,
        fontWeight: '800',
        color: '#475569',
        textAlign: 'center',
    },


    /* REQUEST CARD */

    requestCard: {
        marginTop: 12,
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',

        shadowColor: '#000000',
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 2,
        },

        elevation: 1,
    },


    requestHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 13,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },


    memberHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },


    memberIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },


    memberHeaderText: {
        flex: 1,
        marginLeft: 10,
    },


    memberName: {
        fontSize: 13,
        fontWeight: '900',
        color: '#0f172a',
    },


    memberIdText: {
        marginTop: 3,
        fontSize: 9,
        color: '#64748b',
    },


    pendingBadge: {
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#fff7ed',
        borderWidth: 1,
        borderColor: '#fed7aa',
    },


    pendingBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#c2410c',
    },


    /* DETAILS */

    details: {
        paddingTop: 13,
    },


    detailRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: 9,
    },


    detailItem: {
        flex: 1,
        minHeight: 42,
        marginBottom: 5,
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 0,
    },


    detailIcon: {
        width: 34,
        height: 34,
        borderRadius: 9,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },


    detailContent: {
        flex: 1,
        marginLeft: 9,
    },


    detailLabel: {
        fontSize: 9,
        color: '#94a3b8',
        fontWeight: '600',
    },


    detailValue: {
        marginTop: 2,
        fontSize: 11,
        color: '#334155',
        fontWeight: '800',
    },


    /* ACTIONS */

    actions: {
        marginTop: 9,
        paddingTop: 13,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        flexDirection: 'row',
        gap: 9,
    },


    approveButton: {
        flex: 1,
        minHeight: 43,
        borderRadius: 11,
        backgroundColor: '#0f172a',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },


    approveButtonText: {
        marginLeft: 7,
        fontSize: 11,
        fontWeight: '800',
        color: '#ffffff',
    },


    rejectButton: {
        flex: 1,
        minHeight: 43,
        borderRadius: 11,
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },


    rejectButtonText: {
        marginLeft: 7,
        fontSize: 11,
        fontWeight: '800',
        color: '#dc2626',
    },


    actionPressed: {
        opacity: 0.65,
    },


    disabledButton: {
        opacity: 0.55,
    },


    bottomSpacing: {
        height: 25,
    },


    /* ======================================================================
       DRAWER — MATCHED TO PROFILE.TSX
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


    overlayContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },


    overlayBackground: {
        flex: 1,
        backgroundColor:
            'rgba(15, 23, 42, 0.42)',
    },


    drawerAnimated: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: 315,
        maxWidth: '86%',
        zIndex: 1001,
        elevation: 1001,
    },


    drawer: {
        flex: 1,
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


    drawerHeader: {
        height: 76,
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
        overflow: 'hidden',
    },


    menuItem: {
        minHeight: 46,
        borderRadius: 10,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },


    menuItemIcon: {
        width: 20,
        height: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },


    menuItemText: {
        marginLeft: 12,
        fontSize: 12,
        fontWeight: '700',
        flex: 1,
    },


    menuDivider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 10,
        marginHorizontal: 7,
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


    /* ======================================================================
       REJECT MODAL
       ====================================================================== */

    modalOverlay: {
        flex: 1,
        backgroundColor:
            'rgba(15, 23, 42, 0.48)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },


    modalCard: {
        width: '100%',
        maxWidth: 430,
        borderRadius: 18,
        padding: 20,
        backgroundColor: '#ffffff',
    },


    modalIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#fef2f2',
        alignItems: 'center',
        justifyContent: 'center',
    },


    modalTitle: {
        marginTop: 14,
        fontSize: 17,
        fontWeight: '900',
        color: '#0f172a',
    },


    modalMessage: {
        marginTop: 7,
        fontSize: 11,
        lineHeight: 17,
        color: '#64748b',
    },


    selectedRequest: {
        marginTop: 13,
        padding: 12,
        borderRadius: 11,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },


    selectedRequestName: {
        fontSize: 12,
        fontWeight: '900',
        color: '#0f172a',
    },


    selectedRequestId: {
        marginTop: 3,
        fontSize: 9,
        color: '#64748b',
    },


    rejectInput: {
        marginTop: 13,
        minHeight: 95,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
        paddingHorizontal: 12,
        paddingVertical: 11,
        fontSize: 11,
        color: '#0f172a',
    },


    modalActions: {
        marginTop: 15,
        flexDirection: 'row',
        gap: 9,
    },


    modalCancelButton: {
        flex: 1,
        minHeight: 43,
        borderRadius: 11,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },


    modalCancelText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#475569',
    },


    modalConfirmButton: {
        flex: 1,
        minHeight: 43,
        borderRadius: 11,
        backgroundColor: '#dc2626',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },


    modalConfirmText: {
        marginLeft: 7,
        fontSize: 11,
        fontWeight: '800',
        color: '#ffffff',
    },

});