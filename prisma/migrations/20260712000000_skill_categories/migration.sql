-- Add categoryId to skills so skills belong to a category
ALTER TABLE "skills" ADD COLUMN "categoryId" TEXT;

CREATE INDEX "skills_categoryId_idx" ON "skills"("categoryId");

ALTER TABLE "skills" ADD CONSTRAINT "skills_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "categories"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
