
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL =
    process.env.EXPO_PUBLIC_API_URL;

/*
|--------------------------------------------------------------------------
| Member Session Storage
|--------------------------------------------------------------------------
*/

const MEMBER_SESSION_KEY =
    '@khudro_sanchoy_member_session';

/*
|--------------------------------------------------------------------------
| Member
|--------------------------------------------------------------------------
*/

export type Member = {
    memberId: string;
    memberName: string;
    phone: string;
    email: string;
    joinDate: string;
    currentShareCount: number;
    currentWeeklyAmount: number;
    status: string;
};

/*
|--------------------------------------------------------------------------
| Dashboard Summary
|--------------------------------------------------------------------------
*/

export type MemberDashboardSummary = {
    currentWeeklyPaid: number;
    currentAdvance: number;
    lastPaymentDate: string;
    latestWeek: number;
    currentWeekPaid: number;
    currentWeekAdvanceAdded: number;
};

/*
|--------------------------------------------------------------------------
| Dashboard Result
|--------------------------------------------------------------------------
*/

export type MemberDashboardResult = {
    success: boolean;
    message: string;
    member?: Member;
    summary?: MemberDashboardSummary;
};

/*
|--------------------------------------------------------------------------
| Change PIN Result
|--------------------------------------------------------------------------
*/

export type ChangeMemberPinResult = {
    success: boolean;
    message: string;
};

/*
|--------------------------------------------------------------------------
| Login Result
|--------------------------------------------------------------------------
*/

export type MemberLoginResult = {
    success: boolean;
    message: string;
    code?: string;
    member?: Member;
};

/*
|--------------------------------------------------------------------------
| Registration Result
|--------------------------------------------------------------------------
*/

export type MemberRegistrationResult = {
    success: boolean;
    message: string;
    code?: string;
    expiresIn?: number;
    resendAfter?: number;
};

/*
|--------------------------------------------------------------------------
| Current Member Session
|--------------------------------------------------------------------------
|
| currentMember:
| - Fast in-memory access
|
| AsyncStorage:
| - Persistent session
| - App reload হলেও session থাকবে
|
|--------------------------------------------------------------------------
*/

let currentMember: Member | null =
    null;

/*
|--------------------------------------------------------------------------
| Save Member Session
|--------------------------------------------------------------------------
*/

async function saveMemberSession(
    member: Member
): Promise<void> {
    try {
        currentMember = member;

        await AsyncStorage.setItem(
            MEMBER_SESSION_KEY,
            JSON.stringify(member)
        );

        console.log(
            'Member session saved:',
            member.memberId
        );
    } catch (error) {
        console.error(
            'Failed to save member session:',
            error
        );
    }
}

/*
|--------------------------------------------------------------------------
| Restore Member Session
|--------------------------------------------------------------------------
*/

async function restoreMemberSession(): Promise<Member | null> {
    try {
        const storedMember =
            await AsyncStorage.getItem(
                MEMBER_SESSION_KEY
            );

        if (!storedMember) {
            console.log(
                'No stored member session found'
            );

            return null;
        }

        const parsedMember =
            JSON.parse(storedMember);

        if (
            !parsedMember ||
            !parsedMember.memberId
        ) {
            console.log(
                'Stored member session is invalid'
            );

            await AsyncStorage.removeItem(
                MEMBER_SESSION_KEY
            );

            return null;
        }

        currentMember =
            parsedMember as Member;

        console.log(
            'Member session restored:',
            currentMember.memberId
        );

        return currentMember;
    } catch (error) {
        console.error(
            'Failed to restore member session:',
            error
        );

        currentMember = null;

        return null;
    }
}


/*
|--------------------------------------------------------------------------
| Current Member
|--------------------------------------------------------------------------
*/

