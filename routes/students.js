var express = require('express');
var router = express.Router();

var models  = require('../models');

var csv = require('fast-csv');
var fs = require('fs');
var path = require('path');
var formidable = require('formidable');

const FILE_DIR = __dirname + "/../public/files/";

var returnError = (status, msg, err, res) => {
	console.error(msg)
	console.error(err);
	res.status(status).json({status: status});
}

var apiError = (status, errorType, res) => {
	console.error(errorType);
	res.status(status).json({error: errorType, status: status});
}

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
		res.status(200).json({students: students, status: 200});
	}).catch(e => {
		console.error(e);
		apiError(500, "ServerError", res);
	})
});

/**
 * @api {get} /students/:login Get student detail
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
router.get('/students/:login', (req, res, next) => {
	// TODO
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
router.post('/:login/comment', (req, res, next) => {
	var comment = req.body.comment || null;
	var login = req.params.login || null;
	var result = false;

	if (comment === null && !result) {
		result = true;
		return apiError(400, "CommentNull", res);
	}

	models.User.find({where: {login: login}}).then( user => {
		if (user === null && !result) {
			result = true;
			apiError(400, "StudentNotFound", res);
		}
		models.Comment.create({comment: comment}).then( comment => { 
	    	comment.setUser(user.id);
	    	if (!result) {
	    		result = true;
	    		res.status(201).json({status: 201});
	    	}
		}).catch(e => {
			if (!result) {
				result = true;
				console.error(e);
				apiError(500, "ServerError", res);
			}
		});
	}).catch (e => {
		if (!result) {
				result = true;
				console.error(e);
				apiError(500, "ServerError", res);
			}
	});
});

/*
**
**	GET IMPORT STUDENTS VIEW
**
*/
router.get('/import', (req, res, next) => {
  res.render('students/import', {});
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
			else
				resolve({student: student, house: house});
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
	  				console.error('in findOrCreate', e);
 					reject({status: 500, error: "sequelize error"});
  				});	
			});
		}).catch(e => {
			console.error('in find', e);
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
			returnError(e.status, e.error, null, res);
		else {
			console.error(e);
			returnError(500, "ServerError", null, res);
		}

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
			return returnError(500, "form.parse: Error", err, res);;

		var old_path = files.file.path;
		var file_ext = files.file.name.split('.').pop();
		var file_name = "upload01";
		var new_path = path.join(FILE_DIR, file_name + '.' + file_ext);

		fs.readFile(old_path, (err, data) => {
			if (err)
				return returnError(500, "fs.readFile: Error", err, res);

			fs.writeFile(new_path, data, (err) => {
				if (err)
					return returnError(500, "fs.writeFile: Error", err, res);

				fs.unlink(old_path, (err) => {
					if (err)
						return returnError(500, "fs.unlink: Error", err, res);
					else
						res.status(200).json({file_name: file_name + '.' + file_ext, status: 200});
                });
            });
        });
    });
})

module.exports = router;
