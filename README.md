# Step-by-Step Guide

Follow these steps to set up your project and get it running:

---

### 1. **Clone the Template Repository**

Start by cloning the template repository to your local machine. This repository contains the foundational code you'll build upon.

Run the following command to clone the repository:
```bash
git clone https://github.com/Ve2s4/handout-template.git
```

Once cloned, navigate to the project directory:
```bash
cd handout-template
```

---

### 2. **Set Up Convex**

Convex is the backend service used in this project. Follow these steps to initialize it:

1. Install Convex using `pnpm`:
   ```bash
   pnpm i convex
   ```
2. Start the Convex development server:
   ```bash
   pnpm dlx convex dev
   ```
   Keep this command running during development to ensure your backend code is synced and TypeScript types stay up-to-date.

For more details on Convex, check out their [Next.js quickstart guide](https://docs.convex.dev/quickstart/nextjs).

---

### 3. **Set Up Clerk for Authentication**

Clerk is the authentication service for this project. Follow these steps to integrate Clerk:

1. Sign up on the Clerk platform [here](https://dashboard.clerk.com/sign-up).
2. After creating your project on Clerk, copy the **Publishable Key** and **Secret Key** from the Clerk dashboard.
3. Create a `.env.local` file in the root of your project (if it doesn’t already exist) and add the following environment variables:
   ```text
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-publishable-key
   CLERK_SECRET_KEY=your-secret-key
   ```

4. Create a **JWT Template** in the Clerk dashboard:
   - Use the **Issuer URL** provided by Clerk.
   - **Do not** rename the JWT token; it must be named `convex` for this project to work correctly.

---

### 4. **Configure Authentication**

Create a file named `auth.config.ts` in the root of your project and add the following code:  
This ensures that Convex recognizes the Clerk JWT for authentication.

```ts
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
```

---

### 5. **Sync and Test Your Setup**

1. Ensure the Convex development server is running:
   ```bash
   pnpm dlx convex dev
   ```
   Keeping this running is recommended throughout development. It helps in syncing backend code changes and keeping your TypeScript types up-to-date.

2. Verify the integration by starting your Next.js development server:
   ```bash
   pnpm run dev
   ```

3. Open your project in a browser (usually at `http://localhost:3000`) and test the authentication flow.

### 6. User Synchronization Between Clerk and Convex

#### **1. Syncing Clerk Users with Convex**
Head over to the [Convex documentation](https://docs.convex.dev/auth/database-auth) to learn more about syncing users between Clerk and Convex. Follow these steps to configure the synchronization:

1. **Set the Endpoint URL in Clerk:**
   - Format: `https://<your deployment name>.convex.site/clerk-users-webhook`  
     Example: `https://happy-horse-123.convex.site/clerk-users-webhook`  
     *(Note: The domain should end in `.site`, not `.cloud`.)*

2. **Copy the Signing Secret:**
   - After saving the endpoint, copy the **Signing Secret** provided in the Clerk dashboard (it starts with `whsec_`).
   - Add the Signing Secret to your Convex environment variables by setting:
     ```text
     CLERK_WEBHOOK_SECRET=<Your Clerk Signing Secret>
     ```

---

#### **2. Define the User Schema**

1. Create a `schema.ts` file to define the schema for storing user data:
   ```ts
   import { defineSchema, defineTable } from "convex/server";
   import { v } from "convex/values";

   export default defineSchema({
     users: defineTable({
       email: v.string(),
       clerkUserId: v.string(),
       firstName: v.string(),
       lastName: v.string(),
       imageUrl: v.string(),
     }).index("byClerkUserId", ["clerkUserId"]),
   });
   ```

---

#### **3. Define User Management Functions**

1. Create a `users.ts` file to handle user operations:
   ```ts
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
   ```

---

#### **4. Set Up the HTTP Endpoint**

1. Create an `http.ts` file to handle Clerk webhook events:
   ```ts
   // convex/http.ts
   import { httpRouter } from "convex/server";
   import { httpAction } from "./_generated/server";
   import { internal } from "./_generated/api";
   import type { WebhookEvent } from "@clerk/backend";
   import { Webhook } from "svix";

   const http = httpRouter();

   http.route({
     path: "/clerk-users-webhook",
     method: "POST",
     handler: httpAction(async (ctx, request) => {
       const event = await validateRequest(request);
       if (!event) {
         return new Response("Error occurred", { status: 400 });
       }

       switch (event.type) {
         case "user.created":
         case "user.updated":
           await ctx.runMutation(internal.users.upsertFromClerk, { data: event.data });
           break;

         case "user.deleted":
           const clerkUserId = event.data.id!;
           await ctx.runMutation(internal.users.deleteFromClerk, { clerkUserId });
           break;

         default:
           console.log("Ignored Clerk webhook event", event.type);
       }

       return new Response(null, { status: 200 });
     }),
   });

   async function validateRequest(req: Request): Promise<WebhookEvent | null> {
     const payloadString = await req.text();
     const svixHeaders = {
       "svix-id": req.headers.get("svix-id")!,
       "svix-timestamp": req.headers.get("svix-timestamp")!,
       "svix-signature": req.headers.get("svix-signature")!,
     };

     const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
     try {
       return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
     } catch (error) {
       console.error("Error verifying webhook event", error);
       return null;
     }
   }

   export default http;
   ```

   **Explanation:**
   - This code exposes an HTTP endpoint `/clerk-users-webhook` that listens for events from Clerk (e.g., `user.created`, `user.updated`, `user.deleted`).
   - It validates incoming webhook requests using the `CLERK_WEBHOOK_SECRET`.
   - Based on the event type, it either updates or deletes user data in the Convex database.
   - The webhook for Clerk users runs on your Convex deployment's.

---

   
   
