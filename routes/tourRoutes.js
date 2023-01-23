const express = require('express');
const tourController = require('./../Controllers/tourController');
const authController = require('./../Controllers/authController');
// const reviewController = require('./../Controllers/reviewController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

// router.param('id', tourController.checkID);


// Create a checkBody middleware
// Check if body contains the name and price property
// If not, send back 400 (bad request)
// Add it to the post handler stack

router.use('/:tourId/reviews', reviewRouter);

router
    .route('/top-5-cheap').get(tourController.aliasTopTours ,tourController.getAllTours)

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan);

router.route('/tours-within/:distance/center/:latlng/unit/:unit')
.get(tourController.getToursWithin);
// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center=-40,45/unit=mi

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
    .route('/')
    .get(tourController.getAllTours)
    .post(//tourController.checkBody,
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.createTour);

router
    .route('/:id')
    .get(tourController.gettour)
    .patch(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.UpdateTour)
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.deleteTour);


    // Post /tour/234fad4/reviews
    // GET /tour/234fad4/reviews
    // GET /tour/234fad4/reviews/94887fda

    // router
    // .route('/:tourId/reviews')
    // .post(
    //     authController.protect, 
    //     authController.restrictTo('user'),
    //     reviewController.createReview    
    // );

module.exports = router;