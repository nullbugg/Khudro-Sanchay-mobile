
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
    Alert,
    Animated,
    Easing,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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
    getAdminLanguage,
    setAdminLanguage,
    AdminLanguage,
} from '../../lib/admin-language';

import {
    createAdminWeeklyDeposit,
    getAdminMembers,
    getAdminProfile,
    getCurrentAdmin,
    clearCurrentAdmin,
} from '../../lib/admin-api';


// ==========================================================================
// TYPES
// ==========================================================================

type AdminMember = {
    memberId: string;
    memberName: string;
    phone: string;
    joinDate: string;
    currentShareCount: number;
    currentWeeklyAmount: number;
    status: string;
};


// ==========================================================================
// CONSTANTS
// ==========================================================================

const WEEKLY_RATE_PER_SHARE = 50;


// ==========================================================================
// TRANSLATIONS
// ==========================================================================

const translations = {

    bn: {

        appName: 'ক্ষুদ্র সঞ্চয়',
        appSubtitle: 'সমবায় সমিতি',
        adminPanel: 'অ্যাডমিন প্যানেল',
        adminId: 'অ্যাডমিন ID',

        dashboard: 'ড্যাশবোর্ড',
        profile: 'প্রোফাইল',
        changeEmail: 'ইমেইল পরিবর্তন',
        changePassword: 'পাসওয়ার্ড পরিবর্তন',

        weeklyRequest: 'সাপ্তাহিক জমার রিকোয়েস্ট',
        weeklyDeposit: 'সাপ্তাহিক জমা',
        weeklyHistory: 'সাপ্তাহিক জমার হিস্টরি',

        createAdmin: 'অ্যাডমিন তৈরি করুন',
        createMember: 'সদস্য তৈরি করুন',
        accessMember: 'সদস্য অ্যাকাউন্টে প্রবেশ',

        selectLanguage: 'ভাষা নির্বাচন করুন',
        bangla: 'বাংলা',
        english: 'English',
        logout: 'লগআউট',

        title: 'সাপ্তাহিক জমা',
        subtitle: 'সদস্যের সাপ্তাহিক জমা প্রদান',

        memberSelection: 'সদস্য নির্বাচন',
        memberPlaceholder: 'সদস্য ID অথবা নাম দিয়ে সার্চ করুন',
        noMember: 'কোনো Active Member পাওয়া যায়নি',
        selectedMember: 'নির্বাচিত সদস্য',

        weeklyAmount: 'সাপ্তাহিক জমার পরিমাণ',
        perWeek: 'প্রতি সপ্তাহে',
        shares: 'শেয়ার',

        weeksTitle: 'কত সপ্তাহের জমা?',
        weeksPlaceholder: 'যেমন: 3',
        weeks: 'সপ্তাহ',

        paymentMethod: 'পেমেন্ট মাধ্যম',
        cash: 'ক্যাশ',
        bkash: 'bKash',

        summary: 'জমার সারাংশ',
        member: 'সদস্য',
        totalDeposit: 'মোট জমা',

        deposit: 'জমা করুন',
        processing: 'প্রক্রিয়াধীন...',

        confirmTitle: 'জমা নিশ্চিত করুন',
        confirmMessage:
            'এই সদস্যের জন্য নির্বাচিত সপ্তাহের জমা প্রদান করবেন?',
        cancel: 'বাতিল',
        confirm: 'নিশ্চিত করুন',

        successTitle: 'জমা সফল',
        successMessage:
            'সদস্যের Weekly Deposit সফলভাবে সম্পন্ন হয়েছে।',
        noAdvance:
            'কোনো Advance তৈরি করা হয়নি।',

        memberListError:
            'Member list পাওয়া যায়নি।',
        memberLoadError:
            'Member list load করা যায়নি।',

        memberRequired:
            'প্রথমে একজন Active Member নির্বাচন করুন।',
        memberRequiredTitle:
            'সদস্য নির্বাচন করুন',

        weeksRequiredTitle:
            'সপ্তাহ দিন',
        weeksRequired:
            'কত সপ্তাহের Deposit করবেন তা লিখুন।',

        invalidWeeksTitle:
            'ভুল সপ্তাহ',
        invalidWeeks:
            'সপ্তাহের সংখ্যা অবশ্যই ১ বা তার বেশি পূর্ণ সংখ্যা হতে হবে।',

        invalidAmountTitle:
            'ভুল Amount',
        invalidAmount:
            'Member-এর Weekly Amount সঠিক নয়।',

        error:
            'ত্রুটি',

        depositFailed:
            'Deposit process করা যায়নি।',

    },


    en: {

        appName: 'Khudro Sanchoy',
        appSubtitle: 'Cooperative Society',
        adminPanel: 'Admin Panel',
        adminId: 'Admin ID',

        dashboard: 'Dashboard',
        profile: 'Profile',
        changeEmail: 'Change Email',
        changePassword: 'Change Password',

        weeklyRequest: 'Weekly Deposit Requests',
        weeklyDeposit: 'Weekly Deposit',
        weeklyHistory: 'Weekly Deposit History',

        createAdmin: 'Create Admin',
        createMember: 'Create Member',
        accessMember: 'Access Member Account',

        selectLanguage: 'Select Language',
        bangla: 'বাংলা',
        english: 'English',
        logout: 'Logout',

        title: 'Weekly Deposit',
        subtitle: 'Make weekly deposit for a member',

        memberSelection: 'Select Member',
        memberPlaceholder: 'Search by member ID or name',
        noMember: 'No Active Member found',
        selectedMember: 'Selected Member',

        weeklyAmount: 'Weekly Deposit Amount',
        perWeek: 'Per week',
        shares: 'Shares',

        weeksTitle: 'How many weeks?',
        weeksPlaceholder: 'Example: 3',
        weeks: 'Weeks',

        paymentMethod: 'Payment Method',
        cash: 'Cash',
        bkash: 'bKash',

        summary: 'Deposit Summary',
        member: 'Member',
        totalDeposit: 'Total Deposit',

        deposit: 'Make Deposit',
        processing: 'Processing...',

        information:
            'Admin Weekly Deposit creates one APPROVED record in Pending Deposits and a separate WEEKLY Collection record for each week.',

        confirmTitle: 'Confirm Deposit',
        confirmMessage:
            'Do you want to make the deposit for the selected weeks?',
        cancel: 'Cancel',
        confirm: 'Confirm',

        successTitle: 'Deposit Successful',
        successMessage:
            'Weekly Deposit has been completed successfully.',
        noAdvance:
            'No Advance was created.',

        memberListError:
            'Member list was not found.',
        memberLoadError:
            'Member list could not be loaded.',

        memberRequired:
            'Please select an Active Member first.',
        memberRequiredTitle:
            'Select Member',

        weeksRequiredTitle:
            'Enter Weeks',
        weeksRequired:
            'Please enter how many weeks you want to deposit.',

        invalidWeeksTitle:
            'Invalid Weeks',
        invalidWeeks:
            'Weeks must be a whole number greater than or equal to 1.',

        invalidAmountTitle:
            'Invalid Amount',
        invalidAmount:
            'The member Weekly Amount is not valid.',

        error:
            'Error',

        depositFailed:
            'Deposit process could not be completed.',

    },

};


