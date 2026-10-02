import {
  Router,
  Request,
  Response,
} from "express";

import {
  verifyEmailChangePassword,
  sendEmailChangeOTP,
  verifyEmailChangeOTP,
} from "../services/email-change.service";

/* ==========================================================================
   ROUTER
   ========================================================================== */

const router =
  Router();

/* ==========================================================================
   VERIFY CURRENT PASSWORD
   ========================================================================== */

/*
 * POST
 * /api/admin/email-change/:adminId/verify-password
 *
 * প্রথম ধাপে current admin password verify করা হবে।
 *
 * Password সঠিক হলে short-lived authorizationToken return করবে।
 */

router.post(
  "/:adminId/verify-password",
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const adminId =
        String(
          req.params.adminId ?? ""
        ).trim();

      const password =
        String(
          req.body?.password ?? ""
        );

      /* ------------------------------------------------------------------ */
      /* Basic Validation                                                   */
      /* ------------------------------------------------------------------ */

      if (
        !adminId ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Admin ID এবং current password প্রয়োজন",
        });
      }

      /* ------------------------------------------------------------------ */
      /* Verify Password                                                    */
      /* ------------------------------------------------------------------ */

      const result =
        await verifyEmailChangePassword(
          adminId,
          password
        );

      if (!result.success) {

        switch (
          result.reason
        ) {

          case "NOT_FOUND":
            return res.status(404).json({
              success: false,
              message:
                result.message,
            });

          case "INACTIVE":
            return res.status(403).json({
              success: false,
              message:
                result.message,
            });

          case "INVALID_ROLE":
            return res.status(403).json({
              success: false,
              message:
                result.message,
            });

          case "NO_PASSWORD":
            return res.status(500).json({
              success: false,
              message:
                result.message,
            });

          case "INVALID_PASSWORD":
            return res.status(401).json({
              success: false,
              message:
                result.message,
            });

          default:
            return res.status(400).json({
              success: false,
              message:
                result.message,
            });
        }
      }

      /* ------------------------------------------------------------------ */
      /* Success                                                            */
      /* ------------------------------------------------------------------ */

      return res.status(200).json({

        success: true,

        message:
          result.message,

        authorizationToken:
          result.authorizationToken,

        expiresIn:
          result.expiresIn,
      });

    } catch (error) {

      console.error(
        "Verify email change password route error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Password verification করা যায়নি",
      });
    }
  }
);

/* ==========================================================================
   SEND EMAIL CHANGE OTP
   ========================================================================== */

/*
 * POST
 * /api/admin/email-change/:adminId/send-otp
 *
 * Body:
 * {
 *   authorizationToken: string,
 *   newEmail: string
 * }
 *
 * OTP অবশ্যই NEW Gmail-এ পাঠানো হবে।
 */

router.post(
  "/:adminId/send-otp",
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const adminId =
        String(
          req.params.adminId ?? ""
        ).trim();

      const authorizationToken =
        String(
          req.body?.authorizationToken ?? ""
        ).trim();

      const newEmail =
        String(
          req.body?.newEmail ?? ""
        ).trim();

      /* ------------------------------------------------------------------ */
      /* Basic Validation                                                   */
      /* ------------------------------------------------------------------ */

      if (
        !adminId ||
        !authorizationToken ||
        !newEmail
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Admin ID, authorization token এবং new Gmail প্রয়োজন",
        });
      }

      /* ------------------------------------------------------------------ */
      /* Send OTP                                                           */
      /* ------------------------------------------------------------------ */

      const result =
        await sendEmailChangeOTP(
          adminId,
          authorizationToken,
          newEmail
        );

      if (!result.success) {

        switch (
          result.reason
        ) {

          case "NOT_FOUND":
            return res.status(404).json({
              success: false,
              message:
                result.message,
            });

          case "UNAUTHORIZED":
            return res.status(401).json({
              success: false,
              message:
                result.message,
            });

          case "INVALID_EMAIL":
            return res.status(400).json({
              success: false,
              message:
                result.message,
            });

          case "SAME_EMAIL":
            return res.status(400).json({
              success: false,
              message:
                result.message,
            });

          case "EMAIL_ALREADY_EXISTS":
            return res.status(409).json({
              success: false,
              message:
                result.message,
            });

          case "COOLDOWN":
            return res.status(429).json({
              success: false,
              message:
                result.message,
              resendAfter:
                result.resendAfter,
            });

          case "EMAIL_SEND_FAILED":
            return res.status(500).json({
              success: false,
              message:
                result.message,
            });

          default:
            return res.status(400).json({
              success: false,
              message:
                result.message,
            });
        }
      }

      /* ------------------------------------------------------------------ */
      /* Success                                                            */
      /* ------------------------------------------------------------------ */

      return res.status(200).json({

        success: true,

        message:
          result.message,

        expiresIn:
          result.expiresIn,

        resendAfter:
          result.resendAfter,
      });

    } catch (error) {

      console.error(
        "Send email change OTP route error:",
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

/* ==========================================================================
   VERIFY EMAIL CHANGE OTP
   ========================================================================== */

/*
 * POST
 * /api/admin/email-change/:adminId/verify-otp
 *
 * Body:
 * {
 *   authorizationToken: string,
 *   otp: string
 * }
 *
 * OTP সফল হলে:
 *
 * Admins!D = new Gmail
 * Admins!K = TRUE
 * Admins!I = updated timestamp
 */

router.post(
  "/:adminId/verify-otp",
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const adminId =
        String(
          req.params.adminId ?? ""
        ).trim();

      const authorizationToken =
        String(
          req.body?.authorizationToken ?? ""
        ).trim();

      const otp =
        String(
          req.body?.otp ?? ""
        ).trim();

      /* ------------------------------------------------------------------ */
      /* Basic Validation                                                   */
      /* ------------------------------------------------------------------ */

      if (
        !adminId ||
        !authorizationToken ||
        !otp
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Admin ID, authorization token এবং OTP প্রয়োজন",
        });
      }

      /* ------------------------------------------------------------------ */
      /* Verify OTP                                                         */
      /* ------------------------------------------------------------------ */

      const result =
        await verifyEmailChangeOTP(
          adminId,
          authorizationToken,
          otp
        );

      if (!result.success) {

        switch (
          result.reason
        ) {

          case "UNAUTHORIZED":
            return res.status(401).json({
              success: false,
              message:
                result.message,
            });

          case "INVALID_OTP":
            return res.status(400).json({
              success: false,
              message:
                result.message,
            });

          case "EXPIRED":
            return res.status(400).json({
              success: false,
              message:
                result.message,
            });

          case "MAX_ATTEMPTS":
            return res.status(429).json({
              success: false,
              message:
                result.message,
            });

          case "NOT_FOUND":
            return res.status(404).json({
              success: false,
              message:
                result.message,
            });

          case "EMAIL_ALREADY_EXISTS":
            return res.status(409).json({
              success: false,
              message:
                result.message,
            });

          case "INVALID_EMAIL":
            return res.status(400).json({
              success: false,
              message:
                result.message,
            });

          default:
            return res.status(400).json({
              success: false,
              message:
                result.message,
            });
        }
      }

      /* ------------------------------------------------------------------ */
      /* Success                                                            */
      /* ------------------------------------------------------------------ */

      return res.status(200).json({

        success: true,

        message:
          result.message,
      });

    } catch (error) {

      console.error(
        "Verify email change OTP route error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "OTP verification করা যায়নি",
      });
    }
  }
);

/* ==========================================================================
   EXPORT
   ========================================================================== */

export default router;