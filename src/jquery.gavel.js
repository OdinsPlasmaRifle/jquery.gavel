/* _____     _ _           ______ _                          ______ _  __ _
 *|  _  |   | (_)          | ___ \ |                         | ___ (_)/ _| |
 *| | | | __| |_ _ __  ___ | |_/ / | __ _ ___ _ __ ___   __ _| |_/ /_| |_| | ___
 *| | | |/ _` | | '_ \/ __||  __/| |/ _` / __| '_ ` _ \ / _` |    /| |  _| |/ _ \
 *\ \_/ / (_| | | | | \__ \| |   | | (_| \__ \ | | | | | (_| | |\ \| | | | |  __/
 * \___/ \__,_|_|_| |_|___/\_|   |_|\__,_|___/_| |_| |_|\__,_\_| \_|_|_| |_|\___|
 *
 *
 * jQuery Gavel Plugin
 * version: 1.1.0
 * Requires jQuery v1.7 or later
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
			// Indicates whether a text error should be outputted
			errorText      : true,
			// The HTML element used to output text errors
			errorContainer : 'span',
			// Class used for the errorContainer
			errorClass     : 'gavelError',
			// Function called after each input is validated
			afterEach      : null,
			// Function called once the form has been validated
			afterAll       : null,
			// Indicates whether the plugin has been initiated yet
			initiated      : false,
			// Validation types
			validation     : {
				alphanumeric : {
					// Error message
					message : "Only alphanumeric characters are permitted",
					// Regex validation
					regex   : /^$|^(?=.*[A-Z0-9])[\w.,!"'-\/$ ]+$/i,
					// Method to call - custom or plugin specific
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
					message : "Only valid telephone numbers are permitted (eg. +27 00 000 0000)",
					regex   : /\+(9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1)\W*\d\W*\d\W*\d\W*\d\W*\d\W*\d\W*\d\W*\d\W*(\d{1,2})$/,
					method  : null
				},
				date : {
					message : "Only valid dates are permitted (eg. dd-mm-yyyy)",
					regex	: /^(?:(?:(?:0?[13578]|1[02])(\/|-|\.)31)\1|(?:(?:0?[1,3-9]|1[0-2])(\/|-|\.)(?:29|30)\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:0?2(\/|-|\.)29\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:(?:0?[1-9])|(?:1[0-2]))(\/|-|\.)(?:0?[1-9]|1\d|2[0-8])\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/,
					Method	: null
				},
				required : {
					message : "This is a required field",
					regex   : null,
					// Built in custom function
					method  : 'validateRequired'
				},				
				match : {
					message : "The fields must match",
					regex   : null,
					method  : 'validateMatch'
				},
				min : {
					message : "The min characters permitted is {min}",
					regex   : null,
					method  : 'validateMin'
				},
				max : {
					message : "The max characters permitted is {max}",
					regex   : null,
					method  : 'validateMax'
				}
			},
			inputEvents    : ['keyup', 'change', 'blur'],
			formEvents     : ['submit']
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
			form.find('*[data-gavel]').each(function() {
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
			// Add uid to the element
			element.attr('data-gavel-uid', self.getUid(element));
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

		// Get an elements UID or generate one if required
		getUid: function(element) {
			var uid = element.attr('data-gavel-uid');
			if (typeof uid !== 'undefined' && uid !== '') {
				uid = element.attr('data-gavel-uid');
			} else {
				uid = self.generateUid();
			}
			return uid;
		},

		// Generate a unique ID for an element
		generateUid: function(element) {
			var uid = '';
			while (uid === '' || $('*[data-gavel][data-gavel-uid="' + uid + '"]').length > 1) {
				uid = Math.random().toString(16).slice(2);
			}
			return uid;
		},

		validate: function(element) {
			// Error response object
			var res = {
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
						if (splitRule in self.config.validation) {
							// Built in functions
							if (typeof self.config.validation[splitRule]['method'] === 'string') {
								funcRes = self[self.config.validation[splitRule]['method']](element, brackets);
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
					}
				});
			}
			return res;
		},

		// Built in required validation
		validateRequired: function(element, extra) {
			var res = true;
			var type = element.attr('type');
			var name = element.attr('name');
			var value = element.val();
			if(typeof name !== "undefined") {
				if (type === "radio" && !$('input[name="' + name + '"]').is(":checked")) {
					res = false;
				} else if (type === "checkbox" && !element.is(":checked")) {
					res = false;
				} else if (!value.match(/\S+/)) {
					res = false;
				}
			}
			return res;
		},

		// Built in match validation
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

		// Built in min validation
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

		// Built in max validation
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

		// Remove error messages associated with a UID or name
		clearError: function(element) {
			var type = element.attr('type');
			var name = element.attr('name');
			var uid = self.getUid(element);
			element.attr('data-gavel', 'true');
			element.removeClass(self.config.errorClass);
			if (self.config.errorText) {
				if (type === 'radio') {
					$('.' + self.config.errorClass + '[data-gavel-error-name="' + name + '"]').remove();
				} else {
					$('.' + self.config.errorClass + '[data-gavel-error-uid="' + uid + '"]').remove();
				}			
			}
		},

		// Output an error message to the page
		outPutError: function(element, error) {
			var type = element.attr('type');
			var name = element.attr('name');
			var uid = self.getUid(element);
			var container = $(element.data('gavel-errorcont'));
			// Create container element using user settings
			var errorElement = '<' + self.config.errorContainer + 
								' class="' + self.config.errorClass +
								'" data-gavel-error-uid="' + uid + 
								'" data-gavel-error-name="' + name + '">' + 
								error + '</' + self.config.errorContainer + '>';
			element.attr('data-gavel', 'false');
			element.addClass(self.config.errorClass);
			if (self.config.errorText) {
				// If a container is specified append the error
				if (container.length > 0) {
					container.append(errorElement);
				// Otherwise place after the element	
				} else {
					element.after(errorElement);
				}
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
