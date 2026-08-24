// Pastel pills: amber while the order is still in the shop, blue once it is
// ready to collect, green when it has gone out. Deliberately not the brand
// orange — status has to stay readable as status, not as decoration.
export const statusBadgeClass: Record<string, string> = {
  RECEIVED:
    "rounded-full border-0 bg-amber-100 px-2.5 font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  READY:
    "rounded-full border-0 bg-blue-100 px-2.5 font-medium text-blue-800 dark:bg-blue-500/15 dark:text-blue-400",
  DELIVERED:
    "rounded-full border-0 bg-green-100 px-2.5 font-medium text-green-800 dark:bg-green-500/15 dark:text-green-400",
};

export const statusLabel: Record<string, string> = {
  RECEIVED: "Received",
  READY: "Ready",
  DELIVERED: "Delivered",
};
