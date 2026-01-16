import multer from 'multer';
import fs from 'fs';
import path from 'path';

const uploadDir = path.join(process.cwd(), 'public', 'tmp');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },

    filename: function (req, file, cb) {
        const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
        cb(null, safeName)
    }
})

export const upload = multer({
    storage,
})



