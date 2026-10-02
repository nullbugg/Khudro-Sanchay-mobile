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

function parseNumber(
  value: unknown
): number {
  const number =
    Number(
      String(value ?? "")
        .replace(/,/g, "")
        .trim()
    );

  return Number.isFinite(number)
    ? number
    : 0;
}

function normalize(
  value: unknown
): string {
  return String(
    value ?? ""
  )
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
  | Members
  |--------------------------------------------------------------------------
  |
  | Members:
  |
  | A = Member ID
  | B = Member Name
  | C = Phone
  | D = Join Date
  | E = Current Share Count
  | F = Current Weekly Amount
  | G = PIN Hash
  | H = Status
  | I = Created At
  | J = Updated At
  |
  */

  const memberRows =
    await getSheetValues(
      "Members!A:J"
    );

  const memberData =
    memberRows.length > 1
      ? memberRows.slice(1)
      : [];

  /*
  |--------------------------------------------------------------------------
  | Only ACTIVE members
  |--------------------------------------------------------------------------
  */

  const activeMembers =
    memberData.filter(
      (row) =>
        normalize(row[7]) ===
        "ACTIVE"
    );

  /*
  |--------------------------------------------------------------------------
  | Total Members
  |--------------------------------------------------------------------------
  */

  const totalMembers =
    activeMembers.length;

  /*
  |--------------------------------------------------------------------------
  | Total Shares
  |--------------------------------------------------------------------------
  |
  | E = Current Share Count
  |
  */

  const totalShares =
    activeMembers.reduce(
      (total, row) =>
        total +
        parseNumber(row[4]),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | Weekly Deposit Amount
  |--------------------------------------------------------------------------
  |
  | F = Current Weekly Amount
  |
  */

  const weeklyDepositAmount =
    activeMembers.reduce(
      (total, row) =>
        total +
        parseNumber(row[5]),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | Weekly Cycle
  |--------------------------------------------------------------------------
  |
  | Week 1 = 24-04-2026
  |
  | Every 7 days = next week
  |
  */

  const FIRST_WEEK_DATE =
    new Date(
      "2026-04-24T00:00:00+06:00"
    );

  const now =
    new Date();

  /*
  |--------------------------------------------------------------------------
  | Bangladesh timezone date
  |--------------------------------------------------------------------------
  */

  const dhakaDateString =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Asia/Dhaka",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).format(now);

  /*
  |--------------------------------------------------------------------------
  | Convert YYYY-MM-DD
  |--------------------------------------------------------------------------
  */

  const [
    year,
    month,
    day,
  ] =
    dhakaDateString
      .split("-")
      .map(Number);

  /*
  |--------------------------------------------------------------------------
  | Create current Bangladesh date
  |--------------------------------------------------------------------------
  */

  const today =
    new Date(
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+06:00`
    );

  /*
  |--------------------------------------------------------------------------
  | Calculate current week
  |--------------------------------------------------------------------------
  */

  const differenceInMilliseconds =
    today.getTime() -
    FIRST_WEEK_DATE.getTime();

  const differenceInDays =
    Math.floor(
      differenceInMilliseconds /
      (1000 * 60 * 60 * 24)
    );

  /*
  |--------------------------------------------------------------------------
  | Before the first week
  |--------------------------------------------------------------------------
  */

  const currentWeek =
    differenceInDays < 0
      ? 1
      : Math.floor(
        differenceInDays / 7
      ) + 1;

  const nextWeek =
    currentWeek + 1;

  /*
  |--------------------------------------------------------------------------
  | Current Week Date
  |--------------------------------------------------------------------------
  */

  const currentWeekDateObject =
    new Date(
      FIRST_WEEK_DATE
    );

  currentWeekDateObject.setDate(
    currentWeekDateObject.getDate() +
    (currentWeek - 1) * 7
  );

  /*
  |--------------------------------------------------------------------------
  | Next Week Date
  |--------------------------------------------------------------------------
  */

  const nextWeekDateObject =
    new Date(
      currentWeekDateObject
    );

  nextWeekDateObject.setDate(
    nextWeekDateObject.getDate() +
    7
  );

  /*
  |--------------------------------------------------------------------------
  | Format Date
  |--------------------------------------------------------------------------
  */

  function formatWeekDate(
    date: Date
  ): string {
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

  const currentWeekDate =
    formatWeekDate(
      currentWeekDateObject
    );

  const nextWeekDate =
    formatWeekDate(
      nextWeekDateObject
    );

  /*
  |--------------------------------------------------------------------------
  | Collections
  |--------------------------------------------------------------------------
  |
  | Current Collections structure:
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
  */

  const collectionRows =
    await getSheetValues(
      "Collections!A:L"
    );

  const collectionData =
    collectionRows.length > 1
      ? collectionRows.slice(1)
      : [];

  /*
  |--------------------------------------------------------------------------
  | Only PAID collections
  |--------------------------------------------------------------------------
  |
  | H = Paid Amount
  | I = Status
  |
  */

  const paidCollections =
    collectionData.filter(
      (row) =>
        normalize(row[8]) ===
        "PAID"
    );

  /*
  |--------------------------------------------------------------------------
  | Parse Collection Week
  |--------------------------------------------------------------------------
  |
  | D = Week
  |
  | Examples:
  |
  | "Week 1"
  | "Week 23"
  | "23"
  |
  */

  function getCollectionWeekNumber(
    value: unknown
  ): number {
    const text =
      String(
        value ?? ""
      )
        .trim();

    if (!text) {
      return 0;
    }

    const match =
      text.match(
        /(\d+)/
      );

    if (!match) {
      return 0;
    }

    const weekNumber =
      Number(
        match[1]
      );

    return Number.isInteger(
      weekNumber
    ) &&
      weekNumber > 0
      ? weekNumber
      : 0;
  }

  /*
  |--------------------------------------------------------------------------
  | Total Deposit
  |--------------------------------------------------------------------------
  |
  | সব PAID collection-এর Paid Amount-এর SUM
  |
  | অর্থাৎ:
  |
  | Week 1 থেকে ভবিষ্যতের সব Week পর্যন্ত
  | যেসব collection PAID হয়েছে,
  | সবগুলোর Paid Amount এখানে যোগ হবে।
  |
  | H = Paid Amount
  |
  */

  const totalDeposit =
    paidCollections.reduce(
      (total, row) =>
        total +
        parseNumber(row[7]),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | Total Weekly Deposit
  |--------------------------------------------------------------------------
  |
  | Week 1 থেকে Current Week পর্যন্ত
  | সব PAID collection-এর Paid Amount-এর SUM
  |
  | উদাহরণ:
  |
  | Current Week = 23
  |
  | তাহলে:
  | Week 1 + Week 2 + ... + Week 23
  |
  | Week 24 বা তার পরের Week এখানে আসবে না।
  |
  */

  const weeklyCollectionsUpToCurrentWeek =
    paidCollections.filter(
      (row) => {
        const weekNumber =
          getCollectionWeekNumber(
            row[3]
          );

        return (
          weekNumber >= 1 &&
          weekNumber <= currentWeek
        );
      }
    );

  const totalWeeklyDeposit =
    weeklyCollectionsUpToCurrentWeek.reduce(
      (total, row) =>
        total +
        parseNumber(row[7]),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | Current Week Deposit
  |--------------------------------------------------------------------------
  |
  | শুধু Current Week-এর Paid Amount
  |
  | D = Week
  | H = Paid Amount
  |
  */

  const weeklyCollectionRows =
    paidCollections.filter(
      (row) =>
        getCollectionWeekNumber(
          row[3]
        ) === currentWeek
    );

  const currentWeekPaidAmount =
    weeklyCollectionRows.reduce(
      (total, row) =>
        total +
        parseNumber(row[7]),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | Advance
  |--------------------------------------------------------------------------
  |
  | Current Week-এর পরের Week-এর
  | Paid Amount-এর SUM
  |
  | উদাহরণ:
  |
  | Current Week = 23
  |
  | তাহলে:
  | Week 24 + Week 25 + Week 26 ...
  |
  | সব PAID future-week collection
  | Advance হিসেবে গণনা হবে।
  |
  */

  const advanceCollectionRows =
    paidCollections.filter(
      (row) =>
        getCollectionWeekNumber(
          row[3]
        ) > currentWeek
    );

  const totalAdvance =
    advanceCollectionRows.reduce(
      (total, row) =>
        total +
        parseNumber(row[7]),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | Return
  |--------------------------------------------------------------------------
  */

  return {
    totalDeposit,

    totalWeeklyDeposit,

    totalAdvance,

    totalMembers,

    totalShares,

    weeklyDepositAmount:
      currentWeekPaidAmount,

    currentWeek,

    currentWeekDate,

    nextWeek,

    nextWeekDate,
  };
}

