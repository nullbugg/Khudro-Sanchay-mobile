import React, {
    useCallback,
    useEffect,
    useMemo,
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
    getAdminDepositHistory,
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


type HistoryRecord = PendingDeposit & {
    historyWeek: number;
    weekStart: string;
    weekEnd: string;
};


/* ==========================================================================
   WEEK CONFIGURATION

   Week 1 = 24-04-2026
   Week 23 = 25-09-2026 to 01-10-2026
   ========================================================================== */

const WEEK_1_START_UTC =
    Date.UTC(
        2026,
        3,
        24
    );

const DAYS_IN_WEEK_MS =
    7 *
    24 *
    60 *
    60 *
    1000;


/* ==========================================================================
   TRANSLATIONS
   ========================================================================== */

const translations = {

    bn: {

        appName:
            'ক্ষুদ্র সঞ্চয়',

        appSubtitle:
            'সমবায় সমিতি',

        adminPanel:
            'অ্যাডমিন প্যানেল',

        adminId:
            'অ্যাডমিন ID',

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

        title:
            'সাপ্তাহিক জমার হিস্টরি',

        subtitle:
            'Pending Deposit থেকে জমার হিস্টরি দেখুন',

        refresh:
            'রিফ্রেশ',

        loading:
            'হিস্টরি লোড হচ্ছে...',

        week:
            'সপ্তাহ',

        weeks:
            'সপ্তাহ',

        selectWeek:
            'সপ্তাহ নির্বাচন করুন',

        currentWeek:
            'বর্তমান সপ্তাহ',

        memberSearch:
            'সদস্য',

        memberSearchPlaceholder:
            'সদস্য ID অথবা নাম দিয়ে সার্চ করুন',

        history:
            'হিস্টরি',

        records:
            'টি রেকর্ড',

        noHistory:
            'এই সপ্তাহে কোনো জমার হিস্টরি নেই',

        noSearchResults:
            'সার্চ অনুযায়ী কোনো রেকর্ড পাওয়া যায়নি',

        memberId:
            'সদস্য ID',

        memberName:
            'সদস্যের নাম',

        date:
            'তারিখ',

        share:
            'শেয়ার',

        expectedAmount:
            'প্রত্যাশিত জমা',

        paidAmount:
            'পরিশোধিত জমা',

        paymentMethod:
            'পেমেন্ট পদ্ধতি',

        status:
            'স্ট্যাটাস',

        cash:
            'ক্যাশ',

        bkash:
            'bKash',

        pending:
            'পেন্ডিং',

        approved:
            'অনুমোদিত',

        rejected:
            'বাতিল',

        deposit:
            'জমা',

        loginRequired:
            'অ্যাডমিন লগইন প্রয়োজন',

        failedToLoad:
            'জমার হিস্টরি লোড করা যায়নি',

    },


    en: {

        appName:
            'Khudro Sanchoy',

        appSubtitle:
            'Cooperative Society',

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
            'Weekly Deposit History',

        subtitle:
            'View deposit history from Pending Deposit',

        refresh:
            'Refresh',

        loading:
            'Loading history...',

        week:
            'Week',

        weeks:
            'Weeks',

        selectWeek:
            'Select Week',

        currentWeek:
            'Current Week',

        memberSearch:
            'Member',

        memberSearchPlaceholder:
            'Search by member ID or name',

        history:
            'History',

        records:
            'records',

        noHistory:
            'No deposit history for this week',

        noSearchResults:
            'No records found for your search',

        memberId:
            'Member ID',

        memberName:
            'Member Name',

        date:
            'Date',

        share:
            'Share',

        expectedAmount:
            'Expected Amount',

        paidAmount:
            'Paid Amount',

        paymentMethod:
            'Payment Method',

        status:
            'Status',

        cash:
            'Cash',

        bkash:
            'bKash',

        pending:
            'Pending',

        approved:
            'Approved',

        rejected:
            'Rejected',

        deposit:
            'Deposit',

        loginRequired:
            'Admin login required',

        failedToLoad:
            'Failed to load deposit history',

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


/* ==========================================================================
   DATE HELPERS
   ========================================================================== */

const parseDateOnlyUTC = (
    value: string
): Date | null => {

    if (!value) {
        return null;
    }

    const trimmed =
        String(value)
            .trim();


    /*
     * ISO date/time
     */
    const isoDate =
        new Date(trimmed);

    if (
        !Number.isNaN(
            isoDate.getTime()
        )
    ) {

        return isoDate;

    }


    /*
     * DD-MM-YYYY
     */
    const ddmmyyyy =
        trimmed.match(
            /^(\d{1,2})-(\d{1,2})-(\d{4})$/
        );

    if (ddmmyyyy) {

        const day =
            Number(
                ddmmyyyy[1]
            );

        const month =
            Number(
                ddmmyyyy[2]
            );

        const year =
            Number(
                ddmmyyyy[3]
            );

        const date =
            new Date(
                Date.UTC(
                    year,
                    month - 1,
                    day
                )
            );

        if (
            date.getUTCFullYear() === year &&
            date.getUTCMonth() === month - 1 &&
            date.getUTCDate() === day
        ) {

            return date;

        }

    }


    /*
     * DD/MM/YYYY
     */
    const ddmmyyyySlash =
        trimmed.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
        );

    if (ddmmyyyySlash) {

        const day =
            Number(
                ddmmyyyySlash[1]
            );

        const month =
            Number(
                ddmmyyyySlash[2]
            );

        const year =
            Number(
                ddmmyyyySlash[3]
            );

        const date =
            new Date(
                Date.UTC(
                    year,
                    month - 1,
                    day
                )
            );

        if (
            date.getUTCFullYear() === year &&
            date.getUTCMonth() === month - 1 &&
            date.getUTCDate() === day
        ) {

            return date;

        }

    }


    return null;

};


const getCollectionDateByWeek = (
    weekNumber: number
): string => {

    if (
        !Number.isInteger(
            weekNumber
        ) ||
        weekNumber < 1
    ) {

        return '';

    }

    return new Date(
        WEEK_1_START_UTC +
        (
            (weekNumber - 1) *
            DAYS_IN_WEEK_MS
        )
    ).toISOString();

};


const getWeekNumberFromDate = (
    value: string
): number | null => {

    const date =
        parseDateOnlyUTC(
            value
        );

    if (!date) {
        return null;
    }

    const timestamp =
        Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate()
        );

    const difference =
        timestamp -
        WEEK_1_START_UTC;


    /*
     * Before Week 1
     */
    if (
        difference < 0
    ) {

        return null;

    }

    return (
        Math.floor(
            difference /
            DAYS_IN_WEEK_MS
        ) + 1
    );

};


const getWeekRange = (
    weekNumber: number
) => {

    const start =
        new Date(
            WEEK_1_START_UTC +
            (
                (weekNumber - 1) *
                DAYS_IN_WEEK_MS
            )
        );

    const end =
        new Date(
            WEEK_1_START_UTC +
            (
                (weekNumber - 1) *
                DAYS_IN_WEEK_MS
            ) +
            (
                6 *
                24 *
                60 *
                60 *
                1000
            )
        );

    return {
        start,
        end,
    };

};


const formatUTCDate = (
    date: Date
) => {

    const day =
        String(
            date.getUTCDate()
        ).padStart(
            2,
            '0'
        );

    const month =
        String(
            date.getUTCMonth() + 1
        ).padStart(
            2,
            '0'
        );

    const year =
        date.getUTCFullYear();

    return `${day}-${month}-${year}`;

};


const getWeekRangeText = (
    weekNumber: number
) => {

    const {
        start,
        end,
    } =
        getWeekRange(
            weekNumber
        );

    return `${formatUTCDate(start)} - ${formatUTCDate(end)}`;

};


/*
 * Current week calculation.
 *
 * Week 1 = 24-04-2026
 *
 * If today is inside a week, that week becomes current.
 *
 * Example:
 * 25-09-2026 -> Week 23
 * 01-10-2026 -> Week 23
 * 02-10-2026 -> Week 24
 */
const getCurrentWeekNumber = (): number => {

    const now =
        new Date();

    const todayUTC =
        Date.UTC(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

    const difference =
        todayUTC -
        WEEK_1_START_UTC;

    if (
        difference < 0
    ) {

        return 1;

    }

    return (
        Math.floor(
            difference /
            DAYS_IN_WEEK_MS
        ) + 1
    );

};


/*
 * Week options:
 *
 * Current week first,
 * then previous weeks,
 * ending at Week 1.
 */
const getWeekOptions = (): number[] => {

    const currentWeek =
        getCurrentWeekNumber();

    return Array.from(
        {
            length: currentWeek,
        },
        (
            _,
            index
        ) =>
            currentWeek - index
    );

};


/* ==========================================================================
   RESULT HELPERS
   ========================================================================== */

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
        Array.isArray(
            result.requests
        )
    ) {

        return result.requests;

    }

    if (
        result &&
        Array.isArray(
            result.data
        )
    ) {

        return result.data;

    }

    if (
        result &&
        result.data &&
        Array.isArray(
            result.data.requests
        )
    ) {

        return result.data.requests;

    }

    return [];

};


