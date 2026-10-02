import crypto from "crypto";
import nodemailer from "nodemailer";

import {
  getAdminProfile,
} from "./admin-profile.service";

import {
  updateAdminEmail,
} from "./admin.service";


/* ==========================================================================
   Configuration
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
   Gmail Transporter
   ========================================================================== */

const gmailUser =
  String(
    process.env.GMAIL_USER ?? ""
  ).trim();

const gmailAppPassword =
  String(
    process.env.GMAIL_APP_PASSWORD ?? ""
  ).trim();


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


/* ==========================================================================
   Types
   ========================================================================== */

interface EmailChangeAuthorization {
  adminId: string;
  expiresAt: number;
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
   In-Memory Stores
   ========================================================================== */

const emailChangeAuthorizationStore =
  new Map<
    string,
    EmailChangeAuthorization
  >();


const emailChangeOTPStore =
  new Map<
    string,
    EmailChangeOTPRecord
  >();


/* ==========================================================================
   Result Types
   ========================================================================== */

export type VerifyEmailChangePasswordResult =
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
        | "INVALID_ROLE"
        | "NO_PASSWORD"
        | "INVALID_PASSWORD";
    };


export type SendEmailChangeOTPResult =
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
        | "INVALID_EMAIL"
        | "EMAIL_ALREADY_EXISTS"
        | "ALREADY_CURRENT_EMAIL"
        | "COOLDOWN"
        | "EMAIL_SEND_FAILED";
      resendAfter?: number;
    };


export type VerifyEmailChangeOTPResult =
  | {
      success: true;
    }
  | {
      success: false;
      reason:
        | "INVALID_TOKEN"
        | "TOKEN_EXPIRED"
        | "NOT_FOUND"
        | "NO_OTP"
        | "EXPIRED"
        | "INVALID_OTP"
        | "MAX_ATTEMPTS"
        | "UPDATE_FAILED";
    };


/* ==========================================================================
   Helpers
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


function normalizeEmail(
  email: string
): string {

  return String(
    email ?? ""
  )
    .trim()
    .toLowerCase();
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


/* ==========================================================================
   Verify Current Password
   ========================================================================== */

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
    };
  }


  /*
   * Import here to keep this service
   * independent from the rest of the
   * email-change logic.
   */

  const {
    verifyAdminCurrentPassword,
  } =
    await import("./admin.service");


  const result =
    await verifyAdminCurrentPassword(
      normalizedAdminId,
      password
    );


  if (!result.success) {
    return result;
  }


  /*
   * Generate temporary authorization token.
   */

  const token =
    generateAuthorizationToken();


  emailChangeAuthorizationStore.set(
    token,
    {
      adminId:
        normalizedAdminId,

      expiresAt:
        Date.now() +
        EMAIL_CHANGE_TOKEN_EXPIRY_MS,
    }
  );


  return {
    success: true,

    authorizationToken:
      token,

    expiresIn:
      Math.floor(
        EMAIL_CHANGE_TOKEN_EXPIRY_MS /
          1000
      ),
  };
}


/* ==========================================================================
   Get Authorization
   ========================================================================== */

function getAuthorization(
  token: string
): EmailChangeAuthorization | null {

  const record =
    emailChangeAuthorizationStore.get(
      token
    );


  if (!record) {
    return null;
  }


  if (
    Date.now() >
    record.expiresAt
  ) {

    emailChangeAuthorizationStore.delete(
      token
    );

    return null;
  }


  return record;
}


/* ==========================================================================
   Send Email Change OTP
   ========================================================================== */

