import React, {
    useEffect,
    useRef,
    useState,
} from 'react';

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

import Ionicons from '@expo/vector-icons/Ionicons';

import {
    SafeAreaView,
} from 'react-native-safe-area-context';

import {
    router,
} from 'expo-router';

import {
    clearCurrentMember,
    getCurrentMember,
    updateMemberProfile,
    Member,
} from '../../lib/member-api';

import {
    getMemberLanguage,
    MemberLanguage,
    setMemberLanguage,
} from '../../lib/member-language';

/* ========================================================================== */
/* TRANSLATIONS                                                               */
/* ========================================================================== */

const translations = {
    bn: {
        appName:
            'ক্ষুদ্র সঞ্চয়',

        memberPanel:
            'সমবায় সমিতি',

        profile:
            'প্রোফাইল',

        dashboard:
            'ড্যাশবোর্ড',

        changeGmail:
            'জি-মেইল পরিবর্তন',

        changePin:
            'পিন পরিবর্তন',

        weeklyDeposit:
            'সাপ্তাহিক জমা',

        pendingDeposit:
            'অপেক্ষমাণ জমা',

        weeklyHistory:
            'সাপ্তাহিক ইতিহাস',

        language:
            'ভাষা নির্বাচন করুন',

        bangla:
            'বাংলা',

        logout:
            'লগআউট',

        personalInformation:
            'ব্যক্তিগত তথ্য',

        memberName:
            'সদস্যের নাম',

        phone:
            'মোবাইল নম্বর',

        gmail:
            'জিমেইল',

        joinDate:
            'যোগদানের তারিখ',

        memberId:
            'সদস্য ID',

        status:
            'স্ট্যাটাস',

        active:
            'সক্রিয়',

        edit:
            'সম্পাদনা',

        save:
            'সংরক্ষণ করুন',

        cancel:
            'বাতিল',

        saving:
            'সংরক্ষণ হচ্ছে...',

        loading:
            'তথ্য লোড হচ্ছে...',

        memberNotFound:
            'সদস্যের তথ্য পাওয়া যায়নি',

        back:
            'ফিরে যান',

        nameRequired:
            'সদস্যের নাম দিন',

        phoneRequired:
            'মোবাইল নম্বর দিন',

        somethingWrong:
            'কিছু সমস্যা হয়েছে',

        profileUpdated:
            'প্রোফাইল আপডেট করা যায়নি',
    },

    en: {
        appName:
            'ক্ষুদ্র সঞ্চয়',

        memberPanel:
            'সমবায় সমিতি',

        profile:
            'Profile',

        dashboard:
            'Dashboard',

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

        logout:
            'Logout',

        personalInformation:
            'Personal Information',

        memberName:
            'Member Name',

        phone:
            'Phone Number',

        gmail:
            'Gmail',

        joinDate:
            'Join Date',

        memberId:
            'Member ID',

        status:
            'Status',

        active:
            'Active',

        edit:
            'Edit',

        save:
            'Save Changes',

        cancel:
            'Cancel',

        saving:
            'Saving...',

        loading:
            'Loading information...',

        memberNotFound:
            'Member information not found',

        back:
            'Back',

        nameRequired:
            'Please enter member name',

        phoneRequired:
            'Please enter phone number',

        somethingWrong:
            'Something went wrong',

        profileUpdated:
            'Profile could not be updated',
    },
};

/* ========================================================================== */
/* MENU ITEM                                                                  */
/* ========================================================================== */

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
                    active || pressed;

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

/* ========================================================================== */
/* MENU DIVIDER                                                               */
/* ========================================================================== */

function MenuDivider() {
    return (
        <View
            style={
                styles.menuDivider
            }
        />
    );
}

/* ========================================================================== */
/* SCREEN                                                                     */
/* ========================================================================== */

