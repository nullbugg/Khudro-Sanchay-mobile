import dotenv from "dotenv";

dotenv.config();

import {
  getSheetValues,
  updateSheetValues,
  appendSheetRow,
  deleteSheetRow,
} from "../config/google-sheets";

import {
  verifyAdminPassword,
  hashAdminPassword,
} from "../utils/admin-password";

import nodemailer from "nodemailer";

import crypto from "crypto";


/* ==========================================================================
   Admin Interface
   ========================================================================== */

export interface Admin {
  adminId: string;
  adminName: string;
  phone: string;
  email: string;
  passwordHash: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export type AdminPendingDepositStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type AdminDepositPaymentMethod =
  | "cash"
  | "bkash";

export interface AdminPendingDeposit {
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
}


/* ==========================================================================
   Collections Types
   --------------------------------------------------------------------------
   FINAL Collections Sheet Structure:

   A  Collection ID
   B  Member ID
   C  Member Name
   D  Week
   E  Share Count
   F  Expected Amount
   G  Arrears
   H  Paid Amount
   I  Status
   J  Date
   K  Admin ID
   L  Notes

   IMPORTANT:
   There is NO Type column.
   There is NO Amount column.
   ========================================================================== */

export interface AdminMemberCollection {
  rowIndex: number;
  id: string;
  memberId: string;
  memberName: string;
  week: string;
  weekNumber: number;
  shareCount: number;
  expectedAmount: number;
  arrears: number;
  paidAmount: number;
  status: string;
  date: string;
  adminId: string;
  notes: string;
}


/* ==========================================================================
   Utility: Get Week Number
   ========================================================================== */

function getCollectionWeekNumber(
  value: string
): number {

  const cleanValue =
    String(
      value ?? ""
    ).trim();

  if (!cleanValue) {
    return 0;
  }

  const match =
    cleanValue.match(
      /(?:week\s*)?(\d+)/i
    );

  if (!match) {
    return 0;
  }

  const weekNumber =
    Number(
      match[1]
    );

  if (
    !Number.isInteger(
      weekNumber
    ) ||
    weekNumber < 1
  ) {
    return 0;
  }

  return weekNumber;
}


/* ==========================================================================
   Collection Week Configuration
   --------------------------------------------------------------------------
   Week 1 = 24-04-2026
   Every next week = +7 days
   ========================================================================== */

const WEEK_1_START_UTC =
  Date.UTC(
    2026,
    3,
    24
  );

const DAYS_IN_WEEK_MS =
  7 *
  24 *
  60 *
  60 *
  1000;


/* ==========================================================================
   Utility: Get Collection Date By Week
   ========================================================================== */

function getCollectionDateByWeek(
  weekNumber: number
): string {
  if (
    !Number.isInteger(
      weekNumber
    ) ||
    weekNumber < 1
  ) {
    return "";
  }

  const date = new Date(
    WEEK_1_START_UTC +
    (
      (weekNumber - 1) *
      DAYS_IN_WEEK_MS
    )
  );

  return `${String(
    date.getUTCDate()
  ).padStart(2, "0")}-${String(
    date.getUTCMonth() + 1
  ).padStart(2, "0")}-${date.getUTCFullYear()}`;
}


/* ==========================================================================
   Utility: Parse Collections
   --------------------------------------------------------------------------
   FINAL Collections Sheet:

   A  Collection ID
   B  Member ID
   C  Member Name
   D  Week
   E  Share Count
   F  Expected Amount
   G  Arrears
   H  Paid Amount
   I  Status
   J  Date
   K  Admin ID
   L  Notes

   Weekly / Advance:
   - Expected Amount > 0 = WEEKLY
   - Expected Amount = 0 = ADVANCE

   No Type field is stored or returned.
   ========================================================================== */

function parseCollections(
  rows: any[][]
): AdminMemberCollection[] {

  if (
    !rows ||
    rows.length <= 1
  ) {
    return [];
  }

  const dataRows =
    rows.slice(1);

  const collections:
    AdminMemberCollection[] = [];

  dataRows.forEach(
    (row, index) => {

      const id =
        String(
          row[0] ?? ""
        ).trim();

      const memberId =
        String(
          row[1] ?? ""
        ).trim();

      const memberName =
        String(
          row[2] ?? ""
        ).trim();

      const week =
        String(
          row[3] ?? ""
        ).trim();

      const weekNumber =
        getCollectionWeekNumber(
          week
        );

      if (
        !memberId ||
        !weekNumber
      ) {
        return;
      }

      /* E = Share Count */
      const shareCount =
        Number(
          row[4] ?? 0
        );

      /* F = Expected Amount */
      const expectedAmount =
        Number(
          row[5] ?? 0
        );

      /* G = Arrears */
      const arrears =
        Number(
          row[6] ?? 0
        );

      /* H = Paid Amount */
      const paidAmount =
        Number(
          row[7] ?? 0
        );

      /* I = Status */
      const status =
        String(
          row[8] ?? ""
        ).trim();

      /* J = Date */
      const date =
        String(
          row[9] ?? ""
        ).trim();

      /* K = Admin ID */
      const adminId =
        String(
          row[10] ?? ""
        ).trim();

      /* L = Notes */
      const notes =
        String(
          row[11] ?? ""
        ).trim();

      collections.push({
        rowIndex:
          index + 2,

        id,

        memberId,

        memberName,

        week,

        weekNumber,

        shareCount:
          Number.isFinite(
            shareCount
          )
            ? shareCount
            : 0,

        expectedAmount:
          Number.isFinite(
            expectedAmount
          )
            ? expectedAmount
            : 0,

        arrears:
          Number.isFinite(
            arrears
          )
            ? arrears
            : 0,

        paidAmount:
          Number.isFinite(
            paidAmount
          )
            ? paidAmount
            : 0,

        status,

        date,

        adminId,

        notes,
      });
    }
  );

  return collections;
}


/* ==========================================================================
   Utility: Get Next Collection ID
   --------------------------------------------------------------------------
   Format:

   COL-000001
   COL-000002
   COL-000003

   Existing IDs are scanned and the highest numeric suffix is used.
   ========================================================================== */

function getNextCollectionId(
  rows: any[][]
): string {

  let maxCollectionNumber =
    0;

  if (
    rows &&
    rows.length > 1
  ) {

    for (
      const row of rows.slice(1)
    ) {

      const id =
        String(
          row[0] ?? ""
        )
          .trim()
          .toUpperCase();

      const match =
        id.match(
          /^COL-(\d{6})$/
        );

      if (!match) {
        continue;
      }

      const number =
        Number(
          match[1]
        );

      if (
        Number.isInteger(
          number
        )
      ) {
        maxCollectionNumber =
          Math.max(
            maxCollectionNumber,
            number
          );
      }
    }
  }

  return (
    `COL-${String(
      maxCollectionNumber + 1
    ).padStart(6, "0")}`
  );
}

/* ==========================================================================
   Utility: Get Next Deposit ID
   --------------------------------------------------------------------------
   Format:

   DEP-000001
   DEP-000002
   DEP-000003

   Existing IDs are scanned and the highest numeric suffix is used.
   ========================================================================== */

function getNextDepositId(
  rows: any[][]
): string {

  let maxDepositNumber =
    0;

  if (
    rows &&
    rows.length > 1
  ) {

    for (
      const row of rows.slice(1)
    ) {

      const id =
        String(
          row[0] ?? ""
        )
          .trim()
          .toUpperCase();

      const match =
        id.match(
          /^DEP-(\d{6})$/
        );

      if (!match) {
        continue;
      }

      const number =
        Number(
          match[1]
        );

      if (
        Number.isInteger(
          number
        )
      ) {
        maxDepositNumber =
          Math.max(
            maxDepositNumber,
            number
          );
      }
    }
  }

  return (
    `DEP-${String(
      maxDepositNumber + 1
    ).padStart(
      6,
      "0"
    )}`
  );
}


/* ==========================================================================
   Create Admin Result
   ========================================================================== */

export type CreateAdminResult =
  | {
    success: true;
    admin: Omit<Admin, "passwordHash">;
  }
  | {
    success: false;
    reason:
    | "DUPLICATE_ID"
    | "INVALID_EMAIL"
    | "INVALID_PHONE"
    | "INVALID_PASSWORD";
  };


/* ==========================================================================
   Change Admin Password Result
   ========================================================================== */

export type ChangeAdminPasswordResult =
  | {
    success: true;
  }
  | {
    success: false;
    reason:
    | "NOT_FOUND"
    | "INACTIVE"
    | "INVALID_ROLE"
    | "NO_PASSWORD"
    | "INVALID_CURRENT_PASSWORD"
    | "INVALID_NEW_PASSWORD"
    | "PASSWORD_MISMATCH";
  };


/* ==========================================================================
   Delete Admin Account Result
   ========================================================================== */

export type DeleteAdminAccountResult =
  | {
    success: true;
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


/* ==========================================================================
   Forgot Password Types
   ========================================================================== */

export type AdminPasswordResetInfoResult =
  | {
    success: true;
    adminId: string;
    email: string;
    maskedEmail: string;
  }
  | {
    success: false;
    reason:
    | "NOT_FOUND"
    | "INACTIVE"
    | "INVALID_ROLE";
  };


export type SendAdminPasswordResetOTPResult =
  | {
    success: true;
    expiresIn: number;
    resendAfter: number;
  }
  | {
    success: false;
    reason:
    | "NOT_FOUND"
    | "INACTIVE"
    | "INVALID_ROLE"
    | "NO_EMAIL"
    | "INVALID_EMAIL"
    | "COOLDOWN"
    | "EMAIL_SEND_FAILED";
    resendAfter?: number;
  };


export type VerifyAdminPasswordResetOTPResult =
  | {
    success: true;
    resetToken: string;
    expiresIn: number;
  }
  | {
    success: false;
    reason:
    | "NOT_FOUND"
    | "INACTIVE"
    | "INVALID_ROLE"
    | "NO_OTP"
    | "OTP_EXPIRED"
    | "INVALID_OTP"
    | "TOO_MANY_ATTEMPTS";
  };


export type ResetAdminPasswordResult =
  | {
    success: true;
  }
  | {
    success: false;
    reason:
    | "NOT_FOUND"
    | "INACTIVE"
    | "INVALID_ROLE"
    | "NO_RESET_TOKEN"
    | "RESET_TOKEN_EXPIRED"
    | "INVALID_RESET_TOKEN"
    | "INVALID_NEW_PASSWORD"
    | "PASSWORD_MISMATCH"
    | "SAME_PASSWORD";
  };

/* ==========================================================================
 Approve Pending Deposit Result
 ========================================================================== */

export interface ApprovePendingDepositResult {
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
}


/* ==========================================================================
   Reject Pending Deposit Result
   ========================================================================== */

export interface RejectPendingDepositResult {
  requestId: string;
  memberId: string;
  memberName: string;
  status: "REJECTED";
  rejectedDate: string;
  adminId: string;
  notes: string;
}


/* ==========================================================================
   Password Reset Configuration
   ========================================================================== */

const ADMIN_PASSWORD_RESET_OTP_EXPIRY_MS =
  10 * 60 * 1000;

const ADMIN_PASSWORD_RESET_RESEND_COOLDOWN_MS =
  60 * 1000;

const ADMIN_PASSWORD_RESET_TOKEN_EXPIRY_MS =
  10 * 60 * 1000;

const ADMIN_PASSWORD_RESET_MAX_ATTEMPTS =
  5;


/* ==========================================================================
   Password Reset Memory Store
   ========================================================================== */

interface AdminPasswordResetEntry {
  otpHash: string;
  otpExpiresAt: number;
  lastSentAt: number;
  attempts: number;
  resetTokenHash?: string;
  resetTokenExpiresAt?: number;
}


const adminPasswordResetStore =
  new Map<string, AdminPasswordResetEntry>();


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


const gmailTransporter =
  gmailUser &&
    gmailAppPassword
    ? nodemailer.createTransport({
      service: "gmail",

      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    })
    : null;


/* ==========================================================================
   Utility: Normalize Admin ID
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


/* ==========================================================================
   Utility: Normalize Email
   ========================================================================== */

function normalizeEmail(
  email: string
): string {

  return String(
    email ?? ""
  )
    .trim()
    .toLowerCase();
}


/* ==========================================================================
   Utility: Gmail Validation
   ========================================================================== */

function isValidGmail(
  email: string
): boolean {

  const gmailRegex =
    /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

  return gmailRegex.test(
    normalizeEmail(email)
  );
}


/* ==========================================================================
   Utility: Generate OTP
   ========================================================================== */

function generateOTP(): string {

  return crypto
    .randomInt(
      100000,
      1000000
    )
    .toString();
}


/* ==========================================================================
   Utility: Hash Sensitive Value
   ========================================================================== */

function hashSensitiveValue(
  value: string
): string {

  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex");
}


/* ==========================================================================
   Utility: Mask Gmail
   ========================================================================== */

function maskEmail(
  email: string
): string {

  const normalizedEmail =
    normalizeEmail(email);

  const atIndex =
    normalizedEmail.indexOf("@");

  if (
    atIndex <= 0
  ) {
    return normalizedEmail;
  }

  const username =
    normalizedEmail.slice(
      0,
      atIndex
    );

  const domain =
    normalizedEmail.slice(
      atIndex
    );

  if (
    username.length <= 2
  ) {
    return (
      username[0] +
      "*" +
      domain
    );
  }

  if (
    username.length <= 4
  ) {
    return (
      username.slice(
        0,
        1
      ) +
      "*".repeat(
        username.length - 1
      ) +
      domain
    );
  }

  return (
    username.slice(
      0,
      2
    ) +
    "*".repeat(
      Math.max(
        2,
        username.length - 4
      )
    ) +
    username.slice(-2) +
    domain
  );
}


/* ==========================================================================
   Utility: Cleanup Expired Reset Entries
   ========================================================================== */

function cleanupExpiredPasswordResetEntries(): void {

  const now =
    Date.now();

  for (
    const [
      adminId,
      entry,
    ] of adminPasswordResetStore.entries()
  ) {

    const otpExpired =
      now >
      entry.otpExpiresAt;

    const resetTokenExpired =
      !entry.resetTokenExpiresAt ||
      now >
      entry.resetTokenExpiresAt;

    if (
      otpExpired &&
      resetTokenExpired
    ) {

      adminPasswordResetStore.delete(
        adminId
      );
    }
  }
}


/* ==========================================================================
   Create Admin
   ========================================================================== */

export async function createAdmin(
  adminId: string,
  adminName: string,
  phone: string,
  email: string,
  password: string
): Promise<CreateAdminResult> {

  const normalizedAdminId =
    normalizeAdminId(
      adminId
    );

  const normalizedName =
    String(
      adminName ?? ""
    ).trim();

  const normalizedPhone =
    String(
      phone ?? ""
    ).trim();

  const normalizedEmail =
    normalizeEmail(
      email
    );


  if (
    !isValidGmail(
      normalizedEmail
    )
  ) {

    return {
      success: false,
      reason: "INVALID_EMAIL",
    };
  }


  const phoneRegex =
    /^01[3-9]\d{8}$/;

  if (
    !phoneRegex.test(
      normalizedPhone
    )
  ) {

    return {
      success: false,
      reason: "INVALID_PHONE",
    };
  }


  if (
    !password ||
    password.length < 6
  ) {

    return {
      success: false,
      reason: "INVALID_PASSWORD",
    };
  }


  if (
    !normalizedAdminId ||
    !normalizedName
  ) {

    return {
      success: false,
      reason: "INVALID_PASSWORD",
    };
  }


  const existingAdmin =
    await findAdminById(
      normalizedAdminId
    );

  if (existingAdmin) {

    return {
      success: false,
      reason: "DUPLICATE_ID",
    };
  }


  const hashedPassword =
    await hashAdminPassword(
      password
    );


  const now =
    new Date().toISOString();


  const admin: Admin = {

    adminId:
      normalizedAdminId,

    adminName:
      normalizedName,

    phone:
      normalizedPhone,

    email:
      normalizedEmail,

    passwordHash:
      hashedPassword,

    role:
      "ADMIN",

    status:
      "ACTIVE",

    createdAt:
      now,

    updatedAt:
      now,

    lastLoginAt:
      "",
  };


  await appendSheetRow(
    "Admins!A:J",
    [
      admin.adminId,
      admin.adminName,
      admin.phone,
      admin.email,
      admin.passwordHash,
      admin.role,
      admin.status,
      admin.createdAt,
      admin.updatedAt,
      admin.lastLoginAt,
    ]
  );


  const {
    passwordHash: _passwordHash,
    ...safeAdmin
  } = admin;

  return {
    success: true,
    admin: safeAdmin,
  };
}


/* ==========================================================================
   Find Admin By ID
   ========================================================================== */

export async function findAdminById(
  adminId: string
): Promise<Admin | null> {

  const rows =
    await getSheetValues(
      "Admins!A:K"
    );


  if (
    !rows ||
    rows.length <= 1
  ) {
    return null;
  }


  const normalizedId =
    normalizeAdminId(
      adminId
    );

  if (!normalizedId) {
    return null;
  }


  const row =
    rows
      .slice(1)
      .find(
        (item) =>
          String(
            item[0] ?? ""
          )
            .trim()
            .toUpperCase() ===
          normalizedId
      );


  if (!row) {
    return null;
  }


  return {

    adminId:
      String(
        row[0] ?? ""
      ).trim(),

    adminName:
      String(
        row[1] ?? ""
      ).trim(),

    phone:
      String(
        row[2] ?? ""
      ).trim(),

    email:
      String(
        row[3] ?? ""
      ).trim(),

    passwordHash:
      String(
        row[4] ?? ""
      ).trim(),

    role:
      String(
        row[5] ?? ""
      ).trim(),

    status:
      String(
        row[6] ?? ""
      ).trim(),

    createdAt:
      String(
        row[7] ?? ""
      ).trim(),

    updatedAt:
      String(
        row[8] ?? ""
      ).trim(),

    lastLoginAt:
      String(
        row[9] ?? ""
      ).trim(),
  };
}


/* ==========================================================================
   Admin Login
   ========================================================================== */

export async function loginAdmin(
  adminId: string,
  password: string
): Promise<
  | {
    success: true;
    admin: Omit<
      Admin,
      "passwordHash"
    >;
  }
  | {
    success: false;
    reason:
    | "NOT_FOUND"
    | "INACTIVE"
    | "INVALID_PASSWORD"
    | "INVALID_ROLE"
    | "NO_PASSWORD";
  }
> {

  const admin =
    await findAdminById(
      adminId
    );


  if (!admin) {

    return {
      success: false,
      reason: "NOT_FOUND",
    };
  }


  if (
    admin.status
      .trim()
      .toUpperCase() !==
    "ACTIVE"
  ) {

    return {
      success: false,
      reason: "INACTIVE",
    };
  }


  if (
    admin.role
      .trim()
      .toUpperCase() !==
    "ADMIN"
  ) {

    return {
      success: false,
      reason: "INVALID_ROLE",
    };
  }


  if (!admin.passwordHash) {

    return {
      success: false,
      reason: "NO_PASSWORD",
    };
  }


  const validPassword =
    await verifyAdminPassword(
      password,
      admin.passwordHash
    );

  if (!validPassword) {

    return {
      success: false,
      reason: "INVALID_PASSWORD",
    };
  }


  const {
    passwordHash: _passwordHash,
    ...safeAdmin
  } = admin;

  return {
    success: true,
    admin: safeAdmin,
  };
}


/* ==========================================================================
   Change Admin Password
   ========================================================================== */

export async function changeAdminPassword(
  adminId: string,
  currentPassword: string,
  newPassword: string,
  rePassword: string
): Promise<ChangeAdminPasswordResult> {

  const normalizedAdminId =
    normalizeAdminId(
      adminId
    );


  const admin =
    await findAdminById(
      normalizedAdminId
    );


  if (!admin) {

    return {
      success: false,
      reason: "NOT_FOUND",
    };
  }


  if (
    admin.status
      .trim()
      .toUpperCase() !==
    "ACTIVE"
  ) {

    return {
      success: false,
      reason: "INACTIVE",
    };
  }


  if (
    admin.role
      .trim()
      .toUpperCase() !==
    "ADMIN"
  ) {

    return {
      success: false,
      reason: "INVALID_ROLE",
    };
  }


  if (!admin.passwordHash) {

    return {
      success: false,
      reason: "NO_PASSWORD",
    };
  }


  const validCurrentPassword =
    await verifyAdminPassword(
      currentPassword,
      admin.passwordHash
    );

  if (!validCurrentPassword) {

    return {
      success: false,
      reason:
        "INVALID_CURRENT_PASSWORD",
    };
  }


  if (
    !newPassword ||
    newPassword.length < 6
  ) {

    return {
      success: false,
      reason: "INVALID_NEW_PASSWORD",
    };
  }


  if (
    newPassword !==
    rePassword
  ) {

    return {
      success: false,
      reason: "PASSWORD_MISMATCH",
    };
  }


  const sameAsCurrent =
    await verifyAdminPassword(
      newPassword,
      admin.passwordHash
    );

  if (sameAsCurrent) {

    return {
      success: false,
      reason: "INVALID_NEW_PASSWORD",
    };
  }


  const newPasswordHash =
    await hashAdminPassword(
      newPassword
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
      reason: "NOT_FOUND",
    };
  }


  const dataRows =
    rows.slice(1);


  const rowIndex =
    dataRows.findIndex(
      (row) =>
        String(
          row[0] ?? ""
        )
          .trim()
          .toUpperCase() ===
        normalizedAdminId
    );


  if (
    rowIndex === -1
  ) {

    return {
      success: false,
      reason: "NOT_FOUND",
    };
  }


  const sheetRowNumber =
    rowIndex + 2;


  await updateSheetValues(
    `Admins!E${sheetRowNumber}`,
    [
      [newPasswordHash],
    ]
  );


  const now =
    new Date().toISOString();

  await updateSheetValues(
    `Admins!I${sheetRowNumber}`,
    [
      [now],
    ]
  );


  console.log(
    "Admin password changed successfully:",
    {
      adminId:
        normalizedAdminId,
    }
  );


  return {
    success: true,
  };
}


/* ==========================================================================
   Update Admin Last Login
   ========================================================================== */

export async function updateAdminLastLogin(
  adminId: string
): Promise<boolean> {

  const rows =
    await getSheetValues(
      "Admins!A:K"
    );

  if (
    !rows ||
    rows.length <= 1
  ) {
    return false;
  }


  const normalizedId =
    normalizeAdminId(
      adminId
    );


  const dataRows =
    rows.slice(1);


  const rowIndex =
    dataRows.findIndex(
      (row) =>
        String(
          row[0] ?? ""
        )
          .trim()
          .toUpperCase() ===
        normalizedId
    );


  if (
    rowIndex === -1
  ) {
    return false;
  }


  const sheetRowNumber =
    rowIndex + 2;


  const now =
    new Date().toISOString();


  await updateSheetValues(
    `Admins!J${sheetRowNumber}`,
    [
      [now],
    ]
  );


  return true;
}


/* ==========================================================================
   Delete Admin Account
   ========================================================================== */

export async function deleteAdminAccount(
  adminId: string,
  password: string
): Promise<DeleteAdminAccountResult> {

  const normalizedAdminId =
    normalizeAdminId(
      adminId
    );


  const admin =
    await findAdminById(
      normalizedAdminId
    );


  if (!admin) {

    return {
      success: false,
      reason: "NOT_FOUND",
    };
  }


  if (
    admin.status
      .trim()
      .toUpperCase() !==
    "ACTIVE"
  ) {

    return {
      success: false,
      reason: "INACTIVE",
    };
  }


  if (
    admin.role
      .trim()
      .toUpperCase() !==
    "ADMIN"
  ) {

    return {
      success: false,
      reason: "INVALID_ROLE",
    };
  }


  if (!admin.passwordHash) {

    return {
      success: false,
      reason: "NO_PASSWORD",
    };
  }


  const validPassword =
    await verifyAdminPassword(
      password,
      admin.passwordHash
    );

  if (!validPassword) {

    return {
      success: false,
      reason: "INVALID_PASSWORD",
    };
  }


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
      reason: "NOT_FOUND",
    };
  }


  const dataRows =
    rows.slice(1);


  const rowIndex =
    dataRows.findIndex(
      (row) =>
        String(
          row[0] ?? ""
        )
          .trim()
          .toUpperCase() ===
        normalizedAdminId
    );


  if (
    rowIndex === -1
  ) {

    return {
      success: false,
      reason: "NOT_FOUND",
    };
  }


  const sheetRowNumber =
    rowIndex + 2;


  await deleteSheetRow(
    "Admins",
    sheetRowNumber
  );


  console.log(
    "Admin account permanently deleted:",
    {
      adminId:
        normalizedAdminId,
    }
  );


  return {
    success: true,
  };
}


