const express = require('express')
const cors = require('cors');
const app = express()
const port = process.env.PORT || 1111
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()





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


        // ------------------- ALL POST API ------------------- //
        app.post('/order', async (req, res) => {
            const order = req.body;
            console.log(order)
            const result = await orderCollection.insertOne(order);
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















        // ------------------- ALL PUT API ------------------- //













        // ------------------- ALL PATCH API ------------------- //











        // ------------------- ALL DELETE API ------------------- //












    }
    finally {

    }
}

run().catch(console.dir);




















app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})