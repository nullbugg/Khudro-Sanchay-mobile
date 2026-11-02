import {
  getSheetValues,
  appendSheetRow,
  updateSheetValues,
  deleteSheetRow,
} from "../config/google-sheets";



const SHARE_PRICE = 50;
const MAX_SHARE_COUNT = 15;
const WEEK_ONE_START = "2026-04-24";

interface ServiceResult {
  success: boolean;
  statusCode?: number;
  message: string;
  [key: string]: any;
}

interface MemberData {
  rowNumber: number;
  memberId: string;
  memberName: string;
  joinDate: string;
  shareCount: number;
  weeklyAmount: number;
  row: string[];
}

interface ShareHistory {
  historyId: string;
  previousShareCount: number;
  newShareCount: number;
  changeWeek: number;
  effectiveWeek: number;
}

interface CollectionTotals {
  totalPaid: number;
  totalWithdrawn: number;
}

interface RefundCalculation {
  refundAmount: number;
  paidWeekCount: number;
  refundByWeek: Map<number, number>;
  untrackedPreviousRefund: number;
}

function getDhakaDate(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getDhakaTimestamp(): string {
  return new Date().toLocaleString("sv-SE", {
    timeZone: "Asia/Dhaka",
  });
}

function parseDate(value: string): Date | null {
  if (!value) return null;

  const normalized = String(value).trim();

  const dmy = normalized.match(/^(\d{2})-(\d{2})-(\d{4})$/);

  if (dmy) {
    return new Date(
      Number(dmy[3]),
      Number(dmy[2]) - 1,
      Number(dmy[1])
    );
  }

  const ymd = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (ymd) {
    return new Date(
      Number(ymd[1]),
      Number(ymd[2]) - 1,
      Number(ymd[3])
    );
  }

  return null;
}

function getWeekNumber(dateValue: string): number {
  const date = parseDate(dateValue);
  const startDate = parseDate(WEEK_ONE_START);

  if (!date || !startDate) return 1;

  const difference = date.getTime() - startDate.getTime();
  const days = Math.floor(
    difference / (1000 * 60 * 60 * 24)
  );

  return Math.max(1, Math.floor(days / 7) + 1);
}

function getCurrentWeek(): number {
  return getWeekNumber(getDhakaDate());
}

function toNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeMemberId(value: string): string {
  return String(value ?? "").trim().toUpperCase();
}

function isValidShareCount(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= 1 &&
    value <= MAX_SHARE_COUNT
  );
}

async function getNextHistoryId(): Promise<string> {
  const rows = await getSheetValues("'Share History'!A:A");

  let maxId = 0;

  for (const row of rows.slice(1)) {
    const historyId = String(row[0] ?? "").trim();
    const match = historyId.match(/^SHR-(\d+)$/);

    if (match) {
      const numericId = Number(match[1]);

      if (Number.isSafeInteger(numericId)) {
        maxId = Math.max(maxId, numericId);
      }
    }
  }

  const nextId = maxId + 1;

  if (!Number.isSafeInteger(nextId)) {
    throw new Error("Share History ID limit exceeded");
  }

  return `SHR-${String(nextId).padStart(7, "0")}`;
}

/**
 * Generates sequential Withdrawal IDs:
 * WDR-0000001
 * WDR-0000002
 * WDR-0000003
 */
async function getNextWithdrawalId(): Promise<string> {
  const rows = await getSheetValues("'Withdrawal History'!A:A");

  let maxId = 0;

  for (const row of rows.slice(1)) {
    const withdrawalId = String(row[0] ?? "").trim();
    const match = withdrawalId.match(/^WDR-(\d+)$/);

    if (match) {
      const numericId = Number(match[1]);

      if (Number.isSafeInteger(numericId)) {
        maxId = Math.max(maxId, numericId);
      }
    }
  }

  const nextId = maxId + 1;

  if (!Number.isSafeInteger(nextId)) {
    throw new Error("Withdrawal ID limit exceeded");
  }

  return `WDR-${String(nextId).padStart(7, "0")}`;
}

async function findMember(
  memberId: string
): Promise<MemberData | null> {
  const rows = await getSheetValues("Members!A:K");
  const normalizedId = normalizeMemberId(memberId);

  for (let index = 1; index < rows.length; index++) {
    const row = rows[index];

    if (
      normalizeMemberId(String(row[0] ?? "")) === normalizedId
    ) {
      return {
        rowNumber: index + 1,
        memberId: String(row[0] ?? ""),
        memberName: String(row[1] ?? ""),
        joinDate: String(row[3] ?? ""),
        shareCount: toNumber(row[4]),
        weeklyAmount: toNumber(row[5]),
        row,
      };
    }
  }

  return null;
}

