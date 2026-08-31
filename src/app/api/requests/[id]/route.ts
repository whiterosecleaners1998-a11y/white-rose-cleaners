import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

/**
 * Moving a request along, from the counter's screen. Behind the shop password
 * like the rest of /api — only the POST that creates one is public.
 */

const updateSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CLOSED"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { status } = parsed.data;
  const existing = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.serviceRequest.update({
    where: { id },
    data: {
      status,
      // Stamped the first time it leaves NEW and left alone after that, so the
      // figure answers "how long did someone wait to be called back" rather
      // than "when was this last clicked".
      handledAt:
        status !== "NEW" && existing.handledAt === null
          ? new Date()
          : status === "NEW"
            ? null
            : existing.handledAt,
    },
  });

  return NextResponse.json({ ok: true, status: updated.status });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.serviceRequest.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
