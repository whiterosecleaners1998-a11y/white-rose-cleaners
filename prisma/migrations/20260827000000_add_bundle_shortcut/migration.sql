-- Per-bundle keyboard key chosen by the shop. Null keeps the old behaviour of
-- handing out a spare home-row letter by position.
ALTER TABLE "Bundle" ADD COLUMN "shortcut" TEXT;
