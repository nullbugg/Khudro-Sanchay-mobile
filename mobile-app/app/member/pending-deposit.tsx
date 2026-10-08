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
    getMemberPendingDeposits,
    clearCurrentMember,
    MemberPendingDeposit,
} from '../../lib/member-api';

import {
    getMemberLanguage,
    setMemberLanguage,
    MemberLanguage,
} from '../../lib/member-language';


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function formatMoney(
    amount: number
): string {
    return `৳ ${Number(
        amount || 0
    ).toLocaleString('en-BD')}`;
}


function formatDate(
    value: string,
    language: MemberLanguage
): string {
    if (!value) {
        return '—';
    }

    try {
        let date: Date;

        const raw =
            String(value).trim();

        if (
            /^\d{2}-\d{2}-\d{4}$/.test(
                raw
            )
        ) {
            const [
                day,
                month,
                year,
            ] =
                raw.split('-');

            date = new Date(
                Number(year),
                Number(month) - 1,
                Number(day)
            );
        } else if (
            /^\d{2}\/\d{2}\/\d{4}$/.test(
                raw
            )
        ) {
            const [
                day,
                month,
                year,
            ] =
                raw.split('/');

            date = new Date(
                Number(year),
                Number(month) - 1,
                Number(day)
            );
        } else {
            date = new Date(raw);
        }

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return raw;
        }

        return date.toLocaleDateString(
            language === 'bn'
                ? 'bn-BD'
                : 'en-GB',
            {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }
        );
    } catch {
        return value;
    }
}


/*
|--------------------------------------------------------------------------
| Menu Item
|--------------------------------------------------------------------------
*/

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
                    active ||
                    pressed;

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


function MenuDivider() {
    return (
        <View
            style={
                styles.menuDivider
            }
        />
    );
}


/*
|--------------------------------------------------------------------------
| Main Screen
|--------------------------------------------------------------------------
*/