async function getShareHistory(
  memberId: string
): Promise<ShareHistory[]> {
  const rows = await getSheetValues("'Share History'!A:N");
  const normalizedId = normalizeMemberId(memberId);

  return rows
    .slice(1)
    .filter(
      (row) =>
        normalizeMemberId(String(row[1] ?? "")) === normalizedId
    )
    .map((row) => ({
      historyId: String(row[0] ?? ""),
      previousShareCount: toNumber(row[2]),
      newShareCount: toNumber(row[3]),
      changeWeek: toNumber(row[6]),
      effectiveWeek: toNumber(row[7]),
    }))
    .filter((item) => item.effectiveWeek > 0)
    .sort((a, b) => a.effectiveWeek - b.effectiveWeek);
}

async function getCollectionTotals(
  memberId: string
): Promise<CollectionTotals> {
  const [collectionRows, withdrawalRows] = await Promise.all([
    getSheetValues("Collections!A:L"),
    getSheetValues("'Withdrawal History'!A:I"),
  ]);

  const normalizedId = normalizeMemberId(memberId);

  let totalPaid = 0;
  let totalWithdrawn = 0;

  for (const row of collectionRows.slice(1)) {
    if (
      normalizeMemberId(String(row[1] ?? "")) !== normalizedId
    ) {
      continue;
    }

    const paidAmount = toNumber(row[7]);

    if (paidAmount > 0) {
      totalPaid += paidAmount;
    }
  }

  for (const row of withdrawalRows.slice(1)) {
    if (
      normalizeMemberId(String(row[1] ?? "")) !== normalizedId
    ) {
      continue;
    }

    const withdrawalAmount = toNumber(row[3]);

    if (withdrawalAmount > 0) {
      totalWithdrawn += withdrawalAmount;
    }
  }

  return {
    totalPaid,
    totalWithdrawn,
  };
}

/**
 * Reads previous refund records.
 *
 * Supports old format:
 * SHARE_DECREASE_REFUND|WEEKLY=1:50,2:50
 *
 * Supports new format:
 * SHARE DECREASE! REFUND WEEK (01 - 28) = 1400
 *
 * New format can only be safely reconstructed when
 * the total is evenly distributed across the week range.
 */

