var models  = require('../models');
var config = require('../config/config.js');
var request = require('request');

const constructUrl = (comment) => {
	return config.autologin + '/user/' + comment.User.login + '/comments/add?format=json';
}

const constructPostData = (comment) => {
	return { json: { "desc": comment.comment, "type": "suivi_prof", "star": 5 } }
}

const getCommentsAndUsersToPush = () => models.Comment.findAll({where: {id_intra: null}, include: [models.User]})
.then(comments => new Promise((success, reject) => {
	success(comments);
}));

const doPost = (comment) => new Promise((success, reject) => {
	request.post(
    		constructUrl(comment),
    		constructPostData(comment),
    		function (error, response, body) {
        		if (!error && response.statusCode == 200) {
        			comment.id_intra = body.id;
        			comment.save().then(success);
        		} else {
        			console.error(body);
        			reject({error: 'Dunno'});
        		}
    		}
		);
});

const pushToIntra = comments => new Promise((success, reject) => {
	if (comments.length == 0)
		reject({error: 'No comment to push.'})

	const PL = comments.map(doPost);

	Promise.all(PL)
	.then(() => success())
	.catch(e => { reject(e); })
});

getCommentsAndUsersToPush()
.then(pushToIntra)
.catch(e => {
	console.error(e);
});