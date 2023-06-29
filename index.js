const express = require('express')
const {MongoClient} = require('mongodb')
const app = express()
const cors = require('cors')
require('dotenv').config()
app.use(cors())
app.use(express.static(__dirname + '/public/'))

const client = new MongoClient(process.env.DB_URI);
const db = client.db('exercise_tracker')

const newUser = (req) => {
  db
    ? console.log('Conectado a la BBDD')
    : console.log('No conectado')
}

const newExercise = (req) => {
  db
    ? console.log('Conectado a la BBDD')
    : console.log('No conectado')
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.post('/api/users', (req, res) => {
  newUser(req)
  res.json({newUser:'newUser'})
});
app.post('/api/users/:_id/exercises', (req, res) => {
  newExercise(req)
  res.json({addExer:'addExer'})
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

module.exports = app