async function getPaidWeekRefund(
  memberId: string,
  oldShareCount: number,
  newShareCount: number,
  _currentWeek: number
): Promise<RefundCalculation> {
  const [
    collectionRows,
    withdrawalRows,
    shareHistoryRows,
  ] = await Promise.all([
    getSheetValues("Collections!A:L"),
    getSheetValues("'Withdrawal History'!A:I"),
    getSheetValues("'Share History'!A:N"),
  ]);

  const normalizedId = normalizeMemberId(memberId);

  // Total paid amount for each week.
  const weeklyPayments = new Map<number, number>();

  // Previously refunded amount for each week.
  const previousRefunds = new Map<number, number>();

  let untrackedPreviousRefund = 0;

  // --------------------------------------------------
  // 1. Collect all Collections payments.
  // Include future-week advance payments.
  // --------------------------------------------------

  for (const row of collectionRows.slice(1)) {
    if (
      normalizeMemberId(String(row[1] ?? "")) !== normalizedId
    ) {
      continue;
    }

    const weekText = String(row[3] ?? "").trim();
    const weekMatch = weekText.match(/\d+/);

    if (!weekMatch) continue;

    const week = Number(weekMatch[0]);
    const paidAmount = toNumber(row[7]);

    if (
      !Number.isInteger(week) ||
      week < 1 ||
      paidAmount <= 0
    ) {
      continue;
    }

    weeklyPayments.set(
      week,
      (weeklyPayments.get(week) ?? 0) + paidAmount
    );
  }

  // --------------------------------------------------
  // 2. Add cash deposited during Share Increase.
  //
  // Column K = New Deposit Required.
  // Column J = Advance Applied.
  //
  // Advance Applied is NOT added again because
  // that money is already counted in previous payments.
  // --------------------------------------------------

  for (const row of shareHistoryRows.slice(1)) {
    if (
      normalizeMemberId(String(row[1] ?? "")) !== normalizedId
    ) {
      continue;
    }

    const previousShares = toNumber(row[2]);
    const newShares = toNumber(row[3]);
    const changeWeek = toNumber(row[6]);

    const newDepositRequired = toNumber(row[10]);

    // Only Share Increase transactions.
    if (
      newShares <= previousShares ||
      !Number.isInteger(changeWeek) ||
      changeWeek < 1 ||
      newDepositRequired <= 0
    ) {
      continue;
    }

    const addedShares = newShares - previousShares;

    // Additional share requirement up to the change week.
    const maximumShareIncreasePayment =
      addedShares * SHARE_PRICE * changeWeek;

    // Do not treat arrears payment as additional
    // share contribution.
    const shareIncreasePaid = Math.min(
      newDepositRequired,
      maximumShareIncreasePayment
    );

    if (shareIncreasePaid <= 0) continue;

    // Distribute the recorded payment across the
    // historical weeks covered by this Share Increase.
    //
    // Example:
    // 1 added share × 50 × 28 weeks = 1400
    // Therefore, 50 is added to each week.
    //
    // Partial amounts are distributed proportionally.
    let remainingAmount = shareIncreasePaid;

    for (let week = 1; week <= changeWeek; week++) {
      if (remainingAmount <= 0.001) break;

      const remainingWeeks = changeWeek - week + 1;

      const weeklyCapacity = addedShares * SHARE_PRICE;

      const proportionalAmount =
        remainingAmount / remainingWeeks;

      const allocatedAmount = Math.min(
        weeklyCapacity,
        proportionalAmount
      );

      if (allocatedAmount <= 0) continue;

      weeklyPayments.set(
        week,
        (weeklyPayments.get(week) ?? 0) + allocatedAmount
      );

      remainingAmount -= allocatedAmount;
    }
  }

  // --------------------------------------------------
  // 3. Read previous Share Decrease refunds.
  // --------------------------------------------------

  for (const row of withdrawalRows.slice(1)) {
    if (
      normalizeMemberId(String(row[1] ?? "")) !== normalizedId
    ) {
      continue;
    }

    const amount = toNumber(row[3]);
    const notes = String(row[8] ?? "").trim();

    if (amount <= 0) continue;

    // Old detailed format:
    // SHARE_DECREASE_REFUND|WEEKLY=1:50,2:50
    if (notes.includes("SHARE_DECREASE_REFUND")) {
      const weeklyMatch = notes.match(/WEEKLY=([0-9:,]+)/);

      if (!weeklyMatch) {
        untrackedPreviousRefund += amount;
        continue;
      }

      const entries = weeklyMatch[1].split(",");

      let reconstructedAmount = 0;

      for (const entry of entries) {
        const [weekText, amountText] = entry.split(":");

        const week = Number(weekText);
        const refund = Number(amountText);

        if (
          Number.isInteger(week) &&
          week >= 1 &&
          Number.isFinite(refund) &&
          refund > 0
        ) {
          previousRefunds.set(
            week,
            (previousRefunds.get(week) ?? 0) + refund
          );

          reconstructedAmount += refund;
        }
      }

      if (Math.abs(reconstructedAmount - amount) > 0.01) {
        untrackedPreviousRefund += amount;
      }

      continue;
    }

    // Readable format:
    // SHARE DECREASE! REFUND WEEK (01 - 28) = 1400
    const newFormatMatch = notes.match(
      /^SHARE DECREASE! REFUND WEEK \((\d+)\s*-\s*(\d+)\)\s*=\s*(\d+(?:\.\d+)?)$/i
    );

    if (newFormatMatch) {
      const startWeek = Number(newFormatMatch[1]);
      const endWeek = Number(newFormatMatch[2]);
      const totalRefund = Number(newFormatMatch[3]);

      const weekCount = endWeek - startWeek + 1;

      if (
        startWeek < 1 ||
        endWeek < startWeek ||
        weekCount <= 0 ||
        !Number.isFinite(totalRefund) ||
        totalRefund <= 0 ||
        Math.abs(totalRefund - amount) > 0.01
      ) {
        untrackedPreviousRefund += amount;
        continue;
      }

      const refundPerWeek = totalRefund / weekCount;

      for (let week = startWeek; week <= endWeek; week++) {
        previousRefunds.set(
          week,
          (previousRefunds.get(week) ?? 0) + refundPerWeek
        );
      }

      continue;
    }

    // Ignore unrelated withdrawal records.
  }

  // --------------------------------------------------
  // 4. Calculate current Share Decrease refund.
  // --------------------------------------------------

  const decreasedShares = oldShareCount - newShareCount;

  const refundPerDecreasedShare =
    decreasedShares * SHARE_PRICE;

  const newWeeklyAmount = newShareCount * SHARE_PRICE;

  const refundByWeek = new Map<number, number>();

  let refundAmount = 0;
  let paidWeekCount = 0;

  for (const [week, totalPaidForWeek] of weeklyPayments.entries()) {
    const alreadyRefunded = previousRefunds.get(week) ?? 0;

    // Amount paid above the new weekly requirement.
    const excessPaidAmount = Math.max(
      0,
      totalPaidForWeek - newWeeklyAmount
    );

    // Prevent refunding the same share amount twice.
    const cumulativeRefundLimit =
      alreadyRefunded + refundPerDecreasedShare;

    const totalAllowedRefund = Math.min(
      excessPaidAmount,
      cumulativeRefundLimit
    );

    const thisRefund = Math.max(
      0,
      totalAllowedRefund - alreadyRefunded
    );

    if (thisRefund > 0) {
      refundByWeek.set(week, thisRefund);

      refundAmount += thisRefund;
      paidWeekCount++;
    }
  }

  return {
    refundAmount: Math.round(refundAmount * 100) / 100,
    paidWeekCount,
    refundByWeek,
    untrackedPreviousRefund,
  };
}


