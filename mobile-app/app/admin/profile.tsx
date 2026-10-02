import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    SafeAreaView,
} from "react-native-safe-area-context";

import {
    router,
    useFocusEffect,
} from "expo-router";

import {
    getAdminLanguage,
    setAdminLanguage,
    AdminLanguage,
} from "../../lib/admin-language";

import {
    getAdminProfile,
    updateAdminProfile,
    getCurrentAdmin,
    clearCurrentAdmin,
    deleteAdminAccount,
    AdminProfile,
} from "../../lib/admin-api";


/* ==========================================================================
   TRANSLATIONS
   ========================================================================== */

const translations = {

    bn: {

        appName:
            "ক্ষুদ্র সঞ্চয়",

        appSubtitle:
            "সমবায় সমিতি",

        adminPanel:
            "অ্যাডমিন প্যানেল",

        dashboard:
            "ড্যাশবোর্ড",

        profile:
            "প্রোফাইল",

        changeEmail:
            "ইমেইল পরিবর্তন",

        changePassword:
            "পাসওয়ার্ড পরিবর্তন",

        weeklyRequest:
            "সাপ্তাহিক জমার রিকোয়েস্ট",

        weeklyDeposit:
            "সাপ্তাহিক জমা",

        weeklyHistory:
            "সাপ্তাহিক জমার হিস্টরি",

        createAdmin:
            "অ্যাডমিন তৈরি করুন",

        createMember:
            "সদস্য তৈরি করুন",

        accessMember:
            "সদস্য অ্যাকাউন্টে প্রবেশ",

        selectLanguage:
            "ভাষা নির্বাচন করুন",

        bangla:
            "বাংলা",

        english:
            "English",

        logout:
            "লগআউট",

        adminId:
            "অ্যাডমিন ID",

        profileSubtitle:
            "আপনার অ্যাডমিন অ্যাকাউন্টের তথ্য",

        name:
            "নাম",

        phone:
            "ফোন নম্বর",

        email:
            "Gmail",

        verified:
            "ভেরিফাইড",

        notVerified:
            "ভেরিফাই করা হয়নি",

        verifyEmail:
            "Gmail ভেরিফাই করুন",

        save:
            "সংরক্ষণ করুন",

        cancel:
            "বাতিল",

        loading:
            "লোড হচ্ছে...",

        profileUpdated:
            "প্রোফাইল সফলভাবে আপডেট হয়েছে",

        error:
            "কিছু সমস্যা হয়েছে",

        invalidName:
            "সঠিক নাম দিন",

        invalidPhone:
            "সঠিক বাংলাদেশি ফোন নম্বর দিন",

        emailVerification:
            "Gmail Verification",

        emailVerificationDescription:
            "আপনার Gmail-এ একটি OTP পাঠিয়ে এটি ভেরিফাই করা হবে.",

        deleteAccount:
            "অ্যাকাউন্ট ডিলিট করুন",

        deleteAccountDescription:
            "আপনার অ্যাডমিন অ্যাকাউন্ট স্থায়ীভাবে ডিলিট করুন",

        deleteAccountWarning:
            "সতর্কতা",

        deleteAccountWarningText:
            "এই অ্যাকাউন্ট ডিলিট করলে এটি স্থায়ীভাবে মুছে যাবে এবং পরে আর পুনরুদ্ধার করা যাবে না।",

        continueDelete:
            "ডিলিট করতে এগিয়ে যান",

        enterPassword:
            "অ্যাডমিন Password দিন",

        password:
            "Password",

        passwordPlaceholder:
            "আপনার বর্তমান Password দিন",

        confirmDelete:
            "অ্যাকাউন্ট স্থায়ীভাবে ডিলিট করবেন?",

        confirmDeleteText:
            "অ্যাকাউন্ট ডিলিট করতে আপনার বর্তমান Admin Password দিয়ে যাচাই করুন।",

        delete:
            "স্থায়ীভাবে ডিলিট",

        deleting:
            "ডিলিট হচ্ছে...",

        accountDeleted:
            "Admin account সফলভাবে ডিলিট হয়েছে",

        wrongPassword:
            "Password সঠিক নয়",

        deleteFailed:
            "Admin account ডিলিট করা যায়নি",

    },


    en: {

        appName:
            "ক্ষুদ্র সঞ্চয়",

        appSubtitle:
            "সমবায় সমিতি",

        adminPanel:
            "Admin Panel",

        dashboard:
            "Dashboard",

        profile:
            "Profile",

        changeEmail:
            "Change Email",

        changePassword:
            "Change Password",

        weeklyRequest:
            "Weekly Deposit Requests",

        weeklyDeposit:
            "Weekly Deposit",

        weeklyHistory:
            "Weekly Deposit History",

        createAdmin:
            "Create Admin",

        createMember:
            "Create Member",

        accessMember:
            "Access Member Account",

        selectLanguage:
            "Select Language",

        bangla:
            "বাংলা",

        english:
            "English",

        logout:
            "Logout",

        adminId:
            "Admin ID",

        profileSubtitle:
            "Your administrator account information",

        name:
            "Name",

        phone:
            "Phone Number",

        email:
            "Gmail",

        verified:
            "Verified",

        notVerified:
            "Not Verified",

        verifyEmail:
            "Verify Gmail",

        save:
            "Save Changes",

        cancel:
            "Cancel",

        loading:
            "Loading...",

        profileUpdated:
            "Profile updated successfully",

        error:
            "Something went wrong",

        invalidName:
            "Enter a valid name",

        invalidPhone:
            "Enter a valid Bangladesh phone number",

        emailVerification:
            "Gmail Verification",

        emailVerificationDescription:
            "An OTP will be sent to your Gmail to verify it.",

        deleteAccount:
            "Delete Account",

        deleteAccountDescription:
            "Permanently delete your administrator account",

        deleteAccountWarning:
            "Warning",

        deleteAccountWarningText:
            "Deleting this account will permanently remove it and it cannot be recovered later.",

        continueDelete:
            "Continue to Delete",

        enterPassword:
            "Enter Admin Password",

        password:
            "Password",

        passwordPlaceholder:
            "Enter your current Password",

        confirmDelete:
            "Permanently delete account?",

        confirmDeleteText:
            "Enter your current Admin Password to verify before deleting the account.",

        delete:
            "Delete Permanently",

        deleting:
            "Deleting...",

        accountDeleted:
            "Admin account deleted successfully",

        wrongPassword:
            "Password is incorrect",

        deleteFailed:
            "Admin account could not be deleted",

    },

};


/* ==========================================================================
   SCREEN
   ========================================================================== */

