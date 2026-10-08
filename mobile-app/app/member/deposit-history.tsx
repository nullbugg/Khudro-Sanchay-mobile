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
    clearCurrentMember,
    getCurrentMember,
    getMemberDepositHistory,
    MemberDepositHistoryResult,
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
        return '-';
    }

    const raw =
        String(value).trim();

    let date: Date | null = null;

    /*
     * DD-MM-YYYY
     */
    const ddmmyyyy =
        raw.match(
            /^(\d{2})-(\d{2})-(\d{4})$/
        );

    if (ddmmyyyy) {
        const day =
            Number(
                ddmmyyyy[1]
            );

        const month =
            Number(
                ddmmyyyy[2]
            ) - 1;

        const year =
            Number(
                ddmmyyyy[3]
            );

        date =
            new Date(
                year,
                month,
                day
            );
    }

    /*
     * DD/MM/YYYY
     */
    if (!date) {
        const ddmmyyyySlash =
            raw.match(
                /^(\d{2})\/(\d{2})\/(\d{4})$/
            );

        if (ddmmyyyySlash) {
            const day =
                Number(
                    ddmmyyyySlash[1]
                );

            const month =
                Number(
                    ddmmyyyySlash[2]
                ) - 1;

            const year =
                Number(
                    ddmmyyyySlash[3]
                );

            date =
                new Date(
                    year,
                    month,
                    day
                );
        }
    }

    /*
     * YYYY-MM-DD
     */
    if (!date) {
        const yyyymmdd =
            raw.match(
                /^(\d{4})-(\d{2})-(\d{2})$/
            );

        if (yyyymmdd) {
            const year =
                Number(
                    yyyymmdd[1]
                );

            const month =
                Number(
                    yyyymmdd[2]
                ) - 1;

            const day =
                Number(
                    yyyymmdd[3]
                );

            date =
                new Date(
                    year,
                    month,
                    day
                );
        }
    }

    if (
        !date ||
        Number.isNaN(
            date.getTime()
        )
    ) {
        return raw;
    }

    if (
        language === 'bn'
    ) {
        return date.toLocaleDateString(
            'bn-BD',
            {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            }
        );
    }

    return date.toLocaleDateString(
        'en-GB',
        {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }
    );
}

function formatDateTime(
    value: string,
    language: MemberLanguage
): string {
    if (!value) {
        return '-';
    }

    const raw =
        String(value).trim();

    const date =
        new Date(raw);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return raw;
    }

    const day =
        String(
            date.getDate()
        ).padStart(2, '0');

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, '0');

    const year =
        date.getFullYear();

    let hours =
        date.getHours();

    const minutes =
        String(
            date.getMinutes()
        ).padStart(2, '0');

    const seconds =
        String(
            date.getSeconds()
        ).padStart(2, '0');

    const period =
        hours >= 12
            ? 'PM'
            : 'AM';

    hours =
        hours % 12;

    if (hours === 0) {
        hours = 12;
    }

    const formattedHours =
        String(hours).padStart(
            2,
            '0'
        );

    return `${day}-${month}-${year} ${formattedHours}:${minutes}:${seconds} ${period}`;
}

/*
|--------------------------------------------------------------------------
| Status Helper
|--------------------------------------------------------------------------
*/

type DepositStatus =
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED';

function getStatus(
    value: string
): DepositStatus {
    const status =
        String(
            value ?? ''
        )
            .trim()
            .toUpperCase();

    if (
        status ===
        'APPROVED'
    ) {
        return 'APPROVED';
    }

    if (
        status ===
        'REJECTED'
    ) {
        return 'REJECTED';
    }

    return 'PENDING';
}

/*
|--------------------------------------------------------------------------
| Status UI
|--------------------------------------------------------------------------
*/

function getStatusInfo(
    status: DepositStatus,
    language: MemberLanguage
) {
    if (
        status ===
        'APPROVED'
    ) {
        return {
            label:
                language === 'bn'
                    ? 'অনুমোদিত'
                    : 'APPROVED',

            icon:
                'checkmark-circle' as const,

            background:
                '#f0fdf4',

            border:
                '#bbf7d0',

            text:
                '#15803d',
        };
    }

    if (
        status ===
        'REJECTED'
    ) {
        return {
            label:
                language === 'bn'
                    ? 'বাতিল'
                    : 'REJECTED',

            icon:
                'close-circle' as const,

            background:
                '#fef2f2',

            border:
                '#fecaca',

            text:
                '#dc2626',
        };
    }

    return {
        label:
            language === 'bn'
                ? 'অপেক্ষমাণ'
                : 'PENDING',

        icon:
            'time' as const,

        background:
            '#fff7ed',

        border:
            '#fed7aa',

        text:
            '#c2410c',
    };
}

