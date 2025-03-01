/*
  Warnings:

  - You are about to alter the column `level` on the `client` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `client` MODIFY `level` ENUM('SD', 'CB', 'SGT', 'STTEN', 'TEN', 'CAP', 'MAJ', 'CEL') NOT NULL DEFAULT 'SD';
