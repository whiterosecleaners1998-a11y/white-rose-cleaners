import { prisma } from "@/lib/prisma";
import { buildWhatsAppLink } from "@/lib/whatsapp-link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import RequestActions from "./request-actions";

/**
 * What customers have asked for on the website, before any of it is a booking.
 *
 * Open ones come first and the closed ones fall to the bottom, because this is
 * a worklist rather than a history: the useful question it answers is "who is
 * still waiting for a call back".
 */
export const dynamic = "force-dynamic";

const STATUS_LABEL = {
  NEW: "New",
  CONTACTED: "Called",
  CLOSED: "Closed",
} as const;

function formatDate(value: Date | null): string {
  if (!value) return "";
  return value.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default async function RequestsPage() {
  const requests = await prisma.serviceRequest.findMany({
    include: { items: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  const open = requests.filter((request) => request.status !== "CLOSED");

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Pickup requests
        </h1>
        <p className="mt-1 text-muted-foreground">
          {open.length === 0
            ? "Nothing waiting. Requests from the website land here."
            : `${open.length} still open.`}
        </p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No one has asked for a pickup yet. When they do, their details
            appear here.
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4">
          {requests.map((request) => {
            const estimate = request.estimateTotal
              ? Number(request.estimateTotal)
              : null;
            const pieces = request.items.reduce(
              (sum, item) => sum + item.quantity,
              0
            );

            return (
              <li key={request.id}>
                <Card
                  className={
                    request.status === "CLOSED" ? "opacity-60" : undefined
                  }
                >
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="mr-auto">
                        {request.customerName}
                      </CardTitle>
                      <Badge
                        variant={
                          request.status === "NEW" ? "default" : "secondary"
                        }
                      >
                        {STATUS_LABEL[request.status]}
                      </Badge>
                      {request.kind === "PACKAGE" && (
                        <Badge variant="outline">Package enquiry</Badge>
                      )}
                    </div>
                    <CardDescription>
                      Asked {formatDate(request.createdAt)} at{" "}
                      {request.createdAt.toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="grid gap-5">
                    <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <div className="mt-0.5 flex items-center gap-3">
                          <a
                            href={`tel:${request.phone}`}
                            className="font-mono hover:underline"
                          >
                            {request.phone}
                          </a>
                          <a
                            href={buildWhatsAppLink(
                              request.phone,
                              `Assalam-o-Alaikum ${request.customerName}, ${
                                process.env.SHOP_NAME || "hum"
                              } se baat ho rahi hai. Aap ki request mil gayi hai.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline underline-offset-2"
                          >
                            WhatsApp
                          </a>
                        </div>
                      </div>

                      {request.serviceType && (
                        <div>
                          <p className="text-muted-foreground">Service</p>
                          <p className="mt-0.5">{request.serviceType}</p>
                        </div>
                      )}

                      {request.packageName && (
                        <div>
                          <p className="text-muted-foreground">Package</p>
                          <p className="mt-0.5">{request.packageName}</p>
                        </div>
                      )}

                      {request.preferredDate && (
                        <div>
                          <p className="text-muted-foreground">Wants</p>
                          <p className="mt-0.5">
                            {formatDate(request.preferredDate)}
                            {request.timeSlot ? `, ${request.timeSlot}` : ""}
                          </p>
                        </div>
                      )}

                      {request.email && (
                        <div>
                          <p className="text-muted-foreground">Email</p>
                          <p className="mt-0.5">{request.email}</p>
                        </div>
                      )}
                    </div>

                    {request.address && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">Pickup address</p>
                        <p className="mt-0.5 whitespace-pre-line">
                          {request.address}
                        </p>
                      </div>
                    )}

                    {request.note && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">Note</p>
                        <p className="mt-0.5 whitespace-pre-line">
                          {request.note}
                        </p>
                      </div>
                    )}

                    {request.items.length > 0 && (
                      <div className="rounded-lg border border-border p-4 text-sm">
                        <p className="text-muted-foreground">
                          What they added up on the site — {pieces}{" "}
                          {pieces === 1 ? "piece" : "pieces"}
                          {estimate !== null
                            ? `, about Rs ${estimate.toLocaleString()}`
                            : ""}
                        </p>
                        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                          {request.items.map((item) => (
                            <li key={item.id} className="flex gap-2">
                              <span className="font-mono text-muted-foreground tabular-nums">
                                {item.quantity}×
                              </span>
                              <span>{item.itemName}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <RequestActions id={request.id} status={request.status} />
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