export default function MemberProfile() {
    const [
        member,
        setMember,
    ] = useState<Member | null>(
        null
    );

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        editing,
        setEditing,
    ] = useState(false);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        language,
        setLanguage,
    ] =
        useState<MemberLanguage>(
            'bn'
        );

    const [
        name,
        setName,
    ] = useState('');

    const [
        phone,
        setPhone,
    ] = useState('');

    const [
        error,
        setError,
    ] = useState('');

    /* ---------------------------------------------------------------------- */
    /* DRAWER STATE                                                            */
    /* ---------------------------------------------------------------------- */

    const [
        menuMounted,
        setMenuMounted,
    ] = useState(false);

    const [
        menuOpen,
        setMenuOpen,
    ] = useState(false);

    const drawerTranslateX =
        useRef(
            new Animated.Value(-330)
        ).current;

    const overlayOpacity =
        useRef(
            new Animated.Value(0)
        ).current;

    const t =
        translations[language];

    /* ---------------------------------------------------------------------- */
    /* INITIAL LOAD                                                            */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            setLoading(true);
            setError('');

            const savedLanguage =
                await getMemberLanguage();

            setLanguage(
                savedLanguage
            );

            const result =
                await getCurrentMember();

            console.log(
                'Profile current member:',
                result
            );

            if (
                !result.success ||
                !result.member
            ) {
                setError(
                    result.message ||
                    translations[
                        savedLanguage
                    ].memberNotFound
                );

                return;
            }

            const currentMember =
                result.member;

            setMember(
                currentMember
            );

            setName(
                currentMember.memberName
            );

            setPhone(
                currentMember.phone
            );
        } catch (error) {
            console.error(
                'Profile load error:',
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : t.somethingWrong
            );
        } finally {
            setLoading(false);
        }
    }

    /* ---------------------------------------------------------------------- */
    /* OPEN MENU                                                               */
    /* ---------------------------------------------------------------------- */

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

    /* ---------------------------------------------------------------------- */
    /* CLOSE MENU                                                              */
    /* ---------------------------------------------------------------------- */

    const closeMenu = (
        callback?: () => void
    ) => {
        if (!menuMounted) {
            callback?.();
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

            callback?.();
        });
    };

    /* ---------------------------------------------------------------------- */
    /* MENU PRESS                                                              */
    /* ---------------------------------------------------------------------- */

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

    /* ---------------------------------------------------------------------- */
    /* LANGUAGE                                                                */
    /* ---------------------------------------------------------------------- */

    const changeLanguage = async (
        newLanguage: MemberLanguage
    ) => {
        setLanguage(
            newLanguage
        );

        try {
            await setMemberLanguage(
                newLanguage
            );
        } catch (error) {
            console.error(
                'Member language save error:',
                error
            );
        }
    };

    /* ---------------------------------------------------------------------- */
    /* LOGOUT                                                                  */
    /* ---------------------------------------------------------------------- */

    const handleLogout = () => {
        closeMenu(() => {
            clearCurrentMember();

            router.replace(
                '/member/login'
            );
        });
    };

    /* ---------------------------------------------------------------------- */
    /* EDIT                                                                    */
    /* ---------------------------------------------------------------------- */

    function startEditing() {
        if (!member) {
            return;
        }

        setName(
            member.memberName
        );

        setPhone(
            member.phone
        );

        setError('');

        setEditing(true);
    }

    function cancelEditing() {
        if (member) {
            setName(
                member.memberName
            );

            setPhone(
                member.phone
            );
        }

        setError('');

        setEditing(false);
    }

    /* ---------------------------------------------------------------------- */
    /* SAVE                                                                    */
    /* ---------------------------------------------------------------------- */

    async function saveProfile() {
        const cleanName =
            name.trim();

        const cleanPhone =
            phone.trim();

        if (!cleanName) {
            setError(
                t.nameRequired
            );

            return;
        }

        if (!cleanPhone) {
            setError(
                t.phoneRequired
            );

            return;
        }

        if (!member) {
            setError(
                t.memberNotFound
            );

            return;
        }

        try {
            setSaving(true);
            setError('');

            console.log(
                'Saving profile:',
                {
                    memberId:
                        member.memberId,

                    memberName:
                        cleanName,

                    phone:
                        cleanPhone,
                }
            );

            const result =
                await updateMemberProfile(
                    member.memberId,
                    cleanName,
                    cleanPhone
                );

            console.log(
                'Profile update result:',
                result
            );

            if (!result.success) {
                setError(
                    result.message ||
                    t.profileUpdated
                );

                return;
            }

            if (result.member) {
                setMember(
                    result.member
                );

                setName(
                    result.member.memberName
                );

                setPhone(
                    result.member.phone
                );
            } else {
                setMember(
                    (previous) =>
                        previous
                            ? {
                                ...previous,
                                memberName:
                                    cleanName,
                                phone:
                                    cleanPhone,
                            }
                            : previous
                );
            }

            setEditing(false);

            console.log(
                'Profile updated successfully'
            );
        } catch (error) {
            console.error(
                'Save profile error:',
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : t.profileUpdated
            );
        } finally {
            setSaving(false);
        }
    }

    /* ---------------------------------------------------------------------- */
    /* LOADING                                                                 */
    /* ---------------------------------------------------------------------- */

    if (loading) {
        return (
            <SafeAreaView
                style={styles.safeArea}
            >
                <View
                    style={
                        styles.loadingContainer
                    }
                >
                    <ActivityIndicator
                        size="large"
                        color="#0f172a"
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

    /* ---------------------------------------------------------------------- */
    /* ERROR                                                                   */
    /* ---------------------------------------------------------------------- */

    if (!member) {
        return (
            <SafeAreaView
                style={styles.safeArea}
            >
                <View
                    style={
                        styles.errorContainer
                    }
                >
                    <Text
                        style={
                            styles.errorTitle
                        }
                    >
                        {t.somethingWrong}
                    </Text>

                    <Text
                        style={
                            styles.errorMessage
                        }
                    >
                        {error ||
                            t.memberNotFound}
                    </Text>

                    <Pressable
                        onPress={() =>
                            router.back()
                        }
                        style={
                            styles.backButton
                        }
                    >
                        <Text
                            style={
                                styles.backButtonText
                            }
                        >
                            {t.back}
                        </Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    /* ---------------------------------------------------------------------- */
    /* MAIN                                                                    */
    /* ---------------------------------------------------------------------- */

    return (
        <SafeAreaView
            style={styles.safeArea}
        >
            <View
                style={styles.screen}
            >

                {/* ====================================================== */}
                {/* HEADER                                                   */}
                {/* ====================================================== */}

                <View
                    style={styles.header}
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
                                name="menu-outline"
                                size={24}
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
                                {t.memberPanel}
                            </Text>
                        </View>
                    </View>

                    <View
                        style={styles.memberInfo}
                    >

                        <Text
                            style={styles.memberName}
                            numberOfLines={1}
                        >
                            {member.memberName}
                        </Text>


                        <Text
                            style={styles.memberId}
                        >
                            {t.memberId}: {member.memberId}
                        </Text>

                    </View>

                </View>

                {/* ====================================================== */}
                {/* CONTENT                                                 */}
                {/* ====================================================== */}

                <ScrollView
                    showsVerticalScrollIndicator={
                        false
                    }
                    contentContainerStyle={
                        styles.content
                    }
                >

                    <View
                        style={
                            styles.profileHeader
                        }
                    >

                        <View
                            style={
                                styles.profileIconContainer
                            }
                        >

                            <View
                                style={
                                    styles.profileIcon
                                }
                            >

                                <Ionicons
                                    name="person"
                                    size={30}
                                    color="#ffffff"
                                />

                            </View>

                        </View>

                        <Text
                            style={
                                styles.pageTitle
                            }
                        >
                            {t.profile}
                        </Text>

                        <Text
                            style={
                                styles.pageSubtitle
                            }
                        >
                            {t.personalInformation}
                        </Text>

                    </View>

                    {/* ================================================== */}
                    {/* NAME                                                 */}
                    {/* ================================================== */}

                    <ProfileInfoCard
                        label={
                            t.memberName
                        }
                        value={
                            editing
                                ? name
                                : member.memberName
                        }
                        editable={
                            editing
                        }
                        editing={
                            editing
                        }
                        onEdit={
                            startEditing
                        }
                        onChangeText={
                            setName
                        }
                        icon="person-outline"
                    />

                    {/* ================================================== */}
                    {/* PHONE                                                */}
                    {/* ================================================== */}

                    <ProfileInfoCard
                        label={
                            t.phone
                        }
                        value={
                            editing
                                ? phone
                                : member.phone
                        }
                        editable={
                            editing
                        }
                        editing={
                            editing
                        }
                        onEdit={
                            startEditing
                        }
                        onChangeText={
                            setPhone
                        }
                        keyboardType="phone-pad"
                        icon="call-outline"
                    />

                    {/* ================================================== */}
                    {/* GMAIL                                                */}
                    {/* ================================================== */}

                    <ProfileInfoCard
                        label={
                            t.gmail
                        }
                        value={
                            member.email
                        }
                        editable={false}
                        icon="mail-outline"
                    />

                    {/* ================================================== */}
                    {/* MEMBER ID                                            */}
                    {/* ================================================== */}

                    <ProfileInfoCard
                        label={
                            t.memberId
                        }
                        value={
                            member.memberId
                        }
                        editable={false}
                        icon="card-outline"
                    />

                    {/* ================================================== */}
                    {/* JOIN DATE                                            */}
                    {/* ================================================== */}

                    <ProfileInfoCard
                        label={
                            t.joinDate
                        }
                        value={
                            formatDate(
                                member.joinDate,
                                language
                            )
                        }
                        editable={false}
                        icon="calendar-outline"
                    />

                    {/* ================================================== */}
                    {/* STATUS                                               */}
                    {/* ================================================== */}

                    <ProfileInfoCard
                        label={
                            t.status
                        }
                        value={
                            member.status ||
                            t.active
                        }
                        editable={false}
                        icon="checkmark-circle-outline"
                        status
                    />

                    {/* ================================================== */}
                    {/* EDIT ACTIONS                                         */}
                    {/* ================================================== */}

                    {editing && (
                        <View
                            style={
                                styles.actionContainer
                            }
                        >
                            {error !== '' && (
                                <Text
                                    style={
                                        styles.errorText
                                    }
                                >
                                    {error}
                                </Text>
                            )}

                            <View
                                style={
                                    styles.actionRow
                                }
                            >
                                <Pressable
                                    onPress={
                                        cancelEditing
                                    }
                                    disabled={
                                        saving
                                    }
                                    style={({ pressed }) => [
                                        styles.cancelButton,
                                        pressed &&
                                        styles.buttonPressed,
                                    ]}
                                >
                                    <Text
                                        style={
                                            styles.cancelButtonText
                                        }
                                    >
                                        {t.cancel}
                                    </Text>
                                </Pressable>

                                <Pressable
                                    onPress={
                                        saveProfile
                                    }
                                    disabled={
                                        saving
                                    }
                                    style={({ pressed }) => [
                                        styles.saveButton,
                                        pressed &&
                                        styles.buttonPressed,
                                    ]}
                                >
                                    {saving ? (
                                        <ActivityIndicator
                                            size="small"
                                            color="#ffffff"
                                        />
                                    ) : (
                                        <Text
                                            style={
                                                styles.saveButtonText
                                            }
                                        >
                                            {t.save}
                                        </Text>
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    )}

                    {!editing &&
                        error !== '' && (
                            <Text
                                style={
                                    styles.errorText
                                }
                            >
                                {error}
                            </Text>
                        )}

                    <View
                        style={{
                            height: 35,
                        }}
                    />
                </ScrollView>

                {/* ====================================================== */}
                {/* DRAWER                                                  */}
                {/* ====================================================== */}

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
                                        active
                                        onPress={() =>
                                            closeMenu()
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

                                    {/* PENDING DEPOSIT */}

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

/* ========================================================================== */
/* PROFILE INFO CARD                                                          */
/* ========================================================================== */

function ProfileInfoCard({
    label,
    value,
    editable,
    editing = false,
    onEdit,
    onChangeText,
    keyboardType,
    icon,
    status = false,
}: {
    label: string;
    value: string;
    editable: boolean;
    editing?: boolean;
    onEdit?: () => void;
    onChangeText?: (
        value: string
    ) => void;
    keyboardType?:
    | 'default'
    | 'phone-pad';
    icon: React.ComponentProps<
        typeof Ionicons
    >['name'];
    status?: boolean;
}) {
    return (
        <View
            style={
                styles.infoCard
            }
        >
            <View
                style={
                    styles.infoIcon
                }
            >
                <Ionicons
                    name={icon}
                    size={20}
                    color="#475569"
                />
            </View>

            <View
                style={
                    styles.infoContent
                }
            >
                <Text
                    style={
                        styles.infoLabel
                    }
                >
                    {label}
                </Text>

                {editable ? (
                    <TextInput
                        value={value}
                        onChangeText={
                            onChangeText
                        }
                        keyboardType={
                            keyboardType ||
                            'default'
                        }
                        style={
                            styles.infoInput
                        }
                        placeholder={
                            label
                        }
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="words"
                    />
                ) : (
                    <Text
                        style={[
                            styles.infoValue,
                            status &&
                            styles.statusValue,
                        ]}
                        numberOfLines={2}
                    >
                        {value || '-'}
                    </Text>
                )}
            </View>

            {/* ONLY NAME & PHONE EDIT ICON */}

            {onEdit && !editing && (
                <Pressable
                    onPress={onEdit}
                    hitSlop={8}
                    style={({ pressed }) => [
                        styles.editIconButton,
                        pressed &&
                        styles.editIconButtonPressed,
                    ]}
                >
                    <Ionicons
                        name="create-outline"
                        size={19}
                        color="#475569"
                    />
                </Pressable>
            )}
        </View>
    );
}

/* ========================================================================== */
/* HELPERS                                                                    */
/* ========================================================================== */

function formatDate(
    date: string,
    language: MemberLanguage
) {
    if (!date) {
        return '-';
    }

    const value =
        String(date).trim();

    let day: number;
    let month: number;
    let year: number;

    // DD-MM-YYYY
    const ddmmyyyy =
        value.match(
            /^(\d{2})-(\d{2})-(\d{4})$/
        );

    if (ddmmyyyy) {
        day =
            Number(
                ddmmyyyy[1]
            );

        month =
            Number(
                ddmmyyyy[2]
            );

        year =
            Number(
                ddmmyyyy[3]
            );
    } else {
        // YYYY-MM-DD
        const yyyymmdd =
            value.match(
                /^(\d{4})-(\d{2})-(\d{2})$/
            );

        if (yyyymmdd) {
            year =
                Number(
                    yyyymmdd[1]
                );

            month =
                Number(
                    yyyymmdd[2]
                );

            day =
                Number(
                    yyyymmdd[3]
                );
        } else {
            const parsed =
                new Date(value);

            if (
                Number.isNaN(
                    parsed.getTime()
                )
            ) {
                return value;
            }

            day =
                parsed.getDate();

            month =
                parsed.getMonth() + 1;

            year =
                parsed.getFullYear();
        }
    }

    const parsed =
        new Date(
            year,
            month - 1,
            day
        );

    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {
        return value;
    }

    return parsed.toLocaleDateString(
        language === 'bn'
            ? 'bn-BD'
            : 'en-GB',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }
    );
}

/* ========================================================================== */
/* STYLES                                                                     */
/* ========================================================================== */

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor:
            '#f6f8fb',
    },

    screen: {
        flex: 1,
        backgroundColor:
            '#f6f8fb',
    },

    /* ---------------------------------------------------------------------- */
    /* HEADER                                                                  */
    /* ---------------------------------------------------------------------- */

    header: {
        minHeight: 76,
        paddingHorizontal: 18,
        paddingVertical: 12,
        backgroundColor:
            '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor:
            '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent:
            'space-between',
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
        backgroundColor:
            '#f1f5f9',
        alignItems: 'center',
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

    memberInfo: {
        maxWidth: 145,
        alignItems: 'flex-end',
    },

    memberName: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0f172a',
    },

    memberId: {
        marginTop: 2,
        fontSize: 10,
        color: '#64748b',
    },


    /* ---------------------------------------------------------------------- */
    /* CONTENT                                                                 */
    /* ---------------------------------------------------------------------- */

    content: {
        paddingHorizontal: 18,
        paddingTop: 20,

    },

    profileHeader: {
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f172a",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 20,
        paddingTop: 5,
        paddingBottom: 16,
        paddingHorizontal: 18,
        marginBottom: 20,
    },

    profileIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: -6,
    },

    profileIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
    },

    pageTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#ffffff",
        textAlign: "center",
        marginTop: -5,
        marginBottom: 0,
    },

    pageSubtitle: {
        fontSize: 13,
        fontWeight: "400",
        color: "#ffffff",
        textAlign: "center",
        marginBottom: 0,
    },

    /* ---------------------------------------------------------------------- */
    /* INFO CARD                                                               */
    /* ---------------------------------------------------------------------- */

    infoCard: {
        minHeight: 82,
        marginBottom: 10,
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderRadius: 15,
        borderWidth: 1,
        borderColor:
            '#e2e8f0',
        backgroundColor:
            '#ffffff',
        flexDirection: 'row',
        alignItems: 'center',
    },

    infoIcon: {
        width: 42,
        height: 42,
        borderRadius: 11,
        backgroundColor:
            '#f1f5f9',
        alignItems: 'center',
        justifyContent:
            'center',
    },

    infoContent: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },

    infoLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94a3b8',
        marginBottom: 5,
    },

    infoValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0f172a',
    },

    statusValue: {
        color: '#16a34a',
    },

    infoInput: {
        minHeight: 39,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 9,
        borderWidth: 1,
        borderColor:
            '#cbd5e1',
        backgroundColor:
            '#f8fafc',
        fontSize: 14,
        fontWeight: '700',
        color: '#0f172a',
    },

    editIconButton: {
        width: 36,
        height: 36,
        borderRadius: 9,
        backgroundColor:
            '#f1f5f9',
        alignItems: 'center',
        justifyContent:
            'center',
    },

    editIconButtonPressed: {
        opacity: 0.65,
    },

    /* ---------------------------------------------------------------------- */
    /* ACTIONS                                                                 */
    /* ---------------------------------------------------------------------- */

    actionContainer: {
        marginTop: 4,
    },

    errorText: {
        marginTop: 4,
        marginBottom: 10,
        fontSize: 11,
        lineHeight: 17,
        color: '#dc2626',
        textAlign: 'center',
    },

    actionRow: {
        flexDirection: 'row',
        gap: 10,
    },

    cancelButton: {
        flex: 1,
        minHeight: 46,
        borderRadius: 11,
        backgroundColor:
            '#e2e8f0',
        alignItems: 'center',
        justifyContent:
            'center',
    },

    cancelButtonText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#334155',
    },

    saveButton: {
        flex: 1,
        minHeight: 46,
        borderRadius: 11,
        backgroundColor:
            '#0f172a',
        alignItems: 'center',
        justifyContent:
            'center',
    },

    saveButtonText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#ffffff',
    },

    buttonPressed: {
        opacity: 0.65,
    },

    /* ---------------------------------------------------------------------- */
    /* DRAWER                                                                  */
    /* ---------------------------------------------------------------------- */

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
            '#000000',
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
        borderBottomColor:
            '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent:
            'space-between',
    },

    drawerBrand: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    drawerLogo: {
        width: 43,
        height: 43,
        borderRadius: 12,
        backgroundColor:
            '#0f172a',
        alignItems: 'center',
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
        alignItems: 'center',
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
        flexDirection: 'row',
        alignItems: 'center',
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
        alignItems: 'center',
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

    /* ---------------------------------------------------------------------- */
    /* LANGUAGE                                                                */
    /* ---------------------------------------------------------------------- */

    languageMenu: {
        minHeight: 55,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent:
            'space-between',
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

    /* ---------------------------------------------------------------------- */
    /* LOGOUT                                                                  */
    /* ---------------------------------------------------------------------- */

    logoutButton: {
        minHeight: 46,
        borderRadius: 10,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
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

    /* ---------------------------------------------------------------------- */
    /* LOADING                                                                 */
    /* ---------------------------------------------------------------------- */

    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent:
            'center',
        backgroundColor:
            '#f6f8fb',
    },

    loadingText: {
        marginTop: 12,
        fontSize: 12,
        color: '#64748b',
    },

    /* ---------------------------------------------------------------------- */
    /* ERROR                                                                   */
    /* ---------------------------------------------------------------------- */

    errorContainer: {
        flex: 1,
        paddingHorizontal: 30,
        alignItems: 'center',
        justifyContent:
            'center',
        backgroundColor:
            '#f6f8fb',
    },

    errorTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
    },

    errorMessage: {
        marginTop: 7,
        textAlign: 'center',
        fontSize: 12,
        lineHeight: 19,
        color: '#64748b',
    },

    backButton: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 11,
        borderRadius: 11,
        backgroundColor:
            '#0f172a',
    },

    backButtonText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#ffffff',
    },
});
