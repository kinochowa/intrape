'use strict';

module.exports = (sequelize, DataTypes) => {
	var Comment = sequelize.define('Comment', {
		comment: DataTypes.STRING,
		date: DataTypes.DATE,
		id_intra: DataTypes.INTEGER
	});

	return Comment;
};