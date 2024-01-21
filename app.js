const express= require('express');
const Pool = require("pg").Pool;
const doenv = require("dotenv");
const path=require('path');
const hbs=require("hbs");
const app=express();
//doenv.config({
//   path:''
//});
const pool = new Pool({
    host: "localhost",
    database: "login_system",
    port: 5432,
    user: "postgres",
    password: "root",
  });
// Check the PostgreSQL database connection
pool.connect((err, client) => {
    if (err) {
        console.error("Error connecting to the PostgreSQL database:", err);
    } else {
        console.log("Connected to the PostgreSQL database");

        // Release the client back to the pool
        client.release();
    }
});

app.use(express.urlencoded({ extended: false }));

const location=path.join(__dirname,"./public");
app.use(express.static(location));
app.set("view engine", "hbs");

app.get("/",(req,res)=>{
    //res.send("<h1>Hello everyone!</h1>");
    res.render("index");

});
app.get("/login",(req,res)=>{
    res.render("login");

});
app.get("/signup",(req,res)=>{
    res.render("signup");

});
app.get("/admin_login",(req,res)=>{
    res.render("admin_login");

});

app.get('/search', (req, res) => {
    res.render('search');
});
app.get('/cities', (req, res) => {
    res.render('cities');
});



app.get('/editcenter/:id', async (req, res) => {
    try {
        // Fetch center data by ID from the database
        const centerId = req.params.id;
        const centerResult = await pool.query('SELECT * FROM centers WHERE id = $1', [centerId]);

        if (centerResult.rows.length > 0) {
            const center = centerResult.rows[0];
            // Render a form to edit the center
            res.render('editcenter', { center });
        } else {
            res.status(404).send('Center not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/updatecenter/:id', async (req, res) => {
    try {
        // Update center details in the database
        const centerId = req.params.id;
        const { centerName, centerAddress } = req.body;

        // Validate that the required fields are not null
        if (!centerName || !centerAddress) {
            return res.status(400).send('Name and Address are required');
        }

        await pool.query('UPDATE centers SET name = $1, address = $2 WHERE id = $3', [centerName, centerAddress, centerId]);

        // Redirect back to the page displaying all cities after the update
        res.redirect('/auth/cities');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


// In your server-side code (e.g., app.js or routes file)
app.get('/deletecenter/:id', async (req, res) => {
    try {
        // Delete center by ID from the database
        const centerId = req.params.id;

        await pool.query('DELETE FROM centers WHERE id = $1', [centerId]);

        // Redirect back to the page displaying all cities after the deletion
        res.redirect('/auth/cities');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/search', async (req, res) => {
    const query = req.query.query; // Get the query parameter from the URL

    if (query) {
        // If there is a query parameter, check if it matches any city name (case-insensitive)
        try {
            const result = await pool.query('SELECT id FROM cities WHERE LOWER(name) = LOWER($1)', [query]);

            console.log(result.rows);  // Add this line to log the query result

            if (result.rows.length > 0) {
                // If a match is found, redirect to the /select page
                res.redirect('/select');
            } else {
                // If no match is found, you can handle it as needed (e.g., show an error)
                res.status(404).send('City not found');
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        // If no query parameter is provided, render the search.hbs file
        res.render('search');
    }
});


app.get('/select', async (req, res) => {
    try {
        const citiesResult = await pool.query('SELECT * FROM cities');
        const cities = citiesResult.rows;

        for (const city of cities) {
            const centersResult = await pool.query('SELECT * FROM centers WHERE city_id = $1', [city.id]);
            city.centers = centersResult.rows;
        }

        // Render the select.hbs file with a list of cities and centers
        res.render('select', { cities });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Add a route to handle the redirection to the book.hbs file when clicking on select
app.get('/selectcenter/:id', async (req, res) => {
    try {
        const centerId = req.params.id;
        const centerResult = await pool.query('SELECT * FROM centers WHERE id = $1', [centerId]);

        if (centerResult.rows.length > 0) {
            const center = centerResult.rows[0];
            res.render('book', { center });
        } else {
            res.status(404).send('Center not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/checkCity', async (req, res) => {
    try {
        const cityName = req.query.city;

        // Query the cities table to check if the city exists
        const result = await pool.query('SELECT EXISTS(SELECT 1 FROM cities WHERE name = $1) as exists', [cityName]);

        // Send the result as JSON
        res.json({ exists: result.rows[0].exists });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.use("/auth", require("./routes/auth"));

app.listen(5000,()=>{
    console.log("Server started @ port 5000");
});