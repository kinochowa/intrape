'use strict';

module.exports = (sequelize, DataTypes) => {
	var Comment = sequelize.define('Comment', {
		comment: DataTypes.STRING
	});

	return Comment;
};