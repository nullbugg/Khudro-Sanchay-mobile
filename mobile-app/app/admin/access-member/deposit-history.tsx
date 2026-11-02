
import React, {
    useCallback,
    useEffect,
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

import { SafeAreaView } from 'react-native-safe-area-context';

import { router, useLocalSearchParams } from 'expo-router';

import {
    getAdminLanguage,
    AdminLanguage,
} from '../../../lib/admin-language';

import {
    getMemberDepositHistory,
    MemberPendingDeposit,
} from '../../../lib/member-api';

import {
    getAdminShareHistory,
    AdminShareHistoryItem,
    AdminWithdrawalHistoryItem,
} from '../../../lib/admin-api';

/*
|--------------------------------------------------------------------------
| Translations
|--------------------------------------------------------------------------
*/

const translations = {
    bn: {
        title: 'জমার ইতিহাস',
        memberId: 'সদস্য ID',
        pending: 'অপেক্ষমাণ',
        approved: 'অনুমোদিত',
        rejected: 'বাতিল',
        history: 'সকল জমার রেকর্ড',
        loading: 'জমার ইতিহাস লোড হচ্ছে...',
        errorTitle: 'ইতিহাস লোড করা যায়নি',
        retry: 'আবার চেষ্টা করুন',
        emptyTitle: 'কোনো জমার ইতিহাস নেই',
        emptyDescription: 'এই সদস্যের কোনো জমার রেকর্ড পাওয়া যায়নি।',
        depositId: 'জমা ID',
        shares: 'শেয়ার',
        weeks: 'সপ্তাহ',
        weeklyAmount: 'সাপ্তাহিক জমা',
        depositAmount: 'জমার পরিমাণ',
        charge: 'bKash চার্জ',
        payable: 'মোট প্রদেয়',
        paymentMethod: 'পেমেন্ট পদ্ধতি',
        cash: 'ক্যাশ',
        bkash: 'bKash',
        senderNumber: 'প্রেরকের নম্বর',
        requestDate: 'আবেদনের তারিখ',
        approvedDate: 'অনুমোদনের তারিখ',
        adminId: 'Admin ID',
        notes: 'মন্তব্য',
        noValue: 'তথ্য নেই',
        back: 'ফিরে যান',
        connectionError: 'সার্ভারের সাথে সংযোগ করা যাচ্ছে না।',
        refresh: 'রিফ্রেশ করুন',

        shareHistory: 'শেয়ার পরিবর্তনের ইতিহাস',
        shareIncrease: 'শেয়ার বৃদ্ধি',
        shareDecrease: 'শেয়ার হ্রাস',
        previousShares: 'আগের শেয়ার',
        newShares: 'নতুন শেয়ার',
        previousWeeklyAmount: 'আগের সাপ্তাহিক জমা',
        newWeeklyAmount: 'নতুন সাপ্তাহিক জমা',
        changeWeek: 'পরিবর্তনের সপ্তাহ',
        effectiveWeek: 'কার্যকর সপ্তাহ',
        additionalRequirement: 'অতিরিক্ত জমার প্রয়োজন',
        advanceApplied: 'অগ্রিম থেকে সমন্বয়',
        newDepositRequired: 'নতুন জমার প্রয়োজন',
        refundAmount: 'ফেরত দেওয়া টাকা',
        changeDate: 'পরিবর্তনের তারিখ',
        refundDetails: 'ফেরতের বিবরণ',
        refundWeek: 'ফেরতের সপ্তাহ',
        refundDate: 'ফেরতের তারিখ',
        withdrawalId: 'Withdrawal ID',
        emptyShareHistory: 'কোনো শেয়ার পরিবর্তনের ইতিহাস নেই',
    },

    en: {
        title: 'Deposit History',
        memberId: 'Member ID',
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
        history: 'All Deposit Records',
        loading: 'Loading deposit history...',
        errorTitle: 'Could Not Load History',
        retry: 'Try Again',
        emptyTitle: 'No Deposit History',
        emptyDescription: 'No deposit records were found for this member.',
        depositId: 'Deposit ID',
        shares: 'Shares',
        weeks: 'Weeks',
        weeklyAmount: 'Weekly Deposit',
        depositAmount: 'Deposit Amount',
        charge: 'bKash Charge',
        payable: 'Total Payable',
        paymentMethod: 'Payment Method',
        cash: 'Cash',
        bkash: 'bKash',
        senderNumber: 'Sender Number',
        requestDate: 'Request Date',
        approvedDate: 'Approval Date',
        adminId: 'Admin ID',
        notes: 'Notes',
        noValue: 'Not available',
        back: 'Go back',
        connectionError: 'Could not connect to the server.',
        refresh: 'Refresh',

        shareHistory: 'Share Change History',
        shareIncrease: 'Share Increase',
        shareDecrease: 'Share Decrease',
        previousShares: 'Previous Shares',
        newShares: 'New Shares',
        previousWeeklyAmount: 'Previous Weekly Amount',
        newWeeklyAmount: 'New Weekly Amount',
        changeWeek: 'Change Week',
        effectiveWeek: 'Effective Week',
        additionalRequirement: 'Additional Requirement',
        advanceApplied: 'Advance Applied',
        newDepositRequired: 'New Deposit Required',
        refundAmount: 'Refund Amount',
        changeDate: 'Change Date',
        refundDetails: 'Refund Details',
        refundWeek: 'Refund Week',
        refundDate: 'Refund Date',
        withdrawalId: 'Withdrawal ID',
        emptyShareHistory: 'No share change history found',
    },
} as const;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getParam(
    value: string | string[] | undefined,
): string {
    return Array.isArray(value)
        ? value[0] ?? ''
        : value ?? '';
}

function formatAmount(
    value: number | string | undefined,
    language: AdminLanguage,
): string {
    const amount = Number(value ?? 0);

    const safeAmount = Number.isFinite(amount)
        ? amount
        : 0;

    return `৳ ${safeAmount.toLocaleString(
        language === 'bn' ? 'bn-BD' : 'en-BD',
        { maximumFractionDigits: 2 },
    )}`;
}

function formatNumber(
    value: number | string | undefined,
    language: AdminLanguage,
): string {
    const number = Number(value ?? 0);

    return (
        Number.isFinite(number) ? number : 0
    ).toLocaleString(
        language === 'bn' ? 'bn-BD' : 'en-BD',
    );
}

function displayValue(
    value: string | number | undefined | null,
    fallback: string,
): string {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ''
    ) {
        return fallback;
    }

    return String(value);
}