// ==========================================================================
// HELPERS
// ==========================================================================

function formatCurrency(
    amount: number
): string {

    return `৳${Number(
        amount || 0
    ).toLocaleString(
        'en-US'
    )}`;

}


function calculateWeeklyAmount(
    member: AdminMember
): number {

    const weeklyAmount =
        Number(
            member.currentWeeklyAmount ??
            0
        );

    if (
        weeklyAmount > 0
    ) {

        return weeklyAmount;

    }


    const shareCount =
        Number(
            member.currentShareCount ??
            0
        );


    return (
        shareCount *
        WEEKLY_RATE_PER_SHARE
    );

}


// ==========================================================================
// SCREEN
// ==========================================================================

export default function AdminWeeklyDepositScreen() {

    // ----------------------------------------------------------------------
    // MENU STATE
    // ----------------------------------------------------------------------

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


    // ----------------------------------------------------------------------
    // LANGUAGE
    // ----------------------------------------------------------------------

    const [
        language,
        setLanguage,
    ] = useState<AdminLanguage>('bn');


    const t =
        translations[language];


    // ----------------------------------------------------------------------
    // ADMIN
    // ----------------------------------------------------------------------

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


    // ----------------------------------------------------------------------
    // MEMBER STATE
    // ----------------------------------------------------------------------

    const [
        members,
        setMembers,
    ] = useState<AdminMember[]>([]);


    const [
        loadingMembers,
        setLoadingMembers,
    ] = useState(true);


    const [
        selectedMember,
        setSelectedMember,
    ] = useState<AdminMember | null>(
        null
    );


    const [
        memberSearch,
        setMemberSearch,
    ] = useState('');


    const [
        showMemberList,
        setShowMemberList,
    ] = useState(false);


    // ----------------------------------------------------------------------
    // DEPOSIT STATE
    // ----------------------------------------------------------------------

    const [
        submitting,
        setSubmitting,
    ] = useState(false);


    const [
        weeks,
        setWeeks,
    ] = useState('');


    const [
        paymentMethod,
        setPaymentMethod,
    ] = useState<
        'cash' | 'bkash'
    >('cash');


    // ----------------------------------------------------------------------
    // LOAD LANGUAGE
    // ----------------------------------------------------------------------

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


    // ----------------------------------------------------------------------
    // CHANGE LANGUAGE
    // ----------------------------------------------------------------------

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


    // ----------------------------------------------------------------------
    // LOAD ADMIN PROFILE
    // ----------------------------------------------------------------------

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


    // ----------------------------------------------------------------------
    // LOAD MEMBERS
    // ----------------------------------------------------------------------

    const loadMembers =
        useCallback(
            async () => {

                try {

                    setLoadingMembers(
                        true
                    );


                    const result =
                        await getAdminMembers();


                    if (
                        result.success &&
                        Array.isArray(
                            result.members
                        )
                    ) {

                        const activeMembers =
                            result.members.filter(
                                (
                                    member
                                ) =>
                                    String(
                                        member.status ??
                                        'ACTIVE'
                                    ).toUpperCase() ===
                                    'ACTIVE'
                            );


                        setMembers(
                            activeMembers
                        );

                    } else {

                        setMembers([]);


                        Alert.alert(
                            t.error,
                            result.message ||
                            t.memberListError
                        );

                    }

                } catch (error) {

                    console.error(
                        'Admin weekly deposit members error:',
                        error
                    );


                    Alert.alert(
                        t.error,
                        t.memberLoadError
                    );

                } finally {

                    setLoadingMembers(
                        false
                    );

                }

            },
            [
                t.error,
                t.memberListError,
                t.memberLoadError,
            ]
        );


    useEffect(() => {

        loadMembers();

    }, [loadMembers]);


    // ----------------------------------------------------------------------
    // FILTER MEMBERS
    // ----------------------------------------------------------------------

    const filteredMembers =
        useMemo(() => {

            const search =
                memberSearch
                    .trim()
                    .toLowerCase();


            if (!search) {

                return members;

            }


            return members.filter(
                (
                    member
                ) =>
                    String(
                        member.memberId ??
                        ''
                    )
                        .toLowerCase()
                        .includes(
                            search
                        )
                    ||
                    String(
                        member.memberName ??
                        ''
                    )
                        .toLowerCase()
                        .includes(
                            search
                        )
            );

        }, [
            members,
            memberSearch,
        ]);


    // ----------------------------------------------------------------------
    // CALCULATIONS
    // ----------------------------------------------------------------------

    const weeklyAmount =
        selectedMember
            ? calculateWeeklyAmount(
                selectedMember
            )
            : 0;


    const weeksNumber =
        Number(
            weeks
        );


    const totalAmount =
        weeklyAmount > 0 &&
            Number.isInteger(
                weeksNumber
            ) &&
            weeksNumber > 0

            ? weeklyAmount *
            weeksNumber

            : 0;


    // ----------------------------------------------------------------------
    // SELECT MEMBER
    // ----------------------------------------------------------------------

    function handleSelectMember(
        member: AdminMember
    ) {

        setSelectedMember(
            member
        );


        setMemberSearch(
            member.memberName
        );


        setShowMemberList(
            false
        );

    }


    // ----------------------------------------------------------------------
    // SUBMIT VALIDATION
    // ----------------------------------------------------------------------

    async function handleSubmit() {

        if (!selectedMember) {

            Alert.alert(
                t.memberRequiredTitle,
                t.memberRequired
            );

            return;

        }


        if (!weeks.trim()) {

            Alert.alert(
                t.weeksRequiredTitle,
                t.weeksRequired
            );

            return;

        }


        if (
            !Number.isInteger(
                weeksNumber
            ) ||
            weeksNumber <= 0
        ) {

            Alert.alert(
                t.invalidWeeksTitle,
                t.invalidWeeks
            );

            return;

        }


        if (
            weeklyAmount <= 0
        ) {

            Alert.alert(
                t.invalidAmountTitle,
                t.invalidAmount
            );

            return;

        }


        Alert.alert(
            t.confirmTitle,

            `${selectedMember.memberName}\n\n` +
            `${t.weeklyAmount}: ${formatCurrency(
                weeklyAmount
            )}\n` +
            `${t.weeks}: ${weeksNumber}\n` +
            `${t.totalDeposit}: ${formatCurrency(
                totalAmount
            )}`,

            [
                {
                    text: t.cancel,
                    style: 'cancel',
                },

                {
                    text: t.confirm,
                    onPress:
                        submitDeposit,
                },
            ]
        );

    }


    // ----------------------------------------------------------------------
    // SUBMIT DEPOSIT
    // ----------------------------------------------------------------------

    async function submitDeposit() {

        if (!selectedMember) {
            return;
        }


        try {

            setSubmitting(
                true
            );


            const result =
                await createAdminWeeklyDeposit(
                    selectedMember.memberId,
                    weeksNumber,
                    paymentMethod
                );


            if (
                !result.success
            ) {

                Alert.alert(
                    t.title,
                    result.message ||
                    t.depositFailed
                );

                return;

            }


            Alert.alert(
                t.successTitle,

                `${selectedMember.memberName}\n\n` +
                `${t.weeklyAmount}: ${formatCurrency(
                    weeklyAmount
                )}\n` +
                `${t.totalDeposit}: ${formatCurrency(
                    totalAmount
                )}`,

                [
                    {
                        text: 'OK',
                        onPress: () => {

                            setWeeks(
                                ''
                            );

                            setPaymentMethod(
                                'cash'
                            );

                            setSelectedMember(
                                null
                            );

                            setMemberSearch(
                                ''
                            );

                        },
                    },
                ]
            );

        } catch (error) {

            console.error(
                'Admin weekly deposit submit error:',
                error
            );


            Alert.alert(
                t.error,
                t.depositFailed
            );

        } finally {

            setSubmitting(
                false
            );

        }

    }


    // ----------------------------------------------------------------------
    // MENU
    // ----------------------------------------------------------------------

    const openMenu = () => {

        if (menuMounted) {
            return;
        }


        setMenuMounted(
            true
        );

        setMenuOpen(
            true
        );


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

            setMenuOpen(
                false
            );

            setMenuMounted(
                false
            );


            if (callback) {
                callback();
            }

        });

    };


    const handleMenuPress = (
        routePath?: string
    ) => {

        if (!routePath) {

            closeMenu();

            return;

        }


        closeMenu(() => {

            router.push(
                routePath as any
            );

        });

    };


    const handleLogout = () => {

        closeMenu(async () => {

            await clearCurrentAdmin();


            router.replace(
                '/admin/login'
            );

        });

    };


    // ----------------------------------------------------------------------
    // MENU ITEM
    // ----------------------------------------------------------------------

    const MenuItem = ({
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
    }) => {

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

    };


    // ----------------------------------------------------------------------
    // RENDER
    // ----------------------------------------------------------------------

    return (

        <SafeAreaView
            style={styles.safeArea}
            edges={[
                'top',
                'bottom',
            ]}
        >

            <KeyboardAvoidingView
                style={styles.container}
                behavior={
                    Platform.OS === 'ios'
                        ? 'padding'
                        : undefined
                }
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
                    contentContainerStyle={
                        styles.scrollContent
                    }
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={
                        false
                    }
                >

                    <View
                        style={
                            styles.containerInner
                        }
                    >

                        {/* MEMBER */}

                        <View
                            style={
                                styles.card
                            }
                        >

                            <Text
                                style={
                                    styles.sectionTitle
                                }
                            >
                                {t.memberSelection}
                            </Text>


                            <View
                                style={
                                    styles.searchBox
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
                                    onChangeText={(
                                        value
                                    ) => {

                                        setMemberSearch(
                                            value
                                        );

                                        setShowMemberList(
                                            true
                                        );


                                        if (
                                            selectedMember &&
                                            value !==
                                            selectedMember.memberName
                                        ) {

                                            setSelectedMember(
                                                null
                                            );

                                        }

                                    }}
                                    onFocus={() =>
                                        setShowMemberList(
                                            true
                                        )
                                    }
                                    placeholder={
                                        t.memberPlaceholder
                                    }
                                    placeholderTextColor="#94a3b8"
                                    style={
                                        styles.searchInput
                                    }
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />


                                {loadingMembers && (

                                    <ActivityIndicator
                                        size="small"
                                        color="#0f172a"
                                    />

                                )}

                            </View>


                            {/* MEMBER LIST */}

                            {showMemberList &&
                                !loadingMembers && (

                                    <View
                                        style={
                                            styles.memberList
                                        }
                                    >

                                        {filteredMembers.length >
                                            0 ? (

                                            <ScrollView
                                                nestedScrollEnabled
                                                showsVerticalScrollIndicator
                                                style={
                                                    styles.memberListScroll
                                                }
                                                keyboardShouldPersistTaps="handled"
                                            >

                                                {filteredMembers.map(
                                                    (
                                                        member
                                                    ) => (

                                                        <Pressable
                                                            key={
                                                                member.memberId
                                                            }
                                                            onPress={() =>
                                                                handleSelectMember(
                                                                    member
                                                                )
                                                            }
                                                            style={({ pressed }) => [
                                                                styles.memberItem,
                                                                pressed &&
                                                                styles.memberItemPressed,
                                                            ]}
                                                        >

                                                            <View
                                                                style={
                                                                    styles.memberAvatar
                                                                }
                                                            >

                                                                <Text
                                                                    style={
                                                                        styles.memberAvatarText
                                                                    }
                                                                >
                                                                    {String(
                                                                        member.memberName ||
                                                                        'M'
                                                                    )
                                                                        .charAt(
                                                                            0
                                                                        )
                                                                        .toUpperCase()}
                                                                </Text>

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
                                                                    numberOfLines={1}
                                                                >
                                                                    {
                                                                        member.memberName
                                                                    }
                                                                </Text>


                                                                <Text
                                                                    style={
                                                                        styles.memberMeta
                                                                    }
                                                                    numberOfLines={1}
                                                                >
                                                                    {
                                                                        member.memberId
                                                                    }
                                                                </Text>

                                                            </View>


                                                            <Ionicons
                                                                name="chevron-forward"
                                                                size={18}
                                                                color="#94a3b8"
                                                            />

                                                        </Pressable>

                                                    )
                                                )}

                                            </ScrollView>

                                        ) : (

                                            <View
                                                style={
                                                    styles.emptyMember
                                                }
                                            >

                                                <Ionicons
                                                    name="person-outline"
                                                    size={27}
                                                    color="#94a3b8"
                                                />


                                                <Text
                                                    style={
                                                        styles.emptyMemberText
                                                    }
                                                >
                                                    {t.noMember}
                                                </Text>

                                            </View>

                                        )}

                                    </View>

                                )}


                            {/* SELECTED MEMBER */}

                            {selectedMember && (

                                <View
                                    style={
                                        styles.selectedMember
                                    }
                                >

                                    <View
                                        style={
                                            styles.selectedIcon
                                        }
                                    >

                                        <Ionicons
                                            name="person"
                                            size={18}
                                            color="#0f172a"
                                        />

                                    </View>


                                    <View
                                        style={
                                            styles.selectedInfo
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.selectedName
                                            }
                                            numberOfLines={1}
                                        >
                                            {
                                                selectedMember.memberName
                                            }
                                        </Text>


                                        <Text
                                            style={
                                                styles.selectedMeta
                                            }
                                        >
                                            {
                                                selectedMember.memberId
                                            }
                                        </Text>

                                    </View>


                                    <Pressable
                                        onPress={() => {

                                            setSelectedMember(
                                                null
                                            );

                                            setMemberSearch(
                                                ''
                                            );

                                        }}
                                        style={
                                            styles.removeButton
                                        }
                                    >

                                        <Ionicons
                                            name="close-circle"
                                            size={21}
                                            color="#94a3b8"
                                        />

                                    </Pressable>

                                </View>

                            )}

                        </View>


                        {/* WEEKLY AMOUNT */}

                        {selectedMember && (

                            <View
                                style={
                                    styles.card
                                }
                            >

                                <View
                                    style={
                                        styles.sectionTitleRow
                                    }
                                >

                                    <Text
                                        style={
                                            styles.sectionTitle
                                        }
                                    >
                                        {t.weeklyAmount}
                                    </Text>

                                </View>


                                <View
                                    style={
                                        styles.amountBox
                                    }
                                >

                                    <View
                                        style={
                                            styles.amountIcon
                                        }
                                    >

                                        <Ionicons
                                            name="cash-outline"
                                            size={22}
                                            color="#0f172a"
                                        />

                                    </View>


                                    <View
                                        style={
                                            styles.amountText
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.amountLabel
                                            }
                                        >
                                            {t.perWeek}
                                        </Text>


                                        <Text
                                            style={
                                                styles.amountValue
                                            }
                                        >
                                            {formatCurrency(
                                                weeklyAmount
                                            )}
                                        </Text>

                                    </View>


                                    <Text
                                        style={
                                            styles.shareText
                                        }
                                    >
                                        {
                                            Number(
                                                selectedMember.currentShareCount ??
                                                0
                                            )
                                        }{' '}
                                        {t.shares}
                                    </Text>

                                </View>

                            </View>

                        )}


                        {/* WEEKS */}

                        <View
                            style={
                                styles.card
                            }
                        >

                            <Text
                                style={
                                    styles.sectionTitle
                                }
                            >
                                {t.weeksTitle}
                            </Text>


                            <View
                                style={
                                    styles.weeksRow
                                }
                            >

                                <View
                                    style={
                                        styles.weeksInputWrapper
                                    }
                                >

                                    <TextInput
                                        value={
                                            weeks
                                        }
                                        onChangeText={(
                                            value
                                        ) =>
                                            setWeeks(
                                                value.replace(
                                                    /[^0-9]/g,
                                                    ''
                                                )
                                            )
                                        }
                                        placeholder={
                                            t.weeksPlaceholder
                                        }
                                        placeholderTextColor="#94a3b8"
                                        keyboardType="number-pad"
                                        style={
                                            styles.weeksInput
                                        }
                                        maxLength={3}
                                    />


                                    <Text
                                        style={
                                            styles.weeksSuffix
                                        }
                                    >
                                        {t.weeks}
                                    </Text>

                                </View>


                                <View
                                    style={
                                        styles.quickWeeks
                                    }
                                >

                                    {[1, 2, 4, 8].map(
                                        (
                                            value
                                        ) => (

                                            <Pressable
                                                key={
                                                    value
                                                }
                                                onPress={() =>
                                                    setWeeks(
                                                        String(
                                                            value
                                                        )
                                                    )
                                                }
                                                style={[
                                                    styles.quickWeekButton,
                                                    weeks ===
                                                    String(
                                                        value
                                                    ) &&
                                                    styles.quickWeekButtonActive,
                                                ]}
                                            >

                                                <Text
                                                    style={[
                                                        styles.quickWeekText,
                                                        weeks ===
                                                        String(
                                                            value
                                                        ) &&
                                                        styles.quickWeekTextActive,
                                                    ]}
                                                >
                                                    {value}
                                                </Text>

                                            </Pressable>

                                        )
                                    )}

                                </View>

                            </View>

                        </View>


                        {/* PAYMENT METHOD */}

                        <View
                            style={
                                styles.card
                            }
                        >

                            <Text
                                style={
                                    styles.sectionTitle
                                }
                            >
                                {t.paymentMethod}
                            </Text>


                            <View
                                style={
                                    styles.paymentRow
                                }
                            >

                                {/* CASH */}

                                <Pressable
                                    onPress={() =>
                                        setPaymentMethod(
                                            'cash'
                                        )
                                    }
                                    style={[
                                        styles.paymentOption,
                                        paymentMethod ===
                                        'cash' &&
                                        styles.paymentOptionActive,
                                    ]}
                                >

                                    <Ionicons
                                        name="cash-outline"
                                        size={21}
                                        color={
                                            paymentMethod ===
                                                'cash'
                                                ? '#0f172a'
                                                : '#64748b'
                                        }
                                    />


                                    <Text
                                        style={[
                                            styles.paymentText,
                                            paymentMethod ===
                                            'cash' &&
                                            styles.paymentTextActive,
                                        ]}
                                    >
                                        {t.cash}
                                    </Text>


                                    {paymentMethod ===
                                        'cash' && (

                                            <Ionicons
                                                name="checkmark-circle"
                                                size={19}
                                                color="#0f172a"
                                            />

                                        )}

                                </Pressable>


                                {/* BKASH */}

                                <Pressable
                                    onPress={() =>
                                        setPaymentMethod(
                                            'bkash'
                                        )
                                    }
                                    style={[
                                        styles.paymentOption,
                                        paymentMethod ===
                                        'bkash' &&
                                        styles.paymentOptionActive,
                                    ]}
                                >

                                    <Ionicons
                                        name="phone-portrait-outline"
                                        size={21}
                                        color={
                                            paymentMethod ===
                                                'bkash'
                                                ? '#0f172a'
                                                : '#64748b'
                                        }
                                    />


                                    <Text
                                        style={[
                                            styles.paymentText,
                                            paymentMethod ===
                                            'bkash' &&
                                            styles.paymentTextActive,
                                        ]}
                                    >
                                        {t.bkash}
                                    </Text>


                                    {paymentMethod ===
                                        'bkash' && (

                                            <Ionicons
                                                name="checkmark-circle"
                                                size={19}
                                                color="#0f172a"
                                            />

                                        )}

                                </Pressable>

                            </View>

                        </View>


                        {/* SUMMARY */}

                        {selectedMember &&
                            totalAmount > 0 && (

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
                                                size={19}
                                                color="#0f172a"
                                            />

                                        </View>


                                        <Text
                                            style={
                                                styles.summaryTitle
                                            }
                                        >
                                            {t.summary}
                                        </Text>

                                    </View>


                                    <View
                                        style={
                                            styles.summaryRow
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.summaryLabel
                                            }
                                        >
                                            {t.member}
                                        </Text>


                                        <Text
                                            style={
                                                styles.summaryValue
                                            }
                                            numberOfLines={1}
                                        >
                                            {
                                                selectedMember.memberName
                                            }
                                        </Text>

                                    </View>


                                    <View
                                        style={
                                            styles.summaryRow
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.summaryLabel
                                            }
                                        >
                                            {t.weeklyAmount}
                                        </Text>


                                        <Text
                                            style={
                                                styles.summaryValue
                                            }
                                        >
                                            {formatCurrency(
                                                weeklyAmount
                                            )}
                                        </Text>

                                    </View>


                                    <View
                                        style={
                                            styles.summaryRow
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.summaryLabel
                                            }
                                        >
                                            {t.weeks}
                                        </Text>


                                        <Text
                                            style={
                                                styles.summaryValue
                                            }
                                        >
                                            {weeksNumber}{' '}
                                            {t.weeks}
                                        </Text>

                                    </View>


                                    <View
                                        style={
                                            styles.divider
                                        }
                                    />


                                    <View
                                        style={
                                            styles.totalRow
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.totalLabel
                                            }
                                        >
                                            {t.totalDeposit}
                                        </Text>


                                        <Text
                                            style={
                                                styles.totalValue
                                            }
                                        >
                                            {formatCurrency(
                                                totalAmount
                                            )}
                                        </Text>

                                    </View>

                                </View>

                            )}


                        {/* DEPOSIT BUTTON */}

                        <Pressable
                            disabled={
                                submitting ||
                                !selectedMember ||
                                totalAmount <= 0
                            }
                            onPress={
                                handleSubmit
                            }
                            style={({ pressed }) => [
                                styles.submitButton,
                                (
                                    submitting ||
                                    !selectedMember ||
                                    totalAmount <= 0
                                ) &&
                                styles.submitButtonDisabled,
                                pressed &&
                                styles.submitButtonPressed,
                            ]}
                        >

                            {submitting ? (

                                <ActivityIndicator
                                    size="small"
                                    color="#ffffff"
                                />

                            ) : (

                                <Ionicons
                                    name="checkmark-circle-outline"
                                    size={22}
                                    color="#ffffff"
                                />

                            )}


                            <Text
                                style={
                                    styles.submitText
                                }
                            >
                                {submitting
                                    ? t.processing
                                    : t.deposit}
                            </Text>

                        </Pressable>

                    </View>

                </ScrollView>


                {/* ==========================================================
                   SIDE MENU
                   ========================================================== */}

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


                                    <View
                                        style={
                                            styles.menuDivider
                                        }
                                    />


                                    {/* WEEKLY REQUEST */}

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


                                    {/* WEEKLY DEPOSIT ACTIVE */}

                                    <MenuItem
                                        icon="cash-outline"
                                        label={
                                            t.weeklyDeposit
                                        }
                                        active={true}
                                        onPress={() =>
                                            closeMenu()
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


                                    <View
                                        style={
                                            styles.menuDivider
                                        }
                                    />


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


                                    <View
                                        style={
                                            styles.menuDivider
                                        }
                                    />


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
                                                    EN
                                                </Text>

                                            </Pressable>

                                        </View>

                                    </View>


                                    <View
                                        style={
                                            styles.menuDivider
                                        }
                                    />


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

            </KeyboardAvoidingView>

        </SafeAreaView>

    );

}


// ==========================================================================
// STYLES
// ==========================================================================

const styles =
    StyleSheet.create({

        safeArea: {
            flex: 1,
            backgroundColor: '#f6f8fb',
        },


        container: {
            flex: 1,
        },


        containerInner: {
            width: '100%',
            maxWidth: 600,
            alignSelf: 'center',
        },


        // ------------------------------------------------------------------
        // HEADER
        // ------------------------------------------------------------------

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


        // ------------------------------------------------------------------
        // CONTENT
        // ------------------------------------------------------------------

        scrollContent: {
            paddingHorizontal: 18,
            paddingTop: 22,
            paddingBottom: 35,
        },


        // ------------------------------------------------------------------
        // CARD
        // ------------------------------------------------------------------

        card: {
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: '#e2e8f0',
        },


        sectionTitle: {
            marginBottom: 11,
            fontSize: 12,
            fontWeight: '800',
            color: '#0f172a',
        },


        sectionTitleRow: {
            flexDirection: 'row',
            alignItems: 'center',
        },


        // ------------------------------------------------------------------
        // MEMBER SEARCH
        // ------------------------------------------------------------------

        searchBox: {
            minHeight: 48,
            paddingHorizontal: 13,
            borderRadius: 12,
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


        memberList: {
            marginTop: 8,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            overflow: 'hidden',
        },


        memberListScroll: {
            maxHeight: 198,
        },


        memberItem: {
            minHeight: 64,
            paddingHorizontal: 12,
            paddingVertical: 9,
            flexDirection: 'row',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: '#f1f5f9',
        },


        memberItemPressed: {
            backgroundColor: '#f8fafc',
        },


        memberAvatar: {
            width: 38,
            height: 38,
            borderRadius: 11,
            backgroundColor: '#f1f5f9',
            alignItems: 'center',
            justifyContent: 'center',
        },


        memberAvatarText: {
            fontSize: 15,
            fontWeight: '900',
            color: '#0f172a',
        },


        memberInfo: {
            flex: 1,
            marginLeft: 10,
            marginRight: 8,
        },


        memberName: {
            fontSize: 12,
            fontWeight: '800',
            color: '#0f172a',
        },


        memberMeta: {
            marginTop: 3,
            fontSize: 9,
            color: '#64748b',
        },


        emptyMember: {
            minHeight: 100,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 20,
        },


        emptyMemberText: {
            marginTop: 7,
            fontSize: 11,
            color: '#64748b',
            textAlign: 'center',
        },


        selectedMember: {
            marginTop: 9,
            minHeight: 56,
            paddingHorizontal: 11,
            borderRadius: 12,
            backgroundColor: '#f8fafc',
            borderWidth: 1,
            borderColor: '#e2e8f0',
            flexDirection: 'row',
            alignItems: 'center',
        },


        selectedIcon: {
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: '#e2e8f0',
            alignItems: 'center',
            justifyContent: 'center',
        },


        selectedInfo: {
            flex: 1,
            marginLeft: 10,
        },


        selectedName: {
            fontSize: 12,
            fontWeight: '900',
            color: '#0f172a',
        },


        selectedMeta: {
            marginTop: 3,
            fontSize: 9,
            color: '#64748b',
        },


        removeButton: {
            width: 30,
            height: 30,
            alignItems: 'center',
            justifyContent: 'center',
        },


        // ------------------------------------------------------------------
        // WEEKLY AMOUNT
        // ------------------------------------------------------------------

        amountBox: {
            minHeight: 68,
            padding: 11,
            borderRadius: 13,
            backgroundColor: '#f8fafc',
            borderWidth: 1,
            borderColor: '#e2e8f0',
            flexDirection: 'row',
            alignItems: 'center',
        },


        amountIcon: {
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor: '#e2e8f0',
            alignItems: 'center',
            justifyContent: 'center',
        },


        amountText: {
            flex: 1,
            marginLeft: 10,
        },


        amountLabel: {
            fontSize: 9,
            color: '#64748b',
        },


        amountValue: {
            marginTop: 2,
            fontSize: 19,
            fontWeight: '900',
            color: '#0f172a',
        },


        shareText: {
            fontSize: 10,
            fontWeight: '800',
            color: '#64748b',
        },


        // ------------------------------------------------------------------
        // WEEKS
        // ------------------------------------------------------------------

        weeksRow: {
            flexDirection: 'row',
            alignItems: 'center',
        },


        weeksInputWrapper: {
            flex: 1,
            minHeight: 50,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 13,
        },


        weeksInput: {
            flex: 1,
            minHeight: 48,
            paddingVertical: 0,
            fontSize: 16,
            fontWeight: '800',
            color: '#0f172a',
        },


        weeksSuffix: {
            fontSize: 10,
            fontWeight: '700',
            color: '#64748b',
        },


        quickWeeks: {
            flexDirection: 'row',
            marginLeft: 8,
            gap: 5,
        },


        quickWeekButton: {
            width: 34,
            height: 34,
            borderRadius: 9,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            alignItems: 'center',
            justifyContent: 'center',
        },


        quickWeekButtonActive: {
            backgroundColor: '#0f172a',
            borderColor: '#0f172a',
        },


        quickWeekText: {
            fontSize: 10,
            fontWeight: '800',
            color: '#64748b',
        },


        quickWeekTextActive: {
            color: '#ffffff',
        },


        // ------------------------------------------------------------------
        // PAYMENT
        // ------------------------------------------------------------------

        paymentRow: {
            flexDirection: 'row',
            gap: 9,
        },


        paymentOption: {
            flex: 1,
            minHeight: 52,
            paddingHorizontal: 11,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
        },


        paymentOptionActive: {
            backgroundColor: '#f1f5f9',
            borderColor: '#94a3b8',
        },


        paymentText: {
            flex: 1,
            fontSize: 11,
            fontWeight: '800',
            color: '#64748b',
        },


        paymentTextActive: {
            color: '#0f172a',
        },


        // ------------------------------------------------------------------
        // SUMMARY
        // ------------------------------------------------------------------

        summaryCard: {
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: '#e2e8f0',
        },


        summaryHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 11,
        },


        summaryIcon: {
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: '#f1f5f9',
            alignItems: 'center',
            justifyContent: 'center',
        },


        summaryTitle: {
            marginLeft: 9,
            fontSize: 12,
            fontWeight: '900',
            color: '#0f172a',
        },


        summaryRow: {
            minHeight: 30,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },


        summaryLabel: {
            fontSize: 10,
            color: '#64748b',
        },


        summaryValue: {
            maxWidth: '58%',
            fontSize: 10,
            fontWeight: '800',
            color: '#334155',
            textAlign: 'right',
        },


        divider: {
            height: 1,
            backgroundColor: '#e2e8f0',
            marginVertical: 7,
        },


        totalRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },


        totalLabel: {
            fontSize: 12,
            fontWeight: '900',
            color: '#0f172a',
        },


        totalValue: {
            fontSize: 19,
            fontWeight: '900',
            color: '#0f172a',
        },


        // ------------------------------------------------------------------
        // SUBMIT
        // ------------------------------------------------------------------

        submitButton: {
            minHeight: 50,
            marginBottom: 12,
            borderRadius: 12,
            backgroundColor: '#0f172a',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
        },


        submitButtonDisabled: {
            backgroundColor: '#94a3b8',
        },


        submitButtonPressed: {
            opacity: 0.65,
        },


        submitText: {
            fontSize: 12,
            fontWeight: '900',
            color: '#ffffff',
        },


        // ------------------------------------------------------------------
        // DRAWER
        // ------------------------------------------------------------------

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
                'rgba(15,23,42,0.42)',
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
            marginTop: 4,
        },


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

