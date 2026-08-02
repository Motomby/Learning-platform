const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/authMiddleware');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Review = require('../models/Review');

const router = express.Router();

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isFreePrice(price) {
  return price === 'Free' || price === '0' || price === '$0';
}

function computeRating(courseId, reviews) {
  const courseReviews = reviews.filter((review) => review.courseId === courseId);
  if (!courseReviews.length) return 0;

  const sum = courseReviews.reduce((acc, review) => acc + review.rating, 0);
  return Math.round((sum / courseReviews.length) * 10) / 10;
}

function sanitizeModules(modules = []) {
  if (!Array.isArray(modules)) {
    return [];
  }

  return modules
    .filter((module) => module && module.title && module.title.trim())
    .map((module, index) => ({
      id: module.id || uuidv4(),
      order: index + 1,
      title: module.title.trim(),
      description: (module.description || '').trim(),
      videoUrl: (module.videoUrl || '').trim(),
      duration: (module.duration || '').trim(),
    }));
}

function enrichCourse(course, reviews, enrollments, options = {}) {
  const reviewCount = reviews.filter((review) => review.courseId === course.id).length;
  const enrolledCount = enrollments.filter((enrollment) => enrollment.courseId === course.id).length;
  const enrichedCourse = {
    ...course,
    rating: computeRating(course.id, reviews),
    reviewCount,
    enrolledCount,
  };

  if (options.hideModules) {
    delete enrichedCourse.modules;
  }

  if (options.enrolledAt) {
    enrichedCourse.enrolledAt = options.enrolledAt;
  }

  return enrichedCourse;
}

