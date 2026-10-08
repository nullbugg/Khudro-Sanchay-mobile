import dotenv from "dotenv";

dotenv.config();

import nodemailer from "nodemailer";

import {
  randomInt,
  createHash,
  randomBytes,
} from "crypto";

import {
  appendSheetRow,
  getSheetValues,
  updateSheetValues,
} from "../config/google-sheets";

import {
  verifyPin,
  hashPin,
} from "../utils/pin";

export interface Member {
  memberId: string;
  memberName: string;
  phone: string;
  email: string;
  joinDate: string;
  currentShareCount: number;
  currentWeeklyAmount: number;
  pinHash: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export type DepositPaymentMethod =
  | "cash"
  | "bkash";

export type PendingDepositStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export interface PendingDeposit {
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
  paymentMethod: DepositPaymentMethod;
  senderNumber: string;
  status: PendingDepositStatus;
  requestDate: string;
  approvedDate: string;
  adminId: string;
  notes: string;
}

export type CollectionType =
  | "WEEKLY"
  | "ADVANCE";

export interface MemberCollection {
  rowIndex: number;
  id: string;
  memberId: string;
  memberName: string;
  week: string;
  weekNumber: number;
  amount: number;
  shareCount: number;
  date: string;
  status: string;
  expectedAmount: number;
  arrears: number;
  paidAmount: number;
  type: CollectionType;
  notes: string;
}

export interface MemberDashboardSummary {
  // সব WEEKLY collection-এর মোট paid amount
  currentWeeklyPaid: number;

  // সব ADVANCE collection-এর মোট deposited amount
  currentAdvance: number;

  // WEEKLY + ADVANCE
  totalDeposit: number;

  advanceAmount: number;

  // বর্তমানে ব্যবহার না হওয়া advance balance
  availableAdvance: number;

  lastPaymentDate: string;

  // সবচেয়ে দূরের fully covered week
  latestWeek: number;

  // বর্তমানে calendar অনুযায়ী চলমান week
  currentWeek: number;

  // সর্বশেষ যে week-এ collection record আছে
  collectionWeek: number;

  // Current week শুরু
  currentWeekStartDate: string;

  // Current week শেষ
  currentWeekEndDate: string;

  // পরবর্তী week
  nextWeek: number;

  // Next week শুরু
  nextWeekStartDate: string;

  // Next week শেষ
  nextWeekEndDate: string;

  // বর্তমান calendar week's WEEKLY payment
  currentWeekPaid: number;

  // বর্তমান calendar week's ADVANCE
  currentWeekAdvanceAdded: number;
}

export interface MemberDashboardData {
  member: {
    memberId: string;
    memberName: string;
    phone: string;
    email: string;
    joinDate: string;
    currentShareCount: number;
    currentWeeklyAmount: number;
    status: string;
  };

