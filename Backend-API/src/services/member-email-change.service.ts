import crypto from "crypto";

import nodemailer from "nodemailer";

import {
    getSheetValues,
    updateSheetValues,
} from "../config/google-sheets";

import {
    findMemberById,
} from "./member.service";

import {
    verifyPin,
} from "../utils/pin";

/* ==========================================================================
   CONSTANTS
   ========================================================================== */

const OTP_EXPIRY_MS =
    5 * 60 * 1000;

const OTP_RESEND_COOLDOWN_MS =
    60 * 1000;

const MAX_OTP_ATTEMPTS =
    5;

const EMAIL_CHANGE_TOKEN_EXPIRY_MS =
    10 * 60 * 1000;

/* ==========================================================================
   TYPES
   ========================================================================== */

interface EmailChangeAuthorization {
    memberId: string;
    expiresAt: number;
}

interface EmailChangeOTPRecord {
    memberId: string;
    newEmail: string;
    otpHash: string;
    expiresAt: number;
    createdAt: number;
    attempts: number;
    lastSentAt: number;
}

/* ==========================================================================
   IN-MEMORY STORAGE
   ========================================================================== */

const emailChangeAuthorizations =
    new Map<
        string,
        EmailChangeAuthorization
    >();

const emailChangeOTPs =
    new Map<
        string,
        EmailChangeOTPRecord
    >();

/* ==========================================================================
   RESULT TYPES
   ========================================================================== */

export type VerifyMemberEmailChangePinResult =
    | {
        success: true;
        authorizationToken: string;
        expiresIn: number;
    }
    | {
        success: false;
        reason:
            | "NOT_FOUND"
            | "INACTIVE"
            | "NO_PIN"
            | "INVALID_PIN";
        message: string;
    };

export type SendMemberEmailChangeOTPResult =
    | {
        success: true;
        expiresIn: number;
        resendAfter: number;
    }
    | {
        success: false;
        reason:
            | "INVALID_TOKEN"
            | "TOKEN_EXPIRED"
            | "NOT_FOUND"
            | "INACTIVE"
            | "INVALID_EMAIL"
            | "EMAIL_ALREADY_EXISTS"
            | "ALREADY_CURRENT_EMAIL"
            | "COOLDOWN"
            | "EMAIL_SEND_FAILED";
        message: string;
        resendAfter?: number;
    };

export type VerifyMemberEmailChangeOTPResult =
    | {
        success: true;
        message: string;
    }
    | {
        success: false;
        reason:
            | "INVALID_TOKEN"
            | "TOKEN_EXPIRED"
            | "NOT_FOUND"
            | "INACTIVE"
            | "NO_OTP"
            | "EXPIRED"
            | "INVALID_OTP"
            | "MAX_ATTEMPTS"
            | "EMAIL_ALREADY_EXISTS"
            | "UPDATE_FAILED";
        message: string;
    };

/* ==========================================================================
   HELPERS
   ========================================================================== */

function normalizeMemberId(
    memberId: string
): string {
    return String(memberId || "")
        .trim()
        .toUpperCase();
}

function normalizeEmail(
    email: string
): string {
    return String(email || "")
        .trim()
        .toLowerCase();
}

function normalizePin(
    pin: string
): string {
    return String(pin || "")
        .trim();
}

function hashOTP(
    otp: string
): string {
    return crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");
}

function generateOTP(): string {
    return String(
        crypto.randomInt(
            100000,
            1000000
        )
    );
}

function generateAuthorizationToken(): string {
    return crypto
        .randomBytes(32)
        .toString("hex");
}

function getAuthorization(
    authorizationToken: string
): EmailChangeAuthorization | null {
    const authorization =
        emailChangeAuthorizations.get(
            authorizationToken
        );

    if (!authorization) {
        return null;
    }

    if (
        Date.now() >
        authorization.expiresAt
    ) {
        emailChangeAuthorizations.delete(
            authorizationToken
        );

        return null;
    }

    return authorization;
}

/* ==========================================================================
   GMAIL VALIDATION
   ========================================================================== */

function isValidGmail(
    email: string
): boolean {
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(
        email
    );
}

/* ==========================================================================
   GET MEMBER ROW
   ========================================================================== */

/*
 * Members sheet structure:
 *
 * A = Member ID
 * B = Member Name
 * C = Phone
 * D = Join Date
 * E = Share Count
 * F = Weekly Amount
 * G = PIN Hash
 * H = Status
 * I = Created At
 * J = Updated At
 * K = Gmail
 */

