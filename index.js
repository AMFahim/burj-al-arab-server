const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const MongoClient = require('mongodb').MongoClient;
var admin = require("firebase-admin");
require('dotenv').config()
// console.log(process.env.DB_PASS)
const port = 4000

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uy9m4.mongodb.net/burjAlArab?retryWrites=true&w=majority`;

const app = express()
app.use(cors())
app.use(bodyParser.json())



var serviceAccount = require("./configs/burj-al-arab-9cc1f-firebase-adminsdk-35jqy-241fadd1b0.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookings = client.db("burjAlArab").collection("booking");

  app.post('/addBooking', (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking)
      .then(result => {
        res.send(result.insertedCount > 0)
      })
    // console.log(newBooking);
  })


  app.get('/booking', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            bookings.find({ email: queryEmail })
              .toArray((err, documents) => {
                res.status(200).send(documents);
              })
          }
          else{
            res.status(401).send('Unauthorized access')
          }
        })
        .catch((error) => {
          res.status(401).send('Unauthorized access')
        });
    }
   else{
     res.status(401).send('Unauthorized access')
   }


  })

});


// admin.initializeApp({
//   credential: admin.credential.applicationDefault(),
//   databaseURL: 'https://<DATABASE_NAME>.firebaseio.com'
// });


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port)