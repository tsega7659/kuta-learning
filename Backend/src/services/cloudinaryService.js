import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../../uploads");

const configureCloudinary = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
};

const hasCloudinaryCredentials = () =>
    Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

/**
 * Uploads a file buffer to Cloudinary (or local uploads/ as a fallback).
 * @param {Buffer} buffer - File buffer from multer memoryStorage
 * @param {Object} options - Upload options (folder, resource_type, filename)
 * @returns {Promise<string>} - Resolves to the public URL of the uploaded image
 */
export const uploadBufferToCloudinary = async (buffer, options = {}) => {
    const {
        folder = "kuta_learning/national_exams",
        resourceType = "auto",
        filename = "file"
    } = options;

    if (hasCloudinaryCredentials()) {
        try {
            configureCloudinary();
            return await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder,
                        resource_type: resourceType,
                        use_filename: true,
                        unique_filename: true,
                    },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result.secure_url);
                    }
                );
                streamifier.createReadStream(buffer).pipe(uploadStream);
            });
        } catch (cloudErr) {
            console.warn("[upload] Cloudinary upload failed, falling back to local storage:", cloudErr.message);
        }
    }

    // Local disk fallback
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const ext = filename.includes(".") ? path.extname(filename) : ".png";
    const localName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const localPath = path.join(uploadsDir, localName);
    fs.writeFileSync(localPath, buffer);
    return `/uploads/${localName}`;
};

