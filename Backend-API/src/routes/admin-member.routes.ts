import {
  Router,
  Request,
  Response,
} from "express";

import {
  createMember,
  getAllMembers,
  getMemberDashboard,
  findMemberById,
  deleteMemberPermanently,
} from "../services/member.service";



const router =
  Router();


/*
|--------------------------------------------------------------------------
| CREATE MEMBER
|--------------------------------------------------------------------------
|
| POST /api/admin/members
|
| Body:
|
| {
|   memberId: string,
|   memberName: string,
|   phone: string,
|   joinDate: string,
|   shareCount: number
| }
|
| PIN Hash এখানে তৈরি হবে না।
| নতুন Member-এর G column খালি থাকবে।
|
|--------------------------------------------------------------------------
*/

router.get("/", async (_req: Request, res: Response) => {
  try {
    const members = await getAllMembers();

    return res.status(200).json({
      success: true,
      message: "Member list successfully fetched",
      members: members.map((member) => ({
        memberId: member.memberId,
        memberName: member.memberName,
        phone: member.phone,
        joinDate: member.joinDate,
        currentShareCount: member.currentShareCount,
        currentWeeklyAmount: member.currentWeeklyAmount,
        status: member.status,
      })),
    });
  } catch (error) {
    console.error("Get all members error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch members",
    });
  }
});



router.get("/:memberId", async (req: Request, res: Response) => {
  try {
    const memberId = String(req.params.memberId ?? "").trim();

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "Member ID দিতে হবে।",
      });
    }

    const dashboard = await getMemberDashboard(memberId);

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: "এই Member ID-এর কোনো সদস্য পাওয়া যায়নি।",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Member details successfully fetched",
      member: dashboard.member,
      summary: dashboard.summary,
    });
  } catch (error) {
    console.error("Get member details error:", error);

    return res.status(500).json({
      success: false,
      message: "সদস্যের বিস্তারিত তথ্য আনতে server error হয়েছে।",
    });
  }
});



router.post(
  "/",
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const {
        memberId,
        memberName,
        phone,
        joinDate,
        shareCount,
      } = req.body;


      /*
       * ---------------------------------------------------------------
       * Basic validation
       * ---------------------------------------------------------------
       */

      if (
        !memberId ||
        !memberName ||
        !phone ||
        !joinDate ||
        shareCount === undefined ||
        shareCount === null
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Member-এর সব তথ্য দিতে হবে।",

        });
      }


      /*
       * ---------------------------------------------------------------
       * Share validation
       * ---------------------------------------------------------------
       */

      const numericShareCount =
        Number(
          shareCount
        );


      if (
        !Number.isInteger(
          numericShareCount
        ) ||
        numericShareCount < 1 ||
        numericShareCount > 15
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Share সংখ্যা ১ থেকে ১৫ এর মধ্যে হতে হবে।",

        });
      }


      /*
       * ---------------------------------------------------------------
       * Create Member
       * ---------------------------------------------------------------
       */

      const member =
        await createMember(

          String(
            memberId
          ),

          String(
            memberName
          ),

          String(
            phone
          ),

          String(
            joinDate
          ),

          numericShareCount

        );


      /*
       * ---------------------------------------------------------------
       * Success
       * ---------------------------------------------------------------
       */

      return res.status(201).json({

        success: true,

        message:
          "Member সফলভাবে তৈরি হয়েছে।",

        member: {

          memberId:
            member.memberId,

          memberName:
            member.memberName,

          phone:
            member.phone,

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
        "Create member error:",
        error
      );


      /*
       * ---------------------------------------------------------------
       * Known errors
       * ---------------------------------------------------------------
       */

      if (
        error instanceof Error
      ) {

        const message =
          error.message;


        /*
         * Duplicate Member ID
         */

        if (
          message ===
          "Member ID already exists"
        ) {

          return res.status(409).json({

            success: false,

            message:
              "এই Member ID ইতিমধ্যে রয়েছে।",

          });
        }


        /*
         * Validation errors
         */

        if (
          message ===
          "Member ID is required" ||
          message ===
          "Member name is required" ||
          message ===
          "Phone number is required" ||
          message ===
          "Join date is required"
        ) {

          return res.status(400).json({

            success: false,

            message:
              message,

          });
        }


        /*
         * Share validation
         */

        if (
          message ===
          "Share count must be between 1 and 15"
        ) {

          return res.status(400).json({

            success: false,

            message:
              "Share সংখ্যা ১ থেকে ১৫ এর মধ্যে হতে হবে।",

          });
        }

      }


      /*
       * ---------------------------------------------------------------
       * Server error
       * ---------------------------------------------------------------
       */

      return res.status(500).json({

        success: false,

        message:
          "Member তৈরি করার সময় server error হয়েছে।",

      });

    }
  }
);



/*
|--------------------------------------------------------------------------
| DELETE MEMBER PERMANENTLY
|--------------------------------------------------------------------------
|
| DELETE /api/admin/members/:memberId
|
| Removes the member and matching rows from:
| - Members
| - Collections
| - Pending Deposits
|
|--------------------------------------------------------------------------
*/

router.delete(
  "/:memberId",
  async (req: Request, res: Response) => {
    try {
      const memberId = String(
        req.params.memberId ?? ""
      ).trim();

      if (!memberId) {
        return res.status(400).json({
          success: false,
          code: "INVALID_MEMBER_ID",
          message: "Member ID দিতে হবে।",
        });
      }

      const result =
        await deleteMemberPermanently(memberId);

      if (!result.success) {
        if (result.code === "MEMBER_NOT_FOUND") {
          return res.status(404).json({
            success: false,
            code: result.code,
            message: "এই Member ID-এর কোনো সদস্য পাওয়া যায়নি।",
          });
        }

        if (result.code === "DUPLICATE_MEMBER_ID") {
          return res.status(409).json({
            success: false,
            code: result.code,
            message:
              "এই Member ID একাধিকবার রয়েছে। নিরাপত্তার জন্য Delete করা হয়নি।",
          });
        }

        return res.status(400).json({
          success: false,
          code: result.code,
          message: "Member ID সঠিক নয়।",
        });
      }

      return res.status(200).json({
        success: true,
        code: result.code,
        message: "Member সফলভাবে Delete করা হয়েছে।",
        deleted: result.deleted,
      });
    } catch (error) {
      console.error(
        "Permanently delete member error:",
        error
      );

      return res.status(500).json({
        success: false,
        code: "DELETE_MEMBER_FAILED",
        message:
          "Member Delete করার সময় server error হয়েছে।",
      });
    }
  }
);


export default router;