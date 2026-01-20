import asyncHandler from '../utils/asyncHandler_utils.js';
import { ApiError } from '../utils/ApiError_utils.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary_service_utils.js';
import { ApiResponse } from '../utils/ApiResponse_utils.js';


const generateAccessAndRefreshToken = async (userId) => {

    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "something went wrong while generation refresh and access token")
    }

}

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


const loginUser = asyncHandler(async (req, res) => {
    //  req -> data from frontend
    // username or email 
    //find the user
    // password check 
    // access and refresh token
    // send cookies

    const { email, username, password } = req.body

    if (!password) {
        throw new ApiError(400, "Password is required")
    }

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "invalid Credentials");
    }

    const { accessToken, refreshToken } = await
        generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken,
                    refreshToken
                },
                "User logged in Successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: undefined }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(200, {}, "User logged Out successfully"))

})


export {
    registerUser,
    loginUser,
    logoutUser
}




