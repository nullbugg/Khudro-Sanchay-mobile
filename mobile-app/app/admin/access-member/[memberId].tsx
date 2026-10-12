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
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,

} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { router, useLocalSearchParams } from 'expo-router';

import {
    getAdminLanguage,
    AdminLanguage,
} from '../../../lib/admin-language';

import {
    getAdminMemberDetails,
    deleteAdminMember,
} from '../../../lib/admin-api';

type MemberDetails = NonNullable<

    Awaited<ReturnType<typeof getAdminMemberDetails>>['member']

>;

type MemberSummary = NonNullable<

    Awaited<ReturnType<typeof getAdminMemberDetails>>['summary']

>;

const WEEKLY_RATE_PER_SHARE = 50;

const MAX_SHARES = 15;

const translations = {

    bn: {

        appName: 'ক্ষুদ্র সঞ্চয়',
        subtitle: 'সমবায় সমিতি',
        back: 'ফিরে যান',
        language: 'ভাষা',
        loading: 'সদস্যের তথ্য লোড হচ্ছে...',
        errorTitle: 'তথ্য লোড করা যায়নি',
        retry: 'আবার চেষ্টা করুন',
        notFound: 'সদস্যের তথ্য পাওয়া যায়নি',
        noValue: 'তথ্য নেই',
        depositSummary: 'জমার হিসাব',
        sharesAndWeekly: 'শেয়ার ও সাপ্তাহিক জমা',
        totalDeposit: 'মোট জমা',
        weeklyTotal: 'মোট সাপ্তাহিক জমা',
        advanceTotal: 'মোট অগ্রিম জমা',
        due: 'মোট বকেয়া',
        advance: 'মোট অগ্রিম',
        shares: 'মোট শেয়ার',
        change: 'শেয়ার পরিবর্তন করুন',
        dueRange: 'বকেয়ার সপ্তাহ',
        advanceRange: 'অগ্রিম জমার সপ্তাহ',
        memberName: 'সদস্যের নাম',
        memberId: 'সদস্য আইডি',
        memberInformation: 'সদস্যের তথ্য',
        phone: 'ফোন নম্বর',
        email: 'জি-মেইল',
        joinDate: 'যোগদানের তারিখ',
        status: 'অ্যাকাউন্টের অবস্থা',
        weeklyDeposit: 'সাপ্তাহিক জমা',
        perShare: 'প্রতি শেয়ারে',
        latestDeposit: 'জমার ইতিহাস',
        latestWeek: 'সর্বশেষ জমার সপ্তাহ',
        lastPaymentDate: 'সর্বশেষ জমার তারিখ',
        depositHistory: 'জমার ইতিহাস দেখুন',
        changeShares: 'শেয়ার পরিবর্তন',
        currentShares: 'বর্তমান শেয়ার',
        newShares: 'নতুন শেয়ার সংখ্যা',
        effectiveDate: 'কার্যকর হওয়ার তারিখ',
        datePlaceholder: 'DD-MM-YYYY',
        newWeeklyAmount: 'নতুন সাপ্তাহিক জমা',
        shareDifference: 'শেয়ারের পার্থক্য',
        additionalPayable: 'অতিরিক্ত জমার প্রিভিউ',
        refundPreview: 'ফেরতের প্রিভিউ',
        shareNote: 'এটি প্রাথমিক প্রিভিউ। চূড়ান্ত হিসাব ও আপডেটের জন্য Backend সংযুক্ত করতে হবে।',
        update: 'আপডেট করুন',
        cancel: 'বাতিল',
        previewError: 'সঠিক শেয়ার সংখ্যা ও তারিখ দিন।',
        previewOnly: 'প্রিভিউ',
        backendRequired: 'শেয়ার পরিবর্তনের API এখনো যুক্ত করা হয়নি। কোনো তথ্য পরিবর্তন করা হয়নি।',
        accountStatus: 'অ্যাকাউন্ট স্ট্যাটাস',
        active: 'সক্রিয়',
        inactive: 'নিষ্ক্রিয়',
        statusNote: 'স্ট্যাটাস পরিবর্তন কার্যকর করতে Backend API প্রয়োজন।',
        statusBackendRequired: 'স্ট্যাটাস পরিবর্তনের API এখনো যুক্ত করা হয়নি। কোনো তথ্য পরিবর্তন করা হয়নি।',
        deleteMember: 'সদস্য ডিলিট করুন',
        deleteWarning: 'সদস্য ডিলিট করলে তাঁর সংশ্লিষ্ট তথ্য মুছে যেতে পারে। এই কাজটি স্থায়ী হতে পারে।',
        deleteConfirm: 'আপনি কি নিশ্চিত যে সদস্যটিকে ডিলিট করতে চান?',
        delete: 'ডিলিট',
        deleteBackendRequired: 'সদস্য ডিলিটের API এখনো যুক্ত করা হয়নি। কোনো তথ্য মুছে ফেলা হয়নি।',
        deleteSuccess: 'সদস্য ও তাঁর সংশ্লিষ্ট রেকর্ড সফলভাবে মুছে ফেলা হয়েছে।',
        deleteFailed: 'সদস্য মুছে ফেলা যায়নি। আবার চেষ্টা করুন।',
        deleting: 'সদস্য মুছে ফেলা হচ্ছে...',
        admin: 'অ্যাডমিন',
        week: 'সপ্তাহ',
        taka: '৳',
    },

    en: {
        appName: 'ক্ষুদ্র সঞ্চয়',
        subtitle: 'সমবায় সমিতি',
        back: 'Back',
        language: 'Language',
        loading: 'Loading member details...',
        errorTitle: 'Could not load information',
        retry: 'Try Again',
        notFound: 'Member information was not found',
        noValue: 'Not available',
        depositSummary: 'Deposit Summary',
        sharesAndWeekly: 'Shares & Weekly Deposit',
        totalDeposit: 'Total Deposit',
        weeklyTotal: 'Total Weekly Deposit',
        advanceTotal: 'Total Advance Deposit',
        due: 'Total Due',
        advance: 'Total Advance',
        shares: 'Total Shares',
        change: 'Change',
        dueRange: 'Due Week Range',
        advanceRange: 'Advance Paid Through',
        memberName: 'Member Name',
        memberId: 'Member ID',
        memberInformation: 'Member Information',
        phone: 'Phone Number',
        email: 'Gmail',
        joinDate: 'Join Date',
        status: 'Account Status',
        weeklyDeposit: 'Weekly Deposit',
        perShare: 'Per Share',
        latestDeposit: 'Latest Deposit',
        latestWeek: 'Deposit Week',
        lastPaymentDate: 'Payment Date',
        depositHistory: 'View Deposit History',
        changeShares: 'Change Shares',
        currentShares: 'Current Shares',
        newShares: 'New Share Count',
        effectiveDate: 'Effective Date',
        datePlaceholder: 'DD-MM-YYYY',
        newWeeklyAmount: 'New Weekly Deposit',
        shareDifference: 'Share Difference',
        additionalPayable: 'Additional Payment Preview',
        refundPreview: 'Refund Preview',
        shareNote: 'This is a preliminary preview. Backend integration is required for the final calculation and update.',
        update: 'Update',
        cancel: 'Cancel',
        previewError: 'Enter a valid share count and date.',
        previewOnly: 'Preview',
        backendRequired: 'The share update API is not connected yet. No data has been changed.',
        accountStatus: 'Account Status',
        active: 'Active',
        inactive: 'Inactive',
        statusNote: 'A Backend API is required to save status changes.',
        statusBackendRequired: 'The status update API is not connected yet. No data has been changed.',
        deleteMember: 'Delete Member',
        deleteWarning: 'Deleting a member may remove their related records. This action may be permanent.',
        deleteConfirm: 'Are you sure you want to delete this member?',
        delete: 'Delete',
        deleteBackendRequired: 'The member deletion API is not connected yet. No data has been deleted.',
        deleteSuccess: 'The member and related records were deleted successfully.',
        deleteFailed: 'Could not delete the member. Please try again.',
        deleting: 'Deleting member...',
        admin: 'Admin',
        week: 'Week',
        taka: '৳',
    },

} as const;