/**
 * Calculates historical expected contributions.
 * A share-count change applies from its Effective Week.
 */
function calculateHistoricalExpected(
  member: MemberData,
  history: ShareHistory[],
  currentWeek: number
): number {
  if (currentWeek < 1) return 0;

  const joinWeek = getWeekNumber(member.joinDate);
  const startWeek = Math.max(1, joinWeek);

  let shareCount = history.length
    ? history[0].previousShareCount
    : member.shareCount;

  let historyIndex = 0;
  let expectedAmount = 0;

  for (let week = startWeek; week <= currentWeek; week++) {
    while (
      historyIndex < history.length &&
      history[historyIndex].effectiveWeek <= week
    ) {
      shareCount = history[historyIndex].newShareCount;
      historyIndex++;
    }

    expectedAmount += shareCount * SHARE_PRICE;
  }

  return expectedAmount;
}

/**
 * Updates member's current share information.
 */
async function updateMemberShareInformation(
  member: MemberData,
  newShareCount: number
): Promise<void> {
  const newWeeklyAmount = newShareCount * SHARE_PRICE;
  const updatedAt = getDhakaTimestamp();

  await updateSheetValues(
    `Members!E${member.rowNumber}:F${member.rowNumber}`,
    [[String(newShareCount), String(newWeeklyAmount)]]
  );

  await updateSheetValues(
    `Members!J${member.rowNumber}`,
    [[updatedAt]]
  );
}

/**
 * Deletes an appended row during rollback.
 */
async function rollbackAppendedRow(
  sheetName: string,
  rowNumber: number
): Promise<void> {
  try {
    await deleteSheetRow(sheetName, rowNumber);
  } catch (error) {
    console.error(
      `Rollback failed for ${sheetName}:`,
      error
    );
  }
}

/**
 * SHARE INCREASE
 */
