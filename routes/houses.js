var express = require('express');
var router = express.Router();

var models  = require('../models');

var returnError = (status, msg, err, res) => {
	console.error(msg);
	console.error(err);
	res.status(status).json({status: status});
}

/**
 * @api {get} /houses/ Get houses list
 * @apiName GetHouses
 * @apiGroup Houses
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "houses": [
 *		 	{
 				id  : 1,
 				name: "House"
 *			}
 * 		  ]
 *     }
 *     
 */
router.get('/', (req, res, next) => {
	models.House.findAll().then(houses => {
		res.status(200).json({houses: houses, status: 200});
	}).catch(e => {
		res.status(500).json({error: 'Error', status: 500});
	})
});

/**
 * @api {post} /students/ Create new house
 * @apiName CreateHouse
 * @apiGroup Houses
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 201 OK
 *     {
 *     }
 *
 */
router.post('/', (req, res, next) => {
	var house_name = req.body.house_name || null;

	if (house_name === null)
		return res.status(400).json({error: 'house_name isn\'t specified', error: 400});

	models.House.create({name: house_name}).then((house) => {
		res.status(201).json({status: 201});
	}).catch(e => {
		console.error(e);
		res.status(500).json({status: 500});
	})
});

module.exports = router;
