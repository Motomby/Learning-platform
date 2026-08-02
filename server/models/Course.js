const { Schema, model, models } = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const moduleSchema = new Schema(
  {
    id: {
      type: String,
      default: uuidv4,
    },
    order: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    videoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    duration: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const courseSchema = new Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      default: 'beginner',
      trim: true,
    },
    thumbnail: {
      type: String,
      default: '',
      trim: true,
    },
    duration: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: String,
      default: 'Free',
      trim: true,
    },
    modules: {
      type: [moduleSchema],
      default: [],
    },
    instructorId: {
      type: String,
      required: true,
    },
    instructorName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

module.exports = models.Course || model('Course', courseSchema);