function formatAmount(value: number | undefined, language: AdminLanguage) {

    const amount = Number(value ?? 0);

    return `৳ ${(

        Number.isFinite(amount) ? amount : 0

    ).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-BD', {

        maximumFractionDigits: 2,

    })}`;

}

function formatNumber(value: number | undefined, language: AdminLanguage) {

    const number = Number(value ?? 0);

    return (

        Number.isFinite(number) ? number : 0

    ).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-BD');

}

function displayValue(

    value: string | number | undefined | null,

    fallback: string

) {

    if (value === undefined || value === null || String(value).trim() === '') {

        return fallback;

    }

    return String(value);

}

function SectionHeader({

    title,

    icon,

}: {

    title: string;

    icon: React.ComponentProps<typeof Ionicons>['name'];

}) {

    return (

        <View style={styles.sectionHeader}>

            <View style={styles.sectionIcon}>

                <Ionicons name={icon} size={19} color="#0f172a" />

            </View>

            <Text style={styles.sectionTitle}>{title}</Text>

        </View>

    );

}

function SummaryCard({
    title,
    value,
    icon,
    tint,
    onPress,
    actionLabel,
}: {
    title: string;
    value: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    tint: string;
    onPress?: () => void;
    actionLabel?: string;
}) {

    const content = (

        <View style={styles.summaryCard}>

            <View style={[styles.summaryIcon, { backgroundColor: tint }]}>

                <Ionicons name={icon} size={21} color="#0f172a" />

            </View>

            <Text style={styles.summaryLabel}>{title}</Text>

            <Text

                style={styles.summaryValue}

                numberOfLines={2}

                adjustsFontSizeToFit

            >

                {value}

            </Text>

            {onPress ? (

                <View style={styles.cardAction}>

                    <Text style={styles.cardActionText}>{actionLabel ?? "Change"}</Text>

                    <Ionicons name="chevron-forward" size={15} color="#475569" />

                </View>

            ) : null}

        </View>

    );

    if (onPress) {

        return (

            <Pressable

                onPress={onPress}

                style={({ pressed }) => pressed && styles.pressed}

                accessibilityRole="button"

            >

                {content}

            </Pressable>

        );

    }

    return content;

}

function InfoRow({

    icon,

    label,

    value,

    last = false,

}: {

    icon: React.ComponentProps<typeof Ionicons>['name'];

    label: string;

    value: string;

    last?: boolean;

}) {

    return (

        <View style={[styles.infoRow, !last && styles.infoRowBorder]}>

            <View style={styles.infoIcon}>

                <Ionicons name={icon} size={18} color="#64748b" />

            </View>

            <View style={styles.infoText}>

                <Text style={styles.infoLabel}>{label}</Text>

                <Text style={styles.infoValue}>{value}</Text>

            </View>

        </View>

    );

}

