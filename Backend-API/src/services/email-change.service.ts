import dotenv from "dotenv";

dotenv.config();

import nodemailer from "nodemailer";

import {
  createHash,
  randomBytes,
  randomInt,
} from "crypto";

import {
  getAdminProfile,
} from "./admin-profile.service";

import {
  verifyAdminCurrentPassword,
  updateAdminEmail,
} from "./admin.service";

/* ==========================================================================
   CONFIGURATION
   ========================================================================== */

const OTP_EXPIRY_MS =
  5 * 60 * 1000; // 5 minutes

const RESEND_COOLDOWN_MS =
  60 * 1000; // 60 seconds

const AUTHORIZATION_TOKEN_EXPIRY_MS =
  10 * 60 * 1000; // 10 minutes

const MAX_ATTEMPTS = 5;

/* ==========================================================================
   TYPES
   ========================================================================== */

interface EmailChangeAuthorization {
  adminId: string;
  tokenHash: string;
  expiresAt: number;
  createdAt: number;
}

interface EmailChangeOTPRecord {
  adminId: string;
  newEmail: string;
  otpHash: string;
  expiresAt: number;
  createdAt: number;
  attempts: number;
  lastSentAt: number;
}

/* ==========================================================================
   STORES
   ========================================================================== */

/*
 * Email change authorization token memory-তে রাখা হচ্ছে।
 *
 * Server restart হলে pending email-change authorization
 * automatically invalid হয়ে যাবে।
 *
 * Production-এ Redis/database ব্যবহার করা আরও ভালো।
 */

const authorizationStore =
  new Map<string, EmailChangeAuthorization>();

/*
 * Email change-এর OTP আলাদা store-এ রাখা হচ্ছে।
 *
 * Existing email-verification.service.ts-এর OTP store-এর
 * সঙ্গে এটি কখনোই share করা হচ্ছে না।
 */

const emailChangeOTPStore =
  new Map<string, EmailChangeOTPRecord>();

/* ==========================================================================
   EMAIL TRANSPORTER
   ========================================================================== */

const smtpEmail =
  process.env.SMTP_EMAIL?.trim();

const smtpAppPassword =
  process.env.SMTP_APP_PASSWORD?.trim();

if (
  !smtpEmail ||
  !smtpAppPassword
) {
  console.warn(
    "[Email Change] SMTP_EMAIL or SMTP_APP_PASSWORD is missing."
  );
}

const gmailUser =
  process.env.GMAIL_USER?.trim();

const gmailAppPassword =
  process.env.GMAIL_APP_PASSWORD?.trim();

if (!gmailUser) {
  throw new Error(
    "GMAIL_USER is missing from environment variables"
  );
}

if (!gmailAppPassword) {
  throw new Error(
    "GMAIL_APP_PASSWORD is missing from environment variables"
  );
}

const transporter =
  nodemailer.createTransport({
    host: "smtp.gmail.com",

    port: 465,

    secure: true,

    auth: {
      user: gmailUser,

      pass: gmailAppPassword,
    },
  });

transporter.verify(
  (error, success) => {
    if (error) {
      console.error(
        "GMAIL SMTP VERIFY FAILED:",
        error
      );
    } else {
      console.log(
        "GMAIL SMTP READY:",
        success
      );
    }
  }
);

/* ==========================================================================
   HELPERS
   ========================================================================== */

/* --------------------------------------------------------------------------
   Normalize Admin ID
   -------------------------------------------------------------------------- */

function normalizeAdminId(
  adminId: string
): string {
  return String(
    adminId ?? ""
  )
    .trim()
    .toUpperCase();
}

/* --------------------------------------------------------------------------
   Normalize Email
   -------------------------------------------------------------------------- */

function normalizeEmail(
  email: string
): string {
  return String(
    email ?? ""
  )
    .trim()
    .toLowerCase();
}

/* --------------------------------------------------------------------------
   Gmail Validation
   -------------------------------------------------------------------------- */

function isValidGmail(
  email: string
): boolean {
  const gmailRegex =
    /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

  return gmailRegex.test(
    email
  );
}

/* --------------------------------------------------------------------------
   Hash Value
   -------------------------------------------------------------------------- */

function hashValue(
  value: string
): string {
  return createHash("sha256")
    .update(value)
    .digest("hex");
}

/* --------------------------------------------------------------------------
   Generate Authorization Token
   -------------------------------------------------------------------------- */

function generateAuthorizationToken(): string {
  return randomBytes(32).toString("hex");
}

/* --------------------------------------------------------------------------
   Generate OTP
   -------------------------------------------------------------------------- */