export async function increaseMemberShares(
  memberId: string,
  newShareCount: number,
  adminId: string
): Promise<ServiceResult> {
  let appendedHistoryRow = 0;

  try {
    const normalizedId = normalizeMemberId(memberId);

    if (!normalizedId) {
      return {
        success: false,
        statusCode: 400,
        message: "সদস্য আইডি দিতে হবে",
      };
    }

    if (!isValidShareCount(newShareCount)) {
      return {
        success: false,
        statusCode: 400,
        message: "Share Count ১ থেকে ১৫-এর মধ্যে পূর্ণসংখ্যা হতে হবে",
      };
    }

    const member = await findMember(normalizedId);

    if (!member) {
      return {
        success: false,
        statusCode: 404,
        message: "সদস্য খুঁজে পাওয়া যায়নি",
      };
    }

    if (
      String(member.row[7] ?? "").trim().toUpperCase() !== "ACTIVE"
    ) {
      return {
        success: false,
        statusCode: 400,
        message: "Inactive সদস্যের Share পরিবর্তন করা যাবে না",
      };
    }

    const oldShareCount = member.shareCount;

    if (newShareCount <= oldShareCount) {
      return {
        success: false,
        statusCode: 400,
        message: "নতুন Share Count বর্তমান Share Count-এর চেয়ে বেশি হতে হবে",
      };
    }

    const currentWeek = getCurrentWeek();

    const [history, collectionTotals] = await Promise.all([
      getShareHistory(normalizedId),
      getCollectionTotals(normalizedId),
    ]);

    const oldExpectedAmount = calculateHistoricalExpected(
      member,
      history,
      currentWeek
    );

    const totalPaid = collectionTotals.totalPaid;

    const arrears = Math.max(
      0,
      oldExpectedAmount - totalPaid
    );

    const availableAdvance = Math.max(
      0,
      totalPaid -
        oldExpectedAmount -
        collectionTotals.totalWithdrawn
    );

    const addedShares = newShareCount - oldShareCount;

    const newShareRequirement =
      addedShares * currentWeek * SHARE_PRICE;

    const additionalRequirement =
      arrears + newShareRequirement;

    const advanceApplied = Math.min(
      availableAdvance,
      additionalRequirement
    );

    const newDepositRequired = Math.max(
      0,
      additionalRequirement - advanceApplied
    );

    const newHistoryId = await getNextHistoryId();
    const newWeeklyAmount = newShareCount * SHARE_PRICE;
    const timestamp = getDhakaTimestamp();

    const historyRow = [
      newHistoryId,
      member.memberId,
      String(oldShareCount),
      String(newShareCount),
      String(member.weeklyAmount),
      String(newWeeklyAmount),
      String(currentWeek),
      String(currentWeek + 1),
      String(additionalRequirement),
      String(advanceApplied),
      String(newDepositRequired),
      adminId,
      timestamp,
      "",
    ];

    await appendSheetRow("'Share History'!A:N", historyRow);

    const historyRows = await getSheetValues("'Share History'!A:N");
    appendedHistoryRow = historyRows.length;

    try {
      await updateMemberShareInformation(
        member,
        newShareCount
      );
    } catch (updateError) {
      await rollbackAppendedRow(
        "Share History",
        appendedHistoryRow
      );

      throw updateError;
    }

    return {
      success: true,
      message: "Share Increase সফল হয়েছে",
      data: {
        memberId: member.memberId,
        previousShareCount: oldShareCount,
        newShareCount,
        previousWeeklyAmount: member.weeklyAmount,
        newWeeklyAmount,
        currentWeek,
        effectiveWeek: currentWeek + 1,
        oldExpectedAmount,
        totalPaid,
        arrears,
        newShareRequirement,
        additionalRequirement,
        advanceAvailable: availableAdvance,
        advanceApplied,
        newDepositRequired,
      },
    };
  } catch (error) {
    console.error("increaseMemberShares error:", error);

    return {
      success: false,
      statusCode: 500,
      message: "Share Increase সম্পন্ন করা যায়নি",
    };
  }
}

/**
 * SHARE DECREASE
 *
 * Refund is calculated from actual weekly payments.
 * The new share count becomes effective next week.
 */
