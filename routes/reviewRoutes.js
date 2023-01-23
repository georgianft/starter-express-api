const express = require('express');
const reviewController = require('./../Controllers/reviewController');
const authController = require('./../Controllers/authController');

const router = express.Router({ mergeParams: true });

    // Post /tour/234fad4/reviews
    // GET /tour/234fad4/reviews
    // Post /reviews

router.use(authController.protect); // All routers below this line is protected
    
router
    .route('/')
    .get(reviewController.getAllReviews)
    .post( 
        authController.restrictTo('user'),
        reviewController.setTourUserIds, 
        reviewController.createReview
    );

router
    .route('/:id')
    .get(reviewController.getReview)
    .patch(
        authController.restrictTo('user', 'admin'),
        reviewController.updateReview)
    .delete(
        authController.restrictTo('user', 'admin'),
        reviewController.deleteReview);

module.exports = router;