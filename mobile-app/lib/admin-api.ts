import AsyncStorage
    from "@react-native-async-storage/async-storage";

const API_URL =
    process.env.EXPO_PUBLIC_API_URL;


/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/

export type Admin = {
    adminId: string;
    adminName: string;
    phone: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string;
    emailVerified?: boolean;
};


/*
|--------------------------------------------------------------------------
| Admin Login Result
|--------------------------------------------------------------------------
*/

export type AdminLoginResult = {
    success: boolean;
    message: string;
    admin?: Admin;
    sessionToken?: string;
    expiresIn?: number;
};


/*
|--------------------------------------------------------------------------
| Admin Dashboard
|--------------------------------------------------------------------------
*/

export type AdminDashboardData = {
    totalDeposit: number;
    totalWeeklyDeposit: number;
    totalAdvance: number;
    totalMembers: number;
    totalShares: number;
    weeklyDepositAmount: number;
    currentWeek: number;
    currentWeekDate: string;
    nextWeek: number;
    nextWeekDate: string;
};

export type AdminDashboardResult = {
    success: boolean;
    message: string;
    data?: AdminDashboardData;
};


/*
|--------------------------------------------------------------------------
| Get Admin Dashboard
|--------------------------------------------------------------------------
*/

export async function getAdminDashboard(): Promise<AdminDashboardResult> {

    try {

        /*
         * ---------------------------------------------------------------
         * Restore session from storage if necessary
         * ---------------------------------------------------------------
         */

        if (
            !currentAdminSessionToken
        ) {

            await restoreAdminSession();
        }


        console.log(
            "Admin dashboard request:",
            {
                adminId:
                    currentAdmin?.adminId,

                hasSessionToken:
                    Boolean(
                        currentAdminSessionToken
                    ),
            }
        );


        /*
         * ---------------------------------------------------------------
         * No session token
         * ---------------------------------------------------------------
         */

        if (
            !currentAdminSessionToken
        ) {

            return {
                success: false,

                message:
                    "Admin session পাওয়া যায়নি। আবার login করুন।",
            };
        }


        /*
         * ---------------------------------------------------------------
         * Dashboard API request
         * ---------------------------------------------------------------
         */

        const response =
            await fetch(
                `${API_URL}/api/admin/dashboard`,
                {
                    method: "GET",

                    headers: {
                        Accept:
                            "application/json",

                        ...getAdminAuthHeaders(),
                    },
                }
            );

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            const text =
                await response.text();

            console.error(
                "Admin dashboard non-JSON response:",
                text
            );

            return {
                success: false,
                message:
                    "Server থেকে সঠিক response পাওয়া যায়নি।",
            };
        }

        const data =
            await response.json();

        console.log(
            "Admin dashboard response:",
            data
        );

        if (!response.ok) {

            return {
                success: false,
                message:
                    data?.message ||
                    "Dashboard data পাওয়া যায়নি",
            };
        }

        return {
            success:
                data?.success === true,

            message:
                data?.message ||
                "Dashboard data পাওয়া গেছে",

            data:
                data?.data,
        };

    } catch (error) {

        console.error(
            "Admin dashboard API error:",
            error
        );

        return {
            success: false,
            message:
                "Server-এর সাথে সংযোগ করা যাচ্ছে না",
        };
    }
}

/* 
|--------------------------------------------------------------------------
| Admin Session Storage
|--------------------------------------------------------------------------
*/

const ADMIN_SESSION_TOKEN_KEY =
    "@khudro_sanchoy_admin_session_token";

const ADMIN_SESSION_DATA_KEY =
    "@khudro_sanchoy_admin_data";

/*
|--------------------------------------------------------------------------
| Current Admin Session
|--------------------------------------------------------------------------
*/

let currentAdmin: Admin | null = null;

let currentAdminSessionToken:
    string | null = null;


/*
|--------------------------------------------------------------------------
| Get Admin Session Token
|--------------------------------------------------------------------------
*/

export function getAdminSessionToken():
    string | null {

    return currentAdminSessionToken;
}


/*
|--------------------------------------------------------------------------
| Get Admin Authorization Headers
|--------------------------------------------------------------------------
*/

export function getAdminAuthHeaders():
    Record<string, string> {

    if (
        !currentAdminSessionToken
    ) {
        return {};
    }

    return {
        Authorization:
            `Bearer ${currentAdminSessionToken}`,
    };
}

/*
|--------------------------------------------------------------------------
| Restore Admin Session
|--------------------------------------------------------------------------
*/

export async function restoreAdminSession(): Promise<
    Admin | null
> {

    try {

        const storedToken =
            await AsyncStorage.getItem(
                ADMIN_SESSION_TOKEN_KEY
            );

        const storedAdmin =
            await AsyncStorage.getItem(
                ADMIN_SESSION_DATA_KEY
            );


        if (
            !storedToken
        ) {

            currentAdminSessionToken =
                null;

            currentAdmin =
                null;

            return null;
        }


        currentAdminSessionToken =
            storedToken;


        if (
            storedAdmin
        ) {

            try {

                currentAdmin =
                    JSON.parse(
                        storedAdmin
                    ) as Admin;

            } catch {

                currentAdmin =
                    null;
            }
        }


        console.log(
            "Admin session restored:",
            {
                adminId:
                    currentAdmin?.adminId,
                hasToken:
                    Boolean(
                        currentAdminSessionToken
                    ),
            }
        );


        return currentAdmin;

    } catch (error) {

        console.error(
            "Restore admin session error:",
            error
        );

        currentAdmin =
            null;

        currentAdminSessionToken =
            null;

        return null;
    }
}

/*
|--------------------------------------------------------------------------
| Admin Login
|--------------------------------------------------------------------------
*/