async function getMemberRow(
    memberId: string
): Promise<{
    row: string[];
    sheetRow: number;
} | null> {

    const normalizedMemberId =
        normalizeMemberId(
            memberId
        );

    const rows =
        await getSheetValues(
            "Members!A:K"
        );

    for (
        let index = 1;
        index < rows.length;
        index++
    ) {
        const row =
            rows[index] || [];

        const rowMemberId =
            normalizeMemberId(
                row[0] || ""
            );

        if (
            rowMemberId ===
            normalizedMemberId
        ) {
            return {
                row,
                sheetRow:
                    index + 1,
            };
        }
    }

    return null;
}

/* ==========================================================================
   VERIFY CURRENT PIN
   ========================================================================== */

export async function verifyMemberEmailChangePin(
    memberId: string,
    pin: string
): Promise<VerifyMemberEmailChangePinResult> {

    const normalizedMemberId =
        normalizeMemberId(
            memberId
        );

    const normalizedPin =
        normalizePin(
            pin
        );

    if (
        !normalizedMemberId
    ) {
        return {
            success: false,
            reason: "NOT_FOUND",
            message:
                "Member account was not found.",
        };
    }

    const memberRow =
        await getMemberRow(
            normalizedMemberId
        );

    if (!memberRow) {
        return {
            success: false,
            reason: "NOT_FOUND",
            message:
                "Member account was not found.",
        };
    }

    const row =
        memberRow.row;

    const status =
        String(
            row[7] || ""
        )
            .trim()
            .toUpperCase();

    if (
        status !== "ACTIVE"
    ) {
        return {
            success: false,
            reason: "INACTIVE",
            message:
                "This member account is not active.",
        };
    }

    const pinHash =
        String(
            row[6] || ""
        ).trim();

    if (!pinHash) {
        return {
            success: false,
            reason: "NO_PIN",
            message:
                "Member PIN is not configured.",
        };
    }

    if (
        !normalizedPin ||
        !verifyPin(
            normalizedPin,
            pinHash
        )
    ) {
        return {
            success: false,
            reason: "INVALID_PIN",
            message:
                "The current PIN is incorrect.",
        };
    }

    const authorizationToken =
        generateAuthorizationToken();

    const expiresAt =
        Date.now() +
        EMAIL_CHANGE_TOKEN_EXPIRY_MS;

    emailChangeAuthorizations.set(
        authorizationToken,
        {
            memberId:
                normalizedMemberId,
            expiresAt,
        }
    );

    return {
        success: true,

        authorizationToken,

        /*
         * Route expects expiresIn.
         * Value is in seconds.
         */
        expiresIn:
            EMAIL_CHANGE_TOKEN_EXPIRY_MS /
            1000,
    };
}

/* ==========================================================================
   CHECK EMAIL USED
   ========================================================================== */

async function isMemberEmailUsed(
    email: string,
    exceptMemberId?: string
): Promise<boolean> {

    const normalizedEmail =
        normalizeEmail(
            email
        );

    const normalizedExceptMemberId =
        normalizeMemberId(
            exceptMemberId || ""
        );

    if (!normalizedEmail) {
        return false;
    }

    const rows =
        await getSheetValues(
            "Members!A:K"
        );

    for (
        let index = 1;
        index < rows.length;
        index++
    ) {
        const row =
            rows[index] || [];

        const rowMemberId =
            normalizeMemberId(
                row[0] || ""
            );

        if (
            normalizedExceptMemberId &&
            rowMemberId ===
            normalizedExceptMemberId
        ) {
            continue;
        }

        const rowEmail =
            normalizeEmail(
                row[10] || ""
            );

        if (
            rowEmail ===
            normalizedEmail
        ) {
            return true;
        }
    }

    return false;
}

/* ==========================================================================
   SEND EMAIL CHANGE OTP
   ========================================================================== */

