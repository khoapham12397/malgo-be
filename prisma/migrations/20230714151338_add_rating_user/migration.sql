-- CreateTable
CREATE TABLE "UserRating" (
    "username" STRING NOT NULL,
    "rating" INT4 NOT NULL,

    CONSTRAINT "UserRating_pkey" PRIMARY KEY ("username")
);