export async function getCurrentMember(): Promise<{
    success: boolean;
    message: string;
    member?: Member;
}> {
    console.log(
        '========== getCurrentMember =========='
    );

    console.log(
        'In-memory currentMember:',
        currentMember
    );

    /*
     * First check in-memory session.
     */
    if (currentMember?.memberId) {
        console.log(
            'Member found in memory:',
            currentMember.memberId
        );

        return {
            success: true,
            message: 'Member found',
            member:
                currentMember,
        };
    }

    /*
     * If memory session is empty,
     * restore it from AsyncStorage.
     */
    console.log(
        'Memory session empty. Restoring from AsyncStorage...'
    );

    const restoredMember =
        await restoreMemberSession();

    console.log(
        'Restored member:',
        restoredMember
    );

    if (
        !restoredMember?.memberId
    ) {
        console.log(
            '❌ No member session found'
        );

        return {
            success: false,
            message:
                'Member session পাওয়া যায়নি। আবার login করুন।',
        };
    }

    console.log(
        '✅ Member session restored:',
        restoredMember.memberId
    );

    return {
        success: true,
        message: 'Member session restored',
        member:
            restoredMember,
    };
}



/*
|--------------------------------------------------------------------------
| Change Member PIN
|--------------------------------------------------------------------------
*/

export async function changeMemberPin(
    memberId: string,
    currentPin: string,
    newPin: string
): Promise<ChangeMemberPinResult> {
    try {
        console.log(
            'Change PIN request:',
            {
                memberId,
            }
        );

        const response =
            await fetch(
                `${API_URL}/api/mobile/auth/change-pin/${encodeURIComponent(
                    memberId
                )}`,
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Accept:
                            'application/json',
                    },

                    body:
                        JSON.stringify({
                            currentPin,
                            newPin,
                            confirmPin: newPin,
                        }),
                }
            );

        const contentType =
            response.headers.get(
                'content-type'
            ) || '';

        if (
            !contentType.includes(
                'application/json'
            )
        ) {
            const text =
                await response.text();

            console.error(
                'Change PIN non-JSON response:',
                text
            );

            return {
                success: false,
                message:
                    'Server থেকে সঠিক response পাওয়া যায়নি।',
            };
        }

        const data =
            await response.json();

        console.log(
            'Change PIN response:',
            data
        );

        if (!response.ok) {
            return {
                success: false,
                message:
                    data?.message ||
                    'PIN পরিবর্তন করা যায়নি',
            };
        }

        return {
            success:
                data?.success === true,

            message:
                data?.message ||
                (
                    data?.success
                        ? 'PIN successfully changed'
                        : 'PIN পরিবর্তন করা যায়নি'
                ),
        };
    } catch (error) {
        console.error(
            'Member change PIN API error:',
            error
        );

        return {
            success: false,
            message:
                'Server-এর সাথে সংযোগ করা যাচ্ছে না',
        };
    }
}

/*
|--------------------------------------------------------------------------
| Member Change Gmail
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Verify Member PIN for Gmail Change
|--------------------------------------------------------------------------
|
| POST /api/mobile/auth/change-email/verify-pin
|
|--------------------------------------------------------------------------
*/

export async function verifyMemberEmailChangePin(
    memberId: string,
    pin: string
) {
    try {
        console.log(
            'Member email change PIN verification request:',
            {
                memberId,
            }
        );

        const response =
            await fetch(
                `${API_URL}/api/mobile/auth/change-email/verify-pin`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Accept:
                            'application/json',
                    },

                    body:
                        JSON.stringify({
                            memberId,
                            pin,
                        }),
                }
            );

        const contentType =
            response.headers.get(
                'content-type'
            ) || '';

        if (
            !contentType.includes(
                'application/json'
            )
        ) {
            const text =
                await response.text();

            console.error(
                'Member email change PIN non-JSON response:',
                text
            );

            throw new Error(
                'Server থেকে সঠিক response পাওয়া যায়নি।'
            );
        }

        const data =
            await response.json();

        console.log(
            'Member email change PIN response:',
            data
        );

        if (!response.ok) {
            const error =
                new Error(
                    data?.message ||
                        'PIN verification failed'
                ) as Error & {
                    code?: string;
                };

            error.code =
                data?.code;

            throw error;
        }

        return data;
    } catch (error) {
        console.error(
            'Member email change PIN API error:',
            error
        );

        throw error;
    }
}

/*
|--------------------------------------------------------------------------
| Send Member Gmail Change OTP
|--------------------------------------------------------------------------
|
| POST /api/mobile/auth/change-email/send-otp
|
|--------------------------------------------------------------------------
*/

