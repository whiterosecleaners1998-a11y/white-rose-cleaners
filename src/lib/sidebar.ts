/**
 * The collapsed-sidebar preference, shared between the toggle that writes it
 * and the pre-paint script that reads it back.
 *
 * The script runs before hydration so a collapsed sidebar renders collapsed,
 * rather than opening wide and snapping shut once React takes over.
 *
 * It belongs in the root layout rather than the portal one. A <script> in a
 * component only executes in server-rendered HTML; when the client mounts that
 * subtree fresh — navigating from /login into the portal, say — React creates
 * an inert element and warns. From the root it is only ever hydrated, and it
 * has already run on the first load of whatever page the session started on.
 */
export const SIDEBAR_STORAGE_KEY = "wr-sidebar-collapsed";

export const RESTORE_SIDEBAR_SCRIPT = `try{document.documentElement.dataset.sidebar=localStorage.getItem(${JSON.stringify(
  SIDEBAR_STORAGE_KEY
)})==="1"?"collapsed":"expanded"}catch(e){}`;
