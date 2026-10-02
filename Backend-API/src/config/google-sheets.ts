import { google } from "googleapis";
import fs from "fs";
import path from "path";

function createGoogleAuth() {
  /*
   * Vercel / Production:
   * Use Google Service Account credentials
   * from environment variable.
   */
  const serviceAccountJson =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    let credentials: {
      type: string;
      project_id: string;
      private_key_id: string;
      private_key: string;
      client_email: string;
      client_id: string;
      auth_uri: string;
      token_uri: string;
      auth_provider_x509_cert_url: string;
      client_x509_cert_url: string;
      universe_domain: string;
    };

    try {
      credentials =
        JSON.parse(serviceAccountJson);
    } catch {
      throw new Error(
        "Invalid GOOGLE_SERVICE_ACCOUNT_JSON environment variable"
      );
    }

    return new google.auth.GoogleAuth({
      credentials,
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
      ],
    });
  }

  /*
   * Local development:
   * Use credentials.json from the project root.
   */
  const credentialsPath = path.join(
    process.cwd(),
    "credentials.json"
  );

  if (!fs.existsSync(credentialsPath)) {
    throw new Error(
      "Google credentials not found. Set GOOGLE_SERVICE_ACCOUNT_JSON or provide credentials.json."
    );
  }

  return new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });
}

const auth = createGoogleAuth();

const sheets = google.sheets({
  version: "v4",
  auth,
});

function getSpreadsheetId(): string {
  const spreadsheetId =
    process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error(
      "Missing GOOGLE_SHEET_ID in environment variables"
    );
  }

  return spreadsheetId;
}

/**
 * Get values from a Google Sheet range.
 */
export async function getSheetValues(
  range: string
): Promise<string[][]> {
  const response =
    await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range,
    });

  return (
    (response.data.values as string[][]) || []
  );
}

/**
 * Append one row to a Google Sheet.
 */
export async function appendSheetRow(
  range: string,
  values: string[]
): Promise<void> {
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [values],
    },
  });
}

/**
 * Update a specific range.
 */
export async function updateSheetValues(
  range: string,
  values: string[][]
): Promise<void> {
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values,
    },
  });
}

/**
 * Permanently delete one row from a Google Sheet.
 *
 * rowNumber is the normal Google Sheets row number:
 * Header = 1
 * First admin data row = 2
 */
export async function deleteSheetRow(
  sheetName: string,
  rowNumber: number
): Promise<void> {
  if (
    !sheetName ||
    !Number.isInteger(rowNumber) ||
    rowNumber < 2
  ) {
    throw new Error(
      "Invalid sheet name or row number"
    );
  }

  const spreadsheetId =
    getSpreadsheetId();

  /*
   * Get the actual numeric sheet ID
   * from the sheet name.
   */
  const spreadsheet =
    await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets.properties",
    });

  const sheet =
    spreadsheet.data.sheets?.find(
      (item) =>
        item.properties?.title ===
        sheetName
    );

  const sheetId =
    sheet?.properties?.sheetId;

  if (
    sheetId === undefined ||
    sheetId === null
  ) {
    throw new Error(
      `Sheet "${sheetName}" not found`
    );
  }

  /*
   * Google Sheets API uses
   * zero-based indexes.
   *
   * Example:
   * Row 2 → startIndex 1
   * Row 3 → startIndex 2
   */
  const startIndex =
    rowNumber - 1;

  const endIndex =
    rowNumber;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,

    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex,
              endIndex,
            },
          },
        },
      ],
    },
  });
}