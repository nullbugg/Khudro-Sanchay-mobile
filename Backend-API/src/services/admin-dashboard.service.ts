
import {
  getSheetValues,
} from "../config/google-sheets";

/*
|--------------------------------------------------------------------------
| Admin Dashboard Data
|--------------------------------------------------------------------------
*/

export interface AdminDashboardData {
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
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function parseNumber(value: unknown): number {
  const number = Number(
    String(value ?? "")
      .replace(/,/g, "")
      .trim()
  );

  return Number.isFinite(number) ? number : 0;
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

/*
|--------------------------------------------------------------------------
| Get Admin Dashboard Data
|--------------------------------------------------------------------------
*/

export async function getAdminDashboardData(): Promise<AdminDashboardData> {

  /*
  |--------------------------------------------------------------------------
  | 1. Members
  |--------------------------------------------------------------------------
  */

  const memberRows = await getSheetValues("Members!A:J");

  const memberData =
    memberRows.length > 1
      ? memberRows.slice(1)
      : [];

  const activeMembers = memberData.filter(
    (row) => normalize(row[7]) === "ACTIVE"
  );

  const totalMembers = activeMembers.length;

  const totalShares = activeMembers.reduce(
    (total, row) => total + parseNumber(row[4]),
    0
  );

  /*
  |--------------------------------------------------------------------------
  | 2. Weekly Cycle
  |--------------------------------------------------------------------------
  */

  const FIRST_WEEK_DATE = new Date(
    "2026-04-24T00:00:00+06:00"
  );

  const now = new Date();

  const dhakaDateString = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(now);

  const [year, month, day] = dhakaDateString
    .split("-")
    .map(Number);

  const today = new Date(
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+06:00`
  );

  const differenceInMilliseconds =
    today.getTime() - FIRST_WEEK_DATE.getTime();

  const differenceInDays = Math.floor(
    differenceInMilliseconds / (1000 * 60 * 60 * 24)
  );

  const currentWeek =
    differenceInDays < 0
      ? 1
      : Math.floor(differenceInDays / 7) + 1;

  const nextWeek = currentWeek + 1;

  const currentWeekDateObject = new Date(
    FIRST_WEEK_DATE
  );

  currentWeekDateObject.setDate(
    currentWeekDateObject.getDate() +
    (currentWeek - 1) * 7
  );

  const nextWeekDateObject = new Date(
    currentWeekDateObject
  );

  nextWeekDateObject.setDate(
    nextWeekDateObject.getDate() + 7
  );

  function formatWeekDate(date: Date): string {
    return new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone: "Asia/Dhaka",
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    ).format(date);
  }

  const currentWeekDate = formatWeekDate(
    currentWeekDateObject
  );

  const nextWeekDate = formatWeekDate(
    nextWeekDateObject
  );

  /*
  |--------------------------------------------------------------------------
  | 3. Read Collections, Share History & Withdrawal History
  |--------------------------------------------------------------------------
  */

  const [
    collectionRows,
    shareHistoryRows,
    withdrawalRows,
  ] = await Promise.all([
    getSheetValues("Collections!A:L"),
    getSheetValues("'Share History'!A:N"),
    getSheetValues("'Withdrawal History'!A:I"),
  ]);

  const collectionData =
    collectionRows.length > 1
      ? collectionRows.slice(1)
      : [];

  const shareHistoryData =
    shareHistoryRows.length > 1
      ? shareHistoryRows.slice(1)
      : [];

  const withdrawalData =
    withdrawalRows.length > 1
      ? withdrawalRows.slice(1)
      : [];

  /*
  |--------------------------------------------------------------------------
  | 4. Parse Collection Week
  |--------------------------------------------------------------------------
  */

  function getCollectionWeekNumber(
    value: unknown
  ): number {
    const text = String(value ?? "").trim();

    if (!text) return 0;

    const match = text.match(/(\d+)/);

    if (!match) return 0;

    const weekNumber = Number(match[1]);

    return Number.isInteger(weekNumber) &&
      weekNumber > 0
      ? weekNumber
      : 0;
  }

  const paidCollections = collectionData.filter(
    (row) => normalize(row[8]) === "PAID"
  );

  /*
  |--------------------------------------------------------------------------
  | 5. Share Increase Deposits
  |--------------------------------------------------------------------------
  |
  | Share History:
  | C = Previous Share Count
  | D = New Share Count
  | K = New Deposit Required
  |
  | Only Share Increase records are counted.
  | J (Advance Applied) is NOT counted again.
  |
  */

  const additionalShareDeposits =
    shareHistoryData.reduce(
      (total, row) => {
        const previousShares = parseNumber(row[2]);
        const newShares = parseNumber(row[3]);

        const newDepositRequired = Math.max(
          0,
          parseNumber(row[10])
        );

        if (newShares > previousShares) {
          return total + newDepositRequired;
        }

        return total;
      },
      0
    );

  /*
  |--------------------------------------------------------------------------
  | 6. Withdrawal / Refund Allocation
  |--------------------------------------------------------------------------
  |
  | Withdrawal History:
  | B = Member ID
  | D = Refund Amount
  | F = Withdrawal Week
  | I = Notes
  |
  | Refund is mapped by Member ID + Week.
  | This prevents one member's refund from
  | affecting another member's calculation.
  |
  */

  const refundByMemberWeek = new Map<string, number>();

  const untrackedRefundByMemberWeek =
    new Map<string, number>();

  let totalWithdrawn = 0;

  for (const row of withdrawalData) {
    const memberId = normalize(row[1]);

    const refundAmount = parseNumber(row[3]);

    if (!memberId || refundAmount <= 0) {
      continue;
    }

    totalWithdrawn += refundAmount;

    const notes = String(row[8] || "").trim();

    const withdrawalWeek =
      parseNumber(row[5]) || currentWeek;

    let mappedAmount = 0;

    const mappedRefunds = new Map<number, number>();

    // Old detailed format:
    // SHARE_DECREASE_REFUND|WEEKLY=1:50,2:50

    const detailedMatch = notes.match(
      /WEEKLY=([0-9:,]+)/i
    );

    if (detailedMatch) {
      const entries = detailedMatch[1].split(",");

      for (const entry of entries) {
        const [weekText, amountText] =
          entry.split(":");

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

          for (
            let week = startWeek;
            week <= endWeek;
            week++
          ) {
            mappedRefunds.set(week, perWeek);
          }

          mappedAmount = amount;
        }
      }
    }

    // Valid mapped refund
    if (
      mappedAmount > 0 &&
      Math.abs(mappedAmount - refundAmount) < 0.01
    ) {
      for (const [week, amount] of mappedRefunds) {
        const key = `${memberId}::${week}`;

        refundByMemberWeek.set(
          key,
          (refundByMemberWeek.get(key) || 0) + amount
        );
      }
    } else {
      // Untracked refund
      const key = `${memberId}::${withdrawalWeek}`;

      untrackedRefundByMemberWeek.set(
        key,
        (untrackedRefundByMemberWeek.get(key) || 0) +
        refundAmount
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | 7. Calculate Weekly Refund
  |--------------------------------------------------------------------------
  */

  let weeklyRefund = 0;

  for (const [key, amount] of refundByMemberWeek) {
    const week = Number(key.split("::")[1]);

    if (week <= currentWeek) {
      weeklyRefund += amount;
    }
  }

  for (
    const [key, amount] of untrackedRefundByMemberWeek
  ) {
    const week = Number(key.split("::")[1]);

    if (week <= currentWeek) {
      weeklyRefund += amount;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | 8. Calculate Advance Refund
  |--------------------------------------------------------------------------
  */

  const advanceRefund = Math.max(
    0,
    totalWithdrawn - weeklyRefund
  );

  /*
  |--------------------------------------------------------------------------
  | 9. Total Collection Deposit
  |--------------------------------------------------------------------------
  */

  const totalCollectionDeposit =
    paidCollections.reduce(
      (total, row) =>
        total + parseNumber(row[7]),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | 10. Weekly Deposit
  |--------------------------------------------------------------------------
  |
  | Paid Weekly Collections
  | + Share Increase Deposits
  | - Weekly Refund
  |
  */

  const weeklyCollectionsUpToCurrentWeek =
    paidCollections.filter((row) => {
      const weekNumber =
        getCollectionWeekNumber(row[3]);

      return (
        weekNumber >= 1 &&
        weekNumber <= currentWeek
      );
    });

  const totalWeeklyDeposit =
    weeklyCollectionsUpToCurrentWeek.reduce(
      (total, row) =>
        total + parseNumber(row[7]),
      0
    ) +
    additionalShareDeposits -
    weeklyRefund;

  /*
  |--------------------------------------------------------------------------
  | 11. Current Week Deposit
  |--------------------------------------------------------------------------
  */

  const weeklyCollectionRows =
    paidCollections.filter(
      (row) =>
        getCollectionWeekNumber(row[3]) === currentWeek
    );

  const currentWeekPaidAmount =
    weeklyCollectionRows.reduce(
      (total, row) =>
        total + parseNumber(row[7]),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | 12. Total Advance
  |--------------------------------------------------------------------------
  |
  | Future Week Collections
  | - Advance Refund
  |
  */

  const advanceCollectionRows =
    paidCollections.filter(
      (row) =>
        getCollectionWeekNumber(row[3]) > currentWeek
    );

  const totalAdvance =
    advanceCollectionRows.reduce(
      (total, row) =>
        total + parseNumber(row[7]),
      0
    ) - advanceRefund;

  /*
  |--------------------------------------------------------------------------
  | 13. Final Total Deposit
  |--------------------------------------------------------------------------
  |
  | Paid Collections
  | + Share Increase Deposits
  | - All Withdrawals / Refunds
  |
  */

  const totalDeposit =
    totalCollectionDeposit +
    additionalShareDeposits -
    totalWithdrawn;

  /*
  |--------------------------------------------------------------------------
  | 14. Debug Logs
  |--------------------------------------------------------------------------
  */

  console.log("ADMIN DASHBOARD FINANCIAL SUMMARY:", {
    currentWeek,
    totalCollectionDeposit,
    additionalShareDeposits,
    totalWithdrawn,
    weeklyRefund,
    advanceRefund,
    totalWeeklyDeposit,
    totalAdvance,
    totalDeposit,
  });

  /*
  |--------------------------------------------------------------------------
  | 15. Return
  |--------------------------------------------------------------------------
  */

  return {
    totalDeposit,
    totalWeeklyDeposit,
    totalAdvance,
    totalMembers,
    totalShares,
    weeklyDepositAmount: currentWeekPaidAmount,
    currentWeek,
    currentWeekDate,
    nextWeek,
    nextWeekDate,
  };
}
