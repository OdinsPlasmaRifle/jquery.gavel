/* _____     _ _           ______ _                          ______ _  __ _
 *|  _  |   | (_)          | ___ \ |                         | ___ (_)/ _| |
 *| | | | __| |_ _ __  ___ | |_/ / | __ _ ___ _ __ ___   __ _| |_/ /_| |_| | ___
 *| | | |/ _` | | '_ \/ __||  __/| |/ _` / __| '_ ` _ \ / _` |    /| |  _| |/ _ \
 *\ \_/ / (_| | | | | \__ \| |   | | (_| \__ \ | | | | | (_| | |\ \| | | | |  __/
 * \___/ \__,_|_|_| |_|___/\_|   |_|\__,_|___/_| |_| |_|\__,_\_| \_|_|_| |_|\___|
 *
 *
 * jQuery Gavel Plugin
 * version: 1.0.0
 * Requires jQuery v1.8 or later (arbitrary, no testing has been done)
 * Copyright (c) 2015 Joshua van Besouw
 * Project repository: https://github.com/odinsplasmarifle/jquery.gavel
 * MIT License
 *
 * You can find me at https://github.com/odinsplasmarifle
 *
 */

;(function(window, $){

	var Gavel = function(element, options){
		this.element  = element;
		this.$element = $(element);
		this.options  = options;
		self = this;
	};

	Gavel.prototype = {

		defaults: {
			errorText      : true,		   // Indicates whether a text error should be outputted
			errorContainer : 'span', 	   // The HTML element used to output text errors
			errorClass     : 'gavelError', // Class used for the errorContainer
			afterEach      : null,		   // Function called after each input is validated
			afterAll       : null,		   // Function called once the form has been validated
			initiated      : false,		   // Indicates whether the plugin has been initiated yet
			validation     : {			   // Validation types
				required : {
					message : "This is a required field", // Error message
					regex   : /\S+/, 					  // Regex validation
					method  : null						  // method to call - custom or plugin specific
				},
				alphanumeric : {
					message : "Only alphanumeric characters are permitted",
					regex   : /^$|^(?=.*[A-Z0-9])[\w.,!"'-\/$ ]+$/i,
					method  : null
				},
				numeric : {
					message : "Only numeric characters are permitted",
					regex   : /^$|^\d+(\.\d{1,2})?$/,
					method  : null
				},
				alphabetic : {
					message : "Only alphabetic characters are permitted",
					regex   : /^$|^[a-zA-Z .-]+$/,
					method  : null
				},
				email : {
					message : "Only valid email addresses are permitted",
					regex   : /^$|^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
					method  : null
				},
				telephone : {
					message : "Only valid telephone numbers are permitted",
					regex   : /^$|^[\(]?[0-9]{3}[\ \-\)]{0,2}[0-9]{3}[\ \-]?[0-9]{4}$/,
					method  : null
				},
				match : {
					message : "The fields must match",
					regex   : null,
					method  : 'validateMatch' // Built in custom function
				},
				min : {
					message : "The min characters permitted is {min}",
					regex   : null,
					method  : 'validateMin'  // Built in custom function
				},
				max : {
					message : "The max characters permitted is {max}",
					regex   : null,
					method  : 'validateMax'  // Built in custom function
				}
			},
			inputEvents    : ['keyup', 'change', 'blur'], // Input events 
			formEvents     : ['submit'] 				  // Form events
		},

		init: function() {
			// Extend default options with user options
			self.config = $.extend(true, {}, self.defaults, self.options);
			self.attachHandlers();
		},

		attachHandlers: function() {
			// Attach event(s) to each gavel element
			$.each(self.config.inputEvents, function(index, inputEvent) {
				$(self.element).on(inputEvent, '*[data-gavel]', function(e) {
						self.initValidate($(this));
				});
			});

			// Attach event(s) to the gavel form
			$.each(self.config.formEvents, function(index, formEvent) {
				$(self.element).on(formEvent, function(e) {
						var res = self.initFormValidate($(this));
						if (res.error) {
							e.preventDefault();
						}
				});
			});

			self.config.initiated = true;
		},

		initFormValidate: function(form) {
			var res = {
				error   : false,
				message : ''
			};

			// Run validate on each gavel form element
			$(form).find('*[data-gavel]').each(function() {
				var tempRes = self.initValidate($(this));
				if (!res.error) {
					res.error = tempRes.error;
				}
			});

			// Trigger user afterAll function
			if(self.config.afterAll !== null) {
				var userRes = self.config.afterAll.call(self, res, form);
				if ('error' in userRes && 'message' in userRes) {
				 	res.error = userRes.error;
				}
			}

			return res;
		},

		initValidate: function(element) {
			// Clear element's current errors
			self.clearError(element);

			// Validate the element
			var res = self.validate(element)

			// Trigger user afterEach function
			if (self.config.afterEach !== null) {
				var userRes = self.config.afterEach.call(self, res, element);
				if ('error' in userRes && 'message' in userRes) {
			 		res.error = userRes.error;
				}
			}

			// Outpust an error if one exists
			if (res.error) {
				self.outPutError(element, res.message);
			}

			return res;
		},

		validate: function(element) {
			var res    = {
				error   : false,
				message : ''
			};

			// Check if a valid element with gavel rules
			if (typeof element !== 'undefined' && typeof element.data('gavel-rules') !== 'undefined') {
				// Get all gavel rules on an element
				var rules = element.data('gavel-rules').split('|');
				// Loop through each rule
				$.each(rules, function(index, rule) {
					// If a regex validated field use regex to validate
					if (rule in self.config.validation && typeof self.config.validation[rule]['regex'] !== 'undefined' &&
							self.config.validation[rule]['regex'] !== null) {
						if (!element.val().match(self.config.validation[rule]['regex'])) {
							if(typeof self.config.validation[rule]['message'] !== 'undefined') {
								res.message = self.config.validation[rule]['message'];
							}
							res.error = true;
						}
					// Otherwise use a function to validate	
					} else {
						var funcRes = null;
						// Split off brackets if they exist
						var split = rule.split('[');
						var splitRule = split[0];

						// Get value between brackets
						var brackets = rule.match(/^[a-zA-Z0-9 .-\_]+\[([^)]+)\]$/);
						brackets = (brackets && typeof brackets[1] !== 'undefined') ?  brackets[1] : '';

						// Built in functions
						if (splitRule in self.config.validation && typeof self.config.validation[splitRule]['method'] === 'string') {
							var funcRes = self[self.config.validation[splitRule]['method']](element, brackets);
						// User functions
						} else if (splitRule in self.config.validation && typeof self.config.validation[splitRule]['method'] !== 'undefined' &&
								self.config.validation[splitRule]['method'] !== null) {
							funcRes = self.config.validation[splitRule]['method'].call(self, element, brackets)
						}
						// Create error message
						if (!funcRes || (typeof funcRes === 'object' && 'error' in funcRes && funcRes.error)) {
							if(typeof self.config.validation[splitRule]['message'] !== 'undefined') {
								// Do tag replacement on message if tags exist
								if(typeof funcRes === 'object'  && 'tags' in funcRes && typeof funcRes.tags === 'object') {
									res.message = self.replaceCustomTags(funcRes.tags, self.config.validation[splitRule]['message']);
								} else {
									res.message = self.config.validation[splitRule]['message'];
								}
							}
							res.error = true;
						}
					}
				});
			}
			return res;
		},

		// Built in field match validation
		validateMatch: function(element, match) {
			var res = true;
			if(match) {
				match = $('*[name="' + self.addSlashes(match) +'"]');
				if (match.val() !== element.val()) {
					res = {};
					res.error = true;
				}
			}
			return res;
		},

		// Built in field min validation
		validateMin: function(element, min) {
			var res = true;
			min = self.addSlashes(min);
			if (min && element.val().length < min) {
				res = {};
				res.tags = {'{min}' : min};
				res.error = true;
			}
			return res;
		},

		// Built in field max validation
		validateMax: function(element, max) {
			var res = true;
			max = self.addSlashes(max);
			if (max && element.val().length > max) {
				res = {};
				res.tags = {'{max}' : max};
				res.error = true;
			}
			return res;
		},

		// Escape strings
		addSlashes: function(string) {
			return (string + '').replace(/[\\\[\]"']/g, '\\$&').replace(/\u0000/g, '\\0');
		},

		// Replace custom tags in a string
		replaceCustomTags: function(tags, string) {
			$.each(tags, function(tag, value) {
				string = string.replace(tag, value);
			});
			return string;
		},

		clearError: function(element) {
			$(element).attr('data-gavel', 'true');
			$(element).removeClass(self.config.errorClass);
			if (self.config.errorText) {
				$(element).next(self.config.errorContainer + '.' + self.config.errorClass).remove();
			}
		},

		outPutError: function(element, error) {
			$(element).attr('data-gavel', 'false');
			$(element).addClass(self.config.errorClass);
			if (self.config.errorText) {
				$(element).after('<' + self.config.errorContainer + ' class="' + self.config.errorClass + '">' + error + '</' + self.config.errorContainer + '>');
			}
		}
	}

	Gavel.defaults = Gavel.prototype.defaults;

	$.fn.gavel = function(options) {
		return this.each(function() {
			new Gavel(this, options).init();
		});
	};

	window.Gavel = Gavel;

})(window, jQuery);
