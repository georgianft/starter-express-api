const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
    console.log('UNHANDLED EXCEPTION! Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
    '<PASSWORD>', 
    process.env.DATABASE_PASSWORD
);

//database_local istvis
// const DB = process.env.DATABASE_LOCAL

mongoose.connect(DB, {
    // useUnifiedTopology: true,
    // useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false

    // useUnifiedTopology: true
}).then(() => console.log('DB connection successful!'));

// shegvidzlia chavamatot .catch(err => console.log('ERROR')) unhandled promise rejection, magram kargi praktika araa.

// const tourSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: [true, 'A tour must have a name'],
//         unique: true
//     },
//     rating: {
//         type: Number,
//         default: 4.5
//     },
//     price: {
//         type: Number,
//         required: [true, 'A tour must have a price']
//     }
// });
// const Tour = mongoose.model('Tour', tourSchema);

// const testTour = new Tour({
//     name: 'The Park Camper',
//     price: 997
// });

// testTour.save().then(doc => {
//     console.log(doc)
// }).catch(err => {
//     console.log('ERROR :' , err)
// });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App running on ${port}...`)
    // console.log(process.env.NODE_ENV)
})

process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

// Heroku Specific
process.on('SIGTERM', ()=> {
    console.log('SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});