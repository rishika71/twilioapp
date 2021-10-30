require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

const express = require('express');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const app = express();

app.use(express.urlencoded({ extended: true }));


client.messages
  .create({
     body: 'Welcome to the study' + '\n\nPlease indicate your symptom \n(1)Headache, \n(2)Dizziness, \n(3)Nausea, \n(4)Fatigue, \n(5)Sadness, \n(0)None',
     from: process.env.TWILIO_PHONE_NUMBER,  // twilio phone number
     to: process.env.USER_PHONE_NUMBER  // user phone number
   })
  .then(message => console.log(message.sid));

  app.post('/sms', (req, res) => {

    const twiml = new MessagingResponse();

    console.log(req.body.Body);

    if (req.body.Body == '0') {
      twiml.message('\n\nThank you and we will check with you later.');
    } else if (req.body.Body == '1') {
      twiml.message('\n\nOn a scale from 0 (none) to 4 (severe), how would you rate your Headache in the last 24 hours?');
    } else if (req.body.Body == '2') {
      twiml.message('\n\nOn a scale from 0 (none) to 4 (severe), how would you rate your Dizziness in the last 24 hours?');
    } else if (req.body.Body == '3') {
      twiml.message('\n\nOn a scale from 0 (none) to 4 (severe), how would you rate your Nausea in the last 24 hours?');
    } else if (req.body.Body == '4') {
      twiml.message('\n\nOn a scale from 0 (none) to 4 (severe), how would you rate your Fatigue in the last 24 hours?');
    }else if (req.body.Body == '5') {
      twiml.message('\n\nOn a scale from 0 (none) to 4 (severe), how would you rate your Sadness in the last 24 hours?');
    }else {
      twiml.message('\n\nPlease enter a number from 0 to 5.');
    }

    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
  });

  app.listen(3000, () => {
    console.log('app listening on port 3000!');
  });