export async function sendMemberEmailChangeOTP(
    authorizationToken: string,
    newEmail: string
) {
    try {
        console.log(
            'Member email change OTP request:',
            {
                newEmail,
            }
        );

        const response =
            await fetch(
                `${API_URL}/api/mobile/auth/change-email/send-otp`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Accept:
                            'application/json',
                    },

                    body:
                        JSON.stringify({
                            authorizationToken,
                            newEmail,
                        }),
                }
            );

        const contentType =
            response.headers.get(
                'content-type'
            ) || '';

        if (
            !contentType.includes(
                'application/json'
            )
        ) {
            const text =
                await response.text();

            console.error(
                'Member email change OTP non-JSON response:',
                text
            );

            throw new Error(
                'Server থেকে সঠিক response পাওয়া যায়নি।'
            );
        }

        const data =
            await response.json();

        console.log(
            'Member email change OTP response:',
            data
        );

        if (!response.ok) {
            const error =
                new Error(
                    data?.message ||
                        'OTP পাঠানো যায়নি'
                ) as Error & {
                    code?: string;
                    resendAfter?: number;
                };

            error.code =
                data?.code;

            error.resendAfter =
                data?.resendAfter;

            throw error;
        }

        return data;
    } catch (error) {
        console.error(
            'Member email change OTP API error:',
            error
        );

        throw error;
    }
}

/*
|--------------------------------------------------------------------------
| Resend Member Gmail Change OTP
|--------------------------------------------------------------------------
*/

export async function resendMemberEmailChangeOTP(
    authorizationToken: string,
    newEmail: string
) {
    try {
        console.log(
            'Resend member email change OTP request:',
            {
                newEmail,
            }
        );

        const response =
            await fetch(
                `${API_URL}/api/mobile/auth/change-email/send-otp`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Accept:
                            'application/json',
                    },

                    body:
                        JSON.stringify({
                            authorizationToken,
                            newEmail,
                        }),
                }
            );

        const contentType =
            response.headers.get(
                'content-type'
            ) || '';

        if (
            !contentType.includes(
                'application/json'
            )
        ) {
            const text =
                await response.text();

            console.error(
                'Resend member email change OTP non-JSON response:',
                text
            );

            throw new Error(
                'Server থেকে সঠিক response পাওয়া যায়নি।'
            );
        }

        const data =
            await response.json();

        console.log(
            'Resend member email change OTP response:',
            data
        );

        if (!response.ok) {
            const error =
                new Error(
                    data?.message ||
                        'OTP আবার পাঠানো যায়নি'
                ) as Error & {
                    code?: string;
                    resendAfter?: number;
                };

            error.code =
                data?.code;

            error.resendAfter =
                data?.resendAfter;

            throw error;
        }

        return data;
    } catch (error) {
        console.error(
            'Resend member email change OTP API error:',
            error
        );

        throw error;
    }
}

/*
|--------------------------------------------------------------------------
| Verify Member Gmail Change OTP
|--------------------------------------------------------------------------
*/

export async function verifyMemberEmailChangeOTP(
    authorizationToken: string,
    otp: string
) {
    try {
        console.log(
            'Member email change OTP verification request'
        );

        const response =
            await fetch(
                `${API_URL}/api/mobile/auth/change-email/verify-otp`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Accept:
                            'application/json',
                    },

                    body:
                        JSON.stringify({
                            authorizationToken,
                            otp,
                        }),
                }
            );

        const contentType =
            response.headers.get(
                'content-type'
            ) || '';

        if (
            !contentType.includes(
                'application/json'
            )
        ) {
            const text =
                await response.text();

            console.error(
                'Member email change verification non-JSON response:',
                text
            );

            throw new Error(
                'Server থেকে সঠিক response পাওয়া যায়নি।'
            );
        }

        const data =
            await response.json();

        console.log(
            'Member email change verification response:',
            data
        );

        if (!response.ok) {
            const error =
                new Error(
                    data?.message ||
                        'OTP verification failed'
                ) as Error & {
                    code?: string;
                };

            error.code =
                data?.code;

            throw error;
        }

        return data;
    } catch (error) {
        console.error(
            'Member email change OTP verification API error:',
            error
        );

        throw error;
    }
}

/*
|--------------------------------------------------------------------------
| Member Login
|--------------------------------------------------------------------------
|
| Login:
| Phone Number + PIN
|
|--------------------------------------------------------------------------
*/

