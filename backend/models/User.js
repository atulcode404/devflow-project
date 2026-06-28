import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please add a full name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false, // Don't return password by default
  },
  bio: {
    type: String,
    maxlength: 500,
    default: '',
  },
  skills: {
    type: [String],
    default: [],
    index: true, // Index for faster matching queries
  },
  profilePicture: {
    type: String,
    default: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
  },
  backgroundPicture: {
    type: String,
    default: '',
  },
  githubLink: {
    type: String,
    default: '',
  },
  linkedinLink: {
    type: String,
    default: '',
  },
  githubUsername: {
    type: String,
    default: '',
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  location: {
    type: String,
    default: '',
    trim: true,
  },
  interests: {
    type: [String],
    default: [],
  },
  activityScore: {
    type: Number,
    default: 0,
  },
  preferredTechnologies: {
    type: [String],
    default: [],
  },
  portfolioTheme: {
    type: String,
    default: 'modern-dark',
  },
  reputationScore: {
    type: Number,
    default: 0,
  },
  reputationBadge: {
    type: String,
    default: 'Beginner', // Beginner, Active Developer, Pro Collaborator, Top Developer
  },
  reputationBreakdown: {
    type: Object,
    default: {
      profile: 0,
      github: 0,
      posts: 0,
      connections: 0,
      activity: 0,
      participation: 0
    }
  },
  experienceLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate',
  },
  availability: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Freelance', 'Not Available'],
    default: 'Full-time',
  },
  githubProfile: {
    type: Object,
    default: null,
  },
  githubStats: {
    type: Object,
    default: null,
  },
  githubRepos: {
    type: Array,
    default: [],
  },
  githubLanguages: {
    type: Object,
    default: {},
  },
  githubLastSync: {
    type: Date,
    default: null,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  isReported: {
    type: Boolean,
    default: false,
  },
  reportCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes for Search & Admin optimization
userSchema.index({ location: 1 });
userSchema.index({ experienceLevel: 1 });
userSchema.index({ availability: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isReported: 1 });

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
