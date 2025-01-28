// convex/users.ts
import { internalMutation, query, QueryCtx } from "./_generated/server";
import { UserJSON } from "@clerk/backend";
import { v, Validator } from "convex/values";

// Query to get the current user
export const current = query({
    args: {},
    handler: async (ctx) => {
        return await getCurrentUser(ctx);
    },
});

// Mutation to upsert user data from Clerk
export const upsertFromClerk = internalMutation({
    args: { data: v.any() as Validator<UserJSON> },
    async handler(ctx, { data }) {
        const userAttributes = {
            firstName: data.first_name ?? "",
            lastName: data.last_name ?? "",
            clerkUserId: data.id ?? "",
            email: data.email_addresses[0]?.email_address ?? "",
            imageUrl: data.image_url ?? "",
        };

        const user = await userByExternalId(ctx, data.id);
        if (user === null) {
            await ctx.db.insert("users", userAttributes);
        } else {
            await ctx.db.patch(user._id, userAttributes);
        }
    },
});

// Mutation to delete a user from Convex
export const deleteFromClerk = internalMutation({
    args: { clerkUserId: v.string() },
    async handler(ctx, { clerkUserId }) {
        const user = await userByExternalId(ctx, clerkUserId);

        if (user !== null) {
            await ctx.db.delete(user._id);
        } else {
            console.warn(`Can't delete user; no record for Clerk user ID: ${clerkUserId}`);
        }
    },
});

// Helper function to get the current user
export async function getCurrentUser(ctx: QueryCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) return null;
    return await userByExternalId(ctx, identity.subject);
}

// Helper function to fetch user by external ID
async function userByExternalId(ctx: QueryCtx, externalId: string) {
    return await ctx.db
        .query("users")
        .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", externalId))
        .unique();
}