export async function sendEmailChangeOTP(
  authorizationToken: string,
  newEmail: string
): Promise<SendEmailChangeOTPResult> {

  const authorization =
    getAuthorization(
      authorizationToken
    );


  if (!authorization) {
    return {
      success: false,
      reason:
        "INVALID_TOKEN",
    };
  }


  const normalizedEmail =
    normalizeEmail(
      newEmail
    );


  /* ---------------------------------------------------------------------- */
  /* Gmail Validation                                                       */
  /* ---------------------------------------------------------------------- */

  const gmailRegex =
    /^[a-zA-Z0-9._%+-]+@gmail\.com$/;


  if (
    !gmailRegex.test(
      normalizedEmail
    )
  ) {
    return {
      success: false,
      reason:
        "INVALID_EMAIL",
    };
  }


  /* ---------------------------------------------------------------------- */
  /* Get Current Admin Profile                                              */
  /* ---------------------------------------------------------------------- */

  const profile =
    await getAdminProfile(
      authorization.adminId
    );


  if (!profile) {
    return {
      success: false,
      reason:
        "NOT_FOUND",
    };
  }


  /* ---------------------------------------------------------------------- */
  /* Same Email Check                                                       */
  /* ---------------------------------------------------------------------- */

  if (
    profile.email
      .trim()
      .toLowerCase() ===
    normalizedEmail
  ) {
    return {
      success: false,
      reason:
        "ALREADY_CURRENT_EMAIL",
    };
  }


  /* ---------------------------------------------------------------------- */
  /* Check Email Duplicate                                                  */
  /* ---------------------------------------------------------------------- */

  /*
   * updateAdminEmail() performs the
   * final duplicate-email protection.
   *
   * We still check here so the user gets
   * an immediate response before sending
   * an OTP.
   */

  const {
    getSheetValues,
  } =
    await import(
      "../config/google-sheets"
    );


  const rows =
    await getSheetValues(
      "Admins!A:K"
    );


  if (
    !rows ||
    rows.length <= 1
  ) {
    return {
      success: false,
      reason:
        "NOT_FOUND",
    };
  }


  const normalizedAdminId =
    authorization.adminId;


  const emailAlreadyUsed =
    rows
      .slice(1)
      .some(
        (row) =>
          String(
            row[0] ?? ""
          )
            .trim()
            .toUpperCase() !==
            normalizedAdminId &&
          String(
            row[3] ?? ""
          )
            .trim()
            .toLowerCase() ===
            normalizedEmail
      );


  if (
    emailAlreadyUsed
  ) {
    return {
      success: false,
      reason:
        "EMAIL_ALREADY_EXISTS",
    };
  }


  /* ---------------------------------------------------------------------- */
  /* Existing OTP Cooldown                                                  */
  /* ---------------------------------------------------------------------- */

  const existingOTP =
    emailChangeOTPStore.get(
      authorization.adminId
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
          ) /
            1000
        );


      return {
        success: false,
        reason:
          "COOLDOWN",
        resendAfter,
      };
    }
  }


  /* ---------------------------------------------------------------------- */
  /* Generate OTP                                                           */
  /* ---------------------------------------------------------------------- */

  const otp =
    generateOTP();


  const otpHash =
    hashOTP(
      otp
    );


  const now =
    Date.now();


  const record: EmailChangeOTPRecord =
    {
      adminId:
        authorization.adminId,

      newEmail:
        normalizedEmail,

      otpHash,

      expiresAt:
        now +
        OTP_EXPIRY_MS,

      createdAt:
        now,

      attempts:
        0,

      lastSentAt:
        now,
    };


  emailChangeOTPStore.set(
    authorization.adminId,
    record
  );


  /* ---------------------------------------------------------------------- */
  /* Send Gmail                                                             */
  /* ---------------------------------------------------------------------- */

  try {

    await transporter.sendMail({
      from:
        gmailUser,

      to:
        normalizedEmail,

      subject:
        "Khudro Sanchoy - Email Change OTP",

      text:
        `Your Khudro Sanchoy email change verification OTP is: ${otp}\n\n` +
        `This OTP will expire in 5 minutes.\n` +
        `If you did not request this change, please ignore this email.`,

      html:
        `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Khudro Sanchoy</h2>

            <p>
              আপনার নতুন Gmail পরিবর্তন করার জন্য verification OTP:
            </p>

            <h1
              style="
                letter-spacing: 8px;
                font-size: 32px;
              "
            >
              ${otp}
            </h1>

            <p>
              এই OTP ৫ মিনিটের মধ্যে expire হবে।
            </p>

            <p>
              আপনি যদি এই request না করে থাকেন,
              তাহলে এই emailটি ignore করুন।
            </p>
          </div>
        `,
    });


    console.log(
      "Admin email change OTP sent:",
      {
        adminId:
          authorization.adminId,

        email:
          normalizedEmail,
      }
    );


    return {
      success: true,

      expiresIn:
        Math.floor(
          OTP_EXPIRY_MS /
            1000
        ),

      resendAfter:
        Math.floor(
          OTP_RESEND_COOLDOWN_MS /
            1000
        ),
    };

  } catch (error) {

    console.error(
      "Admin email change OTP email send failed:",
      error
    );


    emailChangeOTPStore.delete(
      authorization.adminId
    );


    return {
      success: false,
      reason:
        "EMAIL_SEND_FAILED",
    };
  }
}