export async function decreaseMemberShares(
  memberId: string,
  newShareCount: number,
  adminId: string
): Promise<ServiceResult> {
  let historyRowNumber = 0;
  let withdrawalRowNumber = 0;

  try {
    const normalizedId = normalizeMemberId(memberId);

    if (!normalizedId) {
      return {
        success: false,
        statusCode: 400,
        message: "সদস্য আইডি দিতে হবে",
      };
    }

    if (!isValidShareCount(newShareCount)) {
      return {
        success: false,
        statusCode: 400,
        message: "Share Count ১ থেকে ১৫-এর মধ্যে পূর্ণসংখ্যা হতে হবে",
      };
    }

    const member = await findMember(normalizedId);

    if (!member) {
      return {
        success: false,
        statusCode: 404,
        message: "সদস্য খুঁজে পাওয়া যায়নি",
      };
    }

    if (
      String(member.row[7] ?? "").trim().toUpperCase() !== "ACTIVE"
    ) {
      return {
        success: false,
        statusCode: 400,
        message: "Inactive সদস্যের Share পরিবর্তন করা যাবে না",
      };
    }

    const oldShareCount = member.shareCount;

    if (newShareCount >= oldShareCount) {
      return {
        success: false,
        statusCode: 400,
        message: "নতুন Share Count বর্তমান Share Count-এর চেয়ে কম হতে হবে",
      };
    }

    const currentWeek = getCurrentWeek();

    const [history, collectionTotals] = await Promise.all([
      getShareHistory(normalizedId),
      getCollectionTotals(normalizedId),
    ]);

    const expectedAmount = calculateHistoricalExpected(
      member,
      history,
      currentWeek
    );

    const totalPaid = collectionTotals.totalPaid;

    const arrears = Math.max(
      0,
      expectedAmount - totalPaid
    );

    const availableAdvance = Math.max(
      0,
      totalPaid -
        expectedAmount -
        collectionTotals.totalWithdrawn
    );

    if (arrears > 0) {
      return {
        success: false,
        statusCode: 400,
        message: `Share Decrease করা যাবে না। সদস্যের বকেয়া ৳${arrears} রয়েছে`,
        data: {
          arrears,
          expectedAmount,
          totalPaid,
          currentWeek,
        },
      };
    }

    const decreasedShares = oldShareCount - newShareCount;

    const refundCalculation = await getPaidWeekRefund(
      normalizedId,
      oldShareCount,
      newShareCount,
      currentWeek
    );

    if (refundCalculation.untrackedPreviousRefund > 0) {
      return {
        success: false,
        statusCode: 400,
        message:
          "আগের Share Decrease Refund-এর week-wise তথ্য নির্ভরযোগ্যভাবে হিসাব করা যাচ্ছে না। আগে Withdrawal History যাচাই করতে হবে।",
        data: {
          untrackedPreviousRefund:
            refundCalculation.untrackedPreviousRefund,
        },
      };
    }

    const refundAmount = refundCalculation.refundAmount;
    const paidWeekCount = refundCalculation.paidWeekCount;

    const newWeeklyAmount = newShareCount * SHARE_PRICE;
    const newHistoryId = await getNextHistoryId();
    const timestamp = getDhakaTimestamp();

    // Generate sequential Withdrawal ID.
    const withdrawalId =
      refundAmount > 0
        ? await getNextWithdrawalId()
        : "";

    const refundEntries = Array.from(
      refundCalculation.refundByWeek.entries()
    ).sort((a, b) => a[0] - b[0]);

    let withdrawalNotes = "SHARE DECREASE! REFUND";

    if (refundEntries.length > 0) {
      const firstWeek = refundEntries[0][0];
      const lastWeek = refundEntries[refundEntries.length - 1][0];

      const isContinuous = refundEntries.every(
        ([week], index) =>
          week === firstWeek + index
      );

      const firstAmount = refundEntries[0][1];

      const isEqualAmount = refundEntries.every(
        ([, amount]) => amount === firstAmount
      );

      // Use readable format only when it can be reconstructed
      // accurately in future refund calculations.
      if (isContinuous && isEqualAmount) {
        withdrawalNotes =
          `SHARE DECREASE! REFUND WEEK ` +
          `(${String(firstWeek).padStart(2, "0")} - ` +
          `${String(lastWeek).padStart(2, "0")}) = ${refundAmount}`;
      } else {
        // Preserve exact week-wise data for non-uniform refunds.
        const weeklyDetails = refundEntries
          .map(([week, amount]) => `${week}:${amount}`)
          .join(",");

        withdrawalNotes =
          `SHARE_DECREASE_REFUND|WEEKLY=${weeklyDetails}`;
      }
    }

    const historyRow = [
      newHistoryId,
      member.memberId,
      String(oldShareCount),
      String(newShareCount),
      String(member.weeklyAmount),
      String(newWeeklyAmount),
      String(currentWeek),
      String(currentWeek + 1),
      "0",
      "0",
      "0",
      adminId,
      timestamp,
      withdrawalId,
    ];

    const withdrawalRow = [
      withdrawalId,
      member.memberId,
      member.memberName,
      String(refundAmount),
      newHistoryId,
      String(currentWeek),
      timestamp,
      adminId,
      withdrawalNotes,
    ];

    // Save share history first.
    await appendSheetRow("'Share History'!A:N", historyRow);

    const historyRows = await getSheetValues("'Share History'!A:N");
    historyRowNumber = historyRows.length;

    try {
      // Save withdrawal record only when refund is due.
      if (refundAmount > 0) {
        await appendSheetRow(
          "'Withdrawal History'!A:I",
          withdrawalRow
        );

        const withdrawalRows = await getSheetValues(
          "'Withdrawal History'!A:I"
        );

        withdrawalRowNumber = withdrawalRows.length;
      }

      // Update member after history and refund records are saved.
      await updateMemberShareInformation(
        member,
        newShareCount
      );
    } catch (operationError) {
      if (withdrawalRowNumber > 0) {
        await rollbackAppendedRow(
          "Withdrawal History",
          withdrawalRowNumber
        );
      }

      if (historyRowNumber > 0) {
        await rollbackAppendedRow(
          "Share History",
          historyRowNumber
        );
      }

      throw operationError;
    }

    return {
      success: true,
      message:
        refundAmount > 0
          ? "Share Decrease এবং Refund রেকর্ড সফল হয়েছে"
          : "Share Decrease সফল হয়েছে। Refund পাওনা নেই।",
      data: {
        memberId: member.memberId,
        previousShareCount: oldShareCount,
        newShareCount,
        decreasedShares,
        previousWeeklyAmount: member.weeklyAmount,
        newWeeklyAmount,
        currentWeek,
        effectiveWeek: currentWeek + 1,
        refundAmount,
        paidWeekCount,
        withdrawalId: withdrawalId || null,
        historyId: newHistoryId,
        expectedAmount,
        totalPaid,
        arrears,
        availableAdvance,
        refundByWeek: Object.fromEntries(
          refundCalculation.refundByWeek
        ),
        withdrawalNotes:
          refundAmount > 0 ? withdrawalNotes : null,
      },
    };
  } catch (error) {
    console.error("decreaseMemberShares error:", error);

    return {
      success: false,
      statusCode: 500,
      message: "Share Decrease সম্পন্ন করা যায়নি",
    };
  }
}