export async function adminLogin(
    adminId: string,
    password: string
): Promise<AdminLoginResult> {

    try {

        console.log(
            "Admin login request:",
            {
                adminId,
            }
        );

        const response =
            await fetch(
                `${API_URL}/api/admin/auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            adminId,
                            password,
                        }),
                }
            );

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            const text =
                await response.text();

            console.error(
                "Admin login non-JSON response:",
                text
            );

            return {
                success: false,
                message:
                    "Server থেকে সঠিক response পাওয়া যায়নি।",
            };
        }

        const data =
            await response.json();

        console.log(
            "Admin login response:",
            data
        );

        if (!response.ok) {

            return {
                success: false,
                message:
                    data?.message ||
                    "Admin login failed",
            };
        }

        if (
            data?.success === true &&
            data?.admin
        ) {

            currentAdmin =
                data.admin;

            currentAdminSessionToken =
                data.sessionToken || null;


            if (currentAdmin) {
                console.log(
                    "Current admin saved:",
                    currentAdmin.adminId
                );
            }

            console.log(
                "Admin session token saved:",
                Boolean(
                    currentAdminSessionToken
                )
            );


            /*
            |--------------------------------------------------------------------------
            | Persist Admin Session
            |--------------------------------------------------------------------------
            */

            if (
                currentAdmin &&
                currentAdminSessionToken
            ) {

                try {

                    await AsyncStorage.setItem(
                        ADMIN_SESSION_TOKEN_KEY,
                        currentAdminSessionToken
                    );


                    await AsyncStorage.setItem(
                        ADMIN_SESSION_DATA_KEY,
                        JSON.stringify(
                            currentAdmin
                        )
                    );


                    console.log(
                        "Admin session persisted successfully"
                    );

                } catch (storageError) {

                    console.error(
                        "Failed to persist admin session:",
                        storageError
                    );
                }
            }
        }

        return {
            success:
                data?.success === true,
            message:
                data?.message ||
                "Admin login successful",
            admin:
                data?.admin,
            sessionToken:
                data?.sessionToken,
            expiresIn:
                data?.expiresIn,
        };

    } catch (error) {

        console.error(
            "Admin login API error:",
            error
        );

        return {
            success: false,
            message:
                "Server-এর সাথে সংযোগ করা যাচ্ছে না",
        };
    }
}


/*
|--------------------------------------------------------------------------
| Get Current Admin
|--------------------------------------------------------------------------
*/

export function getCurrentAdmin(): Admin | null {
    return currentAdmin;
}


/*
|--------------------------------------------------------------------------
| Clear Admin Session
|--------------------------------------------------------------------------
*/

export async function clearCurrentAdmin() {

    currentAdmin = null;

    currentAdminSessionToken =
        null;


    try {

        await AsyncStorage.removeItem(
            ADMIN_SESSION_TOKEN_KEY
        );


        await AsyncStorage.removeItem(
            ADMIN_SESSION_DATA_KEY
        );


    } catch (error) {

        console.error(
            "Clear admin session storage error:",
            error
        );
    }


    console.log(
        "Current admin session cleared"
    );
}


/*
|--------------------------------------------------------------------------
| Create Admin Result
|--------------------------------------------------------------------------
*/

export type CreateAdminResult = {
    success: boolean;
    message: string;
    admin?: Admin;
};


/*
|--------------------------------------------------------------------------
| Create Admin
|--------------------------------------------------------------------------
*/

export async function createAdmin(
    adminId: string,
    adminName: string,
    phone: string,
    email: string,
    password: string,
    rePassword: string
): Promise<CreateAdminResult> {

    try {

        console.log(
            "Create admin request:",
            {
                adminId,
                adminName,
                phone,
                email,
            }
        );

        const response =
            await fetch(
                `${API_URL}/api/admin/create`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            adminId,
                            adminName,
                            phone,
                            email,
                            password,
                            rePassword,
                        }),
                }
            );

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            const text =
                await response.text();

            console.error(
                "Create admin non-JSON response:",
                text
            );

            return {
                success: false,
                message:
                    "Server থেকে সঠিক response পাওয়া যায়নি।",
            };
        }

        const data =
            await response.json();

        console.log(
            "Create admin response:",
            data
        );

        if (!response.ok) {

            return {
                success: false,

                message:
                    data?.message ||
                    "Admin তৈরি করা যায়নি",
            };
        }

        return {
            success:
                data?.success === true,

            message:
                data?.message ||
                "Admin তৈরি করা যায়নি",

            admin:
                data?.admin,
        };

    } catch (error) {

        console.error(
            "Create admin API error:",
            error
        );

        return {
            success: false,
            message:
                "Server-এর সাথে সংযোগ করা যাচ্ছে না",
        };
    }
}


/*
|--------------------------------------------------------------------------
| ADMIN PROFILE
|--------------------------------------------------------------------------
*/

export interface AdminProfile {
    adminId: string;
    adminName: string;
    phone: string;
    email: string;
    emailVerified: boolean;
}


/*
|--------------------------------------------------------------------------
| Get Admin Profile
|--------------------------------------------------------------------------
*/

export async function getAdminProfile(
    adminId: string
): Promise<
    | {
        success: true;
        profile: AdminProfile;
        message?: string;
    }
    | {
        success: false;
        message: string;
    }
> {

    try {

        const response =
            await fetch(
                `${API_URL}/api/admin/profile/${encodeURIComponent(
                    adminId
                )}`,
                {
                    method: "GET",

                    headers: {
                        Accept:
                            "application/json",
                    },
                }
            );

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            const text =
                await response.text();

            console.error(
                "Get admin profile non-JSON response:",
                text
            );

            return {
                success: false,
                message:
                    "Server থেকে সঠিক response পাওয়া যায়নি।",
            };
        }

        const data =
            await response.json();

        if (!response.ok) {

            return {
                success: false,

                message:
                    data?.message ??
                    "Profile পাওয়া যায়নি",
            };
        }

        if (!data?.profile) {

            return {
                success: false,

                message:
                    "Profile data পাওয়া যায়নি",
            };
        }

        return {
            success: true,

            profile: {
                ...data.profile,

                phone:
                    normalizeBangladeshPhone(
                        data.profile.phone
                    ),
            },

            message:
                data.message,
        };

    } catch (error) {

        console.error(
            "Get admin profile API error:",
            error
        );

        return {
            success: false,

            message:
                "Server-এর সাথে সংযোগ করা যাচ্ছে না",
        };
    }
}


/*
|--------------------------------------------------------------------------
| Update Admin Profile
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| adminName এবং phone optional।
|
| শুধু name:
| updateAdminProfile(adminId, name)
|
| শুধু phone:
| updateAdminProfile(adminId, undefined, phone)
|
| দুটো:
| updateAdminProfile(adminId, name, phone)
|
|--------------------------------------------------------------------------
*/

export async function updateAdminProfile(
    adminId: string,
    adminName?: string,
    phone?: string
): Promise<
    | {
        success: true;
        profile: AdminProfile;
        message?: string;
    }
    | {
        success: false;
        message: string;
    }
> {

    try {

        /*
         * ---------------------------------------------------------------
         * Build request body
         * ---------------------------------------------------------------
         */

        const body: {
            adminName?: string;
            phone?: string;
        } = {};


        /*
         * ---------------------------------------------------------------
         * Name থাকলে শুধু name পাঠাবে
         * ---------------------------------------------------------------
         */

        if (
            adminName !== undefined
        ) {

            body.adminName =
                adminName.trim();
        }


        /*
         * ---------------------------------------------------------------
         * Phone থাকলে normalize করে পাঠাবে
         * ---------------------------------------------------------------
         */

        if (
            phone !== undefined
        ) {

            body.phone =
                normalizeBangladeshPhone(
                    phone
                );
        }


        /*
         * ---------------------------------------------------------------
         * কোনো data না থাকলে API call করবে না
         * ---------------------------------------------------------------
         */

        if (
            Object.keys(body).length === 0
        ) {

            return {
                success: false,

                message:
                    "কোনো পরিবর্তন পাওয়া যায়নি",
            };
        }


        console.log(
            "Update admin profile request:",
            {
                adminId,
                body,
            }
        );


        /*
         * ---------------------------------------------------------------
         * API Request
         * ---------------------------------------------------------------
         */

        const response =
            await fetch(
                `${API_URL}/api/admin/profile/${encodeURIComponent(
                    adminId
                )}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",
                    },

                    body:
                        JSON.stringify(body),
                }
            );


        /*
         * ---------------------------------------------------------------
         * Check response type
         * ---------------------------------------------------------------
         */

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            const text =
                await response.text();

            console.error(
                "Update admin profile non-JSON response:",
                text
            );

            return {
                success: false,

                message:
                    "Server থেকে সঠিক response পাওয়া যায়নি।",
            };
        }


        /*
         * ---------------------------------------------------------------
         * Parse response
         * ---------------------------------------------------------------
         */

        const data =
            await response.json();


        /*
         * ---------------------------------------------------------------
         * API Error
         * ---------------------------------------------------------------
         */

        if (!response.ok) {

            console.error(
                "Update admin profile failed:",
                data
            );

            return {
                success: false,

                message:
                    data?.message ??
                    "Profile update করা যায়নি",
            };
        }


        /*
         * ---------------------------------------------------------------
         * Check profile
         * ---------------------------------------------------------------
         */

        if (!data?.profile) {

            return {
                success: false,

                message:
                    "Updated profile data পাওয়া যায়নি",
            };
        }


        /*
         * ---------------------------------------------------------------
         * Normalize returned phone
         * ---------------------------------------------------------------
         */

        const updatedProfile: AdminProfile = {

            ...data.profile,

            phone:
                normalizeBangladeshPhone(
                    data.profile.phone
                ),
        };


        /*
         * ---------------------------------------------------------------
         * Update local currentAdmin
         * ---------------------------------------------------------------
         */

        if (currentAdmin) {

            currentAdmin = {

                ...currentAdmin,

                adminName:
                    updatedProfile.adminName,

                phone:
                    updatedProfile.phone,

                email:
                    updatedProfile.email,
            };

            console.log(
                "Current admin profile updated locally:",
                currentAdmin
            );
        }


        /*
         * ---------------------------------------------------------------
         * Return updated profile
         * ---------------------------------------------------------------
         */

        return {

            success: true,

            profile:
                updatedProfile,

            message:
                data.message,
        };

    } catch (error) {

        console.error(
            "Update admin profile API error:",
            error
        );

        return {
            success: false,

            message:
                "Server-এর সাথে সংযোগ করা যাচ্ছে না",
        };
    }
}


/*
|--------------------------------------------------------------------------
| Normalize Bangladesh Phone Number
|--------------------------------------------------------------------------
*/

