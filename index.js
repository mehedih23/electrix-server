const express = require('express')
const jwt = require('jsonwebtoken');
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


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized Access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JSONWEBTOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden' })
        }
        req.decoded = decoded;
        next();
    });
}


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
        const userCollection = client.db("electrix").collection("users");


        //-------------------- PAYMENT START ------------------------//
        app.post("/create-payment-intent", verifyJWT, async (req, res) => {
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
        //-------------------- PAYMENT End ------------------------//

        // ------------------- ALL POST API START ------------------- //

        // order //
        app.post('/order', verifyJWT, async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })

        // review //
        app.post('/review', verifyJWT, async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        })










        // ------------------- ALL POST API END ------------------- //


        // ------------------- ALL GET API START ------------------- //

        // Tools //
        app.get('/tools', async (req, res) => {
            const result = await toolCollection.find().toArray();
            res.send(result);
        })

        app.get('/tool/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await toolCollection.findOne(query);
            res.send(result);
        })


        // Order //
        app.get('/order', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await orderCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/order/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.findOne(query);
            res.send(result);
        })

        // review //
        app.get('/review', async (req, res) => {
            const result = await reviewCollection.find().toArray();
            res.send(result);
        })

        // user //
        app.get('/user', async (req, res) => {
            const email = req.query.email
            const query = { email: email };
            const result = await userCollection.findOne(query);
            res.send(result);
        })

        app.get('/users', verifyJWT, async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        })

        // User / Admin //
        app.get('/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin });
        })






        // ------------------- ALL GET API END ------------------- //



        // ------------------- ALL PUT API START ------------------- //

        // User //
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await userCollection.updateOne(filter, updateDoc, options);

            const token = jwt.sign({ email: email }, process.env.JSONWEBTOKEN, { expiresIn: '1d' });
            res.send({ result, token })
        })

        // User / Admin //
        app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: 'admin' }
                };
                const result = await userCollection.updateOne(filter, updateDoc);
                res.send(result)
            }
            else {
                res.status(403).send({ message: 'Forbidden' });
            }
        })






        // ------------------- ALL PUT API END ------------------- //



        // ------------------- ALL PATCH API  START ------------------- //

        // Order //
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

        app.patch('/user/:id', async (req, res) => {
            const id = req.params.id;
            const user = req.body;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = { $set: user }
            const result = await userCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })




        // ------------------- ALL PATCH API END ------------------- //




        // ------------------- ALL DELETE API START ------------------- //
        // Order //
        app.delete('/order/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        });


        // Users //
        app.delete('/users/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await userCollection.deleteOne(query);
            res.send(result);
        })



        // ------------------- ALL DELETE API END ------------------- //


    }
    finally {

    }
}

run().catch(console.dir);


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})