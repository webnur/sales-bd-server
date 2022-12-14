const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const port = process.env.port || 5000
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();


//middleware
app.use(cors());
app.use(express.json())


//dbuser = salesBd
//password = Ago3oXoqLFul9xkZ


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6x8xxck.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req,res, next){
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
        const paymentsCollection = client.db('salesBb').collection('payments');
        const subscriberCollection = client.db('salesBb').collection('subscriber');
        const wishlistCollection = client.db('salesBb').collection('wishlist');


        app.get('/products', async (req, res) => {
            const email = req.query.email;
            const query = {email};
            const products = await productsCollection.find(query).toArray();
            res.send(products)
        });

        app.get('/advertise/:advertise', async(req, res) => {
            const advertise = req.params.advertise;
            const query = {advertise: true};
            const product = await productsCollection.find(query).toArray();
            res.send(product)
        })

        app.delete('/product/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = productsCollection.deleteOne(query);
            res.send(result)
        })


        app.put('/advertise/:id', async(req, res) => {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)};
            const options = { upsert: true };
            const updatedDoc = {
                $set:{
                    advertise: true
                }
            }
            const advertise = await productsCollection.updateOne(filter, updatedDoc, options);
            res.send(advertise)
        })

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


        // wishList method
        app.post('/wishlist', async(req, res) => {
            const wishlist = req.body;
            const result = await wishlistCollection.insertOne(wishlist);
            res.send(result)
        })

        app.get('/wishlist/:email', async(req, res) => {
            const email = req.params.email;
            const query = {email: email};
            const wishlist = await wishlistCollection.find(query).toArray();
            res.send(wishlist)
        });

        app.delete('/wishlist/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await wishlistCollection.deleteOne(query);
            res.send(result)
        })
        


        // booking collection area start
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
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

        app.get('/bookings/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const booking = await bookingCollection.findOne(query);
            res.send(booking)
        })



          // payment method added 
        app.post("/create-payment-intent", async(req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = parseInt(price) * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: "usd",
                amount: amount,
                "payment_method_types": [
                    "card"
                  ],
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
              });
        })

        
        app.post('/payments', async(req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId;
            const filter = {_id: ObjectId(id)};
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })





        // json web token
        app.get('/jwt', async(req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const user = await usersCollection.findOne(query);
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

        app.delete('/users/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await usersCollection.deleteOne(query);
            res.send(result)
        })

        app.get('/users/seller/:email', async(req, res) => {
            const email = req.params.email;
            const query = {email}
            const user = await usersCollection.findOne(query);
            res.send({IsSeller: user?.role === 'seller'})
        })

        // seller verified
        app.put('/sellerverified', async(req, res) => {
            const email = req.query.email;
            const filter = { email};
            const options = { upsert: true };
            const updatedDoc = {
                $set:{
                    status: 'verified'
                }
            }

            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            const result2 = await productsCollection.updateMany(filter, updatedDoc, options);
            res.send({result, result2})

        })


        app.post('/subscriber', async(req, res) => {
            const subscriber = req.body;
            const result = await subscriberCollection.insertOne(subscriber)
            res.send(result)
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