/**
 * READ-ONLY SHARE CHANGE PREVIEW
 *
 * Calculates share increase/decrease without modifying Google Sheets.
 */
export async function previewMemberShareChange(
  memberId: string,
  newShareCount: number
): Promise<ServiceResult> {
  try {
    const normalizedId = normalizeMemberId(memberId);

    if (!normalizedId) {
      return {
        success: false,
        statusCode: 400,
        message: "সদস্য আইডি দিতে হবে",
      };
    }

    if (!isValidShareCount(newShareCount)) {
      return {
        success: false,
        statusCode: 400,
        message: "Share Count ১ থেকে ১৫-এর মধ্যে পূর্ণসংখ্যা হতে হবে",
      };
    }

    const member = await findMember(normalizedId);

    if (!member) {
      return {
        success: false,
        statusCode: 404,
        message: "সদস্য খুঁজে পাওয়া যায়নি",
      };
    }

    if (
      String(member.row[7] ?? "").trim().toUpperCase() !== "ACTIVE"
    ) {
      return {
        success: false,
        statusCode: 400,
        message: "Inactive সদস্যের Share পরিবর্তন করা যাবে না",
      };
    }

    const oldShareCount = member.shareCount;
    const newWeeklyAmount = newShareCount * SHARE_PRICE;
    const currentWeek = getCurrentWeek();

    if (newShareCount === oldShareCount) {
      return {
        success: true,
        message: "Share Count পরিবর্তন করা হয়নি",
        data: {
          changeType: "NONE",
          currentShareCount: oldShareCount,
          newShareCount,
          newWeeklyAmount,
          currentWeek,
          effectiveWeek: currentWeek + 1,
          additionalDepositAmount: 0,
          refundAmount: 0,
        },
      };
    }

    const [history, collectionTotals] = await Promise.all([
      getShareHistory(normalizedId),
      getCollectionTotals(normalizedId),
    ]);

    const expectedAmount = calculateHistoricalExpected(
      member,
      history,
      currentWeek
    );

    const totalPaid = collectionTotals.totalPaid;

    const arrears = Math.max(
      0,
      expectedAmount - totalPaid
    );

    const availableAdvance = Math.max(
      0,
      totalPaid -
        expectedAmount -
        collectionTotals.totalWithdrawn
    );

    // SHARE INCREASE PREVIEW
    if (newShareCount > oldShareCount) {
      const addedShares = newShareCount - oldShareCount;

      const newShareRequirement =
        addedShares * currentWeek * SHARE_PRICE;

      const additionalRequirement =
        arrears + newShareRequirement;

      const advanceApplied = Math.min(
        availableAdvance,
        additionalRequirement
      );

      const additionalDepositAmount = Math.max(
        0,
        additionalRequirement - advanceApplied
      );

      return {
        success: true,
        message: "Share Increase Preview সফল হয়েছে",
        data: {
          changeType: "INCREASE",
          currentShareCount: oldShareCount,
          newShareCount,
          previousWeeklyAmount: member.weeklyAmount,
          newWeeklyAmount,
          currentWeek,
          effectiveWeek: currentWeek + 1,
          expectedAmount,
          totalPaid,
          arrears,
          newShareRequirement,
          additionalRequirement,
          availableAdvance,
          advanceApplied,
          additionalDepositAmount,
          refundAmount: 0,
        },
      };
    }

    // SHARE DECREASE PREVIEW
    if (arrears > 0) {
      return {
        success: false,
        statusCode: 400,
        message:
          `Share Decrease করা যাবে না। সদস্যের বকেয়া ৳${arrears} রয়েছে`,
        data: {
          changeType: "DECREASE",
          currentShareCount: oldShareCount,
          newShareCount,
          newWeeklyAmount,
          currentWeek,
          expectedAmount,
          totalPaid,
          arrears,
          availableAdvance,
          refundAmount: 0,
        },
      };
    }

    const refundCalculation = await getPaidWeekRefund(
      normalizedId,
      oldShareCount,
      newShareCount,
      currentWeek
    );

    if (refundCalculation.untrackedPreviousRefund > 0) {
      return {
        success: false,
        statusCode: 400,
        message:
          "আগের Share Decrease Refund-এর week-wise তথ্য নির্ভরযোগ্যভাবে হিসাব করা যাচ্ছে না। আগে Withdrawal History যাচাই করতে হবে।",
        data: {
          changeType: "DECREASE",
          untrackedPreviousRefund:
            refundCalculation.untrackedPreviousRefund,
          refundAmount: 0,
        },
      };
    }

    return {
      success: true,
      message: "Share Decrease Preview সফল হয়েছে",
      data: {
        changeType: "DECREASE",
        currentShareCount: oldShareCount,
        newShareCount,
        previousWeeklyAmount: member.weeklyAmount,
        newWeeklyAmount,
        currentWeek,
        effectiveWeek: currentWeek + 1,
        expectedAmount,
        totalPaid,
        arrears,
        availableAdvance,
        refundAmount: refundCalculation.refundAmount,
        paidWeekCount: refundCalculation.paidWeekCount,
        refundByWeek: Object.fromEntries(
          refundCalculation.refundByWeek
        ),
      },
    };
  } catch (error) {
    console.error("previewMemberShareChange error:", error);

    return {
      success: false,
      statusCode: 500,
      message: "Share Change Preview তৈরি করা যায়নি",
    };
  }
}

