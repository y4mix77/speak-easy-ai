"use server";
import getDbConnection from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Add retry utility function
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${i + 1} failed:`, error);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
}

// Function to wait for transcription to complete
async function waitForTranscription(transcriptId: string, apiKey: string): Promise<any> {
  const pollingEndpoint = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;
  
  while (true) {
    const response = await fetch(pollingEndpoint, {
      headers: {
        "Authorization": apiKey
      }
    });

    const transcriptionResult = await response.json();

    if (transcriptionResult.status === "completed") {
      return transcriptionResult;
    } else if (transcriptionResult.status === "error") {
      throw new Error(`Transcription failed: ${transcriptionResult.error}`);
    }

    // Wait for 3 seconds before polling again
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

export async function transcribeUploadedFile(
  resp: {
    serverData: { userId: string; file: any };
  }[]
) {
  if (!resp) {
    return {
      success: false,
      message: "File upload failed",
      data: null,
    };
  }

  const {
    serverData: {
      userId,
      file: { url: fileUrl, name: fileName },
    },
  } = resp[0];

  if (!fileUrl || !fileName) {
    return {
      success: false,
      message: "File upload failed",
      data: null,
    };
  }

  try {
    // First, submit the audio file URL to AssemblyAI
    const response = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        "Authorization": process.env.ASSEMBLYAI_API_KEY || '',
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        audio_url: fileUrl,
        language_code: "en"
      })
    });

    if (!response.ok) {
      throw new Error(`AssemblyAI API error: ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('Transcription initiated:', responseData);

    // Wait for the transcription to complete
    const transcriptionResult = await waitForTranscription(
      responseData.id,
      process.env.ASSEMBLYAI_API_KEY || ''
    );

    console.log('Transcription completed:', transcriptionResult);

    // Save transcription to database
    const sql = await getDbConnection();
    const [savedTranscription] = await sql`
      INSERT INTO transcriptions (user_id, text, original_filename, file_url)
      VALUES (${userId}, ${transcriptionResult.text}, ${fileName}, ${fileUrl})
      RETURNING id
    `;

    return {
      success: true,
      message: "File transcribed successfully!",
      data: { 
        transcriptionId: savedTranscription.id,
        transcriptions: { text: transcriptionResult.text },
        userId 
      },
    };
  } catch (error) {
    console.error("Error processing file", error);

    return {
      success: false,
      message: error instanceof Error ? error.message : "Error processing file",
      data: null,
    };
  }
}

async function saveBlogPost(userId: string, title: string, content: string) {
  try {
    const sql = await getDbConnection();
    const [insertedPost] = await sql`
    INSERT INTO posts (user_id, title, content)
    VALUES (${userId}, ${title}, ${content})
    RETURNING id
    `;
    return insertedPost.id;
  } catch (error) {
    console.error("Error saving blog post", error);
    throw error;
  }
}

async function getUserBlogPosts(userId: string) {
  try {
    const sql = await getDbConnection();
    const posts = await sql`
    SELECT content FROM posts 
    WHERE user_id = ${userId} 
    ORDER BY created_at DESC 
    LIMIT 3
  `;
    return posts.map((post) => post.content).join("\n\n");
  } catch (error) {
    console.error("Error getting user blog posts", error);
    throw error;
  }
}

async function generateBlogPost({
  transcriptions,
  userPosts,
}: {
  transcriptions: string;
  userPosts: string;
}) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a skilled content writer that converts audio transcriptions into well-structured, engaging blog posts in Markdown format. Create a comprehensive blog post with a catchy title, introduction, main body with multiple sections, and a conclusion. Analyze the user's writing style from their previous posts and emulate their tone and style in the new post. Keep the tone casual and professional.",
        },
        {
          role: "user",
          content: `Here are some of my previous blog posts for reference:

${userPosts}

Please convert the following transcription into a well-structured blog post using Markdown formatting. Follow this structure:

1. Start with a SEO friendly catchy title on the first line.
2. Add two newlines after the title.
3. Write an engaging introduction paragraph.
4. Create multiple sections for the main content, using appropriate headings (##, ###).
5. Include relevant subheadings within sections if needed.
6. Use bullet points or numbered lists where appropriate.
7. Add a conclusion paragraph at the end.
8. Ensure the content is informative, well-organized, and easy to read.
9. Emulate my writing style, tone, and any recurring patterns you notice from my previous posts.

Here's the transcription to convert: ${transcriptions}`,
        },
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0].message.content;
  } catch (error: any) {
    console.error("OpenAI API error:", error);

    // If it's a quota exceeded error, provide a basic formatted version of the transcription
    if (error?.status === 429) {
      const lines = transcriptions.split('.');
      const title = lines[0].trim();
      
      return `# ${title}

## Introduction

${lines[0]}.

## Main Content

${lines.slice(1, -1).join('.')}

## Conclusion

${lines[lines.length - 1]}.`;
    }

    // For other errors, rethrow
    throw error;
  }
}

export async function generateBlogPostAction({
  transcriptions,
  userId,
}: {
  transcriptions: { text: string };
  userId: string;
}) {
  const userPosts = await getUserBlogPosts(userId);

  let postId = null;

  if (transcriptions) {
    const blogPost = await generateBlogPost({
      transcriptions: transcriptions.text,
      userPosts,
    });

    if (!blogPost) {
      return {
        success: false,
        message: "Blog post generation failed, please try again...",
      };
    }

    const [title, ...contentParts] = blogPost?.split("\n\n") || [];

    //database connection

    if (blogPost) {
      postId = await saveBlogPost(userId, title, blogPost);
    }
  }

  //navigate
  revalidatePath(`/posts/${postId}`);
  redirect(`/posts/${postId}`);
}
