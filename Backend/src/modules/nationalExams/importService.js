import { Readable } from "node:stream";
import csv from "csv-parser";
import { prisma } from "../../prisma.js";
import {
    IMPORT_HEADERS,
    REQUIRED_IMPORT_HEADERS,
    nationalExamCsvRowSchema,
} from "./importSchema.js";

const isEmptyRow = (row) => Object.values(row).every((value) => !String(value ?? "").trim());

const formatZodIssues = (error) => error.issues.map((issue) => ({
    field: issue.path.join(".") || "row",
    message: issue.message,
}));

export const parseNationalExamCsv = async (buffer) => new Promise((resolve) => {
    const parsedRows = [];
    const validationErrors = [];
    let totalRowsProcessed = 0;
    let headerErrors = [];
    let parserError = null;
    let settled = false;
    let csvRecordNumber = 0;

    const parser = csv({
        strict: false,
        mapHeaders: ({ header }) => header.replace(/^\uFEFF/, "").trim(),
    });

    parser.on("headers", (headers) => {
        const duplicates = headers.filter((header, index) => headers.indexOf(header) !== index);
        const missing = REQUIRED_IMPORT_HEADERS.filter((header) => !headers.includes(header));
        const unsupported = headers.filter((header) => !IMPORT_HEADERS.includes(header));
        if (duplicates.length) {
            headerErrors.push({ field: "header", message: `Duplicate column(s): ${[...new Set(duplicates)].join(", ")}` });
        }
        if (missing.length) {
            headerErrors.push({ field: "header", message: `Missing required column(s): ${missing.join(", ")}` });
        }
        if (unsupported.length) {
            headerErrors.push({ field: "header", message: `Unsupported column(s): ${unsupported.join(", ")}` });
        }
    });

    parser.on("data", (row) => {
        csvRecordNumber += 1;
        const rowNumber = csvRecordNumber + 1;
        if (isEmptyRow(row)) return;
        totalRowsProcessed += 1;

        if (headerErrors.length) return;

        const parsed = nationalExamCsvRowSchema.safeParse(row);
        if (!parsed.success) {
            validationErrors.push({ row: rowNumber, errors: formatZodIssues(parsed.error) });
            return;
        }
        parsedRows.push({ row: rowNumber, data: parsed.data });
    });

    const finish = () => {
        if (settled) return;
        settled = true;
        if (headerErrors.length) {
            validationErrors.unshift({ row: 1, errors: headerErrors });
        }
        if (parserError) {
            validationErrors.push({
                row: totalRowsProcessed + 2,
                errors: [{ field: "csv", message: `Could not parse CSV: ${parserError.message}` }],
            });
        }
        resolve({ parsedRows, validationErrors, totalRowsProcessed });
    };

    parser.on("error", (error) => {
        parserError = error;
        finish();
    });
    parser.on("end", finish);

    Readable.from([buffer]).pipe(parser);
});

const groupRowsByExam = (parsedRows, validationErrors) => {
    if (!parsedRows.length) return null;

    const first = parsedRows[0].data;
    const metadataKey = (row) => `${row.grade}|${row.subject.trim().toLocaleLowerCase()}`;
    const expectedKey = metadataKey(first);
    const groups = new Map();

    for (const parsedRow of parsedRows) {
        if (metadataKey(parsedRow.data) !== expectedKey) {
            validationErrors.push({
                row: parsedRow.row,
                errors: [{
                    field: "subject/grade",
                    message: "All rows in one CSV import must have the same subject and grade.",
                }],
            });
            continue;
        }

        const year = parsedRow.data.year;
        if (!groups.has(year)) groups.set(year, []);
        groups.get(year).push(parsedRow);
    }

    return [...groups.entries()]
        .sort(([yearA], [yearB]) => yearA - yearB)
        .map(([year, rows]) => ({
            metadata: { ...first, year },
            rows,
        }));
};

export const importNationalExamQuestions = async ({ parsedRows, validationErrors, title, durationMinutes, stream }) => {
    const groups = groupRowsByExam(parsedRows, validationErrors);
    if (!groups?.length) {
        return { exams: [], insertedQuestions: 0 };
    }

    const metadata = groups[0].metadata;
    const allRows = groups.flatMap(({ rows }) => rows);
    const candidates = await prisma.examSubject.findMany({
        where: {
            gradeLevels: { has: metadata.grade },
            name: { equals: metadata.subject, mode: "insensitive" },
        },
        select: { id: true, name: true, gradeLevels: true, stream: true },
    });

    let matchingSubjects = candidates;
    if (metadata.grade === 12 && stream) {
        const exactStreamMatches = candidates.filter((candidate) => candidate.stream === stream);
        const commonMatches = candidates.filter((candidate) => !candidate.stream || candidate.stream === "COMMON");
        matchingSubjects = exactStreamMatches.length ? exactStreamMatches : commonMatches;
    }

    if (matchingSubjects.length !== 1) {
        const message = matchingSubjects.length
            ? `Subject "${metadata.subject}" matches more than one subject for grade ${metadata.grade}.`
            : `Subject "${metadata.subject}" is not configured for grade ${metadata.grade}.`;
        validationErrors.push(...allRows.map(({ row }) => ({
            row,
            errors: [{ field: "subject", message }],
        })));
        return { exams: [], insertedQuestions: 0 };
    }

    const subject = matchingSubjects[0];
    const requestedTitle = title?.trim();

    const exams = await prisma.$transaction(async (tx) => {
        const savedExams = [];

        for (const { metadata: examMetadata, rows } of groups) {
            const examTitle = requestedTitle
                ? (groups.length === 1 ? requestedTitle : `${requestedTitle} (${examMetadata.year})`)
                : `${examMetadata.year} ${subject.name} Exam for Grade ${examMetadata.grade}`;

            const savedExam = await tx.nationalExam.upsert({
                where: {
                    subjectId_year_gradeLevel: {
                        subjectId: subject.id,
                        year: examMetadata.year,
                        gradeLevel: examMetadata.grade,
                    },
                },
                create: {
                    subjectId: subject.id,
                    title: examTitle,
                    year: examMetadata.year,
                    gradeLevel: examMetadata.grade,
                    stream: subject.stream,
                    durationMinutes,
                },
                update: {},
                select: { id: true, title: true, year: true, gradeLevel: true, stream: true, subjectId: true },
            });

            const lastQuestion = await tx.examQuestion.aggregate({
                where: { examId: savedExam.id },
                _max: { order: true },
            });
            let nextOrder = (lastQuestion._max.order || 0) + 1;

            for (const { data } of rows) {
                await tx.examQuestion.create({
                    data: {
                        examId: savedExam.id,
                        type: "SINGLE_CHOICE",
                        text: data.question_text,
                        resourceUrl: data.image_url,
                        explanation: data.explanation,
                        order: nextOrder++,
                        options: {
                            create: ["a", "b", "c", "d"].map((letter, index) => ({
                                text: data[`option_${letter}`],
                                isCorrect: data.correct_answer === letter.toUpperCase(),
                                order: index + 1,
                            })),
                        },
                    },
                });
            }

            savedExams.push(savedExam);
        }

        return savedExams;
    }, { timeout: 60000 });

    return {
        exams,
        insertedQuestions: groups.reduce((count, group) => count + group.rows.length, 0),
    };
};
