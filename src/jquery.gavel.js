/* vim: set sw=4 ts=4 sts=4 et tw=78 foldmarker={,} foldlevel=0 foldmethod=marker:
 * 
 * _____     _ _           ______ _                          ______ _  __ _
 *|  _  |   | (_)          | ___ \ |                         | ___ (_)/ _| |
 *| | | | __| |_ _ __  ___ | |_/ / | __ _ ___ _ __ ___   __ _| |_/ /_| |_| | ___
 *| | | |/ _` | | '_ \/ __||  __/| |/ _` / __| '_ ` _ \ / _` |    /| |  _| |/ _ \
 *\ \_/ / (_| | | | | \__ \| |   | | (_| \__ \ | | | | | (_| | |\ \| | | | |  __/
 * \___/ \__,_|_|_| |_|___/\_|   |_|\__,_|___/_| |_| |_|\__,_\_| \_|_|_| |_|\___|
 *
 *
 * jQuery Gavel Plugin
 * version: 1.0.0
 * Requires jQuery v1.8 or later
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
    };

	Gavel.prototype = {
	    defaults: {
	      	errorClass  : 'gavelError',
	      	errorTypes  : ['text', 'element'],
	      	errors      : {
		        required     : "This is a required field",
		        alphanumeric : "Only alphanumeric characters are permitted",
		        numeric      : "Only numeric characters are permitted",
		        alphabetic   : "Only alphabetic characters are permitted",
		        email        : "Only valid email addresses are permitted",
		        telephone    : "Only valid telephone numbers are permitted",
		        match        : "The fields must match",
		        min          : "The min characters permitted is",
		        max          : "The max characters permitted is"
      		},
      		inputEvents : ['keyup', 'change', 'blur'],
      		formEvents  : ['submit'],
	      	afterEach   : null,
	      	afterAll    : null,
	      	initiated   : false,
	      	valid       : true
		},

	    init: function() {
	      	this.config = $.extend({}, this.defaults, this.options);
	      	this.attachHandlers();
	    },

	    attachHandlers: function() {
	    	var _self = this;

	        $.each(_self.config.inputEvents, function(index, inputEvent) {
	        	$(_self.element).on(inputEvent, '*[data-gavel]', function(e) {
	          		_self.initValidate($(this));
	        	});
			});

	        $.each(_self.config.formEvents, function(index, formEvent) {
	        	$(_self.element).on(formEvent, function(e) {
	          		var res = _self.initFormValidate($(this));
	          		if(res.error) {
	          			e.preventDefault();
	          		}
	        	});
			});

	      	this.config.initiated = true;
	    },

		initFormValidate: function(form) {
			var _self = this;

			var res = {
				error   : false,
				message : ''
			};

			$(form).find('*[data-gavel]').each(function() {
				var tempRes = _self.initValidate($(this));
				if(!res.error) {
					res.error = tempRes.error;
				}
			});

			// Trigger the user specified function -> still needs to be added
			if(_self.config.afterAll !== null) {
				//valid = this.afterAll.call(gavelidate, this.settings.valid, form);
			}

			return res;
		},

	    initValidate: function(element) {
	    	this.clearError(element);

			var res = this.validate(element)

			// Trigger the user specified function -> still needs to be added
			if(this.config.afterEach !== null) {
				//valid = this.afterSingle.call(gavelidate, valid, element);
			}

			if(res.error) {
				this.outPutError(element, res.message);
			}

			return res;
	    },		

		validate: function(element) {
			var _self   = this; 

			var res    = {
				error   : false,
				message : ''
			};

			var brackets = [];
			var match    = '';
			var count    = 0;

			if(typeof element !== 'undefined' && typeof element.data('gavel-rules') !== 'undefined') {

				var validation = element.data('gavel-rules').split('|');

				$.each(validation, function(index, value) {
					if(value === 'required' && !_self.hasValue(element)) {
						res.message = _self.config.errors.required;
						res.error   = true;
					} else if(_self.hasValue(element) && value === 'alphanumeric' && !element.val().match(/^(?=.*[A-Z0-9])[\w.,!"'-\/$ ]+$/i)) {
						res.message = _self.config.errors.alphanumeric;
						res.error   = true;
					} else if(_self.hasValue(element) && value === 'numeric' && !element.val().match(/^\d+(\.\d{1,2})?$/)) {
						res.message = _self.config.errors.numeric;
						res.error   = true;
					} else if(_self.hasValue(element) && value === 'alphabetic' && !element.val().match(/^[a-zA-Z .-]+$/)) {
						res.message = _self.config.errors.alphabetic;
						res.error   = true;
					} else if(_self.hasValue(element) && value === 'email' && !element.val().match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
						res.message = _self.config.errors.email;
						res.error   = true;
					} else if(_self.hasValue(element) && value === 'telephone' && !element.val().match(/^[\(]?[0-9]{3}[\ \-\)]{0,2}[0-9]{3}[\ \-]?[0-9]{4}$/)) {
						res.message = _self.config.errors.telephone;
						res.error   = true;
					} else if(value.indexOf('match') > -1) {
						brackets = value.match(/^match{1}\[([^)]+)\]$/);
						match = $('*[name="' + _self.addSlashes(brackets[1]) +'"]');
						if(match.val() !== element.val()) {
							res.message = _self.config.errors.match;
							res.error   = true;
						}
					} else if(value.indexOf('min') > -1) {
						brackets = value.match(/^min{1}\[([^)]+)\]$/);
						count = _self.addSlashes(brackets[1]);
						if(element.val().length < count) {
							res.message = _self.config.errors.min + ' ' + count;
							res.error   = true;
						}
					} else if(value.indexOf('max') > -1) {
						brackets = value.match(/^max{1}\[([^)]+)\]$/);
						count = _self.addSlashes(brackets[1]);
						if(element.val().length > count) {
							res.message = _self.config.errors.max + ' ' + count;
							res.error   = true;
						}
					}
				});
			}
			return res;
		},

		hasValue: function(element) {
			if(element.val() !== "") {
				return true;
			} else {
				return false;
			}
		},

		addSlashes: function(string) {
			return (string + '').replace(/[\\\[\]"']/g, '\\$&').replace(/\u0000/g, '\\0');
		},

		clearError: function(element) {
			$(element).removeClass(this.config.errorClass);
			$(element).next('span.' + this.config.errorClass).remove();
			$(element).attr('data-gavel', 'true');
		},

		outPutError: function(element, error) {
			$(element).addClass(this.config.errorClass);
			$(element).after('<span class="' + this.config.errorClass + '">' + error + '</span>');
			$(element).attr('data-gavel', 'false');
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