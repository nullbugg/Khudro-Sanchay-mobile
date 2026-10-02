import React, {
    useCallback,
    useState,
} from 'react';

import Ionicons from '@expo/vector-icons/Ionicons';

import {
    ActivityIndicator,
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

function getPaymentLabel(
    method: string,
    language: MemberLanguage
): string {
    if (
        String(method).toLowerCase() ===
        'bkash'
    ) {
        return language === 'bn'
            ? 'bKash'
            : 'bKash';
    }

    return language === 'bn'
        ? 'Cash'
        : 'Cash';
}


/*
|--------------------------------------------------------------------------
| Main Screen
|--------------------------------------------------------------------------
*/

export default function PendingDepositScreen() {
    const [
        language,
        setLanguage,
    ] =
        useState<MemberLanguage>('bn');

    const [
        requests,
        setRequests,
    ] =
        useState<
            MemberPendingDeposit[]
        >([]);

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
     * Load pending deposits
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

                    setRequests(
                        result.requests
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
     * Refresh when screen gets focus
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
     * Pull to refresh
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
     * Back
     * ---------------------------------------------------------------
     */

    const handleBack =
        useCallback(() => {
            router.back();
        }, []);


    /*
     * ---------------------------------------------------------------
     * Translation
     * ---------------------------------------------------------------
     */

    const t =
        language === 'en'
            ? {
                  title:
                      'Pending Deposit',

                  subtitle:
                      'Deposit Requests',

                  memberId:
                      'Member ID',

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
                      'Weeks',

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

                  requestDate:
                      'Request Date',

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
              }
            : {
                  title:
                      'অপেক্ষমাণ জমা',

                  subtitle:
                      'জমার অনুরোধ',

                  memberId:
                      'সদস্য ID',

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
                      'সপ্তাহ',

                  depositAmount:
                      'জমার পরিমাণ',

                  paymentMethod:
                      'পেমেন্ট পদ্ধতি',

                  senderNumber:
                      'প্রেরকের নম্বর',

                  bkashCharge:
                      'bKash চার্জ',

                  payableAmount:
                      'প্রদেয় পরিমাণ',

                  requestDate:
                      'অনুরোধের তারিখ',

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
              };


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
                        {language ===
                        'en'
                            ? 'Loading...'
                            : 'লোড হচ্ছে...'}
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

                {/* Header */}

                <View
                    style={
                        styles.header
                    }
                >
                    <Pressable
                        onPress={
                            handleBack
                        }
                        style={({ pressed }) => [
                            styles.backButton,
                            pressed &&
                                styles.pressed,
                        ]}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={22}
                            color="#0f172a"
                        />
                    </Pressable>

                    <View
                        style={
                            styles.headerCenter
                        }
                    >
                        <Text
                            style={
                                styles.headerTitle
                            }
                        >
                            {t.title}
                        </Text>

                        <Text
                            style={
                                styles.headerSubtitle
                            }
                        >
                            {t.subtitle}
                        </Text>
                    </View>

                    <Pressable
                        onPress={
                            handleRefresh
                        }
                        disabled={
                            refreshing
                        }
                        style={({ pressed }) => [
                            styles.refreshButton,
                            pressed &&
                                styles.pressed,
                        ]}
                    >
                        {refreshing ? (
                            <ActivityIndicator
                                size="small"
                                color="#2563eb"
                            />
                        ) : (
                            <Ionicons
                                name="refresh"
                                size={21}
                                color="#2563eb"
                            />
                        )}
                    </Pressable>
                </View>


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

                    {/* Member Info */}

                    <View
                        style={
                            styles.memberCard
                        }
                    >
                        <View
                            style={
                                styles.memberIcon
                            }
                        >
                            <Ionicons
                                name="person"
                                size={20}
                                color="#2563eb"
                            />
                        </View>

                        <View
                            style={
                                styles.memberInfo
                            }
                        >
                            <Text
                                style={
                                    styles.memberName
                                }
                            >
                                {memberName ||
                                    '—'}
                            </Text>

                            <Text
                                style={
                                    styles.memberId
                                }
                            >
                                {t.memberId}:{' '}
                                {memberId ||
                                    '—'}
                            </Text>
                        </View>
                    </View>


                    {/* Count Card */}

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
                                {requests.length}
                            </Text>
                        </View>
                    </View>


                    {/* Error */}

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


                    {/* Empty State */}

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


                    {/* Requests */}

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

                                {/* Card Header */}

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


                                {/* Request ID */}

                                <View
                                    style={
                                        styles.fullRow
                                    }
                                >
                                    <Text
                                        style={
                                            styles.label
                                        }
                                    >
                                        {
                                            t.requestId
                                        }
                                    </Text>

                                    <Text
                                        style={
                                            styles.value
                                        }
                                    >
                                        {
                                            request.requestId
                                        }
                                    </Text>
                                </View>


                                {/* Details Grid */}

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


                                {/* Payment Method */}

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


                                {/* Sender Number */}

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


                                {/* Charge */}

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


                                {/* Payable */}

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


                                {/* Request Date */}

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

        header: {
            minHeight: 72,
            paddingHorizontal: 16,
            flexDirection:
                'row',
            alignItems:
                'center',
            backgroundColor:
                '#ffffff',
            borderBottomWidth: 1,
            borderBottomColor:
                '#e2e8f0',
        },

        backButton: {
            width: 42,
            height: 42,
            borderRadius: 14,
            alignItems:
                'center',
            justifyContent:
                'center',
            backgroundColor:
                '#f8fafc',
            borderWidth: 1,
            borderColor:
                '#e2e8f0',
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

        headerCenter: {
            flex: 1,
            paddingHorizontal: 12,
        },

        headerTitle: {
            fontSize: 18,
            fontWeight: '800',
            color: '#0f172a',
        },

        headerSubtitle: {
            marginTop: 2,
            fontSize: 12,
            fontWeight: '500',
            color: '#64748b',
        },

        scrollContent: {
            padding: 16,
        },

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

        bottomSpace: {
            height: 30,
        },
    });