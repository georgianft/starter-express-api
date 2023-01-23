const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

// new Email(user, url).sendWelcome();

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `George Chaganava <${process.env.EMAIL_FROM}>`;
    }

    newTransport() {
        if(process.env.NODE_ENV === 'production') {
            // Sendgrid
            return nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD,
                }
            });
        }

        return nodemailer.createTransport({
            // service: 'Gmail',
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            }
            // Activate in gmail "less secure app" option
        });
    }

    // Send the actual email
    async send(template, subject) {
        //    1) Render HTML based on pug template 
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        });
        // 2) Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html),
            // text: htmlToText(html),
        };

        // 3) Create a transport and send email
        await this.newTransport().sendMail(mailOptions);
    };

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the Natours Family!');
    }

    async sendPasswordReset() {
        await this.send(
            'passwordReset', 
            'Your password reset token (valid only 10 minutes)'
        );
    }
};

// const sendEmail = async options => {
    // // 1) create a transporter
    // const transporter = nodemailer.createTransport({
    //     // service: 'Gmail',
    //     host: process.env.EMAIL_HOST,
    //     port: process.env.EMAIL_PORT,
    //     auth: {
    //         user: process.env.EMAIL_USERNAME,
    //         pass: process.env.EMAIL_PASSWORD,
    //     }
    //     // Activate in gmail "less secure app" option
    // });
    // 2) Define the email options
    // const mailOptions = {
    //     from: 'Jonas Schmedtman <hello@jonas.io>',
    //     to: options.email,
    //     subject: options.subject,
    //     text: options.message,
    //     // html:
    // }
//     // 3) Actually send the email
//     await transporter.sendMail(mailOptions)
// }

// module.exports = sendEmail;