/* ==========================================================================
   Verify Admin Current Password
   ========================================================================== */

export type VerifyAdminCurrentPasswordResult =
  | {
    success: true;
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


export async function verifyAdminCurrentPassword(
  adminId: string,
  password: string
): Promise<VerifyAdminCurrentPasswordResult> {

  const normalizedAdminId =
    normalizeAdminId(
      adminId
    );


  const admin =
    await findAdminById(
      normalizedAdminId
    );


  if (!admin) {

    return {
      success: false,
      reason: "NOT_FOUND",
    };
  }


  if (
    admin.status
      .trim()
      .toUpperCase() !==
    "ACTIVE"
  ) {

    return {
      success: false,
      reason: "INACTIVE",
    };
  }


  if (
    admin.role
      .trim()
      .toUpperCase() !==
    "ADMIN"
  ) {

    return {
      success: false,
      reason: "INVALID_ROLE",
    };
  }


  if (!admin.passwordHash) {

    return {
      success: false,
      reason: "NO_PASSWORD",
    };
  }


  const validPassword =
    await verifyAdminPassword(
      password,
      admin.passwordHash
    );


  if (!validPassword) {

    return {
      success: false,
      reason: "INVALID_PASSWORD",
    };
  }


  return {
    success: true,
  };
}


/* ==========================================================================
   Update Admin Email
   ========================================================================== */

export type UpdateAdminEmailResult =
  | {
    success: true;
  }
  | {
    success: false;
    reason:
    | "NOT_FOUND"
    | "INVALID_EMAIL"
    | "EMAIL_ALREADY_EXISTS";
  };


export async function updateAdminEmail(
  adminId: string,
  newEmail: string
): Promise<UpdateAdminEmailResult> {

  const normalizedAdminId =
    normalizeAdminId(
      adminId
    );

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
    };
  }


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
      reason: "NOT_FOUND",
    };
  }


  const dataRows =
    rows.slice(1);


  const rowIndex =
    dataRows.findIndex(
      (row) =>
        String(
          row[0] ?? ""
        )
          .trim()
          .toUpperCase() ===
        normalizedAdminId
    );


  if (
    rowIndex === -1
  ) {

    return {
      success: false,
      reason: "NOT_FOUND",
    };
  }


  const emailAlreadyUsed =
    dataRows.some(
      (row, index) => {

        if (
          index === rowIndex
        ) {
          return false;
        }

        return (
          normalizeEmail(
            String(
              row[3] ?? ""
            )
          ) ===
          normalizedEmail
        );
      }
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


  const sheetRowNumber =
    rowIndex + 2;


  await updateSheetValues(
    `Admins!D${sheetRowNumber}`,
    [
      [
        normalizedEmail,
      ],
    ]
  );


  await updateSheetValues(
    `Admins!K${sheetRowNumber}`,
    [
      [
        "TRUE",
      ],
    ]
  );


  const now =
    new Date().toISOString();


  await updateSheetValues(
    `Admins!I${sheetRowNumber}`,
    [
      [
        now,
      ],
    ]
  );


  console.log(
    "Admin email changed successfully:",
    {
      adminId:
        normalizedAdminId,

      email:
        normalizedEmail,
    }
  );


  return {
    success: true,
  };
}


