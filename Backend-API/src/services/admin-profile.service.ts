import {
  getSheetValues,
  updateSheetValues,
} from "../config/google-sheets";

/* ==========================================================================
   Admin Profile
   ========================================================================== */

export interface AdminProfile {
  adminId: string;
  adminName: string;
  phone: string;
  email: string;
  emailVerified: boolean;
}

/* ==========================================================================
   Get Admin Profile
   ========================================================================== */

export async function getAdminProfile(
  adminId: string
): Promise<AdminProfile | null> {
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
    String(adminId ?? "")
      .trim()
      .toUpperCase();

  if (!normalizedId) {
    return null;
  }

  const rowIndex =
    rows
      .slice(1)
      .findIndex(
        (row) =>
          String(
            row[0] ?? ""
          )
            .trim()
            .toUpperCase() ===
          normalizedId
      );

  if (rowIndex === -1) {
    return null;
  }

  const row =
    rows[rowIndex + 1];

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

    emailVerified:
      String(
        row[10] ?? ""
      )
        .trim()
        .toUpperCase() ===
      "TRUE",
  };
}

/* ==========================================================================
   Update Admin Profile
   ========================================================================== */

export async function updateAdminProfile(
  adminId: string,
  adminName: string,
  phone: string
): Promise<
  | {
      success: true;
      profile: AdminProfile;
    }
  | {
      success: false;
      reason:
        | "NOT_FOUND"
        | "INVALID_NAME"
        | "INVALID_PHONE";
    }
> {
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

  const normalizedId =
    String(adminId ?? "")
      .trim()
      .toUpperCase();

  const normalizedName =
    String(adminName ?? "").trim();

  const normalizedPhone =
    String(phone ?? "").trim();

  /* ---------------------------------------------------------------------- */
  /* Name Validation                                                        */
  /* ---------------------------------------------------------------------- */

  if (
    !normalizedName ||
    normalizedName.length < 2
  ) {
    return {
      success: false,
      reason: "INVALID_NAME",
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Bangladesh Phone Validation                                            */
  /* ---------------------------------------------------------------------- */

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

  /* ---------------------------------------------------------------------- */
  /* Find Admin                                                             */
  /* ---------------------------------------------------------------------- */

  const rowIndex =
    rows
      .slice(1)
      .findIndex(
        (row) =>
          String(
            row[0] ?? ""
          )
            .trim()
            .toUpperCase() ===
          normalizedId
      );

  if (rowIndex === -1) {
    return {
      success: false,
      reason: "NOT_FOUND",
    };
  }

  const sheetRowNumber =
    rowIndex + 2;

  /* ---------------------------------------------------------------------- */
  /* Update Name                                                             */
  /* ---------------------------------------------------------------------- */

  await updateSheetValues(
    `Admins!B${sheetRowNumber}`,
    [
      [normalizedName],
    ]
  );

  /* ---------------------------------------------------------------------- */
  /* Update Phone                                                            */
  /* ---------------------------------------------------------------------- */

  await updateSheetValues(
    `Admins!C${sheetRowNumber}`,
    [
      [normalizedPhone],
    ]
  );

  /* ---------------------------------------------------------------------- */
  /* Updated Profile                                                         */
  /* ---------------------------------------------------------------------- */

  const updatedProfile =
    await getAdminProfile(
      normalizedId
    );

  if (!updatedProfile) {
    return {
      success: false,
      reason: "NOT_FOUND",
    };
  }

  return {
    success: true,
    profile: updatedProfile,
  };
}

/* ==========================================================================
   Mark Email As Verified
   ========================================================================== */

export async function markAdminEmailVerified(
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
    String(adminId ?? "")
      .trim()
      .toUpperCase();

  const rowIndex =
    rows
      .slice(1)
      .findIndex(
        (row) =>
          String(
            row[0] ?? ""
          )
            .trim()
            .toUpperCase() ===
          normalizedId
      );

  if (rowIndex === -1) {
    return false;
  }

  const sheetRowNumber =
    rowIndex + 2;

  /* ---------------------------------------------------------------------- */
  /* K = Email Verified                                                      */
  /* ---------------------------------------------------------------------- */

  await updateSheetValues(
    `Admins!K${sheetRowNumber}`,
    [
      ["TRUE"],
    ]
  );

  return true;
}