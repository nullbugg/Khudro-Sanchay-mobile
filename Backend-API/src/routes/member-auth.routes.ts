import {
  Router,
} from "express";

import {
  findMemberByPhone,
  getMemberDashboard,
  updateMemberProfile,
  changeMemberPin,
  registerMemberAccount,
  verifyMemberRegistrationOTP,
  resendMemberRegistrationOTP,
  createPendingDeposit,
  getMemberPendingDeposits,
  getMemberDepositHistory,
  sendMemberPinResetOTP,
  verifyMemberPinResetOTP,
  resendMemberPinResetOTP,
  resetMemberPin,
} from "../services/member.service";

import {
  verifyMemberEmailChangePin,
  sendMemberEmailChangeOTP,
  verifyMemberEmailChangeOTP,
} from "../services/member-email-change.service";

import {
  verifyPin,
} from "../utils/pin";

const router = Router();

type Language = "bn" | "en";

/*
|--------------------------------------------------------------------------
| Language Helper
|--------------------------------------------------------------------------
*/

function getLanguage(
  value: unknown
): Language {
  return String(
    value ?? "bn"
  ).toLowerCase() === "en"
    ? "en"
    : "bn";
}

/*
|--------------------------------------------------------------------------
| Registration Message Helper
|--------------------------------------------------------------------------
*/

function getRegistrationMessage(
  code: string,
  language: Language
): string {
  const messages: Record<
    string,
    { bn: string; en: string }
  > = {
    INVALID_MEMBER_ID: {
      bn: "Member ID দিন",
      en: "Please enter your Member ID",
    },

    INVALID_NAME: {
      bn: "সদস্যের নাম দিন",
      en: "Please enter your member name",
    },

    INVALID_PHONE: {
      bn: "সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন",
      en: "Please enter a valid 11-digit mobile number",
    },

    INVALID_EMAIL: {
      bn: "সঠিক Gmail address দিন",
      en: "Please enter a valid Gmail address",
    },

    INVALID_PIN: {
      bn: "PIN অবশ্যই ৪ থেকে ৬ সংখ্যার হতে হবে",
      en: "PIN must contain 4 to 6 digits",
    },

    PIN_MISMATCH: {
      bn: "PIN এবং RE-PIN মিলছে না",
      en: "PIN and RE-PIN do not match",
    },

    MEMBER_NOT_FOUND: {
      bn: "এই Member ID পাওয়া যায়নি",
      en: "This Member ID was not found",
    },

    INACTIVE_MEMBER: {
      bn: "আপনার Member account বর্তমানে নিষ্ক্রিয়",
      en: "Your member account is currently inactive",
    },

    PHONE_MISMATCH: {
      bn: "Member ID এবং মোবাইল নম্বরের তথ্য মিলছে না",
      en: "Member ID and mobile number do not match",
    },

    ALREADY_REGISTERED: {
      bn: "এই Member account ইতোমধ্যে registered",
      en: "This member account is already registered",
    },

    EMAIL_ALREADY_USED: {
      bn: "এই Gmail address অন্য একটি account-এ ব্যবহার করা হয়েছে",
      en: "This Gmail address is already being used by another account",
    },

    EMAIL_NOT_CONFIGURED: {
      bn: "Email service বর্তমানে configure করা হয়নি",
      en: "Email service is not configured",
    },

    EMAIL_SEND_FAILED: {
      bn: "OTP email পাঠানো যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন",
      en: "OTP email could not be sent. Please try again later",
    },

    OTP_SENT: {
      bn: "আপনার Gmail-এ OTP পাঠানো হয়েছে",
      en: "An OTP has been sent to your Gmail",
    },

    OTP_INVALID: {
      bn: "ভুল OTP। আবার চেষ্টা করুন",
      en: "Invalid OTP. Please try again",
    },

    OTP_NOT_FOUND: {
      bn: "কোনো pending OTP registration পাওয়া যায়নি",
      en: "No pending OTP registration was found",
    },

    OTP_EXPIRED: {
      bn: "OTP-এর সময় শেষ হয়ে গেছে। নতুন OTP নিন",
      en: "The OTP has expired. Please request a new OTP",
    },

    OTP_TOO_MANY_ATTEMPTS: {
      bn: "অনেকবার ভুল OTP দেওয়া হয়েছে। নতুন করে registration শুরু করুন",
      en: "Too many incorrect OTP attempts. Please start registration again",
    },

    OTP_RESEND_COOLDOWN: {
      bn: "নতুন OTP পাঠানোর আগে কিছুক্ষণ অপেক্ষা করুন",
      en: "Please wait before requesting another OTP",
    },

    REGISTRATION_SUCCESS: {
      bn: "Account সফলভাবে তৈরি হয়েছে",
      en: "Account created successfully",
    },
  };

  return (
    messages[code]?.[language] ??
    (
      language === "bn"
        ? "কাজটি সম্পন্ন করা যায়নি"
        : "The operation could not be completed"
    )
  );
}

