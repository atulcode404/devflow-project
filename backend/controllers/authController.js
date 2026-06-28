import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { fullName, email, password, skills, bio } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const isFirstUser = (await User.countDocuments({})) === 0;
    const userRole = isFirstUser ? 'admin' : 'user';

    const user = await User.create({
      fullName,
      email,
      password,
      skills: skills || [],
      bio: bio || '',
      role: userRole,
    });

    if (user) {
      generateToken(res, user._id);

      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        skills: user.skills,
        bio: user.bio,
        role: user.role,
        profilePicture: user.profilePicture,
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      generateToken(res, user._id);

      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        skills: user.skills,
        bio: user.bio,
        role: user.role,
        profilePicture: user.profilePicture,
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
  res.status(200).json({ message: 'Logged out successfully' });
};
