const express = require('express');
const viewController = require('../Controllers/viewsController');
const authController = require('../Controllers/authController');
const bookingController = require('../Controllers/bookingController');

// 1) mapboxistvis securtity problem fix
const CSP = 'Content-Security-Policy';
const POLICY =
  "default-src 'self' https://*.mapbox.com ;" +
  "connect-src 'self' http://127.0.0.1:*/ ws://127.0.0.1:*/ https://*.mapbox.com https://js.stripe.com/ ;" +
  "frame-src 'self' http://127.0.0.1:*/ ws://127.0.0.1:*/ https://*.mapbox.com https://js.stripe.com/ ;" +
  "base-uri 'self';block-all-mixed-content;" +
  "font-src 'self' https: data:;" +
  "frame-ancestors 'self';" +
  "img-src http://localhost:8000 'self' blob: data:;" +
  "object-src 'none';" +
  "script-src https: cdn.jsdelivr.net cdnjs.cloudflare.com api.mapbox.com 'self' blob: ;" +
  "script-src-attr 'none';" +
  "style-src 'self' https: 'unsafe-inline';" +
  'upgrade-insecure-requests;';

const router = express.Router();

router.use(viewController.alerts);

// 2) mapboxistvis securtity problem fix
router.use((req, res, next) => {
  res.setHeader(CSP, POLICY);
  next();
});

// router.use(authController.isLoggedIn);

router.get(
  '/', 
  // bookingController.createBookingCheckout,
  authController.isLoggedIn, 
  viewController.getOverview
);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);

// Login
router.get('/login', authController.isLoggedIn, viewController.getLoginForm);

router.get('/signup', authController.isLoggedIn, viewController.getSignupForm);

router.get('/me', authController.protect, viewController.getAccount);
router.get(
  '/my-tours',
  bookingController.createBookingCheckout, 
  authController.protect, 
  viewController.getMyTours);

router.post('/submit-user-data', authController.protect, viewController.getMyTours);

module.exports = router;