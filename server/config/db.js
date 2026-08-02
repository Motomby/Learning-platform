const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Review = require('../models/Review');

const DEFAULT_MONGO_URI = 'mongodb://127.0.0.1:27017/elearning_platform';
const DB_JSON_PATH = path.join(__dirname, '..', 'db.json');

async function ensureCollections() {
  const modelsToCreate = [User, Course, Enrollment, Review];

  await Promise.all(
    modelsToCreate.map(async (model) => {
      try {
        await model.createCollection();
      } catch (error) {
        if (error.codeName !== 'NamespaceExists') {
          throw error;
        }
      }
    })
  );
}

function mapSeedDocument(doc) {
  if (!doc || typeof doc !== 'object') {
    return doc;
  }

  const { id, ...rest } = doc;
  return {
    _id: id,
    ...rest,
  };
}

async function seedDatabaseFromJson() {
  if (!fs.existsSync(DB_JSON_PATH)) {
    return;
  }

  const [userCount, courseCount, enrollmentCount, reviewCount] = await Promise.all([
    User.countDocuments(),
    Course.countDocuments(),
    Enrollment.countDocuments(),
    Review.countDocuments(),
  ]);

  if (userCount || courseCount || enrollmentCount || reviewCount) {
    return;
  }

  const rawData = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));

  const users = (rawData.users || []).map(mapSeedDocument);
  const courses = (rawData.courses || []).map(mapSeedDocument);
  const enrollments = (rawData.enrollments || []).map(mapSeedDocument);
  const reviews = (rawData.reviews || []).map(mapSeedDocument);

  if (users.length) {
    await User.insertMany(users);
  }
  if (courses.length) {
    await Course.insertMany(courses);
  }
  if (enrollments.length) {
    await Enrollment.insertMany(enrollments);
  }
  if (reviews.length) {
    await Review.insertMany(reviews);
  }

  console.log('Seeded MongoDB from db.json');
}

async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI || DEFAULT_MONGO_URI;

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });

  await ensureCollections();
  await seedDatabaseFromJson();

  console.log(`MongoDB connected: ${mongoUri}`);
}

module.exports = {
  connectToDatabase,
  DEFAULT_MONGO_URI,
};