// ─── GET MY ENROLLED COURSES (protected) ──────────────────────────────────────
// GET /api/courses/enrolled/me
router.get('/enrolled/me', authMiddleware, async (req, res) => {
  try {
    const userEnrollments = await Enrollment.find({ userId: req.user.id }).sort({ enrolledAt: -1 });
    const courseIds = userEnrollments.map((enrollment) => enrollment.courseId);

    if (!courseIds.length) {
      return res.json({ courses: [] });
    }

    const [courses, reviews, allEnrollments] = await Promise.all([
      Course.find({ _id: { $in: courseIds } }),
      Review.find({ courseId: { $in: courseIds } }),
      Enrollment.find({ courseId: { $in: courseIds } }),
    ]);

    const courseMap = new Map(courses.map((course) => [course.id, course.toJSON()]));
    const enrolledCourses = userEnrollments
      .map((enrollment) => {
        const course = courseMap.get(enrollment.courseId);
        if (!course) {
          return null;
        }

        return enrichCourse(course, reviews, allEnrollments, {
          hideModules: true,
          enrolledAt: enrollment.enrolledAt,
        });
      })
      .filter(Boolean);

    res.json({ courses: enrolledCourses });
  } catch (error) {
    console.error('Get enrolled courses error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── GET ALL COURSES (public) ─────────────────────────────────────────────────
// GET /api/courses?search=&category=&minPrice=&maxPrice=&priceType=
router.get('/', async (req, res) => {
  try {
    const { search, category, priceType } = req.query;
    const filters = {};

    if (search) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      filters.$or = [
        { title: regex },
        { description: regex },
        { category: regex },
      ];
    }

    if (category && category !== 'all') {
      filters.category = category;
    }

    let courses = await Course.find(filters).sort({ createdAt: -1 });

    if (priceType === 'free') {
      courses = courses.filter((course) => isFreePrice(course.price));
    }

    if (priceType === 'paid') {
      courses = courses.filter((course) => !isFreePrice(course.price));
    }

    const courseIds = courses.map((course) => course.id);
    const [reviews, enrollments] = courseIds.length
      ? await Promise.all([
          Review.find({ courseId: { $in: courseIds } }),
          Enrollment.find({ courseId: { $in: courseIds } }),
        ])
      : [[], []];

    const enrichedCourses = courses.map((course) =>
      enrichCourse(course.toJSON(), reviews, enrollments, { hideModules: true })
    );

    res.json({ courses: enrichedCourses });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── GET SINGLE COURSE (public) ───────────────────────────────────────────────
// GET /api/courses/:id
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    const [reviews, enrollments] = await Promise.all([
      Review.find({ courseId: course.id }),
      Enrollment.find({ courseId: course.id }),
    ]);

    res.json({
      course: enrichCourse(course.toJSON(), reviews, enrollments),
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── CREATE COURSE (protected) ────────────────────────────────────────────────
// POST /api/courses
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, category, level, thumbnail, duration, price, modules } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description, and category are required.' });
    }

    const course = await Course.create({
      _id: uuidv4(),
      title: title.trim(),
      description: description.trim(),
      category,
      level: level || 'beginner',
      thumbnail: thumbnail || '',
      duration: duration || '',
      price: price || 'Free',
      modules: sanitizeModules(modules),
      instructorId: req.user.id,
      instructorName: req.user.username,
    });

    res.status(201).json({ message: 'Course created successfully!', course: course.toJSON() });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── UPDATE COURSE (protected, owner only) ────────────────────────────────────
// PUT /api/courses/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    if (course.instructorId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. You can only update your own courses.' });
    }

    const { title, description, category, level, thumbnail, duration, price, modules } = req.body;

    if (title !== undefined) course.title = title.trim();
    if (description !== undefined) course.description = description.trim();
    if (category !== undefined) course.category = category;
    if (level !== undefined) course.level = level;
    if (thumbnail !== undefined) course.thumbnail = thumbnail;
    if (duration !== undefined) course.duration = duration;
    if (price !== undefined) course.price = price;
    if (Array.isArray(modules)) course.modules = sanitizeModules(modules);

    await course.save();

    res.json({ message: 'Course updated successfully!', course: course.toJSON() });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── DELETE COURSE (protected, owner only) ────────────────────────────────────
// DELETE /api/courses/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    if (course.instructorId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. You can only delete your own courses.' });
    }

    await Promise.all([
      Course.deleteOne({ _id: req.params.id }),
      Enrollment.deleteMany({ courseId: req.params.id }),
      Review.deleteMany({ courseId: req.params.id }),
    ]);

    res.json({ message: 'Course deleted successfully.' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── ENROLL IN COURSE (protected) ─────────────────────────────────────────────
// POST /api/courses/:id/enroll
router.post('/:id/enroll', authMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    if (course.instructorId === req.user.id) {
      return res.status(400).json({ message: 'You cannot enroll in your own course.' });
    }

    const alreadyEnrolled = await Enrollment.findOne({
      courseId: req.params.id,
      userId: req.user.id,
    });

    if (alreadyEnrolled) {
      return res.status(409).json({ message: 'You are already enrolled in this course.' });
    }

    await Enrollment.create({
      _id: uuidv4(),
      courseId: req.params.id,
      userId: req.user.id,
      enrolledAt: new Date(),
    });

    res.status(201).json({ message: 'Enrolled successfully! Happy learning 🎉' });
  } catch (error) {
    console.error('Enroll course error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── CHECK ENROLLMENT STATUS ───────────────────────────────────────────────────
// GET /api/courses/:id/enrollment-status
router.get('/:id/enrollment-status', authMiddleware, async (req, res) => {
  try {
    const enrolled = await Enrollment.exists({
      courseId: req.params.id,
      userId: req.user.id,
    });

    res.json({ enrolled: Boolean(enrolled) });
  } catch (error) {
    console.error('Enrollment status error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── GET REVIEWS (public) ─────────────────────────────────────────────────────
// GET /api/courses/:id/reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ courseId: req.params.id }).sort({ createdAt: -1 });
    res.json({ reviews: reviews.map((review) => review.toJSON()) });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── SUBMIT REVIEW (protected, enrolled students only) ────────────────────────
// POST /api/courses/:id/reviews
router.post('/:id/reviews', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ message: 'Course not found.' });

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    if (!comment || comment.trim().length < 5) {
      return res.status(400).json({ message: 'Review comment must be at least 5 characters.' });
    }

    const isEnrolled = await Enrollment.exists({
      courseId: req.params.id,
      userId: req.user.id,
    });

    if (!isEnrolled) {
      return res.status(403).json({ message: 'You must be enrolled in this course to leave a review.' });
    }

    const existingReview = await Review.findOne({
      courseId: req.params.id,
      userId: req.user.id,
    });

    if (existingReview) {
      return res.status(409).json({ message: 'You have already reviewed this course.' });
    }

    const review = await Review.create({
      _id: uuidv4(),
      courseId: req.params.id,
      userId: req.user.id,
      username: req.user.username,
      rating: numRating,
      comment: comment.trim(),
      createdAt: new Date(),
    });

    res.status(201).json({ message: 'Review submitted! Thank you.', review: review.toJSON() });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

module.exports = router;
