var express = require('express');
var router = express.Router();

var csv = require('fast-csv');
var fs = require('fs');
var path = require('path');
var formidable = require('formidable');

const FILE_DIR = __dirname + "/../public/files/";

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
	var csvStream = new csv().on("error", e => {
		console.error(csvfile + ': Error');
		console.error(e);
		res.status(400).json({status: 400, error: 'Can not read csv file.'});
	}).on("data", data => { 
		var student = {
			login: data[0]
		};

		// TODO INSERT INTO DATABASE

		console.log(student);
    }).on("end", function() {
    	res.status(200).json({status: 200});
    });

	stream.pipe(csvStream);
})

var returnError = (status, msg, err, res) => {
	console.error(msg)
	console.error(err);
	res.status(status).json({status: status});
}

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
