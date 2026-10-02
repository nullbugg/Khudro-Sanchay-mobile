import {
  Router,
} from "express";

import {
  createAdmin,
  createAdminWeeklyDeposit,
  getAdminDepositHistory,
  getAdminPasswordResetInfo,
  sendAdminPasswordResetOTP,
  verifyAdminPasswordResetOTP,
  resetAdminPassword,
} from "../services/admin.service";

const router = Router();

/*
|--------------------------------------------------------------------------
| CREATE ADMIN
|--------------------------------------------------------------------------
*/

router.post(
  "/create",
  async (req, res) => {

    try {

      const adminId =
        String(
          req.body?.adminId ?? ""
        ).trim();

      const adminName =
        String(
          req.body?.adminName ?? ""
        ).trim();

      const phone =
        String(
          req.body?.phone ?? ""
        ).trim();

      const email =
        String(
          req.body?.email ?? ""
        ).trim()
        .toLowerCase();

      const password =
        String(
          req.body?.password ?? ""
        );

      const rePassword =
        String(
          req.body?.rePassword ?? ""
        );

      /*
       * Required fields
       */

      if (
        !adminId ||
        !adminName ||
        !phone ||
        !email ||
        !password ||
        !rePassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "সবগুলো তথ্য পূরণ করুন",
        });
      }

      /*
       * Password match
       */

      if (
        password !==
        rePassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password এবং Re-password মিলছে না",
        });
      }

      /*
       * Create admin
       */

      const result =
        await createAdmin(
          adminId,
          adminName,
          phone,
          email,
          password
        );

      /*
       * Duplicate Admin ID
       */

      if (
        !result.success &&
        result.reason ===
          "DUPLICATE_ID"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "এই Admin ID ইতিমধ্যে ব্যবহার করা হয়েছে",
        });
      }

      /*
       * Invalid Gmail
       */

      if (
        !result.success &&
        result.reason ===
          "INVALID_EMAIL"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email অবশ্যই একটি valid Gmail হতে হবে",
        });
      }

      /*
       * Invalid phone
       */

      if (
        !result.success &&
        result.reason ===
          "INVALID_PHONE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "সঠিক বাংলাদেশি Phone Number দিন",
        });
      }

      /*
       * Invalid password
       */

      if (
        !result.success &&
        result.reason ===
          "INVALID_PASSWORD"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password কমপক্ষে 6 অক্ষরের হতে হবে",
        });
      }

      /*
       * TypeScript safety
       */

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message:
            "Admin তৈরি করা যায়নি",
        });
      }

      /*
       * Success
       */

      return res.status(201).json({
        success: true,

        message:
          "Admin সফলভাবে তৈরি হয়েছে",

        admin:
          result.admin,
      });

    } catch (error) {

      console.error(
        "Create admin error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Admin তৈরি করা যায়নি",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| ADMIN DEPOSIT HISTORY
|--------------------------------------------------------------------------
|
| APPROVED এবং REJECTED deposit history দেখাবে।
|
| PENDING এখানে আসবে না।
|
*/

router.get(
  "/deposit-history",
  async (req, res) => {

    try {

      const history =
        await getAdminDepositHistory();

      return res.json({
        success: true,

        message:
          "Deposit history পাওয়া গেছে",

        requests:
          history,
      });

    } catch (error) {

      console.error(
        "Admin deposit history error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Deposit history পাওয়া যায়নি",
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| ADMIN WEEKLY DEPOSIT
|--------------------------------------------------------------------------
|
| Admin নিজে member-এর weekly deposit তৈরি করবে।
|
| Flow:
| 1. Pending Deposits-এ একটি APPROVED record
| 2. Collections-এ প্রতিটি week-এর জন্য আলাদা WEEKLY record
| 3. কোনো ADVANCE record তৈরি হবে না
|
*/

router.post(
  "/weekly-deposit",
  async (req, res) => {

    try {

      const memberId =
        String(
          req.body?.memberId ?? ""
        ).trim();

      const weeks =
        Number(
          req.body?.weeks ?? 0
        );

      const paymentMethod =
        String(
          req.body?.paymentMethod ?? ""
        ).trim()
        .toLowerCase();

      const adminId =
        String(
          req.body?.adminId ?? ""
        ).trim();


      /*
       * Required fields
       */

      if (!memberId) {
        return res.status(400).json({
          success: false,
          message:
            "Member নির্বাচন করুন",
        });
      }


      if (
        !Number.isInteger(weeks) ||
        weeks <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "সঠিক সংখ্যক সপ্তাহ দিন",
        });
      }


      if (
        paymentMethod !== "cash" &&
        paymentMethod !== "bkash"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "সঠিক Payment Method নির্বাচন করুন",
        });
      }


      if (!adminId) {
        return res.status(400).json({
          success: false,
          message:
            "Admin ID পাওয়া যায়নি",
        });
      }


      /*
       * Payment method type-safe করা
       */

      const validPaymentMethod:
        | "cash"
        | "bkash" =
        paymentMethod === "bkash"
          ? "bkash"
          : "cash";


      /*
       * Create Admin Weekly Deposit
       */

      const result =
        await createAdminWeeklyDeposit(
          memberId,
          weeks,
          validPaymentMethod,
          adminId
        );


      /*
       * Success
       */

      return res.status(201).json({
        success: true,

        message:
          "Weekly Deposit সফলভাবে তৈরি হয়েছে",

        deposit:
          result,
      });

    } catch (error) {

      console.error(
        "Admin weekly deposit error:",
        error
      );


      /*
       * Service validation errors
       */

      if (error instanceof Error) {

        switch (error.message) {

          case "MEMBER_ID_REQUIRED":
            return res.status(400).json({
              success: false,
              message:
                "Member ID পাওয়া যায়নি",
            });


          case "ADMIN_ID_REQUIRED":
            return res.status(400).json({
              success: false,
              message:
                "Admin ID পাওয়া যায়নি",
            });


          case "INVALID_WEEKS":
            return res.status(400).json({
              success: false,
              message:
                "সঠিক সংখ্যক সপ্তাহ দিন",
            });


          case "INVALID_PAYMENT_METHOD":
            return res.status(400).json({
              success: false,
              message:
                "সঠিক Payment Method নির্বাচন করুন",
            });


          case "MEMBER_NOT_FOUND":
            return res.status(404).json({
              success: false,
              message:
                "Member পাওয়া যায়নি",
            });


          case "INACTIVE_MEMBER":
            return res.status(403).json({
              success: false,
              message:
                "এই Member বর্তমানে নিষ্ক্রিয়",
            });


          case "INVALID_SHARE_COUNT":
            return res.status(400).json({
              success: false,
              message:
                "Member-এর Share Count সঠিক নয়",
            });


          case "INVALID_WEEKLY_AMOUNT":
            return res.status(400).json({
              success: false,
              message:
                "Member-এর Weekly Amount সঠিক নয়",
            });


          case "INVALID_DEPOSIT_AMOUNT":
            return res.status(400).json({
              success: false,
              message:
                "Deposit Amount সঠিক নয়",
            });


          case "WEEK_ALREADY_RECORDED":
            return res.status(409).json({
              success: false,
              message:
                "নির্বাচিত সপ্তাহের কোনো একটি ইতিমধ্যে জমা হয়েছে",
            });


          default:
            break;
        }
      }


      /*
       * Unknown server error
       */

      return res.status(500).json({
        success: false,
        message:
          "Weekly Deposit তৈরি করা যায়নি",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD
| GET ADMIN RESET INFORMATION
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
       * Admin ID validation
       */

      if (!adminId) {
        return res.status(400).json({
          success: false,
          message:
            "Admin ID পাওয়া যায়নি",
        });
      }

      /*
       * Get reset information
       */

      const result =
        await getAdminPasswordResetInfo(
          adminId
        );

      /*
       * Admin not found
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
       * TypeScript safety
       */

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message:
            "Password reset information পাওয়া যায়নি",
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
          "Password reset information পাওয়া যায়নি",
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
       * Admin ID validation
       */

      if (!adminId) {
        return res.status(400).json({
          success: false,
          message:
            "Admin ID পাওয়া যায়নি",
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
       * Admin not found
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
       * No email
       */

      if (
        !result.success &&
        result.reason ===
          "NO_EMAIL"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "এই Admin account-এর email সেট করা নেই",
        });
      }

      /*
       * Invalid email
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
            `অনুগ্রহ করে ${result.resendAfter ?? 60} সেকেন্ড পরে আবার চেষ্টা করুন`,

          resendAfter:
            result.resendAfter,
        });
      }

      /*
       * Email send failed
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
       * TypeScript safety
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
        "Admin password reset OTP error:",
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
       * Admin ID validation
       */

      if (!adminId) {
        return res.status(400).json({
          success: false,
          message:
            "Admin ID পাওয়া যায়নি",
        });
      }

      /*
       * OTP validation
       */

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
       * Admin not found
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
            "কোনো OTP request পাওয়া যায়নি",
        });
      }

      /*
       * OTP expired
       */

      if (
        !result.success &&
        result.reason ===
          "OTP_EXPIRED"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "OTP-এর মেয়াদ শেষ হয়ে গেছে",
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
       * Too many attempts
       */

      if (
        !result.success &&
        result.reason ===
          "TOO_MANY_ATTEMPTS"
      ) {
        return res.status(429).json({
          success: false,
          message:
            "অনেকবার ভুল OTP দেওয়া হয়েছে। নতুন OTP request করুন",
        });
      }

      /*
       * TypeScript safety
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
        "Admin password reset OTP verification error:",
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

router.put(
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
       * Admin ID validation
       */

      if (!adminId) {
        return res.status(400).json({
          success: false,
          message:
            "Admin ID পাওয়া যায়নি",
        });
      }

      /*
       * Reset token validation
       */

      if (!resetToken) {
        return res.status(400).json({
          success: false,
          message:
            "Reset token পাওয়া যায়নি",
        });
      }

      /*
       * Password validation
       */

      if (
        !newPassword ||
        !rePassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "নতুন Password এবং Re-enter Password দিন",
        });
      }

      /*
       * Reset password
       */

      const result =
        await resetAdminPassword(
          adminId,
          resetToken,
          newPassword,
          rePassword
        );

      /*
       * Admin not found
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
       * No reset token
       */

      if (
        !result.success &&
        result.reason ===
          "NO_RESET_TOKEN"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password reset করার অনুমতি পাওয়া যায়নি",
        });
      }

      /*
       * Reset token expired
       */

      if (
        !result.success &&
        result.reason ===
          "RESET_TOKEN_EXPIRED"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Reset token-এর মেয়াদ শেষ হয়ে গেছে",
        });
      }

      /*
       * Invalid reset token
       */

      if (
        !result.success &&
        result.reason ===
          "INVALID_RESET_TOKEN"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Reset token সঠিক নয়",
        });
      }

      /*
       * Invalid new password
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
       * Password mismatch
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
       * Same password
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
       * TypeScript safety
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


export default router;