/* ==========================================================================
   Verify Email Change OTP
   ========================================================================== */

export async function verifyEmailChangeOTP(
  authorizationToken: string,
  otp: string
): Promise<VerifyEmailChangeOTPResult> {

  const authorization =
    getAuthorization(
      authorizationToken
    );


  if (!authorization) {
    return {
      success: false,
      reason:
        "INVALID_TOKEN",
    };
  }


  const record =
    emailChangeOTPStore.get(
      authorization.adminId
    );


  if (!record) {
    return {
      success: false,
      reason:
        "NO_OTP",
    };
  }


  /* ---------------------------------------------------------------------- */
  /* OTP Expiry                                                             */
  /* ---------------------------------------------------------------------- */

  if (
    Date.now() >
    record.expiresAt
  ) {

    emailChangeOTPStore.delete(
      authorization.adminId
    );

    return {
      success: false,
      reason:
        "EXPIRED",
    };
  }


  /* ---------------------------------------------------------------------- */
  /* Maximum Attempts                                                       */
  /* ---------------------------------------------------------------------- */

  if (
    record.attempts >=
    MAX_OTP_ATTEMPTS
  ) {

    emailChangeOTPStore.delete(
      authorization.adminId
    );

    return {
      success: false,
      reason:
        "MAX_ATTEMPTS",
    };
  }


  /* ---------------------------------------------------------------------- */
  /* Normalize OTP                                                          */
  /* ---------------------------------------------------------------------- */

  const normalizedOTP =
    String(
      otp ?? ""
    )
      .trim()
      .replace(/\D/g, "");


  /* ---------------------------------------------------------------------- */
  /* OTP Validation                                                         */
  /* ---------------------------------------------------------------------- */

  const submittedHash =
    hashOTP(
      normalizedOTP
    );


  if (
    submittedHash !==
    record.otpHash
  ) {

    record.attempts += 1;


    if (
      record.attempts >=
      MAX_OTP_ATTEMPTS
    ) {

      emailChangeOTPStore.delete(
        authorization.adminId
      );

      return {
        success: false,
        reason:
          "MAX_ATTEMPTS",
      };
    }


    return {
      success: false,
      reason:
        "INVALID_OTP",
    };
  }


  /* ---------------------------------------------------------------------- */
  /* Update Email                                                            */
  /* ---------------------------------------------------------------------- */

  const updateResult =
    await updateAdminEmail(
      authorization.adminId,
      record.newEmail
    );


  if (
    !updateResult.success
  ) {

    return {
      success: false,
      reason:
        "UPDATE_FAILED",
    };
  }


  /* ---------------------------------------------------------------------- */
  /* Cleanup                                                                */
  /* ---------------------------------------------------------------------- */

  emailChangeOTPStore.delete(
    authorization.adminId
  );

  emailChangeAuthorizationStore.delete(
    authorizationToken
  );


  /* ---------------------------------------------------------------------- */
  /* Success                                                                */
  /* ---------------------------------------------------------------------- */

  console.log(
    "Admin email change verified successfully:",
    {
      adminId:
        authorization.adminId,

      newEmail:
        record.newEmail,
    }
  );


  return {
    success: true,
  };
}