export default function AccessMemberDetailsScreen() {

    const params = useLocalSearchParams<{

        memberId: string | string[];

    }>();

    const memberId = Array.isArray(params.memberId)

        ? params.memberId[0]

        : params.memberId;

    const [language, setLanguage] = useState<AdminLanguage>('bn');

    const [member, setMember] = useState<MemberDetails | undefined>();

    const [summary, setSummary] = useState<MemberSummary | undefined>();

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    const [reloadKey, setReloadKey] = useState(0);

    const [shareModalVisible, setShareModalVisible] = useState(false);

    const [newShares, setNewShares] = useState('');

    const [effectiveDate, setEffectiveDate] = useState('');

    const [statusPreview, setStatusPreview] = useState(false);

    const [deletingMember, setDeletingMember] = useState(false);
    const deletionInProgress = useRef(false);

    const t = translations[language];

    useEffect(() => {

        let mounted = true;

        const loadLanguage = async () => {

            try {

                const savedLanguage = await getAdminLanguage();

                if (mounted) setLanguage(savedLanguage);

            } catch (err) {

                console.error('Admin language load error:', err);

            }

        };

        loadLanguage();

        return () => {

            mounted = false;

        };

    }, []);

    const loadMemberDetails = useCallback(async () => {

        if (!memberId?.trim()) {

            setMember(undefined);

            setSummary(undefined);

            setError(t.notFound);

            setLoading(false);

            return;

        }

        setLoading(true);

        setError('');

        try {

            const result = await getAdminMemberDetails(memberId);

            if (!result.success || !result.member) {

                setMember(undefined);

                setSummary(undefined);

                setError(result.message || t.notFound);

                return;

            }

            setMember(result.member);

            setSummary(result.summary);

            setNewShares(String(result.member.currentShareCount ?? 1));

        } catch (err) {

            console.error('Member details loading error:', err);

            setMember(undefined);

            setSummary(undefined);

            setError(

                language === 'bn'

                    ? 'সদস্যের তথ্য আনতে সমস্যা হয়েছে।'

                    : 'There was a problem loading member details.'

            );

        } finally {

            setLoading(false);

        }

    }, [memberId, reloadKey, language, t.notFound]);

    useEffect(() => {

        loadMemberDetails();

    }, [loadMemberDetails]);

    const isActive =
        String(member?.status ?? '').trim().toUpperCase() === 'ACTIVE';

    // Week 1 begins on 24-04-2026; each following week starts seven days later.
    const weekOneStart = new Date(2026, 3, 24);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysSinceWeekOne = Math.floor(
        (today.getTime() - weekOneStart.getTime()) / (24 * 60 * 60 * 1000),
    );
    const calculatedCurrentWeek = daysSinceWeekOne < 0
        ? 0
        : Math.floor(daysSinceWeekOne / 7) + 1;
    const currentWeek = Number((summary as any)?.currentWeek ?? calculatedCurrentWeek);
    const latestWeekNumber = Number(summary?.latestWeek ?? 0);
    const weeklyAmount = Number(member?.currentWeeklyAmount ?? 0);
    const dueWeeks = Math.max(0, currentWeek - latestWeekNumber);
    const dueAmount = Number((summary as any)?.dueAmount ?? dueWeeks * weeklyAmount);
    const dueFromWeek = latestWeekNumber + 1;
    const dueToWeek = currentWeek;
    const dueRangeText = dueAmount <= 0 || dueWeeks <= 0
        ? (language === 'bn' ? 'কোনো বকেয়া নেই' : 'No outstanding dues')
        : dueFromWeek === dueToWeek
            ? `${t.week} ${formatNumber(dueFromWeek, language)}`
            : `${t.week} ${formatNumber(dueFromWeek, language)} - ${t.week} ${formatNumber(dueToWeek, language)}`;
    const advanceAmount = Number(summary?.advanceAmount ?? 0);
    const advanceWeeks = weeklyAmount > 0 ? Math.floor(advanceAmount / weeklyAmount) : 0;
    const advanceToWeek = currentWeek + advanceWeeks;
    const advanceRangeText = advanceAmount <= 0 || advanceWeeks <= 0
        ? (language === 'bn' ? 'কোনো অগ্রিম নেই' : 'No advance')
        : `${t.week} ${formatNumber(currentWeek + 1, language)} - ${t.week} ${formatNumber(advanceToWeek, language)}`;

    const currentShares = Number(member?.currentShareCount ?? 0);

    const requestedShares = Number(newShares);

    const shareCountValid =

        newShares.trim() !== '' &&

        Number.isInteger(requestedShares) &&

        requestedShares >= 1 &&

        requestedShares <= MAX_SHARES;

    const shareDifference = shareCountValid

        ? requestedShares - currentShares

        : 0;

    const weeklyAmountPreview = shareCountValid

        ? requestedShares * WEEKLY_RATE_PER_SHARE

        : 0;

    const additionalPreview = Math.max(0, shareDifference) *

        WEEKLY_RATE_PER_SHARE;

    const refundPreview = Math.max(0, -shareDifference) *

        WEEKLY_RATE_PER_SHARE;

    const openShareModal = () => {

        setNewShares(String(member?.currentShareCount ?? 1));

        setEffectiveDate('');

        setShareModalVisible(true);

    };

    const previewShareUpdate = () => {

        const validDate = /^\d{2}-\d{2}-\d{4}$/.test(effectiveDate.trim());

        if (!shareCountValid || !validDate) {

            Alert.alert(t.previewOnly, t.previewError);

            return;

        }

        setShareModalVisible(false);

        Alert.alert(

            t.previewOnly,

            `${t.newWeeklyAmount}: ${formatAmount(weeklyAmountPreview, language)}\n\n${t.shareNote}\n\n${t.backendRequired}`

        );

    };

    const openHistory = () => {
        router.push({
            pathname: '/admin/access-member/deposit-history' as any,
            params: {
                memberId: member?.memberId ?? memberId ?? '',
                memberName: member?.memberName ?? '',
            },
        });
    };

    const showStatusNotice = (value: boolean) => {

        setStatusPreview(value);

        Alert.alert(

            t.previewOnly,

            t.statusBackendRequired,

            [

                {

                    text: 'OK',

                    onPress: () => setStatusPreview(!value),

                },

            ]

        );

    };



    const confirmDelete = () => {
        if (deletionInProgress.current || deletingMember) return;

        const targetMemberId = String(
            member?.memberId ?? memberId ?? ''
        ).trim();

        if (!targetMemberId) {
            Alert.alert(t.deleteMember, t.deleteFailed);
            return;
        }

        Alert.alert(
            t.deleteMember,
            `${t.deleteConfirm}\n\n${t.deleteWarning}`,
            [
                {
                    text: t.cancel,
                    style: 'cancel',
                },
                {
                    text: t.delete,
                    style: 'destructive',
                    onPress: async () => {
                        if (deletionInProgress.current) return;

                        deletionInProgress.current = true;
                        setDeletingMember(true);

                        try {
                            const result =
                                await deleteAdminMember(targetMemberId);

                            if (!result.success) {
                                let message = result.message || t.deleteFailed;

                                if (result.code === 'MEMBER_NOT_FOUND') {
                                    message = language === 'bn'
                                        ? 'এই সদস্যকে খুঁজে পাওয়া যায়নি।'
                                        : 'This member could not be found.';
                                } else if (
                                    result.code === 'DUPLICATE_MEMBER_ID'
                                ) {
                                    message = language === 'bn'
                                        ? 'একই Member ID একাধিকবার পাওয়া গেছে। নিরাপত্তার জন্য সদস্য মুছে ফেলা হয়নি।'
                                        : 'Duplicate Member IDs were found. The member was not deleted for safety.';
                                } else if (
                                    result.code === 'ADMIN_SESSION_NOT_FOUND'
                                ) {
                                    message = language === 'bn'
                                        ? 'অ্যাডমিন সেশন পাওয়া যায়নি। আবার লগইন করুন।'
                                        : 'Admin session not found. Please log in again.';
                                }

                                Alert.alert(t.deleteMember, message);
                                return;
                            }

                            Alert.alert(
                                t.deleteMember,
                                t.deleteSuccess,
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => router.back(),
                                    },
                                ]
                            );
                        } catch (error) {
                            console.error(
                                'Permanent member deletion error:',
                                error
                            );

                            Alert.alert(t.deleteMember, t.deleteFailed);
                        } finally {
                            deletionInProgress.current = false;
                            setDeletingMember(false);
                        }
                    },
                },
            ]
        );
    };



    return (

        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>

            <View style={styles.header}>
                <Pressable
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons
                        name="arrow-back"
                        size={22}
                        color="#0f172a"
                    />
                </Pressable>

                {/* Arrow-এর ঠিক পাশে অ্যাপের নাম */}
                <View style={styles.headerBrand}>
                    <Text style={styles.headerAppName} numberOfLines={1}>
                        ক্ষুদ্র সঞ্চয়
                    </Text>
                    <Text style={styles.headerSubtitle} numberOfLines={1}>
                        সমবায় সমিতি
                    </Text>
                </View>

                {/* একদম ডান পাশে সদস্যের তথ্য */}
                <View style={styles.headerIdentity}>
                    <Text style={styles.headerMemberName} numberOfLines={1}>
                        {member?.memberName || 'সদস্যের নাম'}
                    </Text>
                    <Text style={styles.headerMemberId} numberOfLines={1}>
                        সদস্য ID: {member?.memberId || memberId || '—'}
                    </Text>
                </View>
            </View>

            <ScrollView

                style={styles.scrollView}

                contentContainerStyle={styles.scrollContent}

                showsVerticalScrollIndicator={false}

            >

                <View style={styles.container}>

                    {loading ? (

                        <View style={styles.stateCard}>

                            <ActivityIndicator size="large" color="#0f172a" />

                            <Text style={styles.stateText}>{t.loading}</Text>

                        </View>

                    ) : error || !member ? (

                        <View style={styles.stateCard}>

                            <Ionicons

                                name="alert-circle-outline"

                                size={38}

                                color="#dc2626"

                            />

                            <Text style={styles.errorTitle}>{t.errorTitle}</Text>

                            <Text style={styles.stateText}>

                                {error || t.notFound}

                            </Text>

                            <Pressable

                                onPress={() => setReloadKey(value => value + 1)}

                                style={styles.retryButton}

                            >

                                <Ionicons

                                    name="refresh-outline"

                                    size={18}

                                    color="#ffffff"

                                />

                                <Text style={styles.retryButtonText}>{t.retry}</Text>

                            </Pressable>

                        </View>

                    ) : (

                        <>


                            <SectionHeader title={t.depositSummary} icon="wallet-outline" />

                            <View style={styles.depositSummaryBox}>
                                {/* মোট জমা — সম্পূর্ণ প্রস্থ */}

                                <View style={styles.totalDepositCard}>

                                    <Text style={styles.totalDepositTitle}>
                                        {t.totalDeposit}
                                    </Text>

                                    <View style={styles.totalDepositAmountRow}>
                                        <Text style={styles.totalDepositDescription}>
                                            {t.weeklyTotal} + {t.advanceTotal}
                                        </Text>

                                        <Text style={styles.totalDepositValue}>
                                            {formatAmount(summary?.totalDeposit, language)}
                                        </Text>
                                    </View>


                                    <View style={styles.totalDepositBreakdown}>
                                        <View style={styles.totalDepositBreakdownRow}>
                                            <View style={styles.breakdownLabelContainer}>
                                                <Ionicons
                                                    name="calendar-outline"
                                                    size={16}
                                                    color="#0284c7"
                                                />
                                                <Text style={styles.breakdownLabel}>
                                                    {t.weeklyTotal}
                                                </Text>
                                            </View>

                                            <Text style={styles.breakdownValue}>
                                                {formatAmount(
                                                    Number(summary?.totalDeposit ?? 0) -
                                                    Number(summary?.advanceAmount ?? 0),
                                                    language
                                                )}
                                            </Text>
                                        </View>

                                        <View style={styles.totalDepositBreakdownRow}>
                                            <View style={styles.breakdownLabelContainer}>
                                                <Ionicons
                                                    name="trending-up-outline"
                                                    size={16}
                                                    color="#16a34a"
                                                />
                                                <Text style={styles.breakdownLabel}>
                                                    {t.advanceTotal}
                                                </Text>
                                            </View>

                                            <Text style={styles.breakdownValue}>
                                                {formatAmount(summary?.advanceAmount, language)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>


                                {/* বকেয়া ও অগ্রিম */}
                                <View style={styles.depositBottomRow}>
                                    <View style={styles.depositSmallCard}>
                                        <View style={[styles.summaryIcon, { backgroundColor: '#fef3c7' }]}>
                                            <Ionicons
                                                name="time-outline"
                                                size={20}
                                                color="#0f172a"
                                            />
                                        </View>

                                        <Text style={styles.summaryLabel}>{t.due}</Text>

                                        <Text style={styles.depositSmallValue}>
                                            {formatAmount(dueAmount, language)}
                                        </Text>

                                        <View style={styles.depositRange}>
                                            <Text style={styles.depositRangeLabel}>
                                                {t.dueRange}
                                            </Text>
                                            <Text style={styles.depositRangeValue}>
                                                {dueRangeText}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.depositSmallCard}>
                                        <View style={[styles.summaryIcon, { backgroundColor: '#dcfce7' }]}>
                                            <Ionicons
                                                name="trending-up-outline"
                                                size={20}
                                                color="#0f172a"
                                            />
                                        </View>

                                        <Text style={styles.summaryLabel}>{t.advance}</Text>

                                        <Text style={styles.depositSmallValue}>
                                            {formatAmount(advanceAmount, language)}
                                        </Text>

                                        <View style={styles.depositRange}>
                                            <Text style={styles.depositRangeLabel}>
                                                {t.advanceRange}
                                            </Text>
                                            <Text style={styles.depositRangeValue}>
                                                {advanceRangeText}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>



                            <SectionHeader title={t.sharesAndWeekly} icon="layers-outline" />

                            <View style={styles.sharesWeeklyBox}>
                                {/* Share Section: Click করলে আগের Modal খুলবে */}
                                <Pressable
                                    onPress={openShareModal}
                                    style={({ pressed }) => [
                                        styles.sharesWeeklyRow,
                                        pressed && styles.pressed,
                                    ]}
                                    accessibilityRole="button"
                                >
                                    <View style={[styles.summaryIcon, { backgroundColor: '#ede9fe' }]}>
                                        <Ionicons
                                            name="layers-outline"
                                            size={21}
                                            color="#0f172a"
                                        />
                                    </View>

                                    <View style={styles.sharesWeeklyInfo}>
                                        <Text style={styles.sharesWeeklyLabel}>
                                            {t.shares}
                                        </Text>

                                        <Text style={styles.sharesWeeklyHint}>
                                            {t.change}
                                        </Text>
                                    </View>

                                    <Text style={styles.sharesWeeklyValue}>
                                        {formatNumber(member.currentShareCount, language)}
                                    </Text>

                                    <Ionicons
                                        name="chevron-forward"
                                        size={18}
                                        color="#64748b"
                                    />
                                </Pressable>

                                <View style={styles.sharesWeeklyDivider} />

                                {/* Weekly Deposit Section */}
                                <View style={styles.sharesWeeklyRow}>
                                    <View style={[styles.summaryIcon, { backgroundColor: '#e0f2fe' }]}>
                                        <Ionicons
                                            name="cash-outline"
                                            size={21}
                                            color="#0f172a"
                                        />
                                    </View>

                                    <View style={styles.sharesWeeklyInfo}>
                                        <Text style={styles.sharesWeeklyLabel}>
                                            {t.weeklyDeposit}
                                        </Text>

                                        <Text style={styles.sharesWeeklyHint}>
                                            {t.perShare}: {formatAmount(WEEKLY_RATE_PER_SHARE, language)}
                                        </Text>
                                    </View>

                                    <Text style={styles.sharesWeeklyValue}>
                                        {formatAmount(member.currentWeeklyAmount, language)}
                                    </Text>
                                </View>
                            </View>



                            <SectionHeader title={t.latestDeposit} icon="receipt-outline" />

                            <View style={styles.infoCard}>
                                <InfoRow
                                    icon="layers-outline"
                                    label={t.latestWeek}
                                    value={`${t.week} ${formatNumber(summary?.latestWeek, language)}`}
                                />

                                <InfoRow
                                    icon="calendar-outline"
                                    label={t.lastPaymentDate}
                                    value={displayValue(summary?.lastPaymentDate, t.noValue)}
                                    last
                                />

                                {/* জমার ইতিহাস দেখুন */}
                                <Pressable
                                    onPress={openHistory}
                                    style={({ pressed }) => [
                                        styles.historyButton,
                                        styles.historyButtonInside,
                                        pressed && styles.pressed,
                                    ]}
                                >
                                    <View style={styles.historyIcon}>
                                        <Ionicons
                                            name="receipt-outline"
                                            size={21}
                                            color="#ffffff"
                                        />
                                    </View>

                                    <View style={styles.historyText}>
                                        <Text style={styles.historyTitle}>
                                            {t.depositHistory}
                                        </Text>

                                        <Text style={styles.historySubtitle}>
                                            {member.memberName} · {member.memberId}
                                        </Text>
                                    </View>

                                    <Ionicons
                                        name="chevron-forward"
                                        size={21}
                                        color="#ffffff"
                                    />
                                </Pressable>
                            </View>


                            <SectionHeader

                                title={t.memberInformation}

                                icon="person-outline"

                            />

                            <View style={styles.infoCard}>
                                <InfoRow
                                    icon="person-outline"
                                    label={t.memberName}
                                    value={displayValue(member.memberName, t.noValue)}
                                />
                                <InfoRow
                                    icon="card-outline"
                                    label={t.memberId}
                                    value={displayValue(member.memberId, t.noValue)}
                                />
                                <InfoRow
                                    icon="call-outline"
                                    label={t.phone}

                                    value={displayValue(member.phone, t.noValue)}

                                />

                                <InfoRow

                                    icon="mail-outline"

                                    label={t.email}

                                    value={displayValue(member.email, t.noValue)}

                                />

                                <InfoRow

                                    icon="calendar-outline"

                                    label={t.joinDate}

                                    value={displayValue(member.joinDate, t.noValue)}

                                    last

                                />

                            </View>

                            <SectionHeader

                                title={t.accountStatus}

                                icon="shield-checkmark-outline"

                            />

                            <View style={styles.actionCard}>

                                <View style={styles.actionText}>

                                    <Text style={styles.actionTitle}>{t.accountStatus}</Text>

                                    <Text style={styles.actionSubtitle}>

                                        {isActive ? t.active : t.inactive}

                                    </Text>

                                    <Text style={styles.actionHint}>{t.statusNote}</Text>

                                </View>

                                <Switch

                                    value={statusPreview ? !isActive : isActive}

                                    onValueChange={showStatusNotice}

                                    trackColor={{

                                        false: '#cbd5e1',

                                        true: '#86efac',

                                    }}

                                    thumbColor={

                                        (statusPreview ? !isActive : isActive)

                                            ? '#16a34a'

                                            : '#94a3b8'

                                    }

                                />

                            </View>


                            <Pressable
                                onPress={confirmDelete}
                                disabled={deletingMember}
                                style={({ pressed }) => [
                                    styles.deleteButton,
                                    pressed && styles.pressed,
                                    deletingMember && { opacity: 0.6 },
                                ]}
                            >
                                {deletingMember ? (
                                    <ActivityIndicator size="small" color="#dc2626" />
                                ) : (
                                    <Ionicons
                                        name="trash-outline"
                                        size={19}
                                        color="#dc2626"
                                    />
                                )}

                                <Text style={styles.deleteButtonText}>
                                    {deletingMember ? t.deleting : t.deleteMember}
                                </Text>
                            </Pressable>


                        </>

                    )}

                    <View style={styles.bottomSpacing} />

                </View>

            </ScrollView>

            <Modal

                visible={shareModalVisible}

                transparent

                animationType="slide"

                onRequestClose={() => setShareModalVisible(false)}

            >

                <View style={styles.modalBackdrop}>

                    <View style={styles.modalCard}>

                        <View style={styles.modalHeader}>

                            <Text style={styles.modalTitle}>{t.changeShares}</Text>

                            <Pressable

                                onPress={() => setShareModalVisible(false)}

                                style={styles.modalClose}

                            >

                                <Ionicons name="close" size={22} color="#475569" />

                            </Pressable>

                        </View>

                        <Text style={styles.inputLabel}>{t.currentShares}</Text>

                        <View style={styles.readOnlyInput}>

                            <Text style={styles.readOnlyValue}>

                                {formatNumber(currentShares, language)}

                            </Text>

                        </View>

                        <Text style={styles.inputLabel}>{t.newShares}</Text>

                        <TextInput

                            value={newShares}

                            onChangeText={setNewShares}

                            keyboardType="number-pad"

                            placeholder={`1 - ${MAX_SHARES}`}

                            placeholderTextColor="#94a3b8"

                            style={styles.input}

                        />

                        <Text style={styles.inputLabel}>{t.effectiveDate}</Text>

                        <TextInput

                            value={effectiveDate}

                            onChangeText={setEffectiveDate}

                            placeholder={t.datePlaceholder}

                            placeholderTextColor="#94a3b8"

                            keyboardType="numbers-and-punctuation"

                            maxLength={10}

                            style={styles.input}

                        />

                        <View style={styles.previewCard}>

                            <PreviewRow

                                label={t.newWeeklyAmount}

                                value={formatAmount(weeklyAmountPreview, language)}

                            />

                            <PreviewRow

                                label={t.shareDifference}

                                value={`${shareDifference > 0 ? '+' : ''}${formatNumber(shareDifference, language)}`}

                            />

                            <PreviewRow

                                label={t.additionalPayable}

                                value={formatAmount(additionalPreview, language)}

                            />

                            <PreviewRow

                                label={t.refundPreview}

                                value={formatAmount(refundPreview, language)}

                                last

                            />

                        </View>

                        <Text style={styles.modalNote}>{t.shareNote}</Text>

                        <View style={styles.modalActions}>

                            <Pressable

                                onPress={() => setShareModalVisible(false)}

                                style={styles.cancelButton}

                            >

                                <Text style={styles.cancelButtonText}>{t.cancel}</Text>

                            </Pressable>

                            <Pressable

                                onPress={previewShareUpdate}

                                style={styles.updateButton}

                            >

                                <Ionicons

                                    name="eye-outline"

                                    size={18}

                                    color="#ffffff"

                                />

                                <Text style={styles.updateButtonText}>{t.update}</Text>

                            </Pressable>

                        </View>

                    </View>

                </View>

            </Modal>

        </SafeAreaView>

    );

}

