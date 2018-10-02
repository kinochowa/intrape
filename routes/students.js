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

/*
**
**	GET IMPORT STUDENTS VIEW
**
*/
router.get('/import', (req, res, next) => {
  res.render('students/import', {});
});

/*
**
** IMPORT NEW STUDENTS FROM CSV FILE
** Param: fileName: csv file name
*/
router.post('/import/:file_name', (req, res, next) => {
	var csvfile =  FILE_DIR + req.params.file_name;
	var stream = fs.createReadStream(csvfile);
	var csvStream = new csv();
	var nbTodo = 0;
	var end = false;

	csvStream.on("error", e => {
		returnError(400, csvFile, e, res);
	});

	csvStream.on("data", data => {
		nbTodo++;
		var student = {
			login: data[0],
			house: data[1]
		};

		models.House.find({where: {name: student.house}}).then(house => {
			if (house === null) {
				console.log(student.house + ' n\'existe pas');

				end = true;
				res.status(400).json({error: 'House <' + student.house + '> does not exist', status: 400});
			} else {
				models.User.findOrCreate({where: {login: student.login, HouseId: house.id}}).spread( (user, created) => {
  					nbTodo--;
  					if (nbTodo == 0 && !end) {
  						res.status(200).json({status: 200});
  					}
  				}).catch( err => {
  					if (!end) {
  						end = true;
 						returnError(500, "sequelize error", err, res);
 					}
  				});
			}
		}).catch(e => {
			if (!end) {
  				end = true;
 				returnError(500, "sequelize error", err, res);
 			}
		})
    });

	stream.pipe(csvStream);
})

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
