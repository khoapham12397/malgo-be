-- AlterTable
ALTER TABLE "ChatSession" ADD COLUMN     "groupId" STRING;

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "generalChatSessionId" STRING;
