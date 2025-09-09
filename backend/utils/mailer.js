const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'suryaveersinghrathore377@gmail.com',        // your Gmail
        pass: 'yuox dvpo whhg cdav',            // your Gmail app password
    }
});

module.exports = async function sendMail(to, subject, text) {
    await transporter.sendMail({
        from: 'suryaveersinghrathore377@gmail.com',        // sender address same as user
        to,
        subject,
        text,
    });
};