/* ==========================================================================
   FORGOT PASSWORD
   GET ADMIN PASSWORD RESET INFO
   ========================================================================== */

export async function getAdminPasswordResetInfo(
  adminId: string
): Promise<AdminPasswordResetInfoResult> {

  const normalizedAdminId =
    normalizeAdminId(
      adminId
    );


  const admin =
    await findAdminById(
      normalizedAdminId
    );


  if (!admin) {

    return {
      success: false,
      reason: "NOT_FOUND",
    };
  }


  if (
    admin.status
      .trim()
      .toUpperCase() !==
    "ACTIVE"
  ) {

    return {
      success: false,
      reason: "INACTIVE",
    };
  }


  if (
    admin.role
      .trim()
      .toUpperCase() !==
    "ADMIN"
  ) {

    return {
      success: false,
      reason: "INVALID_ROLE",
    };
  }


  const email =
    normalizeEmail(
      admin.email
    );


  if (!email) {

    return {
      success: false,
      reason: "NOT_FOUND",
    };
  }


  return {
    success: true,

    adminId:
      admin.adminId,

    email,

    maskedEmail:
      maskEmail(
        email
      ),
  };
}


/* ==========================================================================
   FORGOT PASSWORD
   SEND OTP
   ========================================================================== */

export async function sendAdminPasswordResetOTP(
  adminId: string
): Promise<SendAdminPasswordResetOTPResult> {

  cleanupExpiredPasswordResetEntries();


  const normalizedAdminId =
    normalizeAdminId(
      adminId
    );


  const admin =
    await findAdminById(
      normalizedAdminId
    );


  if (!admin) {

    return {
      success: false,
      reason: "NOT_FOUND",
    };
  }


  if (
    admin.status
      .trim()
      .toUpperCase() !==
    "ACTIVE"
  ) {

    return {
      success: false,
      reason: "INACTIVE",
    };
  }


  if (
    admin.role
      .trim()
      .toUpperCase() !==
    "ADMIN"
  ) {

    return {
      success: false,
      reason: "INVALID_ROLE",
    };
  }


  const email =
    normalizeEmail(
      admin.email
    );


  if (!email) {

    return {
      success: false,
      reason: "NO_EMAIL",
    };
  }


  if (
    !isValidGmail(
      email
    )
  ) {

    return {
      success: false,
      reason: "INVALID_EMAIL",
    };
  }


  if (
    !gmailTransporter
  ) {

    console.error(
      "Gmail transporter is not configured."
    );

    return {
      success: false,
      reason: "EMAIL_SEND_FAILED",
    };
  }


  const existingEntry =
    adminPasswordResetStore.get(
      normalizedAdminId
    );


  if (
    existingEntry
  ) {

    const elapsed =
      Date.now() -
      existingEntry.lastSentAt;


    if (
      elapsed <
      ADMIN_PASSWORD_RESET_RESEND_COOLDOWN_MS
    ) {

      const resendAfter =
        Math.ceil(
          (
            ADMIN_PASSWORD_RESET_RESEND_COOLDOWN_MS -
            elapsed
          ) / 1000
        );


      return {
        success: false,
        reason: "COOLDOWN",
        resendAfter,
      };
    }
  }


  const otp =
    generateOTP();


  const now =
    Date.now();


  const otpHash =
    hashSensitiveValue(
      otp
    );


  adminPasswordResetStore.set(
    normalizedAdminId,
    {
      otpHash,

      otpExpiresAt:
        now +
        ADMIN_PASSWORD_RESET_OTP_EXPIRY_MS,

      lastSentAt:
        now,

      attempts:
        0,

      resetTokenHash:
        undefined,

      resetTokenExpiresAt:
        undefined,
    }
  );


  try {

    await gmailTransporter.sendMail({

      from:
        gmailUser,

      to:
        email,

      subject:
        "ক্ষুদ্র সঞ্চয় - Admin Password Reset OTP",

      text:
        [
          "ক্ষুদ্র সঞ্চয়",
          "",
          "Admin Password Reset",
          "",
          `Your OTP is: ${otp}`,
          "",
          "This OTP is valid for 10 minutes.",
          "If you did not request a password reset, please ignore this email.",
        ].join("\n"),

      html:
        `
          <div
            style="
              font-family: Arial, sans-serif;
              max-width: 520px;
              margin: 0 auto;
              padding: 24px;
              background: #f8fafc;
              color: #0f172a;
            "
          >

            <div
              style="
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                padding: 28px;
              "
            >

              <h2
                style="
                  margin: 0 0 8px;
                  color: #0f172a;
                "
              >
                ক্ষুদ্র সঞ্চয়
              </h2>

              <p
                style="
                  margin: 0 0 24px;
                  color: #64748b;
                "
              >
                Admin Password Reset
              </p>

              <p>
                আপনার Admin password reset করার জন্য
                নিচের OTP ব্যবহার করুন:
              </p>

              <div
                style="
                  margin: 24px 0;
                  padding: 16px;
                  background: #f1f5f9;
                  border-radius: 12px;
                  text-align: center;
                  font-size: 30px;
                  font-weight: 800;
                  letter-spacing: 8px;
                  color: #0f172a;
                "
              >
                ${otp}
              </div>

              <p
                style="
                  color: #64748b;
                  font-size: 13px;
                "
              >
                এই OTP 10 মিনিট পর্যন্ত valid থাকবে।
              </p>

              <p
                style="
                  color: #64748b;
                  font-size: 13px;
                "
              >
                আপনি যদি password reset request না করে থাকেন,
                তাহলে এই email উপেক্ষা করুন।
              </p>

            </div>

          </div>
        `,
    });


    console.log(
      "Admin password reset OTP sent:",
      {
        adminId:
          normalizedAdminId,

        email,
      }
    );


    return {
      success: true,

      expiresIn:
        ADMIN_PASSWORD_RESET_OTP_EXPIRY_MS /
        1000,

      resendAfter:
        ADMIN_PASSWORD_RESET_RESEND_COOLDOWN_MS /
        1000,
    };

  } catch (error) {

    console.error(
      "================================================"
    );

    console.error(
      "ADMIN PASSWORD RESET OTP EMAIL ERROR"
    );

    console.error(
      error
    );

    if (
      error instanceof Error
    ) {

      console.error(
        "Error name:",
        error.name
      );

      console.error(
        "Error message:",
        error.message
      );

      console.error(
        "Error stack:",
        error.stack
      );
    }

    console.error(
      "================================================"
    );


    adminPasswordResetStore.delete(
      normalizedAdminId
    );


    return {
      success: false,
      reason: "EMAIL_SEND_FAILED",
    };
  }
}


