import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";
import { Storage } from "@google-cloud/storage";
import multer from "multer";
import path from "path";

const storage = new Storage();

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
]);

const sanitizeFileName = (fileName: string) =>
    fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

const buildPublicFileUrl = (bucketName: string, objectPath: string) => {
    const encodedPath = objectPath
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");

    const customPublicBaseUrl = process.env.GCS_PUBLIC_BASE_URL?.replace(
        /\/$/,
        "",
    );

    if (customPublicBaseUrl) {
        return `${customPublicBaseUrl}/${encodedPath}`;
    }

    return `https://storage.googleapis.com/${bucketName}/${encodedPath}`;
};

export const fileUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_UPLOAD_SIZE,
    },
    fileFilter: (_req, file, cb) => {
        if (!ACCEPTED_IMAGE_TYPES.has(file.mimetype)) {
            cb(new Error("Only jpg, jpeg, png, or webp formats are accepted"));
            return;
        }

        cb(null, true);
    },
});

export const uploadPhotoToGcs = async (
    req: Request,
    _res: Response,
    next: NextFunction,
) => {
    try {
        if (!req.file) {
            next();
            return;
        }

        const bucketName = process.env.GCS_BUCKET_NAME;

        if (!bucketName) {
            next(new Error("GCS_BUCKET_NAME environment variable is not set"));
            return;
        }

        const extension = path.extname(req.file.originalname);
        const baseName = path.basename(req.file.originalname, extension);
        const sanitizedBaseName = sanitizeFileName(baseName);
        const objectPath = `users/${Date.now()}-${randomUUID()}-${sanitizedBaseName}${extension}`;

        const bucket = storage.bucket(bucketName);
        const file = bucket.file(objectPath);

        await new Promise<void>((resolve, reject) => {
            const stream = file.createWriteStream({
                resumable: false,
                metadata: {
                    contentType: req.file!.mimetype,
                    cacheControl: "public, max-age=31536000",
                },
            });

            stream.on("error", reject);
            stream.on("finish", resolve);
            stream.end(req.file!.buffer);
        });

        const uploadedPhoto = req.file as Express.Multer.File & {
            location?: string;
        };
        uploadedPhoto.location = buildPublicFileUrl(bucketName, objectPath);

        next();
    } catch (error) {
        next(error);
    }
};
