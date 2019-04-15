var mongoose = require('mongoose'),
	restify = require('express-restify-mongoose'),
	passport = require('passport'),
	express = require('express'),
	model = require('../model'),
	controller = require('../controller'),
	middleware = require('../middleware'),
	passportService = middleware.passport,
	constant = require('../config/app.constant'),
	ROLE_SUPER_ADMIN = constant.ROLE_SUPER_ADMIN,
	ROLE_AGENCY_ADMIN = constant.ROLE_AGENCY_ADMIN,
	ROLE_OFFICE_MANAGER = constant.ROLE_OFFICE_MANAGER,
	ROLE_USER = constant.ROLE_USER;

// Middleware to require login/auth
var requireAuth = passport.authenticate('jwt', { session: false }),
	requireLogin = passport.authenticate('local', { session: false });

module.exports = function (app) {
	// Initializing route groups
	var apiRoutes = express.Router(),
		authRoutes = express.Router(),
		userRoutes = express.Router(),
		srcRoutes = express.Router(),
		fileRoutes = express.Router(),
		surveyRoutes = express.Router(),
		permissionRoutes = express.Router();

	// Set url for API group routes
	app.use('/api/v1', apiRoutes);
	//= ========================
	// Auth Routes
	//= ========================

	// Set auth routes as subgroup/middleware to apiRoutes
	apiRoutes.use('/auth', authRoutes);

	apiRoutes.use('/permission', permissionRoutes);

	// Registration route
	authRoutes.post('/register', controller.AuthenticationController.register);

	// Login route
	authRoutes.post(
		'/login',
		requireLogin,
		controller.AuthenticationController.login
	);

	// Password reset request route (generate/send token)
	authRoutes.post(
		'/forgot-password',
		controller.AuthenticationController.forgotPassword
	);

	// Password reset route (change password using token)
	authRoutes.post(
		'/reset-password/:token',
		controller.AuthenticationController.verifyToken
	);

	// Test protected route
	apiRoutes.get('/protected', requireAuth, (req, res) => {
		res.send({ content: 'The protected test route is functional!' });
	});

	apiRoutes.get(
		'/admins-only',
		requireAuth,
		controller.AuthenticationController.roleAuthorization(ROLE_SUPER_ADMIN),
		(req, res) => {
			res.send({ content: 'Admin dashboard is working.' });
		}
	);

	surveyRoutes.post('/distribute', controller.SurveyController.mailDistribute);

	//= ========================
	// File Routes
	//= ========================

	apiRoutes.use('/file', fileRoutes);

	fileRoutes.post('/', controller.FileController.postFile);

	fileRoutes.get('/:id', controller.FileController.getFile);

	app.use('', srcRoutes);

	restify.serve(srcRoutes, model.user, {
		preCreate: function (req, res, next) {
			model.user.findOne({ email: req.body.email }, (err, existingUser) => {
				if (err) {
					return next(err);
				}

				// If user is not unique, return error
				if (existingUser) {
					return res
						.status(422)
						.send({ error: 'That email address is already in use.' });
				} else next();
			});
		}
	});

	restify.serve(srcRoutes, model.permission);

	restify.serve(srcRoutes, model.team);

	restify.serve(srcRoutes, model.release, {
		preRead: controller.ReleaseController.getRelease
	});

	restify.serve(srcRoutes, model.checklist);
};