function normalizeBangladeshPhone(
    value: string
): string {

    const digits =
        String(value ?? "")
            .replace(/\D/g, "")
            .trim();


    /*
     * ---------------------------------------------------------------
     * Already valid local format
     * Example: 01712345678
     * ---------------------------------------------------------------
     */

    if (
        /^01[3-9]\d{8}$/.test(
            digits
        )
    ) {

        return digits;
    }


    /*
     * ---------------------------------------------------------------
     * Missing leading 0
     * Example: 1712345678
     * Result: 01712345678
     * ---------------------------------------------------------------
     */

    if (
        /^1[3-9]\d{8}$/.test(
            digits
        )
    ) {

        return `0${digits}`;
    }


    /*
     * ---------------------------------------------------------------
     * International Bangladesh format
     * Example: 8801712345678
     * Result: 01712345678
     * ---------------------------------------------------------------
     */

    if (
        /^8801[3-9]\d{8}$/.test(
            digits
        )
    ) {

        return `0${digits.slice(2)}`;
    }


    /*
     * ---------------------------------------------------------------
     * Return as-is if invalid/incomplete
     * ---------------------------------------------------------------
     */

    return digits;
}


/* ==========================================================================
   SEND ADMIN EMAIL VERIFICATION OTP
   ========================================================================== */

export async function sendAdminEmailVerificationOTP(
    adminId: string
): Promise<{
    success: boolean;
    message: string;
    expiresIn?: number;
    resendAfter?: number;
}> {

    try {

        console.log(
            "Sending admin email verification OTP:",
            {
                adminId,
            }
        );

        const response =
            await fetch(
                `${API_URL}/api/admin/email-verification/${encodeURIComponent(
                    adminId
                )}/send-otp`,
                {
                    method: "POST",

                    headers: {
                        Accept:
                            "application/json",
                    },
                }
            );

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            const text =
                await response.text();

            console.error(
                "Send OTP non-JSON response:",
                text
            );

            return {
                success: false,

                message:
                    "Server থেকে সঠিক response পাওয়া যায়নি।",
            };
        }

        const data =
            await response.json();

        console.log(
            "Send OTP response:",
            data
        );

        if (!response.ok) {

            return {
                success: false,

                message:
                    data?.message ||
                    "OTP পাঠানো যায়নি",

                resendAfter:
                    data?.resendAfter,
            };
        }

        return {
            success:
                data?.success === true,

            message:
                data?.message ||
                "OTP পাঠানো হয়েছে",

            expiresIn:
                data?.expiresIn,

            resendAfter:
                data?.resendAfter,
        };

    } catch (error) {

        console.error(
            "Send admin email OTP API error:",
            error
        );

        return {
            success: false,

            message:
                "Server-এর সাথে সংযোগ করা যাচ্ছে না",
        };
    }
}



/* ==========================================================================
   VERIFY ADMIN EMAIL OTP
   ========================================================================== */

export async function verifyAdminEmailOTP(
    adminId: string,
    otp: string
): Promise<{
    success: boolean;
    message: string;
    profile?: AdminProfile;
}> {

    try {

        console.log(
            "Verifying admin email OTP:",
            {
                adminId,
                otpLength: otp.length,
            }
        );

        const response =
            await fetch(
                `${API_URL}/api/admin/email-verification/${encodeURIComponent(
                    adminId
                )}/verify-otp`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            otp,
                        }),
                }
            );


        /* ==============================================================
           RESPONSE TYPE CHECK
           ============================================================== */

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            const text =
                await response.text();

            console.error(
                "Verify OTP non-JSON response:",
                text
            );

            return {
                success: false,

                message:
                    "Server থেকে সঠিক response পাওয়া যায়নি।",
            };
        }


        /* ==============================================================
           PARSE RESPONSE
           ============================================================== */

        const data =
            await response.json();

        console.log(
            "Verify OTP response:",
            data
        );


        /* ==============================================================
           API ERROR
           ============================================================== */

        if (!response.ok) {

            return {
                success: false,

                message:
                    data?.message ||
                    "OTP verification ব্যর্থ হয়েছে",
            };
        }


        /* ==============================================================
           BACKEND VERIFICATION SUCCESS
           ============================================================== */

        if (
            data?.success !== true
        ) {

            return {
                success: false,

                message:
                    data?.message ||
                    "OTP verification ব্যর্থ হয়েছে",
            };
        }


        /* ==============================================================
           IMPORTANT
           Verification সফল হওয়ার পর
           Google Sheet থেকে latest profile আবার load করছি।
           ============================================================== */

        const latestProfile =
            await getAdminProfile(
                adminId
            );


        if (
            latestProfile.success
        ) {

            console.log(
                "Latest admin profile after verification:",
                latestProfile.profile
            );


            /* ----------------------------------------------------------
               Update local currentAdmin
               ---------------------------------------------------------- */

            if (
                currentAdmin
            ) {

                currentAdmin = {

                    ...currentAdmin,

                    adminId:
                        latestProfile
                            .profile
                            .adminId,

                    adminName:
                        latestProfile
                            .profile
                            .adminName,

                    phone:
                        latestProfile
                            .profile
                            .phone,

                    email:
                        latestProfile
                            .profile
                            .email,

                    emailVerified:
                        latestProfile
                            .profile
                            .emailVerified,
                };


                console.log(
                    "Current admin updated after email verification:",
                    currentAdmin
                );
            }


            /* ----------------------------------------------------------
               Return latest profile
               ---------------------------------------------------------- */

            return {

                success: true,

                message:
                    data?.message ||
                    "Gmail verified successfully",

                profile:
                    latestProfile.profile,
            };
        }


        /* ==============================================================
           OTP VERIFIED BUT PROFILE REFRESH FAILED
           ============================================================== */

        console.warn(
            "OTP verified but latest profile could not be loaded:",
            latestProfile.message
        );


        /*
         * Backend verification already succeeded.
         * তাই এটাকে failed দেখাবো না।
         */

        return {

            success: true,

            message:
                data?.message ||
                "Gmail verified successfully",
        };


    } catch (error) {

        console.error(
            "Verify admin email OTP API error:",
            error
        );

        return {

            success: false,

            message:
                "Server-এর সাথে সংযোগ করা যাচ্ছে না",
        };
    }
}

/* ==========================================================================
   CHANGE ADMIN PASSWORD
   ========================================================================== */

