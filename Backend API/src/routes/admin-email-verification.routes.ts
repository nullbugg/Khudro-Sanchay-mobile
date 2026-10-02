import {
  Router,
} from "express";

import {
  sendAdminEmailOTP,
  verifyAdminEmailOTP,
} from "../services/email-verification.service";

const router =
  Router();

/* ==========================================================================
   SEND EMAIL VERIFICATION OTP
   ========================================================================== */

router.post(
  "/:adminId/send-otp",
  async (
    req,
    res
  ) => {

    try {

      const adminId =
        String(
          req.params.adminId ?? ""
        ).trim();

      if (!adminId) {

        return res
          .status(400)
          .json({
            success: false,
            message:
              "Admin ID পাওয়া যায়নি",
          });
      }

      const result =
        await sendAdminEmailOTP(
          adminId
        );

      /* ------------------------------------------------------------------ */
      /* Admin Not Found                                                    */
      /* ------------------------------------------------------------------ */

      if (
        !result.success &&
        result.reason ===
        "NOT_FOUND"
      ) {

        return res
          .status(404)
          .json({
            success: false,
            message:
              result.message,
          });
      }

      /* ------------------------------------------------------------------ */
      /* Already Verified                                                   */
      /* ------------------------------------------------------------------ */

      if (
        !result.success &&
        result.reason ===
        "ALREADY_VERIFIED"
      ) {

        return res
          .status(400)
          .json({
            success: false,
            message:
              result.message,
          });
      }

      /* ------------------------------------------------------------------ */
      /* Email Not Found                                                     */
      /* ------------------------------------------------------------------ */

      if (
        !result.success &&
        result.reason ===
        "EMAIL_NOT_FOUND"
      ) {

        return res
          .status(400)
          .json({
            success: false,
            message:
              result.message,
          });
      }

      /* ------------------------------------------------------------------ */
      /* Cooldown                                                           */
      /* ------------------------------------------------------------------ */

      if (
        !result.success &&
        result.reason ===
        "COOLDOWN"
      ) {

        return res
          .status(429)
          .json({
            success: false,
            message:
              result.message,

            resendAfter:
              result.resendAfter,
          });
      }

      /* ------------------------------------------------------------------ */
      /* Email Sending Failed                                               */
      /* ------------------------------------------------------------------ */

      if (
        !result.success &&
        result.reason ===
        "EMAIL_SEND_FAILED"
      ) {

        return res
          .status(500)
          .json({
            success: false,
            message:
              result.message,
          });
      }

      /* ------------------------------------------------------------------ */
      /* Success                                                            */
      /* ------------------------------------------------------------------ */

      if (result.success) {
        return res.json({
          success: true,

          message:
            result.message,

          expiresIn:
            result.expiresIn,

          resendAfter:
            result.resendAfter,
        });
      }

      return res.status(500).json({
        success: false,
        message:
          result.message,
      });

    } catch (error) {

      console.error(
        "Send admin email OTP route error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Gmail-এ OTP পাঠানো যায়নি",
        });
    }
  }
);

/* ==========================================================================
   VERIFY EMAIL OTP
   ========================================================================== */

router.post(
  "/:adminId/verify-otp",
  async (
    req,
    res
  ) => {

    try {

      const adminId =
        String(
          req.params.adminId ?? ""
        ).trim();

      const otp =
        String(
          req.body?.otp ?? ""
        ).trim();

      if (!adminId) {

        return res
          .status(400)
          .json({
            success: false,
            message:
              "Admin ID পাওয়া যায়নি",
          });
      }

      if (!otp) {

        return res
          .status(400)
          .json({
            success: false,
            message:
              "OTP দিন",
          });
      }

      const result =
        await verifyAdminEmailOTP(
          adminId,
          otp
        );

      /* ------------------------------------------------------------------ */
      /* Admin Not Found                                                    */
      /* ------------------------------------------------------------------ */

      if (
        !result.success &&
        result.reason ===
        "NOT_FOUND"
      ) {

        return res
          .status(404)
          .json({
            success: false,
            message:
              result.message,
          });
      }

      /* ------------------------------------------------------------------ */
      /* Expired                                                            */
      /* ------------------------------------------------------------------ */

      if (
        !result.success &&
        result.reason ===
        "EXPIRED"
      ) {

        return res
          .status(400)
          .json({
            success: false,
            message:
              result.message,
          });
      }

      /* ------------------------------------------------------------------ */
      /* Invalid OTP                                                        */
      /* ------------------------------------------------------------------ */

      if (
        !result.success &&
        result.reason ===
        "INVALID_OTP"
      ) {

        return res
          .status(400)
          .json({
            success: false,
            message:
              result.message,
          });
      }

      /* ------------------------------------------------------------------ */
      /* Maximum Attempts                                                   */
      /* ------------------------------------------------------------------ */

      if (
        !result.success &&
        result.reason ===
        "MAX_ATTEMPTS"
      ) {

        return res
          .status(429)
          .json({
            success: false,
            message:
              result.message,
          });
      }

      /* ------------------------------------------------------------------ */
      /* Already Verified                                                   */
      /* ------------------------------------------------------------------ */

      if (
        !result.success &&
        result.reason ===
        "ALREADY_VERIFIED"
      ) {

        return res
          .status(400)
          .json({
            success: false,
            message:
              result.message,
          });
      }

      /* ------------------------------------------------------------------ */
      /* Success                                                            */
      /* ------------------------------------------------------------------ */

      return res.json({
        success: true,
        message:
          result.message,
      });

    } catch (error) {

      console.error(
        "Verify admin email OTP route error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Gmail verification করা যায়নি",
        });
    }
  }
);

export default router;