/*
|--------------------------------------------------------------------------
| Parse Date
|--------------------------------------------------------------------------
*/

function parseDate(value: string): Date | null {
    const raw = value.trim();

    if (!raw) {
        return null;
    }

    // DD-MM-YYYY
    const dashDate = raw.match(
        /^(\d{2})-(\d{2})-(\d{4})$/,
    );

    if (dashDate) {
        const date = new Date(
            Number(dashDate[3]),
            Number(dashDate[2]) - 1,
            Number(dashDate[1]),
        );

        return Number.isNaN(date.getTime())
            ? null
            : date;
    }

    // DD/MM/YYYY
    const slashDate = raw.match(
        /^(\d{2})\/(\d{2})\/(\d{4})$/,
    );

    if (slashDate) {
        const date = new Date(
            Number(slashDate[3]),
            Number(slashDate[2]) - 1,
            Number(slashDate[1]),
        );

        return Number.isNaN(date.getTime())
            ? null
            : date;
    }

    // ISO and other JavaScript-supported date formats
    const candidate = new Date(raw);

    if (Number.isNaN(candidate.getTime())) {
        return null;
    }

    return candidate;
}

/*
|--------------------------------------------------------------------------
| Date Timestamp — Sorting
|--------------------------------------------------------------------------
*/

function getDateTimestamp(
    value: string | undefined,
): number {
    if (!value?.trim()) {
        return 0;
    }

    const parsed = parseDate(value);

    return parsed?.getTime() ?? 0;
}

/*
|--------------------------------------------------------------------------
| Format Date
|--------------------------------------------------------------------------
*/

function formatDate(
    value: string | undefined,
    language: AdminLanguage,
    fallback: string,
): string {
    if (!value?.trim()) {
        return fallback;
    }

    const raw = value.trim();
    const parsed = parseDate(raw);

    if (!parsed) {
        return raw;
    }

    return parsed.toLocaleDateString(
        language === 'bn' ? 'bn-BD' : 'en-GB',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        },
    );
}

/*
|--------------------------------------------------------------------------
| Format Date Time
|--------------------------------------------------------------------------
*/

function formatDateTime(
    value: string | undefined,
    language: AdminLanguage,
    fallback: string,
): string {
    if (!value?.trim()) {
        return fallback;
    }

    const raw = value.trim();
    const parsed = parseDate(raw);

    if (!parsed) {
        return raw;
    }

    // Date-only values should not display a fake midnight time.
    const isDateOnly =
        /^\d{2}[-/]\d{2}[-/]\d{4}$/.test(raw);

    return parsed.toLocaleString(
        language === 'bn' ? 'bn-BD' : 'en-GB',
        isDateOnly
            ? {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }
            : {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            },
    );
}

/*
|--------------------------------------------------------------------------
| Normalize ID
|--------------------------------------------------------------------------
*/

function normalizeId(
    value: string | undefined,
): string {
    return String(value ?? '')
        .trim()
        .toUpperCase();
}

/*
|--------------------------------------------------------------------------
| Match Withdrawal History
|--------------------------------------------------------------------------
*/

function findRelatedWithdrawal(
    item: AdminShareHistoryItem,
    withdrawals: AdminWithdrawalHistoryItem[],
): AdminWithdrawalHistoryItem | undefined {

    const historyId = normalizeId(item.historyId);
    const withdrawalId = normalizeId(item.withdrawalId);

    // First priority: historyId
    if (historyId) {
        const matchedByHistoryId = withdrawals.find(
            entry =>
                normalizeId(entry.historyId) === historyId,
        );

        if (matchedByHistoryId) {
            return matchedByHistoryId;
        }
    }

    // Second priority: withdrawalId
    if (withdrawalId) {
        return withdrawals.find(
            entry =>
                normalizeId(entry.withdrawalId) === withdrawalId,
        );
    }

    return undefined;
}

/*
|--------------------------------------------------------------------------
| Status
|--------------------------------------------------------------------------
*/

function getStatus(
    value: string | undefined,
): 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNKNOWN' {
    const status = String(value ?? '')
        .trim()
        .toUpperCase();

    if (status === 'APPROVED') return 'APPROVED';
    if (status === 'REJECTED') return 'REJECTED';
    if (status === 'PENDING') return 'PENDING';

    return 'UNKNOWN';
}

/*
|--------------------------------------------------------------------------
| Status Badge
|--------------------------------------------------------------------------
*/

function StatusBadge({
    status,
    language,
}: {
    status: string;
    language: AdminLanguage;
}) {
    const t = translations[language];
    const normalized = getStatus(status);

    let label = status || t.noValue;
    let badgeStyle = styles.unknownBadge;
    let textStyle = styles.unknownBadgeText;

    let icon: React.ComponentProps<typeof Ionicons>['name'] =
        'help-circle-outline';

    if (normalized === 'PENDING') {
        label = t.pending;
        badgeStyle = styles.pendingBadge;
        textStyle = styles.pendingBadgeText;
        icon = 'time-outline';
    } else if (normalized === 'APPROVED') {
        label = t.approved;
        badgeStyle = styles.approvedBadge;
        textStyle = styles.approvedBadgeText;
        icon = 'checkmark-circle-outline';
    } else if (normalized === 'REJECTED') {
        label = t.rejected;
        badgeStyle = styles.rejectedBadge;
        textStyle = styles.rejectedBadgeText;
        icon = 'close-circle-outline';
    }

    return (
        <View style={[styles.statusBadge, badgeStyle]}>
            <Ionicons
                name={icon}
                size={14}
                color={
                    normalized === 'PENDING'
                        ? '#92400e'
                        : normalized === 'APPROVED'
                            ? '#166534'
                            : normalized === 'REJECTED'
                                ? '#991b1b'
                                : '#334155'
                }
            />

            <Text style={[styles.statusBadgeText, textStyle]}>
                {label}
            </Text>
        </View>
    );
}

