-- CreateEnum
CREATE TYPE "ProblemRuleType" AS ENUM ('acm', 'oi');

-- CreateTable
CREATE TABLE "FriendShip" (
    "id" STRING NOT NULL,
    "username1" STRING NOT NULL,
    "username2" STRING NOT NULL,
    "establishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FriendShip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FriendRequest" (
    "id" STRING NOT NULL,
    "senderId" STRING NOT NULL,
    "recieverId" STRING NOT NULL,
    "disable" BOOL NOT NULL DEFAULT false,

    CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharePTP" (
    "id" STRING NOT NULL,
    "resourceId" STRING NOT NULL,
    "resourceType" STRING NOT NULL,
    "senderId" STRING NOT NULL,
    "receiverId" STRING NOT NULL,
    "look" BOOL NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharePTP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" STRING NOT NULL,
    "name" STRING NOT NULL,
    "creatorId" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGroupRel" (
    "username" STRING NOT NULL,
    "groupId" STRING NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGroupRel_pkey" PRIMARY KEY ("username","groupId")
);

-- CreateTable
CREATE TABLE "CodingProblemCategory" (
    "id" INT4 NOT NULL DEFAULT unique_rowid(),
    "name" STRING NOT NULL,

    CONSTRAINT "CodingProblemCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodingProblemTag" (
    "id" INT4 NOT NULL DEFAULT unique_rowid(),
    "name" STRING NOT NULL,

    CONSTRAINT "CodingProblemTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodingProblem" (
    "id" STRING NOT NULL,
    "code" STRING NOT NULL,
    "title" STRING NOT NULL,
    "categoryId" INT4 NOT NULL,
    "link" STRING,
    "description" STRING,
    "timeLimit" INT4 NOT NULL DEFAULT 1,
    "memoryLimit" INT4 NOT NULL DEFAULT 256,
    "difficulty" INT4 NOT NULL DEFAULT 400,
    "practicePoint" INT4 NOT NULL DEFAULT 40,
    "totalPoint" INT4 NOT NULL DEFAULT 0,
    "submissionNumber" INT4 NOT NULL DEFAULT 0,
    "acceptedNumber" INT4 NOT NULL DEFAULT 0,

    CONSTRAINT "CodingProblem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorCodingProblem" (
    "username" STRING NOT NULL,
    "codingProblemId" STRING NOT NULL,

    CONSTRAINT "AuthorCodingProblem_pkey" PRIMARY KEY ("username","codingProblemId")
);

-- CreateTable
CREATE TABLE "TagCodingProblem" (
    "tagId" INT4 NOT NULL,
    "codingProblemId" STRING NOT NULL,

    CONSTRAINT "TagCodingProblem_pkey" PRIMARY KEY ("tagId","codingProblemId")
);

-- CreateTable
CREATE TABLE "Thread" (
    "id" STRING NOT NULL,
    "authorId" STRING NOT NULL,
    "parentId" STRING,
    "title" STRING NOT NULL,
    "summary" STRING NOT NULL,
    "published" BOOL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdateAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" STRING NOT NULL,
    "totalComments" INT4 NOT NULL DEFAULT 0,
    "totalRootComments" INT4 NOT NULL DEFAULT 0,
    "likes" INT4 NOT NULL DEFAULT 0,
    "views" INT4 NOT NULL DEFAULT 0,
    "categoryId" INT4,
    "groupId" STRING,

    CONSTRAINT "Thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadCategory" (
    "id" INT4 NOT NULL DEFAULT unique_rowid(),
    "parentId" STRING,
    "title" STRING NOT NULL,

    CONSTRAINT "ThreadCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadTag" (
    "id" STRING NOT NULL,
    "title" STRING NOT NULL,

    CONSTRAINT "ThreadTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadTagRel" (
    "threadId" STRING NOT NULL,
    "tagId" STRING NOT NULL,

    CONSTRAINT "ThreadTagRel_pkey" PRIMARY KEY ("threadId","tagId")
);

-- CreateTable
CREATE TABLE "UserLikeThread" (
    "username" STRING NOT NULL,
    "threadId" STRING NOT NULL,
    "disable" BOOL NOT NULL DEFAULT false,

    CONSTRAINT "UserLikeThread_pkey" PRIMARY KEY ("username","threadId")
);

-- CreateTable
CREATE TABLE "UserLikeComment" (
    "username" STRING NOT NULL,
    "commentId" STRING NOT NULL,
    "disable" BOOL NOT NULL DEFAULT false,

    CONSTRAINT "UserLikeComment_pkey" PRIMARY KEY ("username","commentId")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" STRING NOT NULL,
    "threadId" STRING NOT NULL,
    "parentId" STRING,
    "rootId" STRING NOT NULL,
    "totalChildren" INT4 NOT NULL DEFAULT 0,
    "depth" INT4 NOT NULL DEFAULT 0,
    "likes" INT4 NOT NULL DEFAULT 0,
    "parentUsername" STRING,
    "creatorId" STRING NOT NULL,
    "published" BOOL NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" STRING NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MathProblemCategory" (
    "id" INT4 NOT NULL DEFAULT unique_rowid(),
    "name" STRING NOT NULL,

    CONSTRAINT "MathProblemCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MathProblemTag" (
    "id" INT4 NOT NULL DEFAULT unique_rowid(),
    "name" STRING NOT NULL,
    "parentId" INT4 DEFAULT 0,
    "nextSibling" INT4 DEFAULT 0,
    "prevSibling" INT4 DEFAULT 0,

    CONSTRAINT "MathProblemTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MathProblem" (
    "id" STRING NOT NULL,
    "title" STRING NOT NULL,
    "categoryId" INT4 NOT NULL,
    "link" STRING,
    "description" STRING,
    "hint" STRING,
    "difficulty" INT4 NOT NULL DEFAULT 400,
    "practicePoint" INT4 DEFAULT 40,
    "totalPoint" INT4 DEFAULT 0,
    "prevProblems" STRING,
    "nextProblems" STRING,
    "numSolution" INT4 NOT NULL DEFAULT 0,
    "numCheckedSolution" INT4 NOT NULL DEFAULT 0,

    CONSTRAINT "MathProblem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MathProblemSet" (
    "id" STRING NOT NULL,
    "title" STRING NOT NULL,
    "creatorId" STRING NOT NULL,
    "numberProb" INT4 NOT NULL,

    CONSTRAINT "MathProblemSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MathSetProbRel" (
    "problemId" STRING NOT NULL,
    "setId" STRING NOT NULL,
    "order" STRING NOT NULL,

    CONSTRAINT "MathSetProbRel_pkey" PRIMARY KEY ("setId","problemId")
);

-- CreateTable
CREATE TABLE "AuthorMathProblem" (
    "username" STRING NOT NULL,
    "mathProblemId" STRING NOT NULL,

    CONSTRAINT "AuthorMathProblem_pkey" PRIMARY KEY ("username","mathProblemId")
);

-- CreateTable
CREATE TABLE "TagMathProblem" (
    "tagId" INT4 NOT NULL,
    "mathProblemId" STRING NOT NULL,

    CONSTRAINT "TagMathProblem_pkey" PRIMARY KEY ("tagId","mathProblemId")
);

-- CreateTable
CREATE TABLE "GroupPost" (
    "id" STRING NOT NULL,
    "content" STRING NOT NULL,
    "authorId" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupId" STRING NOT NULL,
    "title" STRING NOT NULL,

    CONSTRAINT "GroupPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" STRING NOT NULL,
    "content" STRING NOT NULL,
    "authorId" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postId" STRING,
    "parentId" STRING,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MathNote" (
    "creatorId" STRING NOT NULL,
    "content" STRING NOT NULL,
    "mathProblemId" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imageLink" STRING,

    CONSTRAINT "MathNote_pkey" PRIMARY KEY ("mathProblemId","creatorId")
);

-- CreateTable
CREATE TABLE "MathSolution" (
    "creatorId" STRING NOT NULL,
    "content" STRING NOT NULL,
    "mathProblemId" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checked" BOOL NOT NULL DEFAULT false,
    "imageLink" STRING,

    CONSTRAINT "MathSolution_pkey" PRIMARY KEY ("mathProblemId","creatorId")
);

-- CreateIndex
CREATE INDEX "FriendShip_username1_idx" ON "FriendShip"("username1");

-- CreateIndex
CREATE INDEX "FriendShip_username2_idx" ON "FriendShip"("username2");

-- CreateIndex
CREATE INDEX "FriendRequest_senderId_idx" ON "FriendRequest"("senderId");

-- CreateIndex
CREATE INDEX "FriendRequest_recieverId_idx" ON "FriendRequest"("recieverId");

-- CreateIndex
CREATE INDEX "SharePTP_receiverId_idx" ON "SharePTP"("receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "CodingProblem_code_key" ON "CodingProblem"("code");

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_recieverId_fkey" FOREIGN KEY ("recieverId") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGroupRel" ADD CONSTRAINT "UserGroupRel_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGroupRel" ADD CONSTRAINT "UserGroupRel_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingProblem" ADD CONSTRAINT "CodingProblem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CodingProblemCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorCodingProblem" ADD CONSTRAINT "AuthorCodingProblem_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorCodingProblem" ADD CONSTRAINT "AuthorCodingProblem_codingProblemId_fkey" FOREIGN KEY ("codingProblemId") REFERENCES "CodingProblem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagCodingProblem" ADD CONSTRAINT "TagCodingProblem_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "CodingProblemTag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagCodingProblem" ADD CONSTRAINT "TagCodingProblem_codingProblemId_fkey" FOREIGN KEY ("codingProblemId") REFERENCES "CodingProblem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ThreadCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadTagRel" ADD CONSTRAINT "ThreadTagRel_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadTagRel" ADD CONSTRAINT "ThreadTagRel_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "ThreadTag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLikeThread" ADD CONSTRAINT "UserLikeThread_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLikeThread" ADD CONSTRAINT "UserLikeThread_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLikeComment" ADD CONSTRAINT "UserLikeComment_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLikeComment" ADD CONSTRAINT "UserLikeComment_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MathProblem" ADD CONSTRAINT "MathProblem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MathProblemCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MathProblemSet" ADD CONSTRAINT "MathProblemSet_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MathSetProbRel" ADD CONSTRAINT "MathSetProbRel_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "MathProblem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MathSetProbRel" ADD CONSTRAINT "MathSetProbRel_setId_fkey" FOREIGN KEY ("setId") REFERENCES "MathProblemSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorMathProblem" ADD CONSTRAINT "AuthorMathProblem_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorMathProblem" ADD CONSTRAINT "AuthorMathProblem_mathProblemId_fkey" FOREIGN KEY ("mathProblemId") REFERENCES "MathProblem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagMathProblem" ADD CONSTRAINT "TagMathProblem_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "MathProblemTag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagMathProblem" ADD CONSTRAINT "TagMathProblem_mathProblemId_fkey" FOREIGN KEY ("mathProblemId") REFERENCES "MathProblem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPost" ADD CONSTRAINT "GroupPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPost" ADD CONSTRAINT "GroupPost_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_postId_fkey" FOREIGN KEY ("postId") REFERENCES "GroupPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MathNote" ADD CONSTRAINT "MathNote_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MathNote" ADD CONSTRAINT "MathNote_mathProblemId_fkey" FOREIGN KEY ("mathProblemId") REFERENCES "MathProblem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MathSolution" ADD CONSTRAINT "MathSolution_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MathSolution" ADD CONSTRAINT "MathSolution_mathProblemId_fkey" FOREIGN KEY ("mathProblemId") REFERENCES "MathProblem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
