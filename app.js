const path = require('path');
const express = require('express');
const morgan = require('morgan');
const ratelimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./Controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./Controllers/bookingController');
const viewRouter = require('./routes/viewRoutes');

// Start express app
const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES
// Implement CORS
app.use(cors());
// Access-Control-Allo-Origin
// api.natours.com, front-end natours.com marto 1ze
// app.use(cors({
//     origin: 'https://www.natours.com'
// }))
app.options('*', cors());
// app.options('api/v1/tours/:id', cors());


// Serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));
// console.log(process.env.NODE_ENV);

// Set security HTTP headers
app.use(helmet());

// Development logging
if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
};

// Limit requests from same API
const limiter = ratelimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);


// request need not in json. we need to parse body in raw format.
// app.post(
//     '/webhook-checkout', 
//     express.raw({ type: 'application/json' }),
//     // bodyParser.raw({ type: 'application/json' }),
//     bookingController.webhookCheckout
// );

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); //middleware
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data Sanitization against XSS(cros side scripting attacks)
app.use(xss());

// Prevent parameter pollution
app.use
    (hpp({
        whitelist: [
            'duration', 
            'ratingsQuantity',
            'ratingsAverage', 
            'maxGroupSize', 
            'difficulty', 
            'price'
        ]
    })
);

app.use(compression());

// app.use((req, res, next) => {
//     console.log('Hello from the middleware');
//     next();
// });

// Test middleware
app.use((req, res, next) => {
    req.requestedTime = new Date().toISOString();
    // console.log(req.headers);
    // console.log(req.cookies);
    next();
});

// const tours  = JSON.parse(
//     fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
// );

// 2) ROUTE HANDLERS

// const getAllTours = (req, res) => {
//     console.log(req.requestedTime);
//     res.status(200).json({
//         status: 'success',
//         rqquestedAt: req.requestedTime,
//         results: tours.length,
//         data: {
//             tours
//         }
//     });
// };

// const gettour = (req, res) => {
//     console.log(req.params);
//     const id = req.params.id * 1;
//     const tour = tours.find(el => el.id === id)

//     // if(id > tours.length) {
//     if(!tour) {
//         return res.status(404).json({
//             status: 'fail',
//             message: 'Invalid ID'
//         });
//     }


//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour
//         }
//     });
// }

// const createTour = (req, res) => {
//     // console.log(req.body);

//     const newId = tours[tours.length - 1].id +1;
//     const newTour = Object.assign({ id : newId }, req.body);

//     tours.push(newTour);

//     fs.writeFile(
//         `${__dirname}/dev-data/data/tours-simple.json`, 
//         JSON.stringify(tours), 
//         err => {
//         res.status(201).json({
//             status: 'success',
//             data: {
//                 tour: newTour
//             }
//         })
//     })
// }

// const UpdateTour = (req, res) => {
//     if(req.params.id * 1 > tours.length) {
//         return res.status(404).json({
//             status: 'fail',
//             message: 'Invalid ID'
//         });
//     }
    
//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour : '<Updated tour here...>'
//         }
//     })
// }

//  const deleteTour = (req, res) => {
//     if (req.params.id * 1 > tours.length) {
//         return res.status(404).json({
//             status: 'fail',
//             message: 'Invalid ID'
//         });
//     }
    
//     res.status(204).json({
//         status: 'success',
//         data: null
//     })
// }

// const getAllUsers = (req, res) => {
//     res.status(500).json({
//         status: 'error',
//         message: 'This route is not yet defined'
//     })
// }

// const getUser = (req, res) => {
//     res.status(500).json({
//         status: 'error',
//         message: 'This route is not yet defined'
//     })
// }

// const createUser = (req, res) => {
//     res.status(500).json({
//         status: 'error',
//         message: 'This route is not yet defined'
//     })
// }

// const updateUser = (req, res) => {
//     res.status(500).json({
//         status: 'error',
//         message: 'This route is not yet defined'
//     })
// }

// const deleteUser = (req, res) => {
//     res.status(500).json({
//         status: 'error',
//         message: 'This route is not yet defined'
//     })
// }


// 3) ROUTES

// const tourRouter = express.Router();
// const userRouter = express.Router();

// tourRouter
//     .route('/')
//     .get(getAllTours)
//     .post(createTour);

// tourRouter
//     .route('/:id')
//     .get(gettour)
//     .patch(UpdateTour)
//     .delete(deleteTour);

// userRouter
//     .route('/')
//     .get(getAllUsers)
//     .post(createUser);

// userRouter
//     .route('/:id')
//     .get(getUser)
//     .patch(updateUser)
//     .delete(deleteUser);



app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
    // res.status(404).json({
    //     status: 'fail',
    //     message: `Can't find ${req.originalUrl} on this server!`
    // });

    // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
    // err.status = 'fail';
    // err.statusCode = 404;

    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

// 4) START SERVER
module.exports = app;