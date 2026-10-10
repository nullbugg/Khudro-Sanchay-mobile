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
    clearCurrentAdmin,
    getAdminMembers,
} from '../../lib/admin-api';


/* ==========================================================================
   TYPES
   ========================================================================== */

type Member = {
    memberId: string;
    memberName: string;
    phone: string;
    joinDate: string;
    shareCount: number;
    weeklyAmount: number;
    status: 'ACTIVE' | 'INACTIVE';
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

        adminId: 'অ্যাডমিন ID',

        searchPlaceholder:
            'Member ID অথবা নাম দিয়ে খুঁজুন',

        memberList:
            'সকল সদস্য',

        memberCount:
            'জন সদস্য',

        noMember:
            'কোনো সদস্য পাওয়া যায়নি',

        noMemberDescription:
            'Member ID অথবা নাম দিয়ে আবার চেষ্টা করুন।',

        details:
            'বিস্তারিত',

        active:
            'সক্রিয়',

        inactive:
            'নিষ্ক্রিয়',

        memberId:
            'Member ID',

        phone:
            'ফোন',

        joinDate:
            'যোগদানের তারিখ',

        shares:
            'শেয়ার',

        weeklyAmount:
            'সাপ্তাহিক জমা',

        loadingMembers:
            'সদস্যদের তথ্য লোড হচ্ছে...',

        loadError:
            'সদস্যদের তথ্য লোড করা যায়নি',

        retry:
            'আবার চেষ্টা করুন',

    },


    en: {

        appName: 'ক্ষুদ্র সঞ্চয়',

        appSubtitle: 'সমবায় সমিতি',

        adminPanel: 'Admin Panel',

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

        adminId: 'Admin ID',

        searchPlaceholder:
            'Search by Member ID or name',

        memberList:
            'All Members',

        memberCount:
            'members',

        noMember:
            'No member found',

        noMemberDescription:
            'Try again with a Member ID or name.',

        details:
            'Details',

        active:
            'Active',

        inactive:
            'Inactive',

        memberId:
            'Member ID',

        phone:
            'Phone',

        joinDate:
            'Join Date',

        shares:
            'Shares',

        weeklyAmount:
            'Weekly Deposit',

        loadingMembers:
            'Loading members...',

        loadError:
            'Failed to load member information',

        retry:
            'Try Again',

    },

};


/* ==========================================================================
   SCREEN
   ========================================================================== */