  summary: MemberDashboardSummary;
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Week Calculation
|--------------------------------------------------------------------------
|
| Week 1 = 24-04-2026
| Every 7 days = next week
|
| Week 1 = 24-04-2026 to 30-04-2026
| Week 2 = 01-05-2026 to 07-05-2026
| Week 3 = 08-05-2026 to 14-05-2026
| Week 4 = 15-05-2026 to 21-05-2026
|
|--------------------------------------------------------------------------
*/

const WEEK_1_START_UTC =
  Date.UTC(2026, 3, 24);

const ONE_DAY_MS =
  24 * 60 * 60 * 1000;

/*
|--------------------------------------------------------------------------
| Get Today's Date in Dhaka
|--------------------------------------------------------------------------
*/

function getDhakaTodayUTC(): number {
  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "Asia/Dhaka",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(
      new Date()
    );

  let year = 0;
  let month = 0;
  let day = 0;

  for (const part of parts) {
    if (
      part.type ===
      "year"
    ) {
      year =
        Number(
          part.value
        );
    }

    if (
      part.type ===
      "month"
    ) {
      month =
        Number(
          part.value
        );
    }

    if (
      part.type ===
      "day"
    ) {
      day =
        Number(
          part.value
        );
    }
  }

  return Date.UTC(
    year,
    month - 1,
    day
  );
}

/*
|-------------------------------------------------------------------------- 
| Get Current Week Number
|--------------------------------------------------------------------------
|
| 24-04-2026 = Week 1
| Every 7 days = next week
|
|--------------------------------------------------------------------------
*/

function getCurrentWeekNumber(): number {
  const todayUTC =
    getDhakaTodayUTC();

  const diffDays =
    Math.floor(
      (
        todayUTC -
        WEEK_1_START_UTC
      ) /
      ONE_DAY_MS
    );

  if (
    diffDays < 0
  ) {
    return 0;
  }

  return (
    Math.floor(
      diffDays / 7
    ) + 1
  );
}

/*
|--------------------------------------------------------------------------
| Get Week Number From Date
|--------------------------------------------------------------------------
|
| Supports:
|
| DD-MM-YYYY
| DD/MM/YYYY
| YYYY-MM-DD
| YYYY/MM/DD
|
|--------------------------------------------------------------------------
*/

function getWeekNumberFromDate(
  dateValue: string
): number {
  const raw =
    String(
      dateValue ?? ""
    ).trim();

  if (!raw) {
    return 1;
  }

  /*
  |--------------------------------------------------------------------------
  | DD-MM-YYYY / DD/MM/YYYY
  |--------------------------------------------------------------------------
  */

  const ddmmyyyyMatch =
    raw.match(
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/
    );

  if (
    ddmmyyyyMatch
  ) {
    const day =
      Number(
        ddmmyyyyMatch[1]
      );

    const month =
      Number(
        ddmmyyyyMatch[2]
      );

    const year =
      Number(
        ddmmyyyyMatch[3]
      );

    const dateUTC =
      Date.UTC(
        year,
        month - 1,
        day
      );

    const diffDays =
      Math.floor(
        (
          dateUTC -
          WEEK_1_START_UTC
        ) /
        ONE_DAY_MS
      );

    if (
      diffDays < 0
    ) {
      return 1;
    }

    return (
      Math.floor(
        diffDays / 7
      ) + 1
    );
  }

  /*
  |--------------------------------------------------------------------------
  | YYYY-MM-DD / YYYY/MM/DD
  |--------------------------------------------------------------------------
  */

  const yyyymmddMatch =
    raw.match(
      /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/
    );

  if (
    yyyymmddMatch
  ) {
    const year =
      Number(
        yyyymmddMatch[1]
      );

    const month =
      Number(
        yyyymmddMatch[2]
      );

    const day =
      Number(
        yyyymmddMatch[3]
      );

    const dateUTC =
      Date.UTC(
        year,
        month - 1,
        day
      );

    const diffDays =
      Math.floor(
        (
          dateUTC -
          WEEK_1_START_UTC
        ) /
        ONE_DAY_MS
      );

    if (
      diffDays < 0
    ) {
      return 1;
    }

    return (
      Math.floor(
        diffDays / 7
      ) + 1
    );
  }

  return 1;
}

/*
|--------------------------------------------------------------------------
| Get Week Start Date
|--------------------------------------------------------------------------
*/

function getWeekStartDate(
  weekNumber: number
): string {
  if (
    weekNumber <= 0
  ) {
    return "";
  }

  const dateUTC =
    new Date(
      WEEK_1_START_UTC +
      (
        weekNumber - 1
      ) *
      7 *
      ONE_DAY_MS
    );

  const day =
    String(
      dateUTC.getUTCDate()
    ).padStart(
      2,
      "0"
    );

  const month =
    String(
      dateUTC.getUTCMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const year =
    dateUTC.getUTCFullYear();

  return `${day}-${month}-${year}`;
}

/*
|--------------------------------------------------------------------------
| Get Week End Date
|--------------------------------------------------------------------------
*/

function getWeekEndDate(
  weekNumber: number
): string {
  if (
    weekNumber <= 0
  ) {
    return "";
  }

  const dateUTC =
    new Date(
      WEEK_1_START_UTC +
      (
        weekNumber - 1
      ) *
      7 *
      ONE_DAY_MS +
      6 *
      ONE_DAY_MS
    );

  const day =
    String(
      dateUTC.getUTCDate()
    ).padStart(
      2,
      "0"
    );

  const month =
    String(
      dateUTC.getUTCMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const year =
    dateUTC.getUTCFullYear();

  return `${day}-${month}-${year}`;
}

/*
|--------------------------------------------------------------------------
| Get Week Number From Collection Week
|--------------------------------------------------------------------------
*/

function getWeekNumber(
  week: string
): number {
  const match =
    String(
      week ?? ""
    ).match(
      /(\d+)/
    );

  if (!match) {
    return 0;
  }

  const number =
    Number(
      match[1]
    );

  if (
    !Number.isInteger(
      number
    ) ||
    number <= 0
  ) {
    return 0;
  }

  return number;
}

/*
|--------------------------------------------------------------------------
| Get Collection Type
|--------------------------------------------------------------------------
|
| Final Collections structure:
|
| A = Collection ID
| B = Member ID
| C = Member Name
| D = Week
| E = Share Count
| F = Expected Amount
| G = Arrears
| H = Paid Amount
| I = Status
| J = Date
| K = Admin ID
| L = Notes
|
| There is NO Type column.
|
| Internal type is derived as:
|
| - Notes explicitly containing ADVANCE -> ADVANCE
| - Expected Amount <= 0 -> ADVANCE
| - Otherwise -> WEEKLY
|
|--------------------------------------------------------------------------
*/

function getCollectionType(
  expectedAmount: number,
  notes: string
): CollectionType {
  const cleanNotes =
    String(
      notes ?? ""
    )
      .trim()
      .toUpperCase();

  if (
    cleanNotes.includes(
      "ADVANCE"
    )
  ) {
    return "ADVANCE";
  }

  if (
    Number(
      expectedAmount
    ) <= 0
  ) {
    return "ADVANCE";
  }

  return "WEEKLY";
}

/*
|--------------------------------------------------------------------------
| Parse Collections
|--------------------------------------------------------------------------
|
| Final Collections sheet = A:L
|--------------------------------------------------------------------------
*/

function parseCollections(
  rows: string[][]
): MemberCollection[] {
  if (
    !Array.isArray(rows) ||
    rows.length <= 1
  ) {
    return [];
  }

  return rows
    .slice(1)
    .map(
      (row, index) => {
        const week =
          String(
            row[3] ?? ""
          ).trim();

        const weekNumber =
          getWeekNumber(
            week
          );

        /*
         * Final A:L structure:
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

        const shareCount =
          Number(
            row[4] ?? 0
          );

        const expectedAmount =
          Number(
            row[5] ?? 0
          );

        const arrears =
          Number(
            row[6] ?? 0
          );

        const paidAmount =
          Number(
            row[7] ?? 0
          );

        const notes =
          String(
            row[11] ?? ""
          ).trim();

        const type =
          getCollectionType(
            expectedAmount,
            notes
          );

        return {
          rowIndex:
            index + 2,

          id:
            String(
              row[0] ?? ""
            ).trim(),

          memberId:
            String(
              row[1] ?? ""
            ).trim(),

          memberName:
            String(
              row[2] ?? ""
            ).trim(),

          week,

          weekNumber,

          /*
           * Internal amount field.
           *
           * In the final sheet there is
           * no Amount column.
           *
           * Therefore amount = Paid Amount.
           */

          amount:
            paidAmount,

          shareCount,

          date:
            String(
              row[9] ?? ""
            ).trim(),

          status:
            String(
              row[8] ??
              "COMPLETED"
            ).trim(),

          expectedAmount,

          arrears,

          paidAmount,

          type,

          notes,
        };
      }
    )
    .filter(
      (item) =>
        item.id &&
        item.memberId &&
        item.weekNumber > 0 &&
        item.paidAmount > 0
    );
}

/*
|--------------------------------------------------------------------------
| Get Next Deposit ID
|--------------------------------------------------------------------------
|
| Format:
|
| DEP-000001
| DEP-000002
| DEP-000003
|
| Existing old random IDs such as:
|
| DEP-MUJWRSU2-ZY7MTX
|
| are ignored.
|
| If numeric IDs already exist, the maximum
| numeric suffix + 1 is used.
|--------------------------------------------------------------------------
*/

function getNextDepositId(
  rows: string[][]
): string {
  let max = 0;

  if (
    Array.isArray(rows)
  ) {
    for (
      const row of
      rows.slice(1)
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

      if (match) {
        max =
          Math.max(
            max,
            Number(
              match[1]
            )
          );
      }
    }
  }

  return `DEP-${String(
    max + 1
  ).padStart(
    6,
    "0"
  )}`;
}

/*
|--------------------------------------------------------------------------
| Get All Members
|--------------------------------------------------------------------------
*/

export async function getAllMembers(): Promise<
  Member[]
> {
  const rows =
    await getSheetValues(
      "Members!A:J"
    );

  if (
    !Array.isArray(rows) ||
    rows.length <= 1
  ) {
    return [];
  }

  return rows
    .slice(1)
    .map((row) => ({
      memberId:
        String(
          row[0] ?? ""
        ).trim(),

      memberName:
        String(
          row[1] ?? ""
        ).trim(),

      phone:
        String(
          row[2] ?? ""
        ).trim(),

      email:
        String(
          row[10] ?? ""
        ).trim(),

      joinDate:
        String(
          row[3] ?? ""
        ).trim(),

      currentShareCount:
        Number(
          row[4] ?? 0
        ),

      currentWeeklyAmount:
        Number(
          row[5] ?? 0
        ),

      pinHash:
        String(
          row[6] ?? ""
        ).trim(),

      status:
        String(
          row[7] ?? ""
        ).trim(),

      createdAt:
        String(
          row[8] ?? ""
        ).trim(),

      updatedAt:
        String(
          row[9] ?? ""
        ).trim(),
    }))
    .filter(
      (member) =>
        member.memberId &&
        member.memberName
    );
}

/*
|--------------------------------------------------------------------------
| Find Member
|--------------------------------------------------------------------------
*/

export async function findMemberById(
  memberId: string
): Promise<
  Member | null
> {
  const rows =
    await getSheetValues(
      "Members!A:K"
    );

  if (
    rows.length <= 1
  ) {
    return null;
  }

  const normalizedId =
    memberId
      .trim()
      .toUpperCase();

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
    memberId:
      String(
        row[0] ?? ""
      ).trim(),

    memberName:
      String(
        row[1] ?? ""
      ).trim(),

    phone:
      String(
        row[2] ?? ""
      ).trim(),

    joinDate:
      String(
        row[3] ?? ""
      ).trim(),

    currentShareCount:
      Number(
        row[4] ?? 0
      ),

    currentWeeklyAmount:
      Number(
        row[5] ?? 0
      ),

    pinHash:
      String(
        row[6] ?? ""
      ).trim(),

    status:
      String(
        row[7] ?? ""
      ).trim(),

    createdAt:
      String(
        row[8] ?? ""
      ).trim(),

    updatedAt:
      String(
        row[9] ?? ""
      ).trim(),

    email:
      String(
        row[10] ?? ""
      ).trim(),
  };
}

/*
|--------------------------------------------------------------------------
| Get Member Pending Deposits
|--------------------------------------------------------------------------
|
| Reads:
| Pending Deposits!A:P
|
| Only PENDING requests belonging to the specified member are returned.
|--------------------------------------------------------------------------
*/

export async function getMemberPendingDeposits(
  memberId: string
): Promise<{
  success: boolean;
  message: string;
  requests: PendingDeposit[];
}> {
  try {
    const normalizedMemberId =
      String(memberId ?? "").trim();

    if (!normalizedMemberId) {
      return {
        success: false,
        message: "Member ID is required",
        requests: [],
      };
    }

    const rows =
      await getSheetValues(
        "Pending Deposits!A:P"
      );

    if (!rows || rows.length <= 1) {
      return {
        success: true,
        message: "No pending deposit requests found",
        requests: [],
      };
    }

    const requests: PendingDeposit[] = [];

    /*
     * Row 1 = header
     * Data starts from row 2
     */
    for (
      let i = 1;
      i < rows.length;
      i++
    ) {
      const row =
        rows[i] ?? [];

      if (!row.length) {
        continue;
      }

      const rowMemberId =
        String(
          row[1] ?? ""
        ).trim();

      const status =
        String(
          row[11] ?? ""
        )
          .trim()
          .toUpperCase();

      /*
       * Only this member's PENDING requests.
       */
      if (
        rowMemberId !==
        normalizedMemberId
      ) {
        continue;
      }

      if (
        status !== "PENDING"
      ) {
        continue;
      }

      const paymentMethod =
        String(
          row[9] ?? ""
        )
          .trim()
          .toLowerCase();

      requests.push({
        rowIndex:
          i + 1,

        requestId:
          String(
            row[0] ?? ""
          ).trim(),

        memberId:
          rowMemberId,

        memberName:
          String(
            row[2] ?? ""
          ).trim(),

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

        status,

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

    /*
     * Newest request first.
     */
    requests.sort(
      (a, b) =>
        new Date(
          b.requestDate
        ).getTime() -
        new Date(
          a.requestDate
        ).getTime()
    );

    return {
      success: true,
      message:
        "Pending deposits loaded successfully",
      requests,
    };
  } catch (error) {
    console.error(
      "Get member pending deposits error:",
      error
    );

    return {
      success: false,
      message:
        "Pending deposit information load করা যায়নি",
      requests: [],
    };
  }
}

/*
|--------------------------------------------------------------------------
| Get Member Deposit History
|--------------------------------------------------------------------------
|
| Returns ALL deposit requests belonging to this member:
| PENDING + APPROVED + REJECTED
|
| Data source:
| Pending Deposits!A:P
|
|--------------------------------------------------------------------------
*/

export async function getMemberDepositHistory(
  memberId: string
): Promise<{
  success: boolean;
  message: string;
  requests: PendingDeposit[];
}> {
  try {
    const rows =
      await getSheetValues(
        "Pending Deposits!A:P"
      );

    const normalizedMemberId =
      String(memberId ?? "").trim();

    if (!normalizedMemberId) {
      return {
        success: false,
        message:
          "Member ID পাওয়া যায়নি",
        requests: [],
      };
    }

    const requests: PendingDeposit[] = [];

    rows.forEach(
      (
        row: any[],
        index: number
      ) => {
        const rowMemberId =
          String(
            row[1] ?? ""
          ).trim();

        if (
          rowMemberId !==
          normalizedMemberId
        ) {
          return;
        }

        const status =
          String(
            row[11] ?? "PENDING"
          )
            .trim()
            .toUpperCase();

        if (
          status !== "PENDING" &&
          status !== "APPROVED" &&
          status !== "REJECTED"
        ) {
          return;
        }

        requests.push({
          rowIndex: index + 1,

          requestId:
            String(
              row[0] ?? ""
            ).trim(),

          memberId:
            String(
              row[1] ?? ""
            ).trim(),

          memberName:
            String(
              row[2] ?? ""
            ).trim(),

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
            String(
              row[9] ?? "cash"
            ).trim().toLowerCase() ===
              "bkash"
              ? "bkash"
              : "cash",

          senderNumber:
            String(
              row[10] ?? ""
            ).trim(),

          status:
            status as PendingDepositStatus,

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

    requests.sort(
      (a, b) => {
        const aRow =
          Number(
            a.rowIndex
          );

        const bRow =
          Number(
            b.rowIndex
          );

        return bRow - aRow;
      }
    );

    return {
      success: true,

      message:
        "Member deposit history loaded successfully",

      requests,
    };
  } catch (error) {
    console.error(
      "Get member deposit history error:",
      error
    );

    return {
      success: false,

      message:
        "Deposit history load করা যায়নি",

      requests: [],
    };
  }
}

/*
|--------------------------------------------------------------------------
| Create Pending Deposit
|--------------------------------------------------------------------------
*/

export async function createPendingDeposit(
  memberId: string,
  weeks: number,
  paymentMethod: DepositPaymentMethod,
  senderNumber: string = ""
): Promise<
  | {
    success: true;
    request: PendingDeposit;
  }
  | {
    success: false;
    code: string;
    message: string;
  }
> {
  /*
   * ---------------------------------------------------------------
   * Find member
   * ---------------------------------------------------------------
   */

  const member =
    await findMemberById(
      memberId
    );

  if (!member) {
    return {
      success: false,
      code: "MEMBER_NOT_FOUND",
      message:
        "Member information পাওয়া যায়নি",
    };
  }

  /*
   * ---------------------------------------------------------------
   * Active member
   * ---------------------------------------------------------------
   */

  if (
    member.status !==
    "ACTIVE"
  ) {
    return {
      success: false,
      code: "INACTIVE_MEMBER",
      message:
        "আপনার Member account বর্তমানে নিষ্ক্রিয়",
    };
  }

  /*
   * ---------------------------------------------------------------
   * Validate weeks
   * ---------------------------------------------------------------
   */

  if (
    !Number.isInteger(weeks) ||
    weeks < 1 ||
    weeks > 52
  ) {
    return {
      success: false,
      code: "INVALID_WEEKS",
      message:
        "সঠিক সপ্তাহের সংখ্যা দিন",
    };
  }

  /*
   * ---------------------------------------------------------------
   * Validate payment method
   * ---------------------------------------------------------------
   */

  if (
    paymentMethod !==
    "cash" &&
    paymentMethod !==
    "bkash"
  ) {
    return {
      success: false,
      code: "INVALID_PAYMENT_METHOD",
      message:
        "সঠিক payment method নির্বাচন করুন",
    };
  }

  /*
   * ---------------------------------------------------------------
   * Weekly amount
   * ---------------------------------------------------------------
   */

  const shareCount =
    Number(
      member.currentShareCount || 0
    );

  const weeklyAmount =
    Number(
      member.currentWeeklyAmount ||
      shareCount * 50
    );

  if (
    !Number.isFinite(
      weeklyAmount
    ) ||
    weeklyAmount <= 0
  ) {
    return {
      success: false,
      code: "INVALID_WEEKLY_AMOUNT",
      message:
        "Weekly deposit amount সঠিক নয়",
    };
  }

  /*
   * ---------------------------------------------------------------
   * Deposit amount
   * ---------------------------------------------------------------
   */

  const depositAmount =
    weeklyAmount * weeks;

  /*
   * ---------------------------------------------------------------
   * bKash charge
   *
   * Existing mobile UI calculation:
   * shareCount × weeks
   * ---------------------------------------------------------------
   */

  const bkashCharge =
    paymentMethod ===
      "bkash"
      ? shareCount * weeks
      : 0;

  const payableAmount =
    depositAmount +
    bkashCharge;

  /*
   * ---------------------------------------------------------------
   * bKash sender number
   * ---------------------------------------------------------------
   */

  const cleanSenderNumber =
    senderNumber
      .replace(/\D/g, "")
      .trim();

  if (
    paymentMethod ===
    "bkash" &&
    !/^01[3-9]\d{8}$/.test(
      cleanSenderNumber
    )
  ) {
    return {
      success: false,
      code: "INVALID_SENDER_NUMBER",
      message:
        "সঠিক bKash sender number দিন",
    };
  }

  /*
   * ---------------------------------------------------------------
   * Sequential Deposit ID
   * ---------------------------------------------------------------
   *
   * Pending Deposits:
   *
   * A = Deposit ID
   *
   * Existing old random IDs are ignored.
   * New IDs:
   *
   * DEP-000001
   * DEP-000002
   * DEP-000003
   *
   * ---------------------------------------------------------------
   */

  const pendingDepositRows =
    await getSheetValues(
      "Pending Deposits!A:P"
    );

  const requestId =
    getNextDepositId(
      pendingDepositRows
    );

  const requestDate =
    new Date().toISOString();

  /*
   * ---------------------------------------------------------------
   * Create pending request
   * ---------------------------------------------------------------
   */

  await appendSheetRow(
    "Pending Deposits!A:P",
    [
      requestId,
      member.memberId,
      member.memberName,
      String(shareCount),
      String(weeklyAmount),
      String(weeks),
      String(depositAmount),
      String(bkashCharge),
      String(payableAmount),
      paymentMethod,
      paymentMethod ===
        "bkash"
        ? cleanSenderNumber
        : "",
      "PENDING",
      requestDate,
      "",
      "",
      "",
    ]
  );

  /*
   * ---------------------------------------------------------------
   * Return
   * ---------------------------------------------------------------
   */

  return {
    success: true,

    request: {
      rowIndex: 0,
      requestId,
      memberId:
        member.memberId,
      memberName:
        member.memberName,
      shareCount,
      weeklyAmount,
      weeks,
      depositAmount,
      bkashCharge,
      payableAmount,
      paymentMethod,
      senderNumber:
        paymentMethod ===
          "bkash"
          ? cleanSenderNumber
          : "",
      status:
        "PENDING",
      requestDate,
      approvedDate: "",
      adminId: "",
      notes: "",
    },
  };


}

/*
|--------------------------------------------------------------------------
| Get Member Dashboard
|--------------------------------------------------------------------------
*/

export async function getMemberDashboard(
  memberId: string
): Promise<
  MemberDashboardData | null
> {
  const member =
    await findMemberById(
      memberId
    );

  if (!member) {
    return null;
  }

  /*
   * Final Collections structure = A:L
   */

  const collectionRows =
    await getSheetValues(
      "Collections!A:L"
    );

  console.log(
    "RAW COLLECTION ROWS:",
    JSON.stringify(
      collectionRows,
      null,
      2
    )
  );

  const allCollections =
    parseCollections(
      collectionRows
    );

  console.log(
    "PARSED COLLECTIONS:",
    JSON.stringify(
      allCollections,
      null,
      2
    )
  );

  const normalizedMemberId =
    member.memberId
      .trim()
      .toUpperCase();

  /*
  |--------------------------------------------------------------------------
  | Member Collections
  |--------------------------------------------------------------------------
  */

  const memberCollections =
    allCollections
      .filter(
        (item) =>
          item.memberId
            .trim()
            .toUpperCase() ===
          normalizedMemberId
      )
      .sort(
        (a, b) => {
          /*
           * First: Week number
           * Second: original Sheet row order
           */

          if (
            a.weekNumber !==
            b.weekNumber
          ) {
            return (
              a.weekNumber -
              b.weekNumber
            );
          }

          return (
            a.rowIndex -
            b.rowIndex
          );
        }
      );

  /*
  |--------------------------------------------------------------------------
  | Collection Week
  |--------------------------------------------------------------------------
  |
  | Collection Week means:
  | the latest week number that actually
  | has a collection record in Google Sheet.
  |
  | IMPORTANT:
  |
  | Collection Week != latestWeek
  |
  | Example:
  |
  | Week 1 -> WEEKLY 100
  | Week 2 -> WEEKLY 100
  | Week 2 -> ADVANCE 100
  |
  | Collection Week = 2
  | Latest Covered Week = 3
  |
  |--------------------------------------------------------------------------
  */

  const collectionWeek =
    memberCollections.length >
      0
      ? Math.max(
        ...memberCollections.map(
          (item) =>
            item.weekNumber
        )
      )
      : 0;

  /*
  |--------------------------------------------------------------------------
  | Current Calendar Week
  |--------------------------------------------------------------------------
  |
  | These values are calculated BEFORE
  | the No Collection branch so that
  | even a new member receives the
  | correct current/next week dates.
  |
  |--------------------------------------------------------------------------
  */

  const currentCalendarWeek =
    getCurrentWeekNumber();

  const currentWeekStartDate =
    getWeekStartDate(
      currentCalendarWeek
    );

  const currentWeekEndDate =
    getWeekEndDate(
      currentCalendarWeek
    );

  const nextWeek =
    currentCalendarWeek + 1;

  const nextWeekStartDate =
    getWeekStartDate(
      nextWeek
    );

  const nextWeekEndDate =
    getWeekEndDate(
      nextWeek
    );

  /*
  |--------------------------------------------------------------------------
  | No collection yet
  |--------------------------------------------------------------------------
  */

  if (
    memberCollections.length ===
    0
  ) {
    return {
      member: {
        memberId:
          member.memberId,

        memberName:
          member.memberName,

        phone:
          member.phone,

        email:
          member.email,

        joinDate:
          member.joinDate,

        currentShareCount:
          member.currentShareCount,

        currentWeeklyAmount:
          member.currentWeeklyAmount,

        status:
          member.status,
      },

      summary: {
        currentWeeklyPaid: 0,

        currentAdvance: 0,

        totalDeposit: 0,

        availableAdvance: 0,

        advanceAmount: 0,

        lastPaymentDate: "",

        latestWeek: 0,

        currentWeek:
          currentCalendarWeek,

        collectionWeek: 0,

        currentWeekStartDate:
          currentWeekStartDate,

        currentWeekEndDate:
          currentWeekEndDate,

        nextWeek,

        nextWeekStartDate:
          nextWeekStartDate,

        nextWeekEndDate:
          nextWeekEndDate,

        currentWeekPaid: 0,

        currentWeekAdvanceAdded: 0,
      },
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Total WEEKLY Deposit
  |--------------------------------------------------------------------------
  |
  | All WEEKLY records are counted.
  |
  | This is NOT only the latest week's payment.
  |
  |--------------------------------------------------------------------------
  */
  const WEEK_1_START = new Date(
    "2026-04-24T00:00:00"
  );

  const today = new Date();

  const currentWeek =
    Math.floor(
      (
        today.getTime() -
        WEEK_1_START.getTime()
      ) /
      (7 * 24 * 60 * 60 * 1000)
    ) + 1;

  const totalWeeklyDeposit =
    memberCollections
      .filter(
        (item) =>
          item.type === "WEEKLY" &&
          Number(item.weekNumber || 0) <=
          currentWeek
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(
            item.paidAmount ||
            item.amount ||
            0
          ),
        0
      );;

  /*
  |--------------------------------------------------------------------------
  | Total ADVANCE Deposit
  |--------------------------------------------------------------------------
  |
  | All ADVANCE records are counted.
  |
  |--------------------------------------------------------------------------
  */

  const totalAdvanceDeposit =
    memberCollections
      .filter(
        (item) =>
          item.type ===
          "ADVANCE"
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(
            item.paidAmount ||
            item.amount ||
            0
          ),
        0
      );

  /*
  |--------------------------------------------------------------------------
  | Total Deposit
  |--------------------------------------------------------------------------
  */

  const totalDeposit =
    memberCollections.reduce(
      (sum, item) =>
        sum +
        Number(
          item.paidAmount || 0
        ),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | Current Week Payment
  |--------------------------------------------------------------------------
  |
  | These values are based on the actual
  | calendar week, NOT Collection Week.
  |
  |--------------------------------------------------------------------------
  */

  const currentWeekCollections =
    memberCollections.filter(
      (item) =>
        item.weekNumber ===
        currentCalendarWeek
    );

  const currentWeekPaid =
    currentWeekCollections
      .filter(
        (item) =>
          item.type ===
          "WEEKLY"
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(
            item.paidAmount ||
            item.amount ||
            0
          ),
        0
      );

  const currentWeekAdvanceAdded =
    currentWeekCollections
      .filter(
        (item) =>
          item.type ===
          "ADVANCE"
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(
            item.paidAmount ||
            item.amount ||
            0
          ),
        0
      );

  /*
  |--------------------------------------------------------------------------
  | FIFO Coverage Ledger
  |--------------------------------------------------------------------------
  |
  | Rules:
  |
  | 1. Every week has a weekly due.
  |
  | 2. Previous unused advance can cover
  |    the current week's due.
  |
  | 3. Current week's WEEKLY payment then
  |    covers the remaining due.
  |
  | 4. Extra WEEKLY payment becomes advance.
  |
  | 5. Current week's explicit ADVANCE is
  |    added AFTER current week calculation.
  |
  |    Therefore:
  |
  |    Week 2 ADVANCE 100
  |    cannot pay Week 2.
  |
  |    It becomes available for Week 3.
  |
  | 6. After transaction weeks are processed,
  |    remaining advance can cover future weeks.
  |
  |--------------------------------------------------------------------------
  */

  const weeklyAmount =
    Number(
      member.currentWeeklyAmount ||
      0
    );

  let availableAdvance = 0;

  let previousArrears = 0;

  let latestCoveredWeek = 0;

  /*
  |--------------------------------------------------------------------------
  | We must process at least until:
  |
  | - latest Collection Week
  | - current Calendar Week
  |
  | This makes current due/arrears meaningful.
  |
  |--------------------------------------------------------------------------
  */

  const processUntilWeek =
    Math.max(
      collectionWeek,
      currentCalendarWeek
    );

  const memberStartWeek =
    getWeekNumberFromDate(
      member.joinDate
    );

  /*
  |--------------------------------------------------------------------------
  | Group collections by week
  |--------------------------------------------------------------------------
  */

  const collectionsByWeek =
    new Map<
      number,
      MemberCollection[]
    >();

  for (
    const item of
    memberCollections
  ) {
    const existing =
      collectionsByWeek.get(
        item.weekNumber
      );

    if (existing) {
      existing.push(
        item
      );
    } else {
      collectionsByWeek.set(
        item.weekNumber,
        [item]
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Process each week
  |--------------------------------------------------------------------------
  */

  for (
    let week =
      memberStartWeek;

    week <=
    processUntilWeek;

    week++
  ) {
    const weekItems =
      collectionsByWeek.get(
        week
      ) ?? [];

    /*
    |--------------------------------------------------------------------------
    | Weekly payment for this week
    |--------------------------------------------------------------------------
    */

    const weeklyPayment =
      weekItems
        .filter(
          (item) =>
            item.type ===
            "WEEKLY"
        )
        .reduce(
          (sum, item) =>
            sum +
            Number(
              item.paidAmount ||
              item.amount ||
              0
            ),
          0
        );

    /*
    |--------------------------------------------------------------------------
    | New explicit advance added this week
    |--------------------------------------------------------------------------
    */

    const newAdvance =
      weekItems
        .filter(
          (item) =>
            item.type ===
            "ADVANCE"
        )
        .reduce(
          (sum, item) =>
            sum +
            Number(
              item.paidAmount ||
              item.amount ||
              0
            ),
          0
        );

    /*
    |--------------------------------------------------------------------------
    | This week's due
    |--------------------------------------------------------------------------
    |
    | Weekly amount + previous arrears
    |
    |--------------------------------------------------------------------------
    */

    const due =
      weeklyAmount +
      previousArrears;

    /*
    |--------------------------------------------------------------------------
    | Use previously available advance
    |--------------------------------------------------------------------------
    */

    const advanceUsed =
      Math.min(
        availableAdvance,
        due
      );

    const remainingDueAfterAdvance =
      Math.max(
        0,
        due -
        advanceUsed
      );

    /*
    |--------------------------------------------------------------------------
    | Use this week's WEEKLY payment
    |--------------------------------------------------------------------------
    */

    const weeklyPaymentUsed =
      Math.min(
        weeklyPayment,
        remainingDueAfterAdvance
      );

    /*
    |--------------------------------------------------------------------------
    | Remaining arrears
    |--------------------------------------------------------------------------
    */

    const arrears =
      Math.max(
        0,
        remainingDueAfterAdvance -
        weeklyPaymentUsed
      );

    /*
    |--------------------------------------------------------------------------
    | Extra WEEKLY payment
    |--------------------------------------------------------------------------
    |
    | If weekly payment is greater than
    | the required amount, the extra amount
    | becomes future advance.
    |
    |--------------------------------------------------------------------------
    */

    const weeklyExcess =
      Math.max(
        0,
        weeklyPayment -
        weeklyPaymentUsed
      );

    /*
    |--------------------------------------------------------------------------
    | Update old advance balance
    |--------------------------------------------------------------------------
    */

    const openingAdvance =
      availableAdvance;

    availableAdvance =
      Math.max(
        0,
        availableAdvance -
        advanceUsed
      );

    /*
    |--------------------------------------------------------------------------
    | Add weekly excess as advance
    |--------------------------------------------------------------------------
    */

    availableAdvance +=
      weeklyExcess;

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT:
    |
    | Add this week's explicit ADVANCE
    | only AFTER this week's due is calculated.
    |
    | So Week 2 ADVANCE 100 will be available
    | for Week 3, not Week 2.
    |--------------------------------------------------------------------------
    */

    availableAdvance +=
      newAdvance;

    /*
    |--------------------------------------------------------------------------
    | Determine latest fully covered week
    |--------------------------------------------------------------------------
    */

    if (
      arrears === 0
    ) {
      latestCoveredWeek =
        week;
    }

    previousArrears =
      arrears;

    console.log(
      `MEMBER ${member.memberId} | WEEK ${week}`,
      {
        due,

        weeklyPayment,

        openingAdvance,

        advanceUsed,

        weeklyPaymentUsed,

        weeklyExcess,

        newAdvance,

        arrears,

        availableAdvanceAfter:
          availableAdvance,
      }
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Cover future weeks using remaining advance
  |--------------------------------------------------------------------------
  |
  | Example:
  |
  | Week 2:
  | WEEKLY 100
  | ADVANCE 100
  |
  | After Week 2:
  | availableAdvance = 100
  |
  | Therefore:
  |
  | Week 3 -> covered
  |
  | availableAdvance = 0
  |
  |--------------------------------------------------------------------------
  */

  let futureWeek =
    processUntilWeek + 1;

  let futureIterations = 0;

  while (
    weeklyAmount > 0 &&
    availableAdvance >=
    weeklyAmount &&
    futureIterations <
    5200
  ) {
    availableAdvance -=
      weeklyAmount;

    latestCoveredWeek =
      futureWeek;

    futureWeek += 1;

    futureIterations += 1;
  }


  /*
|--------------------------------------------------------------------------
| Future Covered Advance
|--------------------------------------------------------------------------
|
| Current calendar week-এর পরে যেসব week already covered,
| সেগুলোর amount Dashboard-এর Advance হিসেবে দেখানো হবে।
|
| Example:
|
| Current Week = 23
| Latest Covered Week = 25
| Weekly Amount = 100
|
| Future Covered Weeks = 2
| Future Covered Amount = 200
|
|--------------------------------------------------------------------------
*/

  const futureCoveredWeeks =
    Math.max(
      0,
      latestCoveredWeek -
      currentCalendarWeek
    );

  const futureCoveredAmount =
    futureCoveredWeeks *
    weeklyAmount;

  /*
  |--------------------------------------------------------------------------
  | Dashboard Advance Amount
  |--------------------------------------------------------------------------
  |
  | Future covered weeks-এর amount
  | +
  | projection-এর পরে remaining unused advance
  |
  | Example:
  |
  | Week 23 current
  | Week 25 covered
  | Remaining advance = 0
  |
  | Advance = 200
  |
  |--------------------------------------------------------------------------
  */

  const dashboardAdvanceAmount =
    futureCoveredAmount +
    Math.max(
      0,
      availableAdvance
    );

  /*
  |--------------------------------------------------------------------------
  | Last Payment Date
  |--------------------------------------------------------------------------
  */

  const datedCollections =
    memberCollections
      .filter(
        (item) =>
          item.date
      )
      .sort(
        (a, b) => {
          const aTime =
            new Date(
              a.date
            ).getTime();

          const bTime =
            new Date(
              b.date
            ).getTime();

          if (
            Number.isNaN(
              aTime
            ) &&
            Number.isNaN(
              bTime
            )
          ) {
            return (
              b.rowIndex -
              a.rowIndex
            );
          }

          if (
            Number.isNaN(
              aTime
            )
          ) {
            return 1;
          }

          if (
            Number.isNaN(
              bTime
            )
          ) {
            return -1;
          }

          return (
            bTime - aTime
          );
        }
      );

  const lastPaymentDate =
    datedCollections.length >
      0
      ? datedCollections[0]
        .date
      : "";

  /*
  |--------------------------------------------------------------------------
  | Final Debug Information
  |--------------------------------------------------------------------------
  */

  console.log(
    "MEMBER DASHBOARD CALCULATION:",
    {
      memberId:
        member.memberId,

      collectionWeek,

      currentCalendarWeek,

      latestCoveredWeek,

      totalWeeklyDeposit,

      totalAdvanceDeposit,

      totalDeposit,

      availableAdvance,

      currentWeekPaid,

      currentWeekAdvanceAdded,

      previousArrears,
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Return
  |--------------------------------------------------------------------------
  */

  return {
    member: {
      memberId:
        member.memberId,

      memberName:
        member.memberName,

      phone:
        member.phone,

      email:
        member.email,

      joinDate:
        member.joinDate,

      currentShareCount:
        member.currentShareCount,

      currentWeeklyAmount:
        member.currentWeeklyAmount,

      status:
        member.status,
    },

    summary: {
      /*
       * Existing field:
       * total WEEKLY deposit
       */

      currentWeeklyPaid:
        totalWeeklyDeposit,

      /*
       * Existing field:
       * total ADVANCE deposit
       */

      currentAdvance:
        totalAdvanceDeposit,

      /*
       * Total WEEKLY + ADVANCE
       */

      totalDeposit,

      /*
       * Dashboard Advance
       *
       * Current week-এর পরের covered weeks
       * + remaining unused advance
       */

      advanceAmount:
        dashboardAdvanceAmount,

      /*
       * Internal remaining unused advance
       */

      availableAdvance,

      lastPaymentDate,

      /*
       * Furthest covered week
       */

      latestWeek:
        latestCoveredWeek,

      /*
       * Current real calendar week
       */

      currentWeek:
        currentCalendarWeek,

      /*
       * Collection Week
       */

      collectionWeek,

      /*
       * Current week date range
       */

      currentWeekStartDate:
        currentWeekStartDate,

      currentWeekEndDate:
        currentWeekEndDate,

      /*
       * Next week
       */

      nextWeek,

      nextWeekStartDate:
        nextWeekStartDate,

      nextWeekEndDate:
        nextWeekEndDate,

      /*
       * Current calendar week's
       * WEEKLY payment
       */

      currentWeekPaid,

      /*
       * Current calendar week's
       * ADVANCE payment
       */

      currentWeekAdvanceAdded,
    },
  };
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
): Promise<
  Member | null
> {
  const cleanMemberId =
    String(
      memberId ?? ""
    ).trim();

  const cleanMemberName =
    String(
      memberName ?? ""
    ).trim();

  const cleanPhone =
    String(
      phone ?? ""
    ).trim();

  if (!cleanMemberId) {
    throw new Error(
      "Member ID is required"
    );
  }

  if (!cleanMemberName) {
    throw new Error(
      "Member name is required"
    );
  }

  if (!cleanPhone) {
    throw new Error(
      "Phone number is required"
    );
  }

  const rows =
    await getSheetValues(
      "Members!A:K"
    );

  if (
    !rows ||
    rows.length <= 1
  ) {
    return null;
  }

  const dataRows =
    rows.slice(1);

  const rowIndex =
    dataRows.findIndex(
      (row) =>
        String(
          row[0] ?? ""
        ).trim() ===
        cleanMemberId
    );

  if (
    rowIndex === -1
  ) {
    return null;
  }

  const sheetRowNumber =
    rowIndex + 2;

  /*
   * Only update:
   *
   * B = Member Name
   * C = Phone
   *
   * Everything else remains unchanged.
   */

  await updateSheetValues(
    `Members!B${sheetRowNumber}:C${sheetRowNumber}`,
    [
      [
        cleanMemberName,
        cleanPhone,
      ],
    ]
  );

  const originalRow =
    dataRows[rowIndex];

  return {
    memberId:
      String(
        originalRow[0] ?? ""
      ).trim(),

    memberName:
      cleanMemberName,

    phone:
      cleanPhone,

    email:
      String(
        originalRow[10] ?? ""
      ).trim(),

    joinDate:
      String(
        originalRow[3] ?? ""
      ).trim(),

    currentShareCount:
      Number(
        originalRow[4] ?? 0
      ),

    currentWeeklyAmount:
      Number(
        originalRow[5] ?? 0
      ),

    pinHash:
      String(
        originalRow[6] ?? ""
      ).trim(),

    status:
      String(
        originalRow[7] ?? ""
      ).trim(),

    createdAt:
      String(
        originalRow[8] ?? ""
      ).trim(),

    updatedAt:
      String(
        originalRow[9] ?? ""
      ).trim(),
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
): Promise<
  | "UPDATED"
  | "MEMBER_NOT_FOUND"
  | "CURRENT_PIN_INVALID"
> {
  const cleanMemberId =
    String(
      memberId ?? ""
    ).trim();

  if (!cleanMemberId) {
    throw new Error(
      "Member ID is required"
    );
  }

  const rows =
    await getSheetValues(
      "Members!A:J"
    );

  if (
    !rows ||
    rows.length <= 1
  ) {
    return "MEMBER_NOT_FOUND";
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
        cleanMemberId.toUpperCase()
    );

  if (
    rowIndex === -1
  ) {
    return "MEMBER_NOT_FOUND";
  }

  const row =
    dataRows[rowIndex];

  /*
   * G = PIN Hash
   */

  const existingPinHash =
    String(
      row[6] ?? ""
    ).trim();

  if (!existingPinHash) {
    return "CURRENT_PIN_INVALID";
  }

  const validCurrentPin =
    verifyPin(
      currentPin,
      existingPinHash
    );

  if (!validCurrentPin) {
    return "CURRENT_PIN_INVALID";
  }

  const newPinHash =
    hashPin(newPin);

  const sheetRowNumber =
    rowIndex + 2;

  /*
   * G = PIN Hash
   */

  await updateSheetValues(
    `Members!G${sheetRowNumber}`,
    [
      [
        newPinHash,
      ],
    ]
  );

  return "UPDATED";
}

/*
|--------------------------------------------------------------------------
| Create Member
|--------------------------------------------------------------------------
*/

export async function createMember(
  memberId: string,
  memberName: string,
  phone: string,
  joinDate: string,
  shareCount: number
): Promise<Member> {
  const cleanMemberId =
    String(
      memberId ?? ""
    )
      .trim()
      .toUpperCase();

  const cleanMemberName =
    String(
      memberName ?? ""
    )
      .trim();

  const cleanPhone =
    String(
      phone ?? ""
    )
      .trim();

  const cleanJoinDate =
    String(
      joinDate ?? ""
    )
      .trim();

  const cleanShareCount =
    Number(
      shareCount
    );

  /*
   * Validation
   */

  if (!cleanMemberId) {
    throw new Error(
      "Member ID is required"
    );
  }

  if (!cleanMemberName) {
    throw new Error(
      "Member name is required"
    );
  }

  if (!cleanPhone) {
    throw new Error(
      "Phone number is required"
    );
  }

  if (!cleanJoinDate) {
    throw new Error(
      "Join date is required"
    );
  }

  if (
    !Number.isInteger(
      cleanShareCount
    ) ||
    cleanShareCount < 1 ||
    cleanShareCount > 15
  ) {
    throw new Error(
      "Share count must be between 1 and 15"
    );
  }

  /*
   * Check existing members.
   *
   * A:J intentionally unchanged.
   */

  const rows =
    await getSheetValues(
      "Members!A:J"
    );

  /*
   * Duplicate Member ID
   */

  if (
    Array.isArray(rows) &&
    rows.length > 1
  ) {
    const duplicate =
      rows
        .slice(1)
        .some(
          (row) =>
            String(
              row[0] ?? ""
            )
              .trim()
              .toUpperCase() ===
            cleanMemberId
        );

    if (duplicate) {
      throw new Error(
        "Member ID already exists"
      );
    }
  }

  /*
   * Weekly amount
   *
   * 1 Share  = ৳50
   * 2 Share  = ৳100
   * ...
   * 15 Share = ৳750
   */

  const currentWeeklyAmount =
    cleanShareCount * 50;

  /*
   * New member initial values
   */

  const pinHash = "";

  const status =
    "ACTIVE";

  const now =
    new Date().toISOString();

  /*
   * Members Sheet:
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
   *
   * K = Gmail
   *
   * K intentionally untouched here.
   */

  await updateSheetValues(
    `Members!A${rows.length + 1}:J${rows.length + 1}`,
    [
      [
        cleanMemberId,
        cleanMemberName,
        cleanPhone,
        cleanJoinDate,
        String(
          cleanShareCount
        ),
        String(
          currentWeeklyAmount
        ),
        pinHash,
        status,
        now,
        now,
      ],
    ]
  );

  return {
    memberId:
      cleanMemberId,

    memberName:
      cleanMemberName,

    phone:
      cleanPhone,

    email:
      "",

    joinDate:
      cleanJoinDate,

    currentShareCount:
      cleanShareCount,

    currentWeeklyAmount:
      currentWeeklyAmount,

    pinHash:
      pinHash,

    status:
      status,

    createdAt:
      now,

    updatedAt:
      now,
  };
}

/*
|--------------------------------------------------------------------------
| MEMBER REGISTRATION / OTP
|--------------------------------------------------------------------------
|
| Members Sheet:
|
| A = Member ID
| B = Member Name
| C = Phone
| D = Join Date
| E = Share Count
| F = Weekly Amount
| G = PIN Hash
| H = Status
| I = Created At
| J = Updated At
| K = Gmail
|
|--------------------------------------------------------------------------
*/

interface PendingMemberRegistration {
  memberId: string;
  memberName: string;
  phone: string;
  email: string;
  pinHash: string;
  otpHash: string;
  otpExpiresAt: number;
  resendAvailableAt: number;
  attempts: number;
}

/*
 * Temporary registration storage.
 *
 * Server restart হলে pending OTP চলে যাবে।
 *
 * Verified account-এর permanent data
 * Google Sheets-এ থাকবে।
 */

const pendingMemberRegistrations =
  new Map<
    string,
    PendingMemberRegistration
  >();


/*
|--------------------------------------------------------------------------
| MEMBER FORGOT PIN / OTP
|--------------------------------------------------------------------------
*/

interface PendingMemberPinReset {
  memberId: string;
  phone: string;
  email: string;
  otpHash: string;
  otpExpiresAt: number;
  resendAvailableAt: number;
  attempts: number;
  resetTokenHash: string;
  resetTokenExpiresAt: number;
}

/*
 * Temporary Forgot PIN storage.
 *
 * Server restart হলে pending PIN reset চলে যাবে।
 * Google Sheets-এর permanent PIN data অপরিবর্তিত থাকবে।
 */
const pendingMemberPinResets =
  new Map<
    string,
    PendingMemberPinReset
  >();


/*
|--------------------------------------------------------------------------
| Gmail Transporter
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Registration Helpers
|--------------------------------------------------------------------------
*/

function normalizeMemberId(
  value: unknown
): string {
  return String(
    value ?? ""
  )
    .trim()
    .toUpperCase();
}

function normalizePhone(
  value: unknown
): string {
  return String(
    value ?? ""
  )
    .trim()
    .replace(
      /\s+/g,
      ""
    );
}

function normalizeEmail(
  value: unknown
): string {
  return String(
    value ?? ""
  )
    .trim()
    .toLowerCase();
}

function hashOTP(
  otp: string
): string {
  return createHash(
    "sha256"
  )
    .update(otp)
    .digest("hex");
}

function generateOTP(): string {
  return String(
    randomInt(
      100000,
      1000000
    )
  );
}

/*
|--------------------------------------------------------------------------
| Find Member By Phone
|--------------------------------------------------------------------------
*/

export async function findMemberByPhone(
  phone: string
): Promise<
  Member | null
> {
  const cleanPhone =
    normalizePhone(
      phone
    );

  if (!cleanPhone) {
    return null;
  }

  const rows =
    await getSheetValues(
      "Members!A:K"
    );

  if (
    !Array.isArray(rows) ||
    rows.length <= 1
  ) {
    return null;
  }

  const row =
    rows
      .slice(1)
      .find(
        (item) =>
          normalizePhone(
            item[2]
          ) ===
          cleanPhone
      );

  if (!row) {
    return null;
  }

  return {
    memberId:
      String(
        row[0] ?? ""
      ).trim(),

    memberName:
      String(
        row[1] ?? ""
      ).trim(),

    phone:
      String(
        row[2] ?? ""
      ).trim(),

    joinDate:
      String(
        row[3] ?? ""
      ).trim(),

    currentShareCount:
      Number(
        row[4] ?? 0
      ),

    currentWeeklyAmount:
      Number(
        row[5] ?? 0
      ),

    pinHash:
      String(
        row[6] ?? ""
      ).trim(),

    status:
      String(
        row[7] ?? ""
      ).trim(),

    createdAt:
      String(
        row[8] ?? ""
      ).trim(),

    updatedAt:
      String(
        row[9] ?? ""
      ).trim(),

    email:
      String(
        row[10] ?? ""
      ).trim(),
  };
}

/*
|--------------------------------------------------------------------------
| Check Whether Gmail Is Already Used
|--------------------------------------------------------------------------
*/

async function isMemberEmailUsed(
  email: string,
  exceptMemberId?: string
): Promise<boolean> {
  const cleanEmail =
    normalizeEmail(
      email
    );

  if (!cleanEmail) {
    return false;
  }

  const rows =
    await getSheetValues(
      "Members!A:K"
    );

  if (
    !Array.isArray(rows) ||
    rows.length <= 1
  ) {
    return false;
  }

  const cleanExceptId =
    normalizeMemberId(
      exceptMemberId
    );

  return rows
    .slice(1)
    .some(
      (row) => {
        const rowMemberId =
          normalizeMemberId(
            row[0]
          );

        const rowEmail =
          normalizeEmail(
            row[10]
          );

        if (
          cleanExceptId &&
          rowMemberId ===
          cleanExceptId
        ) {
          return false;
        }

        return (
          rowEmail ===
          cleanEmail
        );
      }
    );
}

/*
|--------------------------------------------------------------------------
| Send Member Registration OTP
|--------------------------------------------------------------------------
*/

async function sendMemberRegistrationOTP(
  email: string,
  otp: string,
  language: "bn" | "en"
): Promise<void> {
  if (!gmailTransporter) {
    throw new Error(
      "EMAIL_NOT_CONFIGURED"
    );
  }

  const isBangla =
    language === "bn";

  const subject =
    isBangla
      ? "ক্ষুদ্র সঞ্চয় - Account Verification OTP"
      : "ক্ষুদ্র সঞ্চয় - Account Verification OTP";

  const title =
    "Account Verification";

  const greeting =
    isBangla
      ? "আপনার account তৈরি করার জন্য নিচের OTP ব্যবহার করুন।"
      : "Use the following OTP to complete your account registration.";

  const expiry =
    isBangla
      ? "এই OTP ১০ মিনিটের জন্য কার্যকর থাকবে।"
      : "This OTP will expire in 10 minutes.";

  const warning =
    isBangla
      ? "আপনি যদি account registration না করেন, তাহলে এই email উপেক্ষা করুন।"
      : "If you did not start this account registration, please ignore this email.";

  await gmailTransporter.sendMail({
    from:
      gmailUser,

    to:
      email,

    subject,

    text: `
${title}

${greeting}

OTP: ${otp}

${expiry}

${warning}

ক্ষুদ্র সঞ্চয় 

সমবায় সমিতি
`.trim(),

    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;">

        <h2>${title}</h2>

        <p>${greeting}</p>

        <div style="
          font-size:32px;
          font-weight:700;
          letter-spacing:8px;
          text-align:center;
          padding:20px;
          margin:20px 0;
          background:#f1f5f9;
          border-radius:12px;
        ">
          ${otp}
        </div>

        <p>${expiry}</p>

        <p style="color:#64748b;">
          ${warning}
        </p>

        <hr />

        <p style="color:#64748b;font-size:13px;">
          ক্ষুদ্র সঞ্চয়<br />
          সমবায় সমিতি
        </p>

      </div>
    `,
  });
}

/*
|--------------------------------------------------------------------------
| Send Member Forgot PIN OTP
|--------------------------------------------------------------------------
*/

async function sendMemberPinResetOTPEmail(
  email: string,
  otp: string,
  language: "bn" | "en"
): Promise<void> {
  if (!gmailTransporter) {
    throw new Error(
      "EMAIL_NOT_CONFIGURED"
    );
  }

  const isBangla =
    language === "bn";

  const subject = isBangla
    ? "ক্ষুদ্র সঞ্চয় - PIN Reset OTP"
    : "ক্ষুদ্র সঞ্চয় - PIN Reset OTP";

  const title = isBangla
    ? "PIN Reset Verification"
    : "PIN Reset Verification";

  const greeting = isBangla
    ? "আপনার Member account-এর PIN reset করার জন্য নিচের OTP ব্যবহার করুন।"
    : "Use the following OTP to reset your Member account PIN.";

  const expiry = isBangla
    ? "এই OTP ১০ মিনিটের জন্য কার্যকর থাকবে।"
    : "This OTP will expire in 10 minutes.";

  const warning = isBangla
    ? "আপনি যদি PIN reset-এর অনুরোধ না করে থাকেন, তাহলে এই email উপেক্ষা করুন।"
    : "If you did not request a PIN reset, please ignore this email.";

  await gmailTransporter.sendMail({
    from: gmailUser,
    to: email,
    subject,

    text: `
${title}

${greeting}

OTP: ${otp}

${expiry}

${warning}

ক্ষুদ্র সঞ্চয়
সমবায় সমিতি
`.trim(),

    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;">
        <h2>${title}</h2>

        <p>${greeting}</p>

        <div style="
          font-size:32px;
          font-weight:700;
          letter-spacing:8px;
          text-align:center;
          padding:20px;
          margin:20px 0;
          background:#f1f5f9;
          border-radius:12px;
        ">
          ${otp}
        </div>

        <p>${expiry}</p>

        <p style="color:#64748b;">
          ${warning}
        </p>

        <hr />

        <p style="color:#64748b;font-size:13px;">
          ক্ষুদ্র সঞ্চয়<br />
          সমবায় সমিতি
        </p>
      </div>
    `,
  });
}

/*
|--------------------------------------------------------------------------
| Send Member PIN Reset OTP
|--------------------------------------------------------------------------
*/

export async function sendMemberPinResetOTP(
  phone: string,
  language: "bn" | "en"
): Promise<{
  success: boolean;
  code: string;
  memberId?: string;
  maskedEmail?: string;
  expiresIn?: number;
  resendAfter?: number;
}> {
  const cleanPhone =
    normalizePhone(phone);

  /*
   * Phone validation
   */
  if (
    !/^01[3-9]\d{8}$/.test(
      cleanPhone
    )
  ) {
    return {
      success: false,
      code: "INVALID_PHONE",
    };
  }

  /*
   * Find member by registered phone
   */
  const member =
    await findMemberByPhone(
      cleanPhone
    );

  if (!member) {
    return {
      success: false,
      code: "MEMBER_NOT_FOUND",
    };
  }

  /*
   * Member must be active.
   */
  if (
    member.status
      .trim()
      .toUpperCase() !==
    "ACTIVE"
  ) {
    return {
      success: false,
      code: "INACTIVE_MEMBER",
    };
  }

  /*
   * Read Members!A:K because Gmail
   * is stored in Column K.
   */
  const rows =
    await getSheetValues(
      "Members!A:K"
    );

  if (
    !Array.isArray(rows) ||
    rows.length <= 1
  ) {
    return {
      success: false,
      code: "MEMBER_NOT_FOUND",
    };
  }

  const dataRows =
    rows.slice(1);

  const rowIndex =
    dataRows.findIndex(
      (row) =>
        normalizeMemberId(
          row[0]
        ) ===
        normalizeMemberId(
          member.memberId
        ) &&
        normalizePhone(
          row[2]
        ) === cleanPhone
    );

  if (rowIndex === -1) {
    return {
      success: false,
      code: "MEMBER_NOT_FOUND",
    };
  }

  /*
   * K = Gmail
   */
  const email =
    normalizeEmail(
      dataRows[rowIndex][10]
    );

  if (!email) {
    return {
      success: false,
      code: "EMAIL_NOT_FOUND",
    };
  }

  /*
   * A registered account must already
   * have a PIN.
   */
  if (!member.pinHash) {
    return {
      success: false,
      code: "ACCOUNT_NOT_REGISTERED",
    };
  }

  /*
   * Gmail configuration
   */
  if (!gmailTransporter) {
    return {
      success: false,
      code: "EMAIL_NOT_CONFIGURED",
    };
  }

  /*
   * Generate OTP
   */
  const otp =
    generateOTP();

  const now =
    Date.now();

  const otpExpiresAt =
    now +
    10 * 60 * 1000;

  const resendAvailableAt =
    now +
    60 * 1000;

  /*
   * Generate temporary reset token.
   *
   * The raw token is never stored.
   */
  const resetToken =
    randomBytes(32).toString("hex");

  const resetTokenHash =
    hashOTP(resetToken);

  const pendingReset:
    PendingMemberPinReset = {
    memberId:
      normalizeMemberId(
        member.memberId
      ),

    phone:
      cleanPhone,

    email,

    otpHash:
      hashOTP(otp),

    otpExpiresAt,

    resendAvailableAt,

    attempts: 0,

    resetTokenHash,

    resetTokenExpiresAt: 0,
  };

  /*
   * Send email first.
   *
   * Only save pending state after
   * successful email delivery.
   */
  try {
    await sendMemberPinResetOTPEmail(
      email,
      otp,
      language
    );
  } catch (error) {
    console.error(
      "Member PIN reset OTP email error:",
      error
    );

    return {
      success: false,
      code: "EMAIL_SEND_FAILED",
    };
  }

  pendingMemberPinResets.set(
    pendingReset.memberId,
    pendingReset
  );

  /*
   * Mask Gmail for frontend.
   *
   * Example:
   * example@gmail.com
   * -> e*****e@gmail.com
   */
  const emailParts =
    email.split("@");

  const localPart =
    emailParts[0] ?? "";

  const domain =
    emailParts[1] ?? "gmail.com";

  let maskedEmail = email;

  if (localPart.length >= 2) {
    maskedEmail =
      `${localPart.charAt(0)}${"*".repeat(
        Math.max(
          1,
          localPart.length - 2
        )
      )}${localPart.charAt(
        localPart.length - 1
      )}@${domain}`;
  } else if (localPart.length === 1) {
    maskedEmail =
      `*@${domain}`;
  }

  return {
    success: true,
    code: "OTP_SENT",
    memberId:
      pendingReset.memberId,
    maskedEmail,
    expiresIn: 600,
    resendAfter: 60,
  };
}

/*
|--------------------------------------------------------------------------
| Verify Member PIN Reset OTP
|--------------------------------------------------------------------------
*/

export async function verifyMemberPinResetOTP(
  phone: string,
  otp: string
): Promise<{
  success: boolean;
  code: string;
  resetToken?: string;
}> {
  const cleanPhone =
    normalizePhone(phone);

  const cleanOTP =
    String(
      otp ?? ""
    ).trim();

  if (
    !/^01[3-9]\d{8}$/.test(
      cleanPhone
    )
  ) {
    return {
      success: false,
      code: "INVALID_PHONE",
    };
  }

  if (
    !/^\d{6}$/.test(
      cleanOTP
    )
  ) {
    return {
      success: false,
      code: "OTP_INVALID",
    };
  }

  const member =
    await findMemberByPhone(
      cleanPhone
    );

  if (!member) {
    return {
      success: false,
      code: "MEMBER_NOT_FOUND",
    };
  }

  const memberId =
    normalizeMemberId(
      member.memberId
    );

  const pending =
    pendingMemberPinResets.get(
      memberId
    );

  if (!pending) {
    return {
      success: false,
      code: "OTP_NOT_FOUND",
    };
  }

  /*
   * Ensure the same phone is being used.
   */
  if (
    pending.phone !==
    cleanPhone
  ) {
    pendingMemberPinResets.delete(
      memberId
    );

    return {
      success: false,
      code: "OTP_NOT_FOUND",
    };
  }

  /*
   * Expired
   */
  if (
    Date.now() >
    pending.otpExpiresAt
  ) {
    pendingMemberPinResets.delete(
      memberId
    );

    return {
      success: false,
      code: "OTP_EXPIRED",
    };
  }

  /*
   * Maximum attempts
   */
  if (
    pending.attempts >= 5
  ) {
    pendingMemberPinResets.delete(
      memberId
    );

    return {
      success: false,
      code:
        "OTP_TOO_MANY_ATTEMPTS",
    };
  }

  /*
   * Verify OTP
   */
  const incomingOTPHash =
    hashOTP(cleanOTP);

  if (
    incomingOTPHash !==
    pending.otpHash
  ) {
    pending.attempts += 1;

    if (
      pending.attempts >= 5
    ) {
      pendingMemberPinResets.delete(
        memberId
      );

      return {
        success: false,
        code:
          "OTP_TOO_MANY_ATTEMPTS",
      };
    }

    return {
      success: false,
      code: "OTP_INVALID",
    };
  }

  /*
   * Re-check the member before
   * allowing PIN reset.
   */
  const currentMember =
    await findMemberById(
      memberId
    );

  if (!currentMember) {
    pendingMemberPinResets.delete(
      memberId
    );

    return {
      success: false,
      code: "MEMBER_NOT_FOUND",
    };
  }

  if (
    currentMember.status
      .trim()
      .toUpperCase() !==
    "ACTIVE"
  ) {
    pendingMemberPinResets.delete(
      memberId
    );

    return {
      success: false,
      code: "INACTIVE_MEMBER",
    };
  }

  if (
    !currentMember.pinHash
  ) {
    pendingMemberPinResets.delete(
      memberId
    );

    return {
      success: false,
      code:
        "ACCOUNT_NOT_REGISTERED",
    };
  }

  /*
   * Generate a new reset token.
   */
  const resetToken =
    randomBytes(32).toString("hex");

  pending.resetTokenHash =
    hashOTP(resetToken);

  /*
   * Reset token valid for 10 minutes.
   */
  pending.resetTokenExpiresAt =
    Date.now() +
    10 * 60 * 1000;

  return {
    success: true,
    code: "OTP_VERIFIED",
    resetToken,
  };
}


/*
|--------------------------------------------------------------------------
| Resend Member PIN Reset OTP
|--------------------------------------------------------------------------
*/

export async function resendMemberPinResetOTP(
  phone: string,
  language: "bn" | "en"
): Promise<{
  success: boolean;
  code: string;
  resendAfter?: number;
  expiresIn?: number;
}> {
  const cleanPhone =
    normalizePhone(phone);

  if (
    !/^01[3-9]\d{8}$/.test(
      cleanPhone
    )
  ) {
    return {
      success: false,
      code: "INVALID_PHONE",
    };
  }

  const member =
    await findMemberByPhone(
      cleanPhone
    );

  if (!member) {
    return {
      success: false,
      code: "MEMBER_NOT_FOUND",
    };
  }

  const memberId =
    normalizeMemberId(
      member.memberId
    );

  const pending =
    pendingMemberPinResets.get(
      memberId
    );

  if (!pending) {
    return {
      success: false,
      code: "OTP_NOT_FOUND",
    };
  }

  if (
    Date.now() >
    pending.otpExpiresAt
  ) {
    pendingMemberPinResets.delete(
      memberId
    );

    return {
      success: false,
      code: "OTP_EXPIRED",
    };
  }

  const remaining =
    pending.resendAvailableAt -
    Date.now();

  if (remaining > 0) {
    return {
      success: false,
      code:
        "OTP_RESEND_COOLDOWN",
      resendAfter:
        Math.ceil(
          remaining / 1000
        ),
    };
  }

  const otp =
    generateOTP();

  const newOtpHash =
    hashOTP(otp);

  const newOtpExpiresAt =
    Date.now() +
    10 * 60 * 1000;

  const newResendAvailableAt =
    Date.now() +
    60 * 1000;

  try {
    await sendMemberPinResetOTPEmail(
      pending.email,
      otp,
      language
    );
  } catch (error) {
    console.error(
      "Member PIN reset OTP resend error:",
      error
    );

    return {
      success: false,
      code: "EMAIL_SEND_FAILED",
    };
  }

  /*
   * Update state only after
   * successful email sending.
   */
  pending.otpHash =
    newOtpHash;

  pending.otpExpiresAt =
    newOtpExpiresAt;

  pending.resendAvailableAt =
    newResendAvailableAt;

  pending.attempts = 0;

  /*
   * A newly sent OTP means the
   * previous verification is no
   * longer valid.
   */
  pending.resetTokenHash = "";

  pending.resetTokenExpiresAt = 0;

  return {
    success: true,
    code: "OTP_SENT",
    expiresIn: 600,
    resendAfter: 60,
  };
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
): Promise<{
  success: boolean;
  code: string;
}> {
  const cleanPhone =
    normalizePhone(phone);

  const cleanResetToken =
    String(
      resetToken ?? ""
    ).trim();

  const cleanNewPin =
    String(
      newPin ?? ""
    ).trim();

  const cleanConfirmPin =
    String(
      confirmPin ?? ""
    ).trim();

  if (
    !/^01[3-9]\d{8}$/.test(
      cleanPhone
    )
  ) {
    return {
      success: false,
      code: "INVALID_PHONE",
    };
  }

  /*
   * Existing registration/change-PIN
   * rule: 4–6 numeric digits.
   */
  if (
    !/^\d{4,6}$/.test(
      cleanNewPin
    )
  ) {
    return {
      success: false,
      code: "INVALID_PIN",
    };
  }

  if (
    cleanNewPin !==
    cleanConfirmPin
  ) {
    return {
      success: false,
      code: "PIN_MISMATCH",
    };
  }

  if (!cleanResetToken) {
    return {
      success: false,
      code: "RESET_TOKEN_INVALID",
    };
  }

  const member =
    await findMemberByPhone(
      cleanPhone
    );

  if (!member) {
    return {
      success: false,
      code: "MEMBER_NOT_FOUND",
    };
  }

  const memberId =
    normalizeMemberId(
      member.memberId
    );

  const pending =
    pendingMemberPinResets.get(
      memberId
    );

  if (!pending) {
    return {
      success: false,
      code: "RESET_SESSION_NOT_FOUND",
    };
  }

  /*
   * Reset token expiry
   */
  if (
    !pending.resetTokenExpiresAt ||
    Date.now() >
    pending.resetTokenExpiresAt
  ) {
    pendingMemberPinResets.delete(
      memberId
    );

    return {
      success: false,
      code: "RESET_TOKEN_EXPIRED",
    };
  }

  /*
   * Verify reset token.
   */
  const incomingTokenHash =
    hashOTP(
      cleanResetToken
    );

  if (
    incomingTokenHash !==
    pending.resetTokenHash
  ) {
    return {
      success: false,
      code: "RESET_TOKEN_INVALID",
    };
  }

  /*
   * Re-read the actual Google Sheet.
   */
  const rows =
    await getSheetValues(
      "Members!A:K"
    );

  if (
    !Array.isArray(rows) ||
    rows.length <= 1
  ) {
    pendingMemberPinResets.delete(
      memberId
    );

    return {
      success: false,
      code: "MEMBER_NOT_FOUND",
    };
  }

  const dataRows =
    rows.slice(1);

  const rowIndex =
    dataRows.findIndex(
      (row) =>
        normalizeMemberId(
          row[0]
        ) === memberId &&
        normalizePhone(
          row[2]
        ) === cleanPhone
    );

  if (rowIndex === -1) {
    pendingMemberPinResets.delete(
      memberId
    );

    return {
      success: false,
      code: "MEMBER_NOT_FOUND",
    };
  }

  const sheetRowNumber =
    rowIndex + 2;

  /*
   * Make sure account is still active.
   */
  const currentStatus =
    String(
      dataRows[rowIndex][7] ??
      ""
    ).trim();

  if (
    currentStatus
      .toUpperCase() !==
    "ACTIVE"
  ) {
    pendingMemberPinResets.delete(
      memberId
    );

    return {
      success: false,
      code: "INACTIVE_MEMBER",
    };
  }

  /*
   * Hash new PIN.
   */
  const newPinHash =
    hashPin(
      cleanNewPin
    );

  /*
   * G = PIN Hash
   *
   * Only G is updated.
   * A, B, C, D, E, F, H, I, J, K
   * remain unchanged.
   */
  await updateSheetValues(
    `Members!G${sheetRowNumber}`,
    [
      [
        newPinHash,
      ],
    ]
  );

  /*
   * Reset completed.
   */
  pendingMemberPinResets.delete(
    memberId
  );

  return {
    success: true,
    code: "PIN_RESET_SUCCESS",
  };
}

/*
|--------------------------------------------------------------------------
| Register Member Account
|--------------------------------------------------------------------------
*/

export async function registerMemberAccount(
  memberId: string,
  memberName: string,
  phone: string,
  email: string,
  pin: string,
  confirmPin: string,
  language: "bn" | "en"
): Promise<{
  success: boolean;
  code: string;
  expiresIn?: number;
  resendAfter?: number;
}> {
  const cleanMemberId =
    normalizeMemberId(
      memberId
    );

  /*
   * Member Name is still accepted
   * and stored in pending registration,
   * but it is NOT compared with
   * Google Sheet Member Name.
   */

  const cleanMemberName =
    String(
      memberName ?? ""
    )
      .trim()
      .replace(
        /\s+/g,
        " "
      );

  const cleanPhone =
    normalizePhone(
      phone
    );

  const cleanEmail =
    normalizeEmail(
      email
    );

  const cleanPin =
    String(
      pin ?? ""
    ).trim();

  const cleanConfirmPin =
    String(
      confirmPin ?? ""
    ).trim();

  /*
   * Validation
   */

  if (!cleanMemberId) {
    return {
      success: false,
      code:
        "INVALID_MEMBER_ID",
    };
  }

  if (!cleanMemberName) {
    return {
      success: false,
      code:
        "INVALID_NAME",
    };
  }

  if (
    !/^01[3-9]\d{8}$/.test(
      cleanPhone
    )
  ) {
    return {
      success: false,
      code:
        "INVALID_PHONE",
    };
  }

  /*
   * Gmail only.
   *
   * Example:
   * example@gmail.com
   */

  if (
    !/^[A-Z0-9._%+-]+@gmail\.com$/i.test(
      cleanEmail
    )
  ) {
    return {
      success: false,
      code:
        "INVALID_EMAIL",
    };
  }

  if (
    !/^\d{4,6}$/.test(
      cleanPin
    )
  ) {
    return {
      success: false,
      code:
        "INVALID_PIN",
    };
  }

  if (
    cleanPin !==
    cleanConfirmPin
  ) {
    return {
      success: false,
      code:
        "PIN_MISMATCH",
    };
  }

  /*
   * Find Member
   */

  const member =
    await findMemberById(
      cleanMemberId
    );

  if (!member) {
    return {
      success: false,
      code:
        "MEMBER_NOT_FOUND",
    };
  }

  /*
   * Active check
   */

  if (
    member.status
      .trim()
      .toUpperCase() !==
    "ACTIVE"
  ) {
    return {
      success: false,
      code:
        "INACTIVE_MEMBER",
    };
  }

  /*
   * IMPORTANT:
   *
   * Member Name is intentionally
   * NOT compared with Google Sheet.
   *
   * Only Phone Number is verified
   * against the Sheet.
   */

  if (
    normalizePhone(
      member.phone
    ) !==
    cleanPhone
  ) {
    return {
      success: false,
      code:
        "PHONE_MISMATCH",
    };
  }

  /*
   * Already registered?
   */

  if (member.pinHash) {
    return {
      success: false,
      code:
        "ALREADY_REGISTERED",
    };
  }

  /*
   * Gmail already used?
   */

  if (
    await isMemberEmailUsed(
      cleanEmail,
      cleanMemberId
    )
  ) {
    return {
      success: false,
      code:
        "EMAIL_ALREADY_USED",
    };
  }

  /*
   * Gmail configuration
   */

  if (!gmailTransporter) {
    return {
      success: false,
      code:
        "EMAIL_NOT_CONFIGURED",
    };
  }

  /*
   * Generate OTP
   */

  const otp =
    generateOTP();

  const now =
    Date.now();

  const otpExpiresAt =
    now +
    10 * 60 * 1000;

  const resendAvailableAt =
    now +
    60 * 1000;

  const pendingRegistration:
    PendingMemberRegistration =
  {
    memberId:
      cleanMemberId,

    memberName:
      cleanMemberName,

    phone:
      cleanPhone,

    email:
      cleanEmail,

    pinHash:
      hashPin(
        cleanPin
      ),

    otpHash:
      hashOTP(
        otp
      ),

    otpExpiresAt,

    resendAvailableAt,

    attempts: 0,
  };

  /*
   * Send OTP first.
   *
   * Email সফল হলে তবেই pending registration
   * memory-তে রাখা হবে।
   */

  try {
    await sendMemberRegistrationOTP(
      cleanEmail,
      otp,
      language
    );
  } catch (error) {
    console.error(
      "Member registration OTP email error:",
      error
    );

    return {
      success: false,
      code:
        "EMAIL_SEND_FAILED",
    };
  }

  /*
   * Store pending registration.
   */

  pendingMemberRegistrations.set(
    cleanMemberId,
    pendingRegistration
  );

  return {
    success: true,
    code:
      "OTP_SENT",
    expiresIn: 600,
    resendAfter: 60,
  };
}

/*
|--------------------------------------------------------------------------
| Verify Member Registration OTP
|--------------------------------------------------------------------------
*/

export async function verifyMemberRegistrationOTP(
  memberId: string,
  otp: string
): Promise<{
  success: boolean;
  code: string;
}> {
  const cleanMemberId =
    normalizeMemberId(
      memberId
    );

  const cleanOTP =
    String(
      otp ?? ""
    ).trim();

  if (
    !/^\d{6}$/.test(
      cleanOTP
    )
  ) {
    return {
      success: false,
      code:
        "OTP_INVALID",
    };
  }

  const pending =
    pendingMemberRegistrations.get(
      cleanMemberId
    );

  if (!pending) {
    return {
      success: false,
      code:
        "OTP_NOT_FOUND",
    };
  }

  /*
   * Expired
   */

  if (
    Date.now() >
    pending.otpExpiresAt
  ) {
    pendingMemberRegistrations.delete(
      cleanMemberId
    );

    return {
      success: false,
      code:
        "OTP_EXPIRED",
    };
  }

  /*
   * Maximum attempts
   */

  if (
    pending.attempts >= 5
  ) {
    pendingMemberRegistrations.delete(
      cleanMemberId
    );

    return {
      success: false,
      code:
        "OTP_TOO_MANY_ATTEMPTS",
    };
  }

  /*
   * Verify OTP
   */

  const incomingOTPHash =
    hashOTP(
      cleanOTP
    );

  if (
    incomingOTPHash !==
    pending.otpHash
  ) {
    pending.attempts += 1;

    /*
     * Immediately invalidate the
     * pending registration after
     * the 5th wrong attempt.
     */

    if (
      pending.attempts >= 5
    ) {
      pendingMemberRegistrations.delete(
        cleanMemberId
      );

      return {
        success: false,
        code:
          "OTP_TOO_MANY_ATTEMPTS",
      };
    }

    return {
      success: false,
      code:
        "OTP_INVALID",
    };
  }

  /*
   * Re-check member before writing.
   */

  const member =
    await findMemberById(
      cleanMemberId
    );

  if (!member) {
    pendingMemberRegistrations.delete(
      cleanMemberId
    );

    return {
      success: false,
      code:
        "MEMBER_NOT_FOUND",
    };
  }

  /*
   * Active member must still
   * be active at verification time.
   */

  if (
    member.status
      .trim()
      .toUpperCase() !==
    "ACTIVE"
  ) {
    pendingMemberRegistrations.delete(
      cleanMemberId
    );

    return {
      success: false,
      code:
        "INACTIVE_MEMBER",
    };
  }

  if (member.pinHash) {
    pendingMemberRegistrations.delete(
      cleanMemberId
    );

    return {
      success: false,
      code:
        "ALREADY_REGISTERED",
    };
  }

  /*
   * IMPORTANT:
   *
   * Member Name is NOT checked here.
   *
   * Only Phone Number is checked again.
   */

  if (
    normalizePhone(
      member.phone
    ) !==
    pending.phone
  ) {
    pendingMemberRegistrations.delete(
      cleanMemberId
    );

    return {
      success: false,
      code:
        "PHONE_MISMATCH",
    };
  }

  /*
   * Find actual Google Sheet row.
   */

  const rows =
    await getSheetValues(
      "Members!A:K"
    );

  if (
    !Array.isArray(rows) ||
    rows.length <= 1
  ) {
    pendingMemberRegistrations.delete(
      cleanMemberId
    );

    return {
      success: false,
      code:
        "MEMBER_NOT_FOUND",
    };
  }

  const dataRows =
    rows.slice(1);

  const rowIndex =
    dataRows.findIndex(
      (row) =>
        normalizeMemberId(
          row[0]
        ) ===
        cleanMemberId
    );

  if (
    rowIndex === -1
  ) {
    pendingMemberRegistrations.delete(
      cleanMemberId
    );

    return {
      success: false,
      code:
        "MEMBER_NOT_FOUND",
    };
  }

  const sheetRowNumber =
    rowIndex + 2;

  /*
   * Preserve existing values:
   *
   * G = PIN Hash       -> update
   * H = Status         -> preserve
   * I = Created At     -> preserve
   * J = Updated At     -> update
   * K = Gmail          -> update
   */

  const currentStatus =
    String(
      dataRows[rowIndex][7] ??
      ""
    ).trim();

  const currentCreatedAt =
    String(
      dataRows[rowIndex][8] ??
      ""
    ).trim();

  const now =
    new Date().toISOString();

  /*
   * Update G:K in ONE operation.
   *
   * This prevents H and I from
   * being accidentally changed.
   */

  await updateSheetValues(
    `Members!G${sheetRowNumber}:K${sheetRowNumber}`,
    [
      [
        pending.pinHash,

        currentStatus,

        currentCreatedAt,

        now,

        pending.email,
      ],
    ]
  );

  /*
   * Registration completed.
   */

  pendingMemberRegistrations.delete(
    cleanMemberId
  );

  return {
    success: true,
    code:
      "REGISTRATION_SUCCESS",
  };
}

/*
|--------------------------------------------------------------------------
| Resend Member Registration OTP
|--------------------------------------------------------------------------
*/

export async function resendMemberRegistrationOTP(
  memberId: string,
  language: "bn" | "en"
): Promise<{
  success: boolean;
  code: string;
  resendAfter?: number;
  expiresIn?: number;
}> {
  const cleanMemberId =
    normalizeMemberId(
      memberId
    );

  const pending =
    pendingMemberRegistrations.get(
      cleanMemberId
    );

  if (!pending) {
    return {
      success: false,
      code:
        "OTP_NOT_FOUND",
    };
  }

  /*
   * Expired pending registration.
   */

  if (
    Date.now() >
    pending.otpExpiresAt
  ) {
    pendingMemberRegistrations.delete(
      cleanMemberId
    );

    return {
      success: false,
      code:
        "OTP_EXPIRED",
    };
  }

  /*
   * Resend cooldown
   */

  const remaining =
    pending.resendAvailableAt -
    Date.now();

  if (
    remaining > 0
  ) {
    return {
      success: false,
      code:
        "OTP_RESEND_COOLDOWN",

      resendAfter:
        Math.ceil(
          remaining / 1000
        ),
    };
  }

  /*
   * Generate a new OTP.
   *
   * IMPORTANT:
   * New OTP values are not applied to the
   * pending registration until the email
   * has been successfully sent.
   */

  const otp =
    generateOTP();

  const newOtpHash =
    hashOTP(
      otp
    );

  const newOtpExpiresAt =
    Date.now() +
    10 * 60 * 1000;

  const newResendAvailableAt =
    Date.now() +
    60 * 1000;

  try {
    await sendMemberRegistrationOTP(
      pending.email,
      otp,
      language
    );
  } catch (error) {
    console.error(
      "Member registration OTP resend error:",
      error
    );

    return {
      success: false,
      code:
        "EMAIL_SEND_FAILED",
    };
  }

  /*
   * Only update OTP state after
   * successful email sending.
   */

  pending.otpHash =
    newOtpHash;

  pending.otpExpiresAt =
    newOtpExpiresAt;

  pending.resendAvailableAt =
    newResendAvailableAt;

  pending.attempts = 0;

  return {
    success: true,
    code:
      "OTP_SENT",

    expiresIn: 600,

    resendAfter: 60,
  };
}