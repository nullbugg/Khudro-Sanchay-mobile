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
  deleteSheetRows,
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
  currentWeeklyPaid: number;
  currentAdvance: number;
  totalDeposit: number;
  arrears: number;
  advanceAmount: number;
  availableAdvance: number;
  lastPaymentDate: string;
  latestWeek: number;
  currentWeek: number;
  collectionWeek: number;
  currentWeekStartDate: string;
  currentWeekEndDate: string;
  nextWeek: number;
  nextWeekStartDate: string;
  nextWeekEndDate: string;
  currentWeekPaid: number;
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

  overallStats: {
    totalDeposited: number;
    totalDue: number;
    totalMembers: number;
    totalShares: number;
    totalWeeks: number;
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
| Get Member Share & Withdrawal History
|--------------------------------------------------------------------------
*/

export async function getMemberShareHistory(
  memberId: string
): Promise<{
  success: boolean;
  shareHistory: {
    historyId: string;
    previousShareCount: number;
    newShareCount: number;
    previousWeeklyAmount: number;
    newWeeklyAmount: number;
    changeWeek: number;
    effectiveWeek: number;
    additionalRequirement: number;
    advanceApplied: number;
    newDepositRequired: number;
    adminId: string;
    date: string;
    withdrawalId: string;
  }[];
  withdrawalHistory: {
    withdrawalId: string;
    refundAmount: number;
    historyId: string;
    week: number;
    date: string;
    adminId: string;
    notes: string;
  }[];
}> {
  const cleanMemberId = normalizeMemberId(memberId);

  if (!cleanMemberId) {
    return {
      success: false,
      shareHistory: [],
      withdrawalHistory: [],
    };
  }

  const [shareRows, withdrawalRows] = await Promise.all([
    getSheetValues("Share History!A:N"),
    getSheetValues("Withdrawal History!A:I"),
  ]);

  const shareHistory = shareRows
    .slice(1)
    .filter(
      (row) =>
        normalizeMemberId(row[1]) === cleanMemberId
    )
    .map((row) => ({
      historyId: String(row[0] ?? ""),
      previousShareCount: Number(row[2]) || 0,
      newShareCount: Number(row[3]) || 0,
      previousWeeklyAmount: Number(row[4]) || 0,
      newWeeklyAmount: Number(row[5]) || 0,
      changeWeek: Number(row[6]) || 0,
      effectiveWeek: Number(row[7]) || 0,
      additionalRequirement: Number(row[8]) || 0,
      advanceApplied: Number(row[9]) || 0,
      newDepositRequired: Number(row[10]) || 0,
      adminId: String(row[11] ?? ""),
      date: String(row[12] ?? ""),
      withdrawalId: String(row[13] ?? ""),
    }))
    .sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
    );

  const withdrawalHistory = withdrawalRows
    .slice(1)
    .filter(
      (row) =>
        normalizeMemberId(row[1]) === cleanMemberId
    )
    .map((row) => ({
      withdrawalId: String(row[0] ?? ""),
      refundAmount: Number(row[3]) || 0,
      historyId: String(row[4] ?? ""),
      week: Number(row[5]) || 0,
      date: String(row[6] ?? ""),
      adminId: String(row[7] ?? ""),
      notes: String(row[8] ?? ""),
    }))
    .sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
    );

  return {
    success: true,
    shareHistory,
    withdrawalHistory,
  };
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
): Promise<MemberDashboardData | null> {
  const member = await findMemberById(memberId);

  if (!member) return null;

  const [
    collectionRows,
    shareHistoryRows,
    withdrawalRows,
    allMemberRows,
  ] = await Promise.all([
    getSheetValues("Collections!A:L"),
    getSheetValues("Share History!A:N"),
    getSheetValues("Withdrawal History!A:I"),
    getSheetValues("Members!A:K"),
  ]);

  const normalizedMemberId = String(memberId).trim().toUpperCase();

  const collections = parseCollections(collectionRows)
    .filter(
      (item) =>
        String(item.memberId).trim().toUpperCase() === normalizedMemberId
    )
    .sort((a, b) => a.weekNumber - b.weekNumber);

  const currentWeek = getCurrentWeekNumber();
  const nextWeek = currentWeek + 1;

  const WEEKLY_PRICE = 50;

  // -----------------------------------------
  // Overall Cooperative Statistics
  // -----------------------------------------

  const totalWeeks = currentWeek;

  // শুধু ACTIVE সদস্যদের নেওয়া হবে।
  const activeMembers = allMemberRows.slice(1).filter((row) => {
    const rowMemberId = String(row[0] ?? "").trim();
    const status = String(row[7] ?? "").trim().toUpperCase();

    return rowMemberId !== "" && status === "ACTIVE";
  });

  // মোট ACTIVE সদস্য।
  const totalMembers = activeMembers.length;

  // ACTIVE সদস্যদের মোট Share।
  const totalShares = activeMembers.reduce((sum, row) => {
    const shares = Number(
      String(row[4] ?? "0").replace(/,/g, "")
    );

    return sum + (
      Number.isFinite(shares) && shares > 0 ? shares : 0
    );
  }, 0);

  // -----------------------------------------
  // Overall Total Deposit
  // Same Formula as Admin Dashboard
  // -----------------------------------------

  // 1. All PAID Collections
  // Advance Collections are already included here.

  const overallPaidCollections =
    collectionRows.length > 1
      ? collectionRows.slice(1).filter(
          (row) =>
            String(row[8] ?? "").trim().toUpperCase() === "PAID"
        )
      : [];

  const totalCollectionDeposit =
    overallPaidCollections.reduce(
      (sum, row) => {
        const amount = Number(
          String(row[7] ?? "0").replace(/,/g, "")
        );

        return sum + (
          Number.isFinite(amount) ? amount : 0
        );
      },
      0
    );

  // 2. Share Increase Deposits
  // Only Share Increase records are counted.
  // Share Decrease records are excluded.
  // Advance Applied (J) is not counted again.

  const overallShareHistory =
    shareHistoryRows.length > 1
      ? shareHistoryRows.slice(1)
      : [];

  const additionalShareDeposits =
    overallShareHistory.reduce(
      (sum, row) => {
        const previousShares = Number(
          String(row[2] ?? "0").replace(/,/g, "")
        );

        const newShares = Number(
          String(row[3] ?? "0").replace(/,/g, "")
        );

        const depositRequired = Number(
          String(row[10] ?? "0").replace(/,/g, "")
        );

        if (
          !Number.isFinite(previousShares) ||
          !Number.isFinite(newShares) ||
          !Number.isFinite(depositRequired)
        ) {
          return sum;
        }

        if (newShares > previousShares) {
          return sum + Math.max(0, depositRequired);
        }

        return sum;
      },
      0
    );

  // 3. All Member Withdrawals

  const overallWithdrawalData =
    withdrawalRows.length > 1
      ? withdrawalRows.slice(1)
      : [];

  const overallTotalWithdrawn =
    overallWithdrawalData.reduce(
      (sum, row) => {
        const rowMemberId = String(
          row[1] ?? ""
        ).trim();

        const amount = Number(
          String(row[3] ?? "0").replace(/,/g, "")
        );

        if (
          !rowMemberId ||
          !Number.isFinite(amount) ||
          amount <= 0
        ) {
          return sum;
        }

        return sum + amount;
      },
      0
    );

  // 4. Final Cooperative Total Deposit

  const totalDeposited =
    totalCollectionDeposit +
    additionalShareDeposits -
    overallTotalWithdrawn;

  // মোট বকেয়া।
  const totalDue =
    totalShares * WEEKLY_PRICE * totalWeeks - totalDeposited;

  const overallStats = {
    totalDeposited,
    totalDue,
    totalMembers,
    totalShares,
    totalWeeks,
  };


  const joinWeek = Math.max(
    1,
    getWeekNumberFromDate(member.joinDate)
  );

  const collectionWeek = collections.reduce(
    (max, item) => Math.max(max, item.weekNumber),
    0
  );

  // -----------------------------------------
  // 1. Share History
  // -----------------------------------------

  const shareHistory = shareHistoryRows
    .filter(
      (row) =>
        String(row[1] || "").trim().toUpperCase() ===
        normalizedMemberId
    )
    .map((row) => ({
      previousShareCount: Number(row[2]) || 0,
      newShareCount: Number(row[3]) || 0,
      changeWeek: Number(row[6]) || 0,
      effectiveWeek: Number(row[7]) || 0,
      newDepositRequired: Number(row[10]) || 0,
    }))
    .filter(
      (item) => item.changeWeek > 0 && item.effectiveWeek > 0
    )
    .sort((a, b) => a.effectiveWeek - b.effectiveWeek);

  // -----------------------------------------
  // 2. Share Increase Charge & Deposit
  // -----------------------------------------

  const increaseChargeByWeek = new Map<number, number>();
  const increaseDepositByWeek = new Map<number, number>();

  for (const history of shareHistory) {
    const addedShares =
      history.newShareCount - history.previousShareCount;

    if (addedShares <= 0) continue;

    const weeklyAdditionalCharge =
      addedShares * WEEKLY_PRICE;

    let remainingDeposit = history.newDepositRequired;

    // Share increase-এর অতিরিক্ত টাকা
    // Change Week পর্যন্ত ভাগ করে দেওয়া হবে।
    for (
      let week = joinWeek;
      week <= history.changeWeek;
      week++
    ) {
      increaseChargeByWeek.set(
        week,
        (increaseChargeByWeek.get(week) || 0) +
        weeklyAdditionalCharge
      );

      const allocatedDeposit = Math.min(
        weeklyAdditionalCharge,
        remainingDeposit
      );

      if (allocatedDeposit > 0) {
        increaseDepositByWeek.set(
          week,
          (increaseDepositByWeek.get(week) || 0) +
          allocatedDeposit
        );

        remainingDeposit -= allocatedDeposit;
      }
    }

    // Historical charge-এর অতিরিক্ত টাকা থাকলে
    // Change Week-এ রাখা হবে।
    if (remainingDeposit > 0) {
      increaseDepositByWeek.set(
        history.changeWeek,
        (increaseDepositByWeek.get(history.changeWeek) || 0) +
        remainingDeposit
      );
    }
  }

  // -----------------------------------------
  // 3. Withdrawal / Refund History
  // -----------------------------------------

  const refundByWeek = new Map<number, number>();
  const untrackedRefundByWeek = new Map<number, number>();

  let totalRefund = 0;

  for (const row of withdrawalRows) {
    const rowMemberId = String(row[1] || "")
      .trim()
      .toUpperCase();

    if (rowMemberId !== normalizedMemberId) continue;

    const refundAmount = Number(row[3]) || 0;

    if (refundAmount <= 0) continue;

    totalRefund += refundAmount;

    const notes = String(row[8] || "").trim();
    const withdrawalWeek = Number(row[5]) || currentWeek;

    let mappedAmount = 0;
    const mappedRefunds = new Map<number, number>();

    // Old detailed format:
    // SHARE_DECREASE_REFUND|WEEKLY=1:50,2:50

    const detailedMatch = notes.match(/WEEKLY=([0-9:,]+)/i);

    if (detailedMatch) {
      const entries = detailedMatch[1].split(",");

      for (const entry of entries) {
        const [weekText, amountText] = entry.split(":");

        const week = Number(weekText);
        const amount = Number(amountText);

        if (week > 0 && amount > 0) {
          mappedRefunds.set(
            week,
            (mappedRefunds.get(week) || 0) + amount
          );

          mappedAmount += amount;
        }
      }
    }

    // Readable format:
    // SHARE DECREASE! REFUND WEEK (01 - 28) = 1400

    if (mappedAmount === 0) {
      const readableMatch = notes.match(
        /^SHARE DECREASE! REFUND WEEK \((\d+)\s*-\s*(\d+)\)\s*=\s*(\d+(?:\.\d+)?)$/i
      );

      if (readableMatch) {
        const startWeek = Number(readableMatch[1]);
        const endWeek = Number(readableMatch[2]);
        const amount = Number(readableMatch[3]);

        const weekCount = endWeek - startWeek + 1;

        if (
          startWeek > 0 &&
          endWeek >= startWeek &&
          weekCount > 0 &&
          Math.abs(amount - refundAmount) < 0.01 &&
          amount % weekCount === 0
        ) {
          const perWeek = amount / weekCount;

          for (let week = startWeek; week <= endWeek; week++) {
            mappedRefunds.set(week, perWeek);
          }

          mappedAmount = amount;
        }
      }
    }

    if (
      mappedAmount > 0 &&
      Math.abs(mappedAmount - refundAmount) < 0.01
    ) {
      for (const [week, amount] of mappedRefunds) {
        refundByWeek.set(
          week,
          (refundByWeek.get(week) || 0) + amount
        );
      }
    } else {
      untrackedRefundByWeek.set(
        withdrawalWeek,
        (untrackedRefundByWeek.get(withdrawalWeek) || 0) +
        refundAmount
      );
    }
  }

  // -----------------------------------------
  // 4. Collection Summary
  // -----------------------------------------

  const weeklyCollections = collections.filter(
    (item) => item.weekNumber <= currentWeek
  );

  const advanceCollections = collections.filter(
    (item) => item.weekNumber > currentWeek
  );

  // Share Increase K column-এর মোট জমা
  const totalShareIncreaseDeposit = shareHistory.reduce(
    (sum, item) => sum + item.newDepositRequired,
    0
  );

  // Current Week পর্যন্ত Weekly Refund
  const totalWeeklyRefund = [...refundByWeek.entries()]
    .filter(([week]) => week <= currentWeek)
    .reduce((sum, [, amount]) => sum + amount, 0);

  // Untracked Weekly Refund
  const totalUntrackedWeeklyRefund = [
    ...untrackedRefundByWeek.entries(),
  ]
    .filter(([week]) => week <= currentWeek)
    .reduce((sum, [, amount]) => sum + amount, 0);

  // মোট Weekly Refund
  const weeklyRefund =
    totalWeeklyRefund + totalUntrackedWeeklyRefund;

  // Advance Refund
  const advanceRefund = Math.max(
    0,
    totalRefund - weeklyRefund
  );

  // মোট Weekly Deposit
  const totalWeeklyDeposit =
    weeklyCollections.reduce(
      (sum, item) => sum + item.paidAmount,
      0
    ) +
    totalShareIncreaseDeposit -
    weeklyRefund;

  // মোট Advance
  const totalAdvanceDeposit =
    advanceCollections.reduce(
      (sum, item) => sum + Number(item.paidAmount || 0),
      0
    ) - advanceRefund;

  // চলতি সপ্তাহের জমা
  const currentWeekPaid = collections
    .filter((item) => item.weekNumber === currentWeek)
    .reduce((sum, item) => sum + item.paidAmount, 0);

  const currentWeekAdvanceAdded = totalAdvanceDeposit;

  const currentWeeklyPaid = totalWeeklyDeposit;

  // মোট জমা
  const totalDeposit =
    totalWeeklyDeposit + totalAdvanceDeposit;

  // -----------------------------------------
  // 5. Weekly Payment Map
  // -----------------------------------------

  const weeklyPaymentByWeek = new Map<number, number>();

  // সব Collection তার নির্দিষ্ট Week অনুযায়ী রাখা হবে।
  // Future Week-এর Collection-ও এখানে থাকবে।
  for (const item of collections) {
    weeklyPaymentByWeek.set(
      item.weekNumber,
      (weeklyPaymentByWeek.get(item.weekNumber) || 0) +
      item.paidAmount
    );
  }

  // Share Increase K deposit তার changeWeek-এ যোগ হবে।
  for (const [week, amount] of increaseDepositByWeek) {
    weeklyPaymentByWeek.set(
      week,
      (weeklyPaymentByWeek.get(week) || 0) + amount
    );
  }

  // -----------------------------------------
  // 6. Calculate Weekly Due
  // -----------------------------------------

  let shareCount =
    shareHistory.length > 0
      ? shareHistory[0].previousShareCount
      : Number(member.currentShareCount) || 0;

  let availableAdvance = 0;
  let arrears = 0;
  let latestWeek = joinWeek - 1;

  const processUntilWeek = Math.max(
    currentWeek,
    collectionWeek,
    joinWeek
  );

  for (
    let week = joinWeek;
    week <= processUntilWeek;
    week++
  ) {
    // Apply share changes effective from this week.
    for (const history of shareHistory) {
      if (history.effectiveWeek === week) {
        shareCount = history.newShareCount;
      }
    }

    // This week's actual collection.
    let weeklyPayment =
      weeklyPaymentByWeek.get(week) || 0;

    // Refund for this particular week.
    const mappedRefund = refundByWeek.get(week) || 0;

    // Deduct refund from weekly payment.
    weeklyPayment -= mappedRefund;

    // Normal weekly due.
    const weeklyDue = shareCount * WEEKLY_PRICE;

    // Share Increase charge after refund adjustment.
    const additionalCharge = Math.max(
      0,
      (increaseChargeByWeek.get(week) || 0) -
      mappedRefund
    );

    const totalDue =
      weeklyDue + additionalCharge + arrears;

    // If refund exceeds weekly payment,
    // reduce existing advance.
    if (weeklyPayment < 0) {
      availableAdvance += weeklyPayment;
      weeklyPayment = 0;
    }

    // Advance from previous weeks covers this week's due.
    const advanceUsed = Math.min(
      availableAdvance,
      totalDue
    );

    availableAdvance -= advanceUsed;

    let remainingDue = totalDue - advanceUsed;

    // This week's payment covers remaining due.
    const paymentUsed = Math.min(
      weeklyPayment,
      remainingDue
    );

    remainingDue -= paymentUsed;

    // Excess payment becomes available advance.
    const excessWeeklyPayment = Math.max(
      0,
      weeklyPayment - paymentUsed
    );

    availableAdvance += excessWeeklyPayment;

    // Remaining amount is arrears.
    arrears = Math.max(0, remainingDue);

    // Untracked refund reduces available advance.
    const untrackedRefund =
      untrackedRefundByWeek.get(week) || 0;

    availableAdvance -= untrackedRefund;

    if (availableAdvance < 0) {
      arrears += Math.abs(availableAdvance);
      availableAdvance = 0;
    }

    // Latest fully covered week.
    if (arrears === 0) {
      latestWeek = week;
    }
  }

  // -----------------------------------------
  // 7. Future Advance Coverage
  // -----------------------------------------

  let futureAdvance = totalAdvanceDeposit;
  let futureShareCount = shareCount;
  let advanceAmount = 0;

  for (
    let week = processUntilWeek + 1;
    futureAdvance > 0 &&
    week <= processUntilWeek + 100;
    week++
  ) {
    for (const history of shareHistory) {
      if (history.effectiveWeek === week) {
        futureShareCount = history.newShareCount;
      }
    }

    const futureDue = futureShareCount * WEEKLY_PRICE;

    if (futureAdvance < futureDue) {
      break;
    }

    futureAdvance -= futureDue;
    advanceAmount += futureDue;
  }

  const availableAdvanceAmount = Math.max(
    0,
    futureAdvance
  );

  // -----------------------------------------
  // 8. Dates
  // -----------------------------------------

  const getWeekDates = (week: number) => {
    const startDate = new Date(
      "2026-04-24T00:00:00.000Z"
    );

    startDate.setUTCDate(
      startDate.getUTCDate() + (week - 1) * 7
    );

    const endDate = new Date(startDate);

    endDate.setUTCDate(
      endDate.getUTCDate() + 6
    );

    const formatDate = (date: Date) => {
      const day = String(date.getUTCDate()).padStart(2, "0");
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const year = date.getUTCFullYear();

      return `${day}-${month}-${year}`;
    };

    return {
      start: formatDate(startDate),
      end: formatDate(endDate),
    };
  };

  const currentWeekDates = getWeekDates(currentWeek);
  const nextWeekDates = getWeekDates(nextWeek);

  // -----------------------------------------
  // 9. Last Payment Date
  // -----------------------------------------

  const lastPaymentDate =
    [...collections]
      .filter(
        (item) => item.paidAmount > 0 && item.date
      )
      .sort((a, b) => {
        const parseDate = (value: string) => {
          const parts = value.split(/[-/]/).map(Number);

          if (parts.length !== 3) return 0;

          if (parts[0] > 999) {
            return new Date(
              parts[0],
              parts[1] - 1,
              parts[2]
            ).getTime();
          }

          return new Date(
            parts[2],
            parts[1] - 1,
            parts[0]
          ).getTime();
        };

        return parseDate(b.date) - parseDate(a.date);
      })[0]?.date || "";

  // -----------------------------------------
  // 10. Return Dashboard
  // -----------------------------------------

  return {
    member: {
      memberId: member.memberId,
      memberName: member.memberName,
      phone: member.phone,
      email: member.email || "",
      joinDate: member.joinDate,
      currentShareCount:
        Number(member.currentShareCount) || 0,
      currentWeeklyAmount:
        (Number(member.currentShareCount) || 0) *
        WEEKLY_PRICE,
      status: member.status,
    },

    summary: {
      currentWeeklyPaid,
      currentAdvance: totalAdvanceDeposit,
      totalDeposit,
      arrears,
      advanceAmount,
      availableAdvance: availableAdvanceAmount,
      lastPaymentDate,
      latestWeek,
      currentWeek,
      collectionWeek,
      currentWeekStartDate: currentWeekDates.start,
      currentWeekEndDate: currentWeekDates.end,
      nextWeek,
      nextWeekStartDate: nextWeekDates.start,
      nextWeekEndDate: nextWeekDates.end,
      currentWeekPaid,
      currentWeekAdvanceAdded: 0,
    },

    overallStats,
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


  const currentRow = dataRows[rowIndex];

  const currentStatus =
    String(currentRow[7] ?? "").trim();

  const currentCreatedAt =
    String(currentRow[8] ?? "").trim();

  const now = new Date().toISOString();

  /*
   * Update Members!B:K in ONE operation.
   *
   * B = Member Name       -> update with new name
   * C = Phone             -> preserve
   * D = Join Date         -> preserve
   * E = Share Count       -> preserve
   * F = Weekly Amount     -> preserve
   * G = PIN Hash          -> update
   * H = Status            -> preserve
   * I = Created At        -> preserve
   * J = Updated At        -> update
   * K = Gmail             -> update
   */

  await updateSheetValues(
    `Members!B${sheetRowNumber}:K${sheetRowNumber}`,
    [
      [
        pending.memberName,
        currentRow[2] ?? "",
        currentRow[3] ?? "",
        currentRow[4] ?? "",
        currentRow[5] ?? "",
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


/*
|--------------------------------------------------------------------------
| Permanently Delete Member
|--------------------------------------------------------------------------
*/

export async function deleteMemberPermanently(
  memberId: string
): Promise<{
  success: boolean;
  code: string;
  deleted?: {
    members: number;
    collections: number;
    pendingDeposits: number;
  };
}> {
  const cleanMemberId =
    normalizeMemberId(memberId);

  if (!cleanMemberId) {
    return {
      success: false,
      code: "INVALID_MEMBER_ID",
    };
  }

  /*
   * Read all three sheets before deleting anything.
   */

  const [
    memberRows,
    collectionRows,
    pendingDepositRows,
  ] = await Promise.all([
    getSheetValues("Members!A:K"),
    getSheetValues("Collections!A:L"),
    getSheetValues("Pending Deposits!A:P"),
  ]);

  /*
   * Find exact normalized Member ID matches.
   * Members: Column A
   */

  const memberMatches = memberRows
    .slice(1)
    .map((row, index) => ({
      row,
      rowNumber: index + 2,
    }))
    .filter(
      ({ row }) =>
        normalizeMemberId(row[0]) ===
        cleanMemberId
    );

  if (memberMatches.length === 0) {
    return {
      success: false,
      code: "MEMBER_NOT_FOUND",
    };
  }

  /*
   * Never delete data if the Member ID is duplicated.
   */

  if (memberMatches.length > 1) {
    return {
      success: false,
      code: "DUPLICATE_MEMBER_ID",
    };
  }

  /*
   * Collections: Member ID is Column B.
   */

  const collectionMatches = collectionRows
    .slice(1)
    .map((row, index) => ({
      row,
      rowNumber: index + 2,
    }))
    .filter(
      ({ row }) =>
        normalizeMemberId(row[1]) ===
        cleanMemberId
    );

  /*
   * Pending Deposits: Member ID is Column B.
   */

  const pendingDepositMatches =
    pendingDepositRows
      .slice(1)
      .map((row, index) => ({
        row,
        rowNumber: index + 2,
      }))
      .filter(
        ({ row }) =>
          normalizeMemberId(row[1]) ===
          cleanMemberId
      );

  /*
   * Prepare all deletions.
   * The helper deletes rows bottom-to-top
   * in a single batchUpdate request.
   */

  const deletions = [
    {
      sheetName: "Members",
      rowNumber: memberMatches[0].rowNumber,
    },
    ...collectionMatches.map(
      ({ rowNumber }) => ({
        sheetName: "Collections",
        rowNumber,
      })
    ),
    ...pendingDepositMatches.map(
      ({ rowNumber }) => ({
        sheetName: "Pending Deposits",
        rowNumber,
      })
    ),
  ];

  await deleteSheetRows(deletions);

  return {
    success: true,
    code: "MEMBER_DELETED",
    deleted: {
      members: memberMatches.length,
      collections: collectionMatches.length,
      pendingDeposits:
        pendingDepositMatches.length,
    },
  };
}
