import {
  Router,
} from "express";

import {
  loginAdmin,
  updateAdminLastLogin,
  changeAdminPassword,
  deleteAdminAccount,
  getAdminPasswordResetInfo,
  sendAdminPasswordResetOTP,
  verifyAdminPasswordResetOTP,
  resetAdminPassword,
} from "../services/admin.service";

import {
  createAdminSessionToken,
} from "../middleware/admin-auth.middleware";

const router = Router();

/*
|--------------------------------------------------------------------------
| ADMIN LOGIN
|--------------------------------------------------------------------------
*/

router.post(
  "/login",
  async (req, res) => {
    try {
      const adminId =
        String(
          req.body?.adminId ?? ""
        ).trim();

      const password =
        String(
          req.body?.password ?? ""
        ).trim();

      /*
       * Validation
       */

      if (
        !adminId ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Admin ID এবং Password দিন",
        });
      }

      /*
       * Login
       */

      const result =
        await loginAdmin(
          adminId,
          password
        );

      /*
       * Admin not found
       */

      if (
        !result.success &&
        result.reason ===
        "NOT_FOUND"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Admin ID অথবা Password সঠিক নয়",
        });
      }

      /*
       * Inactive account
       */

      if (
        !result.success &&
        result.reason ===
        "INACTIVE"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Admin account বর্তমানে নিষ্ক্রিয়",
        });
      }

      /*
       * Invalid role
       */

      if (
        !result.success &&
        result.reason ===
        "INVALID_ROLE"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "এই account-এর Admin access নেই",
        });
      }

      /*
       * Password not configured
       */

      if (
        !result.success &&
        result.reason ===
        "NO_PASSWORD"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "এই Admin account-এর password সেট করা নেই",
        });
      }

      /*
       * Wrong password
       */

      if (
        !result.success &&
        result.reason ===
        "INVALID_PASSWORD"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Admin ID অথবা Password সঠিক নয়",
        });
      }

      /*
       * TypeScript safety
       */

      if (!result.success) {
        return res.status(401).json({
          success: false,
          message:
            "Admin login failed",
        });
      }

      /*
       * Update Last Login
       */

      await updateAdminLastLogin(
        result.admin.adminId
      );

      /*
       * Successful login
       *
       * Password hash কখনো
       * frontend-এ পাঠানো হবে না।
       */
      const sessionToken =
        createAdminSessionToken(
          result.admin.adminId,
          result.admin.role
        );


      return res.json({
        success: true,
        message: "Admin login successful",
        admin: {
          adminId: result.admin.adminId,
          adminName: result.admin.adminName,
          phone: result.admin.phone,
          email: result.admin.email,
          role: result.admin.role,
          status: result.admin.status,
          createdAt: result.admin.createdAt,
          updatedAt: result.admin.updatedAt,
          lastLoginAt: result.admin.lastLoginAt,
        },
        sessionToken,
        expiresIn: 24 * 60 * 60,
      });
    } catch (error) {
      console.error(
        "Admin login error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Admin login করা যায়নি",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD
| GET ADMIN PASSWORD RESET INFO
|--------------------------------------------------------------------------
*/

router.get(
  "/forgot-password/:adminId",
  async (req, res) => {
    try {
      const adminId =
        String(
          req.params?.adminId ?? ""
        ).trim();

      /*
       * Basic Validation
       */

      if (!adminId) {
        return res.status(400).json({
          success: false,
          message:
            "Admin ID দিন",
        });
      }

      /*
       * Get Admin Reset Info
       */

      const result =
        await getAdminPasswordResetInfo(
          adminId
        );

      /*
       * Admin Not Found
       */

      if (
        !result.success &&
        result.reason ===
        "NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Admin account পাওয়া যায়নি",
        });
      }

      /*
       * Inactive Account
       */

      if (
        !result.success &&
        result.reason ===
        "INACTIVE"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Admin account বর্তমানে নিষ্ক্রিয়",
        });
      }

      /*
       * Invalid Role
       */

      if (
        !result.success &&
        result.reason ===
        "INVALID_ROLE"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "এই account-এর Admin access নেই",
        });
      }

      /*
       * TypeScript Safety
       */

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message:
            "Admin information পাওয়া যায়নি",
        });
      }

      /*
       * Success
       */

      return res.json({
        success: true,
        adminId:
          result.adminId,
        email:
          result.email,
        maskedEmail:
          result.maskedEmail,
      });
    } catch (error) {
      console.error(
        "Admin password reset info error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Admin information পাওয়া যায়নি",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD
| SEND OTP
|--------------------------------------------------------------------------
*/

router.post(
  "/forgot-password/:adminId/send-otp",
  async (req, res) => {
    try {
      const adminId =
        String(
          req.params?.adminId ?? ""
        ).trim();

      /*
       * Basic Validation
       */

      if (!adminId) {
        return res.status(400).json({
          success: false,
          message:
            "Admin ID দিন",
        });
      }

      /*
       * Send OTP
       */

      const result =
        await sendAdminPasswordResetOTP(
          adminId
        );

      /*
       * Admin Not Found
       */

      if (
        !result.success &&
        result.reason ===
        "NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Admin account পাওয়া যায়নি",
        });
      }

      /*
       * Inactive Account
       */

      if (
        !result.success &&
        result.reason ===
        "INACTIVE"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Admin account বর্তমানে নিষ্ক্রিয়",
        });
      }

      /*
       * Invalid Role
       */

      if (
        !result.success &&
        result.reason ===
        "INVALID_ROLE"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "এই account-এর Admin access নেই",
        });
      }

      /*
       * No Email
       */

      if (
        !result.success &&
        result.reason ===
        "NO_EMAIL"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "এই Admin account-এর কোনো email পাওয়া যায়নি",
        });
      }

      /*
       * Invalid Email
       */

      if (
        !result.success &&
        result.reason ===
        "INVALID_EMAIL"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Admin account-এর email address সঠিক নয়",
        });
      }

      /*
       * Cooldown
       */

      if (
        !result.success &&
        result.reason ===
        "COOLDOWN"
      ) {
        return res.status(429).json({
          success: false,
          message:
            "নতুন OTP পাঠানোর আগে কিছুক্ষণ অপেক্ষা করুন",
          resendAfter:
            result.resendAfter,
        });
      }

      /*
       * Email Send Failed
       */

      if (
        !result.success &&
        result.reason ===
        "EMAIL_SEND_FAILED"
      ) {
        return res.status(500).json({
          success: false,
          message:
            "OTP email পাঠানো যায়নি",
        });
      }

      /*
       * TypeScript Safety
       */

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message:
            "OTP পাঠানো যায়নি",
        });
      }

      /*
       * Success
       */

      return res.json({
        success: true,
        message:
          "OTP আপনার Gmail-এ পাঠানো হয়েছে",
        expiresIn:
          result.expiresIn,
        resendAfter:
          result.resendAfter,
      });
    } catch (error) {
      console.error(
        "Admin password reset send OTP error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "OTP পাঠানো যায়নি",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD
| VERIFY OTP
|--------------------------------------------------------------------------
*/

router.post(
  "/forgot-password/:adminId/verify-otp",
  async (req, res) => {
    try {
      const adminId =
        String(
          req.params?.adminId ?? ""
        ).trim();

      const otp =
        String(
          req.body?.otp ?? ""
        ).trim();

      /*
       * Basic Validation
       */

      if (!adminId) {
        return res.status(400).json({
          success: false,
          message:
            "Admin ID পাওয়া যায়নি",
        });
      }

      if (!otp) {
        return res.status(400).json({
          success: false,
          message:
            "OTP দিন",
        });
      }

      /*
       * Verify OTP
       */

      const result =
        await verifyAdminPasswordResetOTP(
          adminId,
          otp
        );

      /*
       * Admin Not Found
       */

      if (
        !result.success &&
        result.reason ===
        "NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Admin account পাওয়া যায়নি",
        });
      }

      /*
       * Inactive Account
       */

      if (
        !result.success &&
        result.reason ===
        "INACTIVE"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Admin account বর্তমানে নিষ্ক্রিয়",
        });
      }

      /*
       * Invalid Role
       */

      if (
        !result.success &&
        result.reason ===
        "INVALID_ROLE"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "এই account-এর Admin access নেই",
        });
      }

      /*
       * No OTP
       */

      if (
        !result.success &&
        result.reason ===
        "NO_OTP"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "কোনো active OTP পাওয়া যায়নি। নতুন OTP নিন",
        });
      }

      /*
       * OTP Expired
       */

      if (
        !result.success &&
        result.reason ===
        "OTP_EXPIRED"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "OTP-এর মেয়াদ শেষ হয়ে গেছে। নতুন OTP নিন",
        });
      }

      /*
       * Invalid OTP
       */

      if (
        !result.success &&
        result.reason ===
        "INVALID_OTP"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "OTP সঠিক নয়",
        });
      }

      /*
       * Too Many Attempts
       */

      if (
        !result.success &&
        result.reason ===
        "TOO_MANY_ATTEMPTS"
      ) {
        return res.status(429).json({
          success: false,
          message:
            "অনেকবার ভুল OTP দেওয়া হয়েছে। নতুন OTP নিন",
        });
      }

      /*
       * TypeScript Safety
       */

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message:
            "OTP verify করা যায়নি",
        });
      }

      /*
       * Success
       */

      return res.json({
        success: true,
        message:
          "OTP সফলভাবে verify হয়েছে",
        resetToken:
          result.resetToken,
        expiresIn:
          result.expiresIn,
      });
    } catch (error) {
      console.error(
        "Admin password reset verify OTP error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "OTP verify করা যায়নি",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD
| RESET PASSWORD
|--------------------------------------------------------------------------
*/

router.post(
  "/forgot-password/:adminId/reset-password",
  async (req, res) => {
    try {
      const adminId =
        String(
          req.params?.adminId ?? ""
        ).trim();

      const resetToken =
        String(
          req.body?.resetToken ?? ""
        ).trim();

      const newPassword =
        String(
          req.body?.newPassword ?? ""
        );

      const rePassword =
        String(
          req.body?.rePassword ?? ""
        );

      /*
       * Basic Validation
       */

      if (!adminId) {
        return res.status(400).json({
          success: false,
          message:
            "Admin ID পাওয়া যায়নি",
        });
      }

      if (!resetToken) {
        return res.status(400).json({
          success: false,
          message:
            "Reset token পাওয়া যায়নি",
        });
      }

      if (
        !newPassword ||
        !rePassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "নতুন Password এবং Confirm Password দিন",
        });
      }

      /*
       * Reset Password
       */

      const result =
        await resetAdminPassword(
          adminId,
          resetToken,
          newPassword,
          rePassword
        );

      /*
       * Admin Not Found
       */

      if (
        !result.success &&
        result.reason ===
        "NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Admin account পাওয়া যায়নি",
        });
      }

      /*
       * Inactive Account
       */

      if (
        !result.success &&
        result.reason ===
        "INACTIVE"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Admin account বর্তমানে নিষ্ক্রিয়",
        });
      }

      /*
       * Invalid Role
       */

      if (
        !result.success &&
        result.reason ===
        "INVALID_ROLE"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "এই account-এর Admin access নেই",
        });
      }

      /*
       * No Reset Token
       */

      if (
        !result.success &&
        result.reason ===
        "NO_RESET_TOKEN"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Password reset করার অনুমতি পাওয়া যায়নি। আবার OTP verify করুন",
        });
      }

      /*
       * Reset Token Expired
       */

      if (
        !result.success &&
        result.reason ===
        "RESET_TOKEN_EXPIRED"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Password reset token-এর মেয়াদ শেষ হয়ে গেছে। আবার OTP verify করুন",
        });
      }

      /*
       * Invalid Reset Token
       */

      if (
        !result.success &&
        result.reason ===
        "INVALID_RESET_TOKEN"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Password reset token সঠিক নয়",
        });
      }

      /*
       * Invalid New Password
       */

      if (
        !result.success &&
        result.reason ===
        "INVALID_NEW_PASSWORD"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "নতুন Password কমপক্ষে ৬ অক্ষরের হতে হবে",
        });
      }

      /*
       * Password Mismatch
       */

      if (
        !result.success &&
        result.reason ===
        "PASSWORD_MISMATCH"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "নতুন Password এবং Confirm Password মিলছে না",
        });
      }

      /*
       * Same Password
       */

      if (
        !result.success &&
        result.reason ===
        "SAME_PASSWORD"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "নতুন Password আগের Password-এর মতো হতে পারবে না",
        });
      }

      /*
       * TypeScript Safety
       */

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message:
            "Password reset করা যায়নি",
        });
      }

      /*
       * Success
       */

      return res.json({
        success: true,
        message:
          "Password সফলভাবে reset হয়েছে",
      });
    } catch (error) {
      console.error(
        "Admin password reset error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Password reset করা যায়নি",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| CHANGE ADMIN PASSWORD
|--------------------------------------------------------------------------
*/

router.put(
  "/change-password/:adminId",
  async (req, res) => {
    try {
      /*
       * ---------------------------------------------------------------
       * Admin ID
       * ---------------------------------------------------------------
       */

      const adminId =
        String(
          req.params?.adminId ?? ""
        ).trim();

      /*
       * ---------------------------------------------------------------
       * Password Inputs
       * ---------------------------------------------------------------
       */

      const currentPassword =
        String(
          req.body?.currentPassword ?? ""
        );

      const newPassword =
        String(
          req.body?.newPassword ?? ""
        );

      const rePassword =
        String(
          req.body?.rePassword ?? ""
        );

      /*
       * ---------------------------------------------------------------
       * Basic Validation
       * ---------------------------------------------------------------
       */

      if (!adminId) {
        return res.status(400).json({
          success: false,
          message:
            "Admin ID পাওয়া যায়নি",
        });
      }

      if (
        !currentPassword ||
        !newPassword ||
        !rePassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "সবগুলো password field পূরণ করুন",
        });
      }

      /*
       * ---------------------------------------------------------------
       * Change Password
       * ---------------------------------------------------------------
       */

      const result =
        await changeAdminPassword(
          adminId,
          currentPassword,
          newPassword,
          rePassword
        );

      /*
       * ---------------------------------------------------------------
       * Admin Not Found
       * ---------------------------------------------------------------
       */

      if (
        !result.success &&
        result.reason ===
        "NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Admin account পাওয়া যায়নি",
        });
      }

      /*
       * ---------------------------------------------------------------
       * Inactive Account
       * ---------------------------------------------------------------
       */

      if (
        !result.success &&
        result.reason ===
        "INACTIVE"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Admin account বর্তমানে নিষ্ক্রিয়",
        });
      }

      /*
       * ---------------------------------------------------------------
       * Invalid Role
       * ---------------------------------------------------------------
       */

      if (
        !result.success &&
        result.reason ===
        "INVALID_ROLE"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "এই account-এর Admin access নেই",
        });
      }

      /*
       * ---------------------------------------------------------------
       * No Password
       * ---------------------------------------------------------------
       */

      if (
        !result.success &&
        result.reason ===
        "NO_PASSWORD"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "এই Admin account-এর password সেট করা নেই",
        });
      }

      /*
       * ---------------------------------------------------------------
       * Invalid Current Password
       * ---------------------------------------------------------------
       */

      if (
        !result.success &&
        result.reason ===
        "INVALID_CURRENT_PASSWORD"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "বর্তমান Password সঠিক নয়",
        });
      }

      /*
       * ---------------------------------------------------------------
       * Invalid New Password
       * ---------------------------------------------------------------
       */

      if (
        !result.success &&
        result.reason ===
        "INVALID_NEW_PASSWORD"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "নতুন Password কমপক্ষে ৬ অক্ষরের হতে হবে এবং বর্তমান Password-এর মতো হতে পারবে না",
        });
      }

      /*
       * ---------------------------------------------------------------
       * Password Mismatch
       * ---------------------------------------------------------------
       */

      if (
        !result.success &&
        result.reason ===
        "PASSWORD_MISMATCH"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "নতুন Password এবং Re-enter Password মিলছে না",
        });
      }

      /*
       * ---------------------------------------------------------------
       * TypeScript Safety
       * ---------------------------------------------------------------
       */

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message:
            "Password পরিবর্তন করা যায়নি",
        });
      }

      /*
       * ---------------------------------------------------------------
       * Success
       * ---------------------------------------------------------------
       */

      return res.json({
        success: true,
        message:
          "Password সফলভাবে পরিবর্তন হয়েছে",
      });
    } catch (error) {
      console.error(
        "Admin change password error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Password পরিবর্তন করা যায়নি",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| DELETE ADMIN ACCOUNT
|--------------------------------------------------------------------------
*/

router.delete(
  "/account/:adminId",
  async (req, res) => {
    try {
      /*
       * ---------------------------------------------------------------
       * Admin ID
       * ---------------------------------------------------------------
       */

      const adminId =
        String(
          req.params?.adminId ?? ""
        ).trim();

      /*
       * ---------------------------------------------------------------
       * Password
       * ---------------------------------------------------------------
       */

      const password =
        String(
          req.body?.password ?? ""
        );

      /*
       * ---------------------------------------------------------------
       * Basic Validation
       * ---------------------------------------------------------------
       */

      if (!adminId) {
        return res.status(400).json({
          success: false,
          message:
            "Admin ID পাওয়া যায়নি",
        });
      }

      if (!password) {
        return res.status(400).json({
          success: false,
          message:
            "Password দিন",
        });
      }

      /*
       * ---------------------------------------------------------------
       * Delete Admin Account
       * ---------------------------------------------------------------
       */

      const result =
        await deleteAdminAccount(
          adminId,
          password
        );

      /*
       * ---------------------------------------------------------------
       * Admin Not Found
       * ---------------------------------------------------------------
       */

      if (
        !result.success &&
        result.reason ===
        "NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Admin account পাওয়া যায়নি",
        });
      }

      /*
       * ---------------------------------------------------------------
       * Inactive Account
       * ---------------------------------------------------------------
       */

      if (
        !result.success &&
        result.reason ===
        "INACTIVE"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Admin account বর্তমানে নিষ্ক্রিয়",
        });
      }

      /*
       * ---------------------------------------------------------------
       * Invalid Role
       * ---------------------------------------------------------------
       */

      if (
        !result.success &&
        result.reason ===
        "INVALID_ROLE"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "এই account-এর Admin access নেই",
        });
      }

      /*
       * ---------------------------------------------------------------
       * No Password
       * ---------------------------------------------------------------
       */

      if (
        !result.success &&
        result.reason ===
        "NO_PASSWORD"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "এই Admin account-এর password সেট করা নেই",
        });
      }

      /*
       * ---------------------------------------------------------------
       * Invalid Password
       * ---------------------------------------------------------------
       */

      if (
        !result.success &&
        result.reason ===
        "INVALID_PASSWORD"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Password সঠিক নয়",
        });
      }

      /*
       * ---------------------------------------------------------------
       * TypeScript Safety
       * ---------------------------------------------------------------
       */

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message:
            "Admin account delete করা যায়নি",
        });
      }

      /*
       * ---------------------------------------------------------------
       * Success
       * ---------------------------------------------------------------
       */

      return res.json({
        success: true,
        message:
          "Admin account সফলভাবে delete হয়েছে",
      });

    } catch (error) {
      console.error(
        "Admin account deletion error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Admin account delete করা যায়নি",
      });
    }
  }
);

export default router;