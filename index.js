require('dotenv').config();

const twilio_client = require('twilio')("AC8b26198f1af777d49d8382d17a5fdbff", "ae0361a0bd1d2c4aeb945bbc5973e9f3");
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {MongoClient, ObjectID} = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;
const jwtSecret = "secretsecretsecret";

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const client = new MongoClient("mongodb+srv://root:HdjW4DK9xFxcCbHH@cluster0.rxdum.mongodb.net/myFirstDatabase?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });

let user_collection;
let admin_collection;

client.connect(() => {
  user_collection = client.db("user").collection("user");
  admin_collection = client.db("user").collection("admin");
});

const fetchToken = (email, id) => {
  return jwt.sign(
      {email: email, id: id, exp: Math.floor(Date.now() / 1000) + 60 * 60 },
      jwtSecret
  );
};

const authMiddleWare = async (req, res, next) => {

  if(!("email" in req.body) || !("pass" in req.body)){
    res.status(200).send({error: "ok", message: "Email/Pass is required to auth!"});
    return;
  }

  if(!validateCredentials(res, req.body['email'], req.body['pass'])) return;

  const cursor = admin_collection.find({email: req.body["email"]});
  const result = await cursor.toArray();

  if(result.length < 1){
    res.status(200).send({error: "ok", message: "Email not found in database!"});
    return;
  }

  const pass = result[0]["pass"]

  if(!bcrypt.compareSync(req.body["pass"], pass)){
    res.status(200).send({error: "ok", message: "Incorrect password!"});
    return;
  }

  req.body["uid"] = result[0]["_id"];

  next();

};

let symptoms_map = new Map()
symptoms_map.set("0", "None")
symptoms_map.set("1", "Headache")
symptoms_map.set("2", "Dizziness")
symptoms_map.set("3", "Nausea")
symptoms_map.set("4", "Fatigue")
symptoms_map.set("5", "Sadness")

const comp_symptoms_map = new Map(symptoms_map)

const severity_map = new Map()
severity_map.set("0", "None")
severity_map.set("1", "mild")
severity_map.set("2", "mild")
severity_map.set("3", "moderate")
severity_map.set("4", "severe")

let from; // personal
let to; // twilio

function sendMsg(msg){
  twilio_client.messages.create({
    body: msg,
    from: to, to: from
  }).then().catch();
}

function sendSymptomMsg() {
  let str = ""
  for (const [key, value] of symptoms_map) {
    str += "(" + key + ")" + value + ", ";
  }
  sendMsg('Please indicate your symptom ' + str);
}

async function sendConvo(resp){
  let profile = await profileCheck(from);

  if(profile === false || profile[0]["stage"] === '-1'){
    sendMsg('Please start the checkup with sending `start`.');
    return;
  }

  const info = profile[0];
  for (let i = 0; i < info["symptom"].length; i++) {
    symptoms_map.delete(info["symptom"][i])
  }

  if(info["stage"] === '0'){

    if(!symptoms_map.has(resp)){
      let str = ""
      for (const [key] of symptoms_map) {
        str += key + ",";
      }
      sendMsg('Please enter a valid number (' + str + ')')
      return;
    }

    const symptom = symptoms_map.get(resp);

    if(symptom === "None") {
      sendMsg('Thank you and we will check with you later.');
      await user_collection.updateOne({_id: from}, {$set: {stage: '-1', times: 0}});
      return;
    }

    await user_collection.updateOne({_id: from}, {$set: {stage: '1'}});
    await user_collection.updateOne({_id: from}, {$push: {symptom: resp}});
    sendMsg('On a scale from 0 (none) to 4 (severe), how would you rate your ' + symptom + ' in the last 24 hours?');

  }else if(info["stage"] === '1'){

    if(!severity_map.has(resp)){
      let str = ""
      for (const [key] of severity_map) {
        str += key + ",";
      }
      sendMsg('Please enter a valid number (' + str + ')')
      return;
    }

    const severity = severity_map.get(resp);
    let symptoms = info["symptom"];
    let symptom = comp_symptoms_map.get(symptoms[symptoms.length-1]);

    let times = info["times"];

    if(severity === "None"){
      sendMsg("You do not have " + symptom);
    }else{
      sendMsg("You have a " + severity + " " + symptom);
    }
    await user_collection.updateOne({_id: from}, {$push: {severity: resp}});

    if(times >= 2) {
      await user_collection.updateOne({_id: from}, {$set: {stage: '-1', times: 2}});
      sendMsg("Thank you and see you soon");
    } else {
      await user_collection.updateOne({_id: from}, {$set: {stage: '0', times: times + 1}});
      sendSymptomMsg();
    }

  }
}

  app.post('/sms', async(req) => {

    const resp = req.body.Body; // message
    from = req.body.From; // personal
    to = req.body.To; // twilio

    if(resp.toLowerCase() === "start"){
      let profile = await profileCheck(from);

      if(profile === false){
        sendMsg("Welcome to the study");
        symptoms_map = new Map(comp_symptoms_map);
        await user_collection.insertOne({_id: from, symptom: [], severity: [], stage: '0', times: 0, date: new Date().toLocaleDateString()});
      }else{
        sendMsg("Welcome back to the study!");
        symptoms_map = new Map(comp_symptoms_map);
        await user_collection.updateOne({_id: from}, {$set: {symptom: [], severity: [], stage: '0', times: 0}})
      }
      sendSymptomMsg();

    }else{

      await sendConvo(resp);

    }

  });

const jwtVerificationMiddleware = async (req, res, next) => {
  let token = req.header("x-jwt-token");
  if (token) {
    try {
      req.decodedToken = jwt.verify(token, jwtSecret);
      next();
    } catch (err) {
      res.status(200).send({error: "ok", message: "Invalid token", fullError: err});
    }
  } else {
    res.status(200).send({error: "ok", message: "x-jwt-token header is required"});
  }
};

app.post('/admin/login', authMiddleWare, async function (req, res) {
  res.status(200).send({status: "ok", uid: req.body["uid"], token: fetchToken(req.body["email"], req.body["uid"]), email: req.body["email"]});
});

function validateCredentials(res, email, pass){
  if(!validateEmail(email)){
    res.status(200).send({error: "ok", message: "Invalid email provided!"});
    return false;
  }
  else if(!validatePass(pass)){
    res.status(200).send({error: "ok", message: "Invalid pass provided!"});
    return false;
  }
  return true;
}

function validatePass(pass){
  return pass.length >= 7;
}

function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

app.post('/admin/signup', async function (req, res) {
  if(!("email" in req.body) || !("pass" in req.body)){
    res.status(200).send({error: "ok", message: "Email/Pass is required to sign up!"});
    return;
  }

  if(!validateCredentials(res, req.body['email'], req.body['pass'])) return;

  const salt = bcrypt.genSaltSync(10); // hashing
  const hash = bcrypt.hashSync(req.body["pass"], salt);

  await admin_collection.insertOne({email: req.body["email"], pass: hash}, async function(err, sign_result){
    if(err !== undefined && err.code === 11000){
      res.status(200).send({error: "ok", message: "Email already registered!"});
      return;
    }
    res.status(200).send({status: "ok", uid: sign_result.insertedId, token: fetchToken(req.body["email"], sign_result.insertedId), email: req.body["email"]});
  });

});

app.get('/users', jwtVerificationMiddleware, async function (req, res) {
  const cursor =  user_collection.find({});
  const result = await cursor.toArray();
  if(result.length < 1){
    res.status(200).send({});
  }else{
    res.status(200).send(result);
  }
});

app.post('/delete/user', jwtVerificationMiddleware, async function (req, res) {
  if(!("_id" in req.body)){
    res.status(200).send({error: "ok", message: "ID is required to delete!"});
    return;
  }
  user_collection.deleteOne({_id: req.body['_id']});
  res.status(200).send({});

});

  async function profileCheck(number){
    const cursor = user_collection.find({_id: number});
    const result = await cursor.toArray();
    if(result.length < 1) return false;
    return result;
  }

  app.listen(port, () => {
    console.log(`Started on http://localhost:${port}`);
  });