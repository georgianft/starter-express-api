const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModels');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
// const AppError = require('../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // 1) Get the currently booked tour
    const tour = await Tour.findById(req.params.tourId);
    // console.log(tour);
    // 2) Create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        // success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}&alert=booking`,
        // success_url: `${req.protocol}://${req.get('host')}/my-tours`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [
            {
                name: `${tour.name} Tour`,
                // modis stripedan description field magalitad
                description:  tour.symmary,
                images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`],
                // images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
                amount: tour.price * 100, // centebshi anu vamravlebt 100-ze
                currency: 'usd',
                quantity: 1
            }
        ]
    })
    // 3) Create session as response
    res.status(200).json({
        status: 'success',
        session
    });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
    // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without payment
    // const {tour, user, price }=req.query;
    const {tour, user, price }=req.query;
    let alert = req.query.alert;

    if(!tour && !user && !price) return next();
    await Booking.create({ tour, user, price });

    // console.log(req.originalUrl.split('?')[0]);
    // alert.alerts("booking");
    res.setHeader("Content-Type", "text/html");
    res.redirect(req.originalUrl.split('?')[0]);
    // res.write('<div class="alert alert--success">booking</div>');
    // res.write("<script language='javascript'>alert('hello world');</script>");
    // alert.alerts("booking");
    // res.redirect(req.originalUrl.split('?')[0]);
    
    // location.reload();
    // location.href(req.originalUrl.split('?')[0]);
    // window.setTimeout(alert('booking'), time * 1000);
    // await setTimeout[Object.getOwnPropertySymbols(setTimeout)[0]](10000) // 3 sec
    // res.redirect('/');
    // setTimeout(function() {
    //     console.log('Booked successfull');
    //     res.redirect('/');
    //     alert('booking');
    //     // res.redirect(req.originalUrl.split('?')[0]);
    //     // alert.alerts("booking");
    //     // response.setHeader("Content-Type", "text/html");
    //     // req.query.alert("booking");
    //     // alert.alerts("booking");
    //   }, 7000
    // )
    // setTimeout(function() {
    //     res.redirect(req.originalUrl.split('?')[0]);
    //     // response.setHeader("Content-Type", "text/html");
    //     // req.query.alert("booking");
    //     // alert.alerts("booking");
    //   }, 7000
    // )
    // next(); shegvidzlia magram ar varga daculobistvis jobia shemdegi

    // response.setHeader("Content-Type", "text/html");
    // response.write("<p>Hello World</p>");
    // response.end();
  // doesn't call next()
    // res.setHeader("Content-Type", "text/html");
    // res.setHeader("Content-Type", "text/html");
    // location.href(req.originalUrl.split('?')[0]);
    // history.pushState(null, "", location.href.split("?")[0]);
    // window.location.assign('/my-tours');
    // if (!req.headers.host.match(/^www./)){
    //     res.writeHead (301, {'Location': req.originalUrl.split('?')[0]});
    // }else{ 
    //    return next();
    // }
    res.redirect(req.originalUrl.split('?')[0]);
    // req.qyery.alert = 'booking';
    // res.end();
    // setTimeout(function() {
    //     res.redirect(req.originalUrl.split('?')[0]);
    //     // response.setHeader("Content-Type", "text/html");
    //     // req.query.alert("booking");
    //     // alert.alerts("booking");
    //   }, 7000
    // )
    // res.redirect('http://127.0.0.1:3000/my-tours/');
});

// const createBookingCheckout = async session => {
//     const tour =  session.client_reference_id;
//     const user = (await User.findOne({ email: session.customer_email })).id;
//     const price = session.display_items[0].amount / 100;
//     await Booking.create({ tour, user, price });

// }

// exports.webhookCheckout = (req, res, next) => {
//     const signature = req.headers['stripe-signature'];

//     let event;
//     try {
//         event = stripe.webhooks.constructEvent(
//             req.body, 
//             signature, 
//             process.env.STRIPE_WEBHOOK_SECRET
//         ); 
//     } catch (err) {
//         return res.status(400).send(`Webhook error: ${err.message}`);
//     }

//     if(event.type === 'checkout.session.completed')
//         createBookingCheckout(event.data.object);
//     res.status(200).json({ received: true });
// };

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);