export async function sendMemberEmailChangeOTP(
    authorizationToken: string,
    newEmail: string
): Promise<SendMemberEmailChangeOTPResult> {

    const authorization =
        getAuthorization(
            authorizationToken
        );

    if (!authorization) {
        return {
            success: false,
            reason: "INVALID_TOKEN",
            message:
                "Authorization token is invalid or expired.",
        };
    }

    const normalizedEmail =
        normalizeEmail(
            newEmail
        );

    if (
        !isValidGmail(
            normalizedEmail
        )
    ) {
        return {
            success: false,
            reason: "INVALID_EMAIL",
            message:
                "Please enter a valid Gmail address.",
        };
    }

    const member =
        await findMemberById(
            authorization.memberId
        );

    if (!member) {
        return {
            success: false,
            reason: "NOT_FOUND",
            message:
                "Member account was not found.",
        };
    }

    const memberRow =
        await getMemberRow(
            authorization.memberId
        );

    if (!memberRow) {
        return {
            success: false,
            reason: "NOT_FOUND",
            message:
                "Member account was not found.",
        };
    }

    const status =
        String(
            memberRow.row[7] || ""
        )
            .trim()
            .toUpperCase();

    if (
        status !== "ACTIVE"
    ) {
        return {
            success: false,
            reason: "INACTIVE",
            message:
                "This member account is not active.",
        };
    }

    const currentEmail =
        normalizeEmail(
            memberRow.row[10] || ""
        );

    if (
        currentEmail &&
        currentEmail ===
        normalizedEmail
    ) {
        return {
            success: false,
            reason:
                "ALREADY_CURRENT_EMAIL",
            message:
                "The new Gmail must be different from the current Gmail.",
        };
    }

    const emailAlreadyUsed =
        await isMemberEmailUsed(
            normalizedEmail,
            authorization.memberId
        );

    if (
        emailAlreadyUsed
    ) {
        return {
            success: false,
            reason:
                "EMAIL_ALREADY_EXISTS",
            message:
                "This Gmail address is already used by another member.",
        };
    }

    const existingOTP =
        emailChangeOTPs.get(
            authorizationToken
        );

    if (
        existingOTP
    ) {
        const elapsed =
            Date.now() -
            existingOTP.lastSentAt;

        if (
            elapsed <
            OTP_RESEND_COOLDOWN_MS
        ) {
            const resendAfter =
                Math.ceil(
                    (
                        OTP_RESEND_COOLDOWN_MS -
                        elapsed
                    ) / 1000
                );

            return {
                success: false,
                reason: "COOLDOWN",
                message:
                    `Please wait ${resendAfter} seconds before requesting another OTP.`,
                resendAfter,
            };
        }
    }

    const otp =
        generateOTP();

    const otpHash =
        hashOTP(
            otp
        );

    const now =
        Date.now();

    const expiresAt =
        now +
        OTP_EXPIRY_MS;

    const record:
        EmailChangeOTPRecord = {
        memberId:
            authorization.memberId,

        newEmail:
            normalizedEmail,

        otpHash,

        expiresAt,

        createdAt:
            now,

        attempts:
            0,

        lastSentAt:
            now,
    };

    const gmailUser =
        process.env.GMAIL_USER;

    const gmailAppPassword =
        process.env.GMAIL_APP_PASSWORD;

    if (
        !gmailUser ||
        !gmailAppPassword
    ) {
        return {
            success: false,
            reason:
                "EMAIL_SEND_FAILED",
            message:
                "Gmail service is not configured.",
        };
    }

    const transporter =
        nodemailer.createTransport({
            service: "gmail",

            auth: {
                user:
                    gmailUser,

                pass:
                    gmailAppPassword,
            },
        });

    try {
        await transporter.sendMail({
            from:
                gmailUser,

            to:
                normalizedEmail,

            subject:
                "ক্ষুদ্র সঞ্চয় - Member Gmail Change OTP",

            text:
                `Your OTP for changing your member Gmail is: ${otp}

This OTP will expire in 5 minutes.`,
        });
    } catch (error) {

        console.error(
            "Member email change OTP send error:",
            error
        );

        return {
            success: false,
            reason:
                "EMAIL_SEND_FAILED",
            message:
                "Could not send OTP to the new Gmail address.",
        };
    }

    emailChangeOTPs.set(
        authorizationToken,
        record
    );

    return {
        success: true,

        /*
         * Route expects expiresIn.
         * Value is in seconds.
         */
        expiresIn:
            OTP_EXPIRY_MS /
            1000,

        resendAfter:
            OTP_RESEND_COOLDOWN_MS /
            1000,
    };
}

/* ==========================================================================
   VERIFY EMAIL CHANGE OTP
   ========================================================================== */

