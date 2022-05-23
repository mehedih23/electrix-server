const express = require('express')
const cors = require('cors');
const app = express()
const port = process.env.PORT || 1111
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)



app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send('Hello World!')
})




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zsnpu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        console.log('database connected')
        const toolCollection = client.db("electrix").collection("tools");
        const orderCollection = client.db("electrix").collection("orders");
        const paymentCollection = client.db("electrix").collection("payments");
        const reviewCollection = client.db("electrix").collection("reviews");


        //-------------------- PAYMENT ------------------------//
        app.post("/create-payment-intent", async (req, res) => {
            const service = req.body;
            const price = service.price;
            const amount = parseFloat(price) * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            })
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });


        // ------------------- ALL POST API ------------------- //

        // order //
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })

        // review //
        app.post('/review', async (req, res) => {
            const order = req.body;
            const result = await reviewCollection.insertOne(order);
            res.send(result);
        })













        // ------------------- ALL GET API ------------------- //

        // Tools //
        app.get('/tools', async (req, res) => {
            const result = await toolCollection.find().toArray();
            res.send(result);
        })

        app.get('/tool/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await toolCollection.findOne(query);
            res.send(result);
        })


        // Order //
        app.get('/order', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await orderCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.findOne(query);
            res.send(result);
        })













        // ------------------- ALL PUT API ------------------- //













        // ------------------- ALL PATCH API ------------------- //
        app.patch('/order/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const result = await paymentCollection.insertOne(payment);
            const updateOrder = await orderCollection.updateOne(filter, updatedDoc)
            res.send(updatedDoc);
        })










        // ------------------- ALL DELETE API ------------------- //
        // Order //
        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        })











    }
    finally {

    }
}

run().catch(console.dir);




















app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})