/* ==========================================================================
   FORGOT PASSWORD
   VERIFY OTP
   ========================================================================== */

export async function verifyAdminPasswordResetOTP(
  adminId: string,
  otp: string
): Promise<VerifyAdminPasswordResetOTPResult> {

  cleanupExpiredPasswordResetEntries();


  const normalizedAdminId =
    normalizeAdminId(
      adminId
    );


  const admin =
    await findAdminById(
      normalizedAdminId
    );


  if (!admin) {

    return {
      success: false,
      reason: "NOT_FOUND",
    };
  }


  if (
    admin.status
      .trim()
      .toUpperCase() !==
    "ACTIVE"
  ) {

    return {
      success: false,
      reason: "INACTIVE",
    };
  }


  if (
    admin.role
      .trim()
      .toUpperCase() !==
    "ADMIN"
  ) {

    return {
      success: false,
      reason: "INVALID_ROLE",
    };
  }


  const entry =
    adminPasswordResetStore.get(
      normalizedAdminId
    );


  if (!entry) {

    return {
      success: false,
      reason: "NO_OTP",
    };
  }


  if (
    Date.now() >
    entry.otpExpiresAt
  ) {

    adminPasswordResetStore.delete(
      normalizedAdminId
    );


    return {
      success: false,
      reason: "OTP_EXPIRED",
    };
  }


  if (
    entry.attempts >=
    ADMIN_PASSWORD_RESET_MAX_ATTEMPTS
  ) {

    adminPasswordResetStore.delete(
      normalizedAdminId
    );


    return {
      success: false,
      reason: "TOO_MANY_ATTEMPTS",
    };
  }


  const normalizedOTP =
    String(
      otp ?? ""
    ).trim();


  if (
    !/^\d{6}$/.test(
      normalizedOTP
    )
  ) {

    entry.attempts += 1;

    return {
      success: false,
      reason: "INVALID_OTP",
    };
  }


  const suppliedOTPHash =
    hashSensitiveValue(
      normalizedOTP
    );


  const otpMatches =
    crypto.timingSafeEqual(
      Buffer.from(
        suppliedOTPHash,
        "utf8"
      ),
      Buffer.from(
        entry.otpHash,
        "utf8"
      )
    );


  if (!otpMatches) {

    entry.attempts += 1;


    if (
      entry.attempts >=
      ADMIN_PASSWORD_RESET_MAX_ATTEMPTS
    ) {

      adminPasswordResetStore.delete(
        normalizedAdminId
      );


      return {
        success: false,
        reason: "TOO_MANY_ATTEMPTS",
      };
    }


    return {
      success: false,
      reason: "INVALID_OTP",
    };
  }


  const resetToken =
    crypto.randomBytes(
      32
    ).toString("hex");


  const resetTokenHash =
    hashSensitiveValue(
      resetToken
    );


  entry.resetTokenHash =
    resetTokenHash;

  entry.resetTokenExpiresAt =
    Date.now() +
    ADMIN_PASSWORD_RESET_TOKEN_EXPIRY_MS;


  entry.otpHash = "";

  entry.otpExpiresAt = 0;

  entry.attempts = 0;


  adminPasswordResetStore.set(
    normalizedAdminId,
    entry
  );


  console.log(
    "Admin password reset OTP verified:",
    {
      adminId:
        normalizedAdminId,
    }
  );


  return {
    success: true,

    resetToken,

    expiresIn:
      ADMIN_PASSWORD_RESET_TOKEN_EXPIRY_MS /
      1000,
  };
}


/* ==========================================================================
   FORGOT PASSWORD
   RESET ADMIN PASSWORD
   ========================================================================== */

