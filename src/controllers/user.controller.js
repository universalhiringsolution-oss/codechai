import asyncHandler from '../utils/asyncHandler_utils.js';
import { ApiError } from '../utils/ApiError_utils.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary_service_utils.js';
import { ApiResponse } from '../utils/ApiResponse_utils.js';


const registerUser = asyncHandler(async (req, res) => {
    // Logic for registering a user
    // get user details from frontend
    // validation - not empty
    // check if user already exist : username, email
    //  check for images, check for avatar 
    //  upload images to cloudinary, avatar
    //  create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res 

    const { fullName, email, username, password } = req.body

    if ([fullName, email, username, password].some((field) => !field || String(field).trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User already exists with this username or email");
    }


    //  console.log("Files received in request:", req.files);

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    // Images are now optional - proceed with text data
    let avatar = null, coverImage = null;

    // one more code 
    let converImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        converImageLocalPath = req.files.coverImage[0].path;
    }


    // Upload avatar if provided
    if (avatarLocalPath) {
        try {
            avatar = await uploadOnCloudinary(avatarLocalPath);
            console.log("Avatar uploaded successfully");
        } catch (err) {
            console.error('Avatar upload failed:', err.message);
            // Continue without avatar - don't block registration
            avatar = null;
        }
    }

    // Upload cover image if provided
    if (converImageLocalPath) {
        try {
            coverImage = await uploadOnCloudinary(converImageLocalPath);
            console.log("Cover image uploaded successfully");
        } catch (err) {
            console.error('Cover image upload failed:', err.message);
            // Continue without cover image
            coverImage = null;
        }
    }

    const user = await User.create({
        fullName,
        avatar: avatar?.url || "",
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select('-password -refreshToken')
    if (!createdUser) {
        throw new ApiError(500, 'Something went wrong, user creation failed')
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, 'User registered Successfully')
    )

})

export {
    registerUser,
}




