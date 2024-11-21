const jwt = require("jsonwebtoken");
const { signupSchema, signinSchema, acceptCodeSchema, changePasswordSchema, acceptFPCodeSchema } = require("../middlewares/validator");
const User = require("../models/usersModel");
const { doHash, doHashValidation, hmacProcess } = require("../utils/hashing");
const transport = require("../middlewares/sendMail");

exports.signup = async (req, res) => {
    const { email, password } = req.body;
    try {
        const { error, value } = signupSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await doHash(password, 12);
        const newUser = new User({ email, password: hashedPassword });
        const result = await newUser.save();
        result.password = undefined; // Ensure password is not sent back

        res.status(201).json({
            success: true,
            message: "User created successfully",
            data: result,
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.signin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const { error, value } = signinSchema.validate({ email, password });
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const existingUser = await User.findOne({ email }).select("+password");
        if (!existingUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const result = await doHashValidation(password, existingUser.password);
        if (!result) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign(
            {
                userId: existingUser._id,
                email: existingUser.email,
                verified: existingUser.verified,
            },
            process.env.TOKEN_SECRET
        );

        res.cookie('Authorization', 'Bearer ' + token, {
            expires: new Date(Date.now() + 8 * 3600000), // 8 hours
            httpOnly: process.env.NODE_ENV === 'production',
            secure: process.env.NODE_ENV === 'production',
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            token
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.signout = async (req, res) => {
    res.clearCookie('Authorization').status(200).json({ success: true, message: "Logout successful" });
};

exports.sendVerificationCode = async (req, res) => {
    const { email } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (existingUser.verified) {
            return res.status(400).json({ success: false, message: "User already verified" });
        }

        const verificationCode = Math.floor(100000 * Math.random()).toString();
        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject: "Verification Code",
            html: `<h1>Verification Code: ${verificationCode}</h1>`
        });
        if (info.accepted[0] === existingUser.email) {
            const hashedCodeValue = hmacProcess(verificationCode, process.env.HMAC_VERIFICATION_CODE_SECRET);
            existingUser.verificationCode = hashedCodeValue;
            existingUser.verificationCodeValidation = Date.now();
            await existingUser.save();
            return res.status(200).json({ success: true, message: "Verification code sent successfully" });

        }

        return res.status(500).json({ success: false, message: "Internal server error" });

    } catch (err) {
        console.log(err);
    }
};
exports.verifyVerificationCode = async (req, res) => {
    const { email, verificationCode } = req.body;
    try {
        const { error, value } = acceptCodeSchema.validate({ email, verificationCode });
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }
        const codeValue = verificationCode.toString();
        const existingUser = await User.findOne({ email }).select("+verificationCode +verificationCodeValidation");
        if (!existingUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (existingUser.verified) {
            return res.status(400).json({ success: false, message: "User already verified" });
        }
        if (!existingUser.verificationCode || !existingUser.verificationCodeValidation) {
            return res.status(400).json({ success: false, message: "Verification code not found" });
        }
        if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) {
            return res.status(400).json({ success: false, message: "Verification code expired" });
        }
        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
        if (hashedCodeValue === existingUser.verificationCode) {
            existingUser.verified = true;
            existingUser.verificationCode = undefined;
            existingUser.verificationCodeValidation = undefined;
            await existingUser.save();
            return res.status(200).json({ success: true, message: "Verification code verified successfully" });
        } else {
            return res.status(400).json({ success: false, message: "Invalid verification code" });
        }
    } catch (err) {
        console.log(err);
    }
}
exports.changePassword = async (req, res) => {
    const { userId, verified } = req.user;
    const { oldPassword, newPassword } = req.body;
    try {
        const { error, value } = changePasswordSchema.validate({ oldPassword, newPassword });
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }
        if (!verified) {
            return res.status(401).json({ success: false, message: "User not verified" });
        }
        const existingUser = await User.findOne({ _id: userId }).select("+password");
        if (!existingUser) {
            return res.status(401).json({ success: false, message: "User not found" });
        }
        const result = await doHashValidation(oldPassword, existingUser.password);
        if (!result) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        const hashedPassword = await doHash(newPassword, 12);
        existingUser.password = hashedPassword;
        await existingUser.save();
        return res.status(200).json({ success: true, message: "Password changed successfully" });
    } catch (err) {
        console.log(err);
    }
}
exports.sendForgotPasswordCode = async (req, res) => {
    const { email } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const verificationCode = Math.floor(100000 * Math.random()).toString();
        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject: "Forgot password Code",
            html: `<h1>password Code: ${verificationCode}</h1>`
        });
        if (info.accepted[0] === existingUser.email) {
            const hashedCodeValue = hmacProcess(verificationCode, process.env.HMAC_VERIFICATION_CODE_SECRET);
            existingUser.forgotPasswordCode = hashedCodeValue;
            existingUser.forgotPasswordCodeValidation = Date.now();
            await existingUser.save();
            return res.status(200).json({ success: true, message: "Forgot password code sent successfully" });

        }

        return res.status(500).json({ success: false, message: "Internal server error" });

    } catch (err) {
        console.log(err);
    }
};
exports.verifyForgotPasswordCode = async (req, res) => {
    const { email, verificationCode, newPassword } = req.body;
    try {
        const { error, value } = acceptFPCodeSchema.validate({ email, verificationCode, newPassword });
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }
        const codeValue = verificationCode.toString();
        const existingUser = await User.findOne({ email }).select("+forgotPasswordCode +forgotPasswordCodeValidation");
        if (!existingUser.forgotPasswordCode || !existingUser.forgotPasswordCodeValidation) {
            return res.status(400).json({ success: false, message: "Verification code not found" });
        }
        if (Date.now() - existingUser.forgotPasswordCodeValidation > 5 * 60 * 1000) {
            return res.status(400).json({ success: false, message: "Verification code expired" });
        }

        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
        if (hashedCodeValue === existingUser.forgotPasswordCode) {
            const hashedPassword = await doHash(newPassword, 12);
            existingUser.password = hashedPassword;
            existingUser.forgotPasswordCode = undefined;
            existingUser.forgotPasswordCodeValidation = undefined;
            await existingUser.save();
            return res.status(200).json({ success: true, message: "Verification code verified successfully" });
        } else {
            return res.status(400).json({ success: false, message: "Invalid verification code" });
        }
    } catch (err) {
        console.log(err);
    }
}