import dotenv from "dotenv";
dotenv.config()
import express from "express";
import cors from "cors";


import memberAuthRoutes
  from "./routes/member-auth.routes";

import adminAuthRoutes
  from "./routes/admin-auth.routes";

import adminDashboardRoutes
  from "./routes/admin-dashboard.routes";

import adminRoutes
  from "./routes/admin.routes";

import adminProfileRoutes
  from "./routes/admin-profile.routes";

import adminEmailVerificationRoutes
  from "./routes/admin-email-verification.routes";

import adminMemberRoutes 
  from "./routes/admin-member.routes";

import adminEmailChangeRoutes
  from "./routes/admin-email-change.routes";

import adminPendingDepositRoutes 
  from "./routes/admin-pending-deposit.routes";


const app = express();


const PORT =
  Number(process.env.PORT) || 4000;


/* -------------------------------------------------------------------------- */
/* CORS                                                                       */
/* -------------------------------------------------------------------------- */

app.use(
  cors({
    origin: true,
  })
);


/* -------------------------------------------------------------------------- */
/* JSON BODY                                                                  */
/* -------------------------------------------------------------------------- */

app.use(
  express.json()
);


/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

app.get(
  "/",
  (_req, res) => {

    res.json({
      success: true,
      message:
        "Khudro Sanchoy API is running",
    });

  }
);


/* -------------------------------------------------------------------------- */
/* Health                                                                     */
/* -------------------------------------------------------------------------- */

app.get(
  "/api/health",
  (_req, res) => {

    res.json({
      success: true,
      message:
        "API is healthy",
    });

  }
);


/* -------------------------------------------------------------------------- */
/* Member Authentication                                                      */
/* -------------------------------------------------------------------------- */

app.use(
  "/api/mobile/auth",
  memberAuthRoutes
);


/* -------------------------------------------------------------------------- */
/* Admin Authentication                                                       */
/* -------------------------------------------------------------------------- */

app.use(
  "/api/admin/auth",
  adminAuthRoutes
);


/* -------------------------------------------------------------------------- */
/* Admin General Routes                                                       */
/* -------------------------------------------------------------------------- */

app.use(
  "/api/admin",
  adminRoutes
);


/* -------------------------------------------------------------------------- */
/* Admin Profile                                                              */
/* -------------------------------------------------------------------------- */

app.use(
  "/api/admin/profile",
  adminProfileRoutes
);


/* -------------------------------------------------------------------------- */
/* Admin Email Verification                                                   */
/* -------------------------------------------------------------------------- */

app.use(
  "/api/admin/email-verification",
  adminEmailVerificationRoutes
);

/* -------------------------------------------------------------------------- */
/* Admin Email Change                                                         */
/* -------------------------------------------------------------------------- */

app.use(
  "/api/admin/email-change",
  adminEmailChangeRoutes
);


/* -------------------------------------------------------------------------- */
/* Admin Dashboard                                                            */
/* -------------------------------------------------------------------------- */

app.use(
  "/api/admin/dashboard",
  adminDashboardRoutes
);

/* -------------------------------------------------------------------------- */
/* Pending Deposit                                                            */
/* -------------------------------------------------------------------------- */


app.use(
    "/api/admin/pending-deposits",
    adminPendingDepositRoutes
);

/* -------------------------------------------------------------------------- */
/* Admin Member Management                                                   */
/* -------------------------------------------------------------------------- */

app.use(
  "/api/admin/members",
  adminMemberRoutes
);

/* -------------------------------------------------------------------------- */
/* Server                                                                     */
/* -------------------------------------------------------------------------- */

if (require.main === module) {
  app.listen(
    PORT,
    "0.0.0.0",
    () => {

      console.log(
        `Khudro Sanchoy API running on http://localhost:${PORT}`
      );

    }
  );
}

export default app;