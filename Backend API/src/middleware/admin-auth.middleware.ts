import {
    createHmac,
    timingSafeEqual,
} from "crypto";

import {
    NextFunction,
    Request,
    Response,
} from "express";


/* ==========================================================================
   ADMIN SESSION CONFIG
   ========================================================================== */

const ADMIN_SESSION_SECRET =
    process.env.ADMIN_SESSION_SECRET || "";

const DEFAULT_SESSION_EXPIRES_IN =
    24 * 60 * 60;


/* ==========================================================================
   ADMIN SESSION PAYLOAD
   ========================================================================== */

export interface AdminSessionPayload {
    adminId: string;
    role: string;
    iat: number;
    exp: number;
}


/* ==========================================================================
   EXPRESS REQUEST TYPE
   ========================================================================== */

declare global {
    namespace Express {
        interface Request {
            admin?: AdminSessionPayload;
        }
    }
}


/* ==========================================================================
   BASE64URL HELPERS
   ========================================================================== */

function base64UrlEncode(
    value: string
): string {

    return Buffer
        .from(value, "utf8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}


function base64UrlDecode(
    value: string
): string {

    const base64 =
        value
            .replace(/-/g, "+")
            .replace(/_/g, "/");

    const padding =
        base64.length % 4;

    const padded =
        padding
            ? base64 + "=".repeat(4 - padding)
            : base64;

    return Buffer
        .from(padded, "base64")
        .toString("utf8");
}


/* ==========================================================================
   CREATE SIGNATURE
   ========================================================================== */

function createSignature(
    payloadPart: string
): string {

    if (!ADMIN_SESSION_SECRET) {
        throw new Error(
            "ADMIN_SESSION_SECRET is not configured"
        );
    }

    return createHmac(
        "sha256",
        ADMIN_SESSION_SECRET
    )
        .update(payloadPart)
        .digest("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}


/* ==========================================================================
   CREATE ADMIN SESSION TOKEN
   ========================================================================== */

export function createAdminSessionToken(
    adminId: string,
    role: string,
    expiresIn: number =
        DEFAULT_SESSION_EXPIRES_IN
): string {

    if (!ADMIN_SESSION_SECRET) {
        throw new Error(
            "ADMIN_SESSION_SECRET is not configured"
        );
    }

    const now =
        Math.floor(
            Date.now() / 1000
        );

    const payload: AdminSessionPayload = {
        adminId: String(adminId).trim(),
        role: String(role).trim().toUpperCase(),
        iat: now,
        exp: now + expiresIn,
    };

    const payloadPart =
        base64UrlEncode(
            JSON.stringify(payload)
        );

    const signature =
        createSignature(
            payloadPart
        );

    return `${payloadPart}.${signature}`;
}


/* ==========================================================================
   VERIFY ADMIN SESSION TOKEN
   ========================================================================== */

export function verifyAdminSessionToken(
    token: string
): AdminSessionPayload | null {

    try {

        if (!ADMIN_SESSION_SECRET) {
            console.error(
                "ADMIN_SESSION_SECRET is not configured"
            );

            return null;
        }

        const parts =
            String(token || "").split(".");

        if (parts.length !== 2) {
            return null;
        }

        const [
            payloadPart,
            receivedSignature,
        ] = parts;

        if (
            !payloadPart ||
            !receivedSignature
        ) {
            return null;
        }

        const expectedSignature =
            createSignature(
                payloadPart
            );

        const receivedBuffer =
            Buffer.from(
                receivedSignature,
                "utf8"
            );

        const expectedBuffer =
            Buffer.from(
                expectedSignature,
                "utf8"
            );

        if (
            receivedBuffer.length !==
            expectedBuffer.length
        ) {
            return null;
        }

        if (
            !timingSafeEqual(
                receivedBuffer,
                expectedBuffer
            )
        ) {
            return null;
        }

        const payload =
            JSON.parse(
                base64UrlDecode(
                    payloadPart
                )
            ) as AdminSessionPayload;

        if (
            !payload ||
            typeof payload !== "object"
        ) {
            return null;
        }

        if (
            typeof payload.adminId !==
            "string" ||
            !payload.adminId.trim()
        ) {
            return null;
        }

        if (
            typeof payload.role !==
            "string"
        ) {
            return null;
        }

        if (
            payload.role
                .trim()
                .toUpperCase() !==
            "ADMIN"
        ) {
            return null;
        }

        const now =
            Math.floor(
                Date.now() / 1000
            );

        if (
            typeof payload.exp !==
                "number" ||
            payload.exp <= now
        ) {
            return null;
        }

        if (
            typeof payload.iat !==
                "number"
        ) {
            return null;
        }

        return {
            adminId:
                payload.adminId.trim(),

            role:
                payload.role
                    .trim()
                    .toUpperCase(),

            iat:
                payload.iat,

            exp:
                payload.exp,
        };

    } catch (error) {

        console.error(
            "Admin session token verification error:",
            error
        );

        return null;
    }
}


/* ==========================================================================
   ADMIN AUTH MIDDLEWARE
   ========================================================================== */

export function adminAuthMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {

    try {

        const authorization =
            req.headers.authorization;

        if (
            !authorization ||
            !authorization.startsWith(
                "Bearer "
            )
        ) {

            res.status(401).json({
                success: false,
                message:
                    "Admin authentication required",
                code:
                    "ADMIN_AUTH_REQUIRED",
            });

            return;
        }

        const token =
            authorization
                .slice(7)
                .trim();

        if (!token) {

            res.status(401).json({
                success: false,
                message:
                    "Admin session token পাওয়া যায়নি",
                code:
                    "ADMIN_TOKEN_MISSING",
            });

            return;
        }

        const admin =
            verifyAdminSessionToken(
                token
            );

        if (!admin) {

            res.status(401).json({
                success: false,
                message:
                    "Admin session token invalid অথবা expired",
                code:
                    "ADMIN_TOKEN_INVALID",
            });

            return;
        }

        req.admin = admin;

        next();

    } catch (error) {

        console.error(
            "Admin auth middleware error:",
            error
        );

        res.status(401).json({
            success: false,
            message:
                "Admin authentication failed",
            code:
                "ADMIN_AUTH_FAILED",
        });

        return;
    }
}

