-- DropIndex
DROP INDEX "skills_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_categoryId_key" ON "skills"("name", "categoryId");