/*
|--------------------------------------------------------------------------
| Payment Method
|--------------------------------------------------------------------------
*/

function getPaymentMethodLabel(
    paymentMethod: string,
    language: MemberLanguage
): string {
    if (
        String(
            paymentMethod
        ).toLowerCase() ===
        'bkash'
    ) {
        return 'bKash';
    }

    return language === 'bn'
        ? 'ক্যাশ'
        : 'Cash';
}

/*
|--------------------------------------------------------------------------
| Deposit History Card
|--------------------------------------------------------------------------
*/

function DepositHistoryCard({
    request,
    language,
}: {
    request: MemberPendingDeposit;
    language: MemberLanguage;
}) {
    const status =
        getStatus(
            request.status
        );

    const statusInfo =
        getStatusInfo(
            status,
            language
        );

    return (
        <View
            style={
                styles.requestCard
            }
        >
            {/* Header */}
            <View
                style={
                    styles.cardHeader
                }
            >
                <View
                    style={
                        styles.requestTitleArea
                    }
                >
                    <View
                        style={
                            styles.requestIcon
                        }
                    >
                        <Ionicons
                            name="wallet-outline"
                            size={20}
                            color="#2563eb"
                        />
                    </View>

                    <View
                        style={
                            styles.requestTitleText
                        }
                    >
                        <Text
                            style={
                                styles.requestTitle
                            }
                            numberOfLines={
                                1
                            }
                        >
                            {language ===
                                'bn'
                                ? 'জমার আবেদন'
                                : 'Deposit Request'}
                        </Text>

                        <Text
                            style={
                                styles.requestId
                            }
                            numberOfLines={
                                1
                            }
                        >
                            {request.requestId ||
                                '-'}
                        </Text>
                    </View>
                </View>

                <View
                    style={[
                        styles.statusBadge,
                        {
                            backgroundColor:
                                statusInfo.background,

                            borderColor:
                                statusInfo.border,
                        },
                    ]}
                >
                    <Ionicons
                        name={
                            statusInfo.icon
                        }
                        size={15}
                        color={
                            statusInfo.text
                        }
                    />

                    <Text
                        style={[
                            styles.statusText,
                            {
                                color:
                                    statusInfo.text,
                            },
                        ]}
                    >
                        {
                            statusInfo.label
                        }
                    </Text>
                </View>
            </View>

            {/* Divider */}
            <View
                style={
                    styles.divider
                }
            />

            {/* Amount */}
            <View
                style={
                    styles.amountBox
                }
            >
                <View>
                    <Text
                        style={
                            styles.amountLabel
                        }
                    >
                        {language ===
                            'bn'
                            ? 'মোট জমা'
                            : 'Total Deposit'}
                    </Text>

                    <Text
                        style={
                            styles.amountValue
                        }
                    >
                        {formatMoney(
                            request.depositAmount
                        )}
                    </Text>
                </View>

                <View
                    style={
                        styles.weeksBox
                    }
                >
                    <Text
                        style={
                            styles.amountLabel
                        }
                    >
                        {language ===
                            'bn'
                            ? 'কত সপ্তাহের জমা'
                            : 'Weeks'}
                    </Text>

                    <Text
                        style={
                            styles.weeksValue
                        }
                    >
                        {request.weeks}
                    </Text>
                </View>
            </View>

            {/* Details */}
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
                            styles.detailLabel
                        }
                    >
                        {language ===
                            'bn'
                            ? 'শেয়ার'
                            : 'Shares'}
                    </Text>

                    <Text
                        style={
                            styles.detailValue
                        }
                    >
                        {request.shareCount}
                    </Text>
                </View>

                <View
                    style={
                        styles.detailItem
                    }
                >
                    <Text
                        style={
                            styles.detailLabel
                        }
                    >
                        {language ===
                            'bn'
                            ? 'সাপ্তাহিক জমা'
                            : 'Weekly'}
                    </Text>

                    <Text
                        style={
                            styles.detailValue
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
                            styles.detailLabel
                        }
                    >
                        {language ===
                            'bn'
                            ? 'পেমেন্ট'
                            : 'Payment'}
                    </Text>

                    <Text
                        style={
                            styles.detailValue
                        }
                    >
                        {getPaymentMethodLabel(
                            request.paymentMethod,
                            language
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
                            styles.detailLabel
                        }
                    >
                        {language ===
                            'bn'
                            ? 'আবেদনের তারিখ ও সময়'
                            : 'Request Date'}
                    </Text>

                    <Text
                        style={
                            styles.detailValue
                        }
                    >
                        {formatDateTime(
                            request.requestDate,
                            language
                        )}
                    </Text>
                </View>
            </View>

            {/* bKash information */}
            {String(
                request.paymentMethod
            ).toLowerCase() ===
                'bkash' &&
                request.senderNumber ? (
                <View
                    style={
                        styles.infoRow
                    }
                >
                    <Ionicons
                        name="phone-portrait-outline"
                        size={17}
                        color="#64748b"
                    />

                    <Text
                        style={
                            styles.infoLabel
                        }
                    >
                        {language ===
                            'bn'
                            ? 'যে নম্বর থেকে টাকা পাঠানো হয়েছে'
                            : 'Send Money Number'}
                    </Text>

                    <Text
                        style={
                            styles.infoValue
                        }
                    >
                        {
                            request.senderNumber
                        }
                    </Text>
                </View>
            ) : null}

            {/* bKash charge */}
            {Number(
                request.bkashCharge
            ) > 0 ? (
                <View
                    style={
                        styles.infoRow
                    }
                >
                    <Ionicons
                        name="receipt-outline"
                        size={17}
                        color="#64748b"
                    />

                    <Text
                        style={
                            styles.infoLabel
                        }
                    >
                        {language ===
                            'bn'
                            ? 'bKash চার্জ'
                            : 'bKash Charge'}
                    </Text>

                    <Text
                        style={
                            styles.infoValue
                        }
                    >
                        {formatMoney(
                            request.bkashCharge
                        )}
                    </Text>
                </View>
            ) : null}

            {/* Payable */}
            {Number(
                request.payableAmount
            ) > 0 &&
                String(
                    request.paymentMethod
                ).toLowerCase() ===
                'bkash' ? (
                <View
                    style={
                        styles.infoRow
                    }
                >
                    <Ionicons
                        name="cash-outline"
                        size={17}
                        color="#64748b"
                    />

                    <Text
                        style={
                            styles.infoLabel
                        }
                    >
                        {language ===
                            'bn'
                            ? 'পরিশোধযোগ্য'
                            : 'Payable'}
                    </Text>

                    <Text
                        style={[
                            styles.infoValue,
                            styles.payableValue,
                        ]}
                    >
                        {formatMoney(
                            request.payableAmount
                        )}
                    </Text>
                </View>
            ) : null}

            {/* Approved Date */}
            {status !==
                'PENDING' &&
                request.approvedDate ? (
                <View
                    style={
                        styles.infoRow
                    }
                >
                    <Ionicons
                        name={
                            status ===
                                'APPROVED'
                                ? 'checkmark-done-outline'
                                : 'calendar-outline'
                        }
                        size={17}
                        color="#64748b"
                    />

                    <Text
                        style={
                            styles.infoLabel
                        }
                    >
                        {status ===
                            'APPROVED'
                            ? language ===
                                'bn'
                                ? 'অনুমোদনের তারিখ ও সময়'
                                : 'Approved Date'
                            : language ===
                                'bn'
                                ? 'প্রক্রিয়ার তারিখ'
                                : 'Processed Date'}
                    </Text>

                    <Text
                        style={
                            styles.infoValue
                        }
                    >
                        {formatDateTime(
                            request.approvedDate,
                            language
                        )}
                    </Text>
                </View>
            ) : null}

            {/* Notes */}
            {request.notes ? (
                <View
                    style={
                        styles.notesBox
                    }
                >
                    <View
                        style={
                            styles.notesHeader
                        }
                    >
                        <Ionicons
                            name="information-circle-outline"
                            size={17}
                            color="#64748b"
                        />

                        <Text
                            style={
                                styles.notesLabel
                            }
                        >
                            {language ===
                                'bn'
                                ? 'নোট'
                                : 'Note'}
                        </Text>
                    </View>

                    <Text
                        style={
                            styles.notesText
                        }
                    >
                        {
                            request.notes
                        }
                    </Text>
                </View>
            ) : null}
        </View>
    );
}

