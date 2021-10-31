require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilio_client = require('twilio')(accountSid, authToken);
const express = require('express');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const {MongoClient, ObjectId} = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

const client = new MongoClient(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

let user_collection;

client.connect(err => {
  user_collection = client.db("user").collection("user");
});

const user_symptoms = {
	1: "Headache",
	2: "Dizziness",
	3: "Nausea",
	4: "Fatigue",
  5: "Sadness"
}

twilio_client.messages
  .create({
     body: 'Welcome to the study' + '\n\nPlease indicate your symptom \n(1)Headache, \n(2)Dizziness, \n(3)Nausea, \n(4)Fatigue, \n(5)Sadness, \n(0)None',
     from: process.env.TWILIO_PHONE_NUMBER,  // twilio phone number
     to: process.env.USER_PHONE_NUMBER  // user phone number
   })
  .then(message => console.log(message.sid));


  app.post('/sms', async(req, res) => {

    const twiml = new MessagingResponse();
    const profile = await profileCheck(req);

    //console.log(profile)

    if(profile === false){

      const validated = validateUserResponse(twiml, req, res);
      if(validated){
        await user_collection.insertOne({_id: req.body.From, usersymptoms:{symptom: req.body.Body}}, async function(err, result){
          sendSymptomsRankMessage(twiml, req.body.Body, res);
        });
      }
    }else{
      
        const info = profile[0];
        const symptoms_obj = info["usersymptoms"];
        const symptom = symptoms_obj["symptom"];
        let ratings = symptoms_obj["ratings"];
        
        if(ratings === undefined){
          await user_collection.updateOne({_id: req.body.From}, {$set: {usersymptoms:{symptom: symptom, ratings: req.body.Body}}});
          sendRatingMessage(twiml, symptom, req.body.Body, res);
        }
    
    } 
    
  });


  async function profileCheck(req){
    const id = req.body.From;
    const cursor = user_collection.find({_id: id});
    const result = await cursor.toArray();

    if(result.length < 1){
      return false;
    }

    return result;
  }

  function validateUserResponse(twiml, req, res) {

    if(req.body.Body != '1' && req.body.Body != '2' && req.body.Body != '3' && req.body.Body != '4' && req.body.Body != '5'){
      twiml.message('\n\nPlease enter a number from 0 to 5.'); 
      res.writeHead(200, {'Content-Type': 'text/xml'});
      res.end(twiml.toString());
      return false;
    }
    return true;
  }

  function getSymptomName(symptom) {
    switch (symptom) {
      case "1":
        return user_symptoms[1];
      case "2":
        return user_symptoms[2];
      case "3":
        return user_symptoms[3];
      case "4":
        return user_symptoms[4];
      case "5":
        return user_symptoms[5];
    }

  }

  function sendSymptomsRankMessage(twiml, symptom, res) {
    
    let symptom_name = getSymptomName(symptom);
    twiml.message(`\n\n On a scale from 0 (none) to 4 (severe), how would you rate your ${symptom_name} in the last 24 hours?`);
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
  }


  function sendRatingMessage(twiml, symptom, ratings, res) {
    
    let userSymptom = getSymptomName(symptom);

    if (ratings == '1' || ratings == '2') {
      twiml.message(`\n\n You have a mild ${userSymptom}`);
    } else if (ratings == '3') {
      twiml.message(`\n\n You have a moderate ${userSymptom}`);
    } else if (ratings == '4') {
      twiml.message(`\n\n You have a severe ${userSymptom}`);
    }else if (ratings == '0') {
      twiml.message(`\n\n You do not have ${userSymptom}`);
    }else {
      twiml.message('\n\nPlease enter a number from 0 to 4.');
    }
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
  }
  


  app.listen(port, () => {
    console.log(`Started on http://localhost:${port}`);
  });