/* ==========================================================================
   STATUS HELPERS
   ========================================================================== */

const getStatusText = (
    status: string,
    t: typeof translations.bn
) => {

    const normalized =
        String(
            status || ''
        )
            .trim()
            .toLowerCase();

    if (
        normalized === 'approved' ||
        normalized === 'approve'
    ) {

        return t.approved;

    }

    if (
        normalized === 'rejected' ||
        normalized === 'reject'
    ) {

        return t.rejected;

    }

    /*
     * PENDING should never reach the history list.
     */
    return status || '-';

};


const getStatusStyleType = (
    status: string
) => {

    const normalized =
        String(
            status || ''
        )
            .trim()
            .toLowerCase();

    if (
        normalized === 'approved' ||
        normalized === 'approve'
    ) {

        return 'approved';

    }

    if (
        normalized === 'rejected' ||
        normalized === 'reject'
    ) {

        return 'rejected';

    }

    return 'pending';

};


/* ==========================================================================
   SCREEN
   ========================================================================== */

export default function AdminWeeklyDepositHistoryScreen() {

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
       DATA
       ---------------------------------------------------------------------- */

    const [
        deposits,
        setDeposits,
    ] = useState<PendingDeposit[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        refreshing,
        setRefreshing,
    ] = useState(false);


    /* ----------------------------------------------------------------------
       WEEK FILTER
       ---------------------------------------------------------------------- */

    const weekOptions =
        useMemo(
            () =>
                getWeekOptions(),
            []
        );

    const [
        selectedWeek,
        setSelectedWeek,
    ] = useState(
        getCurrentWeekNumber()
    );

    const [
        weekPickerOpen,
        setWeekPickerOpen,
    ] = useState(false);


    /* ----------------------------------------------------------------------
       MEMBER SEARCH
       ---------------------------------------------------------------------- */

    const [
        memberSearch,
        setMemberSearch,
    ] = useState('');


    /* ======================================================================
       LANGUAGE LOAD
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

                        if (
                            !isMounted
                        ) {

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
       LOAD DEPOSIT HISTORY
       ====================================================================== */

    const loadDeposits =
        useCallback(
            async (
                showLoading = true
            ) => {

                try {

                    if (
                        showLoading
                    ) {

                        setLoading(
                            true
                        );

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


                    /*
                     * Deposit History source.
                     *
                     * History filters:
                     * APPROVED + REJECTED only.
                     *
                     * PENDING is removed below.
                     */
                    const result =
                        await getAdminDepositHistory();

                    const loadedDeposits =
                        getRequestsFromResult(
                            result
                        );


                    const historyDeposits =
                        loadedDeposits.filter(
                            (deposit) => {
                                const status =
                                    String(
                                        deposit.status || ''
                                    )
                                        .trim()
                                        .toLowerCase();

                                return (
                                    status === 'approved' ||
                                    status === 'approve' ||
                                    status === 'rejected' ||
                                    status === 'reject'
                                );
                            }
                        );

                    setDeposits(historyDeposits);

                } catch (error) {

                    console.error(
                        'Weekly deposit history loading error:',
                        error
                    );

                } finally {

                    if (
                        showLoading
                    ) {

                        setLoading(
                            false
                        );

                    }

                }

            },
            [
                t.loginRequired,
            ]
        );


    /* ======================================================================
       INITIAL / FOCUS LOAD
       ====================================================================== */

    useFocusEffect(
        useCallback(() => {

            /*
             * Recalculate current week every time
             * the screen gets focus.
             */
            const currentWeek =
                getCurrentWeekNumber();

            setSelectedWeek(
                currentWeek
            );

            loadDeposits(
                true
            );

        }, [
            loadDeposits,
        ])
    );


    /* ======================================================================
       REFRESH
       ====================================================================== */

    const handleRefresh =
        async () => {

            setRefreshing(
                true
            );

            /*
             * Refresh current week too.
             */
            setSelectedWeek(
                getCurrentWeekNumber()
            );

            await loadDeposits(
                false
            );

            setRefreshing(
                false
            );

        };


    /* ======================================================================
       BUILD HISTORY RECORDS

       IMPORTANT:
       Request Date is used.
       Approved Date is NOT used.
       ====================================================================== */

    const historyRecords =
        useMemo<HistoryRecord[]>(
            () => {

                return deposits
                    .map(
                        (
                            deposit
                        ) => {

                            /*
                             * Request Date determines
                             * the history week.
                             */
                            const historyWeek =
                                getWeekNumberFromDate(
                                    deposit.requestDate
                                );

                            if (
                                !historyWeek
                            ) {

                                return null;

                            }

                            const {
                                start,
                                end,
                            } =
                                getWeekRange(
                                    historyWeek
                                );

                            return {
                                ...deposit,

                                historyWeek,

                                weekStart:
                                    formatUTCDate(
                                        start
                                    ),

                                weekEnd:
                                    formatUTCDate(
                                        end
                                    ),
                            };

                        }
                    )
                    .filter(
                        (
                            item
                        ): item is HistoryRecord =>
                            item !== null
                    );

            },
            [
                deposits,
            ]
        );


    /* ======================================================================
       FILTER HISTORY

       Selected Week + Member Search
       ====================================================================== */

    const filteredHistory =
        useMemo(
            () => {

                const memberQuery =
                    String(
                        memberSearch || ''
                    )
                        .trim()
                        .toLowerCase();


                return historyRecords.filter(
                    (
                        record
                    ) => {

                        /*
                         * ONLY SELECTED WEEK
                         */
                        if (
                            record.historyWeek !==
                            selectedWeek
                        ) {

                            return false;

                        }


                        /*
                         * MEMBER SEARCH
                         */
                        if (
                            memberQuery
                        ) {

                            const memberId =
                                String(
                                    record.memberId || ''
                                )
                                    .toLowerCase();

                            const memberName =
                                String(
                                    record.memberName || ''
                                )
                                    .toLowerCase();

                            if (
                                !memberId.includes(
                                    memberQuery
                                ) &&
                                !memberName.includes(
                                    memberQuery
                                )
                            ) {

                                return false;

                            }

                        }


                        return true;

                    }
                );

            },
            [
                historyRecords,
                selectedWeek,
                memberSearch,
            ]
        );


    /* ======================================================================
       OPEN MENU
       ====================================================================== */

    const openMenu = () => {
    setMenuMounted(true);

    requestAnimationFrame(() => {
        Animated.parallel([
            Animated.timing(drawerTranslateX, {
                toValue: 0,
                duration: 280,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),

            Animated.timing(overlayOpacity, {
                toValue: 1,
                duration: 230,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
        ]).start();
    });

    setMenuOpen(true);
};


    /* ======================================================================
       CLOSE MENU
       ====================================================================== */

    const closeMenu = (
    callback?: () => void
) => {
    Animated.parallel([
        Animated.timing(drawerTranslateX, {
            toValue: -330,
            duration: 230,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
        }),

        Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 180,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
        }),
    ]).start(({ finished }) => {
        if (!finished) {
            return;
        }

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

        if (
            !route
        ) {

            closeMenu();

            return;

        }

        closeMenu(
            () => {

                router.push(
                    route as any
                );

            }
        );

    };


    /* ======================================================================
       LOGOUT
       ====================================================================== */

    const handleLogout = () => {

        closeMenu(
            async () => {

                await clearCurrentAdmin();

                router.replace(
                    '/admin/login'
                );

            }
        );

    };


    /* ======================================================================
       WEEK SELECT
       ====================================================================== */

    const handleWeekSelect = (
        weekNumber: number
    ) => {

        setSelectedWeek(
            weekNumber
        );

        setWeekPickerOpen(
            false
        );

    };


    /* ======================================================================
       LOADING SCREEN
       ====================================================================== */

    if (
        loading
    ) {

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


                <View
                    style={
                        styles.centerState
                    }
                >

                    <ActivityIndicator
                        size="large"
                        color="#0f172a"
                    />


                    <Text
                        style={
                            styles.stateText
                        }
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
            style={
                styles.safeArea
            }
            edges={[
                'top',
                'left',
                'right',
            ]}
        >

            {/* HEADER */}

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


            {/* CONTENT */}

            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl
                        refreshing={
                            refreshing
                        }
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
                    style={
                        styles.container
                    }
                >

                    {/* WEEK SELECTOR */}

                    <View
                        style={
                            styles.searchBlock
                        }
                    >

                        <Text
                            style={
                                styles.searchLabel
                            }
                        >
                            {t.selectWeek}
                        </Text>


                        <Pressable
                            onPress={() =>
                                setWeekPickerOpen(
                                    previous =>
                                        !previous
                                )
                            }
                            style={({ pressed }) => [
                                styles.weekSelectContainer,

                                pressed &&
                                styles.weekSelectPressed,
                            ]}
                        >

                            <View
                                style={
                                    styles.weekSelectLeft
                                }
                            >

                                <View
                                    style={
                                        styles.weekSelectIcon
                                    }
                                >

                                    <Ionicons
                                        name="calendar-outline"
                                        size={18}
                                        color="#0f172a"
                                    />

                                </View>


                                <View
                                    style={
                                        styles.weekSelectTextWrap
                                    }
                                >

                                    <Text
                                        style={
                                            styles.weekSelectTitle
                                        }
                                    >
                                        {t.week} {selectedWeek}
                                    </Text>


                                    <Text
                                        style={
                                            styles.weekSelectRange
                                        }
                                    >
                                        {
                                            getWeekRangeText(
                                                selectedWeek
                                            )
                                        }
                                    </Text>

                                </View>

                            </View>


                            <Ionicons
                                name={
                                    weekPickerOpen
                                        ? 'chevron-up'
                                        : 'chevron-down'
                                }
                                size={19}
                                color="#64748b"
                            />

                        </Pressable>


                        {weekPickerOpen && (

                            <View
                                style={
                                    styles.weekOptionsCard
                                }
                            >

                                <ScrollView
                                    style={
                                        styles.weekOptionsScroll
                                    }
                                    nestedScrollEnabled
                                    showsVerticalScrollIndicator={
                                        false
                                    }
                                >

                                    {weekOptions.map(
                                        (
                                            weekNumber
                                        ) => {

                                            const isSelected =
                                                selectedWeek ===
                                                weekNumber;

                                            const isCurrent =
                                                weekNumber ===
                                                getCurrentWeekNumber();

                                            return (

                                                <Pressable
                                                    key={
                                                        weekNumber
                                                    }
                                                    onPress={() =>
                                                        handleWeekSelect(
                                                            weekNumber
                                                        )
                                                    }
                                                    style={({ pressed }) => [
                                                        styles.weekOption,

                                                        isSelected &&
                                                        styles.weekOptionSelected,

                                                        pressed &&
                                                        styles.weekOptionPressed,
                                                    ]}
                                                >

                                                    <View
                                                        style={
                                                            styles.weekOptionLeft
                                                        }
                                                    >

                                                        <View
                                                            style={[
                                                                styles.weekNumberBadge,

                                                                isSelected &&
                                                                styles.weekNumberBadgeSelected,
                                                            ]}
                                                        >

                                                            <Text
                                                                style={[
                                                                    styles.weekNumberText,

                                                                    isSelected &&
                                                                    styles.weekNumberTextSelected,
                                                                ]}
                                                            >
                                                                {weekNumber}
                                                            </Text>

                                                        </View>


                                                        <View
                                                            style={
                                                                styles.weekOptionTextWrap
                                                            }
                                                        >

                                                            <Text
                                                                style={[
                                                                    styles.weekOptionTitle,

                                                                    isSelected &&
                                                                    styles.weekOptionTitleSelected,
                                                                ]}
                                                            >
                                                                {t.week} {weekNumber}

                                                                {isCurrent
                                                                    ? ` · ${t.currentWeek}`
                                                                    : ''
                                                                }
                                                            </Text>


                                                            <Text
                                                                style={
                                                                    styles.weekOptionRange
                                                                }
                                                            >
                                                                {
                                                                    getWeekRangeText(
                                                                        weekNumber
                                                                    )
                                                                }
                                                            </Text>

                                                        </View>

                                                    </View>


                                                    {isSelected && (

                                                        <Ionicons
                                                            name="checkmark-circle"
                                                            size={21}
                                                            color="#0f172a"
                                                        />

                                                    )}

                                                </Pressable>

                                            );

                                        }
                                    )}

                                </ScrollView>

                            </View>

                        )}

                    </View>


                    {/* MEMBER SEARCH */}

                    <View
                        style={
                            styles.searchBlock
                        }
                    >

                        <Text
                            style={
                                styles.searchLabel
                            }
                        >
                            {t.memberSearch}
                        </Text>


                        <View
                            style={
                                styles.searchContainer
                            }
                        >

                            <Ionicons
                                name="search-outline"
                                size={19}
                                color="#64748b"
                            />


                            <TextInput
                                value={
                                    memberSearch
                                }
                                onChangeText={
                                    setMemberSearch
                                }
                                placeholder={
                                    t.memberSearchPlaceholder
                                }
                                placeholderTextColor="#94a3b8"
                                style={
                                    styles.searchInput
                                }
                                autoCapitalize="none"
                                autoCorrect={false}
                            />


                            {memberSearch.length > 0 && (

                                <Pressable
                                    onPress={() =>
                                        setMemberSearch('')
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

                    </View>


                    {/* HISTORY HEADER */}

                    <View
                        style={
                            styles.historyHeader
                        }
                    >

                        <View
                            style={
                                styles.historyTitleRow
                            }
                        >

                            <View
                                style={
                                    styles.historyIcon
                                }
                            >

                                <Ionicons
                                    name="time-outline"
                                    size={18}
                                    color="#0f172a"
                                />

                            </View>


                            <Text
                                style={
                                    styles.historyTitle
                                }
                            >
                                {t.history}
                            </Text>

                        </View>


                        <View
                            style={
                                styles.countBadge
                            }
                        >

                            <Text
                                style={
                                    styles.countNumber
                                }
                            >
                                {
                                    filteredHistory.length
                                }
                            </Text>


                            <Text
                                style={
                                    styles.countText
                                }
                            >
                                {t.records}
                            </Text>

                        </View>

                    </View>


                    {/* EMPTY */}

                    {filteredHistory.length === 0 ? (

                        <View
                            style={
                                styles.emptyCard
                            }
                        >

                            <View
                                style={
                                    styles.emptyIcon
                                }
                            >

                                <Ionicons
                                    name="time-outline"
                                    size={29}
                                    color="#64748b"
                                />

                            </View>


                            <Text
                                style={
                                    styles.emptyTitle
                                }
                            >
                                {t.noHistory}
                            </Text>

                        </View>

                    ) : (

                        filteredHistory.map(
                            (
                                record
                            ) => (

                                <HistoryCard
                                    key={
                                        `${record.requestId}-${record.rowIndex ?? record.requestDate}`
                                    }
                                    record={
                                        record
                                    }
                                    t={
                                        t
                                    }
                                />

                            )
                        )

                    )}


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
                                        active={false}
                                        onPress={() =>
                                            handleMenuPress(
                                                '/admin/dashboard'
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
                                    label={
                                        t.changeEmail
                                    }
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
                                    active={false}
                                    onPress={() =>
                                        handleMenuPress(
                                            '/admin/weekly-request'
                                        )
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
                                    active={true}
                                    onPress={() =>
                                        closeMenu()
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

        </SafeAreaView>

    );

}


/* ==========================================================================
   HISTORY CARD
   ========================================================================== */

type HistoryCardProps = {

    record: HistoryRecord;

    t: typeof translations.bn;

};


function HistoryCard({
    record,
    t,
}: HistoryCardProps) {

    const statusType =
        getStatusStyleType(
            record.status
        );


    const statusText =
        getStatusText(
            record.status,
            t
        );


    return (

        <View
            style={
                styles.historyCard
            }
        >

            {/* CARD HEADER */}

            <View
                style={
                    styles.cardHeader
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
                                record.memberName ||
                                '-'
                            }
                        </Text>


                        <Text
                            style={
                                styles.memberIdText
                            }
                        >
                            {
                                t.memberId
                            }: {record.memberId || '-'}
                        </Text>

                    </View>

                </View>


                <View
                    style={[
                        styles.statusBadge,
                        statusType === 'approved'
                            ? styles.statusApproved
                            : styles.statusRejected,
                    ]}
                >

                    <Text
                        style={[
                            styles.statusBadgeText,
                            statusType === 'approved'
                                ? styles.statusApprovedText
                                : styles.statusRejectedText,
                        ]}
                    >
                        {statusText}
                    </Text>

                </View>

            </View>


            {/* DETAILS */}

            <View
                style={
                    styles.details
                }
            >

                {/* SHARE */}

                <HistoryDetailItem
                    icon="layers-outline"
                    label={
                        t.share
                    }
                    value={
                        String(
                            record.shareCount ??
                            0
                        )
                    }
                />


                {/* WEEKS */}

                <HistoryDetailItem
                    icon="calendar-outline"
                    label={
                        t.weeks
                    }
                    value={
                        String(
                            record.weeks ??
                            0
                        )
                    }
                />


                {/* PAYMENT METHOD */}

                <HistoryDetailItem
                    icon="card-outline"
                    label={
                        t.paymentMethod
                    }
                    value={
                        record.paymentMethod ===
                            'bkash'
                            ? t.bkash
                            : t.cash
                    }
                />


                {/* DEPOSIT */}

                <HistoryDetailItem
                    icon="cash-outline"
                    label={
                        t.deposit
                    }
                    value={
                        `৳ ${formatCurrency(
                            record.depositAmount
                        )}`
                    }
                />


                {/* DATE */}

                <HistoryDetailItem
                    icon="time-outline"
                    label={
                        t.date
                    }
                    value={
                        formatDate(
                            record.requestDate
                        )
                    }
                />


                {/* ADMIN ID */}

                <HistoryDetailItem
                    icon="shield-checkmark-outline"
                    label={
                        t.adminId
                    }
                    value={
                        record.adminId ||
                        '-'
                    }
                />

            </View>

        </View>

    );

}


/* ==========================================================================
   HISTORY DETAIL ITEM
   ========================================================================== */

type HistoryDetailItemProps = {

    icon: React.ComponentProps<
        typeof Ionicons
    >['name'];

    label: string;

    value: string;

    fullWidth?: boolean;

};


function HistoryDetailItem({
    icon,
    label,
    value,
    fullWidth = false,
}: HistoryDetailItemProps) {

    return (

        <View
            style={[
                styles.historyDetailItem,
                fullWidth &&
                styles.historyDetailItemFull,
            ]}
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
                    numberOfLines={3}
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

    const pressAnimation =
        useRef(
            new Animated.Value(
                active
                    ? 1
                    : 0
            )
        ).current;


    const handlePressIn = () => {

        if (
            active
        ) {

            return;

        }

        Animated.timing(
            pressAnimation,
            {
                toValue: 1,
                duration: 120,
                easing:
                    Easing.out(
                        Easing.quad
                    ),
                useNativeDriver: false,
            }
        ).start();

    };


    const handlePressOut = () => {

        if (
            active
        ) {

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
                'rgba(15, 23, 42, 0)',
                '#0f172a',
            ],
        });


    const color =
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
                handlePressIn
            }
            onPressOut={
                handlePressOut
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
                        name={
                            icon
                        }
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
   MENU DIVIDER
   ========================================================================== */

function MenuDivider() {

    return (

        <View
            style={
                styles.menuDivider
            }
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


    pageHeaderText: {
        flex: 1,
        paddingRight: 12,
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

    searchBlock: {
        marginBottom: 12,
    },


    searchLabel: {
        marginBottom: 6,
        paddingHorizontal: 3,
        fontSize: 10,
        fontWeight: '800',
        color: '#475569',
    },


    /* WEEK SELECT */

    weekSelectContainer: {
        minHeight: 58,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 13,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },


    weekSelectPressed: {
        opacity: 0.75,
    },


    weekSelectLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },


    weekSelectIcon: {
        width: 37,
        height: 37,
        borderRadius: 10,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },


    weekSelectTextWrap: {
        marginLeft: 10,
        flex: 1,
    },


    weekSelectTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#0f172a',
    },


    weekSelectRange: {
        marginTop: 2,
        fontSize: 9,
        color: '#64748b',
        fontWeight: '600',
    },


    weekOptionsCard: {
        marginTop: 5,
        borderRadius: 13,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
    },


    weekOptionsScroll: {
        maxHeight: 300,
    },


    weekOption: {
        minHeight: 54,
        paddingHorizontal: 11,
        paddingVertical: 7,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },


    weekOptionSelected: {
        backgroundColor: '#f8fafc',
    },


    weekOptionPressed: {
        opacity: 0.7,
    },


    weekOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },


    weekNumberBadge: {
        width: 34,
        height: 34,
        borderRadius: 9,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },


    weekNumberBadgeSelected: {
        backgroundColor: '#0f172a',
    },


    weekNumberText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#475569',
    },


    weekNumberTextSelected: {
        color: '#ffffff',
    },


    weekOptionTextWrap: {
        marginLeft: 10,
        flex: 1,
    },


    weekOptionTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#334155',
    },


    weekOptionTitleSelected: {
        color: '#0f172a',
    },


    weekOptionRange: {
        marginTop: 2,
        fontSize: 8,
        color: '#94a3b8',
        fontWeight: '600',
    },


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


    /* HISTORY HEADER */

    historyHeader: {
        minHeight: 48,
        marginTop: 4,
        marginBottom: 2,
        paddingHorizontal: 3,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },


    historyTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },


    historyIcon: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },


    historyTitle: {
        marginLeft: 8,
        fontSize: 13,
        fontWeight: '900',
        color: '#334155',
    },


    countBadge: {
        flexDirection: 'row',
        alignItems: 'center',
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


    countText: {
        marginLeft: 6,
        fontSize: 10,
        fontWeight: '700',
        color: '#64748b',
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


    /* HISTORY CARD */

    historyCard: {
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


    cardHeader: {
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


    /* STATUS */

    statusBadge: {
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
    },


    statusApproved: {
        backgroundColor: '#f0fdf4',
        borderColor: '#bbf7d0',
    },


    statusRejected: {
        backgroundColor: '#fef2f2',
        borderColor: '#fecaca',
    },


    statusBadgeText: {
        fontSize: 9,
        fontWeight: '800',
    },


    statusApprovedText: {
        color: '#15803d',
    },


    statusRejectedText: {
        color: '#dc2626',
    },


    /* DETAILS */

    details: {
        paddingTop: 13,
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: 9,
    },


    historyDetailItem: {
        width: '48%',
        minHeight: 46,
        marginBottom: 7,
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 0,
    },


    historyDetailItemFull: {
        width: '100%',
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
        minWidth: 0,
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
        bottom: 2,
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