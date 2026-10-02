import {
  Router,
} from "express";

import {
  getAdminDashboardData,
} from "../services/admin-dashboard.service";

import {
  adminAuthMiddleware,
} from "../middleware/admin-auth.middleware";

const router = Router();

/*
|--------------------------------------------------------------------------
| ADMIN DASHBOARD
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  adminAuthMiddleware,
  async (_req, res) => {
    try {
      const dashboard =
        await getAdminDashboardData();

      return res.json({
        success: true,

        message:
          "Admin dashboard data retrieved successfully",

        data: dashboard,
      });
    } catch (error) {
      console.error(
        "Admin dashboard error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Admin dashboard data পাওয়া যায়নি",
      });
    }
  }
);

export default router;