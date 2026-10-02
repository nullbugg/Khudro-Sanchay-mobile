import React, {
    useEffect,
    useState,
} from "react";

import {
    ActivityIndicator,
    Alert,
    Pressable,
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
    useLocalSearchParams,
} from "expo-router";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
    sendAdminEmailVerificationOTP,
    verifyAdminEmailOTP,
    sendAdminEmailChangeOTP,
    verifyAdminEmailChangeOTP,
} from "../../lib/admin-api";

import {
    getAdminLanguage,
    AdminLanguage,
} from "../../lib/admin-language";


/* ========================================================================== */
/* TYPES                                                                      */
/* ========================================================================== */

type Params = {
    adminId?: string;
    email?: string;

    /*
     * Change Email flow
     */
    mode?: string;
    authorizationToken?: string;
    newEmail?: string;

    language?: string;
};


/* ========================================================================== */
/* COMPONENT                                                                  */
/* ========================================================================== */

export default function AdminEmailVerificationScreen() {

    const params =
        useLocalSearchParams<Params>();


    /* ---------------------------------------------------------------------- */
    /* PARAMS                                                                 */
    /* ---------------------------------------------------------------------- */

    const adminId =
        String(
            params.adminId ?? ""
        );


    /*
     * Change Email mode
     *
     * change-email.tsx থেকে:
     *
     * mode=change-email
     * authorizationToken=...
     * newEmail=...
     */
    const isChangeEmail =
        String(
            params.mode ?? ""
        ) === "change-email";


    const authorizationToken =
        String(
            params.authorizationToken ?? ""
        );


    /*
     * Existing verification:
     * email
     *
     * Change Email:
     * newEmail
     */
    const email =
        isChangeEmail
            ? String(
                params.newEmail ?? ""
            )
            : String(
                params.email ?? ""
            );


    /* ---------------------------------------------------------------------- */
    /* LANGUAGE                                                               */
    /* ---------------------------------------------------------------------- */

    const [
        language,
        setLanguage,
    ] = useState<AdminLanguage>("bn");


    /* ---------------------------------------------------------------------- */
    /* STATE                                                                  */
    /* ---------------------------------------------------------------------- */

    const [
        otp,
        setOtp,
    ] = useState("");


    const [
        sending,
        setSending,
    ] = useState(false);


    const [
        verifying,
        setVerifying,
    ] = useState(false);


    const [
        resendCooldown,
        setResendCooldown,
    ] = useState(0);


    /* ====================================================================== */
    /* LOAD LANGUAGE                                                          */
    /* ====================================================================== */

    useEffect(() => {

        const loadLanguage =
            async () => {

                try {

                    /*
                     * Change Email flow থেকে language পাঠানো হলে
                     * সেটি আগে ব্যবহার করা হবে।
                     */
                    if (
                        params.language === "en" ||
                        params.language === "bn"
                    ) {

                        setLanguage(
                            params.language
                        );

                        return;

                    }


                    const savedLanguage =
                        await getAdminLanguage();

                    setLanguage(
                        savedLanguage
                    );

                } catch (error) {

                    console.error(
                        "Language load error:",
                        error
                    );

                }

            };


        loadLanguage();

    }, []);


    /* ====================================================================== */
    /* AUTO SEND OTP                                                          */
    /* ====================================================================== */

    useEffect(() => {

        /*
         * Change Email flow-এ OTP ইতিমধ্যেই
         * change-email.tsx থেকে পাঠানো হয়েছে।
         *
         * তাই এখানে আবার OTP পাঠানো যাবে না।
         *
         * শুধু existing Gmail verification-এর ক্ষেত্রে
         * page open হলে automatically OTP পাঠানো হবে।
         */
        if (
            !isChangeEmail &&
            adminId &&
            email
        ) {

            sendOTP();

        }

    }, [adminId, email, isChangeEmail]);




    /* ====================================================================== */
    /* RESEND TIMER                                                           */
    /* ====================================================================== */

    useEffect(() => {

        if (
            resendCooldown <= 0
        ) {

            return;

        }


        const timer =
            setInterval(() => {

                setResendCooldown(
                    previous =>
                        previous > 0
                            ? previous - 1
                            : 0
                );

            }, 1000);


        return () => {

            clearInterval(timer);

        };

    }, [resendCooldown]);


    /* ====================================================================== */
    /* SEND OTP                                                               */
    /* ====================================================================== */

    async function sendOTP() {

        if (
            !adminId ||
            !email
        ) {

            Alert.alert(
                language === "bn"
                    ? "ত্রুটি"
                    : "Error",

                language === "bn"
                    ? "Admin ID অথবা Gmail পাওয়া যায়নি।"
                    : "Admin ID or Gmail was not found."
            );

            return;

        }


        /*
         * Change Email flow
         */
        if (isChangeEmail) {

            if (
                !authorizationToken
            ) {

                Alert.alert(
                    language === "bn"
                        ? "ত্রুটি"
                        : "Error",

                    language === "bn"
                        ? "Authorization token পাওয়া যায়নি। আবার চেষ্টা করুন।"
                        : "Authorization token was not found. Please try again."
                );

                return;

            }

        }


        try {

            setSending(true);


            let result;


            /* ------------------------------------------------------------------ */
            /* CHANGE EMAIL                                                       */
            /* ------------------------------------------------------------------ */

            if (isChangeEmail) {

                result =
                    await sendAdminEmailChangeOTP(
                        adminId,
                        authorizationToken,
                        email
                    );

            }


            /* ------------------------------------------------------------------ */
            /* EXISTING EMAIL VERIFICATION                                        */
            /* ------------------------------------------------------------------ */

            else {

                result =
                    await sendAdminEmailVerificationOTP(
                        adminId
                    );

            }


            if (!result.success) {

                Alert.alert(
                    language === "bn"
                        ? "ত্রুটি"
                        : "Error",

                    result.message ||
                    (
                        language === "bn"
                            ? "OTP পাঠানো যায়নি।"
                            : "OTP could not be sent."
                    )
                );

                return;

            }


            /*
             * Backend resendAfter দিলে সেটি ব্যবহার করব।
             *
             * না থাকলে default 60 sec.
             */
            setResendCooldown(
                result.resendAfter ??
                60
            );


            /*
             * Auto-send এর সময় বারবার Alert দেখানো ভালো নয়।
             *
             * তাই এখানে শুধু manual resend হলে
             * success message দেখানো হবে।
             */

        } catch (error) {

            console.error(
                "Send OTP error:",
                error
            );


            Alert.alert(
                language === "bn"
                    ? "ত্রুটি"
                    : "Error",

                language === "bn"
                    ? "OTP পাঠানো যায়নি।"
                    : "OTP could not be sent."
            );

        } finally {

            setSending(false);

        }

    }


    /* ====================================================================== */
    /* VERIFY OTP                                                             */
    /* ====================================================================== */

    async function verifyOTP() {

        const cleanOTP =
            otp
                .replace(/\D/g, "")
                .slice(0, 6);


        if (
            cleanOTP.length !== 6
        ) {

            Alert.alert(
                language === "bn"
                    ? "ত্রুটি"
                    : "Error",

                language === "bn"
                    ? "৬ সংখ্যার OTP দিন।"
                    : "Please enter the 6-digit OTP."
            );

            return;

        }


        if (!adminId) {

            Alert.alert(
                language === "bn"
                    ? "ত্রুটি"
                    : "Error",

                language === "bn"
                    ? "Admin ID পাওয়া যায়নি।"
                    : "Admin ID was not found."
            );

            return;

        }


        try {

            setVerifying(true);


            let result;


            /* ------------------------------------------------------------------ */
            /* CHANGE EMAIL                                                       */
            /* ------------------------------------------------------------------ */

            if (isChangeEmail) {

                if (
                    !authorizationToken
                ) {

                    Alert.alert(
                        language === "bn"
                            ? "ত্রুটি"
                            : "Error",

                        language === "bn"
                            ? "Authorization token পাওয়া যায়নি।"
                            : "Authorization token was not found."
                    );

                    return;

                }


                result =
                    await verifyAdminEmailChangeOTP(
                        adminId,
                        authorizationToken,
                        cleanOTP
                    );

            }


            /* ------------------------------------------------------------------ */
            /* EXISTING EMAIL VERIFICATION                                        */
            /* ------------------------------------------------------------------ */

            else {

                result =
                    await verifyAdminEmailOTP(
                        adminId,
                        cleanOTP
                    );

            }


            console.log(
                "Verify OTP result:",
                result
            );


            if (!result.success) {

                Alert.alert(
                    language === "bn"
                        ? "ত্রুটি"
                        : "Error",

                    result.message ||
                    (
                        language === "bn"
                            ? "OTP সঠিক নয়।"
                            : "Invalid OTP."
                    )
                );

                return;

            }


            /* ------------------------------------------------------------------ */
            /* SUCCESS                                                             */
            /* ------------------------------------------------------------------ */

            Alert.alert(

                language === "bn"
                    ? "সফল"
                    : "Success",

                isChangeEmail

                    ? (
                        language === "bn"
                            ? "আপনার নতুন Gmail সফলভাবে পরিবর্তন ও ভেরিফাই হয়েছে।"
                            : "Your new Gmail has been successfully changed and verified."
                    )

                    : (
                        language === "bn"
                            ? "আপনার Gmail সফলভাবে ভেরিফাই হয়েছে।"
                            : "Your Gmail has been successfully verified."
                    ),

                [
                    {
                        text:
                            language === "bn"
                                ? "ঠিক আছে"
                                : "OK",

                        onPress: () => {

                            router.replace({
                                pathname:
                                    "/admin/profile",

                                params: {
                                    refresh:
                                        Date.now().toString(),
                                },

                            });

                        },
                    },
                ]

            );


        } catch (error) {

            console.error(
                "Verify OTP error:",
                error
            );


            Alert.alert(
                language === "bn"
                    ? "ত্রুটি"
                    : "Error",

                language === "bn"
                    ? "OTP verification করা যায়নি।"
                    : "OTP verification failed."
            );

        } finally {

            setVerifying(false);

        }

    }


    /* ====================================================================== */
    /* TITLE / TEXT                                                           */
    /* ====================================================================== */

    const headerTitle =
        isChangeEmail

            ? (
                language === "bn"
                    ? "নতুন Gmail যাচাই"
                    : "Verify New Gmail"
            )

            : (
                language === "bn"
                    ? "Gmail Verification"
                    : "Gmail Verification"
            );


    const headerSubtitle =
        isChangeEmail

            ? (
                language === "bn"
                    ? "নতুন Gmail-এর OTP দিয়ে যাচাই করুন"
                    : "Verify your new Gmail using OTP"
            )

            : (
                language === "bn"
                    ? "OTP দিয়ে Gmail ভেরিফাই করুন"
                    : "Verify Gmail using OTP"
            );


    const mainTitle =
        isChangeEmail

            ? (
                language === "bn"
                    ? "নতুন Gmail Verify করুন"
                    : "Verify New Gmail"
            )

            : (
                language === "bn"
                    ? "Gmail Verify করুন"
                    : "Verify Gmail"
            );


    const description =
        isChangeEmail

            ? (
                language === "bn"
                    ? "আপনার নতুন Gmail-এ একটি ৬ সংখ্যার OTP পাঠানো হয়েছে।"
                    : "A 6-digit OTP has been sent to your new Gmail address."
            )

            : (
                language === "bn"
                    ? "আপনার Gmail-এ একটি ৬ সংখ্যার OTP পাঠানো হয়েছে।"
                    : "A 6-digit OTP has been sent to your Gmail."
            );


    const verifyButtonText =
        language === "bn"
            ? "OTP Verify করুন"
            : "Verify OTP";


    const resendText =
        resendCooldown > 0

            ? (
                language === "bn"
                    ? `আবার পাঠান (${resendCooldown}s)`
                    : `Resend (${resendCooldown}s)`
            )

            : (
                language === "bn"
                    ? "আবার OTP পাঠান"
                    : "Resend OTP"
            );


    /* ====================================================================== */
    /* UI                                                                     */
    /* ====================================================================== */

    return (

        <SafeAreaView
            style={styles.safeArea}
        >

            {/* ---------------------------------------------------------------- */}
            {/* HEADER                                                           */}
            {/* ---------------------------------------------------------------- */}

            <View
                style={styles.header}
            >

                <Pressable
                    onPress={() =>
                        router.back()
                    }
                    style={
                        styles.backButton
                    }
                >

                    <Ionicons
                        name="arrow-back"
                        size={22}
                        color="#0f172a"
                    />

                </Pressable>


                <View
                    style={
                        styles.headerContent
                    }
                >

                    <Text
                        style={
                            styles.headerTitle
                        }
                    >
                        {headerTitle}
                    </Text>

                    <Text
                        style={
                            styles.headerSubtitle
                        }
                    >
                        {headerSubtitle}
                    </Text>

                </View>

            </View>


            {/* ---------------------------------------------------------------- */}
            {/* CONTENT                                                          */}
            {/* ---------------------------------------------------------------- */}

            <View
                style={styles.container}
            >

                {/* MAIL ICON */}

                <View
                    style={
                        styles.iconContainer
                    }
                >

                    <Ionicons
                        name="mail"
                        size={42}
                        color="#2563eb"
                    />

                </View>


                {/* TITLE */}

                <Text
                    style={
                        styles.title
                    }
                >
                    {mainTitle}
                </Text>


                {/* DESCRIPTION */}

                <Text
                    style={
                        styles.description
                    }
                >
                    {description}
                </Text>


                {/* EMAIL */}

                <Text
                    style={
                        styles.email
                    }
                >
                    {email}
                </Text>


                {/* OTP INPUT */}

                <TextInput
                    value={otp}
                    onChangeText={(value) => {

                        const digits =
                            value
                                .replace(
                                    /\D/g,
                                    ""
                                )
                                .slice(
                                    0,
                                    6
                                );

                        setOtp(digits);

                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="000000"
                    placeholderTextColor="#94a3b8"
                    style={
                        styles.otpInput
                    }
                    textAlign="center"
                    autoFocus
                />


                {/* VERIFY BUTTON */}

                <Pressable
                    onPress={verifyOTP}
                    disabled={
                        verifying ||
                        sending
                    }
                    style={[
                        styles.verifyButton,

                        (
                            verifying ||
                            sending
                        ) &&
                        styles.disabledButton,
                    ]}
                >

                    {verifying ? (

                        <ActivityIndicator
                            color="#ffffff"
                        />

                    ) : (

                        <Text
                            style={
                                styles.verifyButtonText
                            }
                        >
                            {verifyButtonText}
                        </Text>

                    )}

                </Pressable>


                {/* RESEND */}

                <Pressable
                    onPress={() => {

                        if (
                            resendCooldown <= 0 &&
                            !sending
                        ) {

                            sendOTP();

                        }

                    }}
                    disabled={
                        sending ||
                        resendCooldown > 0
                    }
                    style={
                        styles.resendButton
                    }
                >

                    {sending ? (

                        <ActivityIndicator
                            size="small"
                            color="#2563eb"
                        />

                    ) : (

                        <Text
                            style={[
                                styles.resendText,

                                resendCooldown > 0 &&
                                styles.resendDisabled,
                            ]}
                        >
                            {resendText}
                        </Text>

                    )}

                </Pressable>

            </View>

        </SafeAreaView>

    );

}


/* ========================================================================== */
/* STYLES                                                                     */
/* ========================================================================== */

const styles =
    StyleSheet.create({

        safeArea: {
            flex: 1,
            backgroundColor:
                "#f6f8fb",
        },


        /* ------------------------------------------------------------------ */
        /* HEADER                                                             */
        /* ------------------------------------------------------------------ */

        header: {
            minHeight: 76,
            paddingHorizontal: 18,
            paddingVertical: 12,
            backgroundColor:
                "#ffffff",
            borderBottomWidth: 1,
            borderBottomColor:
                "#e2e8f0",
            flexDirection: "row",
            alignItems: "center",
        },


        backButton: {
            width: 42,
            height: 42,
            borderRadius: 11,
            backgroundColor:
                "#f1f5f9",
            alignItems: "center",
            justifyContent:
                "center",
        },


        headerContent: {
            marginLeft: 12,
        },


        headerTitle: {
            fontSize: 18,
            fontWeight: "800",
            color: "#0f172a",
        },


        headerSubtitle: {
            marginTop: 3,
            fontSize: 10,
            color: "#64748b",
        },


        /* ------------------------------------------------------------------ */
        /* CONTENT                                                            */
        /* ------------------------------------------------------------------ */

        container: {
            flex: 1,
            alignItems: "center",
            paddingHorizontal: 24,
            paddingTop: 60,
        },


        iconContainer: {
            width: 86,
            height: 86,
            borderRadius: 43,
            backgroundColor:
                "#eff6ff",
            alignItems: "center",
            justifyContent:
                "center",
            marginBottom: 24,
        },


        title: {
            fontSize: 22,
            fontWeight: "800",
            color: "#0f172a",
        },


        description: {
            marginTop: 12,
            fontSize: 13,
            lineHeight: 21,
            color: "#64748b",
            textAlign: "center",
            maxWidth: 330,
        },


        email: {
            marginTop: 10,
            fontSize: 14,
            fontWeight: "800",
            color: "#2563eb",
            textAlign: "center",
        },


        /* ------------------------------------------------------------------ */
        /* OTP INPUT                                                          */
        /* ------------------------------------------------------------------ */

        otpInput: {
            width: "100%",
            maxWidth: 300,
            height: 58,
            marginTop: 30,
            borderWidth: 1,
            borderColor:
                "#cbd5e1",
            borderRadius: 14,
            backgroundColor:
                "#ffffff",
            fontSize: 24,
            fontWeight: "800",
            letterSpacing: 8,
            color: "#0f172a",
        },


        /* ------------------------------------------------------------------ */
        /* VERIFY BUTTON                                                      */
        /* ------------------------------------------------------------------ */

        verifyButton: {
            width: "100%",
            maxWidth: 300,
            height: 52,
            marginTop: 18,
            borderRadius: 13,
            backgroundColor:
                "#0f172a",
            alignItems: "center",
            justifyContent:
                "center",
        },


        verifyButtonText: {
            fontSize: 14,
            fontWeight: "800",
            color: "#ffffff",
        },


        disabledButton: {
            opacity: 0.55,
        },


        /* ------------------------------------------------------------------ */
        /* RESEND                                                             */
        /* ------------------------------------------------------------------ */

        resendButton: {
            marginTop: 20,
            minHeight: 40,
            alignItems: "center",
            justifyContent: "center",
        },


        resendText: {
            fontSize: 13,
            fontWeight: "800",
            color: "#2563eb",
        },


        resendDisabled: {
            color: "#94a3b8",
        },

    });

