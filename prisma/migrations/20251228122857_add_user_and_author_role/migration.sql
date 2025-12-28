-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'AUTHOR');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';
