/*
  Warnings:

  - The values [cigs,cipe] on the enum `client_course` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `client` MODIFY `course` ENUM('comandos', 'precursor', 'mergulhador', 'paraquedista', 'caatinga', 'montanha') NULL;
