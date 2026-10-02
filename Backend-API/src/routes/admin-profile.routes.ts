import {
  Router,
} from "express";

import {
  getAdminProfile,
  updateAdminProfile,
} from "../services/admin-profile.service";

const router = Router();

/* ==========================================================================
   GET ADMIN PROFILE
   ========================================================================== */

router.get(
  "/:adminId",
  async (req, res) => {
    try {
      const adminId =
        String(
          req.params.adminId ?? ""
        ).trim();

      if (!adminId) {
        return res.status(400).json({
          success: false,
          message:
            "Admin ID পাওয়া যায়নি",
        });
      }

      const profile =
        await getAdminProfile(
          adminId
        );

      if (!profile) {
        return res.status(404).json({
          success: false,
          message:
            "Admin profile পাওয়া যায়নি",
        });
      }

      return res.json({
        success: true,
        message:
          "Admin profile retrieved successfully",
        profile,
      });
    } catch (error) {
      console.error(
        "Get admin profile error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Admin profile পাওয়া যায়নি",
      });
    }
  }
);

/* ==========================================================================
   UPDATE ADMIN PROFILE
   ========================================================================== */

router.put(
  "/:adminId",
  async (req, res) => {
    try {
      const adminId =
        String(
          req.params.adminId ?? ""
        ).trim();

      const adminName =
        String(
          req.body?.adminName ?? ""
        ).trim();

      const phone =
        String(
          req.body?.phone ?? ""
        ).trim();

      if (!adminId) {
        return res.status(400).json({
          success: false,
          message:
            "Admin ID পাওয়া যায়নি",
        });
      }

      const result =
        await updateAdminProfile(
          adminId,
          adminName,
          phone
        );

      /* ------------------------------------------------------------------ */
      /* Admin Not Found                                                    */
      /* ------------------------------------------------------------------ */

      if (
        !result.success &&
        result.reason ===
          "NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Admin profile পাওয়া যায়নি",
        });
      }

      /* ------------------------------------------------------------------ */
      /* Invalid Name                                                       */
      /* ------------------------------------------------------------------ */

      if (
        !result.success &&
        result.reason ===
          "INVALID_NAME"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "সঠিক নাম দিন",
        });
      }

      /* ------------------------------------------------------------------ */
      /* Invalid Phone                                                      */
      /* ------------------------------------------------------------------ */

      if (
        !result.success &&
        result.reason ===
          "INVALID_PHONE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "সঠিক বাংলাদেশি ফোন নম্বর দিন",
        });
      }

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message:
            "Profile update করা যায়নি",
        });
      }

      return res.json({
        success: true,
        message:
          "Profile updated successfully",
        profile:
          result.profile,
      });
    } catch (error) {
      console.error(
        "Update admin profile error:",
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

export default router;