export async function memberLogin(
    phone: string,
    pin: string
): Promise<MemberLoginResult> {
    try {
        console.log(
            'Member login request:',
            {
                phone,
            }
        );

        const response =
            await fetch(
                `${API_URL}/api/mobile/auth/login`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Accept:
                            'application/json',
                    },

                    body:
                        JSON.stringify({
                            phone,
                            pin,
                        }),
                }
            );

        const contentType =
            response.headers.get(
                'content-type'
            ) || '';

        if (
            !contentType.includes(
                'application/json'
            )
        ) {
            const text =
                await response.text();

            console.error(
                'Member login non-JSON response:',
                text
            );

            return {
                success: false,
                message:
                    'Server থেকে সঠিক response পাওয়া যায়নি।',
            };
        }

        const data =
            await response.json();

        console.log(
            'Member login response:',
            data
        );

        if (!response.ok) {
            return {
                success: false,

                message:
                    data?.message ||
                    'Member login failed',

                code:
                    data?.code,
            };
        }

        /*
         * Save member both:
         *
         * 1. In memory
         * 2. AsyncStorage
         *
         * So the session survives app reload.
         */
        if (
            data?.success &&
            data?.member
        ) {
            await saveMemberSession(
                data.member
            );
        }

        return {
            success:
                data?.success === true,

            message:
                data?.message ||
                (
                    data?.success
                        ? 'Login successful'
                        : 'Member login failed'
                ),

            code:
                data?.code,

            member:
                data?.member,
        };
    } catch (error) {
        console.error(
            'Member login API error:',
            error
        );

        return {
            success: false,
            message:
                'Server-এর সাথে সংযোগ করা যাচ্ছে না',
        };
    }
}

/*
|--------------------------------------------------------------------------
| Create Member Account
|--------------------------------------------------------------------------
*/

export async function registerMemberAccount(
    memberId: string,
    memberName: string,
    phone: string,
    email: string,
    pin: string,
    confirmPin: string,
    language: 'bn' | 'en'
): Promise<MemberRegistrationResult> {
    try {
        console.log(
            'Member registration request:',
            {
                memberId,
                memberName,
                phone,
                email,
                language,
            }
        );

        const response =
            await fetch(
                `${API_URL}/api/mobile/auth/register`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Accept:
                            'application/json',
                    },

                    body:
                        JSON.stringify({
                            memberId,
                            memberName,
                            phone,
                            email,
                            pin,
                            confirmPin,
                            language,
                        }),
                }
            );

        const contentType =
            response.headers.get(
                'content-type'
            ) || '';

        if (
            !contentType.includes(
                'application/json'
            )
        ) {
            const text =
                await response.text();

            console.error(
                'Member registration non-JSON response:',
                text
            );

            return {
                success: false,

                message:
                    language === 'en'
                        ? 'The server returned an invalid response.'
                        : 'Server থেকে সঠিক response পাওয়া যায়নি।',
            };
        }

        const data =
            await response.json();

        console.log(
            'Member registration response:',
            data
        );

        if (!response.ok) {
            return {
                success: false,

                message:
                    data?.message ||
                    (
                        language === 'en'
                            ? 'Account could not be created.'
                            : 'অ্যাকাউন্ট তৈরি করা যায়নি।'
                    ),

                code:
                    data?.code,

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
                (
                    language === 'en'
                        ? 'OTP has been sent to your Gmail.'
                        : 'আপনার Gmail-এ একটি OTP পাঠানো হয়েছে।'
                ),

            code:
                data?.code,

            expiresIn:
                data?.expiresIn,

            resendAfter:
                data?.resendAfter,
        };
    } catch (error) {
        console.error(
            'Member registration API error:',
            error
        );

        return {
            success: false,

            message:
                language === 'en'
                    ? 'Unable to connect to the server.'
                    : 'Server-এর সাথে সংযোগ করা যাচ্ছে না।',
        };
    }
}

/*
|--------------------------------------------------------------------------
| Verify Member Registration OTP
|--------------------------------------------------------------------------
*/

