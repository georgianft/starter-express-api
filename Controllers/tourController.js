// const fs = require('fs');
const AppError = require('../utils/appError');
const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModels');
// const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
// const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true)
    } else {
        cb(new AppError('Not an image! Please uploud only images.', 400), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 }
]);

// uploud.single('image'); req.file
// uploud.array('images', 5); req.files

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    // console.log(req.files);
    
    if (!req.files.imageCover || !req.files.images) return next();

    // 1) Cover image
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90})
        .toFile(`public/img/tours/${req.body.imageCover}`);
    
    // 2) Images
    req.body.images = [];
    await Promise.all(req.files.images.map(async (file, i) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

        await sharp(file.buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({ quality: 90})
            .toFile(`public/img/tours/${filename}`);
        
        req.body.images.push(filename);
    }));

    // console.log(req.body);
    next();
});

exports.aliasTopTours = (req, res, next) => {
    req.query.limit ='5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};



// const tours  = JSON.parse(
//     fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkID = (req, res, next, val) => {
//     console.log(`Tour id is: ${val}`);
    
//     if (req.params.id * 1 > tours.length) {
//         return res.status(404).json({
//             status: 'fail',
//             message: 'Invalid ID'
//         });
//     }
//     next();
// }

// exports.checkBody = (req, res, next) => {
//     console.log(`Tour name is: ${req.body.name}, Tour Price is ${req.body.price}`);
    
//     if (!req.body.name || !req.body.price) {
//         return res.status(400).json({
//             status: 'fail',
//             message: 'bad request'
//         });
//     }
//     next();
// }

exports.getAllTours = factory.getAll(Tour);
// exports.getAllTours = catchAsync(async (req, res, next) => {
//     console.log(req.query);
//         // BUILD QUERY
//         // // 1A) Filtering
//         // const queryObj = { ...req.query };
//         // const excludedFields = ['page', 'sort', 'limit', 'fields'];
//         // excludedFields.forEach(el => delete queryObj[el]);

//         // // console.log(req.query, queryObj)

//         // // console.log(req.requestedTime);

//         // // 1B) Advanced filtering
//         // let queryStr = JSON.stringify(queryObj);
//         // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
//         // // console.log(JSON.parse(queryStr));

//         // // { difficulty: 'easy', duration: { $gte: 5 } }
//         // // { difficulty: 'easy', duration: { gte: '5' } }
//         // // gte, gt, lte, lt
//         // let query = Tour.find(JSON.parse(queryStr));

//         // 2) Sorting
//         // if (req.query.sort) {
//         //     const sortBy = req.query.sort.split(',').join(' ');
//         //     // query = query.sort(sortBy);
//         //     // sort('price ratingsAverage')
//         // } else {
//         //     query = query.sort('-createdAt');
//         // }

//         // 3) Field limiting
//         // if (req.query.fields) {
//         //     const fields = req.query.fields.split(',').join(' ');
//         //     query = query.select(fields);
//         // } else {
//         //     query = query.select('-__v');
//         // }

//         // 4) Pagination
//         // const page = req.query.page * 1 || 1;
//         // const limit = req.query.limit * 1 || 100;
//         // const skip = (page -1) * limit;
//         // // page=2&limit=10, 1-10, page 1, 11-20, page 2, 21-30 page 3
//         // query = query.skip(skip).limit(limit);

//         // if (req.query.page) {
//         //     const numTours = await Tour.countDocuments();
//         //     if (skip >= numTours) throw new  Error('This page does not exist')
//         // }

//         // Execute QUERY
//         const features = new APIFeatures(Tour.find(), req.query)
//             .filter()
//             .sort()
//             .limitFields()
//             .paginate();
//         const tours = await features.query;
//         // const tours = await query;

//         // const query = Tour.find()
//         //     .where('duration')
//         //     .equals(5)
//         //     .where('difficulty')
//         //     .equals('easy');

//         // Send RESPONSE
//         res.status(200).json({
//             status: 'success',
//             // requestedAt: req.requestedTime,
//             results: tours.length,
//             data: {
//                 tours
//             }
//         });

//     // try {
        
//     // } catch (err) {
//     //     res.status(404).json({
//     //         status: 'fail',
//     //         message: err
//     //     })
//     // }
// });

exports.gettour = factory.getOne(Tour, { path: 'reviews'});
// exports.gettour = catchAsync(async (req, res, next) => {
//         // console.log(req.params);
//         // const id = req.params.id * 1;
//         // const tour = tours.find(el => el.id === id)

//         const tour = await Tour.findById(req.params.id).populate('reviews');
//         // Tour.findOne({ _id: req.params.id })

//         if (!tour) {
//             return next(new AppError('No tour found with that ID', 404))
//         }

//         res.status(200).json({
//             status: 'success',
//             data: {
//                 tour
//             }
//         });
    
//     // try {
        
//     // } catch (err) {
//     //     res.status(404).json({
//     //         status: 'fail',
//     //         message: err
//     //     })

//     // }
    
// })

exports.createTour = factory.createOne(Tour);
// chavametet async
// exports.createTour = catchAsync(async (req, res, next) => {
//     const newTour = await Tour.create(req.body);

//     res.status(201).json({
//         status: 'success',
//         data: {
//             tour: newTour
//         }
//     })
    
//     // try {
//         // const newTour = new Tour({})
//     // newTour.save()

    
//     // console.log(req.body);

//     // const newId = tours[tours.length - 1].id +1;
//     // const newTour = Object.assign({ id : newId }, req.body);

//     // tours.push(newTour);
    

//     // fs.writeFile(
//     //     `${__dirname}/dev-data/data/tours-simple.json`, 
//     //     JSON.stringify(tours), 
//     //     err => {
//     //     res.status(201).json({
//     //         status: 'success',
//     //         data: {
//     //             tour: newTour
//     //         }
//     //     })
//     // })
//     // } catch (err) {
//     //     res.status(400).json({
//     //         status: 'fail',
//     //         message: err
//     //     })
//     // }
// })

exports.UpdateTour = factory.updateOne(Tour);
// exports.UpdateTour = catchAsync(async (req, res, next) => {    
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//         new: true,
//         runValidators: true
//     })

//     if (!tour) {
//         return next(new AppError('No tour found with that ID', 404))
//     }

//     res.status(200).json({
//         status: 'success',
//         data: {
//             // agaraa sachiro roca saxeli igivea property-is
//             // tour : tour
//             tour
//         }
//     })
    
//     // try {
        
//     // } catch (err) {
//     //     res.status(404).json({
//     //         status: 'fail',
//     //         message: err
//     //     })
//     // }
// })

exports.deleteTour = factory.deleteOne(Tour);
// exports.deleteTour = catchAsync(async (req, res, next) => { 
//     const tour = await Tour.findByIdAndDelete(req.params.id)
    
//     if (!tour) {
//         return next(new AppError('No tour found with that ID', 404))
//     }
    
//     res.status(204).json({
//         status: 'success',
//         data: null
//     })    

//     // try {
        
//     // } catch (err ){
//     //     res.status(404).json({
//     //         status: 'fail',
//     //         message: err
//     //     });
//     // }
    
// })

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: { 
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' }, 
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' }, 
                maxPrice: { $max: '$price' }, 
            }
        },
        {
            $sort: { avgPrice: 1 }
        },
        // {
        //     $match: { _id: { $ne: 'EASY' } }
        // }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    })
    
    // try {
        
    // } catch (err) {
    //     res.status(404).json({
    //         status: 'fail',
    //         message: err
    //     });
    // }
})

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
        const year = req.params.year; //2021 ertze gamravleba agar unda ukve
        const plan = await Tour.aggregate([
            {
                $unwind: '$startDates'
            },
            {
                $match: {
                    startDates: {
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`),
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$startDates' },
                    numTourStarts: { $sum: 1 },
                    tours: { $push: '$name'}
                }
            },
            {
                $addFields: { month: '$_id' }
            },
            {
                $project: {
                    _id: 0
                }
            },
            {
                $sort: { numTourStarts: -1 }
            },
            {
                $limit: 12
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                plan
            }
        })
    
    // try {
        
    // } catch (err) {
    //     res.status(404).json({
    //         status: 'fail',
    //         message: err
    //     }); 
    // }
})

// '/tours-within/:distance/center/:latlng/unit/:unit'
// /tours-within/233/center/34.111745,-118.113491/unit/mi

exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1

    if(!lat || !lng) {
        next(new AppError(
            'Please provide latitude and langtitude in the format lat,lng.',
            400
            )
        );
    }

    // console.log(distance, lat, lng, unit);
    const tours = await Tour.find({ 
        startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } 
    });

    res.status(200).json({
        status: 'success',
        rsults: tours.length,
        data: {
            data: tours
        }
    });
});

exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');


    const multiplier = unit === 'mi' ? 0.000621371 : 0.001

    if(!lat || !lng) {
        next(new AppError(
            'Please provide latitude and langtitude in the format lat,lng.',
            400
            )
        );
    }

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            data: distances
        }
    });
})