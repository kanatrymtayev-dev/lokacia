import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST() {
  revalidatePath("/", "layout");
  revalidatePath("/catalog");
  revalidatePath("/dashboard");
  return NextResponse.json({ revalidated: true });
}