export async function verifyMemberRegistrationOTP(
    memberId: string,
    otp: string,
    language: 'bn' | 'en'
): Promise<MemberRegistrationResult> {
    try {
        console.log(
            'Member registration OTP verification request:',
            {
                memberId,
            }
        );

        const response =
            await fetch(
                `${API_URL}/api/mobile/auth/register/verify-otp`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Accept:
                            'application/json',
                    },

                    body:
                        JSON.stringify({
                            memberId,
                            otp,
                            language,
                        }),
                }
            );

        const contentType =
            response.headers.get(
                'content-type'
            ) || '';

        if (
            !contentType.includes(
                'application/json'
            )
        ) {
            const text =
                await response.text();

            console.error(
                'OTP verification non-JSON response:',
                text
            );

            return {
                success: false,

                message:
                    language === 'en'
                        ? 'The server returned an invalid response.'
                        : 'Server থেকে সঠিক response পাওয়া যায়নি।',
            };
        }

        const data =
            await response.json();

        console.log(
            'Member registration OTP response:',
            data
        );

        if (!response.ok) {
            return {
                success: false,

                message:
                    data?.message ||
                    (
                        language === 'en'
                            ? 'OTP verification failed.'
                            : 'OTP যাচাই করা যায়নি।'
                    ),

                code:
                    data?.code,

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
                (
                    language === 'en'
                        ? 'Account created successfully.'
                        : 'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।'
                ),

            code:
                data?.code,

            expiresIn:
                data?.expiresIn,

            resendAfter:
                data?.resendAfter,
        };
    } catch (error) {
        console.error(
            'Member registration OTP API error:',
            error
        );

        return {
            success: false,

            message:
                language === 'en'
                    ? 'Unable to connect to the server.'
                    : 'Server-এর সাথে সংযোগ করা যাচ্ছে না।',
        };
    }
}

/*
|--------------------------------------------------------------------------
| Resend Member Registration OTP
|--------------------------------------------------------------------------
*/

export async function resendMemberRegistrationOTP(
    memberId: string,
    language: 'bn' | 'en'
): Promise<MemberRegistrationResult> {
    try {
        console.log(
            'Resend member registration OTP request:',
            {
                memberId,
            }
        );

        const response =
            await fetch(
                `${API_URL}/api/mobile/auth/register/resend-otp`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Accept:
                            'application/json',
                    },

                    body:
                        JSON.stringify({
                            memberId,
                            language,
                        }),
                }
            );

        const contentType =
            response.headers.get(
                'content-type'
            ) || '';

        if (
            !contentType.includes(
                'application/json'
            )
        ) {
            const text =
                await response.text();

            console.error(
                'Resend OTP non-JSON response:',
                text
            );

            return {
                success: false,

                message:
                    language === 'en'
                        ? 'The server returned an invalid response.'
                        : 'Server থেকে সঠিক response পাওয়া যায়নি।',
            };
        }

        const data =
            await response.json();

        console.log(
            'Resend OTP response:',
            data
        );

        if (!response.ok) {
            return {
                success: false,

                message:
                    data?.message ||
                    (
                        language === 'en'
                            ? 'Unable to resend OTP.'
                            : 'OTP আবার পাঠানো যায়নি।'
                    ),

                code:
                    data?.code,

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
                (
                    language === 'en'
                        ? 'A new OTP has been sent to your Gmail.'
                        : 'নতুন OTP আপনার Gmail-এ পাঠানো হয়েছে।'
                ),

            code:
                data?.code,

            expiresIn:
                data?.expiresIn,

            resendAfter:
                data?.resendAfter,
        };
    } catch (error) {
        console.error(
            'Resend OTP API error:',
            error
        );

        return {
            success: false,

            message:
                language === 'en'
                    ? 'Unable to connect to the server.'
                    : 'Server-এর সাথে সংযোগ করা যাচ্ছে না।',
        };
    }
}

/*
|--------------------------------------------------------------------------
| Member Dashboard
|--------------------------------------------------------------------------
*/

