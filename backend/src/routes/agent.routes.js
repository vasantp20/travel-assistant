const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const ctrl = require('../controllers/agent.controller');
const validateTravelInput = require('../validations/validateTravelInput');




router.get('/health', ctrl.agentHealth);

router.post('/itinerary', validateTravelInput, ctrl.handleItineraryRequest);


module.exports = router;