export async function resetAdminPassword(
  adminId: string,
  resetToken: string,
  newPassword: string,
  rePassword: string
): Promise<ResetAdminPasswordResult> {

  cleanupExpiredPasswordResetEntries();


  const normalizedAdminId =
    normalizeAdminId(
      adminId
    );


  const admin =
    await findAdminById(
      normalizedAdminId
    );


  if (!admin) {

    return {
      success: false,
      reason: "NOT_FOUND",
    };
  }


  if (
    admin.status
      .trim()
      .toUpperCase() !==
    "ACTIVE"
  ) {

    return {
      success: false,
      reason: "INACTIVE",
    };
  }


  if (
    admin.role
      .trim()
      .toUpperCase() !==
    "ADMIN"
  ) {

    return {
      success: false,
      reason: "INVALID_ROLE",
    };
  }


  const entry =
    adminPasswordResetStore.get(
      normalizedAdminId
    );


  if (
    !entry ||
    !entry.resetTokenHash ||
    !entry.resetTokenExpiresAt
  ) {

    return {
      success: false,
      reason: "NO_RESET_TOKEN",
    };
  }


  if (
    Date.now() >
    entry.resetTokenExpiresAt
  ) {

    adminPasswordResetStore.delete(
      normalizedAdminId
    );


    return {
      success: false,
      reason: "RESET_TOKEN_EXPIRED",
    };
  }


  const normalizedResetToken =
    String(
      resetToken ?? ""
    ).trim();


  if (
    !normalizedResetToken
  ) {

    return {
      success: false,
      reason: "INVALID_RESET_TOKEN",
    };
  }


  const suppliedTokenHash =
    hashSensitiveValue(
      normalizedResetToken
    );


  const tokenMatches =
    crypto.timingSafeEqual(
      Buffer.from(
        suppliedTokenHash,
        "utf8"
      ),
      Buffer.from(
        entry.resetTokenHash,
        "utf8"
      )
    );


  if (!tokenMatches) {

    return {
      success: false,
      reason: "INVALID_RESET_TOKEN",
    };
  }


  if (
    !newPassword ||
    newPassword.length < 6
  ) {

    return {
      success: false,
      reason: "INVALID_NEW_PASSWORD",
    };
  }


  if (
    newPassword !==
    rePassword
  ) {

    return {
      success: false,
      reason: "PASSWORD_MISMATCH",
    };
  }


  if (
    admin.passwordHash
  ) {

    const sameAsCurrent =
      await verifyAdminPassword(
        newPassword,
        admin.passwordHash
      );


    if (sameAsCurrent) {

      return {
        success: false,
        reason: "SAME_PASSWORD",
      };
    }
  }


  const newPasswordHash =
    await hashAdminPassword(
      newPassword
    );


  const rows =
    await getSheetValues(
      "Admins!A:k"
    );


  if (
    !rows ||
    rows.length <= 1
  ) {

    return {
      success: false,
      reason: "NOT_FOUND",
    };
  }


  const dataRows =
    rows.slice(1);


  const rowIndex =
    dataRows.findIndex(
      (row) =>
        String(
          row[0] ?? ""
        )
          .trim()
          .toUpperCase() ===
        normalizedAdminId
    );


  if (
    rowIndex === -1
  ) {

    return {
      success: false,
      reason: "NOT_FOUND",
    };
  }


  const sheetRowNumber =
    rowIndex + 2;


  await updateSheetValues(
    `Admins!E${sheetRowNumber}`,
    [
      [
        newPasswordHash,
      ],
    ]
  );


  const now =
    new Date().toISOString();


  await updateSheetValues(
    `Admins!I${sheetRowNumber}`,
    [
      [
        now,
      ],
    ]
  );


  adminPasswordResetStore.delete(
    normalizedAdminId
  );


  console.log(
    "Admin password reset successfully:",
    {
      adminId:
        normalizedAdminId,
    }
  );


  return {
    success: true,
  };
}


/* ==========================================================================
   Get Pending Admin Deposits
   --------------------------------------------------------------------------
   Pending Deposits remains A:P.

   A = Deposit ID / existing request ID
   B = Member ID
   C = Member Name
   D = Share Count
   E = Weekly Amount
   F = Weeks
   G = Deposit Amount
   H = bKash Charge
   I = Payable Amount
   J = Payment Method
   K = Sender Number
   L = Status
   M = Request Date
   N = Approved Date
   O = Admin ID
   P = Notes
   ========================================================================== */

export async function getPendingAdminDeposits(): Promise<
  AdminPendingDeposit[]
> {

  const rows =
    await getSheetValues(
      "Pending Deposits!A:P"
    );


  if (
    !rows ||
    rows.length <= 1
  ) {
    return [];
  }


  const dataRows =
    rows.slice(1);

  const pendingDeposits:
    AdminPendingDeposit[] = [];


  dataRows.forEach(
    (row, index) => {

      const requestId =
        String(
          row[0] ?? ""
        ).trim();

      const memberId =
        String(
          row[1] ?? ""
        ).trim();

      const memberName =
        String(
          row[2] ?? ""
        ).trim();

      const status =
        String(
          row[11] ?? ""
        )
          .trim()
          .toUpperCase();


      if (
        !requestId ||
        !memberId
      ) {
        return;
      }


      if (
        status !==
        "PENDING"
      ) {
        return;
      }


      const paymentMethod =
        String(
          row[9] ?? ""
        )
          .trim()
          .toLowerCase();


      const sheetRowNumber =
        index + 2;


      pendingDeposits.push({

        rowIndex:
          sheetRowNumber,

        requestId,

        memberId,

        memberName,

        shareCount:
          Number(
            row[3] ?? 0
          ),

        weeklyAmount:
          Number(
            row[4] ?? 0
          ),

        weeks:
          Number(
            row[5] ?? 0
          ),

        depositAmount:
          Number(
            row[6] ?? 0
          ),

        bkashCharge:
          Number(
            row[7] ?? 0
          ),

        payableAmount:
          Number(
            row[8] ?? 0
          ),

        paymentMethod:
          paymentMethod ===
            "bkash"
            ? "bkash"
            : "cash",

        senderNumber:
          String(
            row[10] ?? ""
          ).trim(),

        status:
          "PENDING",

        requestDate:
          String(
            row[12] ?? ""
          ).trim(),

        approvedDate:
          String(
            row[13] ?? ""
          ).trim(),

        adminId:
          String(
            row[14] ?? ""
          ).trim(),

        notes:
          String(
            row[15] ?? ""
          ).trim(),
      });
    }
  );


  pendingDeposits.sort(
    (
      a,
      b
    ) =>
      new Date(
        b.requestDate
      ).getTime() -
      new Date(
        a.requestDate
      ).getTime()
  );


  return pendingDeposits;
}

export async function getAdminDepositHistory(): Promise<
  AdminPendingDeposit[]
> {
  const rows =
    await getSheetValues(
      "Pending Deposits!A:P"
    );

  if (!rows || rows.length <= 1) {
    return [];
  }

  const dataRows = rows.slice(1);
  const historyDeposits: AdminPendingDeposit[] = [];

  dataRows.forEach((row, index) => {
    const requestId =
      String(row[0] ?? "").trim();

    const memberId =
      String(row[1] ?? "").trim();

    const memberName =
      String(row[2] ?? "").trim();

    const status =
      String(row[11] ?? "")
        .trim()
        .toUpperCase();

    if (!requestId || !memberId) {
      return;
    }

    if (
      status !== "APPROVED" &&
      status !== "REJECTED"
    ) {
      return;
    }

    const paymentMethod =
      String(row[9] ?? "")
        .trim()
        .toLowerCase();

    const sheetRowNumber =
      index + 2;

    historyDeposits.push({
      rowIndex: sheetRowNumber,
      requestId,
      memberId,
      memberName,
      shareCount: Number(row[3] ?? 0),
      weeklyAmount: Number(row[4] ?? 0),
      weeks: Number(row[5] ?? 0),
      depositAmount: Number(row[6] ?? 0),
      bkashCharge: Number(row[7] ?? 0),
      payableAmount: Number(row[8] ?? 0),
      paymentMethod:
        paymentMethod === "bkash"
          ? "bkash"
          : "cash",
      senderNumber:
        String(row[10] ?? "").trim(),
      status:
        status === "APPROVED"
          ? "APPROVED"
          : "REJECTED",
      requestDate:
        String(row[12] ?? "").trim(),
      approvedDate:
        String(row[13] ?? "").trim(),
      adminId:
        String(row[14] ?? "").trim(),
      notes:
        String(row[15] ?? "").trim(),
    });
  });

  historyDeposits.sort(
    (a, b) =>
      new Date(b.requestDate).getTime() -
      new Date(a.requestDate).getTime()
  );

  return historyDeposits;
}


/* ==========================================================================
   CREATE ADMIN WEEKLY DEPOSIT
   --------------------------------------------------------------------------
   Admin নিজেই deposit করছে।

   Flow:
   1. Pending Deposits-এ ONE APPROVED record
   2. Collections-এ প্রতিটি সপ্তাহের জন্য ONE WEEKLY record
   3. কোনো ADVANCE record তৈরি হবে না
   4. কোনো approval step নেই

   Pending Deposits A:P:

   A = Deposit ID
   B = Member ID
   C = Member Name
   D = Share Count
   E = Weekly Amount
   F = Weeks
   G = Deposit Amount
   H = bKash Charge
   I = Payable Amount
   J = Payment Method
   K = Sender Number
   L = Status
   M = Request Date
   N = Approved Date
   O = Admin ID
   P = Notes

   Collections A:L:

   A = Collection ID
   B = Member ID
   C = Member Name
   D = Week
   E = Share Count
   F = Expected Amount
   G = Arrears
   H = Paid Amount
   I = Status
   J = Date
   K = Admin ID
   L = Notes
   ========================================================================== */