export async function getMemberDashboard(
    memberId: string
): Promise<MemberDashboardResult> {
    try {
        console.log(
            'Loading member dashboard:',
            memberId
        );

        const response = await fetch(
            `${API_URL}/api/mobile/auth/dashboard/${encodeURIComponent(
                memberId
            )}`,
            {
                method: 'GET',

                headers: {
                    Accept:
                        'application/json',
                },
            }
        );

        const contentType =
            response.headers.get(
                'content-type'
            ) || '';

        if (
            !contentType.includes(
                'application/json'
            )
        ) {
            const text =
                await response.text();

            console.error(
                'Dashboard non-JSON response:',
                text
            );

            return {
                success: false,
                message:
                    'Server থেকে সঠিক dashboard response পাওয়া যায়নি।',
            };
        }

        const data =
            await response.json();

        console.log(
            'Member dashboard response:',
            data
        );

        if (!response.ok) {
            return {
                success: false,
                message:
                    data?.message ||
                    'Dashboard load করা যায়নি',
            };
        }

        return {
            success:
                data?.success === true,

            message:
                data?.success
                    ? 'Dashboard loaded'
                    : data?.message ||
                      'Dashboard load করা যায়নি',

            member:
                data?.member,

            summary:
                data?.summary,
        };
    } catch (error) {
        console.error(
            'Member dashboard API error:',
            error
        );

        return {
            success: false,
            message:
                'Server-এর সাথে সংযোগ করা যাচ্ছে না',
        };
    }
}

/*
|--------------------------------------------------------------------------
| Update Member Profile
|--------------------------------------------------------------------------
*/

export async function updateMemberProfile(
    memberId: string,
    memberName: string,
    phone: string
): Promise<MemberLoginResult> {
    try {
        console.log(
            'Updating member profile:',
            {
                memberId,
                memberName,
                phone,
            }
        );

        const response =
            await fetch(
                `${API_URL}/api/mobile/auth/profile/${encodeURIComponent(
                    memberId
                )}`,
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Accept:
                            'application/json',
                    },

                    body:
                        JSON.stringify({
                            memberName,
                            phone,
                        }),
                }
            );

        const contentType =
            response.headers.get(
                'content-type'
            ) || '';

        if (
            !contentType.includes(
                'application/json'
            )
        ) {
            const text =
                await response.text();

            console.error(
                'Profile update non-JSON response:',
                text
            );

            return {
                success: false,
                message:
                    'Server থেকে সঠিক response পাওয়া যায়নি।',
            };
        }

        const data =
            await response.json();

        console.log(
            'Profile update response:',
            data
        );

        if (!response.ok) {
            return {
                success: false,
                message:
                    data?.message ||
                    'Profile update করা যায়নি',
            };
        }

        /*
         * Update both memory and persistent session.
         */
        if (
            data?.success &&
            data?.member
        ) {
            await saveMemberSession(
                data.member
            );

            console.log(
                'Updated member saved:',
                data.member
            );
        }

        return {
            success:
                data?.success === true,

            message:
                data?.message ||
                'Profile updated',

            member:
                data?.member,
        };
    } catch (error) {
        console.error(
            'Profile update API error:',
            error
        );

        return {
            success: false,
            message:
                'Server-এর সাথে সংযোগ করা যাচ্ছে না',
        };
    }
}

/*
|--------------------------------------------------------------------------
| Clear Current Member
|--------------------------------------------------------------------------
*/

export async function clearCurrentMember(): Promise<void> {
    currentMember = null;

    try {
        await AsyncStorage.removeItem(
            MEMBER_SESSION_KEY
        );

        console.log(
            'Current member session cleared'
        );
    } catch (error) {
        console.error(
            'Failed to clear member session:',
            error
        );
    }
}

/*
|--------------------------------------------------------------------------
| Deposit Request
|--------------------------------------------------------------------------
*/

export type DepositPaymentMethod =
    'cash' | 'bkash';

export type DepositRequestResult = {
    success: boolean;
    message: string;
    code?: string;

    request?: {
        requestId: string;
        memberId: string;
        memberName: string;
        shareCount: number;
        weeklyAmount: number;
        weeks: number;
        depositAmount: number;
        bkashCharge: number;
        payableAmount: number;
        paymentMethod: DepositPaymentMethod;
        senderNumber: string;
        status: string;
        requestDate: string;
        approvedDate?: string;
        adminId?: string;
        notes?: string;
        rowIndex?: number;
    };
};

/*
|--------------------------------------------------------------------------
| Member Pending Deposits
|--------------------------------------------------------------------------
*/

