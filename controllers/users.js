const { Pool } = require("pg");
const bcrypt = require("bcrypt");


const pool = new Pool({
    host: "localhost",
    database: "login_system",
    port: 5432,
    user: "postgres",
    password: "root",
});

exports.login = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        if (!email || !password) {
            return res.status(400).render("login", { msg: "Invalid email or password" });
        }

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        console.log(result);
        console.log("Result from database:", result.rows);

        if (result.rows.length <= 0) {
            return res.status(401).render("login", { msg: "Invalid email or password" });
        } else {
            const storedHashedPassword = result.rows[0].pass;
            console.log("Stored Hashed Password:", storedHashedPassword);

            if (!(await bcrypt.compare(password, storedHashedPassword))) {
                return res.status(401).render("login", { msg: "Invalid password" });
            } else {
                // Redirect to http://localhost:3000/bookuser after successful login
                return res.redirect('http://localhost:5000/search');

            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
};


exports.signup = async (req, res) => {
    console.log(req.body);
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    console.log(name);
    console.log(email);

    // Check if the email already exists
    try {
        const result = await pool.query('SELECT email FROM users WHERE email = $1', [email]);

        if (result.rows.length > 0) {
            // Email already exists, provide feedback to the user
            return res.render('signup', { msg: 'Email already taken' });
        } else {
            // Email is unique, proceed with the registration
            // Hash the password before storing it in the database
            const hashedPassword = await bcrypt.hash(password, 8);

            // Insert the user data into the database
            await pool.query('INSERT INTO users (name, email, pass) VALUES ($1, $2, $3)', [name, email, hashedPassword]);

            // Registration successful, you can redirect or send a success message
            return res.render("signup", { msg: "User Registration Success" });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send("Internal Server Error");
    }
};

// Hardcoded admin credentials
//const hardcodedAdminEmail = "abc@gmail.com";
//const hardcodedAdminPassword = "$2b$08$examplehashedpassword"; // Use bcrypt to hash the password

exports.admin_login = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        // Check if the entered credentials match the hardcoded admin credentials
        if (email !== "abc@gmail.com" || password !== "12345") {
            return res.status(401).render("admin_login", { msg: "Invalid admin credentials" });
        } else {
            // Redirect to the admin_edit page on the second application (port 6000)
            return res.redirect('http://localhost:5000/auth/cities');
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
};


exports.cities = async (req, res) => {
    try {
        console.log('Fetching cities from the database...');
        const citiesResult = await pool.query('SELECT * FROM cities');
        const cities = citiesResult.rows;

        console.log('Cities from the database:', cities);

        for (const city of cities) {
            const centersResult = await pool.query('SELECT * FROM centers WHERE city_id = $1', [city.id]);
            city.centers = centersResult.rows;
        }

        console.log('Cities with Centers:', cities);

        res.render('cities', { cities });
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
};


exports.editCity = async (req, res) => {
    try {
        const cityId = req.params.id;
        const cityResult = await pool.query('SELECT * FROM cities WHERE id = $1', [cityId]);

        if (cityResult.rows.length > 0) {
            const city = cityResult.rows[0];
            res.render('editcity', { city });
        } else {
            res.status(404).send('City not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

exports.updateCity = async (req, res) => {
    try {
        const cityId = req.params.id;
        const { name } = req.body;

        await pool.query('UPDATE cities SET name = $1 WHERE id = $2', [name, cityId]);

        res.redirect('/auth/cities');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

exports.deleteCity = async (req, res) => {
    try {
        const cityId = req.params.id;

        await pool.query('DELETE FROM cities WHERE id = $1', [cityId]);

        res.redirect('/auth/cities');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// userController.js

exports.addCity = async (req, res) => {
    try {
        const cityName = req.body.cityName;

        // Add the new city to the database
        await pool.query('INSERT INTO cities (name) VALUES ($1)', [cityName]);

        // Redirect to the list of cities
        res.redirect('/auth/cities');
    } catch (error) {
        console.error(error);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
};


exports.renderAddCityForm = (req, res) => {
    res.render('addcity');
};

exports.addcenter = (req, res) => {
    res.render('addcenter');
};

exports.addcenterbyid = async (req, res) => {
    console.log('POST request for /auth/addcenter/:cityId. Request body:', req.body);
        try {
            const cityId = req.params.cityId;
            console.log('City ID:', cityId);

        // Validate cityId (check if it's a number)
        if (isNaN(cityId)) {
            console.log('Invalid cityId:', cityId);
            return res.status(400).send('Invalid cityId');
        }

        // Extract other relevant information from the request body
        const centerName = req.body.centerName;
        const centerAddress = req.body.centerAddress;

        // Insert the new center into the centers table with the associated city_id
        const query = 'INSERT INTO centers (city_id, name, address) VALUES ($1, $2, $3)';
        await pool.query(query, [cityId, centerName, centerAddress]);

        // Redirect or send a success message
        //res.redirect(`/auth/cities/${cityId}`);
        res.redirect(`/auth/cities`);

    } catch (error) {
        console.error(error);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
};







//-------------------------------------------------------------------------------------------------------------------------------------------------------



