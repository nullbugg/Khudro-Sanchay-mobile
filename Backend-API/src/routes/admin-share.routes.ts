import { Router } from "express";

import { adminAuthMiddleware } from "../middleware/admin-auth.middleware";

import {
    increaseMemberShares,
    decreaseMemberShares,
    previewMemberShareChange,
    getAdminShareHistory,
} from "../services/admin-share.service";

const router = Router();

router.use(adminAuthMiddleware);

/*
|--------------------------------------------------------------------------
| PREVIEW MEMBER SHARE CHANGE
|--------------------------------------------------------------------------
| POST /api/admin/share-management/preview
| Read-only: Does not modify Google Sheets
*/

router.post("/preview", async (req, res) => {
  try {
    const memberId = String(
      req.body?.memberId ?? ""
    ).trim().toUpperCase();

    const newShareCount = Number(
      req.body?.newShareCount
    );

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "Member ID দিতে হবে",
      });
    }

    if (
      !Number.isInteger(newShareCount) ||
      newShareCount < 1 ||
      newShareCount > 15
    ) {
      return res.status(400).json({
        success: false,
        message: "Share Count 1 থেকে 15 এর মধ্যে হতে হবে",
      });
    }

    const result = await previewMemberShareChange(
      memberId,
      newShareCount
    );

    if (!result.success) {
      return res.status(
        result.statusCode ?? 400
      ).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Preview member share change error:", error);

    return res.status(500).json({
      success: false,
      message: "Share Change Preview করা যায়নি",
    });
  }
});

/*
|--------------------------------------------------------------------------
| INCREASE MEMBER SHARES
|--------------------------------------------------------------------------
| POST /api/admin/share-management/increase
*/

router.post("/increase", async (req, res) => {
  try {
    const memberId = String(
      req.body?.memberId ?? ""
    ).trim().toUpperCase();

    const newShareCount = Number(
      req.body?.newShareCount
    );

    const adminId = String(
      req.admin?.adminId ?? ""
    ).trim();

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "Member ID দিতে হবে",
      });
    }

    if (
      !Number.isInteger(newShareCount) ||
      newShareCount < 1 ||
      newShareCount > 15
    ) {
      return res.status(400).json({
        success: false,
        message: "Share Count 1 থেকে 15 এর মধ্যে হতে হবে",
      });
    }

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Admin session পাওয়া যায়নি",
      });
    }

    const result = await increaseMemberShares(
      memberId,
      newShareCount,
      adminId
    );

    if (!result.success) {
      return res.status(
        result.statusCode ?? 400
      ).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Increase member shares error:", error);

    return res.status(500).json({
      success: false,
      message: "Share Increase করা যায়নি",
    });
  }
});

/*
|--------------------------------------------------------------------------
| DECREASE MEMBER SHARES
|--------------------------------------------------------------------------
| POST /api/admin/share-management/decrease
*/

router.post("/decrease", async (req, res) => {
  try {
    const memberId = String(
      req.body?.memberId ?? ""
    ).trim().toUpperCase();

    const newShareCount = Number(
      req.body?.newShareCount
    );

    const refundPaid =
      req.body?.refundPaid === true;

    const adminId = String(
      req.admin?.adminId ?? ""
    ).trim();

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "Member ID দিতে হবে",
      });
    }

    if (
      !Number.isInteger(newShareCount) ||
      newShareCount < 1 ||
      newShareCount > 15
    ) {
      return res.status(400).json({
        success: false,
        message: "Share Count 1 থেকে 15 এর মধ্যে হতে হবে",
      });
    }

    if (!refundPaid) {
      return res.status(400).json({
        success: false,
        message: "Refund সম্পন্ন না করে Share Decrease করা যাবে না",
      });
    }

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Admin session পাওয়া যায়নি",
      });
    }

    const result = await decreaseMemberShares(
      memberId,
      newShareCount,
      adminId
    );

    if (!result.success) {
      return res.status(
        result.statusCode ?? 400
      ).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Decrease member shares error:", error);

    return res.status(500).json({
      success: false,
      message: "Share Decrease করা যায়নি",
    });
  }
});

/*
|--------------------------------------------------------------------------
| Get Admin Share History
|--------------------------------------------------------------------------
*/

router.get("/history/:memberId", async (req, res) => {
    try {
        const memberId = String(
            req.params.memberId ?? ""
        ).trim().toUpperCase();

        if (!memberId) {
            return res.status(400).json({
                success: false,
                message: "সদস্য আইডি দিতে হবে",
            });
        }

        const result = await getAdminShareHistory(memberId);

        return res.status(result.statusCode ?? 200).json(result);

    } catch (error) {
        console.error(
            "Admin Share History Route Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Share History লোড করা যায়নি",
        });
    }
});

export default router;