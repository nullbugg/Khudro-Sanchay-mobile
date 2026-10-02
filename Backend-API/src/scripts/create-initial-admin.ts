import dotenv from "dotenv";

import {
  getSheetValues,
  updateSheetValues,
} from "../config/google-sheets";

import {
  hashAdminPassword,
} from "../utils/admin-password";

dotenv.config();

/*
|--------------------------------------------------------------------------
| Initial Admin Setup
|--------------------------------------------------------------------------
|
| এই script শুধু backend terminal থেকে চালানো হবে।
| Mobile app থেকে কখনো call করা হবে না।
|
|--------------------------------------------------------------------------
*/

async function createInitialAdmin() {
  /*
   * এখানে তোমার Admin information দাও।
   */

  const ADMIN_ID =
    "A001";

  const ADMIN_NAME =
    "Abdul Alim";

  const PHONE =
    "017XXXXXXXX";

  const EMAIL =
    "admin@example.com";

  /*
   * IMPORTANT:
   * এখানে তোমার নতুন password দাও।
   *
   * Setup শেষ হলে এই password
   * code থেকে সরিয়ে ফেলবে।
   */

  const PASSWORD =
    "######################@@@@@@@@@";

  const ROLE =
    "ADMIN";

  const STATUS =
    "ACTIVE";

  /*
   * Read Admins Sheet
   */

  const rows =
    await getSheetValues(
      "Admins!A:J"
    );

  if (
    !rows ||
    rows.length === 0
  ) {
    throw new Error(
      "Admins sheet পাওয়া যায়নি"
    );
  }

  const normalizedAdminId =
    ADMIN_ID
      .trim()
      .toUpperCase();

  /*
   * Find existing Admin
   */

  const dataRows =
    rows.slice(1);

  const existingRowIndex =
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
    existingRowIndex === -1
  ) {
    throw new Error(
      `${ADMIN_ID} Admin ID পাওয়া যায়নি। আগে Admins sheet-এ row তৈরি করুন।`
    );
  }

  const sheetRowNumber =
    existingRowIndex + 2;

  /*
   * Hash Password
   */

  console.log(
    "Generating secure password hash..."
  );

  const passwordHash =
    await hashAdminPassword(
      PASSWORD
    );

  const now =
    new Date().toISOString();

  /*
   * Update:
   *
   * B = Admin Name
   * C = Phone
   * D = Email
   * E = Password Hash
   * F = Role
   * G = Status
   * H = Created At
   * I = Updated At
   *
   * J = Last Login At
   * untouched থাকবে।
   */

  await updateSheetValues(
    `Admins!B${sheetRowNumber}:I${sheetRowNumber}`,
    [
      [
        ADMIN_NAME,
        PHONE,
        EMAIL,
        passwordHash,
        ROLE,
        STATUS,
        now,
        now,
      ],
    ]
  );

  console.log(
    "===================================="
  );

  console.log(
    "Initial Admin setup successful"
  );

  console.log(
    "Admin ID:",
    ADMIN_ID
  );

  console.log(
    "Admin Name:",
    ADMIN_NAME
  );

  console.log(
    "Role:",
    ROLE
  );

  console.log(
    "Status:",
    STATUS
  );

  console.log(
    "===================================="
  );

  console.log(
    "IMPORTANT: এখন script থেকে plain password সরিয়ে ফেলুন।"
  );
}

/*
|--------------------------------------------------------------------------
| Run
|--------------------------------------------------------------------------
*/

createInitialAdmin()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(
      "Initial Admin setup failed:",
      error
    );

    process.exit(1);
  });