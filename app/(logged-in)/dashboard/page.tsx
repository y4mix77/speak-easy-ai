import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import getDbConnection from "@/lib/db";
import BgGradient from "@/components/common/bg-gradient";
import { Badge } from "@/components/ui/badge";
import UpgradeYourPlan from "@/components/upload/upgrade-your-plan";
import { getPlanType } from "@/lib/user-helpers";
import dynamic from 'next/dynamic';

// Import the client component dynamically to avoid SSR issues
const UploadHandler = dynamic(() => import('@/components/upload/UploadHandler'), {
  ssr: false,
});

export default async function Dashboard() {
  const user = await currentUser();

  if (!user) {
    return redirect("/sign-in?error=user_deleted");
  }

  try {
    const sql = await getDbConnection();
    const userId = user.id;
    const userEmail = user.emailAddresses[0].emailAddress;

    // First try to get existing user info
    let userInfo = await sql`
      SELECT price_id, email, user_id
      FROM users 
      WHERE email = ${userEmail}
      OR user_id = ${userId}
    `;

    if (!userInfo?.length) {
      // Create new user if doesn't exist
      await sql`
        INSERT INTO users (user_id, email)
        VALUES (${userId}, ${userEmail})
      `;
      // Fetch the newly created user info
      userInfo = await sql`
        SELECT price_id, email 
        FROM users 
        WHERE user_id = ${userId}
      `;
    } else if (userInfo[0].user_id !== userId) {
      // Update the user_id if email exists but with different user_id
      // This handles the case where user's Clerk ID changed but email remained same
      await sql`
        UPDATE users 
        SET user_id = ${userId}
        WHERE email = ${userEmail}
      `;
    }

    const { price_id: priceId } = userInfo[0];
    const { id: planTypeId = "starter", name: planTypeName } = getPlanType(priceId);

    const isBasicPlan = planTypeId === "basic";
    const isProPlan = planTypeId === "pro";

    // Get post count
    const posts = await sql`
      SELECT COUNT(*) as count 
      FROM posts 
      WHERE user_id = ${userId}
    `;
    
    const postCount = posts[0]?.count || 0;
    const isValidBasicPlan = isBasicPlan && postCount < 3;

    return (
      <BgGradient>
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <Badge className="bg-gradient-to-r from-purple-700 to-pink-800 text-white px-4 py-1 text-lg font-semibold capitalize">
              {planTypeName} Plan
            </Badge>

            <h2 className="capitalize text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Start creating amazing content
            </h2>

            <p className="mt-2 text-lg leading-8 text-gray-600 max-w-2xl text-center">
              Upload your audio or video file and let our AI do the magic!
            </p>

            {(isBasicPlan || isProPlan) && (
              <p className="mt-2 text-lg leading-8 text-gray-600 max-w-2xl text-center">
                You get{" "}
                <span className="font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-md">
                  {isBasicPlan ? "3" : "Unlimited"} blog posts
                </span>{" "}
                as part of the{" "}
                <span className="font-bold capitalize">{planTypeName}</span> Plan.
              </p>
            )}

            {isValidBasicPlan || isProPlan ? (
              <UploadHandler />
            ) : (
              <UpgradeYourPlan />
            )}

            {/* Show posts count if on basic plan */}
            {isBasicPlan && (
              <div className="mt-4 text-sm text-gray-600">
                <p>
                  You have used {postCount} of 3 available posts.
                  {postCount >= 3 && (
                    <span className="text-amber-600 ml-2">
                      Upgrade to Pro for unlimited posts!
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </BgGradient>
    );
  } catch (error: unknown) {
    console.error('Error loading dashboard:', error);
    
    if (error instanceof Error && error.message?.includes('violates unique constraint')) {
      return redirect("/sign-in?error=user_deleted");
    }

    return redirect("/?error=dashboard_load_failed");
  }
}