/*
|--------------------------------------------------------------------------
| Drawer Menu Item
|--------------------------------------------------------------------------
*/

function MenuItem({
    icon,
    label,
    active = false,
    onPress,
}: {
    icon: React.ComponentProps<
        typeof Ionicons
    >['name'];
    label: string;
    active?: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={
                onPress
            }
            style={({
                pressed,
            }) => [
                    styles.menuItem,
                    active &&
                    styles.menuItemActive,
                    pressed &&
                    !active &&
                    styles.menuItemPressed,
                ]}
        >
            <View
                style={
                    styles.menuItemIconContainer
                }
            >
                <Ionicons
                    name={icon}
                    size={19}
                    color={
                        active
                            ? '#ffffff'
                            : '#64748b'
                    }
                />
            </View>

            <Text
                style={[
                    styles.menuItemText,
                    active &&
                    styles.menuItemTextActive,
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
}

/*
|--------------------------------------------------------------------------
| Menu Divider
|--------------------------------------------------------------------------
*/

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

export default function DepositHistoryScreen() {
    const [
        language,
        setLanguage,
    ] = useState<MemberLanguage>(
        'bn'
    );

    const [
        memberName,
        setMemberName,
    ] = useState('');

    const [
        memberId,
        setMemberId,
    ] = useState('');

    const [
        requests,
        setRequests,
    ] = useState<
        MemberPendingDeposit[]
    >([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        refreshing,
        setRefreshing,
    ] = useState(false);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState('');

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
            new Animated.Value(
                -315
            )
        ).current;

    const overlayOpacity =
        useRef(
            new Animated.Value(
                0
            )
        ).current;

    /*
     * ---------------------------------------------------------------
     * Translations
     * ---------------------------------------------------------------
     */

    const t =
        language === 'bn'
            ? {
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
                    'সাপ্তাহিক জমার ইতিহাস',

                summaryTitle:
                    'জমার আবেদন',

                summarySubtitle:
                    'মোট আবেদন',

                pending:
                    'অপেক্ষমাণ',

                approved:
                    'অনুমোদিত',

                rejected:
                    'বাতিল',

                loading:
                    'ইতিহাস লোড হচ্ছে...',

                error:
                    'Deposit history load করা যায়নি',

                emptyTitle:
                    'কোনো জমার ইতিহাস নেই',

                emptyText:
                    'আপনি যখন কোনো জমার আবেদন করবেন, সেটি এখানে দেখা যাবে।',

                logoutTitle:
                    'লগআউট',

                logoutMessage:
                    'আপনি কি লগআউট করতে চান?',

                cancel:
                    'বাতিল',

                logoutConfirm:
                    'লগআউট',
            }
            : {
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
                    'Weekly Deposit History',

                summaryTitle:
                    'Deposit Requests',

                summarySubtitle:
                    'Total requests',

                pending:
                    'Pending',

                approved:
                    'Approved',

                rejected:
                    'Rejected',

                loading:
                    'Loading history...',

                error:
                    'Deposit history could not be loaded',

                emptyTitle:
                    'No deposit history',

                emptyText:
                    'Your deposit requests will appear here when you make a deposit request.',

                logoutTitle:
                    'Logout',

                logoutMessage:
                    'Are you sure you want to logout?',

                cancel:
                    'Cancel',

                logoutConfirm:
                    'Logout',
            };

    /*
     * ---------------------------------------------------------------
     * Drawer
     * ---------------------------------------------------------------
     */

    const openMenu =
        useCallback(() => {
            setMenuMounted(
                true
            );

            setMenuOpen(
                true
            );

            requestAnimationFrame(
                () => {
                    Animated.parallel(
                        [
                            Animated.timing(
                                drawerTranslateX,
                                {
                                    toValue: 0,
                                    duration: 260,
                                    easing:
                                        Easing.out(
                                            Easing.cubic
                                        ),
                                    useNativeDriver:
                                        true,
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
                                    useNativeDriver:
                                        true,
                                }
                            ),
                        ]
                    ).start();
                }
            );
        }, [
            drawerTranslateX,
            overlayOpacity,
        ]);

    const closeMenu =
        useCallback(
            (
                callback?: () => void
            ) => {
                setMenuOpen(
                    false
                );

                Animated.parallel(
                    [
                        Animated.timing(
                            drawerTranslateX,
                            {
                                toValue:
                                    -315,
                                duration: 230,
                                easing:
                                    Easing.in(
                                        Easing.cubic
                                    ),
                                useNativeDriver:
                                    true,
                            }
                        ),

                        Animated.timing(
                            overlayOpacity,
                            {
                                toValue: 0,
                                duration: 200,
                                easing:
                                    Easing.in(
                                        Easing.cubic
                                    ),
                                useNativeDriver:
                                    true,
                            }
                        ),
                    ]
                ).start(
                    () => {
                        setMenuMounted(
                            false
                        );

                        if (
                            callback
                        ) {
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

    const handleMenuPress =
        useCallback(
            (
                path: string
            ) => {
                closeMenu(
                    () => {
                        router.push(
                            path as any
                        );
                    }
                );
            },
            [
                closeMenu,
            ]
        );

    /*
     * ---------------------------------------------------------------
     * Language
     * ---------------------------------------------------------------
     */

    const changeLanguage =
        useCallback(
            async (
                nextLanguage: MemberLanguage
            ) => {
                setLanguage(
                    nextLanguage
                );

                await setMemberLanguage(
                    nextLanguage
                );
            },
            []
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
                                        await clearCurrentMember();

                                        router.replace(
                                            '/member/login'
                                        );
                                    },
                            },
                        ]
                    );
                }
            );
        }, [
            closeMenu,
            t,
        ]);

    /*
     * ---------------------------------------------------------------
     * Load History
     * ---------------------------------------------------------------
     */

    const loadHistory =
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

                    setErrorMessage(
                        ''
                    );

                    const savedLanguage =
                        await getMemberLanguage();

                    setLanguage(
                        savedLanguage
                    );

                    const memberResult =
                        await getCurrentMember();

                    if (
                        !memberResult.success ||
                        !memberResult.member
                    ) {
                        setRequests(
                            []
                        );

                        setErrorMessage(
                            savedLanguage ===
                                'bn'
                                ? 'Member session পাওয়া যায়নি। আবার login করুন।'
                                : 'Member session was not found. Please login again.'
                        );

                        router.replace(
                            '/member/login'
                        );

                        return;
                    }

                    const member =
                        memberResult.member;

                    setMemberName(
                        member.memberName
                    );

                    setMemberId(
                        member.memberId
                    );

                    const historyResult:
                        MemberDepositHistoryResult =
                        await getMemberDepositHistory(
                            member.memberId
                        );

                    if (
                        !historyResult.success
                    ) {
                        setRequests(
                            []
                        );

                        setErrorMessage(
                            historyResult.message ||
                            (
                                savedLanguage ===
                                    'bn'
                                    ? 'Deposit history load করা যায়নি'
                                    : 'Deposit history could not be loaded'
                            )
                        );

                        return;
                    }

                    setRequests(
                        Array.isArray(
                            historyResult.requests
                        )
                            ? historyResult.requests
                            : []
                    );
                } catch (
                error
                ) {
                    console.error(
                        'Deposit history screen error:',
                        error
                    );

                    setRequests(
                        []
                    );

                    setErrorMessage(
                        language ===
                            'bn'
                            ? 'Deposit history load করা যায়নি'
                            : 'Deposit history could not be loaded'
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
            [
                language,
            ]
        );

    /*
     * ---------------------------------------------------------------
     * Focus Load
     * ---------------------------------------------------------------
     */

    useFocusEffect(
        useCallback(
            () => {
                loadHistory();

                return () => { };
            },
            [
                loadHistory,
            ]
        )
    );

    /*
     * ---------------------------------------------------------------
     * Refresh
     * ---------------------------------------------------------------
     */

    const handleRefresh =
        useCallback(
            async () => {
                setRefreshing(
                    true
                );

                await loadHistory(
                    false
                );
            },
            [
                loadHistory,
            ]
        );

    /*
     * ---------------------------------------------------------------
     * Status Counts
     * ---------------------------------------------------------------
     */

    const pendingCount =
        requests.filter(
            (item) =>
                getStatus(
                    item.status
                ) === 'PENDING'
        ).length;

    const approvedCount =
        requests.filter(
            (item) =>
                getStatus(
                    item.status
                ) === 'APPROVED'
        ).length;

    const rejectedCount =
        requests.filter(
            (item) =>
                getStatus(
                    item.status
                ) === 'REJECTED'
        ).length;

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
            edges={[
                'top',
                'bottom',
            ]}
        >
            {/* Header */}
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
                        style={({
                            pressed,
                        }) => [
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

                <View
                    style={
                        styles.memberInfoHeader
                    }
                >
                    <Text
                        style={
                            styles.memberNameHeader
                        }
                        numberOfLines={
                            1
                        }
                    >
                        {
                            memberName ||
                            '—'
                        }
                    </Text>

                    <Text
                        style={
                            styles.memberIdHeader
                        }
                        numberOfLines={
                            1
                        }
                    >
                        {t.memberId}:{' '}
                        {
                            memberId ||
                            '—'
                        }
                    </Text>
                </View>
            </View>

            {/* Content */}
            <ScrollView
                style={
                    styles.scrollView
                }
                contentContainerStyle={
                    styles.contentContainer
                }
                showsVerticalScrollIndicator={
                    false
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
                {/* Summary */}
                <View
                    style={
                        styles.summaryCard
                    }
                >
                    <View
                        style={
                            styles.summaryHeader
                        }
                    >
                        <View
                            style={
                                styles.summaryIcon
                            }
                        >
                            <Ionicons
                                name="receipt-outline"
                                size={20}
                                color="#2563eb"
                            />
                        </View>

                        <View>
                            <Text
                                style={
                                    styles.summaryTitle
                                }
                            >
                                {
                                    t.summaryTitle
                                }
                            </Text>

                            <Text
                                style={
                                    styles.summarySubtitle
                                }
                            >
                                {
                                    t.summarySubtitle
                                }
                            </Text>
                        </View>

                        <View
                            style={
                                styles.totalCount
                            }
                        >
                            <Text
                                style={
                                    styles.totalCountText
                                }
                            >
                                {
                                    requests.length
                                }
                            </Text>
                        </View>
                    </View>

                    <View
                        style={
                            styles.summaryDivider
                        }
                    />

                    <View
                        style={
                            styles.statusCounts
                        }
                    >
                        <View
                            style={
                                styles.statusCountItem
                            }
                        >
                            <View
                                style={[
                                    styles.countDot,
                                    {
                                        backgroundColor:
                                            '#f97316',
                                    },
                                ]}
                            />

                            <Text
                                style={
                                    styles.countLabel
                                }
                            >
                                {
                                    t.pending
                                }
                            </Text>

                            <Text
                                style={
                                    styles.countValue
                                }
                            >
                                {
                                    pendingCount
                                }
                            </Text>
                        </View>

                        <View
                            style={
                                styles.statusCountItem
                            }
                        >
                            <View
                                style={[
                                    styles.countDot,
                                    {
                                        backgroundColor:
                                            '#16a34a',
                                    },
                                ]}
                            />

                            <Text
                                style={
                                    styles.countLabel
                                }
                            >
                                {
                                    t.approved
                                }
                            </Text>

                            <Text
                                style={
                                    styles.countValue
                                }
                            >
                                {
                                    approvedCount
                                }
                            </Text>
                        </View>

                        <View
                            style={
                                styles.statusCountItem
                            }
                        >
                            <View
                                style={[
                                    styles.countDot,
                                    {
                                        backgroundColor:
                                            '#dc2626',
                                    },
                                ]}
                            />

                            <Text
                                style={
                                    styles.countLabel
                                }
                            >
                                {
                                    t.rejected
                                }
                            </Text>

                            <Text
                                style={
                                    styles.countValue
                                }
                            >
                                {
                                    rejectedCount
                                }
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Loading */}
                {loading ? (
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
                            {
                                t.loading
                            }
                        </Text>
                    </View>
                ) : null}

                {/* Error */}
                {!loading &&
                    errorMessage ? (
                    <View
                        style={
                            styles.errorCard
                        }
                    >
                        <Ionicons
                            name="alert-circle-outline"
                            size={24}
                            color="#dc2626"
                        />

                        <Text
                            style={
                                styles.errorText
                            }
                        >
                            {
                                errorMessage
                            }
                        </Text>
                    </View>
                ) : null}

                {/* Empty */}
                {!loading &&
                    !errorMessage &&
                    requests.length ===
                    0 ? (
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
                                name="receipt-outline"
                                size={34}
                                color="#94a3b8"
                            />
                        </View>

                        <Text
                            style={
                                styles.emptyTitle
                            }
                        >
                            {
                                t.emptyTitle
                            }
                        </Text>

                        <Text
                            style={
                                styles.emptyText
                            }
                        >
                            {
                                t.emptyText
                            }
                        </Text>
                    </View>
                ) : null}

                {/* History List */}
                {!loading &&
                    !errorMessage &&
                    requests.length >
                    0 ? (
                    <View
                        style={
                            styles.historyList
                        }
                    >
                        {requests.map(
                            (
                                request,
                                index
                            ) => (
                                <DepositHistoryCard
                                    key={`${request.requestId}-${request.rowIndex ?? index}`}
                                    request={
                                        request
                                    }
                                    language={
                                        language
                                    }
                                />
                            )
                        )}
                    </View>
                ) : null}

                <View
                    style={
                        styles.bottomSpace
                    }
                />
            </ScrollView>

            {/* Drawer */}
            {menuMounted ? (
                <View
                    style={
                        styles.menuOverlay
                    }
                >
                    <Animated.View
                        style={[
                            styles.overlayBackground,
                            {
                                opacity:
                                    overlayOpacity,
                            },
                        ]}
                    />

                    <Pressable
                        style={
                            styles.overlayPressable
                        }
                        onPress={() =>
                            closeMenu()
                        }
                    />

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
                                'top',
                                'bottom',
                            ]}
                        >
                            {/* Drawer Header */}
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
                                    style={({
                                        pressed,
                                    }) => [
                                            styles.closeButton,
                                            pressed &&
                                            styles.closeButtonPressed,
                                        ]}
                                >
                                    <Ionicons
                                        name="close"
                                        size={22}
                                        color="#475569"
                                    />
                                </Pressable>
                            </View>

                            {/* Menu */}
                            <ScrollView
                                showsVerticalScrollIndicator={
                                    false
                                }
                                contentContainerStyle={
                                    styles.menuScroll
                                }
                            >
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

                                    <MenuItem
                                        icon="receipt-outline"
                                        label={
                                            t.weeklyHistory
                                        }
                                        active
                                        onPress={() =>
                                            closeMenu()
                                        }
                                    />

                                    <MenuDivider />

                                    {/* Language */}
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
                                            <View
                                                style={
                                                    styles.menuItemIconContainer
                                                }
                                            >
                                                <Ionicons
                                                    name="language-outline"
                                                    size={19}
                                                    color="#64748b"
                                                />
                                            </View>

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
                                                    {
                                                        t.english
                                                    }
                                                </Text>
                                            </Pressable>
                                        </View>
                                    </View>

                                    <MenuDivider />

                                    {/* Logout */}
                                    <Pressable
                                        onPress={
                                            handleLogout
                                        }
                                        style={({
                                            pressed,
                                        }) => [
                                                styles.logoutButton,
                                                pressed &&
                                                styles.logoutButtonPressed,
                                            ]}
                                    >
                                        <Ionicons
                                            name="log-out-outline"
                                            size={19}
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
                                </View>
                            </ScrollView>
                        </SafeAreaView>
                    </Animated.View>
                </View>
            ) : null}
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
            marginLeft: 10,
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

        scrollView: {
            flex: 1,
        },

        contentContainer: {
            padding: 16,
        },

        /*
         * ---------------------------------------------------------------
         * Summary
         * ---------------------------------------------------------------
         */

        summaryCard: {
            backgroundColor:
                '#ffffff',
            borderWidth: 1,
            borderColor:
                '#e2e8f0',
            borderRadius: 16,
            padding: 16,
            marginBottom: 14,
        },

        summaryHeader: {
            flexDirection:
                'row',
            alignItems:
                'center',
        },

        summaryIcon: {
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor:
                '#eff6ff',
            alignItems:
                'center',
            justifyContent:
                'center',
            marginRight: 11,
        },

        summaryTitle: {
            fontSize: 15,
            fontWeight: '700',
            color: '#0f172a',
        },

        summarySubtitle: {
            marginTop: 2,
            fontSize: 12,
            color: '#64748b',
        },

        totalCount: {
            marginLeft: 'auto',
            minWidth: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor:
                '#eff6ff',
            alignItems:
                'center',
            justifyContent:
                'center',
        },

        totalCountText: {
            fontSize: 16,
            fontWeight: '800',
            color: '#2563eb',
        },

        summaryDivider: {
            height: 1,
            backgroundColor:
                '#e2e8f0',
            marginVertical: 14,
        },

        statusCounts: {
            flexDirection:
                'row',
            justifyContent:
                'space-between',
        },

        statusCountItem: {
            flexDirection:
                'row',
            alignItems:
                'center',
            flex: 1,
        },

        countDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            marginRight: 6,
        },

        countLabel: {
            fontSize: 11,
            color: '#64748b',
            flexShrink: 1,
        },

        countValue: {
            marginLeft: 5,
            fontSize: 13,
            fontWeight: '800',
            color: '#334155',
        },

        /*
         * ---------------------------------------------------------------
         * Loading / Error / Empty
         * ---------------------------------------------------------------
         */

        loadingContainer: {
            minHeight: 180,
            alignItems:
                'center',
            justifyContent:
                'center',
        },

        loadingText: {
            marginTop: 10,
            fontSize: 13,
            color: '#64748b',
        },

        errorCard: {
            backgroundColor:
                '#fef2f2',
            borderWidth: 1,
            borderColor:
                '#fecaca',
            borderRadius: 16,
            padding: 18,
            flexDirection:
                'row',
            alignItems:
                'center',
            gap: 10,
        },

        errorText: {
            flex: 1,
            fontSize: 13,
            lineHeight: 20,
            color: '#b91c1c',
        },

        emptyCard: {
            backgroundColor:
                '#ffffff',
            borderWidth: 1,
            borderColor:
                '#e2e8f0',
            borderRadius: 16,
            paddingHorizontal: 24,
            paddingVertical: 38,
            alignItems:
                'center',
        },

        emptyIcon: {
            width: 68,
            height: 68,
            borderRadius: 20,
            backgroundColor:
                '#f1f5f9',
            alignItems:
                'center',
            justifyContent:
                'center',
            marginBottom: 14,
        },

        emptyTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: '#334155',
            textAlign:
                'center',
        },

        emptyText: {
            marginTop: 7,
            fontSize: 13,
            lineHeight: 20,
            color: '#64748b',
            textAlign:
                'center',
        },

        /*
         * ---------------------------------------------------------------
         * History
         * ---------------------------------------------------------------
         */

        historyList: {
            gap: 12,
        },

        requestCard: {
            backgroundColor:
                '#ffffff',
            borderWidth: 1,
            borderColor:
                '#e2e8f0',
            borderRadius: 16,
            padding: 15,
        },

        cardHeader: {
            flexDirection:
                'row',
            alignItems:
                'center',
            justifyContent:
                'space-between',
        },

        requestTitleArea: {
            flexDirection:
                'row',
            alignItems:
                'center',
            flex: 1,
            marginRight: 8,
        },

        requestIcon: {
            width: 40,
            height: 40,
            borderRadius: 11,
            backgroundColor:
                '#eff6ff',
            alignItems:
                'center',
            justifyContent:
                'center',
            marginRight: 10,
        },

        requestTitleText: {
            flex: 1,
        },

        requestTitle: {
            fontSize: 14,
            fontWeight: '700',
            color: '#0f172a',
        },

        requestId: {
            marginTop: 2,
            fontSize: 11,
            color: '#64748b',
        },

        statusBadge: {
            minHeight: 30,
            paddingHorizontal: 9,
            borderRadius: 9,
            borderWidth: 1,
            flexDirection:
                'row',
            alignItems:
                'center',
            gap: 4,
        },

        statusText: {
            fontSize: 10,
            fontWeight: '800',
        },

        divider: {
            height: 1,
            backgroundColor:
                '#e2e8f0',
            marginVertical: 13,
        },

        amountBox: {
            backgroundColor:
                '#f8fbff',
            borderWidth: 1,
            borderColor:
                '#dbeafe',
            borderRadius: 12,
            paddingHorizontal: 13,
            paddingVertical: 11,
            flexDirection:
                'row',
            alignItems:
                'center',
            justifyContent:
                'space-between',
            marginBottom: 12,
        },

        amountLabel: {
            fontSize: 11,
            color: '#64748b',
        },

        amountValue: {
            marginTop: 3,
            fontSize: 18,
            fontWeight: '800',
            color: '#2563eb',
        },

        weeksBox: {
            alignItems:
                'flex-end',
        },

        weeksValue: {
            marginTop: 3,
            fontSize: 17,
            fontWeight: '800',
            color: '#334155',
        },

        detailsGrid: {
            flexDirection:
                'row',
            flexWrap:
                'wrap',
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderColor:
                '#e2e8f0',
            borderRadius: 10,
            overflow: 'hidden',
        },

        detailItem: {
            width: '50%',
            minHeight: 58,
            paddingHorizontal: 10,
            paddingVertical: 9,
            borderRightWidth: 1,
            borderBottomWidth: 1,
            borderColor:
                '#e2e8f0',
        },

        detailLabel: {
            fontSize: 10,
            color: '#94a3b8',
        },

        detailValue: {
            marginTop: 4,
            fontSize: 12,
            fontWeight: '700',
            color: '#334155',
        },

        infoRow: {
            minHeight: 38,
            marginTop: 8,
            paddingHorizontal: 10,
            paddingVertical: 8,
            backgroundColor:
                '#f8fafc',
            borderRadius: 9,
            flexDirection:
                'row',
            alignItems:
                'center',
        },

        infoLabel: {
            marginLeft: 7,
            fontSize: 11,
            color: '#64748b',
            flex: 1,
        },

        infoValue: {
            fontSize: 12,
            fontWeight: '700',
            color: '#334155',
        },

        payableValue: {
            color: '#2563eb',
        },

        notesBox: {
            marginTop: 9,
            padding: 10,
            backgroundColor:
                '#f8fafc',
            borderRadius: 10,
        },

        notesHeader: {
            flexDirection:
                'row',
            alignItems:
                'center',
        },

        notesLabel: {
            marginLeft: 6,
            fontSize: 11,
            fontWeight: '700',
            color: '#64748b',
        },

        notesText: {
            marginTop: 5,
            fontSize: 12,
            lineHeight: 18,
            color: '#475569',
        },

        bottomSpace: {
            height: 20,
        },

        /*
         * ---------------------------------------------------------------
         * Drawer
         * ---------------------------------------------------------------
         */

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
            backgroundColor:
                '#ffffff',
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
            transform: [
                { translateY: -30 },
            ],
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

        menuItemPressed: {
            backgroundColor:
                '#f1f5f9',
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
    });