export default function PendingDepositScreen() {

    /*
     * ---------------------------------------------------------------
     * Language
     * ---------------------------------------------------------------
     */

    const [
        language,
        setLanguage,
    ] =
        useState<MemberLanguage>('bn');


    /*
     * ---------------------------------------------------------------
     * Member
     * ---------------------------------------------------------------
     */

    const [
        memberName,
        setMemberName,
    ] =
        useState('');

    const [
        memberId,
        setMemberId,
    ] =
        useState('');


    /*
     * ---------------------------------------------------------------
     * Pending Deposits
     * ---------------------------------------------------------------
     */

    const [
        requests,
        setRequests,
    ] =
        useState<
            MemberPendingDeposit[]
        >([]);

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        refreshing,
        setRefreshing,
    ] =
        useState(false);

    const [
        error,
        setError,
    ] =
        useState('');


    /*
     * ---------------------------------------------------------------
     * Drawer Animation
     * ---------------------------------------------------------------
     */

    const [
        menuOpen,
        setMenuOpen,
    ] =
        useState(false);

    const [
        menuMounted,
        setMenuMounted,
    ] =
        useState(false);

    const drawerTranslateX =
        useRef(
            new Animated.Value(-315)
        ).current;

    const overlayOpacity =
        useRef(
            new Animated.Value(0)
        ).current;


    /*
     * ---------------------------------------------------------------
     * Translation
     * ---------------------------------------------------------------
     */

    const t =
        language === 'en'
            ? {
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

                title:
                    'Pending Deposit',

                pendingRequests:
                    'Pending Requests',

                request:
                    'Request',

                requestId:
                    'Request ID',

                shareCount:
                    'Shares',

                weeklyAmount:
                    'Weekly Amount',

                weeks:
                    'Number of Weeks',

                depositAmount:
                    'Deposit Amount',

                paymentMethod:
                    'Payment Method',

                senderNumber:
                    'Sender Number',

                bkashCharge:
                    'bKash Charge',

                payableAmount:
                    'Payable Amount',

                pending:
                    'PENDING',

                noRequests:
                    'No pending deposit requests',

                noRequestsDescription:
                    'You currently have no deposit request waiting for Admin approval.',

                loadError:
                    'Could not load pending deposits.',

                retry:
                    'Retry',

                cash:
                    'Cash',

                bkash:
                    'bKash',

                weeksText:
                    'weeks',

                shareText:
                    'shares',

                requestDate: 
                    'Request Date',

                loading:
                    'Loading...',

                memberNotFound:
                    'Current member session was not found. Please login again.',

                logoutTitle:
                    'Logout',

                logoutMessage:
                    'Are you sure you want to logout?',

                cancel:
                    'Cancel',

                logoutConfirm:
                    'Logout',
            }
            : {
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

                title:
                    'অপেক্ষমাণ জমা',

                pendingRequests:
                    'অপেক্ষমাণ অনুরোধ',

                request:
                    'অনুরোধ',

                requestId:
                    'অনুরোধ ID',

                shareCount:
                    'শেয়ার',

                weeklyAmount:
                    'সাপ্তাহিক জমা',

                weeks:
                    'কত সপ্তাহের জমা',

                depositAmount:
                    'জমার পরিমাণ',

                paymentMethod:
                    'পেমেন্ট পদ্ধতি',

                senderNumber:
                    'প্রেরকের নম্বর',

                bkashCharge:
                    'bKash চার্জ',

                payableAmount:
                    'মোট পরিশোধযোগ্য',

                pending:
                    'অপেক্ষমাণ',

                noRequests:
                    'কোনো অপেক্ষমাণ জমা নেই',

                noRequestsDescription:
                    'বর্তমানে Admin approval-এর জন্য আপনার কোনো জমার অনুরোধ অপেক্ষমাণ নেই।',

                loadError:
                    'অপেক্ষমাণ জমার তথ্য লোড করা যায়নি।',

                retry:
                    'আবার চেষ্টা করুন',

                cash:
                    'Cash',

                bkash:
                    'bKash',

                weeksText:
                    'সপ্তাহ',

                shareText:
                    'শেয়ার',

                requestDate: 
                    'অনুরোধের তারিখ',

                loading:
                    'লোড হচ্ছে...',

                memberNotFound:
                    'বর্তমান সদস্য সেশন পাওয়া যায়নি। আবার লগইন করুন।',

                logoutTitle:
                    'লগআউট',

                logoutMessage:
                    'আপনি কি লগআউট করতে চান?',

                cancel:
                    'বাতিল',

                logoutConfirm:
                    'লগআউট',
            };


    /*
     * ---------------------------------------------------------------
     * Open Menu
     * ---------------------------------------------------------------
     */

    const openMenu =
        useCallback(() => {
            setMenuMounted(true);
            setMenuOpen(true);

            drawerTranslateX.setValue(
                -315
            );

            overlayOpacity.setValue(
                0
            );

            Animated.parallel([
                Animated.timing(
                    drawerTranslateX,
                    {
                        toValue: 0,
                        duration: 260,
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
                        duration: 220,
                        easing:
                            Easing.out(
                                Easing.cubic
                            ),
                        useNativeDriver: true,
                    }
                ),
            ]).start();
        }, [
            drawerTranslateX,
            overlayOpacity,
        ]);


    /*
     * ---------------------------------------------------------------
     * Close Menu
     * ---------------------------------------------------------------
     */

    const closeMenu =
        useCallback(
            (
                callback?: () => void
            ) => {
                Animated.parallel([
                    Animated.timing(
                        drawerTranslateX,
                        {
                            toValue: -315,
                            duration: 220,
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
                                    Easing.cubic
                                ),
                            useNativeDriver: true,
                        }
                    ),
                ]).start(
                    () => {
                        setMenuOpen(
                            false
                        );

                        setMenuMounted(
                            false
                        );

                        if (callback) {
                            callback();
                        }
                    }
                );
            },
            [
                drawerTranslateX,
                overlayOpacity,
            ]
        );


    /*
     * ---------------------------------------------------------------
     * Menu Navigation
     * ---------------------------------------------------------------
     */

    const handleMenuPress =
        useCallback(
            (
                path:
                    | '/member/dashboard'
                    | '/member/profile'
                    | '/member/change-email'
                    | '/member/change-pin'
                    | '/member/deposit'
                    | '/member/pending-deposit'
                    | '/member/deposit-history'
            ) => {
                closeMenu(
                    () => {
                        router.push(
                            path
                        );
                    }
                );
            },
            [closeMenu]
        );


    /*
     * ---------------------------------------------------------------
     * Change Language
     * ---------------------------------------------------------------
     */

    const changeLanguage =
        useCallback(
            async (
                nextLanguage: MemberLanguage
            ) => {
                if (
                    nextLanguage ===
                    language
                ) {
                    return;
                }

                setLanguage(
                    nextLanguage
                );

                try {
                    await setMemberLanguage(
                        nextLanguage
                    );
                } catch (error) {
                    console.error(
                        'Member language save error:',
                        error
                    );
                }
            },
            [language]
        );


    /*
     * ---------------------------------------------------------------
     * Logout
     * ---------------------------------------------------------------
     */

    const handleLogout =
        useCallback(() => {
            closeMenu(
                () => {
                    Alert.alert(
                        t.logoutTitle,
                        t.logoutMessage,
                        [
                            {
                                text:
                                    t.cancel,
                                style:
                                    'cancel',
                            },
                            {
                                text:
                                    t.logoutConfirm,
                                style:
                                    'destructive',
                                onPress:
                                    async () => {
                                        try {
                                            await clearCurrentMember();
                                        } catch (
                                        error
                                        ) {
                                            console.error(
                                                'Member logout error:',
                                                error
                                            );
                                        } finally {
                                            router.replace(
                                                '/member/login'
                                            );
                                        }
                                    },
                            },
                        ]
                    );
                }
            );
        }, [
            closeMenu,
            t.logoutTitle,
            t.logoutMessage,
            t.cancel,
            t.logoutConfirm,
        ]);


    /*
     * ---------------------------------------------------------------
     * Load Pending Deposits
     * ---------------------------------------------------------------
     */

    const loadPendingDeposits =
        useCallback(
            async (
                showLoader = true
            ) => {
                try {
                    if (
                        showLoader
                    ) {
                        setLoading(
                            true
                        );
                    }

                    setError('');

                    const savedLanguage =
                        await getMemberLanguage();

                    setLanguage(
                        savedLanguage
                    );

                    const current =
                        await getCurrentMember();

                    if (
                        !current.success ||
                        !current.member
                    ) {
                        router.replace(
                            '/member/login'
                        );

                        return;
                    }

                    const member =
                        current.member;

                    setMemberName(
                        member.memberName
                    );

                    setMemberId(
                        member.memberId
                    );

                    const result =
                        await getMemberPendingDeposits(
                            member.memberId
                        );

                    if (
                        !result.success
                    ) {
                        setError(
                            result.message ||
                            (
                                savedLanguage ===
                                    'en'
                                    ? 'Pending deposits could not be loaded.'
                                    : 'অপেক্ষমাণ জমার তথ্য লোড করা যায়নি।'
                            )
                        );

                        setRequests(
                            []
                        );

                        return;
                    }

                    const sortedRequests =
                        [...result.requests].sort(
                            (a, b) => {
                                const dateA =
                                    new Date(
                                        a.requestDate
                                    ).getTime();

                                const dateB =
                                    new Date(
                                        b.requestDate
                                    ).getTime();

                                return dateA - dateB;
                            }
                        );

                    setRequests(
                        sortedRequests
                    );
                } catch (err) {
                    console.error(
                        'Pending deposit screen error:',
                        err
                    );

                    setError(
                        language === 'en'
                            ? 'Unable to load pending deposits.'
                            : 'অপেক্ষমাণ জমার তথ্য লোড করা যায়নি।'
                    );
                } finally {
                    setLoading(
                        false
                    );

                    setRefreshing(
                        false
                    );
                }
            },
            [language]
        );


    /*
     * ---------------------------------------------------------------
     * Refresh When Screen Gets Focus
     * ---------------------------------------------------------------
     */

    useFocusEffect(
        useCallback(() => {
            loadPendingDeposits(
                true
            );
        }, [
            loadPendingDeposits,
        ])
    );


    /*
     * ---------------------------------------------------------------
     * Pull To Refresh
     * ---------------------------------------------------------------
     */

    const handleRefresh =
        useCallback(() => {
            setRefreshing(
                true
            );

            loadPendingDeposits(
                false
            );
        }, [
            loadPendingDeposits,
        ]);


    /*
     * ---------------------------------------------------------------
     * Loading
     * ---------------------------------------------------------------
     */

    if (loading) {
        return (
            <SafeAreaView
                style={
                    styles.safeArea
                }
            >
                <View
                    style={
                        styles.loadingContainer
                    }
                >
                    <ActivityIndicator
                        size="large"
                        color="#2563eb"
                    />

                    <Text
                        style={
                            styles.loadingText
                        }
                    >
                        {t.loading}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }


    /*
     * ---------------------------------------------------------------
     * Render
     * ---------------------------------------------------------------
     */

    return (
        <SafeAreaView
            style={
                styles.safeArea
            }
        >
            <View
                style={
                    styles.container
                }
            >

                {/* =====================================================
                    HEADER
                   ===================================================== */}

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
                        {/* MENU BUTTON */}

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


                        {/* BRAND */}

                        <View>
                            <Text
                                style={
                                    styles.appName
                                }
                            >
                                {
                                    t.appName
                                }
                            </Text>

                            <Text
                                style={
                                    styles.appSubtitle
                                }
                            >
                                {
                                    t.appSubtitle
                                }
                            </Text>
                        </View>
                    </View>


                    {/* MEMBER INFO */}

                    <View
                        style={
                            styles.memberInfoHeader
                        }
                    >
                        <Text
                            style={
                                styles.memberNameHeader
                            }
                            numberOfLines={1}
                        >
                            {memberName ||
                                '—'}
                        </Text>

                        <Text
                            style={
                                styles.memberIdHeader
                            }
                            numberOfLines={1}
                        >
                            {t.memberId}:{' '}
                            {memberId ||
                                '—'}
                        </Text>
                    </View>
                </View>


                {/* =====================================================
                    CONTENT
                   ===================================================== */}

                <ScrollView
                    showsVerticalScrollIndicator={
                        false
                    }
                    contentContainerStyle={
                        styles.scrollContent
                    }
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
                >


                    {/* COUNT CARD */}

                    <View
                        style={
                            styles.countCard
                        }
                    >
                        <View
                            style={
                                styles.countIcon
                            }
                        >
                            <Ionicons
                                name="time-outline"
                                size={22}
                                color="#f59e0b"
                            />
                        </View>

                        <View
                            style={
                                styles.countInfo
                            }
                        >
                            <Text
                                style={
                                    styles.countLabel
                                }
                            >
                                {
                                    t.pendingRequests
                                }
                            </Text>

                            <Text
                                style={
                                    styles.countValue
                                }
                            >
                                {
                                    requests.length
                                }
                            </Text>
                        </View>
                    </View>


                    {/* ERROR */}

                    {!!error && (
                        <View
                            style={
                                styles.errorCard
                            }
                        >
                            <Ionicons
                                name="alert-circle-outline"
                                size={22}
                                color="#dc2626"
                            />

                            <View
                                style={
                                    styles.errorContent
                                }
                            >
                                <Text
                                    style={
                                        styles.errorText
                                    }
                                >
                                    {error ||
                                        t.loadError}
                                </Text>

                                <Pressable
                                    onPress={() =>
                                        loadPendingDeposits(
                                            true
                                        )
                                    }
                                    style={
                                        styles.retryButton
                                    }
                                >
                                    <Text
                                        style={
                                            styles.retryText
                                        }
                                    >
                                        {
                                            t.retry
                                        }
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    )}


                    {/* EMPTY STATE */}

                    {!error &&
                        requests.length ===
                        0 && (
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
                                        name="checkmark-circle-outline"
                                        size={34}
                                        color="#16a34a"
                                    />
                                </View>

                                <Text
                                    style={
                                        styles.emptyTitle
                                    }
                                >
                                    {
                                        t.noRequests
                                    }
                                </Text>

                                <Text
                                    style={
                                        styles.emptyDescription
                                    }
                                >
                                    {
                                        t.noRequestsDescription
                                    }
                                </Text>
                            </View>
                        )}


                    {/* REQUESTS */}

                    {requests.map(
                        (
                            request,
                            index
                        ) => (
                            <View
                                key={
                                    request.requestId ||
                                    `${request.memberId}-${index}`
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
                                            styles.requestTitleRow
                                        }
                                    >
                                        <View
                                            style={
                                                styles.requestIcon
                                            }
                                        >
                                            <Ionicons
                                                name="wallet-outline"
                                                size={19}
                                                color="#2563eb"
                                            />
                                        </View>

                                        <View
                                            style={
                                                styles.requestTitleContent
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.requestTitle
                                                }
                                            >
                                                {
                                                    t.request
                                                }{' '}
                                                #
                                                {index +
                                                    1}
                                            </Text>

                                            <Text
                                                style={
                                                    styles.requestIdText
                                                }
                                            >
                                                {
                                                    request.requestId
                                                }
                                            </Text>
                                        </View>
                                    </View>

                                    <View
                                        style={
                                            styles.pendingBadge
                                        }
                                    >
                                        <View
                                            style={
                                                styles.pendingDot
                                            }
                                        />

                                        <Text
                                            style={
                                                styles.pendingText
                                            }
                                        >
                                            {
                                                t.pending
                                            }
                                        </Text>
                                    </View>
                                </View>


                                {/* DETAILS GRID */}

                                <View
                                    style={
                                        styles.detailsGrid
                                    }
                                >

                                    <View
                                        style={
                                            styles.detailItem
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.label
                                            }
                                        >
                                            {
                                                t.shareCount
                                            }
                                        </Text>

                                        <Text
                                            style={
                                                styles.value
                                            }
                                        >
                                            {
                                                request.shareCount
                                            }{' '}
                                            {
                                                t.shareText
                                            }
                                        </Text>
                                    </View>


                                    <View
                                        style={
                                            styles.detailItem
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.label
                                            }
                                        >
                                            {
                                                t.weeklyAmount
                                            }
                                        </Text>

                                        <Text
                                            style={
                                                styles.value
                                            }
                                        >
                                            {formatMoney(
                                                request.weeklyAmount
                                            )}
                                        </Text>
                                    </View>


                                    <View
                                        style={
                                            styles.detailItem
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.label
                                            }
                                        >
                                            {
                                                t.weeks
                                            }
                                        </Text>

                                        <Text
                                            style={
                                                styles.value
                                            }
                                        >
                                            {
                                                request.weeks
                                            }{' '}
                                            {
                                                t.weeksText
                                            }
                                        </Text>
                                    </View>


                                    <View
                                        style={
                                            styles.detailItem
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.label
                                            }
                                        >
                                            {
                                                t.depositAmount
                                            }
                                        </Text>

                                        <Text
                                            style={
                                                styles.value
                                            }
                                        >
                                            {formatMoney(
                                                request.depositAmount
                                            )}
                                        </Text>
                                    </View>

                                </View>


                                {/* PAYMENT METHOD */}

                                <View
                                    style={
                                        styles.infoRow
                                    }
                                >
                                    <View
                                        style={
                                            styles.infoIcon
                                        }
                                    >
                                        <Ionicons
                                            name={
                                                request.paymentMethod ===
                                                    'bkash'
                                                    ? 'phone-portrait-outline'
                                                    : 'cash-outline'
                                            }
                                            size={18}
                                            color="#2563eb"
                                        />
                                    </View>

                                    <View
                                        style={
                                            styles.infoContent
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.label
                                            }
                                        >
                                            {
                                                t.paymentMethod
                                            }
                                        </Text>

                                        <Text
                                            style={
                                                styles.value
                                            }
                                        >
                                            {
                                                request.paymentMethod ===
                                                    'bkash'
                                                    ? t.bkash
                                                    : t.cash
                                            }
                                        </Text>
                                    </View>
                                </View>


                                {/* SENDER NUMBER */}

                                {request.paymentMethod ===
                                    'bkash' &&
                                    !!request.senderNumber && (
                                        <View
                                            style={
                                                styles.infoRow
                                            }
                                        >
                                            <View
                                                style={
                                                    styles.infoIcon
                                                }
                                            >
                                                <Ionicons
                                                    name="call-outline"
                                                    size={18}
                                                    color="#2563eb"
                                                />
                                            </View>

                                            <View
                                                style={
                                                    styles.infoContent
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.label
                                                    }
                                                >
                                                    {
                                                        t.senderNumber
                                                    }
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.value
                                                    }
                                                >
                                                    {
                                                        request.senderNumber
                                                    }
                                                </Text>
                                            </View>
                                        </View>
                                    )}


                                {/* BKASH CHARGE */}

                                {request.paymentMethod ===
                                    'bkash' &&
                                    request.bkashCharge >
                                    0 && (
                                        <View
                                            style={
                                                styles.chargeRow
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.chargeLabel
                                                }
                                            >
                                                {
                                                    t.bkashCharge
                                                }
                                            </Text>

                                            <Text
                                                style={
                                                    styles.chargeValue
                                                }
                                            >
                                                {formatMoney(
                                                    request.bkashCharge
                                                )}
                                            </Text>
                                        </View>
                                    )}


                                {/* PAYABLE */}

                                <View
                                    style={
                                        styles.payableRow
                                    }
                                >
                                    <View>
                                        <Text
                                            style={
                                                styles.payableLabel
                                            }
                                        >
                                            {
                                                t.payableAmount
                                            }
                                        </Text>
                                    </View>

                                    <Text
                                        style={
                                            styles.payableValue
                                        }
                                    >
                                        {formatMoney(
                                            request.payableAmount
                                        )}
                                    </Text>
                                </View>


                                {/* REQUEST DATE */}

                                <View
                                    style={
                                        styles.dateRow
                                    }
                                >
                                    <Ionicons
                                        name="calendar-outline"
                                        size={16}
                                        color="#64748b"
                                    />

                                    <Text
                                        style={
                                            styles.dateText
                                        }
                                    >
                                        {
                                            t.requestDate
                                        }:{' '}
                                        {formatDate(
                                            request.requestDate,
                                            language
                                        )}
                                    </Text>
                                </View>

                            </View>
                        )
                    )}

                    <View
                        style={
                            styles.bottomSpace
                        }
                    />

                </ScrollView>


                {/* =====================================================
                    SIDE MENU
                   ===================================================== */}

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
                                                {
                                                    t.appName
                                                }
                                            </Text>

                                            <Text
                                                style={
                                                    styles.drawerSubtitle
                                                }
                                            >
                                                {
                                                    t.memberPanel
                                                }
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


                                    {/* PENDING DEPOSIT - ACTIVE */}

                                    <MenuItem
                                        icon="hourglass-outline"
                                        label={
                                            t.pendingDeposit
                                        }
                                        active
                                        onPress={() =>
                                            closeMenu()
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
                                                {
                                                    t.language
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
                                                    {
                                                        t.bangla
                                                    }
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
                                            {
                                                t.logout
                                            }
                                        </Text>
                                    </Pressable>

                                </ScrollView>

                            </SafeAreaView>
                        </Animated.View>
                    </View>
                )}

            </View>
        </SafeAreaView>
    );
}