export type MemberPendingDeposit = {
    requestId: string;
    memberId: string;
    memberName: string;
    shareCount: number;
    weeklyAmount: number;
    weeks: number;
    depositAmount: number;
    bkashCharge: number;
    payableAmount: number;
    paymentMethod: DepositPaymentMethod;
    senderNumber: string;
    status: string;
    requestDate: string;
    approvedDate?: string;
    adminId?: string;
    notes?: string;
    rowIndex?: number;
};

export type MemberPendingDepositsResult = {
    success: boolean;
    message: string;
    requests: MemberPendingDeposit[];
};

/*
|--------------------------------------------------------------------------
| Get Member Pending Deposits
|--------------------------------------------------------------------------
*/

export async function getMemberPendingDeposits(
    memberId: string
): Promise<MemberPendingDepositsResult> {
    try {
        console.log(
            'Loading member pending deposits:',
            memberId
        );

        const response =
            await fetch(
                `${API_URL}/api/mobile/auth/pending-deposits/${encodeURIComponent(
                    memberId
                )}`,
                {
                    method: 'GET',

                    headers: {
                        Accept:
                            'application/json',
                    },
                }
            );

        const contentType =
            response.headers.get(
                'content-type'
            ) || '';

        if (
            !contentType.includes(
                'application/json'
            )
        ) {
            const text =
                await response.text();

            console.error(
                'Pending deposits non-JSON response:',
                text
            );

            return {
                success: false,

                message:
                    'Server থেকে সঠিক response পাওয়া যায়নি।',

                requests: [],
            };
        }

        const data =
            await response.json();

        console.log(
            'Member pending deposits response:',
            data
        );

        if (!response.ok) {
            return {
                success: false,

                message:
                    data?.message ||
                    'Pending deposit load করা যায়নি',

                requests: [],
            };
        }

        return {
            success:
                data?.success === true,

            message:
                data?.message ||
                (
                    data?.success
                        ? 'Pending deposits loaded'
                        : 'Pending deposit load করা যায়নি'
                ),

            requests:
                Array.isArray(
                    data?.requests
                )
                    ? data.requests
                    : [],
        };
    } catch (error) {
        console.error(
            'Member pending deposits API error:',
            error
        );

        return {
            success: false,

            message:
                'Server-এর সাথে সংযোগ করা যাচ্ছে না',

            requests: [],
        };
    }
}

export type MemberDepositHistoryResult = {
    success: boolean;
    message: string;
    requests: MemberPendingDeposit[];
};

/*
|--------------------------------------------------------------------------
| Get Member Deposit History
|--------------------------------------------------------------------------
*/

export async function getMemberDepositHistory(
    memberId: string
): Promise<MemberDepositHistoryResult> {
    try {
        console.log(
            'Loading member deposit history:',
            memberId
        );

        const response =
            await fetch(
                `${API_URL}/api/mobile/auth/deposit-history/${encodeURIComponent(
                    memberId
                )}`,
                {
                    method: 'GET',

                    headers: {
                        Accept:
                            'application/json',
                    },
                }
            );

        const contentType =
            response.headers.get(
                'content-type'
            ) || '';

        if (
            !contentType.includes(
                'application/json'
            )
        ) {
            const text =
                await response.text();

            console.error(
                'Deposit history non-JSON response:',
                text
            );

            return {
                success: false,

                message:
                    'Server থেকে সঠিক response পাওয়া যায়নি।',

                requests: [],
            };
        }

        const data =
            await response.json();

        console.log(
            'Member deposit history response:',
            data
        );

        if (!response.ok) {
            return {
                success: false,

                message:
                    data?.message ||
                    'Deposit history load করা যায়নি',

                requests: [],
            };
        }

        return {
            success:
                data?.success === true,

            message:
                data?.message ||
                (
                    data?.success
                        ? 'Deposit history loaded'
                        : 'Deposit history load করা যায়নি'
                ),

            requests:
                Array.isArray(
                    data?.requests
                )
                    ? data.requests
                    : [],
        };
    } catch (error) {
        console.error(
            'Member deposit history API error:',
            error
        );

        return {
            success: false,

            message:
                'Server-এর সাথে সংযোগ করা যাচ্ছে না',

            requests: [],
        };
    }
}

/*
|--------------------------------------------------------------------------
| Create Deposit Request
|--------------------------------------------------------------------------
*/