export async function changeAdminPassword(
    adminId: string,
    currentPassword: string,
    newPassword: string,
    rePassword: string
): Promise<{
    success: boolean;
    message: string;
}> {

    try {

        console.log(
            "Change admin password request:",
            {
                adminId,
            }
        );

        const response =
            await fetch(
                `${API_URL}/api/admin/auth/change-password/${encodeURIComponent(
                    adminId
                )}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            currentPassword,
                            newPassword,
                            rePassword,
                        }),
                }
            );


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            const text =
                await response.text();

            console.error(
                "Change password non-JSON response:",
                text
            );

            return {
                success: false,

                message:
                    "Server থেকে সঠিক response পাওয়া যায়নি।",
            };
        }


        const data =
            await response.json();


        console.log(
            "Change password response:",
            data
        );


        if (!response.ok) {

            return {
                success: false,

                message:
                    data?.message ||
                    "পাসওয়ার্ড পরিবর্তন করা যায়নি",
            };
        }


        return {
            success:
                data?.success === true,

            message:
                data?.message ||
                "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে",
        };


    } catch (error) {

        console.error(
            "Change admin password API error:",
            error
        );

        return {
            success: false,

            message:
                "Server-এর সাথে সংযোগ করা যাচ্ছে না",
        };
    }
}

/* ==========================================================================
   CREATE MEMBER
   ========================================================================== */

export type CreateMemberResult = {
    success: boolean;
    message: string;
    member?: {
        memberId: string;
        memberName: string;
        phone: string;
        joinDate: string;
        currentShareCount: number;
        currentWeeklyAmount: number;
        status: string;
    };
};


export async function createMember(
    memberId: string,
    memberName: string,
    phone: string,
    joinDate: string,
    shareCount: number
): Promise<CreateMemberResult> {

    try {

        console.log(
            "Create member request:",
            {
                memberId,
                memberName,
                phone,
                joinDate,
                shareCount,
            }
        );


        const response =
            await fetch(
                `${API_URL}/api/admin/members`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            memberId,
                            memberName,
                            phone,
                            joinDate,
                            shareCount,
                        }),
                }
            );


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            const text =
                await response.text();

            console.error(
                "Create member non-JSON response:",
                text
            );

            return {
                success: false,

                message:
                    "Server থেকে সঠিক response পাওয়া যায়নি।",
            };
        }


        const data =
            await response.json();


        console.log(
            "Create member response:",
            data
        );


        if (!response.ok) {

            return {
                success: false,

                message:
                    data?.message ||
                    "Member তৈরি করা যায়নি",
            };
        }


        return {
            success:
                data?.success === true,

            message:
                data?.message ||
                "Member সফলভাবে তৈরি হয়েছে",

            member:
                data?.member,
        };

    } catch (error) {

        console.error(
            "Create member API error:",
            error
        );

        return {
            success: false,

            message:
                "Server-এর সাথে সংযোগ করা যাচ্ছে না",
        };
    }
}


export type AdminMember = {
    memberId: string;
    memberName: string;
    phone: string;
    joinDate: string;
    currentShareCount: number;
    currentWeeklyAmount: number;
    status: string;
};

export type GetAdminMembersResult = {
    success: boolean;
    message: string;
    members?: AdminMember[];
};


export async function getAdminMembers(): Promise<GetAdminMembersResult> {
    try {
        const response = await fetch(`${API_URL}/api/admin/members`, {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
        });

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
            const text = await response.text();

            console.error("Get admin members non-JSON response:", text);

            return {
                success: false,
                message: "Server থেকে সঠিক response পাওয়া যায়নি।",
            };
        }

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                message: data?.message || "Member list পাওয়া যায়নি।",
            };
        }

        return {
            success: data?.success === true,
            message: data?.message || "Member list পাওয়া গেছে।",
            members: Array.isArray(data?.members) ? data.members : [],
        };
    } catch (error) {
        console.error("Get admin members API error:", error);

        return {
            success: false,
            message: "Server-এর সাথে সংযোগ করা যাচ্ছে না।",
        };
    }
}

export async function deleteAdminAccount(
    adminId: string,
    password: string
): Promise<{
    success: boolean;
    message: string;
}> {
    try {
        const response =
            await fetch(
                `${API_URL}/api/admin/auth/account/${encodeURIComponent(
                    adminId
                )}`,
                {
                    method: "DELETE",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        password,
                    }),
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            return {
                success: false,
                message:
                    data?.message ||
                    "Admin account delete করা যায়নি",
            };
        }

        if (
            data?.success !== true
        ) {
            return {
                success: false,
                message:
                    data?.message ||
                    "Admin account delete করা যায়নি",
            };
        }

        /*
         * Clear local admin session
         * after successful permanent deletion.
         */
        await clearCurrentAdmin();

        return {
            success: true,
            message:
                data?.message ||
                "Admin account সফলভাবে delete হয়েছে",
        };

    } catch (error) {
        console.error(
            "Delete admin account API error:",
            error
        );

        return {
            success: false,
            message:
                "Server-এর সাথে যোগাযোগ করা যায়নি",
        };
    }
}


/* ==========================================================================
   ADMIN EMAIL CHANGE
   ========================================================================== */


/* --------------------------------------------------------------------------
   Types
   -------------------------------------------------------------------------- */

export type VerifyAdminEmailChangePasswordResponse = {
    success: boolean;
    message?: string;
    authorizationToken?: string;
    expiresIn?: number;
};


export type SendAdminEmailChangeOTPResponse = {
    success: boolean;
    message?: string;
    expiresIn?: number;
    resendAfter?: number;
};


export type VerifyAdminEmailChangeOTPResponse = {
    success: boolean;
    message?: string;
};


/* --------------------------------------------------------------------------
   Verify Current Admin Password Before Email Change
   -------------------------------------------------------------------------- */

export async function verifyAdminEmailChangePassword(
    adminId: string,
    password: string
): Promise<VerifyAdminEmailChangePasswordResponse> {

    const normalizedAdminId =
        String(adminId ?? "").trim();


    try {

        const response =
            await fetch(
                `${API_URL}/api/admin/email-change/${encodeURIComponent(
                    normalizedAdminId
                )}/verify-password`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        password,
                    }),
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            return {
                success: false,

                message:
                    data?.message ||
                    "Password verification failed",
            };
        }


        return {
            success:
                Boolean(data?.success),

            message:
                data?.message,

            authorizationToken:
                data?.authorizationToken,

            expiresIn:
                data?.expiresIn,
        };

    } catch (error) {

        console.error(
            "verifyAdminEmailChangePassword error:",
            error
        );


        return {
            success: false,

            message:
                "Network error. Please try again.",
        };
    }
}

/* --------------------------------------------------------------------------
   Verify New Gmail OTP
   -------------------------------------------------------------------------- */

export async function verifyAdminEmailChangeOTP(
    adminId: string,
    authorizationToken: string,
    otp: string
): Promise<VerifyAdminEmailChangeOTPResponse> {

    const normalizedAdminId =
        String(adminId ?? "").trim();

    const normalizedOTP =
        String(otp ?? "")
            .trim()
            .replace(/\D/g, "");


    try {

        console.log(
            "Verifying admin email change OTP:",
            {
                adminId: normalizedAdminId,
                otpLength: normalizedOTP.length,
            }
        );


        const response =
            await fetch(
                `${API_URL}/api/admin/email-change/${encodeURIComponent(
                    normalizedAdminId
                )}/verify-otp`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            authorizationToken,

                            otp:
                                normalizedOTP,
                        }),
                }
            );


        /*
         * ---------------------------------------------------------------
         * Response type check
         * ---------------------------------------------------------------
         */

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            const text =
                await response.text();

            console.error(
                "Verify email change OTP non-JSON response:",
                text
            );

            return {
                success: false,

                message:
                    "Server থেকে সঠিক response পাওয়া যায়নি।",
            };
        }


        /*
         * ---------------------------------------------------------------
         * Parse response
         * ---------------------------------------------------------------
         */

        const data =
            await response.json();


        console.log(
            "Verify email change OTP response:",
            data
        );


        /*
         * ---------------------------------------------------------------
         * API error
         * ---------------------------------------------------------------
         */

        if (!response.ok) {

            return {
                success: false,

                message:
                    data?.message ||
                    "OTP verification failed",
            };
        }


        /*
         * ---------------------------------------------------------------
         * Backend verification failed
         * ---------------------------------------------------------------
         */

        if (
            data?.success !== true
        ) {

            return {
                success: false,

                message:
                    data?.message ||
                    "OTP verification failed",
            };
        }


        /*
         * ---------------------------------------------------------------
         * Refresh Current Admin
         * ---------------------------------------------------------------
         *
         * Backend has already:
         *
         * 1. Verified OTP
         * 2. Updated Gmail
         * 3. Marked email as verified
         *
         * Now reload the latest profile.
         * ---------------------------------------------------------------
         */

        const profileResponse =
            await getAdminProfile(
                normalizedAdminId
            );


        /*
         * ---------------------------------------------------------------
         * Profile refresh successful
         * ---------------------------------------------------------------
         */

        if (
            profileResponse.success
        ) {

            const latestProfile =
                profileResponse.profile;


            console.log(
                "Latest admin profile after email change:",
                latestProfile
            );


            /*
             * -----------------------------------------------------------
             * Update module-level currentAdmin
             * -----------------------------------------------------------
             */

            if (
                currentAdmin
            ) {

                currentAdmin = {

                    ...currentAdmin,

                    adminId:
                        latestProfile.adminId,

                    adminName:
                        latestProfile.adminName,

                    phone:
                        latestProfile.phone,

                    email:
                        latestProfile.email,

                    emailVerified:
                        latestProfile.emailVerified,
                };


                console.log(
                    "Current admin updated after email change:",
                    currentAdmin
                );

            } else {

                /*
                 * Normally currentAdmin should exist because
                 * the admin is already logged in.
                 *
                 * But if it is null, we cannot restore
                 * the complete Admin object from profile alone.
                 */

                console.warn(
                    "Current admin is null after email change."
                );

            }


        } else {

            /*
             * Backend email change already succeeded.
             *
             * Profile refresh failure should NOT make
             * the email change appear unsuccessful.
             */

            console.warn(
                "Admin profile refresh after email change failed:",
                profileResponse.message
            );

        }


        /*
         * ---------------------------------------------------------------
         * Final success
         * ---------------------------------------------------------------
         */

        return {

            success: true,

            message:
                data?.message ||
                "Gmail successfully changed and verified",
        };


    } catch (error) {

        console.error(
            "verifyAdminEmailChangeOTP error:",
            error
        );


        return {

            success: false,

            message:
                "Server-এর সাথে সংযোগ করা যাচ্ছে না",
        };

    }

}


/* --------------------------------------------------------------------------
   Send OTP To New Gmail
   -------------------------------------------------------------------------- */

export async function sendAdminEmailChangeOTP(
    adminId: string,
    authorizationToken: string,
    newEmail: string
): Promise<SendAdminEmailChangeOTPResponse> {

    const normalizedAdminId =
        String(adminId ?? "").trim();

    const normalizedToken =
        String(authorizationToken ?? "").trim();

    const normalizedEmail =
        String(newEmail ?? "")
            .trim()
            .toLowerCase();


    try {

        console.log(
            "Sending admin email change OTP:",
            {
                adminId: normalizedAdminId,
                newEmail: normalizedEmail,
            }
        );


        /* ------------------------------------------------------------------
           API Request
           ------------------------------------------------------------------ */

        const response =
            await fetch(
                `${API_URL}/api/admin/email-change/${encodeURIComponent(
                    normalizedAdminId
                )}/send-otp`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            authorizationToken:
                                normalizedToken,

                            newEmail:
                                normalizedEmail,
                        }),
                }
            );


        /* ------------------------------------------------------------------
           Response Type Check
           ------------------------------------------------------------------ */

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            const text =
                await response.text();

            console.error(
                "Send email change OTP non-JSON response:",
                text
            );

            return {
                success: false,

                message:
                    "Server থেকে সঠিক response পাওয়া যায়নি।",
            };
        }


        /* ------------------------------------------------------------------
           Parse Response
           ------------------------------------------------------------------ */

        const data =
            await response.json();


        console.log(
            "Email change OTP response:",
            data
        );


        /* ------------------------------------------------------------------
           API Error
           ------------------------------------------------------------------ */

        if (!response.ok) {

            return {

                success: false,

                message:
                    data?.message ||
                    "নতুন Gmail-এ OTP পাঠানো যায়নি",

                expiresIn:
                    data?.expiresIn,

                resendAfter:
                    data?.resendAfter,
            };
        }


        /* ------------------------------------------------------------------
           Backend Success Check
           ------------------------------------------------------------------ */

        if (
            data?.success !== true
        ) {

            return {

                success: false,

                message:
                    data?.message ||
                    "নতুন Gmail-এ OTP পাঠানো যায়নি",

                expiresIn:
                    data?.expiresIn,

                resendAfter:
                    data?.resendAfter,
            };
        }


        /* ------------------------------------------------------------------
           Success
           ------------------------------------------------------------------ */

        return {

            success: true,

            message:
                data?.message ||
                "নতুন Gmail-এ OTP পাঠানো হয়েছে",

            expiresIn:
                data?.expiresIn,

            resendAfter:
                data?.resendAfter,
        };


    } catch (error) {

        console.error(
            "Send email change OTP API error:",
            error
        );


        return {

            success: false,

            message:
                "Server-এর সাথে সংযোগ করা যাচ্ছে না",
        };
    }
}

/* ==========================================================================
   ADMIN FORGOT PASSWORD
   ========================================================================== */


/* --------------------------------------------------------------------------
   Get Admin Password Reset Information
   -------------------------------------------------------------------------- */

export async function getAdminPasswordResetInfo(
    adminId: string
): Promise<{
    success: boolean;
    adminId?: string;
    email?: string;
    maskedEmail?: string;
    message?: string;
}> {

    const normalizedAdminId =
        String(adminId ?? "")
            .trim()
            .toUpperCase();


    try {

        console.log(
            "Getting admin password reset info:",
            {
                adminId: normalizedAdminId,
            }
        );


        const response =
            await fetch(
                `${API_URL}/api/admin/forgot-password/${encodeURIComponent(
                    normalizedAdminId
                )}`,
                {
                    method: "GET",

                    headers: {
                        Accept:
                            "application/json",
                    },
                }
            );


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            const text =
                await response.text();

            console.error(
                "Get password reset info non-JSON response:",
                text
            );

            return {
                success: false,

                message:
                    "Server থেকে সঠিক response পাওয়া যায়নি।",
            };
        }


        const data =
            await response.json();


        console.log(
            "Password reset info response:",
            data
        );


        if (!response.ok) {

            return {
                success: false,

                message:
                    data?.message ||
                    "Admin information পাওয়া যায়নি",
            };
        }


        return {

            success:
                data?.success === true,

            adminId:
                data?.adminId,

            email:
                data?.email,

            maskedEmail:
                data?.maskedEmail,

            message:
                data?.message,
        };


    } catch (error) {

        console.error(
            "Get admin password reset info API error:",
            error
        );


        return {

            success: false,

            message:
                "Server-এর সাথে সংযোগ করা যাচ্ছে না",
        };
    }
}


/* --------------------------------------------------------------------------
   Send Admin Password Reset OTP
   -------------------------------------------------------------------------- */

export async function sendAdminPasswordResetOTP(
    adminId: string
): Promise<{
    success: boolean;
    message: string;
    expiresIn?: number;
    resendAfter?: number;
}> {

    const normalizedAdminId =
        String(adminId ?? "")
            .trim()
            .toUpperCase();


    try {

        console.log(
            "Sending admin password reset OTP:",
            {
                adminId: normalizedAdminId,
            }
        );


        const response =
            await fetch(
                `${API_URL}/api/admin/forgot-password/${encodeURIComponent(
                    normalizedAdminId
                )}/send-otp`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",
                    },
                }
            );


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            const text =
                await response.text();

            console.error(
                "Send password reset OTP non-JSON response:",
                text
            );

            return {

                success: false,

                message:
                    "Server থেকে সঠিক response পাওয়া যায়নি।",
            };
        }


        const data =
            await response.json();


        console.log(
            "Password reset OTP response:",
            data
        );


        if (!response.ok) {

            return {

                success: false,

                message:
                    data?.message ||
                    "OTP পাঠানো যায়নি",

                expiresIn:
                    data?.expiresIn,

                resendAfter:
                    data?.resendAfter,
            };
        }


        return {

            success:
                data?.success === true,

            message:
                data?.message ||
                "OTP পাঠানো হয়েছে",

            expiresIn:
                data?.expiresIn,

            resendAfter:
                data?.resendAfter,
        };


    } catch (error) {

        console.error(
            "Send admin password reset OTP API error:",
            error
        );


        return {

            success: false,

            message:
                "Server-এর সাথে সংযোগ করা যাচ্ছে না",
        };
    }
}


/* --------------------------------------------------------------------------
   Verify Admin Password Reset OTP
   -------------------------------------------------------------------------- */

export async function verifyAdminPasswordResetOTP(
    adminId: string,
    otp: string
): Promise<{
    success: boolean;
    message: string;
    resetToken?: string;
    expiresIn?: number;
}> {

    const normalizedAdminId =
        String(adminId ?? "")
            .trim()
            .toUpperCase();

    const normalizedOTP =
        String(otp ?? "")
            .trim()
            .replace(/\D/g, "");


    try {

        console.log(
            "Verifying admin password reset OTP:",
            {
                adminId: normalizedAdminId,
                otpLength:
                    normalizedOTP.length,
            }
        );


        const response =
            await fetch(
                `${API_URL}/api/admin/forgot-password/${encodeURIComponent(
                    normalizedAdminId
                )}/verify-otp`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            otp:
                                normalizedOTP,
                        }),
                }
            );


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            const text =
                await response.text();

            console.error(
                "Verify password reset OTP non-JSON response:",
                text
            );

            return {

                success: false,

                message:
                    "Server থেকে সঠিক response পাওয়া যায়নি।",
            };
        }


        const data =
            await response.json();


        console.log(
            "Password reset OTP verification response:",
            data
        );


        if (!response.ok) {

            return {

                success: false,

                message:
                    data?.message ||
                    "OTP verify করা যায়নি",
            };
        }


        if (
            data?.success !== true
        ) {

            return {

                success: false,

                message:
                    data?.message ||
                    "OTP verify করা যায়নি",
            };
        }


        return {

            success: true,

            message:
                data?.message ||
                "OTP সফলভাবে verify হয়েছে",

            resetToken:
                data?.resetToken,

            expiresIn:
                data?.expiresIn,
        };


    } catch (error) {

        console.error(
            "Verify admin password reset OTP API error:",
            error
        );


        return {

            success: false,

            message:
                "Server-এর সাথে সংযোগ করা যাচ্ছে না",
        };
    }
}


/* --------------------------------------------------------------------------
   Reset Admin Password
   -------------------------------------------------------------------------- */

export async function resetAdminPassword(
    adminId: string,
    resetToken: string,
    newPassword: string,
    rePassword: string
): Promise<{
    success: boolean;
    message: string;
}> {

    const normalizedAdminId =
        String(adminId ?? "")
            .trim()
            .toUpperCase();


    try {

        console.log(
            "Resetting admin password:",
            {
                adminId:
                    normalizedAdminId,
            }
        );


        const response =
            await fetch(
                `${API_URL}/api/admin/forgot-password/${encodeURIComponent(
                    normalizedAdminId
                )}/reset-password`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            resetToken,

                            newPassword,

                            rePassword,
                        }),
                }
            );


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            const text =
                await response.text();

            console.error(
                "Reset password non-JSON response:",
                text
            );

            return {

                success: false,

                message:
                    "Server থেকে সঠিক response পাওয়া যায়নি।",
            };
        }


        const data =
            await response.json();


        console.log(
            "Reset admin password response:",
            data
        );


        if (!response.ok) {

            return {

                success: false,

                message:
                    data?.message ||
                    "Password reset করা যায়নি",
            };
        }


        if (
            data?.success !== true
        ) {

            return {

                success: false,

                message:
                    data?.message ||
                    "Password reset করা যায়নি",
            };
        }


        return {

            success: true,

            message:
                data?.message ||
                "Password সফলভাবে reset হয়েছে",
        };


    } catch (error) {

        console.error(
            "Reset admin password API error:",
            error
        );


        return {

            success: false,

            message:
                "Server-এর সাথে সংযোগ করা যাচ্ছে না",
        };
    }
}


/* ==========================================================================
   ADMIN PENDING DEPOSITS
   ========================================================================== */

/*
|--------------------------------------------------------------------------
| Pending Deposit Types
|--------------------------------------------------------------------------
*/

export type AdminPendingDepositStatus =
    | "PENDING"
    | "APPROVED"
    | "REJECTED";

export type AdminDepositPaymentMethod =
    | "cash"
    | "bkash";

export type AdminPendingDeposit = {
    rowIndex: number;
    requestId: string;
    memberId: string;
    memberName: string;
    shareCount: number;
    weeklyAmount: number;
    weeks: number;
    depositAmount: number;
    bkashCharge: number;
    payableAmount: number;
    paymentMethod: AdminDepositPaymentMethod;
    senderNumber: string;
    status: AdminPendingDepositStatus;
    requestDate: string;
    approvedDate: string;
    adminId: string;
    notes: string;
};

/* ==========================================================================
   ADMIN WEEKLY DEPOSIT
   ========================================================================== */

/*
|--------------------------------------------------------------------------
| Create Admin Weekly Deposit Types
|--------------------------------------------------------------------------
*/

export type CreateAdminWeeklyDepositResult = {
    success: boolean;
    message: string;

    deposit?: {
        requestId: string;
        memberId: string;
        memberName: string;
        shareCount: number;
        weeklyAmount: number;
        weeks: number;
        depositAmount: number;
        paymentMethod: AdminDepositPaymentMethod;
        collectionWeek: number;
        allocationWeek: number;
        latestCoveredWeek: number;
        allocatedWeeks: number[];
        weeklyEntries: number;
        advanceEntries: 0;
        status: "APPROVED";
        approvedDate: string;
        adminId: string;
    };
};


/* ==========================================================================
   CREATE ADMIN WEEKLY DEPOSIT
   ========================================================================== */

export async function createAdminWeeklyDeposit(
    memberId: string,
    weeks: number,
    paymentMethod: AdminDepositPaymentMethod
): Promise<CreateAdminWeeklyDepositResult> {

    const normalizedMemberId =
        String(
            memberId ?? ""
        ).trim();

    const normalizedWeeks =
        Number(weeks);

    const normalizedPaymentMethod =
        String(
            paymentMethod ?? ""
        )
            .trim()
            .toLowerCase();


    /*
     * ---------------------------------------------------------------
     * Basic validation
     * ---------------------------------------------------------------
     */

    if (
        !normalizedMemberId
    ) {

        return {

            success: false,

            message:
                "Member নির্বাচন করুন।",
        };
    }


    if (
        !Number.isInteger(
            normalizedWeeks
        ) ||
        normalizedWeeks < 1
    ) {

        return {

            success: false,

            message:
                "সঠিক সংখ্যক সপ্তাহ দিন।",
        };
    }


    if (
        normalizedPaymentMethod !== "cash" &&
        normalizedPaymentMethod !== "bkash"
    ) {

        return {

            success: false,

            message:
                "সঠিক Payment Method নির্বাচন করুন।",
        };
    }


    try {

        /*
         * ---------------------------------------------------------------
         * Restore admin session if necessary
         * ---------------------------------------------------------------
         */

        if (
            !currentAdminSessionToken
        ) {

            await restoreAdminSession();
        }


        /*
         * ---------------------------------------------------------------
         * Check admin session
         * ---------------------------------------------------------------
         */

        if (
            !currentAdminSessionToken
        ) {

            return {

                success: false,

                message:
                    "Admin session পাওয়া যায়নি। আবার login করুন।",
            };
        }


        /*
         * ---------------------------------------------------------------
         * Get current Admin ID
         * ---------------------------------------------------------------
         */

        const adminId =
            String(
                currentAdmin?.adminId ?? ""
            ).trim();


        if (
            !adminId
        ) {

            return {

                success: false,

                message:
                    "Admin ID পাওয়া যায়নি। আবার login করুন।",
            };
        }


        console.log(
            "Creating admin weekly deposit:",
            {
                memberId:
                    normalizedMemberId,

                weeks:
                    normalizedWeeks,

                paymentMethod:
                    normalizedPaymentMethod,

                adminId,
            }
        );


        /*
         * ---------------------------------------------------------------
         * API Request
         * ---------------------------------------------------------------
         */

        const response =
            await fetch(
                `${API_URL}/api/admin/weekly-deposit`,
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",

                        ...getAdminAuthHeaders(),
                    },

                    body:
                        JSON.stringify({

                            memberId:
                                normalizedMemberId,

                            weeks:
                                normalizedWeeks,

                            paymentMethod:
                                normalizedPaymentMethod,

                            adminId,
                        }),
                }
            );


        /*
         * ---------------------------------------------------------------
         * Response Type Check
         * ---------------------------------------------------------------
         */

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            const text =
                await response.text();

            console.error(
                "Create admin weekly deposit non-JSON response:",
                text
            );

            return {

                success: false,

                message:
                    "Server থেকে সঠিক response পাওয়া যায়নি।",
            };
        }


        /*
         * ---------------------------------------------------------------
         * Parse Response
         * ---------------------------------------------------------------
         */

        const data =
            await response.json();


        console.log(
            "Create admin weekly deposit response:",
            data
        );


        /*
         * ---------------------------------------------------------------
         * API Error
         * ---------------------------------------------------------------
         */

        if (
            !response.ok
        ) {

            return {

                success: false,

                message:
                    data?.message ||
                    "Weekly Deposit তৈরি করা যায়নি।",
            };
        }


        /*
         * ---------------------------------------------------------------
         * Backend Success Check
         * ---------------------------------------------------------------
         */

        if (
            data?.success !== true
        ) {

            return {

                success: false,

                message:
                    data?.message ||
                    "Weekly Deposit তৈরি করা যায়নি।",
            };
        }


        /*
         * ---------------------------------------------------------------
         * Success
         * ---------------------------------------------------------------
         */

        return {

            success: true,

            message:
                data?.message ||
                "Weekly Deposit সফলভাবে তৈরি হয়েছে।",

            deposit:
                data?.deposit,
        };


    } catch (error) {

        console.error(
            "Create admin weekly deposit API error:",
            error
        );

        return {

            success: false,

            message:
                "Server-এর সাথে সংযোগ করা যাচ্ছে না।",
        };
    }
}

/* ==========================================================================
   ADMIN WEEKLY DEPOSIT HISTORY
   ========================================================================== */

export type AdminWeeklyHistoryStatus =
    | "APPROVED"
    | "REJECTED";

export type AdminWeeklyHistoryRecord = {
    rowIndex: number;
    requestId: string;
    memberId: string;
    memberName: string;
    shareCount: number;
    weeklyAmount: number;
    weeks: number;
    depositAmount: number;
    bkashCharge: number;
    payableAmount: number;
    paymentMethod: AdminDepositPaymentMethod;
    senderNumber: string;
    status: AdminWeeklyHistoryStatus;
    requestDate: string;
    approvedDate: string;
    adminId: string;
    notes: string;
};

export type GetAdminWeeklyHistoryResult = {
    success: boolean;
    message: string;
    requests?: AdminWeeklyHistoryRecord[];
};


/* ==========================================================================
   GET ADMIN WEEKLY DEPOSIT HISTORY
   ========================================================================== */

export async function getAdminWeeklyHistory():
    Promise<GetAdminWeeklyHistoryResult> {

    try {

        /*
         * ---------------------------------------------------------------
         * Restore admin session if necessary
         * ---------------------------------------------------------------
         */

        if (
            !currentAdminSessionToken
        ) {

            await restoreAdminSession();
        }


        /*
         * ---------------------------------------------------------------
         * Check admin session
         * ---------------------------------------------------------------
         */

        if (
            !currentAdminSessionToken
        ) {

            return {

                success: false,

                message:
                    "Admin session পাওয়া যায়নি। আবার login করুন।",

            };
        }


        /*
         * ---------------------------------------------------------------
         * API Request
         * ---------------------------------------------------------------
         */

        const response =
            await fetch(
                `${API_URL}/api/admin/pending-deposits`,
                {
                    method: "GET",

                    headers: {

                        Accept:
                            "application/json",

                        ...getAdminAuthHeaders(),

                    },

                }
            );


        /*
         * ---------------------------------------------------------------
         * Response type check
         * ---------------------------------------------------------------
         */

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            const text =
                await response.text();

            console.error(
                "Get admin weekly history non-JSON response:",
                text
            );

            return {

                success: false,

                message:
                    "Server থেকে সঠিক response পাওয়া যায়নি।",

            };
        }


        /*
         * ---------------------------------------------------------------
         * Parse response
         * ---------------------------------------------------------------
         */

        const data =
            await response.json();


        console.log(
            "Admin weekly history response:",
            data
        );


        /*
         * ---------------------------------------------------------------
         * API error
         * ---------------------------------------------------------------
         */

        if (
            !response.ok
        ) {

            return {

                success: false,

                message:
                    data?.message ||
                    "Weekly history পাওয়া যায়নি।",

            };
        }


        /*
         * ---------------------------------------------------------------
         * Get requests
         * ---------------------------------------------------------------
         */

        const requests =
            Array.isArray(
                data?.requests
            )
                ? data.requests
                : Array.isArray(
                    data?.data
                )
                    ? data.data
                    : [];


        /*
         * ---------------------------------------------------------------
         * IMPORTANT
         *
         * History-তে PENDING থাকবে না।
         *
         * শুধু APPROVED এবং REJECTED থাকবে।
         * ---------------------------------------------------------------
         */

        const historyRecords =
            requests.filter(
                (
                    item: AdminPendingDeposit
                ) =>
                    item.status === "APPROVED" ||
                    item.status === "REJECTED"
            );


        return {

            success:
                data?.success === true,

            message:
                data?.message ||
                "Weekly history পাওয়া গেছে।",

            requests:
                historyRecords,

        };


    } catch (error) {

        console.error(
            "Get admin weekly history API error:",
            error
        );

        return {

            success: false,

            message:
                "Server-এর সাথে সংযোগ করা যাচ্ছে না।",

        };
    }
}


/*
|--------------------------------------------------------------------------
| Get Pending Deposits Result
|--------------------------------------------------------------------------
*/

export type GetPendingAdminDepositsResult = {
    success: boolean;
    message: string;
    requests?: AdminPendingDeposit[];
};


/*
|--------------------------------------------------------------------------
| Approve Pending Deposit Result
|--------------------------------------------------------------------------
*/

export type ApprovePendingAdminDepositResult = {
    success: boolean;
    message: string;

    request?: {
        requestId: string;
        memberId: string;
        memberName: string;
        shareCount: number;
        weeklyAmount: number;
        weeks: number;
        depositAmount: number;
        paymentMethod: AdminDepositPaymentMethod;
        collectionWeek: number;
        allocationWeek: number;
        latestCoveredWeek: number;
        allocatedWeeks: number[];
        weeklyEntries: number;
        advanceEntries: number;
        status: "APPROVED";
        approvedDate: string;
        adminId: string;
    };
};


/*
|--------------------------------------------------------------------------
| Reject Pending Deposit Result
|--------------------------------------------------------------------------
*/

export type RejectPendingAdminDepositResult = {
    success: boolean;
    message: string;

    request?: {
        requestId: string;
        memberId: string;
        memberName: string;
        status: "REJECTED";
        rejectedDate?: string;
        adminId: string;
        notes: string;
    };
};


/* ==========================================================================
   GET PENDING ADMIN DEPOSITS
   ========================================================================== */

export async function getPendingAdminDeposits():
    Promise<GetPendingAdminDepositsResult> {

    try {

        /*
         * ---------------------------------------------------------------
         * Restore session if necessary
         * ---------------------------------------------------------------
         */

        if (
            !currentAdminSessionToken
        ) {

            await restoreAdminSession();
        }


        /*
         * ---------------------------------------------------------------
         * Check admin session
         * ---------------------------------------------------------------
         */

        if (
            !currentAdminSessionToken
        ) {

            return {

                success: false,

                message:
                    "Admin session পাওয়া যায়নি। আবার login করুন।",
            };
        }


        console.log(
            "Getting pending admin deposits:",
            {
                adminId:
                    currentAdmin?.adminId,
            }
        );


        /*
         * ---------------------------------------------------------------
         * API Request
         * ---------------------------------------------------------------
         */

        const response =
            await fetch(
                `${API_URL}/api/admin/pending-deposits`,
                {
                    method: "GET",

                    headers: {

                        Accept:
                            "application/json",

                        ...getAdminAuthHeaders(),
                    },
                }
            );


        /*
         * ---------------------------------------------------------------
         * Response Type Check
         * ---------------------------------------------------------------
         */

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            const text =
                await response.text();

            console.error(
                "Get pending deposits non-JSON response:",
                text
            );

            return {

                success: false,

                message:
                    "Server থেকে সঠিক response পাওয়া যায়নি।",
            };
        }


        /*
         * ---------------------------------------------------------------
         * Parse Response
         * ---------------------------------------------------------------
         */

        const data =
            await response.json();


        console.log(
            "Pending deposits response:",
            data
        );


        /*
         * ---------------------------------------------------------------
         * API Error
         * ---------------------------------------------------------------
         */

        if (
            !response.ok
        ) {

            return {

                success: false,

                message:
                    data?.message ||
                    "Pending deposit list পাওয়া যায়নি।",
            };
        }


        /*
         * ---------------------------------------------------------------
         * Success
         * ---------------------------------------------------------------
         */

        return {

            success:
                data?.success === true,

            message:
                data?.message ||
                "Pending deposit list পাওয়া গেছে।",

            requests:
                Array.isArray(data?.requests)
                    ? data.requests
                    : Array.isArray(data?.data)
                        ? data.data
                        : [],
        };


    } catch (error) {

        console.error(
            "Get pending admin deposits API error:",
            error
        );

        return {

            success: false,

            message:
                "Server-এর সাথে সংযোগ করা যাচ্ছে না।",
        };
    }
}

export async function getAdminDepositHistory():
    Promise<GetPendingAdminDepositsResult> {
    try {
        if (!currentAdminSessionToken) {
            await restoreAdminSession();
        }

        if (!currentAdminSessionToken) {
            return {
                success: false,
                message:
                    "Admin session পাওয়া যায়নি। আবার login করুন।",
            };
        }

        console.log(
            "Getting admin deposit history:",
            {
                adminId:
                    currentAdmin?.adminId,
            }
        );

        const response =
            await fetch(
                `${API_URL}/api/admin/deposit-history`,
                {
                    method: "GET",
                    headers: {
                        Accept:
                            "application/json",
                        ...getAdminAuthHeaders(),
                    },
                }
            );

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        if (
            !contentType.includes(
                "application/json"
            )
        ) {
            const text =
                await response.text();

            console.error(
                "Get admin deposit history non-JSON response:",
                text
            );

            return {
                success: false,
                message:
                    "Server থেকে সঠিক response পাওয়া যায়নি।",
            };
        }

        const data =
            await response.json();

        console.log(
            "Admin deposit history response:",
            data
        );

        if (!response.ok) {
            return {
                success: false,
                message:
                    data?.message ||
                    "Deposit history পাওয়া যায়নি।",
            };
        }

        return {
            success:
                data?.success === true,

            message:
                data?.message ||
                "Deposit history পাওয়া গেছে।",

            requests:
                Array.isArray(
                    data?.requests
                )
                    ? data.requests
                    : Array.isArray(
                        data?.data
                    )
                        ? data.data
                        : [],
        };

    } catch (error) {

        console.error(
            "Get admin deposit history API error:",
            error
        );

        return {
            success: false,
            message:
                "Server-এর সাথে সংযোগ করা যাচ্ছে না।",
        };
    }
}



/* ==========================================================================
   APPROVE PENDING ADMIN DEPOSIT
   ========================================================================== */

export async function approvePendingAdminDeposit(
    requestId: string
): Promise<ApprovePendingAdminDepositResult> {

    const normalizedRequestId =
        String(
            requestId ?? ""
        ).trim();


    /*
     * ---------------------------------------------------------------
     * Request ID validation
     * ---------------------------------------------------------------
     */

    if (
        !normalizedRequestId
    ) {

        return {

            success: false,

            message:
                "Request ID পাওয়া যায়নি।",
        };
    }


    try {

        /*
         * ---------------------------------------------------------------
         * Restore session if necessary
         * ---------------------------------------------------------------
         */

        if (
            !currentAdminSessionToken
        ) {

            await restoreAdminSession();
        }


        /*
         * ---------------------------------------------------------------
         * Check admin session
         * ---------------------------------------------------------------
         */

        if (
            !currentAdminSessionToken
        ) {

            return {

                success: false,

                message:
                    "Admin session পাওয়া যায়নি। আবার login করুন।",
            };
        }


        const adminId =
            String(
                currentAdmin?.adminId ?? ""
            ).trim();


        if (
            !adminId
        ) {

            return {

                success: false,

                message:
                    "Admin ID পাওয়া যায়নি। আবার login করুন।",
            };
        }


        console.log(
            "Approving pending admin deposit:",
            {
                requestId:
                    normalizedRequestId,

                adminId,
            }
        );


        /*
         * ---------------------------------------------------------------
         * API Request
         * ---------------------------------------------------------------
         */

        const response =
            await fetch(
                `${API_URL}/api/admin/pending-deposits/${encodeURIComponent(
                    normalizedRequestId
                )}/approve`,
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",

                        ...getAdminAuthHeaders(),
                    },

                    body:
                        JSON.stringify({
                            adminId,
                        }),
                }
            );


        /*
         * ---------------------------------------------------------------
         * Response Type Check
         * ---------------------------------------------------------------
         */

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            const text =
                await response.text();

            console.error(
                "Approve deposit non-JSON response:",
                text
            );

            return {

                success: false,

                message:
                    "Server থেকে সঠিক response পাওয়া যায়নি।",
            };
        }


        /*
         * ---------------------------------------------------------------
         * Parse Response
         * ---------------------------------------------------------------
         */

        const data =
            await response.json();


        console.log(
            "Approve pending deposit response:",
            data
        );


        /*
         * ---------------------------------------------------------------
         * API Error
         * ---------------------------------------------------------------
         */

        if (
            !response.ok
        ) {

            return {

                success: false,

                message:
                    data?.message ||
                    "Deposit approve করা যায়নি।",
            };
        }


        /*
         * ---------------------------------------------------------------
         * Backend Success Check
         * ---------------------------------------------------------------
         */

        if (
            data?.success !== true
        ) {

            return {

                success: false,

                message:
                    data?.message ||
                    "Deposit approve করা যায়নি।",
            };
        }


        /*
         * ---------------------------------------------------------------
         * Success
         * ---------------------------------------------------------------
         */

        return {

            success: true,

            message:
                data?.message ||
                "Deposit সফলভাবে approve হয়েছে।",

            request:
                data?.request,
        };


    } catch (error) {

        console.error(
            "Approve pending admin deposit API error:",
            error
        );

        return {

            success: false,

            message:
                "Server-এর সাথে সংযোগ করা যাচ্ছে না।",
        };
    }
}


/* ==========================================================================
   REJECT PENDING ADMIN DEPOSIT
   ========================================================================== */

export async function rejectPendingAdminDeposit(
    requestId: string,
    notes: string = ""
): Promise<RejectPendingAdminDepositResult> {

    const normalizedRequestId =
        String(
            requestId ?? ""
        ).trim();

    const normalizedNotes =
        String(
            notes ?? ""
        ).trim();


    /*
     * ---------------------------------------------------------------
     * Request ID validation
     * ---------------------------------------------------------------
     */

    if (
        !normalizedRequestId
    ) {

        return {

            success: false,

            message:
                "Request ID পাওয়া যায়নি।",
        };
    }


    try {

        /*
         * ---------------------------------------------------------------
         * Restore session if necessary
         * ---------------------------------------------------------------
         */

        if (
            !currentAdminSessionToken
        ) {

            await restoreAdminSession();
        }


        /*
         * ---------------------------------------------------------------
         * Check admin session
         * ---------------------------------------------------------------
         */

        if (
            !currentAdminSessionToken
        ) {

            return {

                success: false,

                message:
                    "Admin session পাওয়া যায়নি। আবার login করুন।",
            };
        }


        const adminId =
            String(
                currentAdmin?.adminId ?? ""
            ).trim();


        if (
            !adminId
        ) {

            return {

                success: false,

                message:
                    "Admin ID পাওয়া যায়নি। আবার login করুন।",
            };
        }


        console.log(
            "Rejecting pending admin deposit:",
            {
                requestId:
                    normalizedRequestId,

                adminId,

                notes:
                    normalizedNotes,
            }
        );


        /*
         * ---------------------------------------------------------------
         * API Request
         * ---------------------------------------------------------------
         */

        const response =
            await fetch(
                `${API_URL}/api/admin/pending-deposits/${encodeURIComponent(
                    normalizedRequestId
                )}/reject`,
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",

                        ...getAdminAuthHeaders(),
                    },

                    body:
                        JSON.stringify({

                            adminId,

                            notes:
                                normalizedNotes,
                        }),
                }
            );


        /*
         * ---------------------------------------------------------------
         * Response Type Check
         * ---------------------------------------------------------------
         */

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            const text =
                await response.text();

            console.error(
                "Reject deposit non-JSON response:",
                text
            );

            return {

                success: false,

                message:
                    "Server থেকে সঠিক response পাওয়া যায়নি।",
            };
        }


        /*
         * ---------------------------------------------------------------
         * Parse Response
         * ---------------------------------------------------------------
         */

        const data =
            await response.json();


        console.log(
            "Reject pending deposit response:",
            data
        );


        /*
         * ---------------------------------------------------------------
         * API Error
         * ---------------------------------------------------------------
         */

        if (
            !response.ok
        ) {

            return {

                success: false,

                message:
                    data?.message ||
                    "Deposit reject করা যায়নি।",
            };
        }


        /*
         * ---------------------------------------------------------------
         * Backend Success Check
         * ---------------------------------------------------------------
         */

        if (
            data?.success !== true
        ) {

            return {

                success: false,

                message:
                    data?.message ||
                    "Deposit reject করা যায়নি।",
            };
        }


        /*
         * ---------------------------------------------------------------
         * Success
         * ---------------------------------------------------------------
         */

        return {

            success: true,

            message:
                data?.message ||
                "Deposit সফলভাবে reject হয়েছে।",

            request:
                data?.request,
        };


    } catch (error) {

        console.error(
            "Reject pending admin deposit API error:",
            error
        );

        return {

            success: false,

            message:
                "Server-এর সাথে সংযোগ করা যাচ্ছে না।",
        };
    }
}