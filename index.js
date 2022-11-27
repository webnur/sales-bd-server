const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const port = process.env.port || 5000
require('dotenv').config();
const app = express();


//middleware
app.use(cors());
app.use(express.json())


//dbuser = salesBd
//password = Ago3oXoqLFul9xkZ


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6x8xxck.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req,res, next){
    console.log(req.headers.authorization);
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send('unauthorized access')
    }
    const token =authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_TOKEN, function(err, decoded){
        if(err){
            return res.status.send({message: 'forbidden access'})
        }
        req.decoded = decoded;
        next();
    })
}


async function run() {
    try {
        const productsCollection = client.db('salesBb').collection('products');
        const CategoriesCollection = client.db('salesBb').collection('categories');
        const bookingCollection = client.db('salesBb').collection('bookings');
        const usersCollection = client.db('salesBb').collection('users');

        app.get('/products', async (req, res) => {
            const email = req.query.email;
            const query = {};
            const products = await productsCollection.find(query).toArray();
            res.send(products)
        });

        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result)
        })

        app.get('/categories', async (req, res) => {
            const query = {};
            const categories = await CategoriesCollection.find(query).toArray();
            res.send(categories)
        })
        app.get('/category/:id', async (req, res) => {
            const id = req.params.id;
            const query = { category_id: id }
            const category = await productsCollection.find(query).toArray()
            res.send(category)
        })

        // booking collection area start
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking)
            const result = await bookingCollection.insertOne(booking);
            res.send(result)
        })

        app.get('/bookings',verifyJWT, async (req, res) => {
            // let query = {};
            const email = req.query.email;

            // if (email) {
            //     query = {
            //         email: email,
            //     }
            // }

            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }


            const query = {email: email}

            const booking = await bookingCollection.find(query).toArray();
            res.send(booking)
        })

        // json web token
        app.get('/jwt', async(req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const user = await usersCollection.findOne(query);
            console.log(user)
            if(user){
                const token = jwt.sign({email}, process.env.JWT_TOKEN, {expiresIn: '1d'})
                return res.send({accessToken: token})
            }
            res.status(403).send({accessToken: '' })
        })

        // user area 
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)
        });

        app.get('/users/:role', async(req, res) => {
            const role = req.params.role;
            const query = {role: role};
            const result = await usersCollection.find(query).toArray();
            res.send(result)
        })


        app.get('/users/admin/:email', async(req, res) => {
            const email = req.params.email;
            const query = {email}
            const user = await usersCollection.findOne(query);
            res.send({isAdmin: user?.role === 'admin'})
        })
        app.get('/users/seller/:email', async(req, res) => {
            const email = req.params.email;
            const query = {email}
            const user = await usersCollection.findOne(query);
            res.send({IsSeller: user?.role === 'seller'})
        })


    }
    finally {

    }
}

run().catch(error => console.error(error))
app.get('/', (req, res) => {
    res.send('Assignment 12 Server is run')
});

app.listen(port, () => console.log(`the server is run on port ${port}`))