/*
|--------------------------------------------------------------------------
| Styles
|--------------------------------------------------------------------------
*/

const styles =
    StyleSheet.create({

        /*
         * ---------------------------------------------------------------
         * Main
         * ---------------------------------------------------------------
         */

        safeArea: {
            flex: 1,
            backgroundColor:
                '#f6f8fb',
        },

        container: {
            flex: 1,
            backgroundColor:
                '#f6f8fb',
        },


        /*
         * ---------------------------------------------------------------
         * Header
         * ---------------------------------------------------------------
         */

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

        memberInfoHeader: {
            maxWidth: 145,
            alignItems:
                'flex-end',
        },

        memberNameHeader: {
            fontSize: 13,
            fontWeight: '800',
            color: '#0f172a',
        },

        memberIdHeader: {
            marginTop: 2,
            fontSize: 10,
            color: '#64748b',
        },


        /*
         * ---------------------------------------------------------------
         * Content
         * ---------------------------------------------------------------
         */

        scrollContent: {
            padding: 16,
        },

        pageHeader: {
            flexDirection:
                'row',
            alignItems:
                'center',
            justifyContent:
                'space-between',
            marginBottom: 14,
        },

        pageTitle: {
            fontSize: 20,
            fontWeight: '800',
            color: '#0f172a',
        },

        pageSubtitle: {
            marginTop: 3,
            fontSize: 12,
            fontWeight: '500',
            color: '#64748b',
        },

        refreshButton: {
            width: 42,
            height: 42,
            borderRadius: 14,
            alignItems:
                'center',
            justifyContent:
                'center',
            backgroundColor:
                '#eff6ff',
            borderWidth: 1,
            borderColor:
                '#bfdbfe',
        },

        pressed: {
            opacity: 0.7,
        },


        /*
         * ---------------------------------------------------------------
         * Member Card
         * ---------------------------------------------------------------
         */

        memberCard: {
            flexDirection:
                'row',
            alignItems:
                'center',
            backgroundColor:
                '#ffffff',
            borderRadius: 16,
            borderWidth: 1,
            borderColor:
                '#e2e8f0',
            padding: 14,
            marginBottom: 12,
        },

        memberIcon: {
            width: 42,
            height: 42,
            borderRadius: 13,
            backgroundColor:
                '#dbeafe',
            alignItems:
                'center',
            justifyContent:
                'center',
        },

        memberInfo: {
            flex: 1,
            marginLeft: 12,
        },

        memberName: {
            fontSize: 16,
            fontWeight: '800',
            color: '#0f172a',
        },

        memberId: {
            marginTop: 3,
            fontSize: 12,
            color: '#64748b',
            fontWeight: '500',
        },


        /*
         * ---------------------------------------------------------------
         * Count Card
         * ---------------------------------------------------------------
         */

        countCard: {
            flexDirection:
                'row',
            alignItems:
                'center',
            backgroundColor:
                '#ffffff',
            borderRadius: 16,
            borderWidth: 1,
            borderColor:
                '#e2e8f0',
            padding: 14,
            marginBottom: 14,
        },

        countIcon: {
            width: 46,
            height: 46,
            borderRadius: 14,
            backgroundColor:
                '#fffbeb',
            alignItems:
                'center',
            justifyContent:
                'center',
        },

        countInfo: {
            marginLeft: 12,
        },

        countLabel: {
            fontSize: 12,
            color: '#64748b',
            fontWeight: '600',
        },

        countValue: {
            marginTop: 1,
            fontSize: 23,
            fontWeight: '800',
            color: '#0f172a',
        },


        /*
         * ---------------------------------------------------------------
         * Request Card
         * ---------------------------------------------------------------
         */

        requestCard: {
            backgroundColor:
                '#ffffff',
            borderRadius: 17,
            borderWidth: 1,
            borderColor:
                '#e2e8f0',
            padding: 15,
            marginBottom: 14,
        },

        requestHeader: {
            flexDirection:
                'row',
            alignItems:
                'center',
            justifyContent:
                'space-between',
            marginBottom: 14,
        },

        requestTitleRow: {
            flexDirection:
                'row',
            alignItems:
                'center',
            flex: 1,
        },

        requestIcon: {
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor:
                '#eff6ff',
            alignItems:
                'center',
            justifyContent:
                'center',
        },

        requestTitleContent: {
            flex: 1,
            marginLeft: 10,
        },

        requestTitle: {
            fontSize: 15,
            fontWeight: '800',
            color: '#0f172a',
        },

        requestIdText: {
            marginTop: 2,
            fontSize: 11,
            color: '#64748b',
            fontWeight: '600',
        },


        /*
         * ---------------------------------------------------------------
         * Pending Badge
         * ---------------------------------------------------------------
         */

        pendingBadge: {
            flexDirection:
                'row',
            alignItems:
                'center',
            paddingHorizontal: 9,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor:
                '#fff7ed',
            borderWidth: 1,
            borderColor:
                '#fed7aa',
        },

        pendingDot: {
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor:
                '#f59e0b',
            marginRight: 5,
        },

        pendingText: {
            fontSize: 10,
            fontWeight: '800',
            color: '#c2410c',
        },


        /*
         * ---------------------------------------------------------------
         * Request Details
         * ---------------------------------------------------------------
         */

        fullRow: {
            paddingVertical: 10,
            paddingHorizontal: 11,
            backgroundColor:
                '#f8fafc',
            borderRadius: 11,
            marginBottom: 10,
        },

        detailsGrid: {
            flexDirection:
                'row',
            flexWrap:
                'wrap',
            marginHorizontal: -4,
            marginBottom: 4,
        },

        detailItem: {
            width: '50%',
            paddingHorizontal: 4,
            marginBottom: 10,
        },

        label: {
            fontSize: 11,
            color: '#64748b',
            fontWeight: '600',
        },

        value: {
            marginTop: 3,
            fontSize: 13,
            color: '#0f172a',
            fontWeight: '700',
        },


        /*
         * ---------------------------------------------------------------
         * Info Row
         * ---------------------------------------------------------------
         */

        infoRow: {
            flexDirection:
                'row',
            alignItems:
                'center',
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor:
                '#f1f5f9',
        },

        infoIcon: {
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor:
                '#eff6ff',
            alignItems:
                'center',
            justifyContent:
                'center',
        },

        infoContent: {
            flex: 1,
            marginLeft: 10,
        },


        /*
         * ---------------------------------------------------------------
         * Charge
         * ---------------------------------------------------------------
         */

        chargeRow: {
            flexDirection:
                'row',
            alignItems:
                'center',
            justifyContent:
                'space-between',
            paddingVertical: 10,
            paddingHorizontal: 11,
            backgroundColor:
                '#fff7ed',
            borderRadius: 11,
            marginTop: 2,
        },

        chargeLabel: {
            fontSize: 12,
            color: '#9a3412',
            fontWeight: '700',
        },

        chargeValue: {
            fontSize: 13,
            color: '#c2410c',
            fontWeight: '800',
        },


        /*
         * ---------------------------------------------------------------
         * Payable
         * ---------------------------------------------------------------
         */

        payableRow: {
            flexDirection:
                'row',
            alignItems:
                'center',
            justifyContent:
                'space-between',
            marginTop: 10,
            padding: 13,
            borderRadius: 13,
            backgroundColor:
                '#eff6ff',
            borderWidth: 1,
            borderColor:
                '#bfdbfe',
        },

        payableLabel: {
            fontSize: 12,
            color: '#1d4ed8',
            fontWeight: '700',
        },

        payableValue: {
            fontSize: 18,
            color: '#1d4ed8',
            fontWeight: '900',
        },


        /*
         * ---------------------------------------------------------------
         * Date
         * ---------------------------------------------------------------
         */

        dateRow: {
            flexDirection:
                'row',
            alignItems:
                'center',
            marginTop: 11,
            paddingHorizontal: 2,
        },

        dateText: {
            marginLeft: 6,
            fontSize: 11,
            color: '#64748b',
            fontWeight: '500',
        },


        /*
         * ---------------------------------------------------------------
         * Empty
         * ---------------------------------------------------------------
         */

        emptyCard: {
            alignItems:
                'center',
            backgroundColor:
                '#ffffff',
            borderRadius: 17,
            borderWidth: 1,
            borderColor:
                '#e2e8f0',
            paddingHorizontal: 24,
            paddingVertical: 35,
            marginTop: 4,
        },

        emptyIcon: {
            width: 68,
            height: 68,
            borderRadius: 22,
            backgroundColor:
                '#f0fdf4',
            alignItems:
                'center',
            justifyContent:
                'center',
            marginBottom: 15,
        },

        emptyTitle: {
            fontSize: 16,
            fontWeight: '800',
            color: '#0f172a',
            textAlign:
                'center',
        },

        emptyDescription: {
            marginTop: 7,
            fontSize: 12,
            lineHeight: 19,
            color: '#64748b',
            textAlign:
                'center',
        },


        /*
         * ---------------------------------------------------------------
         * Error
         * ---------------------------------------------------------------
         */

        errorCard: {
            flexDirection:
                'row',
            backgroundColor:
                '#fef2f2',
            borderRadius: 15,
            borderWidth: 1,
            borderColor:
                '#fecaca',
            padding: 13,
            marginBottom: 14,
        },

        errorContent: {
            flex: 1,
            marginLeft: 10,
        },

        errorText: {
            fontSize: 12,
            lineHeight: 18,
            color: '#991b1b',
            fontWeight: '600',
        },

        retryButton: {
            alignSelf:
                'flex-start',
            marginTop: 8,
            paddingHorizontal: 11,
            paddingVertical: 7,
            borderRadius: 9,
            backgroundColor:
                '#dc2626',
        },

        retryText: {
            fontSize: 11,
            color: '#ffffff',
            fontWeight: '800',
        },


        /*
         * ---------------------------------------------------------------
         * Loading
         * ---------------------------------------------------------------
         */

        loadingContainer: {
            flex: 1,
            alignItems:
                'center',
            justifyContent:
                'center',
            backgroundColor:
                '#f6f8fb',
        },

        loadingText: {
            marginTop: 10,
            fontSize: 13,
            color: '#64748b',
            fontWeight: '600',
        },


        /*
         * ---------------------------------------------------------------
         * Drawer
         * ---------------------------------------------------------------
         */

        menuOverlay: {
            position: 'absolute',
            top: 0,
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
            backgroundColor:
                '#ffffff',
            shadowColor:
                '#000',
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

        drawerSafeArea: {
            flex: 1,
        },

        drawerHeader: {
            minHeight: 76,
            paddingHorizontal: 17,
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

        drawerBrand: {
            flexDirection:
                'row',
            alignItems:
                'center',
        },

        drawerLogo: {
            width: 43,
            height: 43,
            borderRadius: 12,
            backgroundColor:
                '#0f172a',
            alignItems:
                'center',
            justifyContent:
                'center',
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
            backgroundColor:
                '#f1f5f9',
            alignItems:
                'center',
            justifyContent:
                'center',
        },

        closeButtonPressed: {
            opacity: 0.65,
        },

        menuScroll: {
            paddingHorizontal: 9,
            paddingBottom: 15,
        },

        firstMenuItem: {
            marginTop: 7,
        },


        /*
         * ---------------------------------------------------------------
         * Menu Items
         * ---------------------------------------------------------------
         */

        menuItem: {
            minHeight: 46,
            borderRadius: 10,
            paddingHorizontal: 12,
            flexDirection:
                'row',
            alignItems:
                'center',
            marginBottom: 2,
            overflow: 'hidden',
        },

        menuItemActive: {
            backgroundColor:
                '#0f172a',
        },

        menuItemIconContainer: {
            width: 20,
            height: 20,
            alignItems:
                'center',
            justifyContent:
                'center',
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


        /*
         * ---------------------------------------------------------------
         * Divider
         * ---------------------------------------------------------------
         */

        menuDivider: {
            height: 1,
            backgroundColor:
                '#e2e8f0',
            marginVertical: 10,
            marginHorizontal: 7,
        },


        /*
         * ---------------------------------------------------------------
         * Language
         * ---------------------------------------------------------------
         */

        languageMenu: {
            minHeight: 55,
            paddingHorizontal: 12,
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
            flex: 1,
        },

        languageOptions: {
            flexDirection:
                'row',
            padding: 3,
            borderRadius: 9,
            backgroundColor:
                '#f1f5f9',
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
            backgroundColor:
                '#0f172a',
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


        /*
         * ---------------------------------------------------------------
         * Logout
         * ---------------------------------------------------------------
         */

        logoutButton: {
            minHeight: 46,
            borderRadius: 10,
            paddingHorizontal: 12,
            flexDirection:
                'row',
            alignItems:
                'center',
            backgroundColor:
                '#fef2f2',
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


        /*
         * ---------------------------------------------------------------
         * Bottom Space
         * ---------------------------------------------------------------
         */

        bottomSpace: {
            height: 30,
        },
    });