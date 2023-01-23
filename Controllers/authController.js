const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');
const { decode } = require('punycode');
// const { EPROTONOSUPPORT } = require('constants');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = (user, statusCode, req, res) => {
    const token = signToken(user._id);
    // const cookieOptions = {
        
    // };
    // if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    // for https security req.secure, but for heroku specific req.headers('x-forwarded-proto') === 'https'

    res.cookie('jwt', token, {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN *24 * 60 * 60 * 1000
        ),
        // secure: true,
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
    });

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}

exports.signup = catchAsync(async (req, res, next) => {
    // const newUser = await User.create(req.body);
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        // role: req.body.role
      });

    const url = `${req.protocol}://${req.get('host')}/me`;
    // console.log(url);
    await new Email(newUser, url).sendWelcome();

    createSendToken(newUser, 201, req, res)

    // const token = signToken(newUser._id);

    // res.status(201).json({
    //     status: 'success',
    //     token,
    //     data: {
    //         user: newUser
    //     }
    // })
})

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if(!email || !password) {
        return next(new AppError('Please provide email and password!', 400))
    }
    // 2) check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    // ('pass1234') === '$2a$12$f849gSc2aeDftD87CaR4MuKi48C.8GvNcGoO0AKmJppWjGhwbadIG'
    if(!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401))
    }
    console.log(user);
    // 3) If everythin ok, send token to client
    createSendToken(user, 200, req, res)
    // const token = signToken(user._id);
    // res.status(200).json({
    //     status: 'success',
    //     token,
    // });
})

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check if it's there
    let token;
    if (req.headers.authorization && 
        req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    // console.log(token);

    if(!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401))
    }
    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // console.log(decoded);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if(!currentUser) {
        return next(
            new AppError(
                'The user belonging to this token does no longer exist.', 
                401
            )
        );
    }
    //4) Check if user changed password after the token was issued
    if(currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
            new AppError('User recently changed password! Please log in again.', 401))
    };

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});

// Only for rendered pages, no error
exports.isLoggedIn = async (req, res, next) => {
    try {
        if (req.cookies.jwt) {
            // 1) verify token
            // console.log(token);
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
            // console.log(decoded);
        
            // 2) Check if user still exists
            const currentUser = await User.findById(decoded.id);
            if(!currentUser) {
                return next();
            }
            //3) Check if user changed password after the token was issued
            if(currentUser.changedPasswordAfter(decoded.iat)) {
                return next()
            };
        
            // THERE IS A LOGGED IN USER
            res.locals.user = currentUser;
                return next();
            }
    } catch (err) {
        return next();
    }
    next();
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin', 'lead-guide']. roles = 'user'
        console.log(req.user.role);
        if(!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403)
            );
        }
        next();
    };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) get user based on Posted email
    console.log('req.body.email', req.body.email);
    const user = await User.findOne({ email: req.body.email});
    if(!user) {
        return next(new AppError('There is no user with email address.', 404))
    }
    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false }); // to deactivate all validators
    // 3) Send it to user's email


    // const message = `Forgot your password? Submit a PATCH request with your new password and
    // passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email`;

    try{
        const resetURL = `${req.protocol}://${req.get(
            'host'
        )}/api/v1/users/resetPassword/${resetToken}`;

        // await sendEmail({
        //     email: user.email,
        //     subject: 'Your password reset token(valid for 10 min)',
        //     message
        // });

        await new Email(user, resetURL).sendPasswordReset();
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email'
        });
    } catch(err) {
        user.PasswordResetToken = undefined;
        user.PasswordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(
            new AppError('There was an error sending the email. Try again later!'),
            500
        );
    }   
});
exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
        
    const user = await User.findOne({
        email: req.body.email,
        passwordReset: hashedToken, 
        PasswordResetExpires: {$gt: Date.now() } });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400))
    }

    // user.email = req.body.email;
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.PasswordResetToken = undefined;
    user.PasswordResetExpires = undefined;
    await user.save();
    
    // 3) Update changedPasswordAt property for the user
    // 4) Log the user in, send JWT
    createSendToken(user, 200, req, res)
    // const token = signToken(user._id);

    // res.status(200).json({
    //     status: 'success',
    //     token,
    // });
})

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');
    // 2) Check if Posted current password is correct
    // console.log(req.user.id, req.body.passwordCurrent, user.password);
    // console.log(req.body);
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong.', 401))
    }
    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate will NOT work as intended!

    // 4) Log user in, send JWT
    createSendToken(user, 200, req, res);
})