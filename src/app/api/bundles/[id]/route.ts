import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeShortcut } from "@/lib/shortcuts";
import { bundleInclude, serializeBundle } from "@/lib/bundles";

const patchSchema = z.object({
  // An empty string hands the letter back, and the bundle goes back to taking
  // whichever spare one is going.
  shortcut: z.string().trim().max(1),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A shortcut has to be a single letter." },
      { status: 400 }
    );
  }

  const shortcut = normalizeShortcut(parsed.data.shortcut);
  if (parsed.data.shortcut && !shortcut) {
    return NextResponse.json(
      { error: "A shortcut has to be a single letter — digits book items." },
      { status: 400 }
    );
  }

  if (shortcut) {
    const clash = await prisma.bundle.findFirst({
      where: { active: true, shortcut, id: { not: id } },
      select: { name: true },
    });
    if (clash) {
      return NextResponse.json(
        { error: `"${clash.name}" already uses ${shortcut.toUpperCase()}.` },
        { status: 409 }
      );
    }
  }

  const bundle = await prisma.bundle
    .update({
      where: { id },
      data: { shortcut },
      include: bundleInclude,
    })
    .catch(() => null);

  if (!bundle) {
    return NextResponse.json({ error: "Bundle not found." }, { status: 404 });
  }
  return NextResponse.json(serializeBundle(bundle));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await prisma.bundle
    .delete({ where: { id } })
    .catch(() => null);

  if (!deleted) {
    return NextResponse.json({ error: "Bundle not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
