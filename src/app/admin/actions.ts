"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { verifySessionJWT, hashPassword, createSessionJWT, getCookieName } from "@/lib/auth";
import { createMovie, updateMovie, deleteMovie, upsertShows } from "@/lib/db";

async function requireAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(getCookieName());
  const secret = process.env.SESSION_SECRET;

  if (!sessionCookie || !secret) {
    return false;
  }

  return await verifySessionJWT(sessionCookie.value, secret);
}

export type LoginState = { error: string };

export async function loginAction(prevState: LoginState, formData: FormData): Promise<LoginState> {
  let success = false;
  try {
    const password = formData.get("password");
    if (typeof password !== "string" || !password.trim()) {
      return { error: "Please enter your password." };
    }

    const expectedHash = process.env.ADMIN_PASSWORD_HASH;
    const secret = process.env.SESSION_SECRET;

    if (!expectedHash || !secret) {
      console.error("Authentication failed: Missing Cloudflare secrets.");
      return { error: "Something went wrong. Please try again." };
    }

    const inputHash = await hashPassword(password);
    
    if (inputHash === expectedHash) {
      const token = await createSessionJWT(secret);
      const cookieStore = await cookies();
      cookieStore.set({
        name: getCookieName(),
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 8 * 60 * 60, // 8 hours
        path: "/admin",
      });
      
      success = true;
    } else {
      return { error: "Incorrect password. Please try again." };
    }
  } catch (err) {
    console.error("Unexpected authentication error:", err);
    return { error: "Something went wrong. Please try again." };
  }

  if (success) {
    redirect("/admin/dashboard");
  }

  return { error: "" };
}

export async function saveTrailerAction(movieId: number, url: string) {
  await requireAuth();
  const { extractYouTubeId } = await import('@/lib/youtube-parser');
  const videoId = extractYouTubeId(url);
  
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  const { env } = getCloudflareContext();
  const db = env.DB as unknown as import("@cloudflare/workers-types").D1Database;
  await db.prepare(
    "UPDATE movies SET youtube_trailer_id = ?, youtube_trailer_is_manual_override = 1, updated_at = datetime('now') WHERE id = ?"
  ).bind(videoId, movieId).run();

  revalidatePath("/admin/dashboard");
  revalidatePath("/[locale]");
  return { success: true, videoId };
}

export async function clearTrailerAction(movieId: number) {
  await requireAuth();
  const { env } = getCloudflareContext();
  const db = env.DB as unknown as import("@cloudflare/workers-types").D1Database;
  await db.prepare(
    "UPDATE movies SET youtube_trailer_id = NULL, youtube_trailer_is_manual_override = 1, updated_at = datetime('now') WHERE id = ?"
  ).bind(movieId).run();

  revalidatePath("/admin/dashboard");
  revalidatePath("/[locale]");
  return { success: true };
}

export async function resetTrailerAction(movieId: number) {
  await requireAuth();
  const { env } = getCloudflareContext();
  const db = env.DB as unknown as import("@cloudflare/workers-types").D1Database;
  await db.prepare(
    "UPDATE movies SET youtube_trailer_is_manual_override = 0, updated_at = datetime('now') WHERE id = ?"
  ).bind(movieId).run();

  revalidatePath("/admin/dashboard");
  revalidatePath("/[locale]");
  return { success: true };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete({
    name: getCookieName(),
    path: "/admin"
  });
  redirect("/admin/login");
}

function clearPublicCache() {
  revalidatePath("/", "layout");
}

export async function addMovieAction(formData: FormData) {
  if (!(await requireAuth())) return { error: "Unauthorized" };

  const name = formData.get("name") as string;
  if (!name || name.trim() === "") return { error: "Name required" };
  
  await createMovie(name.trim());
  clearPublicCache();
  revalidatePath("/admin/dashboard");
}

export async function renameMovieAction(id: number, formData: FormData) {
  if (!(await requireAuth())) return { error: "Unauthorized" };

  const name = formData.get("name") as string;
  if (!name || name.trim() === "") return { error: "Name required" };
  
  await updateMovie(id, name.trim());
  clearPublicCache();
  revalidatePath("/admin/dashboard");
}

export async function deleteMovieAction(id: number) {
  if (!(await requireAuth())) return { error: "Unauthorized" };

  await deleteMovie(id);
  clearPublicCache();
  revalidatePath("/admin/dashboard");
}

export async function saveShowsAction(movieId: number, date: string, times: string[]) {
  if (!(await requireAuth())) return { error: "Unauthorized" };

  // Filter out empty times and sort them
  const validTimes = times.filter(t => t.trim() !== "").sort();
  await upsertShows(movieId, date, validTimes, true);
  clearPublicCache();
  revalidatePath("/admin/dashboard");
}