export type CreateAdminWeeklyDepositResult = {
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


export async function createAdminWeeklyDeposit(
  memberId: string,
  weeks: number,
  paymentMethod: AdminDepositPaymentMethod,
  adminId: string
): Promise<CreateAdminWeeklyDepositResult> {

  const cleanMemberId =
    String(
      memberId || ""
    ).trim();

  const cleanAdminId =
    String(
      adminId || ""
    ).trim();

  const cleanPaymentMethod =
    String(
      paymentMethod || ""
    )
      .trim()
      .toLowerCase();


  /* ------------------------------------------------------------------------
     1. Basic Validation
     ------------------------------------------------------------------------ */

  if (!cleanMemberId) {
    throw new Error(
      "MEMBER_ID_REQUIRED"
    );
  }

  if (!cleanAdminId) {
    throw new Error(
      "ADMIN_ID_REQUIRED"
    );
  }

  if (
    !Number.isInteger(
      weeks
    ) ||
    weeks < 1 ||
    weeks > 52
  ) {
    throw new Error(
      "INVALID_WEEKS"
    );
  }

  if (
    cleanPaymentMethod !== "cash" &&
    cleanPaymentMethod !== "bkash"
  ) {
    throw new Error(
      "INVALID_PAYMENT_METHOD"
    );
  }


  /* ------------------------------------------------------------------------
     2. Read Member
     ------------------------------------------------------------------------ */

  const memberRows =
    await getSheetValues(
      "Members!A:k"
    );


  if (
    !memberRows ||
    memberRows.length <= 1
  ) {
    throw new Error(
      "MEMBER_NOT_FOUND"
    );
  }


  const memberRow =
    memberRows.find(
      (row, index) =>
        index > 0 &&
        String(
          row[0] ?? ""
        ).trim() ===
        cleanMemberId
    );


  if (!memberRow) {
    throw new Error(
      "MEMBER_NOT_FOUND"
    );
  }


  const memberName =
    String(
      memberRow[1] ?? ""
    ).trim();


  const memberStatus =
    String(
      memberRow[7] ?? ""
    )
      .trim()
      .toUpperCase();


  if (
    memberStatus !==
    "ACTIVE"
  ) {
    throw new Error(
      "INACTIVE_MEMBER"
    );
  }


  const shareCount =
    Number(
      memberRow[4] ?? 0
    );


  const weeklyAmountFromSheet =
    Number(
      memberRow[5] ?? 0
    );


  const weeklyAmount =
    weeklyAmountFromSheet > 0
      ? weeklyAmountFromSheet
      : shareCount * 50;


  if (
    !Number.isFinite(
      shareCount
    ) ||
    shareCount < 1
  ) {
    throw new Error(
      "INVALID_SHARE_COUNT"
    );
  }


  if (
    !Number.isFinite(
      weeklyAmount
    ) ||
    weeklyAmount <= 0 ||
    weeklyAmount % 50 !== 0
  ) {
    throw new Error(
      "INVALID_WEEKLY_AMOUNT"
    );
  }


  /* ------------------------------------------------------------------------
     3. Calculate Deposit Amount
     ------------------------------------------------------------------------ */

  const depositAmount =
    weeklyAmount *
    weeks;


  if (
    !Number.isFinite(
      depositAmount
    ) ||
    depositAmount <= 0
  ) {
    throw new Error(
      "INVALID_DEPOSIT_AMOUNT"
    );
  }


  /* ------------------------------------------------------------------------
     4. Read Existing Collections
     ------------------------------------------------------------------------ */

  const collectionRows =
    await getSheetValues(
      "Collections!A:L"
    );


  const parsedCollections =
    parseCollections(
      collectionRows
    );


  const memberCollectionRows =
    parsedCollections.filter(
      (collection) =>
        collection.memberId ===
        cleanMemberId
    );


  /* ------------------------------------------------------------------------
     5. Find Last Recorded Week
     ------------------------------------------------------------------------
     Admin Weekly Deposit will start from the next recorded unpaid week.

     Example:

     Week 1 = paid
     Week 2 = paid
     Week 3 = paid

     Admin deposits 3 weeks:

     Week 4
     Week 5
     Week 6
     ------------------------------------------------------------------------ */

  const collectionWeek =
    memberCollectionRows.length > 0
      ? Math.max(
        ...memberCollectionRows.map(
          (collection) =>
            collection.weekNumber
        )
      )
      : 0;


  /* ------------------------------------------------------------------------
     6. Determine Member Starting Week
     ------------------------------------------------------------------------ */

  const parseMemberJoinDate = (
    value: string
  ): Date | null => {

    const clean =
      String(
        value || ""
      ).trim();


    if (!clean) {
      return null;
    }


    let day = 0;
    let month = 0;
    let year = 0;


    let match =
      clean.match(
        /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/
      );


    if (match) {

      day =
        Number(
          match[1]
        );

      month =
        Number(
          match[2]
        );

      year =
        Number(
          match[3]
        );

    } else {

      match =
        clean.match(
          /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/
        );


      if (match) {

        year =
          Number(
            match[1]
          );

        month =
          Number(
            match[2]
          );

        day =
          Number(
            match[3]
          );
      }
    }


    if (
      !day ||
      !month ||
      !year
    ) {
      return null;
    }


    const date =
      new Date(
        Date.UTC(
          year,
          month - 1,
          day
        )
      );


    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }


    return date;
  };


  const joinDate =
    parseMemberJoinDate(
      String(
        memberRow[3] ?? ""
      )
    );


  let memberStartWeek =
    1;


  if (joinDate) {

    const diff =
      joinDate.getTime() -
      WEEK_1_START_UTC;


    memberStartWeek =
      Math.floor(
        diff /
        DAYS_IN_WEEK_MS
      ) + 1;


    memberStartWeek =
      Math.max(
        1,
        memberStartWeek
      );
  }


  /* ------------------------------------------------------------------------
     7. Determine Allocation Week
     ------------------------------------------------------------------------
     No ADVANCE calculation.

     Every selected week becomes a normal WEEKLY collection.
     ------------------------------------------------------------------------ */

  const allocationWeek =
    memberCollectionRows.length > 0
      ? Math.max(
        collectionWeek + 1,
        memberStartWeek
      )
      : memberStartWeek;


  /* ------------------------------------------------------------------------
     8. Duplicate / Existing Week Protection
     ------------------------------------------------------------------------ */

  const existingMemberWeeks =
    new Set(
      memberCollectionRows.map(
        (collection) =>
          collection.weekNumber
      )
    );


  for (
    let index = 0;
    index < weeks;
    index++
  ) {

    const weekNumber =
      allocationWeek +
      index;


    if (
      existingMemberWeeks.has(
        weekNumber
      )
    ) {
      throw new Error(
        "WEEK_ALREADY_RECORDED"
      );
    }
  }


  /* ------------------------------------------------------------------------
     9. Generate Admin Deposit ID
     ------------------------------------------------------------------------
     This ID is stored in Pending Deposits column A.

     Prefix makes it clear that this transaction was created directly
     by Admin Weekly Deposit.
     ------------------------------------------------------------------------ */

  const now =
    new Date();


  const requestDate =
    now.toISOString();


  const approvedDate =
    requestDate;

  const pendingDepositRows =
    await getSheetValues(
      "Pending Deposits!A:P"
    );

  const requestId =
    getNextDepositId(
      pendingDepositRows
    );


  const adminDepositNote =
    "ADMIN_DEPOSIT";


  /* ------------------------------------------------------------------------
     10. Write ONE Record To Pending Deposits First
     ------------------------------------------------------------------------
     IMPORTANT:

     Admin deposit does NOT remain PENDING.

     It is immediately APPROVED.

     No bKash charge is added here because this is an Admin-created
     accounting entry.
     ------------------------------------------------------------------------ */

  await appendSheetRow(
    "Pending Deposits!A:P",
    [
      requestId,

      cleanMemberId,

      memberName,

      String(
        shareCount
      ),

      String(
        weeklyAmount
      ),

      String(
        weeks
      ),

      String(
        depositAmount
      ),

      "0",

      String(
        depositAmount
      ),

      cleanPaymentMethod,

      "",

      "APPROVED",

      requestDate,

      approvedDate,

      cleanAdminId,

      adminDepositNote,
    ]
  );


  /* ------------------------------------------------------------------------
     11. Re-read Collections Before Creating Rows
     ------------------------------------------------------------------------ */

  const latestCollectionRows =
    await getSheetValues(
      "Collections!A:L"
    );


  const latestParsedCollections =
    parseCollections(
      latestCollectionRows
    );


  const latestMemberCollections =
    latestParsedCollections.filter(
      (collection) =>
        collection.memberId ===
        cleanMemberId
    );


  const latestCollectionWeek =
    latestMemberCollections.length > 0
      ? Math.max(
        ...latestMemberCollections.map(
          (collection) =>
            collection.weekNumber
        )
      )
      : 0;


  const finalAllocationWeek =
    latestMemberCollections.length > 0
      ? Math.max(
        latestCollectionWeek + 1,
        memberStartWeek
      )
      : memberStartWeek;


  /* ------------------------------------------------------------------------
     12. Final Week Duplicate Protection
     ------------------------------------------------------------------------ */

  const latestExistingWeeks =
    new Set(
      latestMemberCollections.map(
        (collection) =>
          collection.weekNumber
      )
    );


  for (
    let index = 0;
    index < weeks;
    index++
  ) {

    const weekNumber =
      finalAllocationWeek +
      index;


    if (
      latestExistingWeeks.has(
        weekNumber
      )
    ) {
      throw new Error(
        "WEEK_ALREADY_RECORDED"
      );
    }
  }


  /* ------------------------------------------------------------------------
     13. Generate Collection Rows
     ------------------------------------------------------------------------ */

  let nextCollectionId =
    getNextCollectionId(
      latestCollectionRows
    );


  const allocatedWeeks:
    number[] = [];


  const newCollectionRows:
    any[][] = [];


  for (
    let index = 0;
    index < weeks;
    index++
  ) {

    const weekNumber =
      finalAllocationWeek +
      index;


    const collectionDate =
      getCollectionDateByWeek(
        weekNumber
      );


    newCollectionRows.push([
      nextCollectionId,

      cleanMemberId,

      memberName,

      `Week ${weekNumber}`,

      String(
        shareCount
      ),

      String(
        weeklyAmount
      ),

      "0",

      String(
        weeklyAmount
      ),

      "PAID",

      collectionDate,

      cleanAdminId,

      adminDepositNote,
    ]);


    allocatedWeeks.push(
      weekNumber
    );


    const collectionNumber =
      Number(
        nextCollectionId.replace(
          "COL-",
          ""
        )
      );


    nextCollectionId =
      `COL-${String(
        collectionNumber + 1
      ).padStart(
        6,
        "0"
      )}`;
  }


  /* ------------------------------------------------------------------------
     14. Append Collections
     ------------------------------------------------------------------------
     One week = one WEEKLY collection row.

     কোনো ADVANCE row নেই।
     ------------------------------------------------------------------------ */

  for (
    const row of newCollectionRows
  ) {

    await appendSheetRow(
      "Collections!A:L",
      row
    );
  }


  /* ------------------------------------------------------------------------
     15. Final Result
     ------------------------------------------------------------------------ */

  const latestCoveredWeek =
    allocatedWeeks.length > 0
      ? Math.max(
        ...allocatedWeeks
      )
      : finalAllocationWeek;


  return {

    requestId,

    memberId:
      cleanMemberId,

    memberName,

    shareCount,

    weeklyAmount,

    weeks,

    depositAmount,

    paymentMethod:
      cleanPaymentMethod === "bkash"
        ? "bkash"
        : "cash",

    collectionWeek:
      latestCollectionWeek,

    allocationWeek:
      finalAllocationWeek,

    latestCoveredWeek,

    allocatedWeeks,

    weeklyEntries:
      newCollectionRows.length,

    advanceEntries:
      0,

    status:
      "APPROVED",

    approvedDate,

    adminId:
      cleanAdminId,
  };
}