/*
|--------------------------------------------------------------------------
| Summary Card
|--------------------------------------------------------------------------
*/

function SummaryCard({
    label,
    value,
    icon,
    backgroundColor,
    iconColor,
}: {
    label: string;
    value: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    backgroundColor: string;
    iconColor: string;
}) {
    return (
        <View style={styles.summaryCard}>
            <View
                style={[
                    styles.summaryIcon,
                    { backgroundColor },
                ]}
            >
                <Ionicons
                    name={icon}
                    size={19}
                    color={iconColor}
                />
            </View>

            <Text style={styles.summaryLabel}>
                {label}
            </Text>

            <Text
                style={styles.summaryValue}
                numberOfLines={1}
            >
                {value}
            </Text>
        </View>
    );
}

/*
|--------------------------------------------------------------------------
| Detail Row
|--------------------------------------------------------------------------
*/

function DetailRow({
    label,
    value,
    last = false,
}: {
    label: string;
    value: string;
    last?: boolean;
}) {
    return (
        <View
            style={[
                styles.detailRow,
                !last && styles.detailRowBorder,
            ]}
        >
            <Text style={styles.detailLabel}>
                {label}
            </Text>

            <Text style={styles.detailValue}>
                {value}
            </Text>
        </View>
    );
}

/*
|--------------------------------------------------------------------------
| Deposit History Card
|--------------------------------------------------------------------------
*/

function DepositHistoryCard({
    item,
    language,
}: {
    item: MemberPendingDeposit;
    language: AdminLanguage;
}) {
    const t = translations[language];

    const normalizedStatus = getStatus(item.status);

    const isBkash =
        String(item.paymentMethod ?? '').toLowerCase() ===
        'bkash';

    const paymentMethod = isBkash
        ? t.bkash
        : t.cash;

    return (
        <View style={styles.historyCard}>
            {/* Card Header */}
            <View style={styles.historyCardHeader}>
                <View style={styles.historyTitleContainer}>
                    <View style={styles.depositIcon}>
                        <Ionicons
                            name="receipt-outline"
                            size={20}
                            color="#ffffff"
                        />
                    </View>

                    <View style={styles.historyHeading}>
                        <Text
                            style={styles.depositId}
                            numberOfLines={1}
                        >
                            {displayValue(item.requestId, t.noValue)}
                        </Text>

                        <Text style={styles.requestDate}>
                            {formatDate(
                                item.requestDate,
                                language,
                                t.noValue,
                            )}
                        </Text>
                    </View>
                </View>

                <StatusBadge
                    status={item.status}
                    language={language}
                />
            </View>

            {/* Amount Panel */}
            <View style={styles.amountPanel}>
                <View style={styles.amountTopRow}>
                    <View style={styles.amountWalletIcon}>
                        <Ionicons
                            name="wallet-outline"
                            size={19}
                            color="#2563eb"
                        />
                    </View>

                    <View style={styles.amountHeading}>
                        <Text style={styles.amountLabel}>
                            {t.depositAmount}
                        </Text>

                        <Text style={styles.amountValue}>
                            {formatAmount(
                                item.depositAmount,
                                language,
                            )}
                        </Text>
                    </View>
                </View>

                <View style={styles.amountDivider} />

                <View style={styles.amountSubRow}>
                    <Text style={styles.amountSubLabel}>
                        {t.charge}
                    </Text>

                    <Text style={styles.amountSubValue}>
                        {formatAmount(
                            item.bkashCharge,
                            language,
                        )}
                    </Text>
                </View>

                <View style={styles.amountSubRow}>
                    <Text style={styles.amountSubLabel}>
                        {t.payable}
                    </Text>

                    <Text style={styles.payableValue}>
                        {formatAmount(
                            item.payableAmount,
                            language,
                        )}
                    </Text>
                </View>
            </View>

            {/* Details Grid */}
            <View style={styles.detailGrid}>
                <View style={styles.detailGridItem}>
                    <Ionicons
                        name="layers-outline"
                        size={17}
                        color="#64748b"
                    />

                    <Text style={styles.gridLabel}>
                        {t.shares}
                    </Text>

                    <Text style={styles.gridValue}>
                        {formatNumber(
                            item.shareCount,
                            language,
                        )}
                    </Text>
                </View>

                <View style={styles.detailGridItem}>
                    <Ionicons
                        name="calendar-outline"
                        size={17}
                        color="#64748b"
                    />

                    <Text style={styles.gridLabel}>
                        {t.weeks}
                    </Text>

                    <Text style={styles.gridValue}>
                        {formatNumber(
                            item.weeks,
                            language,
                        )}
                    </Text>
                </View>

                <View style={styles.detailGridItem}>
                    <Ionicons
                        name="cash-outline"
                        size={17}
                        color="#64748b"
                    />

                    <Text style={styles.gridLabel}>
                        {t.weeklyAmount}
                    </Text>

                    <Text style={styles.gridValue}>
                        {formatAmount(
                            item.weeklyAmount,
                            language,
                        )}
                    </Text>
                </View>

                <View style={styles.detailGridItem}>
                    <Ionicons
                        name="card-outline"
                        size={17}
                        color="#64748b"
                    />

                    <Text style={styles.gridLabel}>
                        {t.paymentMethod}
                    </Text>

                    <Text style={styles.gridValue}>
                        {paymentMethod}
                    </Text>
                </View>
            </View>

            {/* bKash Sender Number */}
            {isBkash && item.senderNumber ? (
                <DetailRow
                    label={t.senderNumber}
                    value={displayValue(
                        item.senderNumber,
                        t.noValue,
                    )}
                />
            ) : null}

            {/* Approval Date */}
            {normalizedStatus === 'APPROVED' &&
                item.approvedDate ? (
                <DetailRow
                    label={t.approvedDate}
                    value={formatDate(
                        item.approvedDate,
                        language,
                        t.noValue,
                    )}
                />
            ) : null}

            {/* Admin ID */}
            {item.adminId ? (
                <DetailRow
                    label={t.adminId}
                    value={String(item.adminId)}
                />
            ) : null}

            {/* Notes */}
            {item.notes ? (
                <DetailRow
                    label={t.notes}
                    value={String(item.notes)}
                    last
                />
            ) : null}
        </View>
    );
}

