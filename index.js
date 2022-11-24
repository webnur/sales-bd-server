const express = require('express');
const cors = require('cors');
const port = process.env.port ||5000
const app = express();

app.use(cors());
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Assignment 12 Server is run')
});

app.listen(port, () => console.log(`the server is run on port ${port}`))