export async function createDepositRequest(
    memberId: string,
    weeks: number,
    paymentMethod: DepositPaymentMethod,
    senderNumber: string = ''
): Promise<DepositRequestResult> {
    try {
        console.log(
            'Deposit request:',
            {
                memberId,
                weeks,
                paymentMethod,
                senderNumber,
            }
        );

        const response =
            await fetch(
                `${API_URL}/api/mobile/auth/deposit/${encodeURIComponent(
                    memberId
                )}`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Accept:
                            'application/json',
                    },

                    body:
                        JSON.stringify({
                            weeks,
                            paymentMethod,
                            senderNumber:
                                senderNumber.trim(),
                        }),
                }
            );

        const contentType =
            response.headers.get(
                'content-type'
            ) || '';

        if (
            !contentType.includes(
                'application/json'
            )
        ) {
            const text =
                await response.text();

            console.error(
                'Deposit non-JSON response:',
                text
            );

            return {
                success: false,
                message:
                    'Server থেকে সঠিক response পাওয়া যায়নি।',
            };
        }

        const data =
            await response.json();

        console.log(
            'Deposit response:',
            data
        );

        if (!response.ok) {
            return {
                success: false,

                message:
                    data?.message ||
                    'Deposit request পাঠানো যায়নি',

                code:
                    data?.code,
            };
        }

        return {
            success:
                data?.success === true,

            message:
                data?.message ||
                'Deposit request পাঠানো হয়েছে',

            code:
                data?.code,

            request:
                data?.request,
        };
    } catch (error) {
        console.error(
            'Deposit request API error:',
            error
        );

        return {
            success: false,
            message:
                'Server-এর সাথে সংযোগ করা যাচ্ছে না',
        };
    }
}

/*
|--------------------------------------------------------------------------
| Member Forgot PIN
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Send Member PIN Reset OTP
|--------------------------------------------------------------------------
*/

export async function sendMemberPinResetOTP(
    phone: string,
    language: "bn" | "en" = "bn"
) {
    const response =
        await fetch(
            `${API_URL}/api/mobile/auth/forgot-pin/send-otp`,
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
                        phone,
                        language,
                    }),
            }
        );

    const data =
        await response.json();

    if (!response.ok) {
        throw new Error(
            data?.message ||
                "Failed to send OTP"
        );
    }

    return data;
}

/*
|--------------------------------------------------------------------------
| Verify Member PIN Reset OTP
|--------------------------------------------------------------------------
*/

export async function verifyMemberPinResetOTP(
    phone: string,
    otp: string
) {
    const response =
        await fetch(
            `${API_URL}/api/mobile/auth/forgot-pin/verify-otp`,
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
                        phone,
                        otp,
                    }),
            }
        );

    const data =
        await response.json();

    if (!response.ok) {
        throw new Error(
            data?.message ||
                "Invalid OTP"
        );
    }

    return data;
}

/*
|--------------------------------------------------------------------------
| Resend Member PIN Reset OTP
|--------------------------------------------------------------------------
*/

export async function resendMemberPinResetOTP(
    phone: string,
    language: "bn" | "en" = "bn"
) {
    const response =
        await fetch(
            `${API_URL}/api/mobile/auth/forgot-pin/resend-otp`,
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
                        phone,
                        language,
                    }),
            }
        );

    const data =
        await response.json();

    if (!response.ok) {
        const error =
            new Error(
                data?.message ||
                    "Failed to resend OTP"
            );

        (
            error as Error & {
                code?: string;
                resendAfter?: number;
            }
        ).code =
            data?.code;

        (
            error as Error & {
                code?: string;
                resendAfter?: number;
            }
        ).resendAfter =
            data?.resendAfter;

        throw error;
    }

    return data;
}

/*
|--------------------------------------------------------------------------
| Reset Member PIN
|--------------------------------------------------------------------------
*/

export async function resetMemberPin(
    phone: string,
    resetToken: string,
    newPin: string,
    confirmPin: string
) {
    const response =
        await fetch(
            `${API_URL}/api/mobile/auth/forgot-pin/reset`,
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
                        phone,
                        resetToken,
                        newPin,
                        confirmPin,
                    }),
            }
        );

    const data =
        await response.json();

    if (!response.ok) {
        throw new Error(
            data?.message ||
                "Failed to reset PIN"
        );
    }

    return data;
}