export default function AdminProfileScreen() {

    /* ---------------------------------------------------------------------- */
    /* MENU                                                                   */
    /* ---------------------------------------------------------------------- */

    const [
        menuOpen,
        setMenuOpen,
    ] = useState(false);


    const [
        menuMounted,
        setMenuMounted,
    ] = useState(false);


    /* ---------------------------------------------------------------------- */
    /* MENU ANIMATION                                                         */
    /* ---------------------------------------------------------------------- */

    const drawerTranslateX =
        useRef(
            new Animated.Value(-330)
        ).current;


    const overlayOpacity =
        useRef(
            new Animated.Value(0)
        ).current;


    const openMenu = () => {

        setMenuMounted(true);

        requestAnimationFrame(() => {

            Animated.parallel([

                Animated.timing(
                    drawerTranslateX,
                    {
                        toValue: 0,
                        duration: 280,
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
                        duration: 230,
                        easing:
                            Easing.out(
                                Easing.quad
                            ),
                        useNativeDriver: true,
                    }
                ),

            ]).start();

        });

        setMenuOpen(true);

    };


    const closeMenu = (
        callback?: () => void
    ) => {

        Animated.parallel([

            Animated.timing(
                drawerTranslateX,
                {
                    toValue: -330,
                    duration: 230,
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
                            Easing.quad
                        ),
                    useNativeDriver: true,
                }
            ),

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


    /* ---------------------------------------------------------------------- */
    /* LANGUAGE                                                               */
    /* ---------------------------------------------------------------------- */

    const [
        language,
        setLanguage,
    ] = useState<AdminLanguage>("bn");


    const t =
        translations[language];


    /* ---------------------------------------------------------------------- */
    /* ADMIN                                                                  */
    /* ---------------------------------------------------------------------- */

    const currentAdmin =
        getCurrentAdmin();


    const [
        adminName,
        setAdminName,
    ] = useState(
        currentAdmin?.adminName || "Admin"
    );


    const [
        adminId,
        setAdminId,
    ] = useState(
        currentAdmin?.adminId || "A001"
    );


    /* ---------------------------------------------------------------------- */
    /* PROFILE                                                                */
    /* ---------------------------------------------------------------------- */

    const [
        profile,
        setProfile,
    ] = useState<AdminProfile | null>(
        null
    );


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        saving,
        setSaving,
    ] = useState(false);


    /* ---------------------------------------------------------------------- */
    /* INDIVIDUAL EDIT MODE                                                   */
    /* ---------------------------------------------------------------------- */

    const [
        editingField,
        setEditingField,
    ] = useState<
        "name" | "phone" | null
    >(null);


    const [
        name,
        setName,
    ] = useState("");


    const [
        phone,
        setPhone,
    ] = useState("");


    /* ---------------------------------------------------------------------- */
    /* DELETE ACCOUNT                                                         */
    /* ---------------------------------------------------------------------- */

    const [
        deleteModalVisible,
        setDeleteModalVisible,
    ] = useState(false);


    const [
        deletePassword,
        setDeletePassword,
    ] = useState("");


    const [
        deletePasswordVisible,
        setDeletePasswordVisible,
    ] = useState(false);


    const [
        deleting,
        setDeleting,
    ] = useState(false);


    /* ====================================================================== */
    /* INITIALIZE                                                             */
    /* ====================================================================== */

    useEffect(() => {

        initialize();

    }, []);


    async function initialize() {

        try {

            const savedLanguage =
                await getAdminLanguage();

            setLanguage(
                savedLanguage
            );

            await loadProfile();

        } catch (error) {

            console.error(
                "Profile initialization error:",
                error
            );

            setLoading(false);

        }

    }


    /* ====================================================================== */
    /* LOAD PROFILE                                                           */
    /* ====================================================================== */

    async function loadProfile() {

        setLoading(true);

        const sessionAdmin =
            getCurrentAdmin();


        const activeAdminId =
            sessionAdmin?.adminId ||
            adminId;


        if (!activeAdminId) {

            setLoading(false);

            return;

        }


        const result =
            await getAdminProfile(
                activeAdminId
            );


        if (!result.success) {

            Alert.alert(
                t.error,
                result.message
            );

            setLoading(false);

            return;

        }


        setProfile(
            result.profile
        );


        setName(
            result.profile.adminName
        );


        setPhone(
            normalizeBangladeshPhone(
                result.profile.phone
            )
        );


        setAdminName(
            result.profile.adminName ||
            "Admin"
        );


        setAdminId(
            result.profile.adminId ||
            activeAdminId
        );


        setLoading(false);

    }


    /* ====================================================================== */
    /* REFRESH PROFILE WHEN SCREEN FOCUSED                                    */
    /* ====================================================================== */

    useFocusEffect(
        useCallback(() => {

            let isMounted = true;


            const refreshProfile =
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


                        setProfile(
                            result.profile
                        );


                        setName(
                            result.profile.adminName
                        );


                        setPhone(
                            normalizeBangladeshPhone(
                                result.profile.phone
                            )
                        );


                        setAdminName(
                            result.profile.adminName ||
                            "Admin"
                        );


                        setAdminId(
                            result.profile.adminId ||
                            sessionAdmin.adminId
                        );


                    } catch (error) {

                        console.error(
                            "Profile refresh error:",
                            error
                        );

                    }

                };


            refreshProfile();


            return () => {

                isMounted = false;

            };

        }, [])
    );


    /* ====================================================================== */
    /* CHANGE LANGUAGE                                                        */
    /* ====================================================================== */

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
                "Admin language save error:",
                error
            );

        }

    };


    /* ====================================================================== */
    /* MENU                                                                   */
    /* ====================================================================== */

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


    /* ====================================================================== */
    /* LOGOUT                                                                 */
    /* ====================================================================== */

    const handleLogout = () => {

        closeMenu(() => {

            clearCurrentAdmin();

            router.replace(
                "/admin/login"
            );

        });

    };


    /* ====================================================================== */
    /* START NAME EDITING                                                     */
    /* ====================================================================== */

    function startNameEditing() {

        if (!profile) {
            return;
        }


        setName(
            profile.adminName
        );


        setEditingField(
            "name"
        );

    }


    /* ====================================================================== */
    /* START PHONE EDITING                                                    */
    /* ====================================================================== */

    function startPhoneEditing() {

        if (!profile) {
            return;
        }


        setPhone(
            normalizeBangladeshPhone(
                profile.phone
            )
        );


        setEditingField(
            "phone"
        );

    }


    /* ====================================================================== */
    /* CANCEL EDITING                                                         */
    /* ====================================================================== */

    function cancelEditing() {

        if (profile) {

            setName(
                profile.adminName
            );


            setPhone(
                normalizeBangladeshPhone(
                    profile.phone
                )
            );

        }


        setEditingField(
            null
        );

    }


    /* ====================================================================== */
    /* NORMALIZE BANGLADESH PHONE                                             */
    /* ====================================================================== */

    function normalizeBangladeshPhone(
        value: string
    ): string {

        const digits =
            String(value ?? "")
                .replace(
                    /\D/g,
                    ""
                )
                .trim();


        if (
            /^01[3-9]\d{8}$/.test(
                digits
            )
        ) {

            return digits;

        }


        if (
            /^1[3-9]\d{8}$/.test(
                digits
            )
        ) {

            return `0${digits}`;

        }


        if (
            /^8801[3-9]\d{8}$/.test(
                digits
            )
        ) {

            return `0${digits.slice(2)}`;

        }


        return digits;

    }


    /* ====================================================================== */
    /* SAVE PROFILE                                                           */
    /* ====================================================================== */

    async function saveProfile() {

        if (!profile) {
            return;
        }


        const cleanName =
            name.trim();


        const cleanPhone =
            normalizeBangladeshPhone(
                phone
            );


        const originalName =
            String(
                profile.adminName ?? ""
            ).trim();


        const originalPhone =
            normalizeBangladeshPhone(
                profile.phone
            );


        const nameChanged =
            cleanName !== originalName;


        const phoneChanged =
            cleanPhone !== originalPhone;


        if (
            !nameChanged &&
            !phoneChanged
        ) {

            setEditingField(
                null
            );

            return;

        }


        if (nameChanged) {

            if (
                !cleanName ||
                cleanName.length < 2
            ) {

                Alert.alert(
                    t.error,
                    t.invalidName
                );

                return;

            }

        }


        if (phoneChanged) {

            const phoneRegex =
                /^01[3-9]\d{8}$/;


            if (
                !phoneRegex.test(
                    cleanPhone
                )
            ) {

                Alert.alert(
                    t.error,
                    t.invalidPhone
                );

                return;

            }

        }


        const finalName =
            nameChanged
                ? cleanName
                : originalName;


        const finalPhone =
            phoneChanged
                ? cleanPhone
                : originalPhone;


        try {

            setSaving(true);


            console.log(
                "Saving admin profile:",
                {
                    adminId,
                    finalName,
                    finalPhone,
                    nameChanged,
                    phoneChanged,
                }
            );


            const result =
                await updateAdminProfile(
                    adminId,
                    finalName,
                    finalPhone
                );


            if (!result.success) {

                Alert.alert(
                    t.error,
                    result.message
                );

                return;

            }


            const updatedProfile = {
                ...result.profile,

                phone:
                    normalizeBangladeshPhone(
                        result.profile.phone
                    ),
            };


            setProfile(
                updatedProfile
            );


            setName(
                updatedProfile.adminName
            );


            setPhone(
                updatedProfile.phone
            );


            setAdminName(
                updatedProfile.adminName ||
                "Admin"
            );


            setAdminId(
                updatedProfile.adminId ||
                adminId
            );


            setEditingField(
                null
            );


            Alert.alert(
                "✓",
                t.profileUpdated
            );


        } catch (error) {

            console.error(
                "Save profile error:",
                error
            );


            Alert.alert(
                t.error,
                t.error
            );


        } finally {

            setSaving(false);

        }

    }


    /* ====================================================================== */
    /* OPEN DELETE ACCOUNT                                                    */
    /* ====================================================================== */

    function openDeleteAccount() {

        if (!profile) {
            return;
        }

        setDeletePassword("");
        setDeletePasswordVisible(false);
        setDeleteModalVisible(true);

    }


    /* ====================================================================== */
    /* CLOSE DELETE ACCOUNT                                                   */
    /* ====================================================================== */

    function closeDeleteAccount() {

        if (deleting) {
            return;
        }

        setDeletePassword("");
        setDeletePasswordVisible(false);
        setDeleteModalVisible(false);

    }


    /* ====================================================================== */
    /* DELETE ACCOUNT                                                         */
    /* ====================================================================== */

    async function handleDeleteAccount() {

        if (deleting) {
            return;
        }

        const cleanPassword =
            deletePassword;

        if (!cleanPassword) {

            Alert.alert(
                t.error,
                t.enterPassword
            );

            return;

        }

        if (!adminId) {

            Alert.alert(
                t.error,
                t.deleteFailed
            );

            return;

        }

        try {

            setDeleting(true);

            const result =
                await deleteAdminAccount(
                    adminId,
                    cleanPassword
                );

            if (!result.success) {

                /*
                 * Wrong password:
                 * account remains untouched.
                 */

                Alert.alert(
                    t.error,
                    result.message ||
                    t.wrongPassword
                );

                return;

            }

            /*
             * Close modal before navigation.
             */

            setDeleteModalVisible(false);
            setDeletePassword("");
            setDeletePasswordVisible(false);

            /*
             * Make sure local admin session
             * is cleared after successful deletion.
             */

            clearCurrentAdmin();

            /*
             * Redirect to Admin Login.
             */

            router.replace(
                "/admin/login"
            );

        } catch (error) {

            console.error(
                "Delete admin account error:",
                error
            );

            Alert.alert(
                t.error,
                t.deleteFailed
            );

        } finally {

            setDeleting(false);

        }

    }


    /* ====================================================================== */
    /* LOADING                                                                */
    /* ====================================================================== */

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


    /* ====================================================================== */
    /* RETURN                                                                 */
    /* ====================================================================== */

    return (

        <SafeAreaView
            style={
                styles.safeArea
            }
            edges={[
                "top",
                "left",
                "right",
            ]}
        >

            <View
                style={
                    styles.screen
                }
            >

                {/* ============================================================ */}
                {/* DASHBOARD STYLE HEADER                                       */}
                {/* ============================================================ */}

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


                {/* ============================================================ */}
                {/* CONTENT                                                      */}
                {/* ============================================================ */}

                <ScrollView
                    showsVerticalScrollIndicator={
                        false
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

                        {/* ==================================================== */}
                        {/* PROFILE ICON                                          */}
                        {/* ==================================================== */}

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
                                    size={38}
                                    color="#ffffff"
                                />

                            </View>

                        </View>


                        {/* ==================================================== */}
                        {/* PROFILE CARD                                          */}
                        {/* ==================================================== */}

                        <View
                            style={
                                styles.card
                            }
                        >

                            {/* ================================================== */}
                            {/* NAME                                                */}
                            {/* ================================================== */}

                            <View
                                style={
                                    styles.field
                                }
                            >

                                <View
                                    style={
                                        styles.fieldIcon
                                    }
                                >

                                    <Ionicons
                                        name="person-outline"
                                        size={21}
                                        color="#475569"
                                    />

                                </View>


                                <View
                                    style={
                                        styles.fieldContent
                                    }
                                >

                                    <Text
                                        style={
                                            styles.fieldLabel
                                        }
                                    >
                                        {t.name}
                                    </Text>


                                    {editingField === "name" ? (

                                        <TextInput
                                            value={
                                                name
                                            }
                                            onChangeText={
                                                setName
                                            }
                                            style={
                                                styles.input
                                            }
                                            placeholder={
                                                t.name
                                            }
                                            placeholderTextColor="#94a3b8"
                                            autoFocus
                                        />

                                    ) : (

                                        <Text
                                            style={
                                                styles.fieldValue
                                            }
                                        >
                                            {profile?.adminName}
                                        </Text>

                                    )}

                                </View>


                                {editingField === "name" ? (

                                    <View
                                        style={
                                            styles.inlineActions
                                        }
                                    >

                                        <Pressable
                                            onPress={
                                                cancelEditing
                                            }
                                            style={
                                                styles.inlineActionButton
                                            }
                                        >

                                            <Ionicons
                                                name="close"
                                                size={19}
                                                color="#64748b"
                                            />

                                        </Pressable>


                                        <Pressable
                                            onPress={
                                                saveProfile
                                            }
                                            disabled={
                                                saving
                                            }
                                            style={[
                                                styles.inlineActionButton,
                                                styles.saveIconButton,
                                                saving &&
                                                styles.disabledButton,
                                            ]}
                                        >

                                            {saving ? (

                                                <ActivityIndicator
                                                    size="small"
                                                    color="#ffffff"
                                                />

                                            ) : (

                                                <Ionicons
                                                    name="checkmark"
                                                    size={19}
                                                    color="#ffffff"
                                                />

                                            )}

                                        </Pressable>

                                    </View>

                                ) : (

                                    <Pressable
                                        onPress={
                                            startNameEditing
                                        }
                                        style={
                                            styles.inlineActionButton
                                        }
                                    >

                                        <Ionicons
                                            name="create-outline"
                                            size={20}
                                            color="#2563eb"
                                        />

                                    </Pressable>

                                )}

                            </View>


                            <View
                                style={
                                    styles.divider
                                }
                            />


                            {/* ================================================== */}
                            {/* PHONE                                               */}
                            {/* ================================================== */}

                            <View
                                style={
                                    styles.field
                                }
                            >

                                <View
                                    style={
                                        styles.fieldIcon
                                    }
                                >

                                    <Ionicons
                                        name="call-outline"
                                        size={21}
                                        color="#475569"
                                    />

                                </View>


                                <View
                                    style={
                                        styles.fieldContent
                                    }
                                >

                                    <Text
                                        style={
                                            styles.fieldLabel
                                        }
                                    >
                                        {t.phone}
                                    </Text>


                                    {editingField === "phone" ? (

                                        <TextInput
                                            value={
                                                phone
                                            }
                                            onChangeText={(
                                                value
                                            ) => {

                                                const digits =
                                                    value.replace(
                                                        /\D/g,
                                                        ""
                                                    );


                                                setPhone(
                                                    digits.slice(
                                                        0,
                                                        11
                                                    )
                                                );

                                            }}
                                            style={
                                                styles.input
                                            }
                                            placeholder="01XXXXXXXXX"
                                            placeholderTextColor="#94a3b8"
                                            keyboardType="phone-pad"
                                            maxLength={11}
                                        />

                                    ) : (

                                        <Text
                                            style={
                                                styles.fieldValue
                                            }
                                        >
                                            {profile?.phone}
                                        </Text>

                                    )}

                                </View>


                                {editingField === "phone" ? (

                                    <View
                                        style={
                                            styles.inlineActions
                                        }
                                    >

                                        <Pressable
                                            onPress={
                                                cancelEditing
                                            }
                                            style={
                                                styles.inlineActionButton
                                            }
                                        >

                                            <Ionicons
                                                name="close"
                                                size={19}
                                                color="#64748b"
                                            />

                                        </Pressable>


                                        <Pressable
                                            onPress={
                                                saveProfile
                                            }
                                            disabled={
                                                saving
                                            }
                                            style={[
                                                styles.inlineActionButton,
                                                styles.saveIconButton,
                                                saving &&
                                                styles.disabledButton,
                                            ]}
                                        >

                                            {saving ? (

                                                <ActivityIndicator
                                                    size="small"
                                                    color="#ffffff"
                                                />

                                            ) : (

                                                <Ionicons
                                                    name="checkmark"
                                                    size={19}
                                                    color="#ffffff"
                                                />

                                            )}

                                        </Pressable>

                                    </View>

                                ) : (

                                    <Pressable
                                        onPress={
                                            startPhoneEditing
                                        }
                                        style={
                                            styles.inlineActionButton
                                        }
                                    >

                                        <Ionicons
                                            name="create-outline"
                                            size={20}
                                            color="#2563eb"
                                        />

                                    </Pressable>

                                )}

                            </View>


                            <View
                                style={
                                    styles.divider
                                }
                            />


                            {/* ================================================== */}
                            {/* GMAIL                                               */}
                            {/* ================================================== */}

                            <Pressable
                                onPress={() => {

                                    if (
                                        profile &&
                                        !profile.emailVerified
                                    ) {

                                        router.push({
                                            pathname:
                                                "/admin/email-verification",

                                            params: {
                                                adminId:
                                                    profile.adminId,

                                                email:
                                                    profile.email,
                                            },
                                        });

                                    }

                                }}
                                disabled={
                                    profile?.emailVerified
                                }
                                style={
                                    styles.field
                                }
                            >

                                <View
                                    style={[
                                        styles.fieldIcon,
                                        styles.emailIcon,
                                    ]}
                                >

                                    <Ionicons
                                        name="mail-outline"
                                        size={21}
                                        color="#2563eb"
                                    />

                                </View>


                                <View
                                    style={
                                        styles.fieldContent
                                    }
                                >

                                    <View
                                        style={
                                            styles.emailLabelRow
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.fieldLabel
                                            }
                                        >
                                            {t.email}
                                        </Text>


                                        {profile?.emailVerified ? (

                                            <View
                                                style={
                                                    styles.verifiedBadge
                                                }
                                            >

                                                <Ionicons
                                                    name="checkmark-circle"
                                                    size={15}
                                                    color="#16a34a"
                                                />

                                                <Text
                                                    style={
                                                        styles.verifiedText
                                                    }
                                                >
                                                    {t.verified}
                                                </Text>

                                            </View>

                                        ) : (

                                            <View
                                                style={
                                                    styles.notVerifiedBadge
                                                }
                                            >

                                                <Text
                                                    style={
                                                        styles.notVerifiedText
                                                    }
                                                >
                                                    {t.notVerified}
                                                </Text>

                                            </View>

                                        )}

                                    </View>


                                    <Text
                                        style={
                                            styles.fieldValue
                                        }
                                    >
                                        {profile?.email}
                                    </Text>


                                    {!profile?.emailVerified && (

                                        <Text
                                            style={
                                                styles.verifyHint
                                            }
                                        >
                                            {t.verifyEmail}
                                        </Text>

                                    )}

                                </View>


                                {!profile?.emailVerified && (

                                    <Ionicons
                                        name="chevron-forward"
                                        size={20}
                                        color="#94a3b8"
                                    />

                                )}

                            </Pressable>

                        </View>


                        {/* ==================================================== */}
                        {/* DELETE ACCOUNT                                       */}
                        {/* ==================================================== */}

                        <View
                            style={
                                styles.deleteSection
                            }
                        >

                            <View
                                style={
                                    styles.deleteCard
                                }
                            >

                                <View
                                    style={
                                        styles.deleteIconContainer
                                    }
                                >

                                    <Ionicons
                                        name="trash-outline"
                                        size={22}
                                        color="#dc2626"
                                    />

                                </View>


                                <View
                                    style={
                                        styles.deleteContent
                                    }
                                >

                                    <Text
                                        style={
                                            styles.deleteTitle
                                        }
                                    >
                                        {t.deleteAccount}
                                    </Text>


                                    <Text
                                        style={
                                            styles.deleteDescription
                                        }
                                    >
                                        {t.deleteAccountDescription}
                                    </Text>

                                </View>


                                <Pressable
                                    onPress={
                                        openDeleteAccount
                                    }
                                    style={({ pressed }) => [

                                        styles.deleteButton,

                                        pressed &&
                                        styles.deleteButtonPressed,

                                    ]}
                                >

                                    <Ionicons
                                        name="trash-outline"
                                        size={18}
                                        color="#ffffff"
                                    />

                                </Pressable>

                            </View>

                        </View>


                        <View
                            style={
                                styles.bottomSpacing
                            }
                        />

                    </View>

                </ScrollView>


                {/* ============================================================ */}
                {/* DELETE ACCOUNT MODAL                                         */}
                {/* ============================================================ */}

                <Modal
                    visible={
                        deleteModalVisible
                    }
                    transparent
                    animationType="fade"
                    statusBarTranslucent
                    onRequestClose={
                        closeDeleteAccount
                    }
                >

                    <KeyboardAvoidingView
                        style={
                            styles.modalOverlay
                        }
                        behavior={
                            Platform.OS === "ios"
                                ? "padding"
                                : undefined
                        }
                    >

                        <Pressable
                            style={
                                styles.modalBackground
                            }
                            onPress={
                                closeDeleteAccount
                            }
                        />

                        <View
                            style={
                                styles.deleteModal
                            }
                        >

                            {/* ================================================== */}
                            {/* MODAL HEADER                                        */}
                            {/* ================================================== */}

                            <View
                                style={
                                    styles.deleteModalIcon
                                }
                            >

                                <Ionicons
                                    name="warning-outline"
                                    size={30}
                                    color="#dc2626"
                                />

                            </View>


                            <Text
                                style={
                                    styles.deleteModalTitle
                                }
                            >
                                {t.confirmDelete}
                            </Text>


                            <Text
                                style={
                                    styles.deleteModalDescription
                                }
                            >
                                {t.confirmDeleteText}
                            </Text>


                            {/* ================================================== */}
                            {/* PASSWORD INPUT                                      */}
                            {/* ================================================== */}

                            <View
                                style={
                                    styles.passwordContainer
                                }
                            >

                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color="#64748b"
                                />


                                <TextInput
                                    value={
                                        deletePassword
                                    }
                                    onChangeText={
                                        setDeletePassword
                                    }
                                    style={
                                        styles.passwordInput
                                    }
                                    placeholder={
                                        t.passwordPlaceholder
                                    }
                                    placeholderTextColor="#94a3b8"
                                    secureTextEntry={
                                        !deletePasswordVisible
                                    }
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={
                                        !deleting
                                    }
                                />


                                <Pressable
                                    onPress={() =>
                                        setDeletePasswordVisible(
                                            (value) =>
                                                !value
                                        )
                                    }
                                    disabled={
                                        deleting
                                    }
                                    style={
                                        styles.passwordVisibilityButton
                                    }
                                >

                                    <Ionicons
                                        name={
                                            deletePasswordVisible
                                                ? "eye-off-outline"
                                                : "eye-outline"
                                        }
                                        size={20}
                                        color="#64748b"
                                    />

                                </Pressable>

                            </View>


                            {/* ================================================== */}
                            {/* MODAL ACTIONS                                      */}
                            {/* ================================================== */}

                            <View
                                style={
                                    styles.deleteModalActions
                                }
                            >

                                <Pressable
                                    onPress={
                                        closeDeleteAccount
                                    }
                                    disabled={
                                        deleting
                                    }
                                    style={({ pressed }) => [

                                        styles.modalCancelButton,

                                        pressed &&
                                        styles.modalButtonPressed,

                                    ]}
                                >

                                    <Text
                                        style={
                                            styles.modalCancelText
                                        }
                                    >
                                        {t.cancel}
                                    </Text>

                                </Pressable>


                                <Pressable
                                    onPress={
                                        handleDeleteAccount
                                    }
                                    disabled={
                                        deleting
                                    }
                                    style={({ pressed }) => [

                                        styles.modalDeleteButton,

                                        deleting &&
                                        styles.disabledDeleteButton,

                                        pressed &&
                                        !deleting &&
                                        styles.modalButtonPressed,

                                    ]}
                                >

                                    {deleting ? (

                                        <ActivityIndicator
                                            size="small"
                                            color="#ffffff"
                                        />

                                    ) : (

                                        <Ionicons
                                            name="trash-outline"
                                            size={18}
                                            color="#ffffff"
                                        />

                                    )}


                                    <Text
                                        style={
                                            styles.modalDeleteText
                                        }
                                    >
                                        {deleting
                                            ? t.deleting
                                            : t.delete}
                                    </Text>

                                </Pressable>

                            </View>

                        </View>

                    </KeyboardAvoidingView>

                </Modal>


                {/* ============================================================ */}
                {/* SIDE MENU                                                    */}
                {/* ============================================================ */}

                {menuMounted && (

                    <View
                        style={
                            styles.menuOverlay
                        }
                    >

                        {/* ====================================================== */}
                        {/* DARK OVERLAY                                             */}
                        {/* ====================================================== */}

                        <Animated.View
                            pointerEvents="auto"
                            style={[
                                styles.overlayContainer,
                                {
                                    opacity:
                                        overlayOpacity,
                                },
                            ]}
                        >

                            <Pressable
                                style={
                                    styles.overlayBackground
                                }
                                onPress={() =>
                                    closeMenu()
                                }
                            />

                        </Animated.View>


                        {/* ====================================================== */}
                        {/* DRAWER                                                   */}
                        {/* ====================================================== */}

                        <Animated.View
                            style={[
                                styles.drawerAnimated,
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
                                    styles.drawer
                                }
                                edges={[
                                    "bottom",
                                ]}
                            >

                                {/* ================================================== */}
                                {/* DRAWER HEADER                                       */}
                                {/* ================================================== */}

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
                                        onPress={() => closeMenu()}
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


                                {/* ================================================== */}
                                {/* MENU                                                */}
                                {/* ================================================== */}

                                <ScrollView
                                    showsVerticalScrollIndicator={
                                        false
                                    }
                                    contentContainerStyle={
                                        styles.menuScroll
                                    }
                                >

                                    {/* DASHBOARD */}

                                    <MenuItem
                                        icon="grid-outline"
                                        label={
                                            t.dashboard
                                        }
                                        onPress={() =>
                                            handleMenuPress(
                                                "/admin/dashboard"
                                            )
                                        }
                                    />


                                    {/* PROFILE — ACTIVE */}

                                    <MenuItem
                                        icon="person-outline"
                                        label={
                                            t.profile
                                        }
                                        active
                                        onPress={() => closeMenu()}
                                    />


                                    {/* CHANGE EMAIL */}

                                    <MenuItem
                                        icon="mail-outline"
                                        label={
                                            t.changeEmail
                                        }
                                        onPress={() =>
                                            handleMenuPress(
                                                "/admin/change-email"
                                            )
                                        }
                                    />


                                    {/* CHANGE PASSWORD */}

                                    <MenuItem
                                        icon="lock-closed-outline"
                                        label={
                                            t.changePassword
                                        }
                                        onPress={() =>
                                            handleMenuPress(
                                                "/admin/change-password"
                                            )
                                        }
                                    />


                                    <MenuDivider />


                                    {/* WEEKLY REQUEST */}

                                    <MenuItem
                                        icon="notifications-outline"
                                        label={
                                            t.weeklyRequest
                                        }
                                        onPress={() =>
                                            handleMenuPress(
                                                "/admin/weekly-request"
                                            )
                                        }
                                    />


                                    {/* WEEKLY DEPOSIT */}

                                    <MenuItem
                                        icon="cash-outline"
                                        label={
                                            t.weeklyDeposit
                                        }
                                        onPress={() =>
                                            handleMenuPress(
                                                "/admin/weekly-deposit"
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
                                                "/admin/weekly-deposit-history"
                                            )
                                        }
                                    />


                                    <MenuDivider />


                                    {/* CREATE ADMIN */}

                                    <MenuItem
                                        icon="person-add-outline"
                                        label={
                                            t.createAdmin
                                        }
                                        onPress={() =>
                                            handleMenuPress(
                                                "/admin/create-admin"
                                            )
                                        }
                                    />


                                    {/* CREATE MEMBER */}

                                    <MenuItem
                                        icon="people-outline"
                                        label={
                                            t.createMember
                                        }
                                        onPress={() =>
                                            handleMenuPress(
                                                "/admin/create-member"
                                            )
                                        }
                                    />


                                    {/* ACCESS MEMBER */}

                                    <MenuItem
                                        icon="log-in-outline"
                                        label={
                                            t.accessMember
                                        }
                                        onPress={() =>
                                            handleMenuPress(
                                                "/admin/access-member"
                                            )
                                        }
                                    />


                                    <MenuDivider />


                                    {/* LANGUAGE */}

                                    <LanguageMenu
                                        language={
                                            language
                                        }
                                        t={t}
                                        onChangeLanguage={
                                            changeLanguage
                                        }
                                    />


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

            </View>

        </SafeAreaView>

    );

}


/* ==========================================================================
   MENU ITEM
   ========================================================================== */

type MenuItemProps = {

    icon: React.ComponentProps<
        typeof Ionicons
    >["name"];

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


    const animatePressIn = () => {

        if (active) {
            return;
        }


        Animated.timing(
            pressAnimation,
            {
                toValue: 1,
                duration: 130,
                easing:
                    Easing.out(
                        Easing.quad
                    ),
                useNativeDriver: false,
            }
        ).start();

    };


    const animatePressOut = () => {

        if (active) {
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
                "transparent",
                "#0f172a",
            ],

        });


    const textColor =
        pressAnimation.interpolate({

            inputRange: [
                0,
                1,
            ],

            outputRange: [
                "#475569",
                "#ffffff",
            ],

        });


    return (

        <Pressable

            onPress={
                onPress
            }

            onPressIn={
                animatePressIn
            }

            onPressOut={
                animatePressOut
            }

            style={
                styles.menuItemPressable
            }

        >

            <Animated.View
                style={[
                    styles.menuItem,
                    {
                        backgroundColor:
                            active
                                ? "#0f172a"
                                : backgroundColor,
                    },
                ]}
            >

                <Animated.View>

                    <Ionicons
                        name={
                            icon
                        }
                        size={20}
                        color={
                            active
                                ? "#ffffff"
                                : "#475569"
                        }
                    />


                    {!active && (

                        <Animated.View
                            style={{
                                position:
                                    "absolute",
                                opacity:
                                    pressAnimation,
                            }}
                        >

                            <Ionicons
                                name={
                                    icon
                                }
                                size={20}
                                color="#ffffff"
                            />

                        </Animated.View>

                    )}

                </Animated.View>


                <Animated.Text
                    style={[
                        styles.menuItemText,
                        {
                            color:
                                active
                                    ? "#ffffff"
                                    : textColor,
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
   LANGUAGE MENU
   ========================================================================== */

type LanguageMenuProps = {

    language: AdminLanguage;

    t: typeof translations.bn;

    onChangeLanguage: (
        language: AdminLanguage
    ) => void;

};


function LanguageMenu({
    language,
    t,
    onChangeLanguage,
}: LanguageMenuProps) {

    return (

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
                        onChangeLanguage(
                            "bn"
                        )
                    }
                    style={
                        language === "bn"
                            ? styles.languageOptionActive
                            : styles.languageOption
                    }
                >

                    <Text
                        style={
                            language === "bn"
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
                        onChangeLanguage(
                            "en"
                        )
                    }
                    style={
                        language === "en"
                            ? styles.languageOptionActive
                            : styles.languageOption
                    }
                >

                    <Text
                        style={
                            language === "en"
                                ? styles.languageOptionActiveText
                                : styles.languageOptionText
                        }
                    >
                        EN
                    </Text>

                </Pressable>

            </View>

        </View>

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

const styles =
    StyleSheet.create({

        safeArea: {
            flex: 1,
            backgroundColor:
                "#f6f8fb",
        },

        screen: {
            flex: 1,
            backgroundColor:
                "#f6f8fb",
        },


        /* ---------------------------------------------------------------------- */
        /* LOADING                                                                */
        /* ---------------------------------------------------------------------- */

        loadingContainer: {
            flex: 1,
            alignItems:
                "center",
            justifyContent:
                "center",
        },

        loadingText: {
            marginTop: 12,
            fontSize: 12,
            color:
                "#64748b",
        },


        /* ---------------------------------------------------------------------- */
        /* HEADER                                                                 */
        /* ---------------------------------------------------------------------- */

        header: {
            minHeight: 76,
            paddingHorizontal: 18,
            paddingVertical: 12,
            backgroundColor:
                "#ffffff",
            borderBottomWidth: 1,
            borderBottomColor:
                "#e2e8f0",
            flexDirection:
                "row",
            alignItems:
                "center",
            justifyContent:
                "space-between",
        },

        headerLeft: {
            flexDirection:
                "row",
            alignItems:
                "center",
            flex: 1,
        },

        menuButton: {
            width: 42,
            height: 42,
            borderRadius: 11,
            backgroundColor:
                "#f1f5f9",
            alignItems:
                "center",
            justifyContent:
                "center",
            marginRight: 11,
        },

        menuButtonPressed: {
            opacity: 0.65,
        },

        appName: {
            fontSize: 16,
            fontWeight:
                "800",
            color:
                "#0f172a",
        },

        appSubtitle: {
            marginTop: 2,
            fontSize: 9,
            fontWeight: "600",
            color: "#64748b",
        },

        adminInfo: {
            maxWidth: 145,
            alignItems:
                "flex-end",
        },

        adminName: {
            fontSize: 13,
            fontWeight:
                "800",
            color:
                "#0f172a",
        },

        adminId: {
            marginTop: 2,
            fontSize: 10,
            color:
                "#64748b",
        },


        /* ---------------------------------------------------------------------- */
        /* CONTENT                                                                */
        /* ---------------------------------------------------------------------- */

        scrollContent: {
            flexGrow: 1,
            paddingBottom: 30,
        },

        container: {
            width: "100%",
            maxWidth: 600,
            alignSelf:
                "center",
            paddingHorizontal: 18,
            paddingTop: 25,
        },


        /* ---------------------------------------------------------------------- */
        /* PROFILE ICON                                                           */
        /* ---------------------------------------------------------------------- */

        profileIconContainer: {
            alignItems:
                "center",
            marginBottom: 22,
        },

        profileIcon: {
            width: 82,
            height: 82,
            borderRadius: 41,
            backgroundColor:
                "#0f172a",
            alignItems:
                "center",
            justifyContent:
                "center",
        },


        /* ---------------------------------------------------------------------- */
        /* PROFILE CARD                                                           */
        /* ---------------------------------------------------------------------- */

        card: {
            backgroundColor:
                "#ffffff",
            borderRadius: 18,
            borderWidth: 1,
            borderColor:
                "#e2e8f0",
            paddingHorizontal: 17,
        },

        field: {
            minHeight: 82,
            flexDirection:
                "row",
            alignItems:
                "center",
            paddingVertical: 12,
        },

        fieldIcon: {
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor:
                "#f1f5f9",
            alignItems:
                "center",
            justifyContent:
                "center",
            marginRight: 12,
        },

        emailIcon: {
            backgroundColor:
                "#eff6ff",
        },

        fieldContent: {
            flex: 1,
        },

        fieldLabel: {
            fontSize: 10,
            fontWeight:
                "700",
            color:
                "#64748b",
        },

        fieldValue: {
            marginTop: 4,
            fontSize: 14,
            fontWeight:
                "800",
            color:
                "#0f172a",
        },

        input: {
            marginTop: 3,
            paddingVertical: 3,
            paddingHorizontal: 0,
            fontSize: 14,
            fontWeight:
                "700",
            color:
                "#0f172a",
            borderBottomWidth: 1,
            borderBottomColor:
                "#cbd5e1",
        },

        divider: {
            height: 1,
            backgroundColor:
                "#e2e8f0",
        },


        /* ---------------------------------------------------------------------- */
        /* INLINE EDIT ACTION                                                     */
        /* ---------------------------------------------------------------------- */

        inlineActions: {
            flexDirection:
                "row",
            alignItems:
                "center",
            gap: 6,
        },

        inlineActionButton: {
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor:
                "#f1f5f9",
            alignItems:
                "center",
            justifyContent:
                "center",
        },

        saveIconButton: {
            backgroundColor:
                "#0f172a",
        },

        disabledButton: {
            opacity:
                0.55,
        },


        /* ---------------------------------------------------------------------- */
        /* EMAIL                                                                  */
        /* ---------------------------------------------------------------------- */

        emailLabelRow: {
            flexDirection:
                "row",
            alignItems:
                "center",
        },

        verifiedBadge: {
            marginLeft: 8,
            paddingHorizontal: 7,
            paddingVertical: 3,
            borderRadius: 7,
            backgroundColor:
                "#f0fdf4",
            flexDirection:
                "row",
            alignItems:
                "center",
        },

        verifiedText: {
            marginLeft: 3,
            fontSize: 8,
            fontWeight:
                "800",
            color:
                "#16a34a",
        },

        notVerifiedBadge: {
            marginLeft: 8,
            paddingHorizontal: 7,
            paddingVertical: 3,
            borderRadius: 7,
            backgroundColor:
                "#fff7ed",
        },

        notVerifiedText: {
            fontSize: 8,
            fontWeight:
                "800",
            color:
                "#ea580c",
        },

        verifyHint: {
            marginTop: 4,
            fontSize: 9,
            fontWeight:
                "700",
            color:
                "#2563eb",
        },


        /* ---------------------------------------------------------------------- */
        /* DELETE ACCOUNT                                                         */
        /* ---------------------------------------------------------------------- */

        deleteSection: {
            marginTop: 18,
        },

        deleteCard: {
            backgroundColor:
                "#ffffff",
            borderRadius: 18,
            borderWidth: 1,
            borderColor:
                "#fecaca",
            padding: 15,
            flexDirection:
                "row",
            alignItems:
                "center",
        },

        deleteIconContainer: {
            width: 43,
            height: 43,
            borderRadius: 12,
            backgroundColor:
                "#fef2f2",
            alignItems:
                "center",
            justifyContent:
                "center",
        },

        deleteContent: {
            flex: 1,
            marginLeft: 12,
            marginRight: 10,
        },

        deleteTitle: {
            fontSize: 13,
            fontWeight:
                "800",
            color:
                "#b91c1c",
        },

        deleteDescription: {
            marginTop: 4,
            fontSize: 9,
            lineHeight: 14,
            fontWeight:
                "600",
            color:
                "#64748b",
        },

        deleteButton: {
            width: 42,
            height: 42,
            borderRadius: 11,
            backgroundColor:
                "#dc2626",
            alignItems:
                "center",
            justifyContent:
                "center",
        },

        deleteButtonPressed: {
            opacity:
                0.65,
        },


        /* ---------------------------------------------------------------------- */
        /* DELETE MODAL                                                           */
        /* ---------------------------------------------------------------------- */

        modalOverlay: {
            flex: 1,
            alignItems:
                "center",
            justifyContent:
                "center",
            paddingHorizontal: 18,
        },

        modalBackground: {
            position:
                "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor:
                "rgba(15, 23, 42, 0.58)",
        },

        deleteModal: {
            width: "100%",
            maxWidth: 480,
            backgroundColor:
                "#ffffff",
            borderRadius: 20,
            padding: 20,
            shadowColor:
                "#000000",
            shadowOpacity:
                0.2,
            shadowRadius:
                20,
            shadowOffset: {
                width: 0,
                height: 8,
            },
            elevation: 15,
        },

        deleteModalIcon: {
            width: 58,
            height: 58,
            borderRadius: 29,
            backgroundColor:
                "#fef2f2",
            alignSelf:
                "center",
            alignItems:
                "center",
            justifyContent:
                "center",
            marginBottom: 13,
        },

        deleteModalTitle: {
            textAlign:
                "center",
            fontSize: 17,
            fontWeight:
                "800",
            color:
                "#0f172a",
        },

        deleteModalDescription: {
            marginTop: 8,
            textAlign:
                "center",
            fontSize: 11,
            lineHeight: 17,
            fontWeight:
                "600",
            color:
                "#64748b",
        },

        passwordContainer: {
            minHeight: 50,
            marginTop: 18,
            borderWidth: 1,
            borderColor:
                "#cbd5e1",
            borderRadius: 12,
            paddingHorizontal: 13,
            flexDirection:
                "row",
            alignItems:
                "center",
            backgroundColor:
                "#f8fafc",
        },

        passwordInput: {
            flex: 1,
            marginLeft: 9,
            paddingVertical: 10,
            fontSize: 13,
            fontWeight:
                "700",
            color:
                "#0f172a",
        },

        passwordVisibilityButton: {
            width: 34,
            height: 40,
            alignItems:
                "center",
            justifyContent:
                "center",
        },

        deleteModalActions: {
            marginTop: 18,
            flexDirection:
                "row",
            alignItems:
                "center",
            gap: 9,
        },

        modalCancelButton: {
            flex: 1,
            minHeight: 46,
            borderRadius: 11,
            backgroundColor:
                "#f1f5f9",
            alignItems:
                "center",
            justifyContent:
                "center",
        },

        modalCancelText: {
            fontSize: 11,
            fontWeight:
                "800",
            color:
                "#475569",
        },

        modalDeleteButton: {
            flex: 1.25,
            minHeight: 46,
            borderRadius: 11,
            backgroundColor:
                "#dc2626",
            flexDirection:
                "row",
            alignItems:
                "center",
            justifyContent:
                "center",
            gap: 7,
            paddingHorizontal: 8,
        },

        modalDeleteText: {
            fontSize: 10,
            fontWeight:
                "800",
            color:
                "#ffffff",
        },

        disabledDeleteButton: {
            opacity:
                0.6,
        },

        modalButtonPressed: {
            opacity:
                0.7,
        },


        /* ---------------------------------------------------------------------- */
        /* BOTTOM SPACING                                                         */
        /* ---------------------------------------------------------------------- */

        bottomSpacing: {
            height: 30,
        },


        /* ====================================================================== */
        /* SIDE MENU                                                              */
        /* ====================================================================== */

        menuOverlay: {
            position:
                "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            elevation: 1000,
        },

        overlayContainer: {
            position:
                "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
        },

        overlayBackground: {
            flex: 1,
            backgroundColor:
                "rgba(15, 23, 42, 0.42)",
        },

        drawerAnimated: {
            position:
                "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: 315,
            maxWidth: "86%",
            zIndex: 1001,
            elevation: 1001,
        },

        drawer: {
            flex: 1,
            backgroundColor:
                "#ffffff",
            shadowColor:
                "#000000",
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

        drawerHeader: {
            height: 76,
            paddingHorizontal: 17,
            borderBottomWidth: 1,
            borderBottomColor:
                "#e2e8f0",
            flexDirection:
                "row",
            alignItems:
                "center",
            justifyContent:
                "space-between",
        },

        drawerBrand: {
            flexDirection:
                "row",
            alignItems:
                "center",
        },

        drawerLogo: {
            width: 43,
            height: 43,
            borderRadius: 12,
            backgroundColor:
                "#0f172a",
            alignItems:
                "center",
            justifyContent:
                "center",
            marginRight: 10,
        },

        drawerLogoText: {
            color:
                "#ffffff",
            fontSize: 21,
            fontWeight:
                "800",
        },

        drawerAppName: {
            fontSize: 14,
            fontWeight:
                "800",
            color:
                "#0f172a",
        },

        drawerSubtitle: {
            marginTop: 2,
            fontSize: 10,
            color:
                "#64748b",
        },

        closeButton: {
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor:
                "#f1f5f9",
            alignItems:
                "center",
            justifyContent:
                "center",
        },

        closeButtonPressed: {
            opacity:
                0.6,
        },

        menuScroll: {
            paddingHorizontal: 11,
            paddingTop: 10,
            paddingBottom: 20,
        },

        menuItemPressable: {
            borderRadius: 10,
            marginBottom: 3,
        },

        menuItem: {
            minHeight: 46,
            borderRadius: 10,
            paddingHorizontal: 12,
            flexDirection:
                "row",
            alignItems:
                "center",
        },

        menuItemText: {
            marginLeft: 12,
            fontSize: 12,
            fontWeight:
                "700",
            flex: 1,
        },

        menuDivider: {
            height: 1,
            backgroundColor:
                "#e2e8f0",
            marginVertical: 10,
            marginHorizontal: 7,
        },


        /* ---------------------------------------------------------------------- */
        /* LANGUAGE                                                               */
        /* ---------------------------------------------------------------------- */

        languageMenu: {
            minHeight: 55,
            paddingHorizontal: 12,
            flexDirection:
                "row",
            alignItems:
                "center",
            justifyContent:
                "space-between",
        },

        menuItemLeft: {
            flexDirection:
                "row",
            alignItems:
                "center",
            flex: 1,
        },

        languageOptions: {
            flexDirection:
                "row",
            padding: 3,
            borderRadius: 9,
            backgroundColor:
                "#f1f5f9",
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
            backgroundColor:
                "#0f172a",
        },

        languageOptionText: {
            fontSize: 9,
            fontWeight:
                "800",
            color:
                "#64748b",
        },

        languageOptionActiveText: {
            fontSize: 9,
            fontWeight:
                "800",
            color:
                "#ffffff",
        },


        /* ---------------------------------------------------------------------- */
        /* LOGOUT                                                                 */
        /* ---------------------------------------------------------------------- */

        logoutButton: {
            minHeight: 46,
            borderRadius: 10,
            paddingHorizontal: 12,
            flexDirection:
                "row",
            alignItems:
                "center",
            backgroundColor:
                "#fef2f2",
        },

        logoutButtonPressed: {
            opacity:
                0.65,
        },

        logoutText: {
            marginLeft: 12,
            fontSize: 12,
            fontWeight:
                "800",
            color:
                "#dc2626",
        },

    });