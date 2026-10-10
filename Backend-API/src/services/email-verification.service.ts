import dotenv from "dotenv";

dotenv.config();

import nodemailer from "nodemailer";


import {
  createHash,
  randomInt,
} from "crypto";

import {
  getAdminProfile,
  markAdminEmailVerified,
} from "./admin-profile.service";

/* ==========================================================================
   CONFIGURATION
   ========================================================================== */

const OTP_EXPIRY_MS =
  5 * 60 * 1000; // 5 minutes

const RESEND_COOLDOWN_MS =
  60 * 1000; // 60 seconds

const MAX_ATTEMPTS = 5;

/* ==========================================================================
   OTP STORE
   ========================================================================== */

/*
 * আপাতত OTP memory-তে রাখা হচ্ছে।
 *
 * Production-এ Redis/database ব্যবহার করা আরও ভালো।
 *
 * Server restart হলে সব pending OTP invalid হয়ে যাবে।
 */

interface OTPRecord {
  adminId: string;
  email: string;
  otpHash: string;
  expiresAt: number;
  createdAt: number;
  attempts: number;
  lastSentAt: number;
}

const otpStore =
  new Map<string, OTPRecord>();

/* ==========================================================================
   EMAIL TRANSPORTER
   ========================================================================== */


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

transporter.verify((error, success) => {
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
});



/* ==========================================================================
   HELPERS
   ========================================================================== */

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
   Hash OTP
   -------------------------------------------------------------------------- */

function hashOTP(
  otp: string
): string {
  return createHash("sha256")
    .update(otp)
    .digest("hex");
}

/* --------------------------------------------------------------------------
   Generate OTP
   -------------------------------------------------------------------------- */

function generateOTP(): string {
  return String(
    randomInt(100000, 1000000)
  );
}

/* --------------------------------------------------------------------------
   Cleanup Expired OTP
   -------------------------------------------------------------------------- */

function cleanupExpiredOTP(
  adminId: string
): void {
  const record =
    otpStore.get(adminId);

  if (!record) {
    return;
  }

  if (
    Date.now() >
    record.expiresAt
  ) {
    otpStore.delete(adminId);
  }
}

/* ==========================================================================
   SEND OTP
   ========================================================================== */

export async function sendAdminEmailOTP(
  adminId: string
): Promise<
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
        | "ALREADY_VERIFIED"
        | "EMAIL_NOT_FOUND"
        | "COOLDOWN"
        | "EMAIL_SEND_FAILED";
      message: string;
      resendAfter?: number;
    }
