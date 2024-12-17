const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = 3000;

const pool = new Pool({
    user: 'postgres',    
    host: 'localhost',          
    database: 'project',  
    password: '123456',   
    port: 5432,                  
});

app.use(cors());

app.get('/attractions', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, coordinates, description, type, image_urls FROM attractions');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка сервера');
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});