import crypto from "crypto";

const DEFAULT_ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";
const SALT_LENGTH = 16;

/*
|--------------------------------------------------------------------------
| Hash PIN
|--------------------------------------------------------------------------
|
| Format:
|
| pbkdf2:iterations:salt:hash
|
| Example:
|
| pbkdf2:100000:abc123...:def456...
|
*/

export function hashPin(
  pin: string
): string {
  const cleanPin =
    String(pin ?? "").trim();

  if (!cleanPin) {
    throw new Error(
      "PIN is required"
    );
  }

  if (!/^\d{4,6}$/.test(cleanPin)) {
    throw new Error(
      "PIN অবশ্যই ৪ থেকে ৬ সংখ্যার হতে হবে"
    );
  }

  const salt =
    crypto
      .randomBytes(SALT_LENGTH)
      .toString("hex");

  const hash =
    crypto
      .pbkdf2Sync(
        cleanPin,
        salt,
        DEFAULT_ITERATIONS,
        KEY_LENGTH,
        DIGEST
      )
      .toString("hex");

  return [
    "pbkdf2",
    DEFAULT_ITERATIONS,
    salt,
    hash,
  ].join(":");
}

/*
|--------------------------------------------------------------------------
| Verify PIN
|--------------------------------------------------------------------------
*/

export function verifyPin(
  pin: string,
  storedHash: string
): boolean {
  try {
    const cleanPin =
      String(pin ?? "").trim();

    const cleanStoredHash =
      String(
        storedHash ?? ""
      ).trim();

    if (
      !cleanPin ||
      !cleanStoredHash
    ) {
      return false;
    }

    if (
      !/^\d{4,6}$/.test(cleanPin)
    ) {
      return false;
    }

    const parts =
      cleanStoredHash.split(":");

    if (
      parts.length !== 4 ||
      parts[0] !== "pbkdf2"
    ) {
      return false;
    }

    const iterations =
      Number(parts[1]);

    const salt =
      parts[2];

    const expectedHash =
      parts[3];

    if (
      !Number.isInteger(
        iterations
      ) ||
      iterations <= 0 ||
      !salt ||
      !expectedHash
    ) {
      return false;
    }

    const actualHash =
      crypto
        .pbkdf2Sync(
          cleanPin,
          salt,
          iterations,
          KEY_LENGTH,
          DIGEST
        )
        .toString("hex");

    const actualBuffer =
      Buffer.from(
        actualHash,
        "hex"
      );

    const expectedBuffer =
      Buffer.from(
        expectedHash,
        "hex"
      );

    if (
      actualBuffer.length !==
      expectedBuffer.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      actualBuffer,
      expectedBuffer
    );
  } catch (error) {
    console.error(
      "PIN verification error:",
      error
    );

    return false;
  }
}