> {

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
  /* Get admin profile                                                      */
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
  /* Already verified                                                       */
  /* ---------------------------------------------------------------------- */

  if (
    profile.emailVerified
  ) {
    return {
      success: false,
      reason: "ALREADY_VERIFIED",
      message:
        "এই Gmail ইতিমধ্যে verified",
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Email validation                                                       */
  /* ---------------------------------------------------------------------- */

  const email =
    profile.email.trim();

  if (!email) {
    return {
      success: false,
      reason: "EMAIL_NOT_FOUND",
      message:
        "Admin-এর Gmail পাওয়া যায়নি",
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Cleanup expired OTP                                                    */
  /* ---------------------------------------------------------------------- */

  cleanupExpiredOTP(
    normalizedAdminId
  );

  /* ---------------------------------------------------------------------- */
  /* Resend cooldown                                                        */
  /* ---------------------------------------------------------------------- */

  const existing =
    otpStore.get(
      normalizedAdminId
    );

  if (existing) {

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
    hashOTP(otp);

  const now =
    Date.now();

  /* ---------------------------------------------------------------------- */
  /* Save OTP                                                               */
  /* ---------------------------------------------------------------------- */

  otpStore.set(
    normalizedAdminId,
    {
      adminId:
        normalizedAdminId,

      email,

      otpHash,

      expiresAt:
        now +
        OTP_EXPIRY_MS,

      createdAt:
        now,

      attempts: 0,

      lastSentAt:
        now,
    }
  );

  /* ---------------------------------------------------------------------- */
  /* Send email                                                             */
  /* ---------------------------------------------------------------------- */

  try {

    await transporter.sendMail({

      from:
        `"Khudro Sanchoy" <${gmailUser}>`,

      to: email,

      subject:
        "Gmail Verification OTP",

      text:
        `আপনার Gmail verification OTP হলো: ${otp}

এই OTP ৫ মিনিটের জন্য valid।

আপনি যদি এই verification request না করে থাকেন, তাহলে এই email উপেক্ষা করুন।`,

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
            Gmail Verification
          </h2>

          <p style="
            color: #475569;
            font-size: 14px;
          ">
            আপনার Gmail verify করার জন্য নিচের OTP ব্যবহার করুন।
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
            আপনি যদি এই request না করে থাকেন,
            তাহলে এই email উপেক্ষা করুন।
          </p>

        </div>
      `,
    });

    console.log(
      `Email verification OTP sent to ${email}`
    );

    return {
      success: true,

      message:
        "আপনার Gmail-এ OTP পাঠানো হয়েছে",

      expiresIn:
        OTP_EXPIRY_MS / 1000,

      resendAfter:
        RESEND_COOLDOWN_MS / 1000,
    };

  } catch (error) {

    console.error(
      "Send email verification OTP error:",
      error
    );

    /*
     * Email পাঠানো না গেলে OTP store থেকে remove করছি।
     */

    otpStore.delete(
      normalizedAdminId
    );

    return {
      success: false,

      reason:
        "EMAIL_SEND_FAILED",

      message:
        "Gmail-এ OTP পাঠানো যায়নি",
    };
  }
}

/* ==========================================================================
   VERIFY OTP
   ========================================================================== */

export async function verifyAdminEmailOTP(
  adminId: string,
  otp: string
): Promise<
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      reason:
        | "INVALID_OTP"
        | "EXPIRED"
        | "MAX_ATTEMPTS"
        | "NOT_FOUND"
        | "ALREADY_VERIFIED";
      message: string;
    }
> {

  const normalizedAdminId =
    normalizeAdminId(
      adminId
    );

  const cleanOTP =
    String(otp ?? "")
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
  /* Get profile                                                            */
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
  /* Already verified                                                       */
  /* ---------------------------------------------------------------------- */

  if (
    profile.emailVerified
  ) {
    return {
      success: false,
      reason: "ALREADY_VERIFIED",
      message:
        "এই Gmail ইতিমধ্যে verified",
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
  /* Get stored OTP                                                         */
  /* ---------------------------------------------------------------------- */

  const record =
    otpStore.get(
      normalizedAdminId
    );

  if (!record) {
    return {
      success: false,
      reason: "EXPIRED",
      message:
        "OTP পাওয়া যায়নি অথবা মেয়াদ শেষ হয়েছে",
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Expiry check                                                            */
  /* ---------------------------------------------------------------------- */

  if (
    Date.now() >
    record.expiresAt
  ) {

    otpStore.delete(
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

    otpStore.delete(
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
    hashOTP(cleanOTP);

  if (
    submittedHash !==
    record.otpHash
  ) {

    record.attempts += 1;

    otpStore.set(
      normalizedAdminId,
      record
    );

    const remaining =
      MAX_ATTEMPTS -
      record.attempts;

    return {
      success: false,
      reason: "INVALID_OTP",
      message:
        `OTP সঠিক নয়। আরও ${remaining} বার চেষ্টা করতে পারবেন`,
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Mark email verified                                                    */
  /* ---------------------------------------------------------------------- */

  const updated =
    await markAdminEmailVerified(
      normalizedAdminId
    );

  if (!updated) {

    return {
      success: false,
      reason: "NOT_FOUND",
      message:
        "Gmail verification update করা যায়নি",
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Remove used OTP                                                        */
  /* ---------------------------------------------------------------------- */

  otpStore.delete(
    normalizedAdminId
  );

  console.log(
    `Admin Gmail verified: ${normalizedAdminId}`
  );

  return {
    success: true,
    message:
      "Gmail successfully verified",
  };
}