var express = require('express');
var router = express.Router();

var models  = require('../models');
var apiError = require('../error');

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
 *				id  : 1,
 *				name: "House"
 *			}
 * 		  ]
 *     }
 *     
 */
router.get('/', (req, res, next) => {
	models.House.findAll().then(houses => {
		res.status(200).json({houses: houses, status: 200});
	}).catch(e => {
		apiError(500, 'ServerError', res);
	})
});

/**
 * @api {get} /houses/:house/students Get house students list
 * @apiName GetHousesStudents
 * @apiGroup Houses
 *
 * @apiParam {String} house House unique name.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "house": {
 *			id  : 1,
 *			name: "House",
 *			students: [
 *				{
 *					id: 	1,
 *					login:  "login@epitech.eu"
 *				}
 *			]
 *		}
 *     }
 *     
 */
router.get('/:house/students', (req, res, next) => {
	var house_name = req.params.house || null;

	if (house_name === null)
		return apiError(400, 'MissingParam', res);

	models.House.find({ where: { name: house_name } }).then(house => {
		if (house == null)
			return apiError(400, 'HouseNotFound', res);
		
		models.User.findAll({where: {HouseId: house.id}}).then(users => {
			house = house.toJSON();
			house.students = users;
			res.status(200).json({house: house});
		}).catch(e => {
			apiError(500, 'ServerError', res);
		});
	}).catch(e => {
		apiError(500, 'ServerError', res);
	});
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
		return apiError(400, 'MissingParam', res);

	models.House.create({name: house_name}).then((house) => {
		res.status(201).json({status: 201});
	}).catch(e => {
		apiError(500, 'ServerError', res);
	})
});

module.exports = router;
