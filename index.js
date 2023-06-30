const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const app = express();
const cors = require("cors");
require("dotenv").config();
app.use(cors());
app.use(express.urlencoded());
app.use(express.json());
app.use(express.static(__dirname + "/public/"));

const client = new MongoClient(process.env.DB_URI);
const db = client.db("exercise_tracker");
db.command({
  collMod: "users",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username"],
      properties: {
        username: {
          bsonType: "string",
          minLength: 1,
          description: "must be a string and is required",
        },
      },
    },
  },
});

db.command({
  collMod: "exercises",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["description", "duration"],
      properties: {
        description: {
          bsonType: "string",
          minLength: 1,
          description: "must be a string and is required",
        },
        duration: {
          bsonType: "int",
          minimum: 1,
          description: "must be a number and minimum 1.",
        },
        date: {
          bsonType: "string",
          minLength: 1,
          description: "must be a string and is required",
        },
      },
    },
  },
});

const toDate = (dateStr) => {
  const [year, month, day] = dateStr.split("-")
  return new Date(year, month - 1, day)
}

const newUser = async (req) => {
  const users = db.collection("users");
  const _user = req?.body?.username;
  let response = {};
  let userAdded = {}

  try{
    response = await users.insertOne({ username: _user })
    userAdded = {
      username: _user,
      _id: response?.insertedId?.toString(),
    };
  }catch(e){
    userAdded = {
      error : 'Username is required'
    };
  }

  return userAdded;
};

const getUsers = async () => {
  const users = db.collection("users");
  const response = users.find({});
  const allValues = await response.toArray();

  return allValues;
};

const newExercise = async (req) => {
  const exercises = db.collection("exercises");
  const users = db.collection("users");
  const formParams = req?.body
  let response = {};

  try{
    users.find({ _id: new ObjectId(formParams[':_id'])})
    console.log({ 
      id: formParams[':_id'],
      username: user.toArray(),
      description: formParams?.description,
      duration: Number(formParams?.duration),
      date: formParams?.date ? toDate(formParams?.date).toDateString() : new Date().toDateString()
    })
    await exercises.insertOne({ 
      username: user?.username,
      description: formParams?.description,
      duration: Number(formParams?.duration),
      date: formParams?.date ? toDate(formParams?.date).toDateString() : new Date().toDateString()
    });
    
    response = {

    }
  }catch(e){
    console.log(e)
    userAdded = {
      error : e
    };
  }
};

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
app.post("/api/users", (req, res) => {
  newUser(req).then((response) => {
    res.json(response);
  });
});
app.get("/api/users", (req, res) => {
  getUsers().then((response) => {
    res.send(response);
  });
});
app.post("/api/users/:_id/exercises", (req, res) => {
  newExercise(req).then((response) => {
    res.json({ addExer: "addExer" });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

module.exports = app;