/*
|--------------------------------------------------------------------------
| MEMBER LOGIN
|--------------------------------------------------------------------------
|
| Frontend:
| memberLogin(phone, pin)
|
| POST /api/mobile/auth/login
|
|--------------------------------------------------------------------------
*/

router.post(
  "/login",
  async (req, res) => {
    try {
      const phone =
        String(
          req.body?.phone ?? ""
        ).trim();

      const pin =
        String(
          req.body?.pin ?? ""
        ).trim();

      if (!phone || !pin) {
        return res.status(400).json({
          success: false,
          message:
            "Phone এবং PIN দিন",
        });
      }

      if (
        !/^01[3-9]\d{8}$/.test(
          phone
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন",
        });
      }

      if (
        !/^\d{4,6}$/.test(
          pin
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "PIN অবশ্যই ৪ থেকে ৬ সংখ্যার হতে হবে",
        });
      }

      const member =
        await findMemberByPhone(
          phone
        );

      if (!member) {
        return res.status(401).json({
          success: false,
          message:
            "Phone অথবা PIN সঠিক নয়",
        });
      }

      if (
        member.status !== "ACTIVE"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "আপনার Member account বর্তমানে নিষ্ক্রিয়",
        });
      }

      if (!member.pinHash) {
        return res.status(403).json({
          success: false,
          code: "NOT_REGISTERED",
          message:
            "এই Member ID দিয়ে এখনো account খোলা হয়নি",
        });
      }

      const validPin =
        verifyPin(
          pin,
          member.pinHash
        );

      if (!validPin) {
        return res.status(401).json({
          success: false,
          message:
            "Phone অথবা PIN সঠিক নয়",
        });
      }

      return res.json({
        success: true,

        message:
          "Login successful",

        member: {
          memberId:
            member.memberId,

          memberName:
            member.memberName,

          phone:
            member.phone,

          email: 
            member.email,

          joinDate:
            member.joinDate,

          currentShareCount:
            member.currentShareCount,

          currentWeeklyAmount:
            member.currentWeeklyAmount,

          status:
            member.status,
        },
      });
    } catch (error) {
      console.error(
        "Member login error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Login করা যায়নি",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
|
| POST /api/mobile/auth/register
|
| Body:
| {
|   memberId,
|   memberName,
|   phone,
|   email,
|   pin,
|   confirmPin,
|   language
| }
|
|--------------------------------------------------------------------------
*/

router.post(
  "/register",
  async (req, res) => {
    try {
      const memberId =
        String(
          req.body?.memberId ?? ""
        ).trim();

      const memberName =
        String(
          req.body?.memberName ?? ""
        ).trim();

      const phone =
        String(
          req.body?.phone ?? ""
        ).trim();

      const email =
        String(
          req.body?.email ?? ""
        ).trim();

      const pin =
        String(
          req.body?.pin ?? ""
        ).trim();

      const confirmPin =
        String(
          req.body?.confirmPin ?? ""
        ).trim();

      const language =
        getLanguage(
          req.body?.language
        );

      const result =
        await registerMemberAccount(
          memberId,
          memberName,
          phone,
          email,
          pin,
          confirmPin,
          language
        );

      if (!result.success) {
        const statusCode =
          result.code ===
            "MEMBER_NOT_FOUND"
            ? 404
            : result.code ===
              "ALREADY_REGISTERED"
              ? 409
              : result.code ===
                "EMAIL_ALREADY_USED"
                ? 409
                : result.code ===
                  "EMAIL_NOT_CONFIGURED"
                  ? 503
                  : result.code ===
                    "EMAIL_SEND_FAILED"
                    ? 502
                    : 400;

        return res.status(
          statusCode
        ).json({
          success: false,

          code:
            result.code,

          message:
            getRegistrationMessage(
              result.code,
              language
            ),
        });
      }

      return res.json({
        success: true,

        code:
          result.code,

        message:
          getRegistrationMessage(
            result.code,
            language
          ),

        expiresIn:
          result.expiresIn,

        resendAfter:
          result.resendAfter,
      });
    } catch (error) {
      console.error(
        "Member registration error:",
        error
      );

      const language =
        getLanguage(
          req.body?.language
        );

      return res.status(500).json({
        success: false,

        message:
          language === "bn"
            ? "Account registration করা যায়নি"
            : "Account registration failed",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| VERIFY REGISTRATION OTP
|--------------------------------------------------------------------------
|
| POST /api/mobile/auth/register/verify-otp
|
| Body:
| {
|   memberId,
|   otp,
|   language
| }
|
|--------------------------------------------------------------------------
*/

router.post(
  "/register/verify-otp",
  async (req, res) => {
    try {
      const memberId =
        String(
          req.body?.memberId ?? ""
        ).trim();

      const otp =
        String(
          req.body?.otp ?? ""
        ).trim();

      const language =
        getLanguage(
          req.body?.language
        );

      if (!memberId) {
        return res.status(400).json({
          success: false,

          code:
            "INVALID_MEMBER_ID",

          message:
            getRegistrationMessage(
              "INVALID_MEMBER_ID",
              language
            ),
        });
      }

      if (
        !/^\d{6}$/.test(
          otp
        )
      ) {
        return res.status(400).json({
          success: false,

          code:
            "OTP_INVALID",

          message:
            getRegistrationMessage(
              "OTP_INVALID",
              language
            ),
        });
      }

      const result =
        await verifyMemberRegistrationOTP(
          memberId,
          otp
        );

      if (!result.success) {
        const statusCode =
          result.code ===
            "MEMBER_NOT_FOUND"
            ? 404
            : result.code ===
              "ALREADY_REGISTERED"
              ? 409
              : result.code ===
                "OTP_TOO_MANY_ATTEMPTS"
                ? 429
                : result.code ===
                  "OTP_NOT_FOUND"
                  ? 404
                  : 400;

        return res.status(
          statusCode
        ).json({
          success: false,

          code:
            result.code,

          message:
            getRegistrationMessage(
              result.code,
              language
            ),
        });
      }

      return res.json({
        success: true,

        code:
          result.code,

        message:
          getRegistrationMessage(
            result.code,
            language
          ),
      });
    } catch (error) {
      console.error(
        "Member registration OTP verification error:",
        error
      );

      const language =
        getLanguage(
          req.body?.language
        );

      return res.status(500).json({
        success: false,

        message:
          language === "bn"
            ? "OTP verify করা যায়নি"
            : "OTP verification failed",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| RESEND REGISTRATION OTP
|--------------------------------------------------------------------------
|
| POST /api/mobile/auth/register/resend-otp
|
| Body:
| {
|   memberId,
|   language
| }
|
|--------------------------------------------------------------------------
*/

router.post(
  "/register/resend-otp",
  async (req, res) => {
    try {
      const memberId =
        String(
          req.body?.memberId ?? ""
        ).trim();

      const language =
        getLanguage(
          req.body?.language
        );

      if (!memberId) {
        return res.status(400).json({
          success: false,

          code:
            "INVALID_MEMBER_ID",

          message:
            getRegistrationMessage(
              "INVALID_MEMBER_ID",
              language
            ),
        });
      }

      const result =
        await resendMemberRegistrationOTP(
          memberId,
          language
        );

      if (!result.success) {
        const statusCode =
          result.code ===
            "OTP_NOT_FOUND"
            ? 404
            : result.code ===
              "OTP_RESEND_COOLDOWN"
              ? 429
              : result.code ===
                "OTP_EXPIRED"
                ? 400
                : result.code ===
                  "EMAIL_SEND_FAILED"
                  ? 502
                  : 400;

        return res.status(
          statusCode
        ).json({
          success: false,

          code:
            result.code,

          message:
            getRegistrationMessage(
              result.code,
              language
            ),

          resendAfter:
            result.resendAfter,
        });
      }

      return res.json({
        success: true,

        code:
          result.code,

        message:
          getRegistrationMessage(
            result.code,
            language
          ),

        expiresIn:
          result.expiresIn,

        resendAfter:
          result.resendAfter,
      });
    } catch (error) {
      console.error(
        "Member registration OTP resend error:",
        error
      );

      const language =
        getLanguage(
          req.body?.language
        );

      return res.status(500).json({
        success: false,

        message:
          language === "bn"
            ? "নতুন OTP পাঠানো যায়নি"
            : "Could not resend OTP",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

router.get(
  "/dashboard/:memberId",
  async (req, res) => {
    try {
      const memberId =
        String(
          req.params.memberId ?? ""
        ).trim();

      if (!memberId) {
        return res.status(400).json({
          success: false,
          message:
            "Member ID is required",
        });
      }

      const dashboard =
        await getMemberDashboard(
          memberId
        );

      if (!dashboard) {
        return res.status(404).json({
          success: false,
          message:
            "Member information পাওয়া যায়নি",
        });
      }

      return res.json({
        success: true,

        message:
          "Dashboard loaded successfully",

        member:
          dashboard.member,

        summary:
          dashboard.summary,
      });
    } catch (error) {
      console.error(
        "Member dashboard error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Dashboard information load করা যায়নি",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| PROFILE
|--------------------------------------------------------------------------
*/

router.put(
  "/profile/:memberId",
  async (req, res) => {
    try {
      const memberId =
        String(
          req.params.memberId ?? ""
        ).trim();

      const memberName =
        String(
          req.body?.memberName ?? ""
        ).trim();

      const phone =
        String(
          req.body?.phone ?? ""
        ).trim();

      if (!memberId) {
        return res.status(400).json({
          success: false,
          message:
            "Member ID is required",
        });
      }

      if (!memberName) {
        return res.status(400).json({
          success: false,
          message:
            "সদস্যের নাম প্রয়োজন",
        });
      }

      if (!phone) {
        return res.status(400).json({
          success: false,
          message:
            "মোবাইল নম্বর প্রয়োজন",
        });
      }

      const updatedMember =
        await updateMemberProfile(
          memberId,
          memberName,
          phone
        );

      if (!updatedMember) {
        return res.status(404).json({
          success: false,
          message:
            "Member information পাওয়া যায়নি",
        });
      }

      return res.json({
        success: true,

        message:
          "Profile updated successfully",

        member:
          updatedMember,
      });
    } catch (error) {
      console.error(
        "Member profile update error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Profile update করা যায়নি",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| CREATE DEPOSIT REQUEST
|--------------------------------------------------------------------------
|
| POST /api/mobile/auth/deposit/:memberId
|
| Body:
| {
|   weeks: number,
|   paymentMethod: "cash" | "bkash",
|   senderNumber?: string
| }
|
|--------------------------------------------------------------------------
*/

router.post(
  "/deposit/:memberId",
  async (req, res) => {
    try {
      const memberId =
        String(
          req.params?.memberId ?? ""
        ).trim();

      const weeks =
        Number(
          req.body?.weeks
        );

      const paymentMethod =
        String(
          req.body?.paymentMethod ??
          ""
        )
          .trim()
          .toLowerCase();

      const senderNumber =
        String(
          req.body?.senderNumber ??
          ""
        ).trim();

      /*
       * ---------------------------------------------------------------
       * Member ID
       * ---------------------------------------------------------------
       */

      if (!memberId) {
        return res.status(400).json({
          success: false,
          message:
            "Member ID পাওয়া যায়নি",
        });
      }

      /*
       * ---------------------------------------------------------------
       * Weeks
       * ---------------------------------------------------------------
       */

      if (
        !Number.isInteger(weeks) ||
        weeks < 1 ||
        weeks > 52
      ) {
        return res.status(400).json({
          success: false,
          message:
            "সঠিক সপ্তাহের সংখ্যা দিন",
        });
      }

      /*
       * ---------------------------------------------------------------
       * Payment Method
       * ---------------------------------------------------------------
       */

      if (
        paymentMethod !==
        "cash" &&
        paymentMethod !==
        "bkash"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "সঠিক payment method নির্বাচন করুন",
        });
      }

      /*
       * ---------------------------------------------------------------
       * Create Pending Deposit
       * ---------------------------------------------------------------
       */

      const result =
        await createPendingDeposit(
          memberId,
          weeks,
          paymentMethod as
          | "cash"
          | "bkash",
          senderNumber
        );

      if (
        !result.success
      ) {
        const statusCode =
          result.code ===
            "MEMBER_NOT_FOUND"
            ? 404
            : result.code ===
              "INACTIVE_MEMBER"
              ? 403
              : 400;

        return res.status(
          statusCode
        ).json({
          success: false,
          code:
            result.code,
          message:
            result.message,
        });
      }

      /*
       * ---------------------------------------------------------------
       * Success
       * ---------------------------------------------------------------
       */

      return res.status(201).json({
        success: true,

        message:
          paymentMethod ===
            "bkash"
            ? "আপনার bKash payment request Admin approval-এর জন্য পাঠানো হয়েছে।"
            : "আপনার deposit request Admin approval-এর জন্য পাঠানো হয়েছে।",

        request:
          result.request,
      });
    } catch (error) {
      console.error(
        "Member deposit request error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Deposit request পাঠানো যায়নি",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET MEMBER PENDING DEPOSITS
|--------------------------------------------------------------------------
|
| GET /api/mobile/auth/pending-deposits/:memberId
|
| Returns only PENDING deposit requests belonging to this member.
|--------------------------------------------------------------------------
*/

router.get(
  "/pending-deposits/:memberId",
  async (req, res) => {
    try {
      const memberId =
        String(
          req.params?.memberId ?? ""
        ).trim();

      if (!memberId) {
        return res.status(400).json({
          success: false,
          message:
            "Member ID পাওয়া যায়নি",
        });
      }

      const result =
        await getMemberPendingDeposits(
          memberId
        );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message:
            result.message,
          requests: [],
        });
      }

      return res.json({
        success: true,

        message:
          "Pending deposits loaded successfully",

        requests:
          result.requests,
      });
    } catch (error) {
      console.error(
        "Member pending deposits error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Pending deposit information load করা যায়নি",

        requests: [],
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET MEMBER DEPOSIT HISTORY
|--------------------------------------------------------------------------
|
| GET /api/mobile/auth/deposit-history/:memberId
|
| Returns PENDING + APPROVED + REJECTED
| deposit requests belonging to this member.
|--------------------------------------------------------------------------
*/

router.get(
  "/deposit-history/:memberId",
  async (req, res) => {
    try {
      const memberId =
        String(
          req.params?.memberId ?? ""
        ).trim();

      if (!memberId) {
        return res.status(400).json({
          success: false,
          message:
            "Member ID পাওয়া যায়নি",
          requests: [],
        });
      }

      const result =
        await getMemberDepositHistory(
          memberId
        );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message:
            result.message,
          requests: [],
        });
      }

      return res.json({
        success: true,

        message:
          "Deposit history loaded successfully",

        requests:
          result.requests,
      });
    } catch (error) {
      console.error(
        "Member deposit history error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Deposit history information load করা যায়নি",

        requests: [],
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| CHANGE PIN
|--------------------------------------------------------------------------
*/

router.put(
  "/change-pin/:memberId",
  async (req, res) => {
    try {
      const memberId =
        String(
          req.params.memberId ?? ""
        ).trim();

      const currentPin =
        String(
          req.body?.currentPin ?? ""
        ).trim();

      const newPin =
        String(
          req.body?.newPin ?? ""
        ).trim();

      const confirmPin =
        String(
          req.body?.confirmPin ?? ""
        ).trim();

      if (!memberId) {
        return res.status(400).json({
          success: false,
          message:
            "Member ID is required",
        });
      }

      if (!currentPin) {
        return res.status(400).json({
          success: false,
          message:
            "বর্তমান PIN দিন",
        });
      }

      if (!newPin) {
        return res.status(400).json({
          success: false,
          message:
            "নতুন PIN দিন",
        });
      }

      if (!confirmPin) {
        return res.status(400).json({
          success: false,
          message:
            "নতুন PIN আবার লিখুন",
        });
      }

      if (
        !/^\d{4,6}$/.test(
          currentPin
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "বর্তমান PIN অবশ্যই ৪ থেকে ৬ সংখ্যার হতে হবে",
        });
      }

      if (
        !/^\d{4,6}$/.test(
          newPin
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "নতুন PIN অবশ্যই ৪ থেকে ৬ সংখ্যার হতে হবে",
        });
      }

      if (
        newPin !==
        confirmPin
      ) {
        return res.status(400).json({
          success: false,
          message:
            "নতুন PIN এবং Confirm PIN মিলছে না",
        });
      }

      if (
        currentPin ===
        newPin
      ) {
        return res.status(400).json({
          success: false,
          message:
            "নতুন PIN বর্তমান PIN থেকে আলাদা হতে হবে",
        });
      }

      const result =
        await changeMemberPin(
          memberId,
          currentPin,
          newPin
        );

      if (
        result ===
        "MEMBER_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Member information পাওয়া যায়নি",
        });
      }

      if (
        result ===
        "CURRENT_PIN_INVALID"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "বর্তমান PIN সঠিক নয়",
        });
      }

      return res.json({
        success: true,
        message:
          "PIN successfully changed",
      });
    } catch (error) {
      console.error(
        "Member change PIN error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "PIN পরিবর্তন করা যায়নি",
      });
    }
  }
);

router.post(
  "/change-email/verify-pin",
  async (req, res) => {
    try {
      const {
        memberId,
        pin,
      } = req.body;

      if (
        !memberId ||
        !pin
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Member ID and PIN are required",
        });
      }

      const result =
        await verifyMemberEmailChangePin(
          memberId,
          pin
        );

      if (!result.success) {
        switch (result.reason) {
          case "NOT_FOUND":
            return res.status(404).json({
              success: false,
              message:
                "Member not found",
            });

          case "INACTIVE":
            return res.status(403).json({
              success: false,
              message:
                "Member account is inactive",
            });

          case "NO_PIN":
            return res.status(400).json({
              success: false,
              message:
                "PIN is not set",
            });

          case "INVALID_PIN":
            return res.status(401).json({
              success: false,
              message:
                "Invalid PIN",
            });

          default:
            return res.status(400).json({
              success: false,
              message:
                "Unable to verify PIN",
            });
        }
      }

      return res.json({
        success: true,
        authorizationToken:
          result.authorizationToken,
        expiresIn:
          result.expiresIn,
      });

    } catch (error) {

      console.error(
        "Member email change PIN verification error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Internal server error",
      });
    }
  }
);


router.post(
  "/change-email/send-otp",
  async (req, res) => {
    try {
      const {
        authorizationToken,
        newEmail,
      } = req.body;

      if (
        !authorizationToken ||
        !newEmail
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Authorization token and new email are required",
        });
      }

      const result =
        await sendMemberEmailChangeOTP(
          authorizationToken,
          newEmail
        );

      if (!result.success) {
        switch (result.reason) {
          case "INVALID_TOKEN":
            return res.status(401).json({
              success: false,
              message:
                "Authorization expired or invalid",
            });

          case "NOT_FOUND":
            return res.status(404).json({
              success: false,
              message:
                "Member not found",
            });

          case "INACTIVE":
            return res.status(403).json({
              success: false,
              message:
                "Member account is inactive",
            });

          case "INVALID_EMAIL":
            return res.status(400).json({
              success: false,
              message:
                "Please enter a valid Gmail address",
            });

          case "EMAIL_ALREADY_EXISTS":
            return res.status(409).json({
              success: false,
              message:
                "This Gmail is already used by another member",
            });

          case "ALREADY_CURRENT_EMAIL":
            return res.status(400).json({
              success: false,
              message:
                "This is already your current Gmail",
            });

          case "COOLDOWN":
            return res.status(429).json({
              success: false,
              message:
                "Please wait before requesting another OTP",
              code: "OTP_COOLDOWN",
              resendAfter:
                result.resendAfter ?? 60,
            });

          case "EMAIL_SEND_FAILED":
            return res.status(500).json({
              success: false,
              message:
                "Failed to send OTP email",
            });

          default:
            return res.status(400).json({
              success: false,
              message:
                "Unable to send OTP",
            });
        }
      }

      return res.json({
        success: true,
        expiresIn:
          result.expiresIn,
        resendAfter:
          result.resendAfter,
      });

    } catch (error) {

      console.error(
        "Member email change OTP send error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Internal server error",
      });
    }
  }
);


router.post(
  "/change-email/verify-otp",
  async (req, res) => {
    try {
      const {
        authorizationToken,
        otp,
      } = req.body;

      if (
        !authorizationToken ||
        !otp
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Authorization token and OTP are required",
        });
      }

      const result =
        await verifyMemberEmailChangeOTP(
          authorizationToken,
          otp
        );

      if (!result.success) {
        switch (result.reason) {
          case "INVALID_TOKEN":
            return res.status(401).json({
              success: false,
              message:
                "Authorization expired or invalid",
            });

          case "NOT_FOUND":
            return res.status(404).json({
              success: false,
              message:
                "Member not found",
            });

          case "INACTIVE":
            return res.status(403).json({
              success: false,
              message:
                "Member account is inactive",
            });

          case "NO_OTP":
            return res.status(400).json({
              success: false,
              message:
                "No OTP request found",
            });

          case "EXPIRED":
            return res.status(400).json({
              success: false,
              message:
                "OTP has expired",
            });

          case "INVALID_OTP":
            return res.status(400).json({
              success: false,
              message:
                "Invalid OTP",
            });

          case "MAX_ATTEMPTS":
            return res.status(429).json({
              success: false,
              message:
                "Maximum OTP attempts exceeded",
            });

          case "UPDATE_FAILED":
            return res.status(500).json({
              success: false,
              message:
                "Failed to update Gmail",
            });

          default:
            return res.status(400).json({
              success: false,
              message:
                "Unable to verify OTP",
            });
        }
      }

      return res.json({
        success: true,
        message:
          "Gmail changed successfully",
      });

    } catch (error) {

      console.error(
        "Member email change OTP verification error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Internal server error",
      });
    }
  }
);

router.post(
  "/forgot-pin/send-otp",
  async (req, res) => {
    try {
      const {
        phone,
        language = "bn",
      } = req.body;

      const result =
        await sendMemberPinResetOTP(
          phone,
          language === "en"
            ? "en"
            : "bn"
        );

      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error?.message ||
          "Failed to send OTP",
      });
    }
  }
);

router.post(
  "/forgot-pin/verify-otp",
  async (req, res) => {
    try {
      const {
        phone,
        otp,
      } = req.body;

      const result =
        await verifyMemberPinResetOTP(
          phone,
          otp
        );

      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error?.message ||
          "Invalid OTP",
      });
    }
  }
);

router.post(
  "/forgot-pin/resend-otp",
  async (req, res) => {
    try {
      const {
        phone,
        language = "bn",
      } = req.body;

      const result =
        await resendMemberPinResetOTP(
          phone,
          language === "en"
            ? "en"
            : "bn"
        );

      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error?.message ||
          "Failed to resend OTP",
      });
    }
  }
);

router.post(
  "/forgot-pin/reset",
  async (req, res) => {
    try {
      const {
        phone,
        resetToken,
        newPin,
        confirmPin,
      } = req.body;

      const result =
        await resetMemberPin(
          phone,
          resetToken,
          newPin,
          confirmPin
        );

      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error?.message ||
          "Failed to reset PIN",
      });
    }
  }
);

export default router;