export async function verifyMemberEmailChangeOTP(
    authorizationToken: string,
    otp: string
): Promise<VerifyMemberEmailChangeOTPResult> {

    const authorization =
        getAuthorization(
            authorizationToken
        );

    if (!authorization) {
        return {
            success: false,
            reason: "INVALID_TOKEN",
            message:
                "Authorization token is invalid or expired.",
        };
    }

    const record =
        emailChangeOTPs.get(
            authorizationToken
        );

    if (!record) {
        return {
            success: false,
            reason: "NO_OTP",
            message:
                "No OTP verification request was found.",
        };
    }

    if (
        Date.now() >
        record.expiresAt
    ) {
        emailChangeOTPs.delete(
            authorizationToken
        );

        return {
            success: false,
            reason: "EXPIRED",
            message:
                "The OTP has expired. Please request a new OTP.",
        };
    }

    if (
        record.attempts >=
        MAX_OTP_ATTEMPTS
    ) {
        emailChangeOTPs.delete(
            authorizationToken
        );

        return {
            success: false,
            reason:
                "MAX_ATTEMPTS",
            message:
                "Maximum OTP attempts exceeded. Please request a new OTP.",
        };
    }

    const cleanOTP =
        String(otp || "")
            .replace(
                /\D/g,
                ""
            );

    if (
        !/^\d{6}$/.test(
            cleanOTP
        )
    ) {
        record.attempts += 1;

        if (
            record.attempts >=
            MAX_OTP_ATTEMPTS
        ) {
            emailChangeOTPs.delete(
                authorizationToken
            );

            return {
                success: false,
                reason:
                    "MAX_ATTEMPTS",
                message:
                    "Maximum OTP attempts exceeded. Please request a new OTP.",
            };
        }

        return {
            success: false,
            reason:
                "INVALID_OTP",
            message:
                "Please enter a valid 6-digit OTP.",
        };
    }

    const incomingHash =
        hashOTP(
            cleanOTP
        );

    if (
        incomingHash !==
        record.otpHash
    ) {
        record.attempts += 1;

        if (
            record.attempts >=
            MAX_OTP_ATTEMPTS
        ) {
            emailChangeOTPs.delete(
                authorizationToken
            );

            return {
                success: false,
                reason:
                    "MAX_ATTEMPTS",
                message:
                    "Maximum OTP attempts exceeded. Please request a new OTP.",
            };
        }

        return {
            success: false,
            reason:
                "INVALID_OTP",
            message:
                "The OTP is incorrect.",
        };
    }

    /*
     * Re-read the member immediately before updating
     * the Gmail address.
     */

    const memberRow =
        await getMemberRow(
            authorization.memberId
        );

    if (!memberRow) {
        emailChangeOTPs.delete(
            authorizationToken
        );

        emailChangeAuthorizations.delete(
            authorizationToken
        );

        return {
            success: false,
            reason: "NOT_FOUND",
            message:
                "Member account was not found.",
        };
    }

    const status =
        String(
            memberRow.row[7] || ""
        )
            .trim()
            .toUpperCase();

    if (
        status !== "ACTIVE"
    ) {
        emailChangeOTPs.delete(
            authorizationToken
        );

        emailChangeAuthorizations.delete(
            authorizationToken
        );

        return {
            success: false,
            reason: "INACTIVE",
            message:
                "This member account is not active.",
        };
    }

    /*
     * Final duplicate-email protection.
     */

    const emailAlreadyUsed =
        await isMemberEmailUsed(
            record.newEmail,
            authorization.memberId
        );

    if (
        emailAlreadyUsed
    ) {
        emailChangeOTPs.delete(
            authorizationToken
        );

        emailChangeAuthorizations.delete(
            authorizationToken
        );

        return {
            success: false,
            reason:
                "EMAIL_ALREADY_EXISTS",
            message:
                "This Gmail address is already used by another member.",
        };
    }

    try {

        /*
         * K column = Gmail
         *
         * Header row = 1
         * First member row = 2
         */

        await updateSheetValues(
            `Members!K${memberRow.sheetRow}:K${memberRow.sheetRow}`,
            [
                [
                    record.newEmail,
                ],
            ]
        );

    } catch (error) {

        console.error(
            "Member Gmail update error:",
            error
        );

        return {
            success: false,
            reason:
                "UPDATE_FAILED",
            message:
                "Could not update the member Gmail address.",
        };
    }

    /*
     * Cleanup authorization and OTP after successful
     * Gmail change.
     */

    emailChangeOTPs.delete(
        authorizationToken
    );

    emailChangeAuthorizations.delete(
        authorizationToken
    );

    return {
        success: true,

        message:
            "Member Gmail address changed successfully.",
    };
}

