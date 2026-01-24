import asyncHandler from '../utils/asyncHandler_utils.js';
import { ApiError } from '../utils/ApiError_utils.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary_service_utils.js';
import { ApiResponse } from '../utils/ApiResponse_utils.js';
import jwt from 'jsonwebtoken';


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

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken


    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }


    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id).select()

        if (!user) {
            throw new ApiError(401, " Invalid refresh Token")
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, " refresh Token is expired or used")

        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken: newrefreshToken } = await generateAccessAndRefreshToken(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newrefreshToken },
                    "Access token refreshed",

                )
            )
    } catch (error) {

        throw new ApiError(401, error?.message || "Invalid refresh token")

    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {

    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?.id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old Password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, ' password change successfully'))

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, 'All fields are required')

    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))

})

const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required")

    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "failed to uploading avatar image")

    }
    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set: {

                avatar: avatar.url

            }
        },
        { new: true }

    ).select("-password")


    return res
        .status(200)
        .json(new ApiResponse(200, user, "avatar image updated successfully"))

})

const updateUserCoverImage = asyncHandler(async (req, res) => {

    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")

    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError(400, "failed to uploading cover image")

    }
    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set: {

                coverImage: coverImage.url

            }
        },
        { new: true }

    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "cover image updated successfully"))


})

const getUserChannelProfile = asyncHandler(async (req, res) => {

    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "Username is required")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }

        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"

            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"

            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                email: 1,
                coverImage: 1,
                createdAt: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "Channel not found")

    }

    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "Channel profile fetched successfully"))

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile


}




