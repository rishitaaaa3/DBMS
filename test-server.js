const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.json({ message: 'Test server is working!' });
});

const PORT = 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Test server running on port ${PORT}`);
}); 