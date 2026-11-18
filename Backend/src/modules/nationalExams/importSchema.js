import { z } from "zod";

export const REQUIRED_IMPORT_HEADERS = [
    "year",
    "subject",
    "grade",
    "question_text",
    "option_a",
    "option_b",
    "option_c",
    "option_d",
    "correct_answer",
];

export const OPTIONAL_IMPORT_HEADERS = ["explanation", "image_url"];
export const IMPORT_HEADERS = [...REQUIRED_IMPORT_HEADERS, ...OPTIONAL_IMPORT_HEADERS];

const optionalText = z.string().trim().optional().transform((value) => value || null);

export const nationalExamCsvRowSchema = z.object({
    year: z.coerce.number().int().min(1900).max(2100),
    subject: z.string().trim().min(1, "Subject is required"),
    grade: z.coerce.number().int().min(1).max(12),
    question_text: z.string().trim().min(1, "Question text is required"),
    option_a: z.string().trim().min(1, "Option A is required"),
    option_b: z.string().trim().min(1, "Option B is required"),
    option_c: z.string().trim().min(1, "Option C is required"),
    option_d: z.string().trim().min(1, "Option D is required"),
    correct_answer: z.preprocess(
        (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
        z.enum(["A", "B", "C", "D"])
    ),
    explanation: optionalText,
    image_url: z.string().trim().url("Image URL must be a valid URL").optional().or(z.literal("")).transform((value) => value || null),
}).strict();
