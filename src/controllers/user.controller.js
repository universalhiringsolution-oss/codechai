import asyncHandler from '../utils/asyncHandler_utils.js';
import { ApiError } from '../utils/apiError.utils.js';
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
    console.log('email:', email);

    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {


    } {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User already exists with this username or email");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

if (!avatar) {
    throw new ApiError(500, "Failed to upload avatar image");

}

User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
})

 const createdUser = await User.findById(user._id).select(
    '-password -refreshToken'
 )
 if (createdUser) {
    throw new ApiError(500, 'something went wrong user creation failed')
 }
return res.status(201).json(
    new ApiResponse(201, createdUser, 'User registered Successfully')
)

})

export {
    registerUser,
}




