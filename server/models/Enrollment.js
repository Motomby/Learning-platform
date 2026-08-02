const { Schema, model, models } = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const enrollmentSchema = new Schema(
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
    enrolledAt: {
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

enrollmentSchema.index({ courseId: 1, userId: 1 }, { unique: true });

module.exports = models.Enrollment || model('Enrollment', enrollmentSchema);
