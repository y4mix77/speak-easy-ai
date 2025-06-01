import ContentEditor from "@/components/content/content-editor";
import getDbConnection from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type Post = {
  content: string;
  title: string;
  id: string;
  video_url?: string;
  user_id: string;
  created_at?: Date;
  updated_at?: Date;
};

export default async function PostsPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const user = await currentUser();

  // If no user is found, redirect to sign-in
  if (!user) {
    return redirect("/sign-in?error=user_deleted");
  }

  try {
    const sql = await getDbConnection();

    // First check if the post exists and belongs to the user
    const postCheck = await sql`
      SELECT id FROM posts 
      WHERE id = ${id} AND user_id = ${user.id}
    `;

    if (!postCheck?.length) {
      return redirect("/dashboard?error=post_not_found");
    }

    // Get the post data
    const result = await sql`
      SELECT p.*, t.file_url as video_url 
      FROM posts p 
      LEFT JOIN transcriptions t ON t.user_id = p.user_id 
      WHERE p.id = ${id} AND p.user_id = ${user.id}
      ORDER BY t.created_at DESC
      LIMIT 1
    `;

    // Ensure the result matches the expected type
    const posts: Post[] = result.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      user_id: post.user_id,
      video_url: post.video_url,
      created_at: post.created_at,
      updated_at: post.updated_at
    }));

    return (
      <div className="mx-auto w-full max-w-screen-xl px-2.5 lg:px-0 mb-12 mt-28">
        <ContentEditor posts={posts} />
      </div>
    );
  } catch (error) {
    console.error('Error loading post:', error);
    return redirect("/dashboard?error=load_failed");
  }
}
