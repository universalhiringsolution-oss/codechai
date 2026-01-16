import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //  upload to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" })

        //  file has been uploaded successfully 
        // console.log("file is uploaded on cloudinary", response.url);
        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        // attempt cleanup
        try {
            if (localFilePath && fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        } catch (e) {
            // ignore cleanup errors
        }

        // log and rethrow so callers can provide better feedback
        const errorMessage = error?.message || error?.error?.message || JSON.stringify(error) || 'Cloudinary upload failed';
        console.error('Cloudinary upload failed:', errorMessage);
        throw new Error(errorMessage);

    }

}

export { uploadOnCloudinary }