/*
|--------------------------------------------------------------------------
| Share History Card
|--------------------------------------------------------------------------
*/

function ShareHistoryCard({
    item,
    withdrawal,
    language,
}: {
    item: AdminShareHistoryItem;
    withdrawal?: AdminWithdrawalHistoryItem;
    language: AdminLanguage;
}) {
    const t = translations[language];

    const isIncrease =
        Number(item.newShareCount) >
        Number(item.previousShareCount);

    const isDecrease =
        Number(item.newShareCount) <
        Number(item.previousShareCount);

    const title = isIncrease
        ? t.shareIncrease
        : t.shareDecrease;

    return (
        <View style={styles.historyCard}>
            {/* Card Header */}
            <View style={styles.historyCardHeader}>
                <View style={styles.historyTitleContainer}>
                    <View
                        style={[
                            styles.depositIcon,
                            styles.shareIcon,
                            {
                                backgroundColor: isIncrease
                                    ? '#f0fdf4'
                                    : '#fef2f2',
                            },
                        ]}
                    >
                        <Ionicons
                            name={
                                isIncrease
                                    ? 'trending-up'
                                    : 'trending-down'
                            }
                            size={20}
                            color={
                                isIncrease
                                    ? '#16a34a'
                                    : '#dc2626'
                            }
                        />
                    </View>

                    <View style={styles.historyHeading}>
                        <Text
                            style={styles.depositId}
                            numberOfLines={1}
                        >
                            {title}
                        </Text>

                        <Text
                            style={styles.requestDate}
                            numberOfLines={1}
                        >
                            {displayValue(
                                item.historyId,
                                t.noValue,
                            )}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.amountDivider} />

            {/* Share Details */}
            <View style={styles.detailGrid}>
                <View style={styles.detailGridItem}>
                    <Ionicons
                        name="layers-outline"
                        size={17}
                        color="#64748b"
                    />

                    <Text style={styles.gridLabel}>
                        {t.previousShares}
                    </Text>

                    <Text style={styles.gridValue}>
                        {formatNumber(
                            item.previousShareCount,
                            language,
                        )}
                    </Text>
                </View>

                <View style={styles.detailGridItem}>
                    <Ionicons
                        name="layers-outline"
                        size={17}
                        color="#64748b"
                    />

                    <Text style={styles.gridLabel}>
                        {t.newShares}
                    </Text>

                    <Text style={styles.gridValue}>
                        {formatNumber(
                            item.newShareCount,
                            language,
                        )}
                    </Text>
                </View>

                <View style={styles.detailGridItem}>
                    <Ionicons
                        name="cash-outline"
                        size={17}
                        color="#64748b"
                    />

                    <Text style={styles.gridLabel}>
                        {t.previousWeeklyAmount}
                    </Text>

                    <Text style={styles.gridValue}>
                        {formatAmount(
                            item.previousWeeklyAmount,
                            language,
                        )}
                    </Text>
                </View>

                <View style={styles.detailGridItem}>
                    <Ionicons
                        name="wallet-outline"
                        size={17}
                        color="#64748b"
                    />

                    <Text style={styles.gridLabel}>
                        {t.newWeeklyAmount}
                    </Text>

                    <Text style={styles.gridValue}>
                        {formatAmount(
                            item.newWeeklyAmount,
                            language,
                        )}
                    </Text>
                </View>

                <View style={styles.detailGridItem}>
                    <Ionicons
                        name="calendar-outline"
                        size={17}
                        color="#64748b"
                    />

                    <Text style={styles.gridLabel}>
                        {t.changeWeek}
                    </Text>

                    <Text style={styles.gridValue}>
                        {formatNumber(
                            item.changeWeek,
                            language,
                        )}
                    </Text>
                </View>

                <View style={styles.detailGridItem}>
                    <Ionicons
                        name="calendar"
                        size={17}
                        color="#64748b"
                    />

                    <Text style={styles.gridLabel}>
                        {t.effectiveWeek}
                    </Text>

                    <Text style={styles.gridValue}>
                        {formatNumber(
                            item.effectiveWeek,
                            language,
                        )}
                    </Text>
                </View>
            </View>

            {/* Share Increase Details */}
            {isIncrease ? (
                <>
                    <View style={styles.shareInfoRow}>
                        <Text style={styles.infoLabel}>
                            {t.additionalRequirement}
                        </Text>

                        <Text style={styles.infoValue}>
                            {formatAmount(
                                item.additionalRequirement,
                                language,
                            )}
                        </Text>
                    </View>

                    <View style={styles.shareInfoRow}>
                        <Text style={styles.infoLabel}>
                            {t.advanceApplied}
                        </Text>

                        <Text style={styles.infoValue}>
                            {formatAmount(
                                item.advanceApplied,
                                language,
                            )}
                        </Text>
                    </View>

                    <View style={styles.shareInfoRow}>
                        <Text style={styles.infoLabel}>
                            {t.newDepositRequired}
                        </Text>

                        <Text style={styles.infoValue}>
                            {formatAmount(
                                item.newDepositRequired,
                                language,
                            )}
                        </Text>
                    </View>
                </>
            ) : null}

            {/* Share Decrease Refund Details */}
            {isDecrease && withdrawal ? (
                <>
                    <View style={styles.shareInfoRow}>
                        <Ionicons
                            name="cash-outline"
                            size={17}
                            color="#16a34a"
                        />

                        <Text style={styles.infoLabel}>
                            {t.refundAmount}
                        </Text>

                        <Text
                            style={[
                                styles.infoValue,
                                styles.refundValue,
                            ]}
                        >
                            {formatAmount(
                                withdrawal.refundAmount,
                                language,
                            )}
                        </Text>
                    </View>

                    <View style={styles.shareInfoRow}>
                        <Ionicons
                            name="calendar-outline"
                            size={17}
                            color="#64748b"
                        />

                        <Text style={styles.infoLabel}>
                            {t.refundWeek}
                        </Text>

                        <Text style={styles.infoValue}>
                            {formatNumber(
                                withdrawal.week,
                                language,
                            )}
                        </Text>
                    </View>

                    <View style={styles.shareInfoRow}>
                        <Ionicons
                            name="document-text-outline"
                            size={17}
                            color="#64748b"
                        />

                        <Text style={styles.infoLabel}>
                            {t.withdrawalId}
                        </Text>

                        <Text style={styles.infoValue}>
                            {displayValue(
                                withdrawal.withdrawalId,
                                t.noValue,
                            )}
                        </Text>
                    </View>

                    {withdrawal.date ? (
                        <View style={styles.shareInfoRow}>
                            <Ionicons
                                name="calendar-outline"
                                size={17}
                                color="#64748b"
                            />

                            <Text style={styles.infoLabel}>
                                {t.refundDate}
                            </Text>

                            <Text style={styles.infoValue}>
                                {formatDateTime(
                                    withdrawal.date,
                                    language,
                                    t.noValue,
                                )}
                            </Text>
                        </View>
                    ) : null}
                </>
            ) : null}

            {/* Change Date */}
            <View style={styles.shareInfoRow}>
                <Ionicons
                    name="calendar-outline"
                    size={17}
                    color="#64748b"
                />

                <Text style={styles.infoLabel}>
                    {t.changeDate}
                </Text>

                <Text style={styles.infoValue}>
                    {formatDateTime(
                        item.date,
                        language,
                        t.noValue,
                    )}
                </Text>
            </View>

            {/* Admin ID */}
            {item.adminId ? (
                <DetailRow
                    label={t.adminId}
                    value={String(item.adminId)}
                />
            ) : null}

            {/* Withdrawal Notes */}
            {isDecrease && withdrawal?.notes ? (
                <View style={styles.shareNotesBox}>
                    <View style={styles.shareNotesHeader}>
                        <Ionicons
                            name="information-circle-outline"
                            size={17}
                            color="#64748b"
                        />

                        <Text style={styles.shareNotesLabel}>
                            {t.refundDetails}
                        </Text>
                    </View>

                    <Text style={styles.shareNotesText}>
                        {withdrawal.notes}
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

export default function AdminMemberDepositHistoryScreen() {
    const params = useLocalSearchParams<{
        memberId: string | string[];
        memberName?: string | string[];
    }>();

    const memberId = getParam(params.memberId).trim();
    const routeMemberName = getParam(params.memberName).trim();

    const [language, setLanguage] =
        useState<AdminLanguage>('bn');

    const [requests, setRequests] =
        useState<MemberPendingDeposit[]>([]);

    const [shareHistory, setShareHistory] =
        useState<AdminShareHistoryItem[]>([]);

    const [withdrawalHistory, setWithdrawalHistory] =
        useState<AdminWithdrawalHistoryItem[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [reloadKey, setReloadKey] = useState(0);

    const t = translations[language];

    /*
     * ---------------------------------------------------------------
     * Load Saved Admin Language
     * ---------------------------------------------------------------
     */

    useEffect(() => {
        let mounted = true;

        getAdminLanguage()
            .then((savedLanguage) => {
                if (mounted) {
                    setLanguage(savedLanguage);
                }
            })
            .catch((err) => {
                console.error(
                    'Admin language load error:',
                    err,
                );
            });

        return () => {
            mounted = false;
        };
    }, []);

    /*
     * ---------------------------------------------------------------
     * Load Deposit and Share History
     * ---------------------------------------------------------------
     */

    const loadHistory = useCallback(
        async (isRefresh = false) => {
            if (!memberId) {
                setRequests([]);
                setShareHistory([]);
                setWithdrawalHistory([]);

                setError(
                    language === 'bn'
                        ? 'সদস্য ID পাওয়া যায়নি।'
                        : 'Member ID was not provided.',
                );

                setLoading(false);
                setRefreshing(false);
                return;
            }

            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError('');

            /*
             * Deposit History
             *
             * Existing API and behavior preserved.
             */

            try {
                const result =
                    await getMemberDepositHistory(memberId);

                if (!result.success) {
                    setRequests([]);

                    setError(
                        result.message ||
                        translations[language].errorTitle,
                    );
                } else {
                    const sortedRequests = [
                        ...result.requests,
                    ].sort((a, b) => {
                        const dateA = getDateTimestamp(
                            a.requestDate,
                        );

                        const dateB = getDateTimestamp(
                            b.requestDate,
                        );

                        return dateB - dateA;
                    });

                    setRequests(sortedRequests);
                }
            } catch (err) {
                console.error(
                    'Admin member deposit history error:',
                    err,
                );

                setRequests([]);

                setError(
                    translations[language].connectionError,
                );
            }

            /*
             * Share History
             *
             * Independent API call.
             * Share API failure will not affect Deposit History.
             */

            try {
                const shareResult =
                    await getAdminShareHistory(memberId);

                if (
                    shareResult.success &&
                    shareResult.data
                ) {
                    const shares = Array.isArray(
                        shareResult.data.shareHistory,
                    )
                        ? [...shareResult.data.shareHistory]
                        : [];

                    const withdrawals = Array.isArray(
                        shareResult.data.withdrawalHistory,
                    )
                        ? [...shareResult.data.withdrawalHistory]
                        : [];

                    // Latest Share History first
                    shares.sort((a, b) => {
                        const dateDifference =
                            getDateTimestamp(b.date) -
                            getDateTimestamp(a.date);

                        if (dateDifference !== 0) {
                            return dateDifference;
                        }

                        return (
                            Number(b.changeWeek || 0) -
                            Number(a.changeWeek || 0)
                        );
                    });

                    // Latest Withdrawal History first
                    withdrawals.sort((a, b) => {
                        const dateDifference =
                            getDateTimestamp(b.date) -
                            getDateTimestamp(a.date);

                        if (dateDifference !== 0) {
                            return dateDifference;
                        }

                        return (
                            Number(b.week || 0) -
                            Number(a.week || 0)
                        );
                    });

                    setShareHistory(shares);
                    setWithdrawalHistory(withdrawals);
                } else {
                    setShareHistory([]);
                    setWithdrawalHistory([]);

                    if (!shareResult.success) {
                        console.warn(
                            'Admin share history:',
                            shareResult.message,
                        );
                    }
                }
            } catch (shareError) {
                console.error(
                    'Admin share history load error:',
                    shareError,
                );

                setShareHistory([]);
                setWithdrawalHistory([]);
            }

            setLoading(false);
            setRefreshing(false);
        },
        [memberId, language, reloadKey],
    );

    useEffect(() => {
        void loadHistory();
    }, [loadHistory]);

    /*
     * ---------------------------------------------------------------
     * Status Counts
     * ---------------------------------------------------------------
     */

    const pendingCount = requests.filter(
        item => getStatus(item.status) === 'PENDING',
    ).length;

    const approvedCount = requests.filter(
        item => getStatus(item.status) === 'APPROVED',
    ).length;

    const rejectedCount = requests.filter(
        item => getStatus(item.status) === 'REJECTED',
    ).length;

    const memberName =
        routeMemberName ||
        requests.find(item => item.memberName)?.memberName ||
        '';

    /*
     * ---------------------------------------------------------------
     * Render
     * ---------------------------------------------------------------
     */

    return (
        <SafeAreaView
            style={styles.safeArea}
            edges={['top', 'left', 'right']}
        >
            <View style={styles.header}>
                {/* Back Arrow */}
                <Pressable
                    onPress={() => router.back()}
                    style={({ pressed }) => [
                        styles.backButton,
                        pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={t.back}
                >
                    <Ionicons
                        name="arrow-back"
                        size={22}
                        color="#0f172a"
                    />
                </Pressable>

                {/* App Name */}
                <View style={styles.appBrand}>
                    <Text
                        style={styles.appTitle}
                        numberOfLines={1}
                    >
                        ক্ষুদ্র সঞ্চয়
                    </Text>

                    <Text
                        style={styles.appSubtitle}
                        numberOfLines={1}
                    >
                        সমবায় সমিতি
                    </Text>
                </View>

                {/* Member Name and ID */}
                <View style={styles.headerIdentity}>
                    <Text
                        style={styles.headerMemberName}
                        numberOfLines={1}
                    >
                        {memberName || memberId || t.noValue}
                    </Text>

                    <Text
                        style={styles.headerMemberId}
                        numberOfLines={1}
                    >
                        {t.memberId}: {memberId || '—'}
                    </Text>
                </View>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => void loadHistory(true)}
                        tintColor="#2563eb"
                    />
                }
            >
                <View style={styles.container}>
                    {/* Loading */}
                    {loading ? (
                        <View style={styles.stateCard}>
                            <ActivityIndicator
                                size="large"
                                color="#2563eb"
                            />

                            <Text style={styles.stateText}>
                                {t.loading}
                            </Text>
                        </View>
                    ) : error ? (
                        /* Error */
                        <View style={styles.stateCard}>
                            <View style={styles.errorIcon}>
                                <Ionicons
                                    name="alert-circle-outline"
                                    size={32}
                                    color="#dc2626"
                                />
                            </View>

                            <Text style={styles.stateTitle}>
                                {t.errorTitle}
                            </Text>

                            <Text style={styles.stateText}>
                                {error}
                            </Text>

                            <Pressable
                                onPress={() =>
                                    setReloadKey(value => value + 1)
                                }
                                style={({ pressed }) => [
                                    styles.retryButton,
                                    pressed && styles.pressed,
                                ]}
                            >
                                <Ionicons
                                    name="refresh-outline"
                                    size={18}
                                    color="#ffffff"
                                />

                                <Text style={styles.retryButtonText}>
                                    {t.retry}
                                </Text>
                            </Pressable>
                        </View>
                    ) : (
                        <>
                            {/* Status Summary */}
                            <View style={styles.summaryGrid}>
                                <SummaryCard
                                    label={t.pending}
                                    value={formatNumber(
                                        pendingCount,
                                        language,
                                    )}
                                    icon="time-outline"
                                    backgroundColor="#fff7ed"
                                    iconColor="#c2410c"
                                />

                                <SummaryCard
                                    label={t.approved}
                                    value={formatNumber(
                                        approvedCount,
                                        language,
                                    )}
                                    icon="checkmark-circle-outline"
                                    backgroundColor="#f0fdf4"
                                    iconColor="#15803d"
                                />

                                <SummaryCard
                                    label={t.rejected}
                                    value={formatNumber(
                                        rejectedCount,
                                        language,
                                    )}
                                    icon="close-circle-outline"
                                    backgroundColor="#fef2f2"
                                    iconColor="#dc2626"
                                />
                            </View>

                            {/* Deposit History Header */}
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIcon}>
                                    <Ionicons
                                        name="receipt-outline"
                                        size={19}
                                        color="#2563eb"
                                    />
                                </View>

                                <Text style={styles.sectionTitle}>
                                    {t.history}
                                </Text>

                                <View style={styles.countBadge}>
                                    <Text style={styles.countBadgeText}>
                                        {formatNumber(
                                            requests.length,
                                            language,
                                        )}
                                    </Text>
                                </View>
                            </View>

                            {/* Deposit Empty State */}
                            {requests.length === 0 ? (
                                <View style={styles.emptyCard}>
                                    <View style={styles.emptyIcon}>
                                        <Ionicons
                                            name="receipt-outline"
                                            size={30}
                                            color="#94a3b8"
                                        />
                                    </View>

                                    <Text style={styles.emptyTitle}>
                                        {t.emptyTitle}
                                    </Text>

                                    <Text style={styles.emptyDescription}>
                                        {t.emptyDescription}
                                    </Text>

                                    <Pressable
                                        onPress={() =>
                                            setReloadKey(
                                                value => value + 1,
                                            )
                                        }
                                        style={({ pressed }) => [
                                            styles.emptyRefreshButton,
                                            pressed && styles.pressed,
                                        ]}
                                    >
                                        <Ionicons
                                            name="refresh-outline"
                                            size={17}
                                            color="#2563eb"
                                        />

                                        <Text style={styles.emptyRefreshText}>
                                            {t.refresh}
                                        </Text>
                                    </Pressable>
                                </View>
                            ) : (
                                /* Deposit History List */
                                requests.map((item, index) => (
                                    <DepositHistoryCard
                                        key={`${item.requestId || item.rowIndex || 'deposit'}-${index}`}
                                        item={item}
                                        language={language}
                                    />
                                ))
                            )}

                            {/* Share History Section */}
                            {shareHistory.length > 0 ? (
                                <View style={styles.shareHistorySection}>
                                    <View style={styles.sectionHeader}>
                                        <View style={styles.sectionIcon}>
                                            <Ionicons
                                                name="swap-horizontal-outline"
                                                size={19}
                                                color="#2563eb"
                                            />
                                        </View>

                                        <Text style={styles.sectionTitle}>
                                            {t.shareHistory}
                                        </Text>

                                        <View style={styles.countBadge}>
                                            <Text style={styles.countBadgeText}>
                                                {formatNumber(
                                                    shareHistory.length,
                                                    language,
                                                )}
                                            </Text>
                                        </View>
                                    </View>

                                    {shareHistory.map((item, index) => {
                                        const withdrawal =
                                            findRelatedWithdrawal(
                                                item,
                                                withdrawalHistory,
                                            );

                                        return (
                                            <ShareHistoryCard
                                                key={
                                                    item.historyId ||
                                                    item.withdrawalId ||
                                                    `share-${index}`
                                                }
                                                item={item}
                                                withdrawal={withdrawal}
                                                language={language}
                                            />
                                        );
                                    })}
                                </View>
                            ) : null}
                        </>
                    )}

                    <View style={styles.bottomSpacing} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

/*
|--------------------------------------------------------------------------
| Styles
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f6f8fb',
    },

    /*
     * Header — original styles preserved
     */

    header: {
        minHeight: 76,
        paddingHorizontal: 12,
        paddingVertical: 11,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 9,
    },

    appBrand: {
        flexShrink: 0,
        justifyContent: 'center',
    },

    appTitle: {
        fontSize: 15,
        fontWeight: '900',
        color: '#0f172a',
    },

    appSubtitle: {
        marginTop: 3,
        fontSize: 10,
        fontWeight: '600',
        color: '#64748b',
    },

    headerIdentity: {
        flex: 1,
        minWidth: 0,
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginLeft: 10,
    },

    headerMemberName: {
        maxWidth: '100%',
        fontSize: 12,
        fontWeight: '800',
        color: '#0f172a',
        textAlign: 'right',
    },

    headerMemberId: {
        marginTop: 3,
        fontSize: 10,
        color: '#64748b',
        textAlign: 'right',
    },

    pressed: {
        opacity: 0.7,
    },

    /*
     * Content
     */

    scrollView: {
        flex: 1,
    },

    scrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },

    container: {
        width: '100%',
        maxWidth: 650,
        alignSelf: 'center',
        paddingHorizontal: 15,
        paddingTop: 16,
    },

    /*
     * Summary Cards
     */

    summaryGrid: {
        flexDirection: 'row',
        gap: 9,
        marginBottom: 22,
    },

    summaryCard: {
        flex: 1,
        minWidth: 0,
        padding: 11,
        borderRadius: 13,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },

    summaryIcon: {
        width: 35,
        height: 35,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },

    summaryLabel: {
        fontSize: 10,
        lineHeight: 15,
        color: '#64748b',
    },

    summaryValue: {
        marginTop: 5,
        fontSize: 17,
        fontWeight: '900',
        color: '#0f172a',
    },

    /*
     * Section Header
     */

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },

    sectionIcon: {
        width: 35,
        height: 35,
        borderRadius: 11,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    sectionTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: '900',
        color: '#0f172a',
    },

    countBadge: {
        minWidth: 29,
        height: 27,
        paddingHorizontal: 8,
        borderRadius: 9,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },

    countBadgeText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#334155',
    },

    /*
     * History Card
     */

    historyCard: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        padding: 13,
        marginBottom: 13,
    },

    historyCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 13,
    },

    historyTitleContainer: {
        flex: 1,
        minWidth: 0,
        flexDirection: 'row',
        alignItems: 'center',
    },

    depositIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#0f172a',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    shareIcon: {
        backgroundColor: '#f0fdf4',
    },

    historyHeading: {
        flex: 1,
        minWidth: 0,
    },

    depositId: {
        fontSize: 12,
        fontWeight: '900',
        color: '#0f172a',
    },

    requestDate: {
        marginTop: 4,
        fontSize: 10,
        color: '#64748b',
    },

    /*
     * Status Badge
     */

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 9,
        flexShrink: 0,
    },

    statusBadgeText: {
        fontSize: 10,
        fontWeight: '900',
    },

    pendingBadge: {
        backgroundColor: '#fff7ed',
        borderWidth: 1,
        borderColor: '#fed7aa',
    },

    pendingBadgeText: {
        color: '#c2410c',
    },

    approvedBadge: {
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },

    approvedBadgeText: {
        color: '#15803d',
    },

    rejectedBadge: {
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
    },

    rejectedBadgeText: {
        color: '#dc2626',
    },

    unknownBadge: {
        backgroundColor: '#e2e8f0',
    },

    unknownBadgeText: {
        color: '#334155',
    },

    /*
     * Amount Panel
     */

    amountPanel: {
        padding: 13,
        borderRadius: 12,
        backgroundColor: '#f8fbff',
        borderWidth: 1,
        borderColor: '#dbeafe',
        marginBottom: 12,
    },

    amountTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    amountWalletIcon: {
        width: 39,
        height: 39,
        borderRadius: 11,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    amountHeading: {
        flex: 1,
        minWidth: 0,
    },

    amountLabel: {
        fontSize: 10,
        color: '#64748b',
    },

    amountValue: {
        marginTop: 4,
        fontSize: 21,
        fontWeight: '900',
        color: '#2563eb',
    },

    amountDivider: {
        height: 1,
        backgroundColor: '#dbeafe',
        marginVertical: 10,
    },

    amountSubRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginTop: 5,
    },

    amountSubLabel: {
        flex: 1,
        fontSize: 10,
        color: '#64748b',
    },

    amountSubValue: {
        fontSize: 11,
        fontWeight: '700',
        color: '#334155',
    },

    payableValue: {
        fontSize: 12,
        fontWeight: '900',
        color: '#2563eb',
    },

    /*
     * Detail Grid
     */

    detailGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        marginBottom: 8,
        overflow: 'hidden',
    },

    detailGridItem: {
        width: '50%',
        minHeight: 88,
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },

    gridLabel: {
        marginTop: 6,
        fontSize: 10,
        color: '#64748b',
    },

    gridValue: {
        marginTop: 4,
        fontSize: 11,
        lineHeight: 16,
        fontWeight: '800',
        color: '#334155',
    },

    /*
     * Extra Details
     */

    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 10,
    },

    detailRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },

    detailLabel: {
        flex: 1,
        fontSize: 10,
        lineHeight: 16,
        color: '#64748b',
    },

    detailValue: {
        flex: 1,
        fontSize: 11,
        lineHeight: 17,
        fontWeight: '700',
        color: '#334155',
        textAlign: 'right',
    },

    /*
     * Share History Extra Details
     */

    shareInfoRow: {
        minHeight: 38,
        marginTop: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#f8fafc',
        borderRadius: 9,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },

    infoLabel: {
        flex: 1,
        fontSize: 10,
        lineHeight: 16,
        color: '#64748b',
    },

    infoValue: {
        flexShrink: 0,
        maxWidth: '55%',
        fontSize: 11,
        lineHeight: 16,
        fontWeight: '800',
        color: '#334155',
        textAlign: 'right',
    },

    refundValue: {
        color: '#16a34a',
    },

    shareNotesBox: {
        marginTop: 9,
        padding: 10,
        backgroundColor: '#f8fafc',
        borderRadius: 10,
    },

    shareNotesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    shareNotesLabel: {
        marginLeft: 6,
        fontSize: 11,
        fontWeight: '700',
        color: '#64748b',
    },

    shareNotesText: {
        marginTop: 5,
        fontSize: 12,
        lineHeight: 18,
        color: '#475569',
    },

    shareHistorySection: {
        marginTop: 22,
    },

    /*
     * Loading / Error
     */

    stateCard: {
        paddingHorizontal: 20,
        paddingVertical: 45,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },

    errorIcon: {
        width: 58,
        height: 58,
        borderRadius: 18,
        backgroundColor: '#fef2f2',
        alignItems: 'center',
        justifyContent: 'center',
    },

    stateTitle: {
        marginTop: 13,
        fontSize: 15,
        fontWeight: '900',
        color: '#334155',
        textAlign: 'center',
    },

    stateText: {
        marginTop: 12,
        fontSize: 12,
        lineHeight: 19,
        color: '#64748b',
        textAlign: 'center',
    },

    retryButton: {
        minHeight: 42,
        paddingHorizontal: 18,
        borderRadius: 10,
        backgroundColor: '#2563eb',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 19,
    },

    retryButtonText: {
        marginLeft: 8,
        fontSize: 11,
        fontWeight: '800',
        color: '#ffffff',
    },

    /*
     * Empty State
     */

    emptyCard: {
        paddingHorizontal: 20,
        paddingVertical: 30,
        alignItems: 'center',
        borderRadius: 16,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },

    emptyIcon: {
        width: 58,
        height: 58,
        borderRadius: 18,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 13,
    },

    emptyTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0f172a',
        textAlign: 'center',
    },

    emptyDescription: {
        marginTop: 7,
        fontSize: 11,
        lineHeight: 18,
        color: '#64748b',
        textAlign: 'center',
    },

    emptyRefreshButton: {
        minHeight: 39,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: '#eff6ff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 17,
    },

    emptyRefreshText: {
        marginLeft: 7,
        fontSize: 11,
        fontWeight: '800',
        color: '#2563eb',
    },

    bottomSpacing: {
        height: 20,
    },
});
