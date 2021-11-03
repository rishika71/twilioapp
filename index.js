require('dotenv').config();

const twilio_client = require('twilio')("AC8b26198f1af777d49d8382d17a5fdbff", "f5a136880fe3fc6494351b862aa1b62b");
const express = require('express');
const {MongoClient} = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));

const client = new MongoClient("mongodb+srv://root:HdjW4DK9xFxcCbHH@cluster0.rxdum.mongodb.net/myFirstDatabase?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });

let user_collection;

client.connect(() => {
  user_collection = client.db("user").collection("user");
});

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
      sendMsg("You do not have a " + symptom);
      return;
    }

    sendMsg("You have a " + severity + " " + symptom);
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
        await user_collection.insertOne({_id: from, symptom: [], severity: [], stage: '0', times: 0});
      }else{
        sendMsg("Welcome back to the study!");
        await user_collection.updateOne({_id: from}, {$set: {symptom: [], severity: [], stage: '0', times: 0}})
      }
      sendSymptomMsg();

    }else{

      await sendConvo(resp);

    }

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