/* ==========================================================================
   APPROVE PENDING DEPOSIT
   ========================================================================== */

export async function approvePendingAdminDeposit(
  requestId: string,
  adminId: string
): Promise<ApprovePendingDepositResult> {

  const cleanRequestId =
    String(
      requestId || ""
    ).trim();

  const cleanAdminId =
    String(
      adminId || ""
    ).trim();


  if (!cleanRequestId) {
    throw new Error(
      "REQUEST_ID_REQUIRED"
    );
  }


  if (!cleanAdminId) {
    throw new Error(
      "ADMIN_ID_REQUIRED"
    );
  }


  /* ------------------------------------------------------------------------
     1. Read Pending Deposit Request
     ------------------------------------------------------------------------ */

  const pendingRows =
    await getSheetValues(
      "Pending Deposits!A:P"
    );


  const requestRowIndex =
    pendingRows.findIndex(
      (row, index) =>
        index > 0 &&
        String(
          row[0] ?? ""
        ).trim() ===
        cleanRequestId
    );


  if (
    requestRowIndex === -1
  ) {
    throw new Error(
      "REQUEST_NOT_FOUND"
    );
  }


  const requestRow =
    pendingRows[
    requestRowIndex
    ];


  const currentStatus =
    String(
      requestRow[11] ?? ""
    )
      .trim()
      .toUpperCase();


  if (
    currentStatus ===
    "APPROVED"
  ) {
    throw new Error(
      "REQUEST_ALREADY_APPROVED"
    );
  }


  if (
    currentStatus ===
    "REJECTED"
  ) {
    throw new Error(
      "REQUEST_ALREADY_REJECTED"
    );
  }


  if (
    currentStatus !==
    "PENDING"
  ) {
    throw new Error(
      "INVALID_REQUEST_STATUS"
    );
  }


  /* ------------------------------------------------------------------------
     2. Extract Request Information
     ------------------------------------------------------------------------ */

  const memberId =
    String(
      requestRow[1] ?? ""
    ).trim();

  const memberName =
    String(
      requestRow[2] ?? ""
    ).trim();

  const requestWeeks =
    Number(
      requestRow[5] ?? 0
    );

  const depositAmount =
    Number(
      requestRow[6] ?? 0
    );

  const paymentMethod =
    String(
      requestRow[9] ?? ""
    )
      .trim()
      .toLowerCase();


  if (!memberId) {
    throw new Error(
      "MEMBER_ID_MISSING"
    );
  }


  if (
    !Number.isInteger(
      requestWeeks
    ) ||
    requestWeeks < 1 ||
    requestWeeks > 52
  ) {
    throw new Error(
      "INVALID_DEPOSIT_AMOUNT"
    );
  }


  if (
    !Number.isFinite(
      depositAmount
    ) ||
    depositAmount <= 0
  ) {
    throw new Error(
      "INVALID_DEPOSIT_AMOUNT"
    );
  }


  if (
    paymentMethod !==
    "cash" &&
    paymentMethod !==
    "bkash"
  ) {
    throw new Error(
      "INVALID_PAYMENT_METHOD"
    );
  }


  /* ------------------------------------------------------------------------
     3. Duplicate Protection
     ------------------------------------------------------------------------
     Final Collections structure is A:L.

     Deposit ID is stored in Notes:
     "Pending Deposit DEP-000001"

     One approved deposit may create multiple Collection rows.
     Therefore any matching Notes value means this request was already
     processed.
     ------------------------------------------------------------------------ */

  const collectionsBeforeApproval =
    await getSheetValues(
      "Collections!A:L"
    );


  const duplicateNote =
    `Pending Deposit ${cleanRequestId}`;


  const alreadyProcessed =
    collectionsBeforeApproval.some(
      (row) =>
        String(
          row[11] ?? ""
        ).trim() ===
        duplicateNote
    );


  if (
    alreadyProcessed
  ) {
    throw new Error(
      "REQUEST_ALREADY_PROCESSED"
    );
  }


  /* ------------------------------------------------------------------------
     4. Read Member
     ------------------------------------------------------------------------ */

  const memberRows =
    await getSheetValues(
      "Members!A:k"
    );


  const memberRow =
    memberRows.find(
      (row) =>
        String(
          row[0] ?? ""
        ).trim() ===
        memberId
    );


  if (!memberRow) {
    throw new Error(
      "MEMBER_NOT_FOUND"
    );
  }


  const memberStatus =
    String(
      memberRow[7] ?? ""
    )
      .trim()
      .toUpperCase();


  if (
    memberStatus !==
    "ACTIVE"
  ) {
    throw new Error(
      "INACTIVE_MEMBER"
    );
  }


  const shareCount =
    Number(
      memberRow[4] ?? 0
    );


  const weeklyAmountFromSheet =
    Number(
      memberRow[5] ?? 0
    );


  const weeklyAmount =
    weeklyAmountFromSheet > 0
      ? weeklyAmountFromSheet
      : shareCount * 50;


  if (
    !Number.isFinite(
      weeklyAmount
    ) ||
    weeklyAmount <= 0 ||
    weeklyAmount % 50 !== 0
  ) {
    throw new Error(
      "INVALID_WEEKLY_AMOUNT"
    );
  }


  /* ------------------------------------------------------------------------
     5. Deposit Request Amount Validation
     ------------------------------------------------------------------------
     Example:

     Weekly Amount = 50
     Weeks = 3

     Deposit Amount must be:

     50 × 3 = 150

     This guarantees that every approved deposit can be divided into
     complete weekly payments.
     ------------------------------------------------------------------------ */

  const expectedDepositAmount =
    weeklyAmount *
    requestWeeks;


  if (
    depositAmount !==
    expectedDepositAmount
  ) {
    throw new Error(
      "INVALID_DEPOSIT_AMOUNT"
    );
  }


  /* ------------------------------------------------------------------------
     6. Read Existing Collections
     ------------------------------------------------------------------------ */

  const collectionRows =
    await getSheetValues(
      "Collections!A:L"
    );


  const memberCollectionRows =
    parseCollections(
      collectionRows
    ).filter(
      (collection) =>
        collection.memberId ===
        memberId
    );


  /* ------------------------------------------------------------------------
     7. Find Last Paid Week
     ------------------------------------------------------------------------
     New accounting rule:

     The last Collection Week already recorded for this member is the
     latest week that has already been paid.

     The new deposit starts from the next week.

     Example:

     Existing:
       Week 1 = PAID
       Week 2 = PAID
       Week 3 = PAID
       Week 4 = PAID

     New deposit:
       150 টাকা

     New rows:
       Week 5 = 50
       Week 6 = 50
       Week 7 = 50
     ------------------------------------------------------------------------ */

  const collectionWeek =
    memberCollectionRows.length > 0
      ? Math.max(
        ...memberCollectionRows.map(
          (collection) =>
            collection.weekNumber
        )
      )
      : 0;


  /* ------------------------------------------------------------------------
     8. Determine Member Starting Week
     ------------------------------------------------------------------------ */

  const parseMemberJoinDate = (
    value: string
  ): Date | null => {

    const clean =
      String(
        value || ""
      ).trim();


    if (!clean) {
      return null;
    }


    let day = 0;
    let month = 0;
    let year = 0;


    let match =
      clean.match(
        /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/
      );


    if (match) {

      day =
        Number(
          match[1]
        );

      month =
        Number(
          match[2]
        );

      year =
        Number(
          match[3]
        );

    } else {

      match =
        clean.match(
          /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/
        );


      if (match) {

        year =
          Number(
            match[1]
          );

        month =
          Number(
            match[2]
          );

        day =
          Number(
            match[3]
          );
      }
    }


    if (
      !day ||
      !month ||
      !year
    ) {
      return null;
    }


    return new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );
  };


  const joinDate =
    parseMemberJoinDate(
      String(
        memberRow[3] ?? ""
      )
    );


  let memberStartWeek =
    1;


  if (joinDate) {

    const diff =
      joinDate.getTime() -
      WEEK_1_START_UTC;


    memberStartWeek =
      Math.floor(
        diff /
        DAYS_IN_WEEK_MS
      ) + 1;


    memberStartWeek =
      Math.max(
        1,
        memberStartWeek
      );
  }


  /* ------------------------------------------------------------------------
     9. Decide Allocation Week
     ------------------------------------------------------------------------
     The deposit always starts from the next unpaid week.

     If no previous Collection exists:
       allocationWeek = memberStartWeek

     Otherwise:
       allocationWeek = last recorded week + 1
     ------------------------------------------------------------------------ */

  const allocationWeek =
    memberCollectionRows.length > 0
      ? Math.max(
        collectionWeek + 1,
        memberStartWeek
      )
      : memberStartWeek;


  /* ------------------------------------------------------------------------
     10. Generate Collection Rows
     ------------------------------------------------------------------------
     IMPORTANT:

     There is NO ADVANCE row anymore.

     Every deposited week gets its own Collection row.

     Example:

     Deposit = 100
     Weekly = 50

     Week 1:
       Expected Amount = 50
       Paid Amount     = 50

     Week 2:
       Expected Amount = 50
       Paid Amount     = 50


     Deposit = 150
     Weekly = 50

     Week 1:
       Paid = 50

     Week 2:
       Paid = 50

     Week 3:
       Paid = 50
     ------------------------------------------------------------------------ */

  let remainingDeposit =
    depositAmount;


  const newCollectionRows:
    any[][] = [];


  const allocatedWeeks:
    number[] = [];


  /* ------------------------------------------------------------------------
     11. Generate Next Collection ID
     ------------------------------------------------------------------------ */

  let nextCollectionId =
    getNextCollectionId(
      collectionRows
    );


  /* ------------------------------------------------------------------------
     12. Create One Row Per Paid Week
     ------------------------------------------------------------------------ */

  for (
    let index = 0;
    index < requestWeeks;
    index++
  ) {

    const weekNumber =
      allocationWeek +
      index;


    const collectionDate =
      getCollectionDateByWeek(
        weekNumber
      );


    /*
     * Final Collections A:L
     *
     * A = Collection ID
     * B = Member ID
     * C = Member Name
     * D = Week
     * E = Share Count
     * F = Expected Amount
     * G = Arrears
     * H = Paid Amount
     * I = Status
     * J = Date
     * K = Admin ID
     * L = Notes
     */

    newCollectionRows.push([
      nextCollectionId,

      memberId,

      memberName,

      `Week ${weekNumber}`,

      String(
        shareCount
      ),

      String(
        weeklyAmount
      ),

      "0",

      String(
        weeklyAmount
      ),

      "PAID",

      collectionDate,

      cleanAdminId,

      duplicateNote,
    ]);


    allocatedWeeks.push(
      weekNumber
    );


    /* Increment Collection ID */

    const collectionNumber =
      Number(
        nextCollectionId.replace(
          "COL-",
          ""
        )
      );


    nextCollectionId =
      `COL-${String(
        collectionNumber + 1
      ).padStart(
        6,
        "0"
      )}`;


    remainingDeposit -=
      weeklyAmount;
  }


  /* ------------------------------------------------------------------------
     13. Safety Check
     ------------------------------------------------------------------------ */

  if (
    newCollectionRows.length === 0 ||
    remainingDeposit !== 0
  ) {

    throw new Error(
      "DEPOSIT_ALLOCATION_FAILED"
    );
  }


  /* ------------------------------------------------------------------------
     14. Re-check Pending Request Before Writing
     ------------------------------------------------------------------------ */

  const latestPendingRows =
    await getSheetValues(
      "Pending Deposits!A:P"
    );


  const latestRequestRow =
    latestPendingRows.find(
      (row, index) =>
        index > 0 &&
        String(
          row[0] ?? ""
        ).trim() ===
        cleanRequestId
    );


  if (!latestRequestRow) {

    throw new Error(
      "REQUEST_NOT_FOUND"
    );
  }


  const latestStatus =
    String(
      latestRequestRow[11] ?? ""
    )
      .trim()
      .toUpperCase();


  if (
    latestStatus ===
    "APPROVED"
  ) {

    throw new Error(
      "REQUEST_ALREADY_APPROVED"
    );
  }


  if (
    latestStatus ===
    "REJECTED"
  ) {

    throw new Error(
      "REQUEST_ALREADY_REJECTED"
    );
  }


  if (
    latestStatus !==
    "PENDING"
  ) {

    throw new Error(
      "INVALID_REQUEST_STATUS"
    );
  }


  /* ------------------------------------------------------------------------
     15. Final Duplicate Check
     ------------------------------------------------------------------------ */

  const latestCollections =
    await getSheetValues(
      "Collections!A:L"
    );


  const duplicateAfterRefresh =
    latestCollections.some(
      (row) =>
        String(
          row[11] ?? ""
        ).trim() ===
        duplicateNote
    );


  if (
    duplicateAfterRefresh
  ) {

    throw new Error(
      "REQUEST_ALREADY_PROCESSED"
    );
  }


  /* ------------------------------------------------------------------------
     16. Append Collection Rows
     ------------------------------------------------------------------------ */

  for (
    const row of
    newCollectionRows
  ) {

    await appendSheetRow(
      "Collections!A:L",
      row
    );
  }


  /* ------------------------------------------------------------------------
     17. Calculate Final Covered Week
     ------------------------------------------------------------------------ */

  const uniqueAllocatedWeeks =
    Array.from(
      new Set(
        allocatedWeeks
      )
    ).sort(
      (a, b) =>
        a - b
    );


  const newLatestCoveredWeek =
    uniqueAllocatedWeeks.length > 0
      ? Math.max(
        ...uniqueAllocatedWeeks
      )
      : collectionWeek;


  /* ------------------------------------------------------------------------
     18. Mark Pending Deposit As APPROVED
     ------------------------------------------------------------------------ */

  const approvedDate =
    new Date().toISOString();


  /*
   * latestPendingRows:
   *
   * index 0 = header
   * index 1 = Google Sheet row 2
   *
   * Therefore:
   * Google Sheet row = array index + 1
   */

  const pendingSheetRowNumber =
    latestPendingRows.indexOf(
      latestRequestRow
    ) + 1;


  await updateSheetValues(
    `Pending Deposits!L${pendingSheetRowNumber}:P${pendingSheetRowNumber}`,
    [
      [
        "APPROVED",

        String(
          latestRequestRow[12] ?? ""
        ).trim(),

        approvedDate,

        cleanAdminId,

        uniqueAllocatedWeeks.length === 1
          ? `Approved. Covered: Week ${uniqueAllocatedWeeks[0]}`
          : `Approved. Covered: Week ${uniqueAllocatedWeeks[0]} – Week ${uniqueAllocatedWeeks[uniqueAllocatedWeeks.length - 1]}`,
      ],
    ]
  );


  /* ------------------------------------------------------------------------
     19. Return Approval Result
     ------------------------------------------------------------------------ */

  return {

    requestId:
      cleanRequestId,

    memberId,

    memberName,

    shareCount,

    weeklyAmount,

    weeks:
      requestWeeks,

    depositAmount,

    paymentMethod,

    collectionWeek,

    allocationWeek,

    latestCoveredWeek:
      newLatestCoveredWeek,

    allocatedWeeks:
      uniqueAllocatedWeeks,

    /*
     * There is no ADVANCE entry anymore.
     *
     * Every approved deposit week is a normal Collection row.
     */

    weeklyEntries:
      newCollectionRows.length,

    advanceEntries:
      0,

    status:
      "APPROVED",

    approvedDate,

    adminId:
      cleanAdminId,
  };
}


