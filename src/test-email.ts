import { sendOTPEmail } from './utils/email.service';

sendOTPEmail('owusuboat05@gmail.com', '123456')
  .then(() => {
    console.log('Email sent successfully');
  })
  .catch((error) => {
    console.error(error);
  });