function PreviewRow({

    label,

    value,

    last = false,

}: {

    label: string;

    value: string;

    last?: boolean;

}) {

    return (

        <View style={[styles.previewRow, !last && styles.previewRowBorder]}>

            <Text style={styles.previewLabel}>{label}</Text>

            <Text style={styles.previewValue}>{value}</Text>

        </View>

    );

}

const styles = StyleSheet.create({

    safeArea: {
        flex: 1,
        backgroundColor: '#f6f8fb',
    },

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

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10, // 10 থেকে 4
    },

    headerBrand: {
        flex: 1,
        minWidth: 0,
        justifyContent: 'center',
        marginLeft: 0, // 10 থেকে 0
    },

    headerMemberName: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0f172a',
    },

    headerMemberId: {
        marginTop: 2,
        fontSize: 10,
        color: '#64748b',
    },


    headerAppName: {
        fontSize: 15,
        fontWeight: '900',
        color: '#0f172a',
    },

    headerSubtitle: {
        marginTop: 2,
        fontSize: 10,
        fontWeight: '600',
        color: '#64748b',
    },

    headerIdentity: {
        maxWidth: 135,
        minWidth: 0,
        alignItems: 'flex-end',
        marginLeft: 8,
    },

    headerAdmin: {
        maxWidth: 90,
        alignItems: 'flex-end',
        marginLeft: 8,
    },

    headerAdminName: {
        fontSize: 10,
        fontWeight: '800',
        color: '#334155',
    },

    headerAdminId: {
        marginTop: 3,
        fontSize: 9,
        color: '#64748b',
    },

    languageBar: {
        minHeight: 49,
        paddingHorizontal: 17,
        paddingVertical: 6,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    languageLabel: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    languageLabelText: {
        marginLeft: 6,
        fontSize: 11,
        fontWeight: '700',
        color: '#64748b',
    },

    languageOptions: {
        flexDirection: 'row',
        padding: 3,
        borderRadius: 9,
        backgroundColor: '#f1f5f9',
    },

    languageButton: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 7,
    },

    languageButtonActive: {
        backgroundColor: '#0f172a',
    },

    languageButtonText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748b',
    },

    languageButtonTextActive: {
        color: '#ffffff',
    },

    scrollView: {
        flex: 1,
    },

    scrollContent: {
        flexGrow: 1,
        paddingBottom: 24,
    },

    container: {
        width: '100%',
        maxWidth: 650,
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingTop: 18,
    },

    pressed: {
        opacity: 0.7,
    },

    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 19,
    },


    sharesWeeklyBox: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 15,
        paddingHorizontal: 13,
        paddingVertical: 4,
        marginBottom: 19,
    },

    sharesWeeklyRow: {
        minHeight: 76,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        gap: 10,
    },

    sharesWeeklyInfo: {
        flex: 1,
        minWidth: 0,
    },

    sharesWeeklyLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#0f172a',
    },

    sharesWeeklyHint: {
        marginTop: 4,
        fontSize: 10,
        color: '#64748b',
    },

    sharesWeeklyValue: {
        fontSize: 15,
        fontWeight: '900',
        color: '#0f172a',
        textAlign: 'right',
    },

    sharesWeeklyDivider: {
        height: 1,
        backgroundColor: '#e2e8f0',
    },


    depositSummaryBox: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        padding: 12,
        marginBottom: 20,
    },


    totalDepositTitle: {
        fontSize: 17,
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: 4,
    },

    totalDepositAmountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginTop: -2,
        marginBottom: 8,
    },

    totalDepositDescription: {
        flex: 1,
        fontSize: 10,
        lineHeight: 15,
        fontWeight: '600',
        color: '#64748b',
        alignSelf: 'flex-start',
        marginTop: 1,
    },

    totalDepositValue: {
        fontSize: 24,
        lineHeight: 26,
        fontWeight: '900',
        color: '#0f172a',
        textAlign: 'right',
        marginTop: -24,
    },


    totalDepositCard: {
        width: '100%',
        padding: 15,
        borderRadius: 13,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 12,
    },


    totalDepositBreakdown: {
        marginTop: 1,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        gap: 10,
    },

    totalDepositBreakdownRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },

    breakdownLabelContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },

    breakdownLabel: {
        flex: 1,
        fontSize: 11,
        lineHeight: 16,
        color: '#64748b',
    },

    breakdownValue: {
        fontSize: 12,
        fontWeight: '800',
        color: '#0f172a',
    },


    depositCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },


    depositBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },

    depositSmallCard: {
        flex: 1,
        minWidth: 0,
        padding: 11,
        borderRadius: 13,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },

    depositSmallValue: {
        marginTop: 7,
        fontSize: 16,
        lineHeight: 23,
        fontWeight: '900',
        color: '#0f172a',
    },

    depositRange: {
        marginTop: 12,
        paddingTop: 9,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },

    depositRangeLabel: {
        fontSize: 10,
        lineHeight: 15,
        color: '#64748b',
    },

    depositRangeValue: {
        marginTop: 4,
        fontSize: 11,
        lineHeight: 17,
        fontWeight: '800',
        color: '#334155',
    },

    summaryCard: {
        width: '48.3%',
        minHeight: 125,
        padding: 13,
        borderRadius: 15,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 10,
    },

    summaryIcon: {
        width: 37,
        height: 37,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 11,
    },

    summaryLabel: {
        fontSize: 11,
        lineHeight: 16,
        color: '#64748b',
    },

    summaryValue: {
        marginTop: 5,
        fontSize: 17,
        lineHeight: 23,
        fontWeight: '900',
        color: '#0f172a',
    },

    cardAction: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 7,
    },

    cardActionText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#475569',
        marginRight: 2,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        marginBottom: 10,
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

    highlightCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 17,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 18,
    },

    highlightIcon: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: '#e0f2fe',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 13,
    },

    highlightText: {
        flex: 1,
    },

    highlightLabel: {
        fontSize: 11,
        color: '#64748b',
    },

    highlightAmount: {
        marginTop: 4,
        fontSize: 23,
        fontWeight: '900',
        color: '#0f172a',
    },

    highlightHint: {
        marginTop: 4,
        fontSize: 10,
        color: '#64748b',
    },

    infoCard: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 15,
        paddingHorizontal: 13,
        paddingVertical: 3,
        marginBottom: 18,
    },

    infoRow: {
        minHeight: 62,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },

    infoRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },

    infoIcon: {
        width: 35,
        height: 35,
        borderRadius: 10,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 11,
    },

    infoText: {
        flex: 1,
        minWidth: 0,
    },

    infoLabel: {
        fontSize: 10,
        color: '#94a3b8',
    },

    infoValue: {
        marginTop: 5,
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '700',
        color: '#334155',
    },

    historyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 15,
        backgroundColor: '#0f172a',
        marginBottom: 21,
    },


    historyButtonInside: {
        marginTop: 10,
        marginBottom: 10,
    },


    historyIcon: {
        width: 41,
        height: 41,
        borderRadius: 12,
        backgroundColor: '#334155',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    historyText: {
        flex: 1,
    },

    historyTitle: {
        fontSize: 13,
        fontWeight: '900',
        color: '#ffffff',
    },

    historySubtitle: {
        marginTop: 5,
        fontSize: 10,
        color: '#cbd5e1',
    },

    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 15,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 13,
    },

    actionText: {
        flex: 1,
        paddingRight: 12,

    },

    actionTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#0f172a',
    },

    actionSubtitle: {
        marginTop: 4,
        fontSize: 11,
        fontWeight: '800',
        color: '#64748b',
    },

    actionHint: {
        marginTop: 6,
        fontSize: 10,
        lineHeight: 15,
        color: '#94a3b8',
    },

    deleteButton: {
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#fecaca',
        backgroundColor: '#fffafa',
        borderRadius: 12,
        marginTop: 5,
    },

    deleteButtonText: {
        marginLeft: 8,
        fontSize: 12,
        fontWeight: '900',
        color: '#dc2626',
    },

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

    stateText: {
        marginTop: 12,
        fontSize: 12,
        lineHeight: 19,
        color: '#64748b',
        textAlign: 'center',
    },

    errorTitle: {
        marginTop: 13,
        fontSize: 15,
        fontWeight: '900',
        color: '#334155',
        textAlign: 'center',
    },

    retryButton: {
        minHeight: 42,
        paddingHorizontal: 18,
        borderRadius: 10,
        backgroundColor: '#0f172a',
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

    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.48)',
        justifyContent: 'flex-end',
    },

    modalCard: {

        backgroundColor: '#ffffff',
        borderTopLeftRadius: 23,
        borderTopRightRadius: 23,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 30,
    },

    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18,
    },

    modalTitle: {
        fontSize: 17,
        fontWeight: '900',
        color: '#0f172a',
    },

    modalClose: {
        width: 35,
        height: 35,
        borderRadius: 10,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },

    inputLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#475569',
        marginBottom: 7,
        marginTop: 10,
    },

    input: {
        height: 46,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 11,
        paddingHorizontal: 13,
        color: '#0f172a',
        fontSize: 13,
        backgroundColor: '#ffffff',
    },

    readOnlyInput: {
        height: 43,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 11,
        paddingHorizontal: 13,
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
    },

    readOnlyValue: {
        fontSize: 13,
        fontWeight: '800',
        color: '#64748b',
    },

    previewCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 13,
        paddingHorizontal: 12,
        marginTop: 15,
    },

    previewRow: {
        minHeight: 42,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },

    previewRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },

    previewLabel: {
        flex: 1,
        fontSize: 10,
        color: '#64748b',
        paddingRight: 8,
    },

    previewValue: {
        fontSize: 11,
        fontWeight: '900',
        color: '#0f172a',
    },

    modalNote: {
        marginTop: 12,
        fontSize: 10,
        lineHeight: 16,
        color: '#b45309',
    },

    modalActions: {
        flexDirection: 'row',
        marginTop: 18,
        gap: 10,
    },

    cancelButton: {
        flex: 1,
        minHeight: 46,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        alignItems: 'center',
        justifyContent: 'center',
    },

    cancelButtonText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#475569',
    },

    updateButton: {
        flex: 1,
        minHeight: 46,
        borderRadius: 11,
        backgroundColor: '#0f172a',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    updateButtonText: {
        marginLeft: 7,
        fontSize: 12,
        fontWeight: '900',
        color: '#ffffff',
    },

    bottomSpacing: {
        height: 20,
    },

});
