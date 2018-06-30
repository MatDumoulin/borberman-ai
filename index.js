const express = require('express');
const app = express();

/* app.get('/', (req, res) => {
    console.log(req.url);
    res.sendFile(req.url, {root: __dirname});
}); */

app.use(express.static(__dirname));

app.listen(3000, () => console.log('Example app listening on port 3000!'));