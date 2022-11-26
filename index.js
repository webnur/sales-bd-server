const express = require('express');
const cors = require('cors');
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


async function run () {
    const productsCollection = client.db('salesBb').collection('products');
    const CategoriesCollection = client.db('salesBb').collection('categories');
    const bookingCollection = client.db('salesBb').collection('bookings');
    const usersCollection = client.db('salesBb').collection('users');

    app.get('/products', async(req, res) => {
        const query = {};
        const products = await productsCollection.find(query).toArray();
        res.send(products)
    });

    app.post('/products', async(req, res) => {
        const product = req.body;
        const result = await productsCollection.insertOne(product);
        res.send(result)
    })

    app.get('/categories', async(req, res) => {
        const query = {};
        const categories = await CategoriesCollection.find(query).toArray();
        res.send(categories)
    })
    app.get('/category/:id', async(req, res) => {
        const id = req.params.id;
        const query = {category_id: id}
        const category = await productsCollection.find(query).toArray()
        res.send(category)
    })

    // booking collection area start
    app.post('/bookings', async(req, res) => {
        const booking = req.body;
        console.log(booking)
        const result = await bookingCollection.insertOne(booking);
        res.send(result)
    })

    app.get('/bookings', async(req, res) => {
        let query = {};
        const email = req.query.email;
        if(email){
            query= {
                email: email,
            }
        }
        const booking = await bookingCollection.find(query).toArray();
        res.send(booking)
    })


    // user area 
    app.post('/users', async(req, res) => {
        const user = req.body;
        const result = await usersCollection.insertOne(user);
        res.send(result)
    })

}

run().catch(error => console.error(error))
app.get('/', (req, res) => {
    res.send('Assignment 12 Server is run')
});

app.listen(port, () => console.log(`the server is run on port ${port}`))