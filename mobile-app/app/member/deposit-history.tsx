import React, {
    useCallback,
    useEffect,
    useState,
} from 'react';

import Ionicons from '@expo/vector-icons/Ionicons';

import {
    ActivityIndicator,
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
} from 'expo-router';

import {
    getCurrentMember,
    getMemberDepositHistory,
    MemberDepositHistoryResult,
    MemberPendingDeposit,
} from '../../lib/member-api';

import {
    getMemberLanguage,
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
                            ? 'সপ্তাহ'
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
                            ? 'সাপ্তাহিক'
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
                            ? 'আবেদনের তারিখ'
                            : 'Request Date'}
                    </Text>

                    <Text
                        style={
                            styles.detailValue
                        }
                    >
                        {formatDate(
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
                            ? 'প্রেরকের নম্বর'
                            : 'Sender Number'}
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
                                ? 'অনুমোদনের তারিখ'
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
                        {formatDate(
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

    /*
     * ---------------------------------------------------------------
     * Load language
     * ---------------------------------------------------------------
     */

    useEffect(() => {
        let mounted = true;

        async function loadLanguage() {
            try {
                const savedLanguage =
                    await getMemberLanguage();

                if (mounted) {
                    setLanguage(
                        savedLanguage
                    );
                }
            } catch {
                if (mounted) {
                    setLanguage(
                        'bn'
                    );
                }
            }
        }

        loadLanguage();

        return () => {
            mounted = false;
        };
    }, []);

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
                            language ===
                            'bn'
                                ? 'Member session পাওয়া যায়নি। আবার login করুন।'
                                : 'Member session was not found. Please login again.'
                        );

                        return;
                    }

                    const historyResult:
                        MemberDepositHistoryResult =
                        await getMemberDepositHistory(
                            memberResult
                                .member
                                .memberId
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
                                    language ===
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
     * Initial load
     * ---------------------------------------------------------------
     */

    useEffect(() => {
        loadHistory();
    }, [
        loadHistory,
    ]);

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
                    <Ionicons
                        name="time-outline"
                        size={23}
                        color="#0f172a"
                    />

                    <View
                        style={
                            styles.headerTitleArea
                        }
                    >
                        <Text
                            style={
                                styles.headerTitle
                            }
                        >
                            {language ===
                            'bn'
                                ? 'সাপ্তাহিক জমার ইতিহাস'
                                : 'Weekly Deposit History'}
                        </Text>

                        <Text
                            style={
                                styles.headerSubtitle
                            }
                        >
                            {language ===
                            'bn'
                                ? 'আপনার সকল জমার আবেদন'
                                : 'All your deposit requests'}
                        </Text>
                    </View>
                </View>

                <View
                    style={
                        styles.headerActions
                    }
                >
                    <Ionicons
                        name="refresh-outline"
                        size={22}
                        color="#475569"
                        onPress={
                            handleRefresh
                        }
                    />

                    <Ionicons
                        name="close-outline"
                        size={25}
                        color="#475569"
                        onPress={() =>
                            router.back()
                        }
                    />
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
                                {language ===
                                'bn'
                                    ? 'জমার আবেদন'
                                    : 'Deposit Requests'}
                            </Text>

                            <Text
                                style={
                                    styles.summarySubtitle
                                }
                            >
                                {language ===
                                'bn'
                                    ? 'মোট আবেদন'
                                    : 'Total requests'}
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
                                {language ===
                                'bn'
                                    ? 'অপেক্ষমাণ'
                                    : 'Pending'}
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
                                {language ===
                                'bn'
                                    ? 'অনুমোদিত'
                                    : 'Approved'}
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
                                {language ===
                                'bn'
                                    ? 'বাতিল'
                                    : 'Rejected'}
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
                            {language ===
                            'bn'
                                ? 'ইতিহাস লোড হচ্ছে...'
                                : 'Loading history...'}
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
                            {language ===
                            'bn'
                                ? 'কোনো জমার ইতিহাস নেই'
                                : 'No deposit history'}
                        </Text>

                        <Text
                            style={
                                styles.emptyText
                            }
                        >
                            {language ===
                            'bn'
                                ? 'আপনি যখন কোনো জমার আবেদন করবেন, সেটি এখানে দেখা যাবে।'
                                : 'Your deposit requests will appear here when you make a deposit request.'}
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

        header: {
            minHeight: 72,
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

        headerTitleArea: {
            marginLeft: 10,
            flex: 1,
        },

        headerTitle: {
            fontSize: 17,
            fontWeight: '700',
            color: '#0f172a',
        },

        headerSubtitle: {
            marginTop: 2,
            fontSize: 12,
            color: '#64748b',
        },

        headerActions: {
            flexDirection:
                'row',
            alignItems:
                'center',
            gap: 15,
            marginLeft: 10,
        },

        scrollView: {
            flex: 1,
        },

        contentContainer: {
            padding: 16,
        },

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
    });