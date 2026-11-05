import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const secret = request.headers.get("x-revalidate-secret");
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { paths?: string[]; tags?: string[] };
  for (const path of body.paths ?? []) {
    revalidatePath(path);
  }
  for (const tag of body.tags ?? []) {
    revalidateTag(tag);
  }
  return NextResponse.json({ ok: true });
}
