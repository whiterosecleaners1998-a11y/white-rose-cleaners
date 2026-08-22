import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