function generateOTP(): string {
  return String(
    randomInt(
      100000,
      1000000
    )
  );
}

/* --------------------------------------------------------------------------
   Cleanup Authorization
   -------------------------------------------------------------------------- */

function cleanupAuthorization(
  adminId: string
): void {
  const record =
    authorizationStore.get(
      adminId
    );

  if (!record) {
    return;
  }

  if (
    Date.now() >
    record.expiresAt
  ) {
    authorizationStore.delete(
      adminId
    );

    /*
     * Authorization expire হলে তার pending OTP-ও
     * invalid করে দিচ্ছি।
     */

    emailChangeOTPStore.delete(
      adminId
    );
  }
}

/* --------------------------------------------------------------------------
   Cleanup OTP
   -------------------------------------------------------------------------- */

function cleanupOTP(
  adminId: string
): void {
  const record =
    emailChangeOTPStore.get(
      adminId
    );

  if (!record) {
    return;
  }

  if (
    Date.now() >
    record.expiresAt
  ) {
    emailChangeOTPStore.delete(
      adminId
    );
  }
}

/* ==========================================================================
   VERIFY CURRENT PASSWORD
   ========================================================================== */

/*
 * প্রথম ধাপে admin-এর current password verify হবে।
 *
 * Password সঠিক হলে একটি short-lived authorization token
 * তৈরি হবে।
 *
 * এই token ছাড়া নতুন Gmail-এ OTP পাঠানো বা OTP verify
 * করা যাবে না।
 */

export type VerifyEmailChangePasswordResult =
  | {
      success: true;
      authorizationToken: string;
      expiresIn: number;
      message: string;
    }
  | {
      success: false;
      reason:
        | "NOT_FOUND"
        | "INACTIVE"
        | "INVALID_ROLE"
        | "NO_PASSWORD"
        | "INVALID_PASSWORD";
      message: string;
    };