/**
 * READ-ONLY ADMIN SHARE CHANGE HISTORY
 *
 * Returns Share History and Withdrawal History
 * for a specific member.
 *
 * Share History:
 * A = History ID
 * B = Member ID
 * C = Previous Share Count
 * D = New Share Count
 * E = Previous Weekly Amount
 * F = New Weekly Amount
 * G = Change Week
 * H = Effective Week
 * I = Additional Requirement
 * J = Advance Applied
 * K = New Deposit Required
 * L = Admin ID
 * M = Date
 * N = Withdrawal ID
 *
 * Withdrawal History:
 * A = Withdrawal ID
 * B = Member ID
 * C = Member Name
 * D = Refund Amount
 * E = History ID
 * F = Week
 * G = Date
 * H = Admin ID
 * I = Notes
 */
export async function getAdminShareHistory(
  memberId: string
): Promise<ServiceResult> {
  try {
    const normalizedId = normalizeMemberId(memberId);

    if (!normalizedId) {
      return {
        success: false,
        statusCode: 400,
        message: "সদস্য আইডি দিতে হবে",
      };
    }

    const [shareRows, withdrawalRows] = await Promise.all([
      getSheetValues("'Share History'!A:N"),
      getSheetValues("'Withdrawal History'!A:I"),
    ]);

    const shareHistory = shareRows
      .slice(1)
      .filter(
        (row) =>
          normalizeMemberId(String(row[1] ?? "")) === normalizedId
      )
      .map((row) => ({
        historyId: String(row[0] ?? "").trim(),
        memberId: String(row[1] ?? "").trim(),
        previousShareCount: toNumber(row[2]),
        newShareCount: toNumber(row[3]),
        previousWeeklyAmount: toNumber(row[4]),
        newWeeklyAmount: toNumber(row[5]),
        changeWeek: toNumber(row[6]),
        effectiveWeek: toNumber(row[7]),
        additionalRequirement: toNumber(row[8]),
        advanceApplied: toNumber(row[9]),
        newDepositRequired: toNumber(row[10]),
        adminId: String(row[11] ?? "").trim(),
        date: String(row[12] ?? "").trim(),
        withdrawalId: String(row[13] ?? "").trim(),
      }))
      .reverse();

    const withdrawalHistory = withdrawalRows
      .slice(1)
      .filter(
        (row) =>
          normalizeMemberId(String(row[1] ?? "")) === normalizedId
      )
      .map((row) => ({
        withdrawalId: String(row[0] ?? "").trim(),
        memberId: String(row[1] ?? "").trim(),
        memberName: String(row[2] ?? "").trim(),
        refundAmount: toNumber(row[3]),
        historyId: String(row[4] ?? "").trim(),
        week: toNumber(row[5]),
        date: String(row[6] ?? "").trim(),
        adminId: String(row[7] ?? "").trim(),
        notes: String(row[8] ?? "").trim(),
      }))
      .reverse();

    return {
      success: true,
      message: "Share History পাওয়া গেছে",
      data: {
        memberId: normalizedId,
        shareHistory,
        withdrawalHistory,
      },
    };
  } catch (error) {
    console.error("getAdminShareHistory error:", error);

    return {
      success: false,
      statusCode: 500,
      message: "Share History লোড করা যায়নি",
    };
  }
}
