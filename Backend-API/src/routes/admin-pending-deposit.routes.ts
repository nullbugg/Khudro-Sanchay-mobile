import {
    Router,
} from "express";

import {
    getPendingAdminDeposits,
    approvePendingAdminDeposit,
    rejectPendingAdminDeposit,
} from "../services/admin.service";

import {
    adminAuthMiddleware,
} from "../middleware/admin-auth.middleware";

const router = Router();


// ============================================================
// GET PENDING DEPOSITS
// GET /api/admin/pending-deposits
// ============================================================

router.get(
    "/",
    adminAuthMiddleware,
    async (_req, res) => {
        try {
            const pendingDeposits =
                await getPendingAdminDeposits();

            return res.json({
                success: true,
                message:
                    "Pending deposits retrieved successfully",
                data: pendingDeposits,
                count:
                    pendingDeposits.length,
            });
        } catch (error) {
            console.error(
                "Get pending deposits error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Pending deposits পাওয়া যায়নি",
                code:
                    "PENDING_DEPOSITS_FETCH_FAILED",
            });
        }
    }
);


// ============================================================
// APPROVE PENDING DEPOSIT
// POST /api/admin/pending-deposits/:requestId/approve
// ============================================================

router.post(
    "/:requestId/approve",
    adminAuthMiddleware,
    async (req, res) => {
        try {

            const requestId =
                String(
                    req.params.requestId || ""
                ).trim();


            const adminId =
                req.admin?.adminId || "";


            if (!requestId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Request ID প্রয়োজন",
                    code:
                        "REQUEST_ID_REQUIRED",
                });
            }


            if (!adminId) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Admin identity পাওয়া যায়নি",
                    code:
                        "ADMIN_ID_MISSING",
                });
            }


            const result =
                await approvePendingAdminDeposit(
                    requestId,
                    adminId
                );


            return res.status(200).json({
                success: true,
                message:
                    "Deposit request approved successfully",
                data: result,
            });

        } catch (error) {

            console.error(
                "Approve pending deposit error:",
                error
            );


            const errorMessage =
                error instanceof Error
                    ? error.message
                    : String(error);


            // ------------------------------------------------
            // Request not found
            // ------------------------------------------------

            if (
                errorMessage ===
                "REQUEST_NOT_FOUND"
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Deposit request পাওয়া যায়নি",
                    code:
                        "REQUEST_NOT_FOUND",
                });
            }


            // ------------------------------------------------
            // Already approved
            // ------------------------------------------------

            if (
                errorMessage ===
                "REQUEST_ALREADY_APPROVED"
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        "এই deposit request ইতোমধ্যে approve করা হয়েছে",
                    code:
                        "REQUEST_ALREADY_APPROVED",
                });
            }


            // ------------------------------------------------
            // Already rejected
            // ------------------------------------------------

            if (
                errorMessage ===
                "REQUEST_ALREADY_REJECTED"
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        "এই deposit request ইতোমধ্যে reject করা হয়েছে",
                    code:
                        "REQUEST_ALREADY_REJECTED",
                });
            }


            // ------------------------------------------------
            // Already processed
            // ------------------------------------------------

            if (
                errorMessage ===
                "REQUEST_ALREADY_PROCESSED"
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        "এই deposit request ইতোমধ্যে process করা হয়েছে",
                    code:
                        "REQUEST_ALREADY_PROCESSED",
                });
            }


            // ------------------------------------------------
            // Member errors
            // ------------------------------------------------

            if (
                errorMessage ===
                "MEMBER_NOT_FOUND"
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Member পাওয়া যায়নি",
                    code:
                        "MEMBER_NOT_FOUND",
                });
            }


            if (
                errorMessage ===
                "INACTIVE_MEMBER"
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Inactive member-এর deposit approve করা যাবে না",
                    code:
                        "INACTIVE_MEMBER",
                });
            }


            // ------------------------------------------------
            // Validation errors
            // ------------------------------------------------

            if (
                errorMessage ===
                    "MEMBER_ID_MISSING" ||
                errorMessage ===
                    "INVALID_DEPOSIT_AMOUNT" ||
                errorMessage ===
                    "INVALID_WEEKLY_AMOUNT" ||
                errorMessage ===
                    "DEPOSIT_ALLOCATION_FAILED"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Deposit request-এর তথ্য সঠিক নয়",
                    code:
                        errorMessage,
                });
            }


            // ------------------------------------------------
            // Default error
            // ------------------------------------------------

            return res.status(500).json({
                success: false,
                message:
                    "Deposit request approve করা যায়নি",
                code:
                    "PENDING_DEPOSIT_APPROVAL_FAILED",
            });
        }
    }
);

// ============================================================
// REJECT PENDING DEPOSIT
// POST /api/admin/pending-deposits/:requestId/reject
// ============================================================

router.post(
    "/:requestId/reject",
    adminAuthMiddleware,
    async (req, res) => {
        try {

            const requestId =
                String(
                    req.params.requestId || ""
                ).trim();


            const adminId =
                req.admin?.adminId || "";


            const notes =
                String(
                    req.body?.notes || ""
                ).trim();


            if (!requestId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Request ID প্রয়োজন",
                    code:
                        "REQUEST_ID_REQUIRED",
                });
            }


            if (!adminId) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Admin identity পাওয়া যায়নি",
                    code:
                        "ADMIN_ID_MISSING",
                });
            }


            const result =
                await rejectPendingAdminDeposit(
                    requestId,
                    adminId,
                    notes
                );


            return res.status(200).json({
                success: true,
                message:
                    "Deposit request rejected successfully",
                data: result,
            });

        } catch (error) {

            console.error(
                "Reject pending deposit error:",
                error
            );


            const errorMessage =
                error instanceof Error
                    ? error.message
                    : String(error);


            if (
                errorMessage ===
                "REQUEST_NOT_FOUND"
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Deposit request পাওয়া যায়নি",
                    code:
                        "REQUEST_NOT_FOUND",
                });
            }


            if (
                errorMessage ===
                "REQUEST_ALREADY_APPROVED"
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        "এই deposit request ইতোমধ্যে approve করা হয়েছে",
                    code:
                        "REQUEST_ALREADY_APPROVED",
                });
            }


            if (
                errorMessage ===
                "REQUEST_ALREADY_REJECTED"
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        "এই deposit request ইতোমধ্যে reject করা হয়েছে",
                    code:
                        "REQUEST_ALREADY_REJECTED",
                });
            }


            if (
                errorMessage ===
                    "MEMBER_ID_MISSING" ||
                errorMessage ===
                    "INVALID_REQUEST_STATUS"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Deposit request-এর তথ্য সঠিক নয়",
                    code:
                        errorMessage,
                });
            }


            return res.status(500).json({
                success: false,
                message:
                    "Deposit request reject করা যায়নি",
                code:
                    "PENDING_DEPOSIT_REJECTION_FAILED",
            });
        }
    }
);


export default router;