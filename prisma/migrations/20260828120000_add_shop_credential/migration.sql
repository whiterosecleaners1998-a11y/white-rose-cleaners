-- The changeable shop password. Absent until the password is first changed,
-- while APP_PASSWORD answers for it.
CREATE TABLE "ShopCredential" (
    "id" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopCredential_pkey" PRIMARY KEY ("id")
);
