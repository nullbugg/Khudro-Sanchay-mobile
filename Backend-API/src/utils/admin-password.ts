import argon2 from "argon2";

/*
|--------------------------------------------------------------------------
| Admin Password Hash
|--------------------------------------------------------------------------
*/

export async function hashAdminPassword(
  password: string
): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

/*
|--------------------------------------------------------------------------
| Verify Admin Password
|--------------------------------------------------------------------------
*/

export async function verifyAdminPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  try {
    if (!password || !passwordHash) {
      return false;
    }

    return await argon2.verify(
      passwordHash,
      password
    );
  } catch (error) {
    console.error(
      "Admin password verification error:",
      error
    );

    return false;
  }
}