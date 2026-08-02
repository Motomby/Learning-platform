const { Schema, model, models } = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const reviewSchema = new Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    courseId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
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

reviewSchema.index({ courseId: 1, userId: 1 }, { unique: true });

module.exports = models.Review || model('Review', reviewSchema);
