const express = require('express');
const cors = require('cors');
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken')

// Middlewares
app.use(cors());
app.use(express.json());


const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'Unauthorized Access' })
    }
    // bearer token
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next()
    })
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4bdkenh.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        const usersCollection = client.db("summer_camp").collection("users");
        const classesCollection = client.db("summer_camp").collection("classes");
        // const allClassesCollection = client.db("summer_camp").collection("allclass");
        const instructorCollection = client.db("summer_camp").collection("instructor");



        // jwt api
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token })
        })


        // users api

        app.get("/users", async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result)
        })

        app.post("/users", async (req, res) => {
            const user = req.body;
            console.log(user);
            const query = { email: user.email }
            console.log(query);
            const existingUser = await usersCollection.findOne(query);
            console.log('existing user', existingUser);
            if (existingUser) {
                return res.send({ message: 'user already exists' })
            }
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })

        // admin api

        app.get('/users/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if (req.decoded.email !== email) {
                return res.status(401).send({ admin: false })
            }
            const query = { email: email };
            const user = await usersCollection.findOne(query)
            const result = { admin: user?.role === 'admin' }
            res.send(result)
        })


        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    role: 'admin'
                },
            }
            const result = await usersCollection.updateOne(filter, updatedDoc);
            res.send(result)
        })


        // instructor api


        app.get("/users/instructor/:email", verifyJWT, async (req, res) => {
            const email = req.params.email;

            if (req.decoded.email !== email) {
                return res.status(401).send({ instructor: false })
            }

            const query = { email: email };
            const user = await usersCollection.findOne(query);
            const result = { instructor: user?.role === 'instructor' }
            res.send(result)
        })

        app.patch('/users/instructor/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'instructor'
                }
            };
            const result = await usersCollection.updateOne(filter, updatedDoc);
            res.send(result)
        })

        // add class api




        app.get('/classes', async (req, res) => {
            const email = req.query.email;
            // console.log(email);
            // if (!email) {
            //     res.send([])
            // }

            // const decodedEmail = req.decoded.email;
            // if (email !== decodedEmail) {
            //     return res.status(403).send({ error: true, message: 'Forbidden Access' })
            // }


            const query = { email: email };
            const result = await classesCollection.find().toArray();
            res.send(result)

        })

        app.post('/classes', async (req, res) => {
            const item = req.body;
            const result = await classesCollection.insertOne(item);
            res.send(result)
        })

        // all instructors
        app.get("/allinstructors", async (req, res) => {
            const result = await instructorCollection.find().toArray();
            res.send(result);
        })

        app.post("/allinstructors", async (req, res) => {
            const user = req.body;
            const result = await instructorCollection.insertOne(user)
            res.send(result)
        })



        // admin apis

        app.get("/classes/:id", async(req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const result = await classesCollection.findOne(query);
            res.send(result)
        })

        app.put('/classes/:id', async (req, res) => {
            const id = req.params.id;
            const classes = req.body;
            const filter = { _id: new ObjectId(id) };
            const option = { upsert: true };
            const updateDoc = {
              $set: {
                status: 'Approved'
              }
            }
            const result = await classesCollection.updateOne(filter,updateDoc,option);
            res.send(result)
          })


          app.patch("/classes/:id", async(req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id)};
            const option = {upsert: true};
            const updateDoc = {
                $set: {
                    status: 'Denied'
                }
            }
            const result = await classesCollection.updateOne(filter, updateDoc,option)
            res.send(result)
          })





        //////////////////////////////////////////////
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Welcome to Summer camp School")
})

app.listen(port, () => {
    console.log("Summer is running on port", port);
})