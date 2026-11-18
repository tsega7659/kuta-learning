import { parseNationalExamCsv, importNationalExamQuestions } from "./importService.js";

const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

export const importNationalExamCsv = async (req, res) => {
    console.info("[national-exam-import] Request received", {
        method: req.method,
        path: req.originalUrl,
        filename: req.file?.originalname || null,
        sizeBytes: req.file?.size || 0,
        stream: req.body.stream || null,
    });

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "Upload a CSV file using the 'file' field.",
            totalRowsProcessed: 0,
            insertedQuestions: 0,
            validationErrors: [],
        });
    }
    if (!req.file.originalname.toLowerCase().endsWith(".csv")) {
        return res.status(400).json({
            success: false,
            message: "Only .csv files are supported.",
            totalRowsProcessed: 0,
            insertedQuestions: 0,
            validationErrors: [],
        });
    }

    const requestedDuration = req.body.durationMinutes === undefined || req.body.durationMinutes === ""
        ? 120
        : Number(req.body.durationMinutes);
    if (!isPositiveInteger(requestedDuration) || requestedDuration > 600) {
        return res.status(400).json({
            success: false,
            message: "durationMinutes must be a whole number between 1 and 600.",
            totalRowsProcessed: 0,
            insertedQuestions: 0,
            validationErrors: [],
        });
    }
    if (typeof req.body.title === "string" && req.body.title.trim().length > 180) {
        return res.status(400).json({
            success: false,
            message: "title must be 180 characters or fewer.",
            totalRowsProcessed: 0,
            insertedQuestions: 0,
            validationErrors: [],
        });
    }
    const stream = req.body.stream || null;
    if (stream && !["NATURAL", "SOCIAL", "COMMON"].includes(stream)) {
        return res.status(400).json({
            success: false,
            message: "stream must be NATURAL, SOCIAL, or COMMON.",
            totalRowsProcessed: 0,
            insertedQuestions: 0,
            validationErrors: [],
        });
    }

    let parsed;
    try {
        parsed = await parseNationalExamCsv(req.file.buffer);
        if (parsed.totalRowsProcessed === 0) {
            return res.status(400).json({
                success: false,
                message: "The CSV file does not contain any question rows.",
                totalRowsProcessed: 0,
                insertedQuestions: 0,
                validationErrors: parsed.validationErrors,
            });
        }

        const imported = await importNationalExamQuestions({
            ...parsed,
            title: typeof req.body.title === "string" ? req.body.title : "",
            durationMinutes: requestedDuration,
            stream,
        });
        const response = {
            success: parsed.validationErrors.length === 0
                && imported.insertedQuestions === parsed.totalRowsProcessed,
            message: imported.insertedQuestions
                ? `Imported ${imported.insertedQuestions} question(s) across ${imported.exams.length} exam(s).`
                : "No questions were imported.",
            totalRowsProcessed: parsed.totalRowsProcessed,
            insertedQuestions: imported.insertedQuestions,
            validationErrors: parsed.validationErrors,
            exams: imported.exams,
            exam: imported.exams[0] || null,
        };
        console.info("[national-exam-import] Import completed", {
            path: req.originalUrl,
            success: response.success,
            totalRowsProcessed: response.totalRowsProcessed,
            insertedQuestions: response.insertedQuestions,
            exams: response.exams.map(({ year, title }) => ({ year, title })),
            validationErrorCount: response.validationErrors.length,
        });
        return res.status(imported.insertedQuestions ? 200 : 422).json(response);
    } catch (error) {
        console.error("[national-exam-import] Import failed", {
            path: req.originalUrl,
            error: error.message,
            stack: error.stack,
        });
        return res.status(500).json({
            success: false,
            message: "The import could not be completed. No questions were saved.",
            totalRowsProcessed: parsed?.totalRowsProcessed || 0,
            insertedQuestions: 0,
            validationErrors: parsed?.validationErrors || [],
        });
    }
};