export default function AccessMemberScreen() {

    /* ----------------------------------------------------------------------
       MENU
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
       SEARCH
       ---------------------------------------------------------------------- */

    const [
        searchText,
        setSearchText,
    ] = useState('');


    /* ----------------------------------------------------------------------
       MEMBERS
       ---------------------------------------------------------------------- */

    const [
        members,
        setMembers,
    ] = useState<Member[]>([]);


    const [
        membersLoading,
        setMembersLoading,
    ] = useState(true);


    const [
        membersError,
        setMembersError,
    ] = useState('');


    /* ----------------------------------------------------------------------
       LANGUAGE LOAD
       ---------------------------------------------------------------------- */

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


    /* ----------------------------------------------------------------------
       CHANGE LANGUAGE
       ---------------------------------------------------------------------- */

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


    /* ----------------------------------------------------------------------
       LOAD MEMBERS
       ---------------------------------------------------------------------- */

    const loadMembers = useCallback(
        async () => {

            setMembersLoading(true);

            setMembersError('');

            try {

                const result =
                    await getAdminMembers();


                if (!result.success) {

                    setMembers([]);

                    setMembersError(
                        result.message ||
                        'Failed to load members.'
                    );

                    return;

                }


                const mappedMembers: Member[] =
                    (result.members ?? [])
                        .map(
                            (member) => ({

                                memberId:
                                    String(
                                        member.memberId ??
                                        ''
                                    ).trim(),

                                memberName:
                                    String(
                                        member.memberName ??
                                        ''
                                    ).trim(),

                                phone:
                                    String(
                                        member.phone ??
                                        ''
                                    ).trim(),

                                joinDate:
                                    String(
                                        member.joinDate ??
                                        ''
                                    ).trim(),

                                shareCount:
                                    Number(
                                        member.currentShareCount ??
                                        0
                                    ),

                                weeklyAmount:
                                    Number(
                                        member.currentWeeklyAmount ??
                                        0
                                    ),


                                status:
                                    String(
                                        member.status ?? ''
                                    )
                                        .trim()
                                        .toUpperCase() === 'ACTIVE'
                                        ? ('ACTIVE' as const)
                                        : ('INACTIVE' as const),


                            })
                        )
                        .filter(
                            (member) =>
                                member.memberId &&
                                member.memberName
                        );


                setMembers(
                    mappedMembers
                );

            } catch (error) {

                console.error(
                    'Load members error:',
                    error
                );

                setMembers([]);

                setMembersError(
                    'Failed to load members.'
                );

            } finally {

                setMembersLoading(false);

            }

        },
        []
    );


    /* ----------------------------------------------------------------------
       LOAD ADMIN PROFILE + MEMBERS
       ---------------------------------------------------------------------- */

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


                        if (!result.success) {

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

                    } catch (error) {

                        console.error(
                            'Admin profile refresh error:',
                            error
                        );

                    }

                };


            loadLatestAdminProfile();

            loadMembers();


            return () => {

                isMounted = false;

            };

        }, [loadMembers])
    );


    /* ----------------------------------------------------------------------
       FILTER MEMBERS
       ---------------------------------------------------------------------- */

    const normalizedSearch =
        searchText
            .trim()
            .toLowerCase();


    const filteredMembers =
        members.filter(
            (member) => {

                if (!normalizedSearch) {

                    return true;

                }


                return (
                    member.memberId
                        .toLowerCase()
                        .includes(
                            normalizedSearch
                        ) ||

                    member.memberName
                        .toLowerCase()
                        .includes(
                            normalizedSearch
                        )
                );

            }
        );


    /* ----------------------------------------------------------------------
       OPEN MENU
       ---------------------------------------------------------------------- */

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


    /* ----------------------------------------------------------------------
       CLOSE MENU
       ---------------------------------------------------------------------- */

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


    /* ----------------------------------------------------------------------
       MENU PRESS
       ---------------------------------------------------------------------- */

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


    /* ----------------------------------------------------------------------
       MEMBER DETAILS
       ---------------------------------------------------------------------- */

    const openMemberDetails = (
        memberId: string
    ) => {

        router.push(
            `/admin/access-member/${memberId}` as any
        );

    };


    /* ----------------------------------------------------------------------
       LOGOUT
       ---------------------------------------------------------------------- */

    const handleLogout = () => {

        closeMenu(() => {

            clearCurrentAdmin();

            router.replace(
                '/admin/login'
            );

        });

    };


    /* ----------------------------------------------------------------------
       MAIN
       ---------------------------------------------------------------------- */

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

            <View style={styles.contentArea}>

                <View
                    style={styles.container}
                >

                    {/* SEARCH */}

                    <View
                        style={styles.searchCard}
                    >

                        <View
                            style={
                                styles.searchContainer
                            }
                        >

                            <Ionicons
                                name="search-outline"
                                size={20}
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
                                        styles.clearButton
                                    }
                                >

                                    <Ionicons
                                        name="close-circle"
                                        size={20}
                                        color="#94a3b8"
                                    />

                                </Pressable>

                            )}

                        </View>

                    </View>


                    {/* MEMBER SECTION */}

                    <View
                        style={styles.memberSection}
                    >

                        <View
                            style={
                                styles.sectionHeader
                            }
                        >

                            <View>

                                <Text
                                    style={
                                        styles.sectionTitle
                                    }
                                >
                                    {t.memberList}
                                </Text>


                                <Text
                                    style={
                                        styles.sectionCount
                                    }
                                >
                                    {membersLoading
                                        ? '...'
                                        : filteredMembers.length}{' '}
                                    {t.memberCount}
                                </Text>

                            </View>


                            <View
                                style={
                                    styles.memberIcon
                                }
                            >

                                <Ionicons
                                    name="people"
                                    size={19}
                                    color="#0f172a"
                                />

                            </View>

                        </View>


                        {/* LOADING */}

                        {membersLoading ? (

                            <View
                                style={
                                    styles.loadingState
                                }
                            >

                                <ActivityIndicator
                                    size="small"
                                    color="#0f172a"
                                />


                                <Text
                                    style={
                                        styles.loadingText
                                    }
                                >
                                    {t.loadingMembers}
                                </Text>

                            </View>

                        ) : membersError ? (

                            /* ERROR */

                            <View
                                style={
                                    styles.emptyState
                                }
                            >

                                <View
                                    style={
                                        styles.emptyIcon
                                    }
                                >

                                    <Ionicons
                                        name="alert-circle-outline"
                                        size={27}
                                        color="#94a3b8"
                                    />

                                </View>


                                <Text
                                    style={
                                        styles.emptyTitle
                                    }
                                >
                                    {t.loadError}
                                </Text>


                                <Text
                                    style={
                                        styles.emptyDescription
                                    }
                                >
                                    {membersError}
                                </Text>


                                <Pressable
                                    onPress={
                                        loadMembers
                                    }
                                    style={({ pressed }) => [
                                        styles.retryButton,

                                        pressed &&
                                        styles.retryButtonPressed,
                                    ]}
                                >

                                    <Ionicons
                                        name="refresh-outline"
                                        size={17}
                                        color="#ffffff"
                                    />


                                    <Text
                                        style={
                                            styles.retryButtonText
                                        }
                                    >
                                        {t.retry}
                                    </Text>

                                </Pressable>

                            </View>

                        ) : filteredMembers.length > 0 ? (

                            /* MEMBERS */

                            <ScrollView
                                style={styles.memberScroll}
                                contentContainerStyle={styles.memberList}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                nestedScrollEnabled={true}
                            >
                                {filteredMembers.map(
                                    (member) => (

                                        <MemberCard
                                            key={
                                                member.memberId
                                            }
                                            member={
                                                member
                                            }
                                            language={
                                                language
                                            }
                                            t={t}
                                            onDetails={() =>
                                                openMemberDetails(
                                                    member.memberId
                                                )
                                            }
                                        />

                                    )
                                )}
                            </ScrollView>

                        ) : (

                            /* EMPTY */

                            <View
                                style={
                                    styles.emptyState
                                }
                            >

                                <View
                                    style={
                                        styles.emptyIcon
                                    }
                                >

                                    <Ionicons
                                        name="search-outline"
                                        size={27}
                                        color="#94a3b8"
                                    />

                                </View>


                                <Text
                                    style={
                                        styles.emptyTitle
                                    }
                                >
                                    {t.noMember}
                                </Text>


                                <Text
                                    style={
                                        styles.emptyDescription
                                    }
                                >
                                    {
                                        t.noMemberDescription
                                    }
                                </Text>

                            </View>

                        )}

                    </View>


                    <View
                        style={
                            styles.bottomSpacing
                        }
                    />

                </View>

            </View>


            {/* ==================================================================
               SIDE MENU
               ================================================================== */}

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
                                        label={t.dashboard}
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


                                {/* WEEKLY REQUEST */}

                                <MenuItem
                                    icon="notifications-outline"
                                    label={t.weeklyRequest}
                                    onPress={() =>
                                        handleMenuPress(
                                            '/admin/weekly-request'
                                        )
                                    }
                                />


                                {/* WEEKLY DEPOSIT */}

                                <MenuItem
                                    icon="cash-outline"
                                    label={t.weeklyDeposit}
                                    onPress={() =>
                                        handleMenuPress(
                                            '/admin/weekly-deposit'
                                        )
                                    }
                                />


                                {/* WEEKLY HISTORY */}

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


                                {/* CREATE ADMIN */}

                                <MenuItem
                                    icon="person-add-outline"
                                    label={t.createAdmin}
                                    onPress={() =>
                                        handleMenuPress(
                                            '/admin/create-admin'
                                        )
                                    }
                                />


                                {/* CREATE MEMBER */}

                                <MenuItem
                                    icon="people-outline"
                                    label={t.createMember}
                                    onPress={() =>
                                        handleMenuPress(
                                            '/admin/create-member'
                                        )
                                    }
                                />


                                {/* ACCESS MEMBER - ACTIVE */}

                                <MenuItem
                                    icon="log-in-outline"
                                    label={t.accessMember}
                                    active={true}
                                    onPress={() =>
                                        closeMenu()
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
   MEMBER CARD
   ========================================================================== */

type MemberCardProps = {

    member: Member;

    language: AdminLanguage;

    t: typeof translations.bn;

    onDetails: () => void;

};


function MemberCard({
    member,
    language,
    t,
    onDetails,
}: MemberCardProps) {

    return (

        <View
            style={styles.memberCard}
        >

            {/* TOP */}

            <View
                style={
                    styles.memberTop
                }
            >

                <View
                    style={
                        styles.memberIdentity
                    }
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
                            {member.memberName
                                .charAt(0)
                                .toUpperCase()}
                        </Text>

                    </View>


                    <View
                        style={
                            styles.memberNameArea
                        }
                    >

                        <Text
                            style={
                                styles.memberName
                            }
                            numberOfLines={1}
                        >
                            {member.memberName}
                        </Text>


                        <Text
                            style={
                                styles.memberIdText
                            }
                        >
                            {member.memberId}
                        </Text>

                    </View>

                </View>


                <View
                    style={[
                        styles.statusBadge,

                        member.status === 'ACTIVE'
                            ? styles.activeBadge
                            : styles.inactiveBadge,
                    ]}
                >

                    <Text
                        style={[
                            styles.statusText,

                            member.status === 'ACTIVE'
                                ? styles.activeText
                                : styles.inactiveText,
                        ]}
                    >
                        {member.status === 'ACTIVE'
                            ? t.active
                            : t.inactive}
                    </Text>

                </View>

            </View>


            {/* INFO */}

            <View
                style={
                    styles.memberInfoRow
                }
            >

                <MemberInfo
                    icon="call-outline"
                    label={t.phone}
                    value={member.phone}
                />


                <MemberInfo
                    icon="calendar-outline"
                    label={t.joinDate}
                    value={member.joinDate}
                />

            </View>


            <View
                style={
                    styles.memberInfoRow
                }
            >

                <MemberInfo
                    icon="layers-outline"
                    label={t.shares}
                    value={`${member.shareCount}`}
                />


                <MemberInfo
                    icon="cash-outline"
                    label={t.weeklyAmount}
                    value={`৳ ${member.weeklyAmount.toLocaleString('en-BD')}`}
                />

            </View>


            {/* DETAILS BUTTON */}

            <Pressable
                onPress={onDetails}
                style={({ pressed }) => [
                    styles.detailsButton,

                    pressed &&
                    styles.detailsButtonPressed,
                ]}
            >

                <Ionicons
                    name="eye-outline"
                    size={18}
                    color="#ffffff"
                />


                <Text
                    style={
                        styles.detailsButtonText
                    }
                >
                    {t.details}
                </Text>


                <Ionicons
                    name="arrow-forward"
                    size={17}
                    color="#ffffff"
                />

            </Pressable>

        </View>

    );

}


/* ==========================================================================
   MEMBER INFO
   ========================================================================== */

type MemberInfoProps = {

    icon: React.ComponentProps<
        typeof Ionicons
    >['name'];

    label: string;

    value: string;

};


function MemberInfo({
    icon,
    label,
    value,
}: MemberInfoProps) {

    return (

        <View
            style={
                styles.memberInfo
            }
        >

            <Ionicons
                name={icon}
                size={15}
                color="#94a3b8"
            />


            <View
                style={
                    styles.memberInfoText
                }
            >

                <Text
                    style={
                        styles.memberInfoLabel
                    }
                >
                    {label}
                </Text>


                <Text
                    style={
                        styles.memberInfoValue
                    }
                    numberOfLines={1}
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
        flex: 1,
        minHeight: 0,
    },


    /* PAGE HEADER */

    pageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },


    pageTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0f172a',
    },


    pageDescription: {
        marginTop: 4,
        fontSize: 10,
        color: '#64748b',
    },


    pageIcon: {
        width: 45,
        height: 45,
        borderRadius: 13,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },


    /* SEARCH */

    searchCard: {
        padding: 12,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },


    searchContainer: {
        minHeight: 48,
        paddingHorizontal: 13,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
    },


    searchInput: {
        flex: 1,
        marginLeft: 9,
        paddingVertical: 0,
        fontSize: 12,
        color: '#0f172a',
    },


    clearButton: {
        padding: 3,
    },


    /* MEMBER SECTION */

    memberSection: {
        marginTop: 15,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
        flex: 1,
        minHeight: 0,
    },


    sectionHeader: {
        minHeight: 70,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },


    sectionTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0f172a',
    },


    sectionCount: {
        marginTop: 3,
        fontSize: 9,
        color: '#94a3b8',
    },


    memberIcon: {
        width: 39,
        height: 39,
        borderRadius: 11,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },


    /* MEMBER LIST */

    memberList: {
        paddingHorizontal: 12,
        paddingVertical: 12,
    },


    /* LOADING */

    loadingState: {
        paddingHorizontal: 20,
        paddingVertical: 55,
        alignItems: 'center',
        justifyContent: 'center',
    },


    loadingText: {
        marginTop: 12,
        fontSize: 10,
        color: '#94a3b8',
    },


    /* MEMBER CARD */

    memberCard: {
        padding: 15,
        borderRadius: 14,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 10,
    },


    memberTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },


    memberIdentity: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        minWidth: 0,
    },


    memberAvatar: {
        width: 43,
        height: 43,
        borderRadius: 13,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 11,
    },


    memberAvatarText: {
        fontSize: 17,
        fontWeight: '900',
        color: '#0f172a',
    },


    memberNameArea: {
        flex: 1,
        minWidth: 0,
    },


    memberName: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0f172a',
    },


    memberIdText: {
        marginTop: 3,
        fontSize: 10,
        color: '#64748b',
    },


    statusBadge: {
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 8,
        marginLeft: 8,
    },


    activeBadge: {
        backgroundColor: '#ecfdf5',
    },


    inactiveBadge: {
        backgroundColor: '#fef2f2',
    },


    statusText: {
        fontSize: 8,
        fontWeight: '800',
    },


    activeText: {
        color: '#059669',
    },


    inactiveText: {
        color: '#dc2626',
    },


    /* MEMBER INFO */

    memberInfoRow: {
        flexDirection: 'row',
        marginTop: 13,
    },


    memberInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 0,
    },


    memberInfoText: {
        marginLeft: 7,
        flex: 1,
        minWidth: 0,
    },


    memberInfoLabel: {
        fontSize: 8,
        color: '#94a3b8',
    },


    memberInfoValue: {
        marginTop: 2,
        fontSize: 10,
        fontWeight: '700',
        color: '#334155',
    },


    contentArea: {
        flex: 1,
        minHeight: 0,
    },


    memberScroll: {
        flex: 1,
    },


    /* DETAILS */

    detailsButton: {
        marginTop: 15,
        minHeight: 42,
        borderRadius: 10,
        backgroundColor: '#0f172a',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },


    detailsButtonPressed: {
        opacity: 0.65,
    },


    detailsButtonText: {
        marginHorizontal: 8,
        fontSize: 11,
        fontWeight: '800',
        color: '#ffffff',
    },


    /* EMPTY */

    emptyState: {
        paddingHorizontal: 20,
        paddingVertical: 45,
        alignItems: 'center',
    },


    emptyIcon: {
        width: 60,
        height: 60,
        borderRadius: 18,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },


    emptyTitle: {
        marginTop: 13,
        fontSize: 14,
        fontWeight: '800',
        color: '#334155',
        textAlign: 'center',
    },


    emptyDescription: {
        marginTop: 5,
        fontSize: 10,
        color: '#94a3b8',
        textAlign: 'center',
    },


    /* RETRY */

    retryButton: {
        marginTop: 17,
        minHeight: 40,
        paddingHorizontal: 17,
        borderRadius: 10,
        backgroundColor: '#0f172a',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },


    retryButtonPressed: {
        opacity: 0.65,
    },


    retryButtonText: {
        marginLeft: 7,
        fontSize: 10,
        fontWeight: '800',
        color: '#ffffff',
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


    /*
     * Drawer এখন main header-এর নিচ থেকে শুরু হবে।
     * Header-এর height = 76
     */
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


    firstMenuItem: {
        marginTop: 10,
    },


    /* ----------------------------------------------------------------------
       MENU ITEM

       Exactly matches dashboard.tsx.
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

});

