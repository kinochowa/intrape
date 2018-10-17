var express = require('express');
var router = express.Router();

var models  = require('../models');

var csv = require('fast-csv');
var fs = require('fs');
var path = require('path');
var formidable = require('formidable');
var request = require('request');

const FILE_DIR = __dirname + "/../public/files/";

var apiError = require('../error');
var apiResponse = require('../response');

/**
 * @api {get} /students/ Get students list
 * @apiName GetStudents
 * @apiGroup Students
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "students": [
 *		 	{
 *				"id"   : 1,
 *				"login": "login@epitech.eu",
 *				"House": {
 *					id  : 1,
 *					name: "House"
 *				},
 *				"Comments": [
 *					{
 *						id     : 1,
 *						comment: "blah blah blah"
 *					}
 *				]
 *		 	}
 *		 ]
 *     }
 *     
 */
router.get('/', (req, res, next) => {
	models.User.findAll({include: [models.House, models.Comment]}).then(students => {
		apiResponse(res)({students: students, status: 200});
	}).catch(e => {
		apiResponse(res)({status: 500, error: 'ServerError'});
	})
});

/**
 * @api {get} /students/:login/details Get student details
 * @apiName GetStudentDetail
 * @apiGroup Students
 *
 *
 * @apiParam {String} login Student unique login.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *			"id"   : 1,
 *			"login": "login@epitech.eu",
 *			"House": {
 *				id  : 1,
 *				name: "House"
 *			},
 *			"Comments": [
 *				{
 *					id     : 1,
 *					comment: "blah blah blah"
 *				}
 *			]
 *     }
 *     
 */
router.get('/:login/details', (req, res, next) => {
	var login = req.params.login || null;

	if (login == null)
		return apiError(400, 'MissingParam', res);

	models.User.find({where: {login: login}, include: [models.House, models.Comment]}).then( user => {
		if (user === null)
			apiError(400, "StudentNotFound", res);
		else
			res.status(200).json(user);
	});	
});

/**
 * @api {post} /students/:login/comment Create comment
 * @apiName PostComment
 * @apiGroup Students
 *
 * @apiParam {String} login Student unique login.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 201 OK
 *
 * @apiError StudentNotFound The login does not exist.
 * @apiError CommentNull The param <comment> can not be found in the body request.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error" :  "StudentNotFound",
 *		 "status":  400
 *     }
 *
 */
const createComment = async comment => {
	if (!comment.comment)
		reject({status: 400, error: 'CommentNull'});

	const catchError = e => {
		console.error(e);
		throw new Error({staus: 500, error: 'ServerError'});
	};

	const user = await models.User.find({where: {login: comment.login}});
	if (!user)
		throw new Error({status: 400, error: 'UserNotFound'});

	const com = await models.Comment.create({comment: comment.comment, date: new Date()}); 
	com.setUser(user.id);
	return ({status: 201});
};

router.post('/:login/comment', (req, res, next) => {
	var comment = req.body.comment || null;
	var login = req.params.login || null;
	var result = false;

	createComment({comment: comment, login: login})
	.then(apiResponse(res))
	.catch(apiResponse(res));
});

/*
**
**	GET IMPORT STUDENTS VIEW
**
*/
router.get('/import', (req, res, next) => {
	console.log('.....................');
  	res.render('students/import', {});
});

const doesStudentExistsIntra = (login) => new Promise((resolve, reject) => {
	request.get({url: config.autologin + '/user/' + login + '?format=json'}, (err, res) => {
		console.log('request:', config.autologin + '/user/' + login + '?format=json');
		console.log('status code from intra :', res.statusCode);
		if (!err && res.statusCode == 200)
			resolve();
		reject();
	})
});

const csvToDB = (stream) => new Promise((resolve, reject) => {
	var csvStream = new csv();
	var nbTodo = 0;
	var end = false;
	var listP = [];

	csvStream.on("error", e => {
		reject({status: 400, error: "ParseError: " + e});
	});

	csvStream.on("data", data => {
		nbTodo++;
		var student = {
			login: data[0],
			house: data[1]
		};
		listP.push(models.House.find({where: {name: student.house}}).then(house => new Promise((resolve, reject) => {
			if (house == null)
				reject({status: 400, error: 'A house <' + student.house + '> does not exist'});
			else {
				doesStudentExistsIntra(student.login).then(() => {
					resolve({student: student, house: house});
				}).catch(e => {
					reject({status: 400, error: 'student <' + student.login + '> does not exist on the Intra'});
				});
			}
		})));
    });

	csvStream.on("end", () => Promise.all(listP)
		.then(objs => {
			let nbToto = objs.length;
			objs.forEach(obj => {
				models.User.findOrCreate({where: {login: obj.student.login, HouseId: obj.house.id}}).spread( (user, created) => {
  					nbTodo--;
  					if (nbTodo == 0)
	  					resolve(200);
  				}).catch( e => {
  					if (e.status)
 						reject({status: 500, error: "sequelize error"});
 					else
 						reject({status: 500, error: "sequelize error"});
  				});	
			});
		}).catch(e => {
			if (e.status)
				reject(e);
			else
				reject({status: 500, error: "sequelize error"});
		})
	);

	stream.pipe(csvStream);
});

/*
**
** IMPORT NEW STUDENTS FROM CSV FILE
** Param: fileName: csv file name
*/
router.post('/import/:file_name', (req, res, next) => {
	var csvfile =  FILE_DIR + req.params.file_name;
	var stream = fs.createReadStream(csvfile);
	csvToDB(stream).then(result => {
		res.status(result).json({status: result});
	}).catch(e => {
		if (e.status)
			apiError(e.status, e.error, res);
		else
			apiError(500, "ServerError", res);
	});
});

/*
**
** Upload file
**
*/
router.post('/upload', (req, res, next) => {
	var form = new formidable.IncomingForm();
	form.parse(req, (err, fields, files) => {
		if (err || !files.file)
			return apiError(500, 'ServerError', res);;

		var old_path = files.file.path;
		var file_ext = files.file.name.split('.').pop();
		var file_name = "upload01";
		var new_path = path.join(FILE_DIR, file_name + '.' + file_ext);

		fs.readFile(old_path, (err, data) => {
			if (err)
				return apiError(500, 'ServerError', res);

			fs.writeFile(new_path, data, (err) => {
				if (err)
					return apiError(500, 'ServerError', res);

				fs.unlink(old_path, (err) => {
					if (err)
						apiError(500, 'ServerError', res);
					else
						res.status(200).json({file_name: file_name + '.' + file_ext, status: 200});
                });
            });
        });
    });
})

module.exports = router;