export async function verifyEmailChangePassword(
  adminId: string,
  password: string
): Promise<VerifyEmailChangePasswordResult> {

  const normalizedAdminId =
    normalizeAdminId(
      adminId
    );

  if (!normalizedAdminId) {
    return {
      success: false,
      reason: "NOT_FOUND",
      message:
        "Admin ID পাওয়া যায়নি",
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Verify current password                                                */
  /* ---------------------------------------------------------------------- */

  const result =
    await verifyAdminCurrentPassword(
      normalizedAdminId,
      password
    );

  if (!result.success) {
    return {
      success: false,
      reason: result.reason,
      message:
        getPasswordVerificationMessage(
          result.reason
        ),
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Generate token                                                         */
  /* ---------------------------------------------------------------------- */

  const authorizationToken =
    generateAuthorizationToken();

  const tokenHash =
    hashValue(
      authorizationToken
    );

  const now =
    Date.now();

  /* ---------------------------------------------------------------------- */
  /* Invalidate previous authorization                                      */
  /* ---------------------------------------------------------------------- */

  authorizationStore.delete(
    normalizedAdminId
  );

  emailChangeOTPStore.delete(
    normalizedAdminId
  );

  /* ---------------------------------------------------------------------- */
  /* Save authorization                                                     */
  /* ---------------------------------------------------------------------- */

  authorizationStore.set(
    normalizedAdminId,
    {
      adminId:
        normalizedAdminId,

      tokenHash,

      createdAt:
        now,

      expiresAt:
        now +
        AUTHORIZATION_TOKEN_EXPIRY_MS,
    }
  );

  return {
    success: true,

    authorizationToken,

    expiresIn:
      AUTHORIZATION_TOKEN_EXPIRY_MS /
      1000,

    message:
      "Current password সঠিক হয়েছে",
  };
}

/* --------------------------------------------------------------------------
   Password Verification Messages
   -------------------------------------------------------------------------- */

function getPasswordVerificationMessage(
  reason:
    | "NOT_FOUND"
    | "INACTIVE"
    | "INVALID_ROLE"
    | "NO_PASSWORD"
    | "INVALID_PASSWORD"
): string {

  switch (reason) {

    case "NOT_FOUND":
      return "Admin profile পাওয়া যায়নি";

    case "INACTIVE":
      return "Admin account inactive";

    case "INVALID_ROLE":
      return "এই account-এর admin permission নেই";

    case "NO_PASSWORD":
      return "Admin password পাওয়া যায়নি";

    case "INVALID_PASSWORD":
      return "Current password সঠিক নয়";

    default:
      return "Password verification failed";
  }
}

/* ==========================================================================
   VERIFY AUTHORIZATION TOKEN
   ========================================================================== */

function verifyAuthorizationToken(
  adminId: string,
  authorizationToken: string
): boolean {

  const normalizedAdminId =
    normalizeAdminId(
      adminId
    );

  if (!normalizedAdminId) {
    return false;
  }

  const cleanToken =
    String(
      authorizationToken ?? ""
    ).trim();

  if (!cleanToken) {
    return false;
  }

  cleanupAuthorization(
    normalizedAdminId
  );

  const record =
    authorizationStore.get(
      normalizedAdminId
    );

  if (!record) {
    return false;
  }

  const submittedHash =
    hashValue(
      cleanToken
    );

  if (
    submittedHash !==
    record.tokenHash
  ) {
    return false;
  }

  if (
    Date.now() >
    record.expiresAt
  ) {
    authorizationStore.delete(
      normalizedAdminId
    );

    emailChangeOTPStore.delete(
      normalizedAdminId
    );

    return false;
  }

  return true;
}

/* ==========================================================================
   SEND EMAIL CHANGE OTP
   ========================================================================== */

export type SendEmailChangeOTPResult =
  | {
      success: true;
      message: string;
      expiresIn: number;
      resendAfter: number;
    }
  | {
      success: false;
      reason:
        | "NOT_FOUND"
        | "UNAUTHORIZED"
        | "INVALID_EMAIL"
        | "SAME_EMAIL"
        | "EMAIL_ALREADY_EXISTS"
        | "COOLDOWN"
        | "EMAIL_SEND_FAILED";
      message: string;
      resendAfter?: number;
    };

export async function sendEmailChangeOTP(
  adminId: string,
  authorizationToken: string,
  newEmail: string
): Promise<SendEmailChangeOTPResult> {

  const normalizedAdminId =
    normalizeAdminId(
      adminId
    );

  const normalizedNewEmail =
    normalizeEmail(
      newEmail
    );

  if (!normalizedAdminId) {
    return {
      success: false,
      reason: "NOT_FOUND",
      message:
        "Admin ID পাওয়া যায়নি",
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Verify authorization                                                   */
  /* ---------------------------------------------------------------------- */

  if (
    !verifyAuthorizationToken(
      normalizedAdminId,
      authorizationToken
    )
  ) {
    return {
      success: false,
      reason: "UNAUTHORIZED",
      message:
        "Email change authorization-এর মেয়াদ শেষ হয়েছে। আবার password verify করুন",
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Validate new email                                                     */
  /* ---------------------------------------------------------------------- */

  if (
    !isValidGmail(
      normalizedNewEmail
    )
  ) {
    return {
      success: false,
      reason: "INVALID_EMAIL",
      message:
        "সঠিক Gmail address দিন",
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Get current admin profile                                              */
  /* ---------------------------------------------------------------------- */

  const profile =
    await getAdminProfile(
      normalizedAdminId
    );

  if (!profile) {
    return {
      success: false,
      reason: "NOT_FOUND",
      message:
        "Admin profile পাওয়া যায়নি",
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Prevent same email                                                     */
  /* ---------------------------------------------------------------------- */

  const currentEmail =
    normalizeEmail(
      profile.email
    );

  if (
    currentEmail ===
    normalizedNewEmail
  ) {
    return {
      success: false,
      reason: "SAME_EMAIL",
      message:
        "নতুন Gmail বর্তমান Gmail-এর মতো হতে পারবে না",
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Cleanup expired OTP                                                    */
  /* ---------------------------------------------------------------------- */

  cleanupOTP(
    normalizedAdminId
  );

  /* ---------------------------------------------------------------------- */
  /* Resend cooldown                                                        */
  /* ---------------------------------------------------------------------- */

  const existing =
    emailChangeOTPStore.get(
      normalizedAdminId
    );

  if (existing) {

    /*
     * একই authorization session-এ
     * একই/অন্য Gmail-এর জন্য resend cooldown থাকবে।
     */

    const elapsed =
      Date.now() -
      existing.lastSentAt;

    if (
      elapsed <
      RESEND_COOLDOWN_MS
    ) {

      const remaining =
        Math.ceil(
          (
            RESEND_COOLDOWN_MS -
            elapsed
          ) / 1000
        );

      return {
        success: false,
        reason: "COOLDOWN",
        message:
          `অনুগ্রহ করে ${remaining} সেকেন্ড পরে আবার চেষ্টা করুন`,
        resendAfter:
          remaining,
      };
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Generate OTP                                                           */
  /* ---------------------------------------------------------------------- */

  const otp =
    generateOTP();

  const otpHash =
    hashValue(
      otp
    );

  const now =
    Date.now();

  /* ---------------------------------------------------------------------- */
  /* Save OTP                                                               */
  /* ---------------------------------------------------------------------- */

  emailChangeOTPStore.set(
    normalizedAdminId,
    {
      adminId:
        normalizedAdminId,

      newEmail:
        normalizedNewEmail,

      otpHash,

      createdAt:
        now,

      expiresAt:
        now +
        OTP_EXPIRY_MS,

      attempts: 0,

      lastSentAt:
        now,
    }
  );

  /* ---------------------------------------------------------------------- */
  /* Send OTP                                                               */
  /* ---------------------------------------------------------------------- */

  try {

    await transporter.sendMail({

      from:
        `"Khudro Sanchoy" <${smtpEmail || gmailUser}>`,

      to:
        normalizedNewEmail,

      subject:
        "Khudro Sanchoy - Gmail Change Verification OTP",

      text:
        `আপনার Gmail পরিবর্তন করার verification OTP হলো: ${otp}

এই OTP ৫ মিনিটের জন্য valid।

আপনি যদি Gmail পরিবর্তনের request না করে থাকেন,
তাহলে এই email উপেক্ষা করুন।`,

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 500px;
          margin: auto;
          padding: 24px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        ">

          <h2 style="
            color: #0f172a;
            margin-bottom: 8px;
          ">
            Gmail Change Verification
          </h2>

          <p style="
            color: #475569;
            font-size: 14px;
          ">
            আপনার Gmail পরিবর্তন করার request verify করতে
            নিচের OTP ব্যবহার করুন।
          </p>

          <div style="
            margin: 24px 0;
            padding: 18px;
            background: #f1f5f9;
            border-radius: 10px;
            text-align: center;
          ">

            <div style="
              font-size: 32px;
              font-weight: 800;
              letter-spacing: 8px;
              color: #0f172a;
            ">
              ${otp}
            </div>

          </div>

          <p style="
            color: #64748b;
            font-size: 13px;
          ">
            এই OTP ৫ মিনিটের জন্য valid।
          </p>

          <p style="
            color: #94a3b8;
            font-size: 12px;
          ">
            আপনি যদি এই Gmail change request না করে থাকেন,
            তাহলে এই email উপেক্ষা করুন।
          </p>

        </div>
      `,
    });

    console.log(
      "Admin email change OTP sent:",
      {
        adminId:
          normalizedAdminId,
      }
    );

    return {
      success: true,

      message:
        "নতুন Gmail-এ OTP পাঠানো হয়েছে",

      expiresIn:
        OTP_EXPIRY_MS /
        1000,

      resendAfter:
        RESEND_COOLDOWN_MS /
        1000,
    };

  } catch (error) {

    console.error(
      "Send email change OTP error:",
      error
    );

    /*
     * Email পাঠাতে না পারলে stored OTP remove করছি।
     */

    emailChangeOTPStore.delete(
      normalizedAdminId
    );

    return {
      success: false,

      reason:
        "EMAIL_SEND_FAILED",

      message:
        "নতুন Gmail-এ OTP পাঠানো যায়নি",
    };
  }
}

/* ==========================================================================
   VERIFY EMAIL CHANGE OTP
   ========================================================================== */

export type VerifyEmailChangeOTPResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      reason:
        | "UNAUTHORIZED"
        | "INVALID_OTP"
        | "EXPIRED"
        | "MAX_ATTEMPTS"
        | "NOT_FOUND"
        | "EMAIL_ALREADY_EXISTS"
        | "INVALID_EMAIL";
      message: string;
    };

export async function verifyEmailChangeOTP(
  adminId: string,
  authorizationToken: string,
  otp: string
): Promise<VerifyEmailChangeOTPResult> {

  const normalizedAdminId =
    normalizeAdminId(
      adminId
    );

  const cleanOTP =
    String(
      otp ?? ""
    )
      .replace(/\D/g, "")
      .trim();

  if (!normalizedAdminId) {
    return {
      success: false,
      reason: "NOT_FOUND",
      message:
        "Admin ID পাওয়া যায়নি",
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Verify authorization                                                   */
  /* ---------------------------------------------------------------------- */

  if (
    !verifyAuthorizationToken(
      normalizedAdminId,
      authorizationToken
    )
  ) {
    return {
      success: false,
      reason: "UNAUTHORIZED",
      message:
        "Email change authorization-এর মেয়াদ শেষ হয়েছে। আবার password verify করুন",
    };
  }

  /* ---------------------------------------------------------------------- */
  /* OTP format                                                             */
  /* ---------------------------------------------------------------------- */

  if (
    !/^\d{6}$/.test(
      cleanOTP
    )
  ) {
    return {
      success: false,
      reason: "INVALID_OTP",
      message:
        "৬ সংখ্যার সঠিক OTP দিন",
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Cleanup expired OTP                                                    */
  /* ---------------------------------------------------------------------- */

  cleanupOTP(
    normalizedAdminId
  );

  /* ---------------------------------------------------------------------- */
  /* Get stored OTP                                                         */
  /* ---------------------------------------------------------------------- */

  const record =
    emailChangeOTPStore.get(
      normalizedAdminId
    );

  if (!record) {
    return {
      success: false,
      reason: "EXPIRED",
      message:
        "OTP পাওয়া যায়নি অথবা মেয়াদ শেষ হয়েছে। নতুন OTP নিন",
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Verify OTP expiry                                                      */
  /* ---------------------------------------------------------------------- */

  if (
    Date.now() >
    record.expiresAt
  ) {

    emailChangeOTPStore.delete(
      normalizedAdminId
    );

    return {
      success: false,
      reason: "EXPIRED",
      message:
        "OTP-এর মেয়াদ শেষ হয়েছে। নতুন OTP নিন",
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Maximum attempts                                                       */
  /* ---------------------------------------------------------------------- */

  if (
    record.attempts >=
    MAX_ATTEMPTS
  ) {

    emailChangeOTPStore.delete(
      normalizedAdminId
    );

    return {
      success: false,
      reason: "MAX_ATTEMPTS",
      message:
        "অনেকবার ভুল OTP দেওয়া হয়েছে। নতুন OTP নিন",
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Compare OTP                                                            */
  /* ---------------------------------------------------------------------- */

  const submittedHash =
    hashValue(
      cleanOTP
    );

  if (
    submittedHash !==
    record.otpHash
  ) {

    record.attempts += 1;

    emailChangeOTPStore.set(
      normalizedAdminId,
      record
    );

    const remaining =
      MAX_ATTEMPTS -
      record.attempts;

    if (remaining <= 0) {

      emailChangeOTPStore.delete(
        normalizedAdminId
      );

      return {
        success: false,
        reason: "MAX_ATTEMPTS",
        message:
          "অনেকবার ভুল OTP দেওয়া হয়েছে। নতুন OTP নিন",
      };
    }

    return {
      success: false,
      reason: "INVALID_OTP",
      message:
        `OTP সঠিক নয়। আরও ${remaining} বার চেষ্টা করতে পারবেন`,
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Validate email again before update                                    */
  /* ---------------------------------------------------------------------- */

  if (
    !isValidGmail(
      record.newEmail
    )
  ) {
    emailChangeOTPStore.delete(
      normalizedAdminId
    );

    return {
      success: false,
      reason: "INVALID_EMAIL",
      message:
        "Gmail address সঠিক নয়",
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Update admin email                                                     */
  /* ---------------------------------------------------------------------- */

  const updated =
    await updateAdminEmail(
      normalizedAdminId,
      record.newEmail
    );

  if (!updated.success) {

    if (
      updated.reason ===
      "EMAIL_ALREADY_EXISTS"
    ) {
      emailChangeOTPStore.delete(
        normalizedAdminId
      );

      return {
        success: false,
        reason:
          "EMAIL_ALREADY_EXISTS",
        message:
          "এই Gmail অন্য একটি admin account-এ ব্যবহার করা হয়েছে",
      };
    }

    if (
      updated.reason ===
      "INVALID_EMAIL"
    ) {
      emailChangeOTPStore.delete(
        normalizedAdminId
      );

      return {
        success: false,
        reason:
          "INVALID_EMAIL",
        message:
          "Gmail address সঠিক নয়",
      };
    }

    return {
      success: false,
      reason: "NOT_FOUND",
      message:
        "Gmail update করা যায়নি",
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Invalidate authorization and OTP                                      */
  /* ---------------------------------------------------------------------- */

  authorizationStore.delete(
    normalizedAdminId
  );

  emailChangeOTPStore.delete(
    normalizedAdminId
  );

  /* ---------------------------------------------------------------------- */
  /* Success                                                                */
  /* ---------------------------------------------------------------------- */

  console.log(
    "Admin email change completed:",
    {
      adminId:
        normalizedAdminId,
    }
  );

  return {
    success: true,
    message:
      "Gmail সফলভাবে পরিবর্তন হয়েছে",
  };
}