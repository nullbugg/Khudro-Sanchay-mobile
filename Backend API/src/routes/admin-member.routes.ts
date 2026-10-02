import {
  Router,
  Request,
  Response,
} from "express";

import {
  createMember,
   getAllMembers,
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


export default router;