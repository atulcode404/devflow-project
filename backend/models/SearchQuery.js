import mongoose from 'mongoose';

const searchQuerySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  keyword: {
    type: String,
    default: '',
    trim: true,
  },
  filters: {
    skills: [String],
    location: String,
    experienceLevel: String,
    projectType: String,
    status: String,
  },
  searchType: {
    type: String,
    required: true,
    enum: ['developer', 'post'],
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

// Indexes for historical and analytics querying
searchQuerySchema.index({ user: 1, createdAt: -1 });
searchQuerySchema.index({ searchType: 1 });
searchQuerySchema.index({ createdAt: -1 });

const SearchQuery = mongoose.model('SearchQuery', searchQuerySchema);

export default SearchQuery;
