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
  const [year, month, day] = dateStr.split("-");
  return new Date(year, month - 1, day);
};

const newUser = async (req) => {
  const users = db.collection("users");
  const _user = req?.body?.username;
  let response = {};
  let userAdded = {};

  try {
    response = await users.insertOne({ username: _user });
    userAdded = {
      username: _user,
      _id: response?.insertedId?.toString(),
    };
  } catch (e) {
    userAdded = {
      error: "Username is required",
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

const getExercises = async () => {
  const exercises = db.collection("exercises");
  const response = exercises.find({});
  const allValues = await response.toArray();

  return allValues;
};

const newExercise = async (req) => {
  const exercises = db.collection("exercises");
  const users = db.collection("users");
  const formParams = req?.body;
  let _response = {};

  try {
    const allUsers = await getUsers();

    const user = allUsers.find(
      (user) => user["_id"].toString() === formParams[":_id"]
    );

    if (user) {
      await exercises.insertOne({
        username: user?.username,
        description: formParams?.description,
        duration: Number(formParams?.duration),
        date: formParams?.date
          ? toDate(formParams?.date).toDateString()
          : new Date().toDateString(),
      });

      _response = {
        _id: user["_id"].toString(),
        username: user?.username,
        date: formParams?.date
          ? toDate(formParams?.date).toDateString()
          : new Date().toDateString(),
        duration: Number(formParams?.duration),
        description: formParams?.description,
      };

      return _response;
    }
  } catch (e) {
    _response = {
      error: e,
    };
    return _response;
  }
};

const logsMiddleware = async (req) => {
  const _id = req?.params?._id;
  const { from, to, limit } = req.query;

  const allUsers = await getUsers();
  const user = allUsers.find((user) => user["_id"].toString() === _id);

  const allExercises = await getExercises();
  const _userExercises = allExercises.filter(
    (exercise) => exercise["username"] === user.username
  );

  const exercisesFiltered = _userExercises.map((exercise) => {
    return {
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date
    }
  })

  const response = {
    _id: _id,
    username: user.username,
    count: _userExercises.length,
    log: exercisesFiltered,
  };

  return response;
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
    console.log(response);
    res.send(response);
  });
});
app.get("/api/users/:_id/logs", (req, res) => {
  logsMiddleware(req).then((response) => {
    res.json(response);
  });
});
app.post("/api/users/:_id/exercises", (req, res) => {
  newExercise(req).then((response) => {
    console.log(response);
    res.json(response);
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

module.exports = app;
