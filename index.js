const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.8jrtwg1.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// jwt (verifyJWT) function
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message: 'unauthorized access'});
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.USER_ACCESS_TOKEN, function(err, decoded) {
        if(err){
            return res.status(403).send({message: 'Fobidden access'})
        }
        req.decoded = decoded;
        next();
    })
}

// async function (mongodb)
async function run() {
    try{
        const serviceCollection = client.db('serviceReview').collection('services');
        const reviewCollection = client.db('serviceReview').collection('reviews');


        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.USER_ACCESS_TOKEN, { expiresIn: '1d'});
            res.send({token});

        })

        // get services
        app.get('/services', async(req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        // get data with limit method
        app.get('/services/limit', async(req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.limit(3).toArray();
            res.send(services);
        });


        // get service id
        app.get('/services/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });

        // post add service
        app.post('/services', async(req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send(result);
        });

        //get reviews
        app.get('/reviews', async(req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews.sort().reverse());
        });

        // get reviews id
        app.get('/reviews/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const review = await reviewCollection.findOne(query);
            res.send(review);
        });

        // Post review
        app.post('/reviews', async(req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        });

        // delete reviews id
        app.delete('/reviews/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = reviewCollection.deleteOne(query);
            res.send(result);
        });

        // update reviews
        app.put('/reviews/:id', async(req, res) => {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)};
            const review = req.body;
            const option = {upsert: true};
            const updatedReview = {
                $set: {
                    name: review.name,
                    photoURL: review.photoURL,
                    email: review.email,
                    serviceId: review.serviceId,
                    serviceName: review.serviceName,
                    message: review.message
                }
            }
            const result = await reviewCollection.updateOne(filter, updatedReview, option);
            res.send(result);
        });

    }
    finally{

    }
}

run().catch(err => console.error(err));


app.get('/', (req, res) => {
    res.send('Service Review Server is Running.');
});

app.listen(port, () => {
    console.log(`Server Running On: ${port}`);
});