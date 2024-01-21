const express = require("express");
const userController = require('../controllers/users');
const router = express.Router();

// Define your routes first
router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.post('/admin_login', userController.admin_login);
router.get('/cities', userController.cities);
router.get('/editcity/:id', userController.editCity);
router.post('/updatecity/:id', userController.updateCity);
router.get('/deletecity/:id', userController.deleteCity);
router.get('/addcity', userController.renderAddCityForm);
router.post('/addcity', userController.addCity);

router.get('/addcenter/:cityId', (req, res) => {
    console.log('GET request for /auth/addcenter/:cityId');
    const cityId = req.params.cityId;
    res.render('addcenter', { cityId });
});

router.post('/addcenter/:cityId', userController.addcenterbyid);

// Export the router after defining routes
module.exports = router;
//const express = require("express");
//const router = express.Router();

//router.post('/register');
// Registration route
//router.post('/register', (req, res) => {
    // Handle registration logic here
    //res.send('Registration route');
//});

//module.exports = router;
