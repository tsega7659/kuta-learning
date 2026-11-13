CREATE TABLE "ShortNote" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "content" TEXT,
    "pdfUrl" TEXT,
    "fileSize" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "learningObjectives" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "resources" JSONB,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShortNote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShortNote_chapterId_order_key" ON "ShortNote"("chapterId", "order");

ALTER TABLE "ShortNote"
ADD CONSTRAINT "ShortNote_chapterId_fkey"
FOREIGN KEY ("chapterId") REFERENCES "NoteChapter"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