/* ==========================================================================
   REJECT PENDING DEPOSIT
   ========================================================================== */

export async function rejectPendingAdminDeposit(
  requestId: string,
  adminId: string,
  notes: string = ""
): Promise<RejectPendingDepositResult> {

  const cleanRequestId =
    String(
      requestId || ""
    ).trim();

  const cleanAdminId =
    String(
      adminId || ""
    ).trim();

  const cleanNotes =
    String(
      notes || ""
    ).trim();


  if (!cleanRequestId) {

    throw new Error(
      "REQUEST_ID_REQUIRED"
    );
  }


  if (!cleanAdminId) {

    throw new Error(
      "ADMIN_ID_REQUIRED"
    );
  }


  /* ------------------------------------------------------------------------
     1. Read Pending Deposits
     ------------------------------------------------------------------------ */

  const pendingRows =
    await getSheetValues(
      "Pending Deposits!A:P"
    );


  if (
    !pendingRows ||
    pendingRows.length <= 1
  ) {

    throw new Error(
      "REQUEST_NOT_FOUND"
    );
  }


  /* ------------------------------------------------------------------------
     2. Find Request
     ------------------------------------------------------------------------ */

  const requestRowIndex =
    pendingRows.findIndex(
      (row, index) =>
        index > 0 &&
        String(
          row[0] ?? ""
        ).trim() ===
        cleanRequestId
    );


  if (
    requestRowIndex === -1
  ) {

    throw new Error(
      "REQUEST_NOT_FOUND"
    );
  }


  const requestRow =
    pendingRows[
    requestRowIndex
    ];


  /* ------------------------------------------------------------------------
     3. Check Current Status
     ------------------------------------------------------------------------ */

  const currentStatus =
    String(
      requestRow[11] ?? ""
    )
      .trim()
      .toUpperCase();


  if (
    currentStatus ===
    "APPROVED"
  ) {

    throw new Error(
      "REQUEST_ALREADY_APPROVED"
    );
  }


  if (
    currentStatus ===
    "REJECTED"
  ) {

    throw new Error(
      "REQUEST_ALREADY_REJECTED"
    );
  }


  if (
    currentStatus !==
    "PENDING"
  ) {

    throw new Error(
      "INVALID_REQUEST_STATUS"
    );
  }


  /* ------------------------------------------------------------------------
     4. Request Information
     ------------------------------------------------------------------------ */

  const memberId =
    String(
      requestRow[1] ?? ""
    ).trim();

  const memberName =
    String(
      requestRow[2] ?? ""
    ).trim();


  if (!memberId) {

    throw new Error(
      "MEMBER_ID_MISSING"
    );
  }


  /* ------------------------------------------------------------------------
     5. Update Pending Deposits
     ------------------------------------------------------------------------ */

  const rejectedDate =
    new Date().toISOString();


  /*
   * Header row = 1
   * requestRowIndex already contains zero-based index
   *
   * Example:
   * array index 1 => Google Sheet row 2
   */

  const sheetRowNumber =
    requestRowIndex + 1;


  const rejectionNotes =
    cleanNotes ||
    "Deposit request rejected";


  await updateSheetValues(
    `Pending Deposits!L${sheetRowNumber}:P${sheetRowNumber}`,
    [[
      "REJECTED",

      String(
        requestRow[12] ?? ""
      ).trim(),

      String(
        requestRow[13] ?? ""
      ).trim(),

      cleanAdminId,

      rejectionNotes,
    ]]
  );


  /* ------------------------------------------------------------------------
     6. Return Result
     ------------------------------------------------------------------------ */

  return {

    requestId:
      cleanRequestId,

    memberId,

    memberName,

    status:
      "REJECTED",

    rejectedDate,

    adminId:
      cleanAdminId,

    notes:
      rejectionNotes,
  };
}