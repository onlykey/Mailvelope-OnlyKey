/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/*!*****************************************!*\
  !*** ./src/components/editor/editor.js ***!
  \*****************************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = EditorCtrl;
	
	var _react = __webpack_require__(/*! react */ 1);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _reactDom = __webpack_require__(/*! react-dom */ 2);
	
	var _reactDom2 = _interopRequireDefault(_reactDom);
	
	var _mvelo = __webpack_require__(/*! ../../mvelo */ 3);
	
	var _mvelo2 = _interopRequireDefault(_mvelo);
	
	var _EditorFooter = __webpack_require__(/*! ./components/EditorFooter */ 4);
	
	var _EditorFooter2 = _interopRequireDefault(_EditorFooter);
	
	var _EditorModalFooter = __webpack_require__(/*! ./components/EditorModalFooter */ 6);
	
	var _EditorModalFooter2 = _interopRequireDefault(_EditorModalFooter);
	
	var _l10n = __webpack_require__(/*! ../../lib/l10n */ 5);
	
	var l10n = _interopRequireWildcard(_l10n);
	
	var _file = __webpack_require__(/*! ../../lib/file */ 7);
	
	var fileLib = _interopRequireWildcard(_file);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	'use strict';
	
	/* global angular */
	
	/**
	 * Mailvelope - secure email with OpenPGP encryption for Webmail
	 * Copyright (C) 2012-2015 Mailvelope GmbH
	 *
	 * This program is free software: you can redistribute it and/or modify
	 * it under the terms of the GNU Affero General Public License version 3
	 * as published by the Free Software Foundation.
	 *
	 * This program is distributed in the hope that it will be useful,
	 * but WITHOUT ANY WARRANTY; without even the implied warranty of
	 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	 * GNU Affero General Public License for more details.
	 *
	 * You should have received a copy of the GNU Affero General Public License
	 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
	 */
	
	/**
	 * Parts of the editor are based on Hoodiecrow (MIT License)
	 * Copyright (c) 2014 Whiteout Networks GmbH.
	 * See https://github.com/tanx/hoodiecrow/blob/master/LICENSE
	 */
	
	/**
	 * @fileOverview This file implements the interface for encrypting and
	 * signing user data in an sandboxed environment that is secured from
	 * the webmail interface.
	 */
	
	angular.module('editor', ['ngTagsInput']) // load editor module dependencies
	.config(function (tagsInputConfigProvider) {
	  // activate monitoring of placeholder option
	  tagsInputConfigProvider.setActiveInterpolation('tagsInput', { placeholder: true });
	});
	angular.module('editor').controller('EditorCtrl', EditorCtrl); // attach ctrl to editor module
	
	/**
	 * Angular controller for the editor UI.
	 */
	function EditorCtrl($timeout) {
	  this._timeout = $timeout;
	
	  this.setGlobal(this); // share 'this' as '_self' in legacy closure code
	  this.checkEnvironment(); // get environment vars
	  this.registerEventListeners(); // listen to incoming events
	  this.initComplete(); // emit event to backend that editor has initialized
	}
	
	EditorCtrl.prototype = Object.create(_mvelo2.default.EventHandler.prototype); // add event api
	
	/**
	 * Reads the urls query string to get environment context
	 */
	EditorCtrl.prototype.checkEnvironment = function () {
	  var qs = $.parseQuerystring();
	  this.embedded = qs.embedded;
	  this._id = qs.id;
	  this._name = 'editor-' + this._id;
	};
	
	/**
	 * Verifies a recipient after input, gets their key, colors the
	 * input tag accordingly and checks if encryption is possible.
	 * @param  {Object} recipient   The recipient object
	 */
	EditorCtrl.prototype.verify = function (recipient) {
	  if (!recipient) {
	    return;
	  }
	  if (recipient.email) {
	    // display only address from autocomplete
	    recipient.displayId = recipient.email;
	  } else {
	    // set address after manual input
	    recipient.email = recipient.displayId;
	  }
	  // lookup key in local cache
	  recipient.key = this.getKey(recipient);
	  if (recipient.key || recipient.checkedServer || !this.tofu) {
	    // color tag only if a local key was found, or after server lookup,
	    // or if TOFU (Trust on First Use) is deactivated
	    this.colorTag(recipient);
	    this.checkEncryptStatus();
	  } else {
	    // no local key found ... lookup on the server
	    this.lookupKeyOnServer(recipient);
	  }
	};
	
	/**
	 * Finds the recipient's corresponding public key and sets it
	 * on the 'key' attribute on the recipient object.
	 * @param  {Object} recipient   The recipient object
	 * @return {Object}             The key object (undefined if none found)
	 */
	EditorCtrl.prototype.getKey = function (recipient) {
	  return (this.keys || []).find(function (key) {
	    if (key.email && recipient.email) {
	      return key.email.toLowerCase() === recipient.email.toLowerCase();
	    }
	  });
	};
	
	/**
	 * Do TOFU (trust on first use) lookup on the Mailvelope Key Server
	 * if a key was not found in the local keyring.
	 * @param  {Object} recipient   The recipient object
	 * @return {undefined}
	 */
	EditorCtrl.prototype.lookupKeyOnServer = function (recipient) {
	  recipient.checkedServer = true;
	  this.emit('keyserver-lookup', {
	    sender: this._name,
	    recipient: recipient
	  });
	};
	
	/**
	 * Event that is triggered when the key server responded
	 * @param {Array} options.keys   A list of all available public
	 *                               keys from the local keychain
	 * @return {undefined}
	 */
	EditorCtrl.prototype._onKeyServerResponse = function (options) {
	  this._timeout(function () {
	    // trigger $scope.$digest() after async call
	    this.keys = options.keys;
	    this.recipients.forEach(this.verify.bind(this));
	  }.bind(this));
	};
	
	/**
	 * Uses jQuery to color the recipient's input tag depending on
	 * whether they have a key or not.
	 * @param  {Object} recipient   The recipient object
	 */
	EditorCtrl.prototype.colorTag = function (recipient) {
	  this._timeout(function () {
	    // wait for html tag to appear
	    $('tags-input li.tag-item').each(function () {
	      if ($(this).text().indexOf(recipient.email) === -1) {
	        return;
	      }
	      if (recipient.key) {
	        $(this).addClass('tag-success');
	      } else {
	        $(this).addClass('tag-danger');
	      }
	    });
	  });
	};
	
	/**
	 * Checks if all recipients have a public key and prevents encryption
	 * if one of them does not have a key.
	 */
	EditorCtrl.prototype.checkEncryptStatus = function () {
	  this.noEncrypt = (this.recipients || []).some(function (r) {
	    return !r.key;
	  });
	  // update editor modal footer
	  renderModalFooter({ encryptDisabled: this.noEncrypt || !this.recipients || !this.recipients.length });
	};
	
	/**
	 * Queries the local cache of key objects to find a matching user ID
	 * @param  {String} query   The autocomplete query
	 * @return {Array}          A list of filtered items that match the query
	 */
	EditorCtrl.prototype.autocomplete = function (query) {
	  var cache = (this.keys || []).map(function (key) {
	    return {
	      email: key.email,
	      displayId: key.userid + ' - ' + key.keyid.toUpperCase()
	    };
	  });
	  // filter by display ID and ignore duplicates
	  var that = this;
	  return cache.filter(function (i) {
	    return i.displayId.toLowerCase().indexOf(query.toLowerCase()) !== -1 && !that.recipients.some(function (recipient) {
	      return recipient.email === i.email;
	    });
	  });
	};
	
	//
	// Evant handling from background script
	//
	
	
	/**
	 * Register the event handlers for the editor.
	 */
	EditorCtrl.prototype.registerEventListeners = function () {
	  this.on('public-key-userids', this._setRecipients);
	  this.on('set-text', this._onSetText);
	  this.on('set-init-data', this._onSetInitData);
	  this.on('set-attachment', this._onSetAttachment);
	  this.on('decrypt-in-progress', this._showWaitingModal);
	  this.on('encrypt-in-progress', this._showWaitingModal);
	  this.on('decrypt-end', this._hideWaitingModal);
	  this.on('encrypt-end', this._hideWaitingModal);
	  this.on('encrypt-failed', this._hideWaitingModal);
	  this.on('decrypt-failed', this._decryptFailed);
	  this.on('show-pwd-dialog', this._onShowPwdDialog);
	  this.on('hide-pwd-dialog', this._hidePwdDialog);
	  this.on('get-plaintext', this._getPlaintext);
	  this.on('error-message', this._onErrorMessage);
	  this.on('keyserver-response', this._onKeyServerResponse);
	
	  this._port.onMessage.addListener(this.handlePortMessage.bind(this));
	};
	
	/**
	 * Remember the available public keys for later and set the
	 * recipients proposal gotten from the webmail ui to the editor
	 * @param {Array} options.keys         A list of all available public
	 *                                     keys from the local keychain
	 * @param {Array} options.recipients   recipients gather from the
	 *                                     webmail ui
	 * @param {boolean} options.tofu       If the editor should to TOFU key lookup
	 */
	EditorCtrl.prototype._setRecipients = function (options) {
	  this._timeout(function () {
	    // trigger $scope.$digest() after async call
	    this.tofu = options.tofu;
	    this.keys = options.keys;
	    this.recipients = options.recipients;
	    this.recipients.forEach(this.verify.bind(this));
	    this.checkEncryptStatus();
	  }.bind(this));
	};
	
	/**
	 * Matches the recipients from the input to their public keys
	 * and returns an array of keys. If a recipient does not have a key
	 * still return their address.
	 * @return {Array}   the array of public key objects
	 */
	EditorCtrl.prototype.getRecipientKeys = function () {
	  return (this.recipients || []).map(function (r) {
	    return r.key || r; // some recipients don't have a key, still return address
	  });
	};
	
	/**
	 * Emit an event to the background script that the editor is finished initializing.
	 * Called when the angular controller is initialized (after templates have loaded)
	 */
	EditorCtrl.prototype.initComplete = function () {
	  this.emit('editor-init', { sender: this._name });
	};
	
	/**
	 * Opens the security settings if in embedded mode
	 */
	EditorCtrl.prototype.openSecuritySettings = function () {
	  if (this.embedded) {
	    this.emit('open-security-settings', { sender: this._name });
	  }
	};
	
	/**
	 * Send the plaintext body to the background script for either signing or
	 * encryption.
	 * @param  {String} action   Either 'sign' or 'encrypt'
	 */
	EditorCtrl.prototype.sendPlainText = function (action) {
	  this.emit('editor-plaintext', {
	    sender: this._name,
	    message: this.getEditorText(),
	    keys: this.getRecipientKeys(),
	    attachments: this.getAttachments(),
	    action: action,
	    signMsg: modalFooterProps.signMsg,
	    signKey: modalFooterProps.signKey.toLowerCase()
	  });
	};
	
	/**
	 * send log entry for the extension
	 * @param {string} type
	 */
	EditorCtrl.prototype.logUserInput = function (type) {
	  this.emit('editor-user-input', {
	    sender: this._name,
	    source: 'security_log_editor',
	    type: type
	  });
	};
	
	/**
	 * Is called when the user clicks the encrypt button.
	 */
	EditorCtrl.prototype.encrypt = function () {
	  this.logUserInput('security_log_dialog_encrypt');
	  this.sendPlainText('encrypt');
	};
	
	/**
	 * Is called when the user clicks the sign button.
	 */
	EditorCtrl.prototype.sign = function () {
	  this.logUserInput('security_log_dialog_sign');
	  this.emit('sign-only', {
	    sender: this._name,
	    signKeyId: modalFooterProps.signKey.toLowerCase()
	  });
	};
	
	/**
	 * Is called when the user clicks the cancel button.
	 */
	EditorCtrl.prototype.cancel = function () {
	  this.logUserInput('security_log_dialog_cancel');
	  this.emit('editor-cancel', {
	    sender: this._name
	  });
	};
	
	//
	// Legacy code
	//
	
	EditorCtrl.prototype.getEditorText = function () {
	  return editor.val();
	};
	
	EditorCtrl.prototype.getAttachments = function () {
	  return fileLib.getFiles($('#uploadPanel'));
	};
	
	EditorCtrl.prototype._onSetText = function (msg) {
	  onSetText(msg);
	};
	
	EditorCtrl.prototype._showWaitingModal = function () {
	  $('#waitingModal').modal({ keyboard: false }).modal('show');
	};
	
	EditorCtrl.prototype._hideWaitingModal = function () {
	  $('#waitingModal').modal('hide');
	};
	
	EditorCtrl.prototype._onSetInitData = function (_ref) {
	  let data = _ref.data;
	
	  onSetText(data);
	  setSignMode(data);
	};
	
	EditorCtrl.prototype._onSetAttachment = function (msg) {
	  setAttachment(msg.attachment);
	};
	
	EditorCtrl.prototype._decryptFailed = function (msg) {
	  var error = {
	    title: l10n.map.waiting_dialog_decryption_failed,
	    message: msg.error ? msg.error.message : l10n.map.waiting_dialog_decryption_failed,
	    class: 'alert alert-danger'
	  };
	  showErrorModal(error);
	};
	
	EditorCtrl.prototype._onShowPwdDialog = function (msg) {
	  this._removeDialog();
	  addPwdDialog(msg.id);
	};
	
	EditorCtrl.prototype._getPlaintext = function (msg) {
	  if (numUploadsInProgress !== 0) {
	    delayedAction = msg.action;
	  } else {
	    _self.sendPlainText(msg.action);
	  }
	};
	
	EditorCtrl.prototype._onErrorMessage = function (msg) {
	  if (msg.error.code === 'PWD_DIALOG_CANCEL') {
	    return;
	  }
	  showErrorModal(msg.error);
	};
	
	/**
	 * Remember global reference of $scope for use inside closure
	 */
	EditorCtrl.prototype.setGlobal = function (global) {
	  _self = global;
	  _self._port = port;
	  // l10n is only initialized in Chrome at this time
	  _self.l10n = l10n;
	};
	
	var id;
	var name;
	// plain or rich text
	var editor_type;
	var port;
	// editor element
	var editor;
	// blur warning
	var blurWarn;
	// timeoutID for period in which blur events are monitored
	var blurWarnPeriod = null;
	// timeoutID for period in which blur events are non-critical
	var blurValid = null;
	var initText = null;
	var basePath;
	var logTextareaInput = true;
	var numUploadsInProgress = 0;
	var delayedAction = '';
	var qs;
	var _self;
	
	let modalBodyBottomPosition = 0;
	let footerProps = {
	  onClickUpload: () => _self.logUserInput('security_log_add_attachment'),
	  onChangeFileInput: onAddAttachment,
	  onClickFileEncryption: () => _self.emit('open-app', { sender: _self._name, fragment: 'file_encrypting' })
	};
	let modalFooterProps = {
	  expanded: false,
	  signMsg: false,
	  signKey: '',
	  onCancel: () => _self.cancel(),
	  onSignOnly: () => _self.sign(),
	  onEncrypt: () => _self.encrypt(),
	  onExpand: () => {
	    $('.m-modal .modal-body').animate({ bottom: '172px' }, () => {
	      renderModalFooter({ expanded: true });
	    });
	  },
	  onCollapse: () => {
	    $('.m-modal .modal-body').animate({ bottom: modalBodyBottomPosition });
	    renderModalFooter({ expanded: false });
	  },
	  onChangeSignMsg: value => {
	    renderFooter({ signMsg: value });
	    renderModalFooter({ signMsg: value });
	  },
	  onChangeSignKey: value => renderModalFooter({ signKey: value }),
	  onClickSignSetting: () => _self.emit('open-app', { sender: _self._name, fragment: 'general' })
	};
	
	// register language strings
	l10n.register(['editor_remove_upload', 'waiting_dialog_decryption_failed', 'upload_quota_exceeded_warning', 'editor_error_header', 'editor_error_content', 'waiting_dialog_prepare_email', 'upload_quota_warning_headline', 'editor_key_not_found', 'editor_key_not_found_msg', 'editor_label_add_recipient']);
	l10n.mapToLocal().then(() => {
	  // Firefox requires late assignment of l10n
	  _self && _self._timeout(function () {
	    _self.l10n = l10n;
	  });
	});
	
	var maxFileUploadSize = _mvelo2.default.MAXFILEUPLOADSIZE;
	var maxFileUploadSizeChrome = _mvelo2.default.MAXFILEUPLOADSIZECHROME; // temporal fix due issue in Chrome
	
	if (!angular.mock) {
	  // do not init in unit tests
	  angular.element(document).ready(init); // do manual angular bootstraping after init
	}
	
	/**
	 * Inialized the editor by parsing query string parameters
	 * and loading templates into the DOM.
	 */
	function init() {
	  if (document.body.dataset.mvelo) {
	    return;
	  }
	  document.body.dataset.mvelo = true;
	  qs = jQuery.parseQuerystring();
	  id = qs.id;
	  name = 'editor-' + id;
	  if (qs.quota && parseInt(qs.quota) < maxFileUploadSize) {
	    maxFileUploadSize = parseInt(qs.quota);
	  }
	  if (_mvelo2.default.crx && maxFileUploadSize > maxFileUploadSizeChrome) {
	    maxFileUploadSize = maxFileUploadSizeChrome;
	  }
	  // plain text only
	  editor_type = _mvelo2.default.PLAIN_TEXT; //qs.editor_type;
	  port = _mvelo2.default.extension.connect({ name: name });
	  loadTemplates(Boolean(qs.embedded), templatesLoaded);
	  if (_mvelo2.default.crx) {
	    basePath = '../../';
	  } else if (_mvelo2.default.ffa) {
	    basePath = _mvelo2.default.extension._dataPath;
	  }
	}
	
	/**
	 * Load templates into the DOM.
	 */
	function loadTemplates(embedded, callback) {
	  var $body = $('body');
	  $body.attr('ng-controller', 'EditorCtrl as edit');
	  if (embedded) {
	    $body.addClass("secureBackground");
	
	    Promise.all([_mvelo2.default.appendTpl($body, _mvelo2.default.extension.getURL('components/editor/tpl/editor-body.html')), _mvelo2.default.appendTpl($body, _mvelo2.default.extension.getURL('components/editor/tpl/waiting-modal.html')), _mvelo2.default.appendTpl($body, _mvelo2.default.extension.getURL('components/editor/tpl/error-modal.html'))]).then(function () {
	      renderFooter({ embedded });
	    }).then(callback);
	  } else {
	    _mvelo2.default.appendTpl($body, _mvelo2.default.extension.getURL('components/editor/tpl/editor-popup.html')).then(function () {
	      $('.modal-body').addClass('secureBackground');
	
	      Promise.all([_mvelo2.default.appendTpl($('#editorDialog .modal-body'), _mvelo2.default.extension.getURL('components/editor/tpl/editor-body.html')), _mvelo2.default.appendTpl($body, _mvelo2.default.extension.getURL('components/editor/tpl/encrypt-modal.html')), _mvelo2.default.appendTpl($body, _mvelo2.default.extension.getURL('components/editor/tpl/waiting-modal.html')), _mvelo2.default.appendTpl($body, _mvelo2.default.extension.getURL('components/editor/tpl/error-modal.html'))]).then(function () {
	        renderFooter({ embedded });
	        renderModalFooter();
	      }).then(callback);
	    });
	  }
	}
	
	function renderFooter() {
	  let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	
	  Object.assign(footerProps, props);
	  _reactDom2.default.render(_react2.default.createElement(_EditorFooter2.default, footerProps), $('#footer').get(0));
	}
	
	function renderModalFooter() {
	  let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	
	  Object.assign(modalFooterProps, props);
	  _reactDom2.default.render(_react2.default.createElement(_EditorModalFooter2.default, modalFooterProps), $('#editorDialog .modal-footer').get(0));
	}
	
	/**
	 * Called after templates have loaded. Now is the time to bootstrap angular.
	 */
	function templatesLoaded() {
	  $('#waitingModal').on('hidden.bs.modal', function () {
	    editor.focus().prop('selectionStart', 0).prop('selectionEnd', 0);
	  });
	  $(window).on('focus', startBlurValid);
	  if (editor_type == _mvelo2.default.PLAIN_TEXT) {
	    editor = createPlainText();
	  } else {}
	  // no rich text option
	
	  // blur warning
	  blurWarn = $('#blurWarn');
	  // observe modals for blur warning
	  $('.modal').on('show.bs.modal', startBlurValid);
	  if (initText) {
	    setText(initText);
	    initText = null;
	  }
	  _mvelo2.default.l10n.localizeHTML();
	  _mvelo2.default.util.showSecurityBackground(qs.embedded);
	  // bootstrap angular
	  angular.bootstrap(document, ['editor']);
	  // keep initial bottom position of body
	  modalBodyBottomPosition = $('.m-modal .modal-body').css('bottom');
	}
	
	function addAttachment(file) {
	  if (fileLib.isOversize(file)) {
	    throw new Error('File is too big');
	  }
	
	  fileLib.readUploadFile(file, afterLoadEnd).then(function (response) {
	    var $fileElement = fileLib.createFileElement(response, {
	      removeButton: true,
	      onRemove: onRemoveAttachment
	    });
	    var $uploadPanel = $('#uploadPanel');
	    var uploadPanelHeight = $uploadPanel[0].scrollHeight;
	    $uploadPanel.append($fileElement).scrollTop(uploadPanelHeight); //Append attachment element and scroll to bottom of #uploadPanel to show current uploads
	  }).catch(function (error) {
	    console.log(error);
	  });
	}
	
	function afterLoadEnd() {
	  numUploadsInProgress--;
	  if (numUploadsInProgress === 0 && delayedAction) {
	    _self.sendPlainText(delayedAction);
	    delayedAction = '';
	  }
	}
	
	function setAttachment(attachment) {
	  var buffer = _mvelo2.default.util.str2ab(attachment.content);
	  var blob = new Blob([buffer], { type: attachment.mimeType });
	  var file = new File([blob], attachment.filename, { type: attachment.mimeType });
	  numUploadsInProgress++;
	  addAttachment(file);
	}
	
	function onAddAttachment(evt) {
	  var files = evt.target.files;
	  var numFiles = files.length;
	
	  var i;
	  var fileSizeAll = 0;
	  for (i = 0; i < numFiles; i++) {
	    fileSizeAll += parseInt(files[i].size);
	  }
	
	  var currentAttachmentsSize = fileLib.getFileSize($('#uploadPanel')) + fileSizeAll;
	  if (currentAttachmentsSize > maxFileUploadSize) {
	    var error = {
	      title: l10n.map.upload_quota_warning_headline,
	      message: l10n.map.upload_quota_exceeded_warning + " " + Math.floor(maxFileUploadSize / (1024 * 1024)) + "MB."
	    };
	
	    showErrorModal(error);
	    return;
	  }
	
	  for (i = 0; i < files.length; i++) {
	    numUploadsInProgress++;
	    addAttachment(files[i]);
	  }
	}
	
	function onRemoveAttachment() {
	  _self.logUserInput('security_log_remove_attachment');
	}
	
	function createPlainText() {
	  var sandbox = $('<iframe/>', {
	    sandbox: 'allow-same-origin allow-scripts',
	    frameBorder: 0,
	    css: {
	      'overflow-y': 'hidden'
	    }
	  });
	  var text = $('<textarea/>', {
	    id: 'content',
	    class: 'form-control',
	    rows: 12,
	    css: {
	      'width': '100%',
	      'height': '100%',
	      'margin-bottom': '0',
	      'color': 'black',
	      'resize': 'none'
	    }
	  });
	  var style = $('<link/>', { rel: 'stylesheet', href: basePath + 'dep/bootstrap/css/bootstrap.css' });
	  var style2 = $('<link/>', { rel: 'stylesheet', href: basePath + 'mvelo.css' });
	  var meta = $('<meta/>', { charset: 'UTF-8' });
	  sandbox.one('load', function () {
	    sandbox.contents().find('head').append(meta).append(style).append(style2);
	    sandbox.contents().find('body').attr("style", "overflow: hidden; margin: 0").append(text);
	  });
	  $('#plainText').append(sandbox);
	  text.on('input', function () {
	    startBlurWarnInterval();
	    if (logTextareaInput) {
	      _self.logUserInput('security_log_textarea_input');
	      // limit textarea log to 1 event per second
	      logTextareaInput = false;
	      window.setTimeout(function () {
	        logTextareaInput = true;
	      }, 1000);
	    }
	  });
	  text.on('blur', onBlur);
	  text.on('mouseup', function () {
	    var textElement = text.get(0);
	    if (textElement.selectionStart === textElement.selectionEnd) {
	      _self.logUserInput('security_log_textarea_click');
	    } else {
	      _self.logUserInput('security_log_textarea_select');
	    }
	  });
	  return text;
	}
	
	function setPlainText(text) {
	  editor.focus().val(text).prop('selectionStart', 0).prop('selectionEnd', 0);
	}
	
	function setText(text) {
	  if (editor_type == _mvelo2.default.PLAIN_TEXT) {
	    setPlainText(text);
	  } else {
	    // no rich text option
	  }
	}
	
	function onBlur() {
	  /*
	   blur warning displayed if blur occurs:
	   - inside blur warning period (2s after input)
	   - not within 40ms after mousedown event (RTE)
	   - not within 40ms before focus event (window, modal)
	   */
	  if (blurWarnPeriod && !blurValid) {
	    window.setTimeout(function () {
	      showBlurWarning();
	    }, 40);
	  }
	  return true;
	}
	
	function showBlurWarning() {
	  if (!blurValid) {
	    // fade in 600ms, wait 200ms, fade out 600ms
	    blurWarn.removeClass('hide').stop(true).animate({ opacity: 1 }, 'slow', 'swing', function () {
	      setTimeout(function () {
	        blurWarn.animate({ opacity: 0 }, 'slow', 'swing', function () {
	          blurWarn.addClass('hide');
	        });
	      }, 200);
	    });
	  }
	}
	
	function startBlurWarnInterval() {
	  if (blurWarnPeriod) {
	    // clear timeout
	    window.clearTimeout(blurWarnPeriod);
	  }
	  // restart
	  blurWarnPeriod = window.setTimeout(function () {
	    // end
	    blurWarnPeriod = null;
	  }, 2000);
	  return true;
	}
	
	function startBlurValid() {
	  if (blurValid) {
	    // clear timeout
	    window.clearTimeout(blurValid);
	  }
	  // restart
	  blurValid = window.setTimeout(function () {
	    // end
	    blurValid = null;
	  }, 40);
	  return true;
	}
	
	function addPwdDialog(id) {
	  var pwd = $('<iframe/>', {
	    id: 'pwdDialog',
	    src: '../enter-password/pwdDialog.html?id=' + id,
	    frameBorder: 0
	  });
	  $('body').find('#editorDialog').fadeOut(function () {
	    $('body').append(pwd);
	  });
	}
	
	EditorCtrl.prototype._hidePwdDialog = function () {
	  $('body #pwdDialog').fadeOut(function () {
	    $('body #pwdDialog').remove();
	    $('body').find('#editorDialog').show();
	  });
	};
	
	EditorCtrl.prototype._removeDialog = function () {
	  $('#encryptModal').modal('hide');
	  $('#encryptModal iframe').remove();
	};
	
	/**
	 * @param {Object} error
	 * @param {String} [error.title]
	 * @param {String} error.message
	 * @param {String} [error.class]
	 */
	function showErrorModal(error) {
	  var title = error.title || l10n.map.editor_error_header;
	  var content = error.message;
	  var $errorModal = $('#errorModal');
	
	  if (content) {
	    content = $('<div/>').addClass(error.class || 'alert alert-danger').text(content);
	  }
	
	  $('.modal-body', $errorModal).empty().append(content);
	  $('.modal-title', $errorModal).empty().append(title);
	  $errorModal.modal('show').on('hidden.bs.modal', function () {
	    $('#waitingModal').modal('hide');
	  });
	  _self._hidePwdDialog();
	}
	
	function setSignMode(_ref2) {
	  let signMsg = _ref2.signMsg,
	      primary = _ref2.primary,
	      privKeys = _ref2.privKeys;
	
	  signMsg = Boolean(signMsg);
	  // update footer
	  renderFooter({ signMsg, primaryKey: Boolean(primary) });
	  // only render in non-embedded mode
	  if (!footerProps.embedded) {
	    // update modal footer
	    renderModalFooter({ signMsg, signKey: primary, privKeys });
	  }
	}
	
	function onSetText(options) {
	  if (!options.text) {
	    return;
	  }
	  if (editor) {
	    setText(options.text);
	  } else {
	    initText = options.text;
	  }
	}

/***/ },
/* 1 */
/*!************************!*\
  !*** external "React" ***!
  \************************/
/***/ function(module, exports) {

	module.exports = React;

/***/ },
/* 2 */
/*!***************************!*\
  !*** external "ReactDOM" ***!
  \***************************/
/***/ function(module, exports) {

	module.exports = ReactDOM;

/***/ },
/* 3 */
/*!**********************!*\
  !*** ./src/mvelo.js ***!
  \**********************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	/**
	 * Mailvelope - secure email with OpenPGP encryption for Webmail
	 * Copyright (C) 2012-2015 Mailvelope GmbH
	 *
	 * This program is free software: you can redistribute it and/or modify
	 * it under the terms of the GNU Affero General Public License version 3
	 * as published by the Free Software Foundation.
	 *
	 * This program is distributed in the hope that it will be useful,
	 * but WITHOUT ANY WARRANTY; without even the implied warranty of
	 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	 * GNU Affero General Public License for more details.
	 *
	 * You should have received a copy of the GNU Affero General Public License
	 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
	 */
	
	/* eslint strict: 0 */
	
	var mvelo = typeof window !== 'undefined' && window.mvelo || {};
	// chrome extension
	mvelo.crx = typeof chrome !== 'undefined';
	// firefox addon
	mvelo.ffa = mvelo.ffa || typeof self !== 'undefined' && self.port || !mvelo.crx;
	
	/* constants */
	
	// min height for large frame
	mvelo.LARGE_FRAME = 600;
	// frame constants
	mvelo.FRAME_STATUS = 'stat';
	// frame status
	mvelo.FRAME_ATTACHED = 'att';
	mvelo.FRAME_DETACHED = 'det';
	// key for reference to frame object
	mvelo.FRAME_OBJ = 'fra';
	// marker for dynamically created iframes
	mvelo.DYN_IFRAME = 'dyn';
	mvelo.IFRAME_OBJ = 'obj';
	// armor header type
	mvelo.PGP_MESSAGE = 'msg';
	mvelo.PGP_SIGNATURE = 'sig';
	mvelo.PGP_PUBLIC_KEY = 'pub';
	mvelo.PGP_PRIVATE_KEY = 'priv';
	// display decrypted message
	mvelo.DISPLAY_INLINE = 'inline';
	mvelo.DISPLAY_POPUP = 'popup';
	// editor type
	mvelo.PLAIN_TEXT = 'plain';
	mvelo.RICH_TEXT = 'rich';
	// keyring
	mvelo.KEYRING_DELIMITER = '|#|';
	mvelo.LOCAL_KEYRING_ID = 'localhost' + mvelo.KEYRING_DELIMITER + 'mailvelope';
	// colors for secure background
	mvelo.SECURE_COLORS = ['#e9e9e9', '#c0c0c0', '#808080', '#ffce1e', '#ff0000', '#85154a', '#6f2b8b', '#b3d1e3', '#315bab', '#1c449b', '#4c759c', '#1e8e9f', '#93b536'];
	
	mvelo.MAXFILEUPLOADSIZE = 25 * 1024 * 1024;
	mvelo.MAXFILEUPLOADSIZECHROME = 20 * 1024 * 1024; // temporal fix due issue in Chrome
	
	mvelo.appendTpl = function ($element, path) {
	  if (mvelo.ffa && !/^resource/.test(document.location.protocol)) {
	    return new Promise(function (resolve) {
	      mvelo.data.load(path, function (result) {
	        $element.append($.parseHTML(result));
	        resolve($element);
	      });
	    });
	  } else {
	    return new Promise(function (resolve, reject) {
	      var req = new XMLHttpRequest();
	      req.open('GET', path);
	      req.responseType = 'text';
	      req.onload = function () {
	        if (req.status == 200) {
	          $element.append($.parseHTML(req.response));
	          resolve($element);
	        } else {
	          reject(new Error(req.statusText));
	        }
	      };
	      req.onerror = function () {
	        reject(new Error('Network Error'));
	      };
	      req.send();
	    });
	  }
	};
	
	// for fixfox, mvelo.extension is exposed from a content script
	mvelo.extension = mvelo.extension || mvelo.crx && chrome.runtime;
	// extension.connect shim for Firefox
	if (mvelo.ffa && mvelo.extension) {
	  mvelo.extension.connect = function (obj) {
	    mvelo.extension._connect(obj);
	    obj.events = {};
	    var port = {
	      postMessage: mvelo.extension.port.postMessage,
	      disconnect: mvelo.extension.port.disconnect.bind(null, obj),
	      onMessage: {
	        addListener: mvelo.extension.port.addListener.bind(null, obj)
	      },
	      onDisconnect: {
	        addListener: mvelo.extension.port.addDisconnectListener.bind(null)
	      }
	    };
	    // page unload triggers port disconnect
	    window.addEventListener('unload', port.disconnect);
	    return port;
	  };
	}
	
	// for fixfox, mvelo.l10n is exposed from a content script
	mvelo.l10n = mvelo.l10n || mvelo.crx && {
	  getMessages: function (ids, callback) {
	    var result = {};
	    ids.forEach(function (id) {
	      result[id] = chrome.i18n.getMessage(id);
	    });
	    callback(result);
	  },
	  localizeHTML: function (l10n, idSelector) {
	    var selector = idSelector ? idSelector + ' [data-l10n-id]' : '[data-l10n-id]';
	    $(selector).each(function () {
	      var jqElement = $(this);
	      var id = jqElement.data('l10n-id');
	      var text = l10n ? l10n[id] : chrome.i18n.getMessage(id) || id;
	      jqElement.text(text);
	    });
	    $('[data-l10n-title-id]').each(function () {
	      var jqElement = $(this);
	      var id = jqElement.data('l10n-title-id');
	      var text = l10n ? l10n[id] : chrome.i18n.getMessage(id) || id;
	      jqElement.attr('title', text);
	    });
	  }
	};
	
	mvelo.util = {};
	
	mvelo.util.sortAndDeDup = function (unordered, compFn) {
	  var result = [];
	  var sorted = unordered.sort(compFn);
	  // remove duplicates
	  for (var i = 0; i < sorted.length; i++) {
	    if (i === 0 || compFn && compFn(sorted[i - 1], sorted[i]) !== 0 || !compFn && sorted[i - 1] !== sorted[i]) {
	      result.push(sorted[i]);
	    }
	  }
	  return result;
	};
	
	/**
	 * Only deduplicates, does not sort
	 * @param  {Array} list   The list of items with duplicates
	 * @return {Array}        The list of items without duplicates
	 */
	mvelo.util.deDup = function (list) {
	  var result = [];
	  (list || []).forEach(function (i) {
	    if (result.indexOf(i) === -1) {
	      result.push(i);
	    }
	  });
	  return result;
	};
	
	// random hash generator
	mvelo.util.getHash = function () {
	  var result = '';
	  var buf = new Uint16Array(6);
	  if (typeof window !== 'undefined') {
	    window.crypto.getRandomValues(buf);
	  } else {
	    mvelo.util.getDOMWindow().crypto.getRandomValues(buf);
	  }
	  for (var i = 0; i < buf.length; i++) {
	    result += buf[i].toString(16);
	  }
	  return result;
	};
	
	mvelo.util.encodeHTML = function (text) {
	  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;").replace(/\//g, "&#x2F;");
	};
	
	mvelo.util.decodeHTML = function (html) {
	  return String(html).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#039;/g, "\'").replace(/&#x2F;/g, "\/");
	};
	
	mvelo.util.decodeQuotedPrint = function (armored) {
	  return armored.replace(/=3D=3D\s*$/m, "==").replace(/=3D\s*$/m, "=").replace(/=3D(\S{4})\s*$/m, "=$1");
	};
	
	mvelo.util.text2html = function (text) {
	  return this.encodeHTML(text).replace(/\n/g, '<br>');
	};
	
	mvelo.util.html2text = function (html) {
	  html = html.replace(/\n/g, ' '); // replace new line with space
	  html = html.replace(/(<br>)/g, '\n'); // replace <br> with new line
	  html = html.replace(/<\/(blockquote|div|dl|dt|dd|form|h1|h2|h3|h4|h5|h6|hr|ol|p|pre|table|tr|td|ul|li|section|header|footer)>/g, '\n'); // replace block closing tags </..> with new line
	  html = html.replace(/<(.+?)>/g, ''); // remove tags
	  html = html.replace(/&nbsp;/g, ' '); // replace non-breaking space with whitespace
	  html = html.replace(/\n{3,}/g, '\n\n'); // compress new line
	  return mvelo.util.decodeHTML(html);
	};
	
	/**
	 * This function will return the byte size of any UTF-8 string you pass to it.
	 * @param {string} str
	 * @returns {number}
	 */
	mvelo.util.byteCount = function (str) {
	  return encodeURI(str).split(/%..|./).length - 1;
	};
	
	mvelo.util.ab2str = function (buf) {
	  var str = '';
	  var ab = new Uint8Array(buf);
	  var CHUNK_SIZE = Math.pow(2, 16);
	  var offset, len, subab;
	  for (offset = 0; offset < ab.length; offset += CHUNK_SIZE) {
	    len = Math.min(CHUNK_SIZE, ab.length - offset);
	    subab = ab.subarray(offset, offset + len);
	    str += String.fromCharCode.apply(null, subab);
	  }
	  return str;
	};
	
	mvelo.util.str2ab = function (str) {
	  var bufView = new Uint8Array(str.length);
	  for (var i = 0; i < str.length; i++) {
	    bufView[i] = str.charCodeAt(i);
	  }
	  return bufView.buffer;
	};
	
	mvelo.util.getExtensionClass = function (fileExt) {
	  var extClass = '';
	  if (fileExt) {
	    extClass = 'ext-color-' + fileExt;
	  }
	  return extClass;
	};
	
	mvelo.util.extractFileNameWithoutExt = function (fileName) {
	  var indexOfDot = fileName.lastIndexOf('.');
	  if (indexOfDot > 0) {
	    // case: regular
	    return fileName.substring(0, indexOfDot);
	  } else {
	    return fileName;
	  }
	};
	
	mvelo.util.extractFileExtension = function (fileName) {
	  var lastindexDot = fileName.lastIndexOf('.');
	  if (lastindexDot <= 0) {
	    // no extension
	    return '';
	  } else {
	    return fileName.substring(lastindexDot + 1, fileName.length).toLowerCase().trim();
	  }
	};
	
	// Attribution: http://www.2ality.com/2012/08/underscore-extend.html
	mvelo.util.extend = function (target) {
	  var sources = [].slice.call(arguments, 1);
	  sources.forEach(function (source) {
	    Object.getOwnPropertyNames(source).forEach(function (propName) {
	      Object.defineProperty(target, propName, Object.getOwnPropertyDescriptor(source, propName));
	    });
	  });
	  return target;
	};
	
	mvelo.util.addLoadingAnimation = function ($parent) {
	  $parent = $parent || $('body')[0];
	  var spinner = $('<div class="m-spinner"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div>');
	  spinner.appendTo($parent);
	};
	
	mvelo.util.showLoadingAnimation = function ($parent) {
	  $parent = $parent || $('body')[0];
	  $('.m-spinner', $parent).show();
	};
	
	mvelo.util.hideLoadingAnimation = function ($parent) {
	  $parent = $parent || $('body')[0];
	  $('.m-spinner', $parent).hide();
	};
	
	mvelo.util.generateSecurityBackground = function (angle, scaling, coloring) {
	  var security = mvelo.util.secBgnd,
	      iconWidth = security.width * security.scaling,
	      iconHeight = security.height * security.scaling,
	      iconAngle = security.angle,
	      iconColor = mvelo.SECURE_COLORS[security.colorId];
	
	  if (angle || angle === 0) {
	    iconAngle = angle;
	  }
	  if (scaling) {
	    iconWidth = security.width * scaling;
	    iconHeight = security.height * scaling;
	  }
	  if (coloring) {
	    iconColor = mvelo.SECURE_COLORS[coloring];
	  }
	
	  return '<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg xmlns="http://www.w3.org/2000/svg" id="secBgnd" version="1.1" width="' + iconWidth + 'px" height="' + iconHeight + 'px" viewBox="0 0 27 27"><path transform="rotate(' + iconAngle + ' 14 14)" style="fill: ' + iconColor + ';" d="m 13.963649,25.901754 c -4.6900005,0 -8.5000005,-3.78 -8.5000005,-8.44 0,-1.64 0.47,-3.17 1.29,-4.47 V 9.0417546 c 0,-3.9399992 3.23,-7.1499992 7.2000005,-7.1499992 3.97,0 7.2,3.21 7.2,7.1499992 v 3.9499994 c 0.82,1.3 1.3,2.83 1.3,4.48 0,4.65 -3.8,8.43 -8.49,8.43 z m -1.35,-7.99 v 3.33 h 0 c 0,0.02 0,0.03 0,0.05 0,0.74 0.61,1.34 1.35,1.34 0.75,0 1.35,-0.6 1.35,-1.34 0,-0.02 0,-0.03 0,-0.05 h 0 v -3.33 c 0.63,-0.43 1.04,-1.15 1.04,-1.97 0,-1.32 -1.07,-2.38 -2.4,-2.38 -1.32,0 -2.4,1.07 -2.4,2.38 0.01,0.82 0.43,1.54 1.06,1.97 z m 6.29,-8.8699994 c 0,-2.7099992 -2.22,-4.9099992 -4.95,-4.9099992 -2.73,0 -4.9500005,2.2 -4.9500005,4.9099992 V 10.611754 C 10.393649,9.6217544 12.103649,9.0317546 13.953649,9.0317546 c 1.85,0 3.55,0.5899998 4.94,1.5799994 l 0.01,-1.5699994 z" /></svg>';
	};
	
	mvelo.util.showSecurityBackground = function (isEmbedded) {
	  if (isEmbedded) {
	    $('.secureBgndSettingsBtn').on('mouseenter', function () {
	      $('.secureBgndSettingsBtn').removeClass('btn-link').addClass('btn-default');
	    });
	
	    $('.secureBgndSettingsBtn').on('mouseleave', function () {
	      $('.secureBgndSettingsBtn').removeClass('btn-default').addClass('btn-link');
	    });
	  }
	
	  mvelo.extension.sendMessage({ event: "get-security-background" }, function (background) {
	    mvelo.util.secBgnd = background;
	
	    var secBgndIcon = mvelo.util.generateSecurityBackground(),
	        secureStyle = '.secureBackground {' + 'background-color: ' + mvelo.util.secBgnd.color + ';' + 'background-position: -20px -20px;' + 'background-image: url(data:image/svg+xml;base64,' + btoa(secBgndIcon) + ');' + '}';
	
	    var lockIcon = mvelo.util.generateSecurityBackground(0, null, 2),
	        lockButton = '.lockBtnIcon, .lockBtnIcon:active {' + 'margin: 0px;' + 'width: 28px; height: 28px;' + 'background-size: 100% 100%;' + 'background-repeat: no-repeat;' + 'background-image: url(data:image/svg+xml;base64,' + btoa(lockIcon) + ');' + '}';
	
	    var secBgndStyle = document.getElementById('secBgndCss');
	    if (secBgndStyle) {
	      secBgndStyle.parentNode.removeChild(secBgndStyle);
	    }
	    $('head').append($('<style>').attr('id', 'secBgndCss').text(secureStyle + lockButton));
	  });
	};
	
	mvelo.util.matchPattern2RegEx = function (matchPattern) {
	  return new RegExp('^' + matchPattern.replace(/\./g, '\\.').replace(/\*\\\./, '(\\w+(-\\w+)*\\.)*') + '$');
	};
	
	mvelo.util.mapError = function (error) {
	  return { message: error.message, code: error.code || 'INTERNAL_ERROR' };
	};
	
	mvelo.util.throwError = function (message, code) {
	  var error = new Error(message);
	  error.code = code;
	  throw error;
	};
	
	mvelo.util.PromiseQueue = function () {
	  this.queue = [];
	};
	
	mvelo.util.PromiseQueue.prototype.push = function (thisArg, method, args) {
	  var that = this;
	  return new Promise(function (resolve, reject) {
	    that.queue.push({ resolve: resolve, reject: reject, thisArg: thisArg, method: method, args: args });
	    if (that.queue.length === 1) {
	      that._next();
	    }
	  });
	};
	
	mvelo.util.PromiseQueue.prototype._next = function () {
	  if (this.queue.length === 0) {
	    return;
	  }
	  var that = this;
	  var nextEntry = this.queue[0];
	  mvelo.util.setTimeout(function () {
	    nextEntry.thisArg[nextEntry.method].apply(nextEntry.thisArg, nextEntry.args).then(function (result) {
	      nextEntry.resolve(result);
	    }).catch(function (error) {
	      nextEntry.reject(error);
	    }).then(function () {
	      that.queue.shift();
	      that._next();
	    });
	  }, 0);
	};
	
	/**
	 * Waterfall of async processes
	 * @param  {Function} process - has to return Promise, result as array
	 * @param  {Array} list - each item is processed
	 * @return {Promise} - resolved when all processes finished with end result as array
	 */
	mvelo.util.sequential = (process, list) => {
	  return list.reduce((acc, item) => {
	    return acc.then(result => {
	      return process(item).then(processResult => {
	        result.push(...processResult);
	        return result;
	      });
	    });
	  }, Promise.resolve([]));
	};
	
	/**
	 * Validate an email address.
	 * @param  {String} address   The email address to validate
	 * @return {Boolean}          True if valid, false if not
	 */
	mvelo.util.checkEmail = function (address) {
	  var pattern = /^[+a-zA-Z0-9_.!#$%&'*\/=?^`{|}~-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z0-9]{2,63}$/;
	  return pattern.test(address);
	};
	
	/**
	 * Inherit from mvelo.EventHandler.prototype to use the new event handling
	 * apis 'on' and 'emit'.
	 */
	mvelo.EventHandler = function () {};
	
	/**
	 * Generic port message handler that can be attached via port.onMessage.addListener().
	 * Once set up, events can be handled with on('event', function(options) {})
	 * @param  {String} options.event   The event descriptor
	 * @param  {Object} options         Contains message attributes and data
	 */
	mvelo.EventHandler.prototype.handlePortMessage = function (options) {
	  options = options || {};
	  if (this._handlers && this._handlers.has(options.event)) {
	    this._handlers.get(options.event).call(this, options);
	  } else {
	    console.log('Unknown event', options);
	  }
	};
	
	/**
	 * The new event handling style to asign a function to an event.
	 * @param  {String} event       The event descriptor
	 * @param  {Function} handler   The event handler
	 */
	mvelo.EventHandler.prototype.on = function (event, handler) {
	  if (!event || typeof event !== 'string' || typeof handler !== 'function') {
	    throw new Error('Invalid event handler!');
	  }
	  if (!this._handlers) {
	    this._handlers = new Map();
	  }
	  this._handlers.set(event, handler);
	};
	
	/**
	 * Helper to emit events via postMessage using a port.
	 * @param  {String} event     The event descriptor
	 * @param  {Object} options   (optional) Data to be sent in the event
	 * @param  {Object} port      (optional) The port to be used. If
	 *                            not specified, the main port is used.
	 */
	mvelo.EventHandler.prototype.emit = function (event, options, port) {
	  if (!event || typeof event !== 'string') {
	    throw new Error('Invalid event!');
	  }
	  options = options || {};
	  options.event = event;
	  options.sender = options.sender || this._senderId;
	  (port || this._port || this.ports[this.mainType]).postMessage(options);
	};
	
	if (true) {
	  module.exports = mvelo;
	}

/***/ },
/* 4 */
/*!**********************************************************!*\
  !*** ./src/components/editor/components/EditorFooter.js ***!
  \**********************************************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _react = __webpack_require__(/*! react */ 1);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _l10n = __webpack_require__(/*! ../../../lib/l10n */ 5);
	
	var l10n = _interopRequireWildcard(_l10n);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	/**
	 * Copyright (C) 2016 Mailvelope GmbH
	 * Licensed under the GNU Affero General Public License version 3
	 */
	
	'use strict';
	
	l10n.register(['upload_attachment', 'editor_sign_caption_short', 'editor_sign_caption_long', 'editor_no_primary_key_caption_short', 'editor_no_primary_key_caption_long', 'editor_link_file_encryption']);
	
	class EditorFooter extends _react2.default.Component {
	  constructor(props) {
	    super(props);
	    this.handleClickUpload = this.handleClickUpload.bind(this);
	  }
	
	  componentDidMount() {
	    this.initTooltip();
	  }
	
	  componentDidUpdate() {
	    this.initTooltip();
	  }
	
	  initTooltip() {
	    if (this.props.signMsg) {
	      $(this.signCaption).tooltip();
	    }
	  }
	
	  handleClickUpload() {
	    $('#addFileInput').click();
	    this.props.onClickUpload();
	  }
	
	  render() {
	    const sign_caption_short = this.props.primaryKey ? l10n.map.editor_sign_caption_short : l10n.map.editor_no_primary_key_caption_short;
	    const sign_caption_long = this.props.primaryKey ? l10n.map.editor_sign_caption_long : l10n.map.editor_no_primary_key_caption_long;
	    return _react2.default.createElement(
	      'div',
	      null,
	      _react2.default.createElement(
	        'div',
	        { className: 'form-group pull-left' },
	        _react2.default.createElement(
	          'button',
	          { onClick: this.handleClickUpload, className: `btn btn-default btn-upload-embedded ${ this.props.embedded ? 'show' : 'hide' }` },
	          _react2.default.createElement('span', { className: 'glyphicon glyphicon-paperclip' }),
	          '\xA0',
	          _react2.default.createElement(
	            'span',
	            null,
	            l10n.map.upload_attachment
	          )
	        ),
	        _react2.default.createElement('input', { type: 'file', id: 'addFileInput', multiple: 'multiple', onChange: this.props.onChangeFileInput }),
	        _react2.default.createElement(
	          'div',
	          { className: 'nav-link-file-encryption' },
	          _react2.default.createElement(
	            'a',
	            { href: '#', className: !this.props.embedded ? 'show' : 'hide', onClick: e => {
	                e.preventDefault();this.props.onClickFileEncryption();
	              } },
	            l10n.map.editor_link_file_encryption
	          )
	        )
	      ),
	      _react2.default.createElement(
	        'div',
	        { className: 'pull-right' },
	        _react2.default.createElement(
	          'span',
	          { ref: node => this.signCaption = node, className: `txt-digital-signature ${ this.props.signMsg ? 'show' : 'hide' }`,
	            'data-toggle': 'tooltip', 'data-placement': 'left', title: sign_caption_long },
	          sign_caption_short
	        )
	      )
	    );
	  }
	}
	
	EditorFooter.propTypes = {
	  embedded: _react2.default.PropTypes.bool, // component is used inside API container view
	  signMsg: _react2.default.PropTypes.bool, // message will be signed
	  primaryKey: _react2.default.PropTypes.bool, // primary key to sign message exists
	  onClickUpload: _react2.default.PropTypes.func, // click on upload button
	  onChangeFileInput: _react2.default.PropTypes.func, // file input change event triggered
	  onClickFileEncryption: _react2.default.PropTypes.func // click on navigation link
	};
	
	exports.default = EditorFooter;

/***/ },
/* 5 */
/*!*************************!*\
  !*** ./src/lib/l10n.js ***!
  \*************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.mapToLocal = exports.register = exports.map = undefined;
	
	var _mvelo = __webpack_require__(/*! ../mvelo */ 3);
	
	var _mvelo2 = _interopRequireDefault(_mvelo);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var map = {};
	
	function register(ids) {
	  ids.forEach(function (id) {
	    map[id] = true;
	  });
	}
	
	function mapToLocal() {
	  return new Promise(function (resolve) {
	    _mvelo2.default.l10n.getMessages(Object.keys(map), localized => {
	      exports.map = map = localized;
	      resolve();
	    });
	  });
	}
	
	exports.map = map;
	exports.register = register;
	exports.mapToLocal = mapToLocal;

/***/ },
/* 6 */
/*!***************************************************************!*\
  !*** ./src/components/editor/components/EditorModalFooter.js ***!
  \***************************************************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _react = __webpack_require__(/*! react */ 1);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _l10n = __webpack_require__(/*! ../../../lib/l10n */ 5);
	
	var l10n = _interopRequireWildcard(_l10n);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	/**
	 * Copyright (C) 2016 Mailvelope GmbH
	 * Licensed under the GNU Affero General Public License version 3
	 */
	
	'use strict';
	
	l10n.register(['form_cancel', 'editor_sign_button', 'editor_encrypt_button', 'options_home', 'sign_dialog_header', 'general_primary_key_auto_sign']);
	
	class EditorModalFooter extends _react2.default.Component {
	  constructor(props) {
	    super(props);
	  }
	
	  signSelection() {
	    return _react2.default.createElement(
	      'form',
	      { className: 'sign-msg-option well' },
	      _react2.default.createElement(
	        'div',
	        { className: 'form-group' },
	        _react2.default.createElement(
	          'div',
	          { className: 'checkbox' },
	          _react2.default.createElement(
	            'label',
	            { className: 'checkbox', htmlFor: 'signMsg' },
	            _react2.default.createElement('input', { checked: this.props.signMsg, onChange: event => this.props.onChangeSignMsg(event.target.checked), type: 'checkbox', id: 'signMsgOption' }),
	            _react2.default.createElement(
	              'span',
	              null,
	              l10n.map.sign_dialog_header
	            )
	          )
	        )
	      ),
	      _react2.default.createElement(
	        'div',
	        { className: 'form-group' },
	        _react2.default.createElement(
	          'select',
	          { className: 'form-control', value: this.props.signKey, onChange: event => this.props.onChangeSignKey(event.target.value) },
	          this.props.privKeys.map(key => _react2.default.createElement(
	            'option',
	            { value: key.id, key: key.id },
	            key.userId + ' - ' + key.id
	          ))
	        )
	      ),
	      _react2.default.createElement(
	        'div',
	        { className: 'form-nav-link pull-right' },
	        _react2.default.createElement(
	          'a',
	          { href: '#', onClick: e => {
	              e.preventDefault();this.props.onClickSignSetting();
	            } },
	          l10n.map.general_primary_key_auto_sign
	        )
	      )
	    );
	  }
	
	  render() {
	    return _react2.default.createElement(
	      'div',
	      null,
	      this.props.expanded && this.signSelection(),
	      _react2.default.createElement(
	        'button',
	        { onClick: this.props.expanded ? this.props.onCollapse : this.props.onExpand, className: 'btn btn-default btn-sm pull-left' },
	        _react2.default.createElement(
	          'span',
	          null,
	          l10n.map.options_home
	        ),
	        '\xA0\xA0',
	        _react2.default.createElement('span', { className: `glyphicon glyphicon-collapse-${ this.props.expanded ? 'down' : 'up' }`, 'aria-hidden': 'true' })
	      ),
	      _react2.default.createElement(
	        'button',
	        { onClick: this.props.onSignOnly, className: 'btn btn-default btn-sm btn-sign-only', disabled: !(this.props.signMsg && this.props.privKeys.length) },
	        _react2.default.createElement('span', { className: 'glyphicon glyphicon-pencil', 'aria-hidden': 'true' }),
	        '\xA0',
	        _react2.default.createElement(
	          'span',
	          null,
	          l10n.map.editor_sign_button
	        )
	      ),
	      _react2.default.createElement(
	        'button',
	        { onClick: this.props.onCancel, className: 'btn btn-default' },
	        _react2.default.createElement('span', { className: 'glyphicon glyphicon-remove', 'aria-hidden': 'true' }),
	        '\xA0',
	        _react2.default.createElement(
	          'span',
	          null,
	          l10n.map.form_cancel
	        )
	      ),
	      _react2.default.createElement(
	        'button',
	        { onClick: this.props.onEncrypt, className: 'btn btn-primary', disabled: this.props.encryptDisabled },
	        _react2.default.createElement('span', { className: 'glyphicon glyphicon-lock', 'aria-hidden': 'true' }),
	        '\xA0',
	        _react2.default.createElement(
	          'span',
	          null,
	          l10n.map.editor_encrypt_button
	        )
	      )
	    );
	  }
	}
	
	EditorModalFooter.propTypes = {
	  onCancel: _react2.default.PropTypes.func, // click on cancel button
	  onSignOnly: _react2.default.PropTypes.func, // click on sign only button
	  onEncrypt: _react2.default.PropTypes.func, // click on encrypt button
	  encryptDisabled: _react2.default.PropTypes.bool, // encrypt action disabled
	  onExpand: _react2.default.PropTypes.func, // click on options button in collapsed state
	  onCollapse: _react2.default.PropTypes.func, // click on options button in expanded state
	  expanded: _react2.default.PropTypes.bool, // expanded state
	  signMsg: _react2.default.PropTypes.bool, // sign message indicator
	  onChangeSignMsg: _react2.default.PropTypes.func, // receives bool value for current signMsg state
	  signKey: _react2.default.PropTypes.string, // sign key id
	  privKeys: _react2.default.PropTypes.array, // list of private keys for signing
	  onChangeSignKey: _react2.default.PropTypes.func, // user selects new key
	  onClickSignSetting: _react2.default.PropTypes.func // click on navigation link
	};
	
	exports.default = EditorModalFooter;

/***/ },
/* 7 */
/*!*************************!*\
  !*** ./src/lib/file.js ***!
  \*************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.isOversize = isOversize;
	exports.getFileSize = getFileSize;
	exports.readUploadFile = readUploadFile;
	exports.createFileElement = createFileElement;
	exports.createFileDownloadElement = createFileDownloadElement;
	exports.getFiles = getFiles;
	
	var _mvelo = __webpack_require__(/*! ../mvelo */ 3);
	
	var _mvelo2 = _interopRequireDefault(_mvelo);
	
	var _l10n = __webpack_require__(/*! ./l10n */ 5);
	
	var l10n = _interopRequireWildcard(_l10n);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	/**
	 * Copyright (C) 2016 Mailvelope GmbH
	 * Licensed under the GNU Affero General Public License version 3
	 */
	
	'use strict';
	
	l10n.register(['editor_remove_upload', 'encrypt_download_file_button']);
	
	/**
	 * @param {File} file
	 * @param {Number} file.size
	 * @returns {boolean}
	 */
	function isOversize(file) {
	  return file.size >= _mvelo2.default.MAXFILEUPLOADSIZE;
	}
	
	/**
	 * @returns {number}
	 */
	function getFileSize($fileList) {
	  var currentAttachmentsSize = 0;
	  $fileList.find('.attachmentButton').each(function () {
	    currentAttachmentsSize += $(this).data('file').size;
	  });
	  return currentAttachmentsSize;
	}
	
	/**
	 * @param {File} file
	 * @param {Number} file.lastModified
	 * @param {Date} file.lastModifiedDate
	 * @param {String} file.name
	 * @param {Number} file.size
	 * @param {String} file.type
	 * @param {String} file.webkitRelativePath
	 * @param {Funtion} onLoadEnd
	 * @returns {Promise<Object, Error>}
	 */
	function readUploadFile(file, onLoadEnd) {
	  return new Promise(function (resolve, reject) {
	    var fileReader = new FileReader();
	    fileReader.onload = function () {
	      resolve({
	        content: this.result,
	        id: _mvelo2.default.util.getHash(),
	        name: file.name,
	        size: file.size,
	        type: file.type
	      });
	    };
	    fileReader.onloadend = onLoadEnd;
	    fileReader.onabort = function (evt) {
	      reject(evt);
	    };
	    fileReader.readAsDataURL(file);
	  });
	}
	
	function createFileElement(file, options) {
	  options = options || {};
	  var $button = $('<div/>', {
	    "title": file.name,
	    "class": 'attachmentButton'
	  });
	  $button.data('file', file);
	  $button.append(getExtensionIcon(file));
	  $button.append(getFileName(file));
	  if (options.secureIcon) {
	    $button.append(getSecureIcon());
	  }
	  if (options.removeButton) {
	    $button.append(getRemoveButton(options.onRemove));
	  }
	  return $button;
	}
	
	function createFileDownloadElement(file, options) {
	  options = options || {};
	  var $button = $('<a/>', {
	    "title": file.name,
	    "download": file.name,
	    "class": 'attachmentButton',
	    "href": downloadAttachment(file)
	  });
	  $button.append(getExtensionIcon(file));
	  $button.append(getFileName(file));
	  if (options.secureIcon) {
	    $button.append(getSecureIcon());
	  }
	  $button.append(getDownloadButton());
	  return $button;
	}
	
	/**
	 * @param {File} file
	 * @param {String} file.name
	 * @returns {*|jQuery}
	 */
	function getFileName(file) {
	  var fileNameNoExt = _mvelo2.default.util.extractFileNameWithoutExt(file.name);
	
	  return $('<span/>', {
	    "class": 'attachmentFilename'
	  }).text(fileNameNoExt);
	}
	
	/**
	 * @param {File} file
	 * @param {String} file.id
	 * @returns {*|jQuery}
	 */
	function getDownloadButton() {
	  return $('<span/>', {
	    "title": l10n.map.encrypt_download_file_button,
	    "class": 'glyphicon glyphicon-save saveAttachment'
	  });
	}
	
	/**
	 * @param {Function} onRemove
	 * @returns {*|jQuery}
	 */
	function getRemoveButton(onRemove) {
	  return $('<span/>', {
	    "title": l10n.map.editor_remove_upload,
	    "class": 'glyphicon glyphicon-remove removeAttachment'
	  }).on("click", function (e) {
	    e.preventDefault();
	    if (onRemove) {
	      onRemove();
	    }
	    $(this).parent().remove();
	  });
	}
	
	/**
	 * @param {File} file
	 * @param {String} file.name
	 * @param {String} file.id
	 * @returns {*|jQuery}
	 */
	function getExtensionIcon(file) {
	  var fileExt = _mvelo2.default.util.extractFileExtension(file.name);
	  if (!fileExt) {
	    return '';
	  }
	  var extClass = _mvelo2.default.util.getExtensionClass(fileExt);
	
	  return $('<span/>', {
	    "class": 'attachmentExtension ' + extClass
	  }).text(fileExt);
	}
	
	/**
	 * @returns {*|jQuery|HTMLElement}
	 */
	function getSecureIcon() {
	  return $('<span/>', {
	    'class': 'glyphicon glyphicon-lock secure-icon'
	  });
	}
	
	/**
	 * @param {File} file
	 * @param {String} file.content
	 * @param {String} file.type
	 * @returns {string}
	 */
	function downloadAttachment(file) {
	  var content = _mvelo2.default.util.str2ab(file.content);
	  var blob = new Blob([content], { type: file.type });
	
	  return window.URL.createObjectURL(blob);
	}
	
	/**
	 * @returns {Object}
	 */
	function getFiles($fileList) {
	  var files = [];
	  $fileList.find('.attachmentButton').each(function () {
	    files.push($(this).data('file'));
	  });
	  return files;
	}

/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgMzg2YmViMTc1MDBhMDJkOWI5NzUiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvZWRpdG9yL2VkaXRvci5qcyIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJSZWFjdFwiIiwid2VicGFjazovLy9leHRlcm5hbCBcIlJlYWN0RE9NXCIiLCJ3ZWJwYWNrOi8vLy4vc3JjL212ZWxvLmpzIiwid2VicGFjazovLy8uL3NyYy9jb21wb25lbnRzL2VkaXRvci9jb21wb25lbnRzL0VkaXRvckZvb3Rlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvbGliL2wxMG4uanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvZWRpdG9yL2NvbXBvbmVudHMvRWRpdG9yTW9kYWxGb290ZXIuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xpYi9maWxlLmpzIl0sIm5hbWVzIjpbIkVkaXRvckN0cmwiLCJsMTBuIiwiZmlsZUxpYiIsImFuZ3VsYXIiLCJtb2R1bGUiLCJjb25maWciLCJ0YWdzSW5wdXRDb25maWdQcm92aWRlciIsInNldEFjdGl2ZUludGVycG9sYXRpb24iLCJwbGFjZWhvbGRlciIsImNvbnRyb2xsZXIiLCIkdGltZW91dCIsIl90aW1lb3V0Iiwic2V0R2xvYmFsIiwiY2hlY2tFbnZpcm9ubWVudCIsInJlZ2lzdGVyRXZlbnRMaXN0ZW5lcnMiLCJpbml0Q29tcGxldGUiLCJwcm90b3R5cGUiLCJPYmplY3QiLCJjcmVhdGUiLCJFdmVudEhhbmRsZXIiLCJxcyIsIiQiLCJwYXJzZVF1ZXJ5c3RyaW5nIiwiZW1iZWRkZWQiLCJfaWQiLCJpZCIsIl9uYW1lIiwidmVyaWZ5IiwicmVjaXBpZW50IiwiZW1haWwiLCJkaXNwbGF5SWQiLCJrZXkiLCJnZXRLZXkiLCJjaGVja2VkU2VydmVyIiwidG9mdSIsImNvbG9yVGFnIiwiY2hlY2tFbmNyeXB0U3RhdHVzIiwibG9va3VwS2V5T25TZXJ2ZXIiLCJrZXlzIiwiZmluZCIsInRvTG93ZXJDYXNlIiwiZW1pdCIsInNlbmRlciIsIl9vbktleVNlcnZlclJlc3BvbnNlIiwib3B0aW9ucyIsInJlY2lwaWVudHMiLCJmb3JFYWNoIiwiYmluZCIsImVhY2giLCJ0ZXh0IiwiaW5kZXhPZiIsImFkZENsYXNzIiwibm9FbmNyeXB0Iiwic29tZSIsInIiLCJyZW5kZXJNb2RhbEZvb3RlciIsImVuY3J5cHREaXNhYmxlZCIsImxlbmd0aCIsImF1dG9jb21wbGV0ZSIsInF1ZXJ5IiwiY2FjaGUiLCJtYXAiLCJ1c2VyaWQiLCJrZXlpZCIsInRvVXBwZXJDYXNlIiwidGhhdCIsImZpbHRlciIsImkiLCJvbiIsIl9zZXRSZWNpcGllbnRzIiwiX29uU2V0VGV4dCIsIl9vblNldEluaXREYXRhIiwiX29uU2V0QXR0YWNobWVudCIsIl9zaG93V2FpdGluZ01vZGFsIiwiX2hpZGVXYWl0aW5nTW9kYWwiLCJfZGVjcnlwdEZhaWxlZCIsIl9vblNob3dQd2REaWFsb2ciLCJfaGlkZVB3ZERpYWxvZyIsIl9nZXRQbGFpbnRleHQiLCJfb25FcnJvck1lc3NhZ2UiLCJfcG9ydCIsIm9uTWVzc2FnZSIsImFkZExpc3RlbmVyIiwiaGFuZGxlUG9ydE1lc3NhZ2UiLCJnZXRSZWNpcGllbnRLZXlzIiwib3BlblNlY3VyaXR5U2V0dGluZ3MiLCJzZW5kUGxhaW5UZXh0IiwiYWN0aW9uIiwibWVzc2FnZSIsImdldEVkaXRvclRleHQiLCJhdHRhY2htZW50cyIsImdldEF0dGFjaG1lbnRzIiwic2lnbk1zZyIsIm1vZGFsRm9vdGVyUHJvcHMiLCJzaWduS2V5IiwibG9nVXNlcklucHV0IiwidHlwZSIsInNvdXJjZSIsImVuY3J5cHQiLCJzaWduIiwic2lnbktleUlkIiwiY2FuY2VsIiwiZWRpdG9yIiwidmFsIiwiZ2V0RmlsZXMiLCJtc2ciLCJvblNldFRleHQiLCJtb2RhbCIsImtleWJvYXJkIiwiZGF0YSIsInNldFNpZ25Nb2RlIiwic2V0QXR0YWNobWVudCIsImF0dGFjaG1lbnQiLCJlcnJvciIsInRpdGxlIiwid2FpdGluZ19kaWFsb2dfZGVjcnlwdGlvbl9mYWlsZWQiLCJjbGFzcyIsInNob3dFcnJvck1vZGFsIiwiX3JlbW92ZURpYWxvZyIsImFkZFB3ZERpYWxvZyIsIm51bVVwbG9hZHNJblByb2dyZXNzIiwiZGVsYXllZEFjdGlvbiIsIl9zZWxmIiwiY29kZSIsImdsb2JhbCIsInBvcnQiLCJuYW1lIiwiZWRpdG9yX3R5cGUiLCJibHVyV2FybiIsImJsdXJXYXJuUGVyaW9kIiwiYmx1clZhbGlkIiwiaW5pdFRleHQiLCJiYXNlUGF0aCIsImxvZ1RleHRhcmVhSW5wdXQiLCJtb2RhbEJvZHlCb3R0b21Qb3NpdGlvbiIsImZvb3RlclByb3BzIiwib25DbGlja1VwbG9hZCIsIm9uQ2hhbmdlRmlsZUlucHV0Iiwib25BZGRBdHRhY2htZW50Iiwib25DbGlja0ZpbGVFbmNyeXB0aW9uIiwiZnJhZ21lbnQiLCJleHBhbmRlZCIsIm9uQ2FuY2VsIiwib25TaWduT25seSIsIm9uRW5jcnlwdCIsIm9uRXhwYW5kIiwiYW5pbWF0ZSIsImJvdHRvbSIsIm9uQ29sbGFwc2UiLCJvbkNoYW5nZVNpZ25Nc2ciLCJ2YWx1ZSIsInJlbmRlckZvb3RlciIsIm9uQ2hhbmdlU2lnbktleSIsIm9uQ2xpY2tTaWduU2V0dGluZyIsInJlZ2lzdGVyIiwibWFwVG9Mb2NhbCIsInRoZW4iLCJtYXhGaWxlVXBsb2FkU2l6ZSIsIk1BWEZJTEVVUExPQURTSVpFIiwibWF4RmlsZVVwbG9hZFNpemVDaHJvbWUiLCJNQVhGSUxFVVBMT0FEU0laRUNIUk9NRSIsIm1vY2siLCJlbGVtZW50IiwiZG9jdW1lbnQiLCJyZWFkeSIsImluaXQiLCJib2R5IiwiZGF0YXNldCIsIm12ZWxvIiwialF1ZXJ5IiwicXVvdGEiLCJwYXJzZUludCIsImNyeCIsIlBMQUlOX1RFWFQiLCJleHRlbnNpb24iLCJjb25uZWN0IiwibG9hZFRlbXBsYXRlcyIsIkJvb2xlYW4iLCJ0ZW1wbGF0ZXNMb2FkZWQiLCJmZmEiLCJfZGF0YVBhdGgiLCJjYWxsYmFjayIsIiRib2R5IiwiYXR0ciIsIlByb21pc2UiLCJhbGwiLCJhcHBlbmRUcGwiLCJnZXRVUkwiLCJwcm9wcyIsImFzc2lnbiIsInJlbmRlciIsImNyZWF0ZUVsZW1lbnQiLCJnZXQiLCJmb2N1cyIsInByb3AiLCJ3aW5kb3ciLCJzdGFydEJsdXJWYWxpZCIsImNyZWF0ZVBsYWluVGV4dCIsInNldFRleHQiLCJsb2NhbGl6ZUhUTUwiLCJ1dGlsIiwic2hvd1NlY3VyaXR5QmFja2dyb3VuZCIsImJvb3RzdHJhcCIsImNzcyIsImFkZEF0dGFjaG1lbnQiLCJmaWxlIiwiaXNPdmVyc2l6ZSIsIkVycm9yIiwicmVhZFVwbG9hZEZpbGUiLCJhZnRlckxvYWRFbmQiLCJyZXNwb25zZSIsIiRmaWxlRWxlbWVudCIsImNyZWF0ZUZpbGVFbGVtZW50IiwicmVtb3ZlQnV0dG9uIiwib25SZW1vdmUiLCJvblJlbW92ZUF0dGFjaG1lbnQiLCIkdXBsb2FkUGFuZWwiLCJ1cGxvYWRQYW5lbEhlaWdodCIsInNjcm9sbEhlaWdodCIsImFwcGVuZCIsInNjcm9sbFRvcCIsImNhdGNoIiwiY29uc29sZSIsImxvZyIsImJ1ZmZlciIsInN0cjJhYiIsImNvbnRlbnQiLCJibG9iIiwiQmxvYiIsIm1pbWVUeXBlIiwiRmlsZSIsImZpbGVuYW1lIiwiZXZ0IiwiZmlsZXMiLCJ0YXJnZXQiLCJudW1GaWxlcyIsImZpbGVTaXplQWxsIiwic2l6ZSIsImN1cnJlbnRBdHRhY2htZW50c1NpemUiLCJnZXRGaWxlU2l6ZSIsInVwbG9hZF9xdW90YV93YXJuaW5nX2hlYWRsaW5lIiwidXBsb2FkX3F1b3RhX2V4Y2VlZGVkX3dhcm5pbmciLCJNYXRoIiwiZmxvb3IiLCJzYW5kYm94IiwiZnJhbWVCb3JkZXIiLCJyb3dzIiwic3R5bGUiLCJyZWwiLCJocmVmIiwic3R5bGUyIiwibWV0YSIsImNoYXJzZXQiLCJvbmUiLCJjb250ZW50cyIsInN0YXJ0Qmx1cldhcm5JbnRlcnZhbCIsInNldFRpbWVvdXQiLCJvbkJsdXIiLCJ0ZXh0RWxlbWVudCIsInNlbGVjdGlvblN0YXJ0Iiwic2VsZWN0aW9uRW5kIiwic2V0UGxhaW5UZXh0Iiwic2hvd0JsdXJXYXJuaW5nIiwicmVtb3ZlQ2xhc3MiLCJzdG9wIiwib3BhY2l0eSIsImNsZWFyVGltZW91dCIsInB3ZCIsInNyYyIsImZhZGVPdXQiLCJyZW1vdmUiLCJzaG93IiwiZWRpdG9yX2Vycm9yX2hlYWRlciIsIiRlcnJvck1vZGFsIiwiZW1wdHkiLCJwcmltYXJ5IiwicHJpdktleXMiLCJwcmltYXJ5S2V5IiwiY2hyb21lIiwic2VsZiIsIkxBUkdFX0ZSQU1FIiwiRlJBTUVfU1RBVFVTIiwiRlJBTUVfQVRUQUNIRUQiLCJGUkFNRV9ERVRBQ0hFRCIsIkZSQU1FX09CSiIsIkRZTl9JRlJBTUUiLCJJRlJBTUVfT0JKIiwiUEdQX01FU1NBR0UiLCJQR1BfU0lHTkFUVVJFIiwiUEdQX1BVQkxJQ19LRVkiLCJQR1BfUFJJVkFURV9LRVkiLCJESVNQTEFZX0lOTElORSIsIkRJU1BMQVlfUE9QVVAiLCJSSUNIX1RFWFQiLCJLRVlSSU5HX0RFTElNSVRFUiIsIkxPQ0FMX0tFWVJJTkdfSUQiLCJTRUNVUkVfQ09MT1JTIiwiJGVsZW1lbnQiLCJwYXRoIiwidGVzdCIsImxvY2F0aW9uIiwicHJvdG9jb2wiLCJyZXNvbHZlIiwibG9hZCIsInJlc3VsdCIsInBhcnNlSFRNTCIsInJlamVjdCIsInJlcSIsIlhNTEh0dHBSZXF1ZXN0Iiwib3BlbiIsInJlc3BvbnNlVHlwZSIsIm9ubG9hZCIsInN0YXR1cyIsInN0YXR1c1RleHQiLCJvbmVycm9yIiwic2VuZCIsInJ1bnRpbWUiLCJvYmoiLCJfY29ubmVjdCIsImV2ZW50cyIsInBvc3RNZXNzYWdlIiwiZGlzY29ubmVjdCIsIm9uRGlzY29ubmVjdCIsImFkZERpc2Nvbm5lY3RMaXN0ZW5lciIsImFkZEV2ZW50TGlzdGVuZXIiLCJnZXRNZXNzYWdlcyIsImlkcyIsImkxOG4iLCJnZXRNZXNzYWdlIiwiaWRTZWxlY3RvciIsInNlbGVjdG9yIiwianFFbGVtZW50Iiwic29ydEFuZERlRHVwIiwidW5vcmRlcmVkIiwiY29tcEZuIiwic29ydGVkIiwic29ydCIsInB1c2giLCJkZUR1cCIsImxpc3QiLCJnZXRIYXNoIiwiYnVmIiwiVWludDE2QXJyYXkiLCJjcnlwdG8iLCJnZXRSYW5kb21WYWx1ZXMiLCJnZXRET01XaW5kb3ciLCJ0b1N0cmluZyIsImVuY29kZUhUTUwiLCJTdHJpbmciLCJyZXBsYWNlIiwiZGVjb2RlSFRNTCIsImh0bWwiLCJkZWNvZGVRdW90ZWRQcmludCIsImFybW9yZWQiLCJ0ZXh0Mmh0bWwiLCJodG1sMnRleHQiLCJieXRlQ291bnQiLCJzdHIiLCJlbmNvZGVVUkkiLCJzcGxpdCIsImFiMnN0ciIsImFiIiwiVWludDhBcnJheSIsIkNIVU5LX1NJWkUiLCJwb3ciLCJvZmZzZXQiLCJsZW4iLCJzdWJhYiIsIm1pbiIsInN1YmFycmF5IiwiZnJvbUNoYXJDb2RlIiwiYXBwbHkiLCJidWZWaWV3IiwiY2hhckNvZGVBdCIsImdldEV4dGVuc2lvbkNsYXNzIiwiZmlsZUV4dCIsImV4dENsYXNzIiwiZXh0cmFjdEZpbGVOYW1lV2l0aG91dEV4dCIsImZpbGVOYW1lIiwiaW5kZXhPZkRvdCIsImxhc3RJbmRleE9mIiwic3Vic3RyaW5nIiwiZXh0cmFjdEZpbGVFeHRlbnNpb24iLCJsYXN0aW5kZXhEb3QiLCJ0cmltIiwiZXh0ZW5kIiwic291cmNlcyIsInNsaWNlIiwiY2FsbCIsImFyZ3VtZW50cyIsImdldE93blByb3BlcnR5TmFtZXMiLCJwcm9wTmFtZSIsImRlZmluZVByb3BlcnR5IiwiZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIiwiYWRkTG9hZGluZ0FuaW1hdGlvbiIsIiRwYXJlbnQiLCJzcGlubmVyIiwiYXBwZW5kVG8iLCJzaG93TG9hZGluZ0FuaW1hdGlvbiIsImhpZGVMb2FkaW5nQW5pbWF0aW9uIiwiaGlkZSIsImdlbmVyYXRlU2VjdXJpdHlCYWNrZ3JvdW5kIiwiYW5nbGUiLCJzY2FsaW5nIiwiY29sb3JpbmciLCJzZWN1cml0eSIsInNlY0JnbmQiLCJpY29uV2lkdGgiLCJ3aWR0aCIsImljb25IZWlnaHQiLCJoZWlnaHQiLCJpY29uQW5nbGUiLCJpY29uQ29sb3IiLCJjb2xvcklkIiwiaXNFbWJlZGRlZCIsInNlbmRNZXNzYWdlIiwiZXZlbnQiLCJiYWNrZ3JvdW5kIiwic2VjQmduZEljb24iLCJzZWN1cmVTdHlsZSIsImNvbG9yIiwiYnRvYSIsImxvY2tJY29uIiwibG9ja0J1dHRvbiIsInNlY0JnbmRTdHlsZSIsImdldEVsZW1lbnRCeUlkIiwicGFyZW50Tm9kZSIsInJlbW92ZUNoaWxkIiwibWF0Y2hQYXR0ZXJuMlJlZ0V4IiwibWF0Y2hQYXR0ZXJuIiwiUmVnRXhwIiwibWFwRXJyb3IiLCJ0aHJvd0Vycm9yIiwiUHJvbWlzZVF1ZXVlIiwicXVldWUiLCJ0aGlzQXJnIiwibWV0aG9kIiwiYXJncyIsIl9uZXh0IiwibmV4dEVudHJ5Iiwic2hpZnQiLCJzZXF1ZW50aWFsIiwicHJvY2VzcyIsInJlZHVjZSIsImFjYyIsIml0ZW0iLCJwcm9jZXNzUmVzdWx0IiwiY2hlY2tFbWFpbCIsImFkZHJlc3MiLCJwYXR0ZXJuIiwiX2hhbmRsZXJzIiwiaGFzIiwiaGFuZGxlciIsIk1hcCIsInNldCIsIl9zZW5kZXJJZCIsInBvcnRzIiwibWFpblR5cGUiLCJleHBvcnRzIiwiRWRpdG9yRm9vdGVyIiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJoYW5kbGVDbGlja1VwbG9hZCIsImNvbXBvbmVudERpZE1vdW50IiwiaW5pdFRvb2x0aXAiLCJjb21wb25lbnREaWRVcGRhdGUiLCJzaWduQ2FwdGlvbiIsInRvb2x0aXAiLCJjbGljayIsInNpZ25fY2FwdGlvbl9zaG9ydCIsImVkaXRvcl9zaWduX2NhcHRpb25fc2hvcnQiLCJlZGl0b3Jfbm9fcHJpbWFyeV9rZXlfY2FwdGlvbl9zaG9ydCIsInNpZ25fY2FwdGlvbl9sb25nIiwiZWRpdG9yX3NpZ25fY2FwdGlvbl9sb25nIiwiZWRpdG9yX25vX3ByaW1hcnlfa2V5X2NhcHRpb25fbG9uZyIsInVwbG9hZF9hdHRhY2htZW50IiwiZSIsInByZXZlbnREZWZhdWx0IiwiZWRpdG9yX2xpbmtfZmlsZV9lbmNyeXB0aW9uIiwibm9kZSIsInByb3BUeXBlcyIsIlByb3BUeXBlcyIsImJvb2wiLCJmdW5jIiwibG9jYWxpemVkIiwiRWRpdG9yTW9kYWxGb290ZXIiLCJzaWduU2VsZWN0aW9uIiwiY2hlY2tlZCIsInNpZ25fZGlhbG9nX2hlYWRlciIsInVzZXJJZCIsImdlbmVyYWxfcHJpbWFyeV9rZXlfYXV0b19zaWduIiwib3B0aW9uc19ob21lIiwiZWRpdG9yX3NpZ25fYnV0dG9uIiwiZm9ybV9jYW5jZWwiLCJlZGl0b3JfZW5jcnlwdF9idXR0b24iLCJzdHJpbmciLCJhcnJheSIsImNyZWF0ZUZpbGVEb3dubG9hZEVsZW1lbnQiLCIkZmlsZUxpc3QiLCJvbkxvYWRFbmQiLCJmaWxlUmVhZGVyIiwiRmlsZVJlYWRlciIsIm9ubG9hZGVuZCIsIm9uYWJvcnQiLCJyZWFkQXNEYXRhVVJMIiwiJGJ1dHRvbiIsImdldEV4dGVuc2lvbkljb24iLCJnZXRGaWxlTmFtZSIsInNlY3VyZUljb24iLCJnZXRTZWN1cmVJY29uIiwiZ2V0UmVtb3ZlQnV0dG9uIiwiZG93bmxvYWRBdHRhY2htZW50IiwiZ2V0RG93bmxvYWRCdXR0b24iLCJmaWxlTmFtZU5vRXh0IiwiZW5jcnlwdF9kb3dubG9hZF9maWxlX2J1dHRvbiIsImVkaXRvcl9yZW1vdmVfdXBsb2FkIiwicGFyZW50IiwiVVJMIiwiY3JlYXRlT2JqZWN0VVJMIl0sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQWU7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7Ozs7Ozs7Ozs7O21CQ2F3QkEsVTs7QUF0QnhCOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7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IFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGV4cG9ydHM6IHt9LFxuIFx0XHRcdGlkOiBtb2R1bGVJZCxcbiBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gd2VicGFjay9ib290c3RyYXAgMzg2YmViMTc1MDBhMDJkOWI5NzUiLCIvKipcbiAqIE1haWx2ZWxvcGUgLSBzZWN1cmUgZW1haWwgd2l0aCBPcGVuUEdQIGVuY3J5cHRpb24gZm9yIFdlYm1haWxcbiAqIENvcHlyaWdodCAoQykgMjAxMi0yMDE1IE1haWx2ZWxvcGUgR21iSFxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBBZmZlcm8gR2VuZXJhbCBQdWJsaWMgTGljZW5zZSB2ZXJzaW9uIDNcbiAqIGFzIHB1Ymxpc2hlZCBieSB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBBZmZlcm8gR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBBZmZlcm8gR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKi9cblxuLyoqXG4gKiBQYXJ0cyBvZiB0aGUgZWRpdG9yIGFyZSBiYXNlZCBvbiBIb29kaWVjcm93IChNSVQgTGljZW5zZSlcbiAqIENvcHlyaWdodCAoYykgMjAxNCBXaGl0ZW91dCBOZXR3b3JrcyBHbWJILlxuICogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS90YW54L2hvb2RpZWNyb3cvYmxvYi9tYXN0ZXIvTElDRU5TRVxuICovXG5cbi8qKlxuICogQGZpbGVPdmVydmlldyBUaGlzIGZpbGUgaW1wbGVtZW50cyB0aGUgaW50ZXJmYWNlIGZvciBlbmNyeXB0aW5nIGFuZFxuICogc2lnbmluZyB1c2VyIGRhdGEgaW4gYW4gc2FuZGJveGVkIGVudmlyb25tZW50IHRoYXQgaXMgc2VjdXJlZCBmcm9tXG4gKiB0aGUgd2VibWFpbCBpbnRlcmZhY2UuXG4gKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBSZWFjdERPTSBmcm9tICdyZWFjdC1kb20nO1xuaW1wb3J0IG12ZWxvIGZyb20gJy4uLy4uL212ZWxvJztcbmltcG9ydCBFZGl0b3JGb290ZXIgZnJvbSAnLi9jb21wb25lbnRzL0VkaXRvckZvb3Rlcic7XG5pbXBvcnQgRWRpdG9yTW9kYWxGb290ZXIgZnJvbSAnLi9jb21wb25lbnRzL0VkaXRvck1vZGFsRm9vdGVyJztcbmltcG9ydCAqIGFzIGwxMG4gZnJvbSAnLi4vLi4vbGliL2wxMG4nO1xuaW1wb3J0ICogYXMgZmlsZUxpYiBmcm9tICcuLi8uLi9saWIvZmlsZSc7XG5cbid1c2Ugc3RyaWN0JztcblxuLyogZ2xvYmFsIGFuZ3VsYXIgKi9cblxuYW5ndWxhci5tb2R1bGUoJ2VkaXRvcicsIFsnbmdUYWdzSW5wdXQnXSkgLy8gbG9hZCBlZGl0b3IgbW9kdWxlIGRlcGVuZGVuY2llc1xuLmNvbmZpZyhmdW5jdGlvbih0YWdzSW5wdXRDb25maWdQcm92aWRlcikge1xuICAvLyBhY3RpdmF0ZSBtb25pdG9yaW5nIG9mIHBsYWNlaG9sZGVyIG9wdGlvblxuICB0YWdzSW5wdXRDb25maWdQcm92aWRlci5zZXRBY3RpdmVJbnRlcnBvbGF0aW9uKCd0YWdzSW5wdXQnLCB7IHBsYWNlaG9sZGVyOiB0cnVlIH0pO1xufSk7XG5hbmd1bGFyLm1vZHVsZSgnZWRpdG9yJykuY29udHJvbGxlcignRWRpdG9yQ3RybCcsIEVkaXRvckN0cmwpOyAvLyBhdHRhY2ggY3RybCB0byBlZGl0b3IgbW9kdWxlXG5cbi8qKlxuICogQW5ndWxhciBjb250cm9sbGVyIGZvciB0aGUgZWRpdG9yIFVJLlxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBFZGl0b3JDdHJsKCR0aW1lb3V0KSB7XG4gIHRoaXMuX3RpbWVvdXQgPSAkdGltZW91dDtcblxuICB0aGlzLnNldEdsb2JhbCh0aGlzKTsgLy8gc2hhcmUgJ3RoaXMnIGFzICdfc2VsZicgaW4gbGVnYWN5IGNsb3N1cmUgY29kZVxuICB0aGlzLmNoZWNrRW52aXJvbm1lbnQoKTsgLy8gZ2V0IGVudmlyb25tZW50IHZhcnNcbiAgdGhpcy5yZWdpc3RlckV2ZW50TGlzdGVuZXJzKCk7IC8vIGxpc3RlbiB0byBpbmNvbWluZyBldmVudHNcbiAgdGhpcy5pbml0Q29tcGxldGUoKTsgLy8gZW1pdCBldmVudCB0byBiYWNrZW5kIHRoYXQgZWRpdG9yIGhhcyBpbml0aWFsaXplZFxufVxuXG5FZGl0b3JDdHJsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUobXZlbG8uRXZlbnRIYW5kbGVyLnByb3RvdHlwZSk7IC8vIGFkZCBldmVudCBhcGlcblxuLyoqXG4gKiBSZWFkcyB0aGUgdXJscyBxdWVyeSBzdHJpbmcgdG8gZ2V0IGVudmlyb25tZW50IGNvbnRleHRcbiAqL1xuRWRpdG9yQ3RybC5wcm90b3R5cGUuY2hlY2tFbnZpcm9ubWVudCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcXMgPSAkLnBhcnNlUXVlcnlzdHJpbmcoKTtcbiAgdGhpcy5lbWJlZGRlZCA9IHFzLmVtYmVkZGVkO1xuICB0aGlzLl9pZCA9IHFzLmlkO1xuICB0aGlzLl9uYW1lID0gJ2VkaXRvci0nICsgdGhpcy5faWQ7XG59O1xuXG4vKipcbiAqIFZlcmlmaWVzIGEgcmVjaXBpZW50IGFmdGVyIGlucHV0LCBnZXRzIHRoZWlyIGtleSwgY29sb3JzIHRoZVxuICogaW5wdXQgdGFnIGFjY29yZGluZ2x5IGFuZCBjaGVja3MgaWYgZW5jcnlwdGlvbiBpcyBwb3NzaWJsZS5cbiAqIEBwYXJhbSAge09iamVjdH0gcmVjaXBpZW50ICAgVGhlIHJlY2lwaWVudCBvYmplY3RcbiAqL1xuRWRpdG9yQ3RybC5wcm90b3R5cGUudmVyaWZ5ID0gZnVuY3Rpb24ocmVjaXBpZW50KSB7XG4gIGlmICghcmVjaXBpZW50KSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChyZWNpcGllbnQuZW1haWwpIHtcbiAgICAvLyBkaXNwbGF5IG9ubHkgYWRkcmVzcyBmcm9tIGF1dG9jb21wbGV0ZVxuICAgIHJlY2lwaWVudC5kaXNwbGF5SWQgPSByZWNpcGllbnQuZW1haWw7XG4gIH0gZWxzZSB7XG4gICAgLy8gc2V0IGFkZHJlc3MgYWZ0ZXIgbWFudWFsIGlucHV0XG4gICAgcmVjaXBpZW50LmVtYWlsID0gcmVjaXBpZW50LmRpc3BsYXlJZDtcbiAgfVxuICAvLyBsb29rdXAga2V5IGluIGxvY2FsIGNhY2hlXG4gIHJlY2lwaWVudC5rZXkgPSB0aGlzLmdldEtleShyZWNpcGllbnQpO1xuICBpZiAocmVjaXBpZW50LmtleSB8fCByZWNpcGllbnQuY2hlY2tlZFNlcnZlciB8fCAhdGhpcy50b2Z1KSB7XG4gICAgLy8gY29sb3IgdGFnIG9ubHkgaWYgYSBsb2NhbCBrZXkgd2FzIGZvdW5kLCBvciBhZnRlciBzZXJ2ZXIgbG9va3VwLFxuICAgIC8vIG9yIGlmIFRPRlUgKFRydXN0IG9uIEZpcnN0IFVzZSkgaXMgZGVhY3RpdmF0ZWRcbiAgICB0aGlzLmNvbG9yVGFnKHJlY2lwaWVudCk7XG4gICAgdGhpcy5jaGVja0VuY3J5cHRTdGF0dXMoKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBubyBsb2NhbCBrZXkgZm91bmQgLi4uIGxvb2t1cCBvbiB0aGUgc2VydmVyXG4gICAgdGhpcy5sb29rdXBLZXlPblNlcnZlcihyZWNpcGllbnQpO1xuICB9XG59O1xuXG4vKipcbiAqIEZpbmRzIHRoZSByZWNpcGllbnQncyBjb3JyZXNwb25kaW5nIHB1YmxpYyBrZXkgYW5kIHNldHMgaXRcbiAqIG9uIHRoZSAna2V5JyBhdHRyaWJ1dGUgb24gdGhlIHJlY2lwaWVudCBvYmplY3QuXG4gKiBAcGFyYW0gIHtPYmplY3R9IHJlY2lwaWVudCAgIFRoZSByZWNpcGllbnQgb2JqZWN0XG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICAgICAgIFRoZSBrZXkgb2JqZWN0ICh1bmRlZmluZWQgaWYgbm9uZSBmb3VuZClcbiAqL1xuRWRpdG9yQ3RybC5wcm90b3R5cGUuZ2V0S2V5ID0gZnVuY3Rpb24ocmVjaXBpZW50KSB7XG4gIHJldHVybiAodGhpcy5rZXlzIHx8IFtdKS5maW5kKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmIChrZXkuZW1haWwgJiYgcmVjaXBpZW50LmVtYWlsKSB7XG4gICAgICByZXR1cm4ga2V5LmVtYWlsLnRvTG93ZXJDYXNlKCkgPT09IHJlY2lwaWVudC5lbWFpbC50b0xvd2VyQ2FzZSgpO1xuICAgIH1cbiAgfSk7XG59O1xuXG4vKipcbiAqIERvIFRPRlUgKHRydXN0IG9uIGZpcnN0IHVzZSkgbG9va3VwIG9uIHRoZSBNYWlsdmVsb3BlIEtleSBTZXJ2ZXJcbiAqIGlmIGEga2V5IHdhcyBub3QgZm91bmQgaW4gdGhlIGxvY2FsIGtleXJpbmcuXG4gKiBAcGFyYW0gIHtPYmplY3R9IHJlY2lwaWVudCAgIFRoZSByZWNpcGllbnQgb2JqZWN0XG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9XG4gKi9cbkVkaXRvckN0cmwucHJvdG90eXBlLmxvb2t1cEtleU9uU2VydmVyID0gZnVuY3Rpb24ocmVjaXBpZW50KSB7XG4gIHJlY2lwaWVudC5jaGVja2VkU2VydmVyID0gdHJ1ZTtcbiAgdGhpcy5lbWl0KCdrZXlzZXJ2ZXItbG9va3VwJywge1xuICAgIHNlbmRlcjogdGhpcy5fbmFtZSxcbiAgICByZWNpcGllbnQ6IHJlY2lwaWVudFxuICB9KTtcbn07XG5cbi8qKlxuICogRXZlbnQgdGhhdCBpcyB0cmlnZ2VyZWQgd2hlbiB0aGUga2V5IHNlcnZlciByZXNwb25kZWRcbiAqIEBwYXJhbSB7QXJyYXl9IG9wdGlvbnMua2V5cyAgIEEgbGlzdCBvZiBhbGwgYXZhaWxhYmxlIHB1YmxpY1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5cyBmcm9tIHRoZSBsb2NhbCBrZXljaGFpblxuICogQHJldHVybiB7dW5kZWZpbmVkfVxuICovXG5FZGl0b3JDdHJsLnByb3RvdHlwZS5fb25LZXlTZXJ2ZXJSZXNwb25zZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdGhpcy5fdGltZW91dChmdW5jdGlvbigpIHsgLy8gdHJpZ2dlciAkc2NvcGUuJGRpZ2VzdCgpIGFmdGVyIGFzeW5jIGNhbGxcbiAgICB0aGlzLmtleXMgPSBvcHRpb25zLmtleXM7XG4gICAgdGhpcy5yZWNpcGllbnRzLmZvckVhY2godGhpcy52ZXJpZnkuYmluZCh0aGlzKSk7XG4gIH0uYmluZCh0aGlzKSk7XG59O1xuXG4vKipcbiAqIFVzZXMgalF1ZXJ5IHRvIGNvbG9yIHRoZSByZWNpcGllbnQncyBpbnB1dCB0YWcgZGVwZW5kaW5nIG9uXG4gKiB3aGV0aGVyIHRoZXkgaGF2ZSBhIGtleSBvciBub3QuXG4gKiBAcGFyYW0gIHtPYmplY3R9IHJlY2lwaWVudCAgIFRoZSByZWNpcGllbnQgb2JqZWN0XG4gKi9cbkVkaXRvckN0cmwucHJvdG90eXBlLmNvbG9yVGFnID0gZnVuY3Rpb24ocmVjaXBpZW50KSB7XG4gIHRoaXMuX3RpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIHdhaXQgZm9yIGh0bWwgdGFnIHRvIGFwcGVhclxuICAgICQoJ3RhZ3MtaW5wdXQgbGkudGFnLWl0ZW0nKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCQodGhpcykudGV4dCgpLmluZGV4T2YocmVjaXBpZW50LmVtYWlsKSA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHJlY2lwaWVudC5rZXkpIHtcbiAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygndGFnLXN1Y2Nlc3MnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICQodGhpcykuYWRkQ2xhc3MoJ3RhZy1kYW5nZXInKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIENoZWNrcyBpZiBhbGwgcmVjaXBpZW50cyBoYXZlIGEgcHVibGljIGtleSBhbmQgcHJldmVudHMgZW5jcnlwdGlvblxuICogaWYgb25lIG9mIHRoZW0gZG9lcyBub3QgaGF2ZSBhIGtleS5cbiAqL1xuRWRpdG9yQ3RybC5wcm90b3R5cGUuY2hlY2tFbmNyeXB0U3RhdHVzID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMubm9FbmNyeXB0ID0gKHRoaXMucmVjaXBpZW50cyB8fCBbXSkuc29tZShmdW5jdGlvbihyKSB7IHJldHVybiAhci5rZXk7IH0pO1xuICAvLyB1cGRhdGUgZWRpdG9yIG1vZGFsIGZvb3RlclxuICByZW5kZXJNb2RhbEZvb3Rlcih7ZW5jcnlwdERpc2FibGVkOiB0aGlzLm5vRW5jcnlwdCB8fCAhdGhpcy5yZWNpcGllbnRzIHx8ICF0aGlzLnJlY2lwaWVudHMubGVuZ3RofSk7XG59O1xuXG4vKipcbiAqIFF1ZXJpZXMgdGhlIGxvY2FsIGNhY2hlIG9mIGtleSBvYmplY3RzIHRvIGZpbmQgYSBtYXRjaGluZyB1c2VyIElEXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHF1ZXJ5ICAgVGhlIGF1dG9jb21wbGV0ZSBxdWVyeVxuICogQHJldHVybiB7QXJyYXl9ICAgICAgICAgIEEgbGlzdCBvZiBmaWx0ZXJlZCBpdGVtcyB0aGF0IG1hdGNoIHRoZSBxdWVyeVxuICovXG5FZGl0b3JDdHJsLnByb3RvdHlwZS5hdXRvY29tcGxldGUgPSBmdW5jdGlvbihxdWVyeSkge1xuICB2YXIgY2FjaGUgPSAodGhpcy5rZXlzIHx8IFtdKS5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGVtYWlsOiBrZXkuZW1haWwsXG4gICAgICBkaXNwbGF5SWQ6IGtleS51c2VyaWQgKyAnIC0gJyArIGtleS5rZXlpZC50b1VwcGVyQ2FzZSgpXG4gICAgfTtcbiAgfSk7XG4gIC8vIGZpbHRlciBieSBkaXNwbGF5IElEIGFuZCBpZ25vcmUgZHVwbGljYXRlc1xuICB2YXIgdGhhdCA9IHRoaXM7XG4gIHJldHVybiBjYWNoZS5maWx0ZXIoZnVuY3Rpb24oaSkge1xuICAgIHJldHVybiBpLmRpc3BsYXlJZC50b0xvd2VyQ2FzZSgpLmluZGV4T2YocXVlcnkudG9Mb3dlckNhc2UoKSkgIT09IC0xICYmXG4gICAgICAhdGhhdC5yZWNpcGllbnRzLnNvbWUoZnVuY3Rpb24ocmVjaXBpZW50KSB7IHJldHVybiByZWNpcGllbnQuZW1haWwgPT09IGkuZW1haWw7IH0pO1xuICB9KTtcbn07XG5cblxuLy9cbi8vIEV2YW50IGhhbmRsaW5nIGZyb20gYmFja2dyb3VuZCBzY3JpcHRcbi8vXG5cblxuLyoqXG4gKiBSZWdpc3RlciB0aGUgZXZlbnQgaGFuZGxlcnMgZm9yIHRoZSBlZGl0b3IuXG4gKi9cbkVkaXRvckN0cmwucHJvdG90eXBlLnJlZ2lzdGVyRXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5vbigncHVibGljLWtleS11c2VyaWRzJywgdGhpcy5fc2V0UmVjaXBpZW50cyk7XG4gIHRoaXMub24oJ3NldC10ZXh0JywgdGhpcy5fb25TZXRUZXh0KTtcbiAgdGhpcy5vbignc2V0LWluaXQtZGF0YScsIHRoaXMuX29uU2V0SW5pdERhdGEpO1xuICB0aGlzLm9uKCdzZXQtYXR0YWNobWVudCcsIHRoaXMuX29uU2V0QXR0YWNobWVudCk7XG4gIHRoaXMub24oJ2RlY3J5cHQtaW4tcHJvZ3Jlc3MnLCB0aGlzLl9zaG93V2FpdGluZ01vZGFsKTtcbiAgdGhpcy5vbignZW5jcnlwdC1pbi1wcm9ncmVzcycsIHRoaXMuX3Nob3dXYWl0aW5nTW9kYWwpO1xuICB0aGlzLm9uKCdkZWNyeXB0LWVuZCcsIHRoaXMuX2hpZGVXYWl0aW5nTW9kYWwpO1xuICB0aGlzLm9uKCdlbmNyeXB0LWVuZCcsIHRoaXMuX2hpZGVXYWl0aW5nTW9kYWwpO1xuICB0aGlzLm9uKCdlbmNyeXB0LWZhaWxlZCcsIHRoaXMuX2hpZGVXYWl0aW5nTW9kYWwpO1xuICB0aGlzLm9uKCdkZWNyeXB0LWZhaWxlZCcsIHRoaXMuX2RlY3J5cHRGYWlsZWQpO1xuICB0aGlzLm9uKCdzaG93LXB3ZC1kaWFsb2cnLCB0aGlzLl9vblNob3dQd2REaWFsb2cpO1xuICB0aGlzLm9uKCdoaWRlLXB3ZC1kaWFsb2cnLCB0aGlzLl9oaWRlUHdkRGlhbG9nKTtcbiAgdGhpcy5vbignZ2V0LXBsYWludGV4dCcsIHRoaXMuX2dldFBsYWludGV4dCk7XG4gIHRoaXMub24oJ2Vycm9yLW1lc3NhZ2UnLCB0aGlzLl9vbkVycm9yTWVzc2FnZSk7XG4gIHRoaXMub24oJ2tleXNlcnZlci1yZXNwb25zZScsIHRoaXMuX29uS2V5U2VydmVyUmVzcG9uc2UpO1xuXG4gIHRoaXMuX3BvcnQub25NZXNzYWdlLmFkZExpc3RlbmVyKHRoaXMuaGFuZGxlUG9ydE1lc3NhZ2UuYmluZCh0aGlzKSk7XG59O1xuXG4vKipcbiAqIFJlbWVtYmVyIHRoZSBhdmFpbGFibGUgcHVibGljIGtleXMgZm9yIGxhdGVyIGFuZCBzZXQgdGhlXG4gKiByZWNpcGllbnRzIHByb3Bvc2FsIGdvdHRlbiBmcm9tIHRoZSB3ZWJtYWlsIHVpIHRvIHRoZSBlZGl0b3JcbiAqIEBwYXJhbSB7QXJyYXl9IG9wdGlvbnMua2V5cyAgICAgICAgIEEgbGlzdCBvZiBhbGwgYXZhaWxhYmxlIHB1YmxpY1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5cyBmcm9tIHRoZSBsb2NhbCBrZXljaGFpblxuICogQHBhcmFtIHtBcnJheX0gb3B0aW9ucy5yZWNpcGllbnRzICAgcmVjaXBpZW50cyBnYXRoZXIgZnJvbSB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdlYm1haWwgdWlcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy50b2Z1ICAgICAgIElmIHRoZSBlZGl0b3Igc2hvdWxkIHRvIFRPRlUga2V5IGxvb2t1cFxuICovXG5FZGl0b3JDdHJsLnByb3RvdHlwZS5fc2V0UmVjaXBpZW50cyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdGhpcy5fdGltZW91dChmdW5jdGlvbigpIHsgLy8gdHJpZ2dlciAkc2NvcGUuJGRpZ2VzdCgpIGFmdGVyIGFzeW5jIGNhbGxcbiAgICB0aGlzLnRvZnUgPSBvcHRpb25zLnRvZnU7XG4gICAgdGhpcy5rZXlzID0gb3B0aW9ucy5rZXlzO1xuICAgIHRoaXMucmVjaXBpZW50cyA9IG9wdGlvbnMucmVjaXBpZW50cztcbiAgICB0aGlzLnJlY2lwaWVudHMuZm9yRWFjaCh0aGlzLnZlcmlmeS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmNoZWNrRW5jcnlwdFN0YXR1cygpO1xuICB9LmJpbmQodGhpcykpO1xufTtcblxuLyoqXG4gKiBNYXRjaGVzIHRoZSByZWNpcGllbnRzIGZyb20gdGhlIGlucHV0IHRvIHRoZWlyIHB1YmxpYyBrZXlzXG4gKiBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiBrZXlzLiBJZiBhIHJlY2lwaWVudCBkb2VzIG5vdCBoYXZlIGEga2V5XG4gKiBzdGlsbCByZXR1cm4gdGhlaXIgYWRkcmVzcy5cbiAqIEByZXR1cm4ge0FycmF5fSAgIHRoZSBhcnJheSBvZiBwdWJsaWMga2V5IG9iamVjdHNcbiAqL1xuRWRpdG9yQ3RybC5wcm90b3R5cGUuZ2V0UmVjaXBpZW50S2V5cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gKHRoaXMucmVjaXBpZW50cyB8fCBbXSkubWFwKGZ1bmN0aW9uKHIpIHtcbiAgICByZXR1cm4gci5rZXkgfHwgcjsgLy8gc29tZSByZWNpcGllbnRzIGRvbid0IGhhdmUgYSBrZXksIHN0aWxsIHJldHVybiBhZGRyZXNzXG4gIH0pO1xufTtcblxuLyoqXG4gKiBFbWl0IGFuIGV2ZW50IHRvIHRoZSBiYWNrZ3JvdW5kIHNjcmlwdCB0aGF0IHRoZSBlZGl0b3IgaXMgZmluaXNoZWQgaW5pdGlhbGl6aW5nLlxuICogQ2FsbGVkIHdoZW4gdGhlIGFuZ3VsYXIgY29udHJvbGxlciBpcyBpbml0aWFsaXplZCAoYWZ0ZXIgdGVtcGxhdGVzIGhhdmUgbG9hZGVkKVxuICovXG5FZGl0b3JDdHJsLnByb3RvdHlwZS5pbml0Q29tcGxldGUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5lbWl0KCdlZGl0b3ItaW5pdCcsIHtzZW5kZXI6IHRoaXMuX25hbWV9KTtcbn07XG5cbi8qKlxuICogT3BlbnMgdGhlIHNlY3VyaXR5IHNldHRpbmdzIGlmIGluIGVtYmVkZGVkIG1vZGVcbiAqL1xuRWRpdG9yQ3RybC5wcm90b3R5cGUub3BlblNlY3VyaXR5U2V0dGluZ3MgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuZW1iZWRkZWQpIHtcbiAgICB0aGlzLmVtaXQoJ29wZW4tc2VjdXJpdHktc2V0dGluZ3MnLCB7c2VuZGVyOiB0aGlzLl9uYW1lfSk7XG4gIH1cbn07XG5cbi8qKlxuICogU2VuZCB0aGUgcGxhaW50ZXh0IGJvZHkgdG8gdGhlIGJhY2tncm91bmQgc2NyaXB0IGZvciBlaXRoZXIgc2lnbmluZyBvclxuICogZW5jcnlwdGlvbi5cbiAqIEBwYXJhbSAge1N0cmluZ30gYWN0aW9uICAgRWl0aGVyICdzaWduJyBvciAnZW5jcnlwdCdcbiAqL1xuRWRpdG9yQ3RybC5wcm90b3R5cGUuc2VuZFBsYWluVGV4dCA9IGZ1bmN0aW9uKGFjdGlvbikge1xuICB0aGlzLmVtaXQoJ2VkaXRvci1wbGFpbnRleHQnLCB7XG4gICAgc2VuZGVyOiB0aGlzLl9uYW1lLFxuICAgIG1lc3NhZ2U6IHRoaXMuZ2V0RWRpdG9yVGV4dCgpLFxuICAgIGtleXM6IHRoaXMuZ2V0UmVjaXBpZW50S2V5cygpLFxuICAgIGF0dGFjaG1lbnRzOiB0aGlzLmdldEF0dGFjaG1lbnRzKCksXG4gICAgYWN0aW9uOiBhY3Rpb24sXG4gICAgc2lnbk1zZzogbW9kYWxGb290ZXJQcm9wcy5zaWduTXNnLFxuICAgIHNpZ25LZXk6IG1vZGFsRm9vdGVyUHJvcHMuc2lnbktleS50b0xvd2VyQ2FzZSgpXG4gIH0pO1xufTtcblxuLyoqXG4gKiBzZW5kIGxvZyBlbnRyeSBmb3IgdGhlIGV4dGVuc2lvblxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGVcbiAqL1xuRWRpdG9yQ3RybC5wcm90b3R5cGUubG9nVXNlcklucHV0ID0gZnVuY3Rpb24odHlwZSkge1xuICB0aGlzLmVtaXQoJ2VkaXRvci11c2VyLWlucHV0Jywge1xuICAgIHNlbmRlcjogdGhpcy5fbmFtZSxcbiAgICBzb3VyY2U6ICdzZWN1cml0eV9sb2dfZWRpdG9yJyxcbiAgICB0eXBlOiB0eXBlXG4gIH0pO1xufTtcblxuLyoqXG4gKiBJcyBjYWxsZWQgd2hlbiB0aGUgdXNlciBjbGlja3MgdGhlIGVuY3J5cHQgYnV0dG9uLlxuICovXG5FZGl0b3JDdHJsLnByb3RvdHlwZS5lbmNyeXB0ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMubG9nVXNlcklucHV0KCdzZWN1cml0eV9sb2dfZGlhbG9nX2VuY3J5cHQnKTtcbiAgdGhpcy5zZW5kUGxhaW5UZXh0KCdlbmNyeXB0Jyk7XG59O1xuXG4vKipcbiAqIElzIGNhbGxlZCB3aGVuIHRoZSB1c2VyIGNsaWNrcyB0aGUgc2lnbiBidXR0b24uXG4gKi9cbkVkaXRvckN0cmwucHJvdG90eXBlLnNpZ24gPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5sb2dVc2VySW5wdXQoJ3NlY3VyaXR5X2xvZ19kaWFsb2dfc2lnbicpO1xuICB0aGlzLmVtaXQoJ3NpZ24tb25seScsIHtcbiAgICBzZW5kZXI6IHRoaXMuX25hbWUsXG4gICAgc2lnbktleUlkOiBtb2RhbEZvb3RlclByb3BzLnNpZ25LZXkudG9Mb3dlckNhc2UoKVxuICB9KTtcbn07XG5cbi8qKlxuICogSXMgY2FsbGVkIHdoZW4gdGhlIHVzZXIgY2xpY2tzIHRoZSBjYW5jZWwgYnV0dG9uLlxuICovXG5FZGl0b3JDdHJsLnByb3RvdHlwZS5jYW5jZWwgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5sb2dVc2VySW5wdXQoJ3NlY3VyaXR5X2xvZ19kaWFsb2dfY2FuY2VsJyk7XG4gIHRoaXMuZW1pdCgnZWRpdG9yLWNhbmNlbCcsIHtcbiAgICBzZW5kZXI6IHRoaXMuX25hbWVcbiAgfSk7XG59O1xuXG4vL1xuLy8gTGVnYWN5IGNvZGVcbi8vXG5cbkVkaXRvckN0cmwucHJvdG90eXBlLmdldEVkaXRvclRleHQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGVkaXRvci52YWwoKTtcbn07XG5cbkVkaXRvckN0cmwucHJvdG90eXBlLmdldEF0dGFjaG1lbnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBmaWxlTGliLmdldEZpbGVzKCQoJyN1cGxvYWRQYW5lbCcpKTtcbn07XG5cbkVkaXRvckN0cmwucHJvdG90eXBlLl9vblNldFRleHQgPSBmdW5jdGlvbihtc2cpIHtcbiAgb25TZXRUZXh0KG1zZyk7XG59O1xuXG5FZGl0b3JDdHJsLnByb3RvdHlwZS5fc2hvd1dhaXRpbmdNb2RhbCA9IGZ1bmN0aW9uKCkge1xuICAkKCcjd2FpdGluZ01vZGFsJykubW9kYWwoe2tleWJvYXJkOiBmYWxzZX0pLm1vZGFsKCdzaG93Jyk7XG59O1xuXG5FZGl0b3JDdHJsLnByb3RvdHlwZS5faGlkZVdhaXRpbmdNb2RhbCA9IGZ1bmN0aW9uKCkge1xuICAkKCcjd2FpdGluZ01vZGFsJykubW9kYWwoJ2hpZGUnKTtcbn07XG5cbkVkaXRvckN0cmwucHJvdG90eXBlLl9vblNldEluaXREYXRhID0gZnVuY3Rpb24oe2RhdGF9KSB7XG4gIG9uU2V0VGV4dChkYXRhKTtcbiAgc2V0U2lnbk1vZGUoZGF0YSk7XG59O1xuXG5FZGl0b3JDdHJsLnByb3RvdHlwZS5fb25TZXRBdHRhY2htZW50ID0gZnVuY3Rpb24obXNnKSB7XG4gIHNldEF0dGFjaG1lbnQobXNnLmF0dGFjaG1lbnQpO1xufTtcblxuRWRpdG9yQ3RybC5wcm90b3R5cGUuX2RlY3J5cHRGYWlsZWQgPSBmdW5jdGlvbihtc2cpIHtcbiAgdmFyIGVycm9yID0ge1xuICAgIHRpdGxlOiBsMTBuLm1hcC53YWl0aW5nX2RpYWxvZ19kZWNyeXB0aW9uX2ZhaWxlZCxcbiAgICBtZXNzYWdlOiAobXNnLmVycm9yKSA/IG1zZy5lcnJvci5tZXNzYWdlIDogbDEwbi5tYXAud2FpdGluZ19kaWFsb2dfZGVjcnlwdGlvbl9mYWlsZWQsXG4gICAgY2xhc3M6ICdhbGVydCBhbGVydC1kYW5nZXInXG4gIH07XG4gIHNob3dFcnJvck1vZGFsKGVycm9yKTtcbn07XG5cbkVkaXRvckN0cmwucHJvdG90eXBlLl9vblNob3dQd2REaWFsb2cgPSBmdW5jdGlvbihtc2cpIHtcbiAgdGhpcy5fcmVtb3ZlRGlhbG9nKCk7XG4gIGFkZFB3ZERpYWxvZyhtc2cuaWQpO1xufTtcblxuRWRpdG9yQ3RybC5wcm90b3R5cGUuX2dldFBsYWludGV4dCA9IGZ1bmN0aW9uKG1zZykge1xuICBpZiAobnVtVXBsb2Fkc0luUHJvZ3Jlc3MgIT09IDApIHtcbiAgICBkZWxheWVkQWN0aW9uID0gbXNnLmFjdGlvbjtcbiAgfSBlbHNlIHtcbiAgICBfc2VsZi5zZW5kUGxhaW5UZXh0KG1zZy5hY3Rpb24pO1xuICB9XG59O1xuXG5FZGl0b3JDdHJsLnByb3RvdHlwZS5fb25FcnJvck1lc3NhZ2UgPSBmdW5jdGlvbihtc2cpIHtcbiAgaWYgKG1zZy5lcnJvci5jb2RlID09PSAnUFdEX0RJQUxPR19DQU5DRUwnKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHNob3dFcnJvck1vZGFsKG1zZy5lcnJvcik7XG59O1xuXG4vKipcbiAqIFJlbWVtYmVyIGdsb2JhbCByZWZlcmVuY2Ugb2YgJHNjb3BlIGZvciB1c2UgaW5zaWRlIGNsb3N1cmVcbiAqL1xuRWRpdG9yQ3RybC5wcm90b3R5cGUuc2V0R2xvYmFsID0gZnVuY3Rpb24oZ2xvYmFsKSB7XG4gIF9zZWxmID0gZ2xvYmFsO1xuICBfc2VsZi5fcG9ydCA9IHBvcnQ7XG4gIC8vIGwxMG4gaXMgb25seSBpbml0aWFsaXplZCBpbiBDaHJvbWUgYXQgdGhpcyB0aW1lXG4gIF9zZWxmLmwxMG4gPSBsMTBuO1xufTtcblxudmFyIGlkO1xudmFyIG5hbWU7XG4vLyBwbGFpbiBvciByaWNoIHRleHRcbnZhciBlZGl0b3JfdHlwZTtcbnZhciBwb3J0O1xuLy8gZWRpdG9yIGVsZW1lbnRcbnZhciBlZGl0b3I7XG4vLyBibHVyIHdhcm5pbmdcbnZhciBibHVyV2Fybjtcbi8vIHRpbWVvdXRJRCBmb3IgcGVyaW9kIGluIHdoaWNoIGJsdXIgZXZlbnRzIGFyZSBtb25pdG9yZWRcbnZhciBibHVyV2FyblBlcmlvZCA9IG51bGw7XG4vLyB0aW1lb3V0SUQgZm9yIHBlcmlvZCBpbiB3aGljaCBibHVyIGV2ZW50cyBhcmUgbm9uLWNyaXRpY2FsXG52YXIgYmx1clZhbGlkID0gbnVsbDtcbnZhciBpbml0VGV4dCA9IG51bGw7XG52YXIgYmFzZVBhdGg7XG52YXIgbG9nVGV4dGFyZWFJbnB1dCA9IHRydWU7XG52YXIgbnVtVXBsb2Fkc0luUHJvZ3Jlc3MgPSAwO1xudmFyIGRlbGF5ZWRBY3Rpb24gPSAnJztcbnZhciBxcztcbnZhciBfc2VsZjtcblxubGV0IG1vZGFsQm9keUJvdHRvbVBvc2l0aW9uID0gMDtcbmxldCBmb290ZXJQcm9wcyA9IHtcbiAgb25DbGlja1VwbG9hZDogKCkgPT4gX3NlbGYubG9nVXNlcklucHV0KCdzZWN1cml0eV9sb2dfYWRkX2F0dGFjaG1lbnQnKSxcbiAgb25DaGFuZ2VGaWxlSW5wdXQ6IG9uQWRkQXR0YWNobWVudCxcbiAgb25DbGlja0ZpbGVFbmNyeXB0aW9uOiAoKSA9PiBfc2VsZi5lbWl0KCdvcGVuLWFwcCcsIHtzZW5kZXI6IF9zZWxmLl9uYW1lLCBmcmFnbWVudDogJ2ZpbGVfZW5jcnlwdGluZyd9KVxufTtcbmxldCBtb2RhbEZvb3RlclByb3BzID0ge1xuICBleHBhbmRlZDogZmFsc2UsXG4gIHNpZ25Nc2c6IGZhbHNlLFxuICBzaWduS2V5OiAnJyxcbiAgb25DYW5jZWw6ICgpID0+IF9zZWxmLmNhbmNlbCgpLFxuICBvblNpZ25Pbmx5OiAoKSA9PiBfc2VsZi5zaWduKCksXG4gIG9uRW5jcnlwdDogKCkgPT4gX3NlbGYuZW5jcnlwdCgpLFxuICBvbkV4cGFuZDogKCkgPT4ge1xuICAgICQoJy5tLW1vZGFsIC5tb2RhbC1ib2R5JykuYW5pbWF0ZSh7Ym90dG9tOiAnMTcycHgnfSwgKCkgPT4ge1xuICAgICAgcmVuZGVyTW9kYWxGb290ZXIoe2V4cGFuZGVkOiB0cnVlfSk7XG4gICAgfSk7XG4gIH0sXG4gIG9uQ29sbGFwc2U6ICgpID0+IHtcbiAgICAkKCcubS1tb2RhbCAubW9kYWwtYm9keScpLmFuaW1hdGUoe2JvdHRvbTogbW9kYWxCb2R5Qm90dG9tUG9zaXRpb259KTtcbiAgICByZW5kZXJNb2RhbEZvb3Rlcih7ZXhwYW5kZWQ6IGZhbHNlfSk7XG4gIH0sXG4gIG9uQ2hhbmdlU2lnbk1zZzogdmFsdWUgPT4ge1xuICAgIHJlbmRlckZvb3Rlcih7c2lnbk1zZzogdmFsdWV9KTtcbiAgICByZW5kZXJNb2RhbEZvb3Rlcih7c2lnbk1zZzogdmFsdWV9KTtcbiAgfSxcbiAgb25DaGFuZ2VTaWduS2V5OiB2YWx1ZSA9PiByZW5kZXJNb2RhbEZvb3Rlcih7c2lnbktleTogdmFsdWV9KSxcbiAgb25DbGlja1NpZ25TZXR0aW5nOiAoKSA9PiBfc2VsZi5lbWl0KCdvcGVuLWFwcCcsIHtzZW5kZXI6IF9zZWxmLl9uYW1lLCBmcmFnbWVudDogJ2dlbmVyYWwnfSlcbn07XG5cbi8vIHJlZ2lzdGVyIGxhbmd1YWdlIHN0cmluZ3NcbmwxMG4ucmVnaXN0ZXIoW1xuICAnZWRpdG9yX3JlbW92ZV91cGxvYWQnLFxuICAnd2FpdGluZ19kaWFsb2dfZGVjcnlwdGlvbl9mYWlsZWQnLFxuICAndXBsb2FkX3F1b3RhX2V4Y2VlZGVkX3dhcm5pbmcnLFxuICAnZWRpdG9yX2Vycm9yX2hlYWRlcicsXG4gICdlZGl0b3JfZXJyb3JfY29udGVudCcsXG4gICd3YWl0aW5nX2RpYWxvZ19wcmVwYXJlX2VtYWlsJyxcbiAgJ3VwbG9hZF9xdW90YV93YXJuaW5nX2hlYWRsaW5lJyxcbiAgJ2VkaXRvcl9rZXlfbm90X2ZvdW5kJyxcbiAgJ2VkaXRvcl9rZXlfbm90X2ZvdW5kX21zZycsXG4gICdlZGl0b3JfbGFiZWxfYWRkX3JlY2lwaWVudCdcbl0pO1xubDEwbi5tYXBUb0xvY2FsKClcbi50aGVuKCgpID0+IHtcbiAgLy8gRmlyZWZveCByZXF1aXJlcyBsYXRlIGFzc2lnbm1lbnQgb2YgbDEwblxuICBfc2VsZiAmJiBfc2VsZi5fdGltZW91dChmdW5jdGlvbigpIHtcbiAgICBfc2VsZi5sMTBuID0gbDEwbjtcbiAgfSk7XG59KTtcblxudmFyIG1heEZpbGVVcGxvYWRTaXplID0gbXZlbG8uTUFYRklMRVVQTE9BRFNJWkU7XG52YXIgbWF4RmlsZVVwbG9hZFNpemVDaHJvbWUgPSBtdmVsby5NQVhGSUxFVVBMT0FEU0laRUNIUk9NRTsgLy8gdGVtcG9yYWwgZml4IGR1ZSBpc3N1ZSBpbiBDaHJvbWVcblxuaWYgKCFhbmd1bGFyLm1vY2spIHsgLy8gZG8gbm90IGluaXQgaW4gdW5pdCB0ZXN0c1xuICBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLnJlYWR5KGluaXQpOyAvLyBkbyBtYW51YWwgYW5ndWxhciBib290c3RyYXBpbmcgYWZ0ZXIgaW5pdFxufVxuXG4vKipcbiAqIEluaWFsaXplZCB0aGUgZWRpdG9yIGJ5IHBhcnNpbmcgcXVlcnkgc3RyaW5nIHBhcmFtZXRlcnNcbiAqIGFuZCBsb2FkaW5nIHRlbXBsYXRlcyBpbnRvIHRoZSBET00uXG4gKi9cbmZ1bmN0aW9uIGluaXQoKSB7XG4gIGlmIChkb2N1bWVudC5ib2R5LmRhdGFzZXQubXZlbG8pIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZG9jdW1lbnQuYm9keS5kYXRhc2V0Lm12ZWxvID0gdHJ1ZTtcbiAgcXMgPSBqUXVlcnkucGFyc2VRdWVyeXN0cmluZygpO1xuICBpZCA9IHFzLmlkO1xuICBuYW1lID0gJ2VkaXRvci0nICsgaWQ7XG4gIGlmIChxcy5xdW90YSAmJiBwYXJzZUludChxcy5xdW90YSkgPCBtYXhGaWxlVXBsb2FkU2l6ZSkge1xuICAgIG1heEZpbGVVcGxvYWRTaXplID0gcGFyc2VJbnQocXMucXVvdGEpO1xuICB9XG4gIGlmIChtdmVsby5jcnggJiYgbWF4RmlsZVVwbG9hZFNpemUgPiBtYXhGaWxlVXBsb2FkU2l6ZUNocm9tZSkge1xuICAgIG1heEZpbGVVcGxvYWRTaXplID0gbWF4RmlsZVVwbG9hZFNpemVDaHJvbWU7XG4gIH1cbiAgLy8gcGxhaW4gdGV4dCBvbmx5XG4gIGVkaXRvcl90eXBlID0gbXZlbG8uUExBSU5fVEVYVDsgLy9xcy5lZGl0b3JfdHlwZTtcbiAgcG9ydCA9IG12ZWxvLmV4dGVuc2lvbi5jb25uZWN0KHtuYW1lOiBuYW1lfSk7XG4gIGxvYWRUZW1wbGF0ZXMoQm9vbGVhbihxcy5lbWJlZGRlZCksIHRlbXBsYXRlc0xvYWRlZCk7XG4gIGlmIChtdmVsby5jcngpIHtcbiAgICBiYXNlUGF0aCA9ICcuLi8uLi8nO1xuICB9IGVsc2UgaWYgKG12ZWxvLmZmYSkge1xuICAgIGJhc2VQYXRoID0gbXZlbG8uZXh0ZW5zaW9uLl9kYXRhUGF0aDtcbiAgfVxufVxuXG4vKipcbiAqIExvYWQgdGVtcGxhdGVzIGludG8gdGhlIERPTS5cbiAqL1xuZnVuY3Rpb24gbG9hZFRlbXBsYXRlcyhlbWJlZGRlZCwgY2FsbGJhY2spIHtcbiAgdmFyICRib2R5ID0gJCgnYm9keScpO1xuICAkYm9keS5hdHRyKCduZy1jb250cm9sbGVyJywgJ0VkaXRvckN0cmwgYXMgZWRpdCcpO1xuICBpZiAoZW1iZWRkZWQpIHtcbiAgICAkYm9keS5hZGRDbGFzcyhcInNlY3VyZUJhY2tncm91bmRcIik7XG5cbiAgICBQcm9taXNlLmFsbChbXG4gICAgICBtdmVsby5hcHBlbmRUcGwoJGJvZHksIG12ZWxvLmV4dGVuc2lvbi5nZXRVUkwoJ2NvbXBvbmVudHMvZWRpdG9yL3RwbC9lZGl0b3ItYm9keS5odG1sJykpLFxuICAgICAgbXZlbG8uYXBwZW5kVHBsKCRib2R5LCBtdmVsby5leHRlbnNpb24uZ2V0VVJMKCdjb21wb25lbnRzL2VkaXRvci90cGwvd2FpdGluZy1tb2RhbC5odG1sJykpLFxuICAgICAgbXZlbG8uYXBwZW5kVHBsKCRib2R5LCBtdmVsby5leHRlbnNpb24uZ2V0VVJMKCdjb21wb25lbnRzL2VkaXRvci90cGwvZXJyb3ItbW9kYWwuaHRtbCcpKVxuICAgIF0pXG4gICAgLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICByZW5kZXJGb290ZXIoe2VtYmVkZGVkfSk7XG4gICAgfSlcbiAgICAudGhlbihjYWxsYmFjayk7XG5cbiAgfSBlbHNlIHtcbiAgICBtdmVsby5hcHBlbmRUcGwoJGJvZHksIG12ZWxvLmV4dGVuc2lvbi5nZXRVUkwoJ2NvbXBvbmVudHMvZWRpdG9yL3RwbC9lZGl0b3ItcG9wdXAuaHRtbCcpKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgJCgnLm1vZGFsLWJvZHknKS5hZGRDbGFzcygnc2VjdXJlQmFja2dyb3VuZCcpO1xuXG4gICAgICBQcm9taXNlLmFsbChbXG4gICAgICAgIG12ZWxvLmFwcGVuZFRwbCgkKCcjZWRpdG9yRGlhbG9nIC5tb2RhbC1ib2R5JyksIG12ZWxvLmV4dGVuc2lvbi5nZXRVUkwoJ2NvbXBvbmVudHMvZWRpdG9yL3RwbC9lZGl0b3ItYm9keS5odG1sJykpLFxuICAgICAgICBtdmVsby5hcHBlbmRUcGwoJGJvZHksIG12ZWxvLmV4dGVuc2lvbi5nZXRVUkwoJ2NvbXBvbmVudHMvZWRpdG9yL3RwbC9lbmNyeXB0LW1vZGFsLmh0bWwnKSksXG4gICAgICAgIG12ZWxvLmFwcGVuZFRwbCgkYm9keSwgbXZlbG8uZXh0ZW5zaW9uLmdldFVSTCgnY29tcG9uZW50cy9lZGl0b3IvdHBsL3dhaXRpbmctbW9kYWwuaHRtbCcpKSxcbiAgICAgICAgbXZlbG8uYXBwZW5kVHBsKCRib2R5LCBtdmVsby5leHRlbnNpb24uZ2V0VVJMKCdjb21wb25lbnRzL2VkaXRvci90cGwvZXJyb3ItbW9kYWwuaHRtbCcpKVxuICAgICAgXSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICByZW5kZXJGb290ZXIoe2VtYmVkZGVkfSk7XG4gICAgICAgIHJlbmRlck1vZGFsRm9vdGVyKCk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oY2FsbGJhY2spO1xuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlbmRlckZvb3Rlcihwcm9wcyA9IHt9KSB7XG4gIE9iamVjdC5hc3NpZ24oZm9vdGVyUHJvcHMsIHByb3BzKTtcbiAgUmVhY3RET00ucmVuZGVyKFJlYWN0LmNyZWF0ZUVsZW1lbnQoRWRpdG9yRm9vdGVyLCBmb290ZXJQcm9wcyksICQoJyNmb290ZXInKS5nZXQoMCkpO1xufVxuXG5mdW5jdGlvbiByZW5kZXJNb2RhbEZvb3Rlcihwcm9wcyA9IHt9KSB7XG4gIE9iamVjdC5hc3NpZ24obW9kYWxGb290ZXJQcm9wcywgcHJvcHMpO1xuICBSZWFjdERPTS5yZW5kZXIoUmVhY3QuY3JlYXRlRWxlbWVudChFZGl0b3JNb2RhbEZvb3RlciwgbW9kYWxGb290ZXJQcm9wcyksICQoJyNlZGl0b3JEaWFsb2cgLm1vZGFsLWZvb3RlcicpLmdldCgwKSk7XG59XG5cbi8qKlxuICogQ2FsbGVkIGFmdGVyIHRlbXBsYXRlcyBoYXZlIGxvYWRlZC4gTm93IGlzIHRoZSB0aW1lIHRvIGJvb3RzdHJhcCBhbmd1bGFyLlxuICovXG5mdW5jdGlvbiB0ZW1wbGF0ZXNMb2FkZWQoKSB7XG4gICQoJyN3YWl0aW5nTW9kYWwnKS5vbignaGlkZGVuLmJzLm1vZGFsJywgZnVuY3Rpb24oKSB7XG4gICAgZWRpdG9yLmZvY3VzKClcbiAgICAgIC5wcm9wKCdzZWxlY3Rpb25TdGFydCcsIDApXG4gICAgICAucHJvcCgnc2VsZWN0aW9uRW5kJywgMCk7XG4gIH0pO1xuICAkKHdpbmRvdykub24oJ2ZvY3VzJywgc3RhcnRCbHVyVmFsaWQpO1xuICBpZiAoZWRpdG9yX3R5cGUgPT0gbXZlbG8uUExBSU5fVEVYVCkge1xuICAgIGVkaXRvciA9IGNyZWF0ZVBsYWluVGV4dCgpO1xuICB9IGVsc2Uge1xuICAgIC8vIG5vIHJpY2ggdGV4dCBvcHRpb25cbiAgfVxuICAvLyBibHVyIHdhcm5pbmdcbiAgYmx1cldhcm4gPSAkKCcjYmx1cldhcm4nKTtcbiAgLy8gb2JzZXJ2ZSBtb2RhbHMgZm9yIGJsdXIgd2FybmluZ1xuICAkKCcubW9kYWwnKS5vbignc2hvdy5icy5tb2RhbCcsIHN0YXJ0Qmx1clZhbGlkKTtcbiAgaWYgKGluaXRUZXh0KSB7XG4gICAgc2V0VGV4dChpbml0VGV4dCk7XG4gICAgaW5pdFRleHQgPSBudWxsO1xuICB9XG4gIG12ZWxvLmwxMG4ubG9jYWxpemVIVE1MKCk7XG4gIG12ZWxvLnV0aWwuc2hvd1NlY3VyaXR5QmFja2dyb3VuZChxcy5lbWJlZGRlZCk7XG4gIC8vIGJvb3RzdHJhcCBhbmd1bGFyXG4gIGFuZ3VsYXIuYm9vdHN0cmFwKGRvY3VtZW50LCBbJ2VkaXRvciddKTtcbiAgLy8ga2VlcCBpbml0aWFsIGJvdHRvbSBwb3NpdGlvbiBvZiBib2R5XG4gIG1vZGFsQm9keUJvdHRvbVBvc2l0aW9uID0gJCgnLm0tbW9kYWwgLm1vZGFsLWJvZHknKS5jc3MoJ2JvdHRvbScpO1xufVxuXG5mdW5jdGlvbiBhZGRBdHRhY2htZW50KGZpbGUpIHtcbiAgaWYgKGZpbGVMaWIuaXNPdmVyc2l6ZShmaWxlKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignRmlsZSBpcyB0b28gYmlnJyk7XG4gIH1cblxuICBmaWxlTGliLnJlYWRVcGxvYWRGaWxlKGZpbGUsIGFmdGVyTG9hZEVuZClcbiAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgdmFyICRmaWxlRWxlbWVudCA9IGZpbGVMaWIuY3JlYXRlRmlsZUVsZW1lbnQocmVzcG9uc2UsIHtcbiAgICAgICAgcmVtb3ZlQnV0dG9uOiB0cnVlLFxuICAgICAgICBvblJlbW92ZTogb25SZW1vdmVBdHRhY2htZW50XG4gICAgICB9KTtcbiAgICAgIHZhciAkdXBsb2FkUGFuZWwgPSAkKCcjdXBsb2FkUGFuZWwnKTtcbiAgICAgIHZhciB1cGxvYWRQYW5lbEhlaWdodCA9ICR1cGxvYWRQYW5lbFswXS5zY3JvbGxIZWlnaHQ7XG4gICAgICAkdXBsb2FkUGFuZWxcbiAgICAgICAgLmFwcGVuZCgkZmlsZUVsZW1lbnQpXG4gICAgICAgIC5zY3JvbGxUb3AodXBsb2FkUGFuZWxIZWlnaHQpOyAvL0FwcGVuZCBhdHRhY2htZW50IGVsZW1lbnQgYW5kIHNjcm9sbCB0byBib3R0b20gb2YgI3VwbG9hZFBhbmVsIHRvIHNob3cgY3VycmVudCB1cGxvYWRzXG5cbiAgICB9KVxuICAgIC5jYXRjaChmdW5jdGlvbihlcnJvcikge1xuICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBhZnRlckxvYWRFbmQoKSB7XG4gIG51bVVwbG9hZHNJblByb2dyZXNzLS07XG4gIGlmIChudW1VcGxvYWRzSW5Qcm9ncmVzcyA9PT0gMCAmJiBkZWxheWVkQWN0aW9uKSB7XG4gICAgX3NlbGYuc2VuZFBsYWluVGV4dChkZWxheWVkQWN0aW9uKTtcbiAgICBkZWxheWVkQWN0aW9uID0gJyc7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0QXR0YWNobWVudChhdHRhY2htZW50KSB7XG4gIHZhciBidWZmZXIgPSBtdmVsby51dGlsLnN0cjJhYihhdHRhY2htZW50LmNvbnRlbnQpO1xuICB2YXIgYmxvYiA9IG5ldyBCbG9iKFtidWZmZXJdLCB7dHlwZTogYXR0YWNobWVudC5taW1lVHlwZX0pO1xuICB2YXIgZmlsZSA9IG5ldyBGaWxlKFtibG9iXSwgYXR0YWNobWVudC5maWxlbmFtZSwge3R5cGU6IGF0dGFjaG1lbnQubWltZVR5cGV9KTtcbiAgbnVtVXBsb2Fkc0luUHJvZ3Jlc3MrKztcbiAgYWRkQXR0YWNobWVudChmaWxlKTtcbn1cblxuZnVuY3Rpb24gb25BZGRBdHRhY2htZW50KGV2dCkge1xuICB2YXIgZmlsZXMgPSBldnQudGFyZ2V0LmZpbGVzO1xuICB2YXIgbnVtRmlsZXMgPSBmaWxlcy5sZW5ndGg7XG5cbiAgdmFyIGk7XG4gIHZhciBmaWxlU2l6ZUFsbCA9IDA7XG4gIGZvciAoaSA9IDA7IGkgPCBudW1GaWxlczsgaSsrKSB7XG4gICAgZmlsZVNpemVBbGwgKz0gcGFyc2VJbnQoZmlsZXNbaV0uc2l6ZSk7XG4gIH1cblxuICB2YXIgY3VycmVudEF0dGFjaG1lbnRzU2l6ZSA9IGZpbGVMaWIuZ2V0RmlsZVNpemUoJCgnI3VwbG9hZFBhbmVsJykpICsgZmlsZVNpemVBbGw7XG4gIGlmIChjdXJyZW50QXR0YWNobWVudHNTaXplID4gbWF4RmlsZVVwbG9hZFNpemUpIHtcbiAgICB2YXIgZXJyb3IgPSB7XG4gICAgICB0aXRsZTogbDEwbi5tYXAudXBsb2FkX3F1b3RhX3dhcm5pbmdfaGVhZGxpbmUsXG4gICAgICBtZXNzYWdlOiBsMTBuLm1hcC51cGxvYWRfcXVvdGFfZXhjZWVkZWRfd2FybmluZyArIFwiIFwiICsgTWF0aC5mbG9vcihtYXhGaWxlVXBsb2FkU2l6ZSAvICgxMDI0ICogMTAyNCkpICsgXCJNQi5cIlxuICAgIH07XG5cbiAgICBzaG93RXJyb3JNb2RhbChlcnJvcik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgZm9yIChpID0gMDsgaSA8IGZpbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgbnVtVXBsb2Fkc0luUHJvZ3Jlc3MrKztcbiAgICBhZGRBdHRhY2htZW50KGZpbGVzW2ldKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBvblJlbW92ZUF0dGFjaG1lbnQoKSB7XG4gIF9zZWxmLmxvZ1VzZXJJbnB1dCgnc2VjdXJpdHlfbG9nX3JlbW92ZV9hdHRhY2htZW50Jyk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVBsYWluVGV4dCgpIHtcbiAgdmFyIHNhbmRib3ggPSAkKCc8aWZyYW1lLz4nLCB7XG4gICAgc2FuZGJveDogJ2FsbG93LXNhbWUtb3JpZ2luIGFsbG93LXNjcmlwdHMnLFxuICAgIGZyYW1lQm9yZGVyOiAwLFxuICAgIGNzczoge1xuICAgICAgJ292ZXJmbG93LXknOiAnaGlkZGVuJ1xuICAgIH1cbiAgfSk7XG4gIHZhciB0ZXh0ID0gJCgnPHRleHRhcmVhLz4nLCB7XG4gICAgaWQ6ICdjb250ZW50JyxcbiAgICBjbGFzczogJ2Zvcm0tY29udHJvbCcsXG4gICAgcm93czogMTIsXG4gICAgY3NzOiB7XG4gICAgICAnd2lkdGgnOiAgICAgICAgICcxMDAlJyxcbiAgICAgICdoZWlnaHQnOiAgICAgICAgJzEwMCUnLFxuICAgICAgJ21hcmdpbi1ib3R0b20nOiAnMCcsXG4gICAgICAnY29sb3InOiAgICAgICAgICdibGFjaycsXG4gICAgICAncmVzaXplJzogICAgICAgICdub25lJ1xuICAgIH1cbiAgfSk7XG4gIHZhciBzdHlsZSA9ICQoJzxsaW5rLz4nLCB7IHJlbDogJ3N0eWxlc2hlZXQnLCBocmVmOiBiYXNlUGF0aCArICdkZXAvYm9vdHN0cmFwL2Nzcy9ib290c3RyYXAuY3NzJyB9KTtcbiAgdmFyIHN0eWxlMiA9ICQoJzxsaW5rLz4nLCB7IHJlbDogJ3N0eWxlc2hlZXQnLCBocmVmOiBiYXNlUGF0aCArICdtdmVsby5jc3MnIH0pO1xuICB2YXIgbWV0YSA9ICQoJzxtZXRhLz4nLCB7IGNoYXJzZXQ6ICdVVEYtOCcgfSk7XG4gIHNhbmRib3gub25lKCdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgc2FuZGJveC5jb250ZW50cygpLmZpbmQoJ2hlYWQnKS5hcHBlbmQobWV0YSlcbiAgICAgIC5hcHBlbmQoc3R5bGUpXG4gICAgICAuYXBwZW5kKHN0eWxlMik7XG4gICAgc2FuZGJveC5jb250ZW50cygpLmZpbmQoJ2JvZHknKS5hdHRyKFwic3R5bGVcIiwgXCJvdmVyZmxvdzogaGlkZGVuOyBtYXJnaW46IDBcIilcbiAgICAgIC5hcHBlbmQodGV4dCk7XG4gIH0pO1xuICAkKCcjcGxhaW5UZXh0JykuYXBwZW5kKHNhbmRib3gpO1xuICB0ZXh0Lm9uKCdpbnB1dCcsIGZ1bmN0aW9uKCkge1xuICAgIHN0YXJ0Qmx1cldhcm5JbnRlcnZhbCgpO1xuICAgIGlmIChsb2dUZXh0YXJlYUlucHV0KSB7XG4gICAgICBfc2VsZi5sb2dVc2VySW5wdXQoJ3NlY3VyaXR5X2xvZ190ZXh0YXJlYV9pbnB1dCcpO1xuICAgICAgLy8gbGltaXQgdGV4dGFyZWEgbG9nIHRvIDEgZXZlbnQgcGVyIHNlY29uZFxuICAgICAgbG9nVGV4dGFyZWFJbnB1dCA9IGZhbHNlO1xuICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGxvZ1RleHRhcmVhSW5wdXQgPSB0cnVlO1xuICAgICAgfSwgMTAwMCk7XG4gICAgfVxuICB9KTtcbiAgdGV4dC5vbignYmx1cicsIG9uQmx1cik7XG4gIHRleHQub24oJ21vdXNldXAnLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGV4dEVsZW1lbnQgPSB0ZXh0LmdldCgwKTtcbiAgICBpZiAodGV4dEVsZW1lbnQuc2VsZWN0aW9uU3RhcnQgPT09IHRleHRFbGVtZW50LnNlbGVjdGlvbkVuZCkge1xuICAgICAgX3NlbGYubG9nVXNlcklucHV0KCdzZWN1cml0eV9sb2dfdGV4dGFyZWFfY2xpY2snKTtcbiAgICB9IGVsc2Uge1xuICAgICAgX3NlbGYubG9nVXNlcklucHV0KCdzZWN1cml0eV9sb2dfdGV4dGFyZWFfc2VsZWN0Jyk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHRleHQ7XG59XG5cbmZ1bmN0aW9uIHNldFBsYWluVGV4dCh0ZXh0KSB7XG4gIGVkaXRvci5mb2N1cygpXG4gICAgLnZhbCh0ZXh0KVxuICAgIC5wcm9wKCdzZWxlY3Rpb25TdGFydCcsIDApXG4gICAgLnByb3AoJ3NlbGVjdGlvbkVuZCcsIDApO1xufVxuXG5mdW5jdGlvbiBzZXRUZXh0KHRleHQpIHtcbiAgaWYgKGVkaXRvcl90eXBlID09IG12ZWxvLlBMQUlOX1RFWFQpIHtcbiAgICBzZXRQbGFpblRleHQodGV4dCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gbm8gcmljaCB0ZXh0IG9wdGlvblxuICB9XG59XG5cbmZ1bmN0aW9uIG9uQmx1cigpIHtcbiAgLypcbiAgIGJsdXIgd2FybmluZyBkaXNwbGF5ZWQgaWYgYmx1ciBvY2N1cnM6XG4gICAtIGluc2lkZSBibHVyIHdhcm5pbmcgcGVyaW9kICgycyBhZnRlciBpbnB1dClcbiAgIC0gbm90IHdpdGhpbiA0MG1zIGFmdGVyIG1vdXNlZG93biBldmVudCAoUlRFKVxuICAgLSBub3Qgd2l0aGluIDQwbXMgYmVmb3JlIGZvY3VzIGV2ZW50ICh3aW5kb3csIG1vZGFsKVxuICAgKi9cbiAgaWYgKGJsdXJXYXJuUGVyaW9kICYmICFibHVyVmFsaWQpIHtcbiAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIHNob3dCbHVyV2FybmluZygpO1xuICAgIH0sIDQwKTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gc2hvd0JsdXJXYXJuaW5nKCkge1xuICBpZiAoIWJsdXJWYWxpZCkge1xuICAgIC8vIGZhZGUgaW4gNjAwbXMsIHdhaXQgMjAwbXMsIGZhZGUgb3V0IDYwMG1zXG4gICAgYmx1cldhcm4ucmVtb3ZlQ2xhc3MoJ2hpZGUnKVxuICAgICAgLnN0b3AodHJ1ZSlcbiAgICAgIC5hbmltYXRlKHtvcGFjaXR5OiAxfSwgJ3Nsb3cnLCAnc3dpbmcnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBibHVyV2Fybi5hbmltYXRlKHtvcGFjaXR5OiAwfSwgJ3Nsb3cnLCAnc3dpbmcnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGJsdXJXYXJuLmFkZENsYXNzKCdoaWRlJyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sIDIwMCk7XG4gICAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzdGFydEJsdXJXYXJuSW50ZXJ2YWwoKSB7XG4gIGlmIChibHVyV2FyblBlcmlvZCkge1xuICAgIC8vIGNsZWFyIHRpbWVvdXRcbiAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KGJsdXJXYXJuUGVyaW9kKTtcbiAgfVxuICAvLyByZXN0YXJ0XG4gIGJsdXJXYXJuUGVyaW9kID0gd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgLy8gZW5kXG4gICAgYmx1cldhcm5QZXJpb2QgPSBudWxsO1xuICB9LCAyMDAwKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHN0YXJ0Qmx1clZhbGlkKCkge1xuICBpZiAoYmx1clZhbGlkKSB7XG4gICAgLy8gY2xlYXIgdGltZW91dFxuICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoYmx1clZhbGlkKTtcbiAgfVxuICAvLyByZXN0YXJ0XG4gIGJsdXJWYWxpZCA9IHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIC8vIGVuZFxuICAgIGJsdXJWYWxpZCA9IG51bGw7XG4gIH0sIDQwKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGFkZFB3ZERpYWxvZyhpZCkge1xuICB2YXIgcHdkID0gJCgnPGlmcmFtZS8+Jywge1xuICAgIGlkOiAncHdkRGlhbG9nJyxcbiAgICBzcmM6ICcuLi9lbnRlci1wYXNzd29yZC9wd2REaWFsb2cuaHRtbD9pZD0nICsgaWQsXG4gICAgZnJhbWVCb3JkZXI6IDBcbiAgfSk7XG4gICQoJ2JvZHknKS5maW5kKCcjZWRpdG9yRGlhbG9nJykuZmFkZU91dChmdW5jdGlvbigpIHtcbiAgICAkKCdib2R5JykuYXBwZW5kKHB3ZCk7XG4gIH0pO1xufVxuXG5FZGl0b3JDdHJsLnByb3RvdHlwZS5faGlkZVB3ZERpYWxvZyA9IGZ1bmN0aW9uKCkge1xuICAkKCdib2R5ICNwd2REaWFsb2cnKS5mYWRlT3V0KGZ1bmN0aW9uKCkge1xuICAgICQoJ2JvZHkgI3B3ZERpYWxvZycpLnJlbW92ZSgpO1xuICAgICQoJ2JvZHknKS5maW5kKCcjZWRpdG9yRGlhbG9nJykuc2hvdygpO1xuICB9KTtcbn07XG5cbkVkaXRvckN0cmwucHJvdG90eXBlLl9yZW1vdmVEaWFsb2cgPSBmdW5jdGlvbigpIHtcbiAgJCgnI2VuY3J5cHRNb2RhbCcpLm1vZGFsKCdoaWRlJyk7XG4gICQoJyNlbmNyeXB0TW9kYWwgaWZyYW1lJykucmVtb3ZlKCk7XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7T2JqZWN0fSBlcnJvclxuICogQHBhcmFtIHtTdHJpbmd9IFtlcnJvci50aXRsZV1cbiAqIEBwYXJhbSB7U3RyaW5nfSBlcnJvci5tZXNzYWdlXG4gKiBAcGFyYW0ge1N0cmluZ30gW2Vycm9yLmNsYXNzXVxuICovXG5mdW5jdGlvbiBzaG93RXJyb3JNb2RhbChlcnJvcikge1xuICB2YXIgdGl0bGUgPSBlcnJvci50aXRsZSB8fCBsMTBuLm1hcC5lZGl0b3JfZXJyb3JfaGVhZGVyO1xuICB2YXIgY29udGVudCA9IGVycm9yLm1lc3NhZ2U7XG4gIHZhciAkZXJyb3JNb2RhbCA9ICQoJyNlcnJvck1vZGFsJyk7XG5cbiAgaWYgKGNvbnRlbnQpIHtcbiAgICBjb250ZW50ID0gJCgnPGRpdi8+JykuYWRkQ2xhc3MoZXJyb3IuY2xhc3MgfHwgJ2FsZXJ0IGFsZXJ0LWRhbmdlcicpLnRleHQoY29udGVudCk7XG4gIH1cblxuICAkKCcubW9kYWwtYm9keScsICRlcnJvck1vZGFsKS5lbXB0eSgpLmFwcGVuZChjb250ZW50KTtcbiAgJCgnLm1vZGFsLXRpdGxlJywgJGVycm9yTW9kYWwpLmVtcHR5KCkuYXBwZW5kKHRpdGxlKTtcbiAgJGVycm9yTW9kYWwubW9kYWwoJ3Nob3cnKS5vbignaGlkZGVuLmJzLm1vZGFsJywgZnVuY3Rpb24oKSB7XG4gICAgJCgnI3dhaXRpbmdNb2RhbCcpLm1vZGFsKCdoaWRlJyk7XG4gIH0pO1xuICBfc2VsZi5faGlkZVB3ZERpYWxvZygpO1xufVxuXG5mdW5jdGlvbiBzZXRTaWduTW9kZSh7c2lnbk1zZywgcHJpbWFyeSwgcHJpdktleXN9KSB7XG4gIHNpZ25Nc2cgPSBCb29sZWFuKHNpZ25Nc2cpO1xuICAvLyB1cGRhdGUgZm9vdGVyXG4gIHJlbmRlckZvb3Rlcih7c2lnbk1zZywgcHJpbWFyeUtleTogQm9vbGVhbihwcmltYXJ5KX0pO1xuICAvLyBvbmx5IHJlbmRlciBpbiBub24tZW1iZWRkZWQgbW9kZVxuICBpZiAoIWZvb3RlclByb3BzLmVtYmVkZGVkKSB7XG4gICAgLy8gdXBkYXRlIG1vZGFsIGZvb3RlclxuICAgIHJlbmRlck1vZGFsRm9vdGVyKHtzaWduTXNnLCBzaWduS2V5OiBwcmltYXJ5LCBwcml2S2V5c30pO1xuICB9XG59XG5cbmZ1bmN0aW9uIG9uU2V0VGV4dChvcHRpb25zKSB7XG4gIGlmICghb3B0aW9ucy50ZXh0KSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChlZGl0b3IpIHtcbiAgICBzZXRUZXh0KG9wdGlvbnMudGV4dCk7XG4gIH0gZWxzZSB7XG4gICAgaW5pdFRleHQgPSBvcHRpb25zLnRleHQ7XG4gIH1cbn1cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9jb21wb25lbnRzL2VkaXRvci9lZGl0b3IuanMiLCJtb2R1bGUuZXhwb3J0cyA9IFJlYWN0O1xuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIGV4dGVybmFsIFwiUmVhY3RcIlxuLy8gbW9kdWxlIGlkID0gMVxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJtb2R1bGUuZXhwb3J0cyA9IFJlYWN0RE9NO1xuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIGV4dGVybmFsIFwiUmVhY3RET01cIlxuLy8gbW9kdWxlIGlkID0gMlxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJcbi8qKlxuICogTWFpbHZlbG9wZSAtIHNlY3VyZSBlbWFpbCB3aXRoIE9wZW5QR1AgZW5jcnlwdGlvbiBmb3IgV2VibWFpbFxuICogQ29weXJpZ2h0IChDKSAyMDEyLTIwMTUgTWFpbHZlbG9wZSBHbWJIXG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEFmZmVybyBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIHZlcnNpb24gM1xuICogYXMgcHVibGlzaGVkIGJ5IHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24uXG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogR05VIEFmZmVybyBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEFmZmVybyBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHRoaXMgcHJvZ3JhbS4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG4vKiBlc2xpbnQgc3RyaWN0OiAwICovXG5cbnZhciBtdmVsbyA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5tdmVsbyB8fCB7fTtcbi8vIGNocm9tZSBleHRlbnNpb25cbm12ZWxvLmNyeCA9IHR5cGVvZiBjaHJvbWUgIT09ICd1bmRlZmluZWQnO1xuLy8gZmlyZWZveCBhZGRvblxubXZlbG8uZmZhID0gbXZlbG8uZmZhIHx8IHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJyAmJiBzZWxmLnBvcnQgfHwgIW12ZWxvLmNyeDtcblxuLyogY29uc3RhbnRzICovXG5cbi8vIG1pbiBoZWlnaHQgZm9yIGxhcmdlIGZyYW1lXG5tdmVsby5MQVJHRV9GUkFNRSA9IDYwMDtcbi8vIGZyYW1lIGNvbnN0YW50c1xubXZlbG8uRlJBTUVfU1RBVFVTID0gJ3N0YXQnO1xuLy8gZnJhbWUgc3RhdHVzXG5tdmVsby5GUkFNRV9BVFRBQ0hFRCA9ICdhdHQnO1xubXZlbG8uRlJBTUVfREVUQUNIRUQgPSAnZGV0Jztcbi8vIGtleSBmb3IgcmVmZXJlbmNlIHRvIGZyYW1lIG9iamVjdFxubXZlbG8uRlJBTUVfT0JKID0gJ2ZyYSc7XG4vLyBtYXJrZXIgZm9yIGR5bmFtaWNhbGx5IGNyZWF0ZWQgaWZyYW1lc1xubXZlbG8uRFlOX0lGUkFNRSA9ICdkeW4nO1xubXZlbG8uSUZSQU1FX09CSiA9ICdvYmonO1xuLy8gYXJtb3IgaGVhZGVyIHR5cGVcbm12ZWxvLlBHUF9NRVNTQUdFID0gJ21zZyc7XG5tdmVsby5QR1BfU0lHTkFUVVJFID0gJ3NpZyc7XG5tdmVsby5QR1BfUFVCTElDX0tFWSA9ICdwdWInO1xubXZlbG8uUEdQX1BSSVZBVEVfS0VZID0gJ3ByaXYnO1xuLy8gZGlzcGxheSBkZWNyeXB0ZWQgbWVzc2FnZVxubXZlbG8uRElTUExBWV9JTkxJTkUgPSAnaW5saW5lJztcbm12ZWxvLkRJU1BMQVlfUE9QVVAgPSAncG9wdXAnO1xuLy8gZWRpdG9yIHR5cGVcbm12ZWxvLlBMQUlOX1RFWFQgPSAncGxhaW4nO1xubXZlbG8uUklDSF9URVhUID0gJ3JpY2gnO1xuLy8ga2V5cmluZ1xubXZlbG8uS0VZUklOR19ERUxJTUlURVIgPSAnfCN8Jztcbm12ZWxvLkxPQ0FMX0tFWVJJTkdfSUQgPSAnbG9jYWxob3N0JyArIG12ZWxvLktFWVJJTkdfREVMSU1JVEVSICsgJ21haWx2ZWxvcGUnO1xuLy8gY29sb3JzIGZvciBzZWN1cmUgYmFja2dyb3VuZFxubXZlbG8uU0VDVVJFX0NPTE9SUyA9IFsnI2U5ZTllOScsICcjYzBjMGMwJywgJyM4MDgwODAnLCAnI2ZmY2UxZScsICcjZmYwMDAwJywgJyM4NTE1NGEnLCAnIzZmMmI4YicsICcjYjNkMWUzJywgJyMzMTViYWInLCAnIzFjNDQ5YicsICcjNGM3NTljJywgJyMxZThlOWYnLCAnIzkzYjUzNiddO1xuXG5tdmVsby5NQVhGSUxFVVBMT0FEU0laRSA9IDI1ICogMTAyNCAqIDEwMjQ7XG5tdmVsby5NQVhGSUxFVVBMT0FEU0laRUNIUk9NRSA9IDIwICogMTAyNCAqIDEwMjQ7IC8vIHRlbXBvcmFsIGZpeCBkdWUgaXNzdWUgaW4gQ2hyb21lXG5cbm12ZWxvLmFwcGVuZFRwbCA9IGZ1bmN0aW9uKCRlbGVtZW50LCBwYXRoKSB7XG4gIGlmIChtdmVsby5mZmEgJiYgIS9ecmVzb3VyY2UvLnRlc3QoZG9jdW1lbnQubG9jYXRpb24ucHJvdG9jb2wpKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICAgIG12ZWxvLmRhdGEubG9hZChwYXRoLCBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgJGVsZW1lbnQuYXBwZW5kKCQucGFyc2VIVE1MKHJlc3VsdCkpO1xuICAgICAgICByZXNvbHZlKCRlbGVtZW50KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHZhciByZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgIHJlcS5vcGVuKCdHRVQnLCBwYXRoKTtcbiAgICAgIHJlcS5yZXNwb25zZVR5cGUgPSAndGV4dCc7XG4gICAgICByZXEub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChyZXEuc3RhdHVzID09IDIwMCkge1xuICAgICAgICAgICRlbGVtZW50LmFwcGVuZCgkLnBhcnNlSFRNTChyZXEucmVzcG9uc2UpKTtcbiAgICAgICAgICByZXNvbHZlKCRlbGVtZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKHJlcS5zdGF0dXNUZXh0KSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICByZXEub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QobmV3IEVycm9yKCdOZXR3b3JrIEVycm9yJykpO1xuICAgICAgfTtcbiAgICAgIHJlcS5zZW5kKCk7XG4gICAgfSk7XG4gIH1cbn07XG5cbi8vIGZvciBmaXhmb3gsIG12ZWxvLmV4dGVuc2lvbiBpcyBleHBvc2VkIGZyb20gYSBjb250ZW50IHNjcmlwdFxubXZlbG8uZXh0ZW5zaW9uID0gbXZlbG8uZXh0ZW5zaW9uIHx8IG12ZWxvLmNyeCAmJiBjaHJvbWUucnVudGltZTtcbi8vIGV4dGVuc2lvbi5jb25uZWN0IHNoaW0gZm9yIEZpcmVmb3hcbmlmIChtdmVsby5mZmEgJiYgbXZlbG8uZXh0ZW5zaW9uKSB7XG4gIG12ZWxvLmV4dGVuc2lvbi5jb25uZWN0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgbXZlbG8uZXh0ZW5zaW9uLl9jb25uZWN0KG9iaik7XG4gICAgb2JqLmV2ZW50cyA9IHt9O1xuICAgIHZhciBwb3J0ID0ge1xuICAgICAgcG9zdE1lc3NhZ2U6IG12ZWxvLmV4dGVuc2lvbi5wb3J0LnBvc3RNZXNzYWdlLFxuICAgICAgZGlzY29ubmVjdDogbXZlbG8uZXh0ZW5zaW9uLnBvcnQuZGlzY29ubmVjdC5iaW5kKG51bGwsIG9iaiksXG4gICAgICBvbk1lc3NhZ2U6IHtcbiAgICAgICAgYWRkTGlzdGVuZXI6IG12ZWxvLmV4dGVuc2lvbi5wb3J0LmFkZExpc3RlbmVyLmJpbmQobnVsbCwgb2JqKVxuICAgICAgfSxcbiAgICAgIG9uRGlzY29ubmVjdDoge1xuICAgICAgICBhZGRMaXN0ZW5lcjogbXZlbG8uZXh0ZW5zaW9uLnBvcnQuYWRkRGlzY29ubmVjdExpc3RlbmVyLmJpbmQobnVsbClcbiAgICAgIH1cbiAgICB9O1xuICAgIC8vIHBhZ2UgdW5sb2FkIHRyaWdnZXJzIHBvcnQgZGlzY29ubmVjdFxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd1bmxvYWQnLCBwb3J0LmRpc2Nvbm5lY3QpO1xuICAgIHJldHVybiBwb3J0O1xuICB9O1xufVxuXG4vLyBmb3IgZml4Zm94LCBtdmVsby5sMTBuIGlzIGV4cG9zZWQgZnJvbSBhIGNvbnRlbnQgc2NyaXB0XG5tdmVsby5sMTBuID0gbXZlbG8ubDEwbiB8fCBtdmVsby5jcnggJiYge1xuICBnZXRNZXNzYWdlczogZnVuY3Rpb24oaWRzLCBjYWxsYmFjaykge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICBpZHMuZm9yRWFjaChmdW5jdGlvbihpZCkge1xuICAgICAgcmVzdWx0W2lkXSA9IGNocm9tZS5pMThuLmdldE1lc3NhZ2UoaWQpO1xuICAgIH0pO1xuICAgIGNhbGxiYWNrKHJlc3VsdCk7XG4gIH0sXG4gIGxvY2FsaXplSFRNTDogZnVuY3Rpb24obDEwbiwgaWRTZWxlY3Rvcikge1xuICAgIHZhciBzZWxlY3RvciA9IGlkU2VsZWN0b3IgPyBpZFNlbGVjdG9yICsgJyBbZGF0YS1sMTBuLWlkXScgOiAnW2RhdGEtbDEwbi1pZF0nO1xuICAgICQoc2VsZWN0b3IpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICB2YXIganFFbGVtZW50ID0gJCh0aGlzKTtcbiAgICAgIHZhciBpZCA9IGpxRWxlbWVudC5kYXRhKCdsMTBuLWlkJyk7XG4gICAgICB2YXIgdGV4dCA9IGwxMG4gPyBsMTBuW2lkXSA6IGNocm9tZS5pMThuLmdldE1lc3NhZ2UoaWQpIHx8IGlkO1xuICAgICAganFFbGVtZW50LnRleHQodGV4dCk7XG4gICAgfSk7XG4gICAgJCgnW2RhdGEtbDEwbi10aXRsZS1pZF0nKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGpxRWxlbWVudCA9ICQodGhpcyk7XG4gICAgICB2YXIgaWQgPSBqcUVsZW1lbnQuZGF0YSgnbDEwbi10aXRsZS1pZCcpO1xuICAgICAgdmFyIHRleHQgPSBsMTBuID8gbDEwbltpZF0gOiBjaHJvbWUuaTE4bi5nZXRNZXNzYWdlKGlkKSB8fCBpZDtcbiAgICAgIGpxRWxlbWVudC5hdHRyKCd0aXRsZScsIHRleHQpO1xuICAgIH0pO1xuICB9XG59O1xuXG5tdmVsby51dGlsID0ge307XG5cbm12ZWxvLnV0aWwuc29ydEFuZERlRHVwID0gZnVuY3Rpb24odW5vcmRlcmVkLCBjb21wRm4pIHtcbiAgdmFyIHJlc3VsdCA9IFtdO1xuICB2YXIgc29ydGVkID0gdW5vcmRlcmVkLnNvcnQoY29tcEZuKTtcbiAgLy8gcmVtb3ZlIGR1cGxpY2F0ZXNcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzb3J0ZWQubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoaSA9PT0gMCB8fCBjb21wRm4gJiYgY29tcEZuKHNvcnRlZFtpIC0gMV0sIHNvcnRlZFtpXSkgIT09IDAgfHwgIWNvbXBGbiAmJiBzb3J0ZWRbaSAtIDFdICE9PSBzb3J0ZWRbaV0pIHtcbiAgICAgIHJlc3VsdC5wdXNoKHNvcnRlZFtpXSk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIE9ubHkgZGVkdXBsaWNhdGVzLCBkb2VzIG5vdCBzb3J0XG4gKiBAcGFyYW0gIHtBcnJheX0gbGlzdCAgIFRoZSBsaXN0IG9mIGl0ZW1zIHdpdGggZHVwbGljYXRlc1xuICogQHJldHVybiB7QXJyYXl9ICAgICAgICBUaGUgbGlzdCBvZiBpdGVtcyB3aXRob3V0IGR1cGxpY2F0ZXNcbiAqL1xubXZlbG8udXRpbC5kZUR1cCA9IGZ1bmN0aW9uKGxpc3QpIHtcbiAgdmFyIHJlc3VsdCA9IFtdO1xuICAobGlzdCB8fCBbXSkuZm9yRWFjaChmdW5jdGlvbihpKSB7XG4gICAgaWYgKHJlc3VsdC5pbmRleE9mKGkpID09PSAtMSkge1xuICAgICAgcmVzdWx0LnB1c2goaSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8vIHJhbmRvbSBoYXNoIGdlbmVyYXRvclxubXZlbG8udXRpbC5nZXRIYXNoID0gZnVuY3Rpb24oKSB7XG4gIHZhciByZXN1bHQgPSAnJztcbiAgdmFyIGJ1ZiA9IG5ldyBVaW50MTZBcnJheSg2KTtcbiAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgd2luZG93LmNyeXB0by5nZXRSYW5kb21WYWx1ZXMoYnVmKTtcbiAgfSBlbHNlIHtcbiAgICBtdmVsby51dGlsLmdldERPTVdpbmRvdygpLmNyeXB0by5nZXRSYW5kb21WYWx1ZXMoYnVmKTtcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1Zi5sZW5ndGg7IGkrKykge1xuICAgIHJlc3VsdCArPSBidWZbaV0udG9TdHJpbmcoMTYpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5tdmVsby51dGlsLmVuY29kZUhUTUwgPSBmdW5jdGlvbih0ZXh0KSB7XG4gIHJldHVybiBTdHJpbmcodGV4dClcbiAgICAucmVwbGFjZSgvJi9nLCBcIiZhbXA7XCIpXG4gICAgLnJlcGxhY2UoLzwvZywgXCImbHQ7XCIpXG4gICAgLnJlcGxhY2UoLz4vZywgXCImZ3Q7XCIpXG4gICAgLnJlcGxhY2UoL1wiL2csIFwiJnF1b3Q7XCIpXG4gICAgLnJlcGxhY2UoLycvZywgXCImIzAzOTtcIilcbiAgICAucmVwbGFjZSgvXFwvL2csIFwiJiN4MkY7XCIpO1xufTtcblxubXZlbG8udXRpbC5kZWNvZGVIVE1MID0gZnVuY3Rpb24oaHRtbCkge1xuICByZXR1cm4gU3RyaW5nKGh0bWwpXG4gICAgLnJlcGxhY2UoLyZhbXA7L2csIFwiJlwiKVxuICAgIC5yZXBsYWNlKC8mbHQ7L2csIFwiPFwiKVxuICAgIC5yZXBsYWNlKC8mZ3Q7L2csIFwiPlwiKVxuICAgIC5yZXBsYWNlKC8mcXVvdDsvZywgXCJcXFwiXCIpXG4gICAgLnJlcGxhY2UoLyYjMDM5Oy9nLCBcIlxcJ1wiKVxuICAgIC5yZXBsYWNlKC8mI3gyRjsvZywgXCJcXC9cIik7XG59O1xuXG5tdmVsby51dGlsLmRlY29kZVF1b3RlZFByaW50ID0gZnVuY3Rpb24oYXJtb3JlZCkge1xuICByZXR1cm4gYXJtb3JlZFxuICAgIC5yZXBsYWNlKC89M0Q9M0RcXHMqJC9tLCBcIj09XCIpXG4gICAgLnJlcGxhY2UoLz0zRFxccyokL20sIFwiPVwiKVxuICAgIC5yZXBsYWNlKC89M0QoXFxTezR9KVxccyokL20sIFwiPSQxXCIpO1xufTtcblxubXZlbG8udXRpbC50ZXh0Mmh0bWwgPSBmdW5jdGlvbih0ZXh0KSB7XG4gIHJldHVybiB0aGlzLmVuY29kZUhUTUwodGV4dCkucmVwbGFjZSgvXFxuL2csICc8YnI+Jyk7XG59O1xuXG5tdmVsby51dGlsLmh0bWwydGV4dCA9IGZ1bmN0aW9uKGh0bWwpIHtcbiAgaHRtbCA9IGh0bWwucmVwbGFjZSgvXFxuL2csICcgJyk7IC8vIHJlcGxhY2UgbmV3IGxpbmUgd2l0aCBzcGFjZVxuICBodG1sID0gaHRtbC5yZXBsYWNlKC8oPGJyPikvZywgJ1xcbicpOyAvLyByZXBsYWNlIDxicj4gd2l0aCBuZXcgbGluZVxuICBodG1sID0gaHRtbC5yZXBsYWNlKC88XFwvKGJsb2NrcXVvdGV8ZGl2fGRsfGR0fGRkfGZvcm18aDF8aDJ8aDN8aDR8aDV8aDZ8aHJ8b2x8cHxwcmV8dGFibGV8dHJ8dGR8dWx8bGl8c2VjdGlvbnxoZWFkZXJ8Zm9vdGVyKT4vZywgJ1xcbicpOyAvLyByZXBsYWNlIGJsb2NrIGNsb3NpbmcgdGFncyA8Ly4uPiB3aXRoIG5ldyBsaW5lXG4gIGh0bWwgPSBodG1sLnJlcGxhY2UoLzwoLis/KT4vZywgJycpOyAvLyByZW1vdmUgdGFnc1xuICBodG1sID0gaHRtbC5yZXBsYWNlKC8mbmJzcDsvZywgJyAnKTsgLy8gcmVwbGFjZSBub24tYnJlYWtpbmcgc3BhY2Ugd2l0aCB3aGl0ZXNwYWNlXG4gIGh0bWwgPSBodG1sLnJlcGxhY2UoL1xcbnszLH0vZywgJ1xcblxcbicpOyAvLyBjb21wcmVzcyBuZXcgbGluZVxuICByZXR1cm4gbXZlbG8udXRpbC5kZWNvZGVIVE1MKGh0bWwpO1xufTtcblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgcmV0dXJuIHRoZSBieXRlIHNpemUgb2YgYW55IFVURi04IHN0cmluZyB5b3UgcGFzcyB0byBpdC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbm12ZWxvLnV0aWwuYnl0ZUNvdW50ID0gZnVuY3Rpb24oc3RyKSB7XG4gIHJldHVybiBlbmNvZGVVUkkoc3RyKS5zcGxpdCgvJS4ufC4vKS5sZW5ndGggLSAxO1xufTtcblxubXZlbG8udXRpbC5hYjJzdHIgPSBmdW5jdGlvbihidWYpIHtcbiAgdmFyIHN0ciA9ICcnO1xuICB2YXIgYWIgPSBuZXcgVWludDhBcnJheShidWYpO1xuICB2YXIgQ0hVTktfU0laRSA9IE1hdGgucG93KDIsIDE2KTtcbiAgdmFyIG9mZnNldCwgbGVuLCBzdWJhYjtcbiAgZm9yIChvZmZzZXQgPSAwOyBvZmZzZXQgPCBhYi5sZW5ndGg7IG9mZnNldCArPSBDSFVOS19TSVpFKSB7XG4gICAgbGVuID0gTWF0aC5taW4oQ0hVTktfU0laRSwgYWIubGVuZ3RoIC0gb2Zmc2V0KTtcbiAgICBzdWJhYiA9IGFiLnN1YmFycmF5KG9mZnNldCwgb2Zmc2V0ICsgbGVuKTtcbiAgICBzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLCBzdWJhYik7XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cbm12ZWxvLnV0aWwuc3RyMmFiID0gZnVuY3Rpb24oc3RyKSB7XG4gIHZhciBidWZWaWV3ID0gbmV3IFVpbnQ4QXJyYXkoc3RyLmxlbmd0aCk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgYnVmVmlld1tpXSA9IHN0ci5jaGFyQ29kZUF0KGkpO1xuICB9XG4gIHJldHVybiBidWZWaWV3LmJ1ZmZlcjtcbn07XG5cbm12ZWxvLnV0aWwuZ2V0RXh0ZW5zaW9uQ2xhc3MgPSBmdW5jdGlvbihmaWxlRXh0KSB7XG4gIHZhciBleHRDbGFzcyA9ICcnO1xuICBpZiAoZmlsZUV4dCkge1xuICAgIGV4dENsYXNzID0gJ2V4dC1jb2xvci0nICsgZmlsZUV4dDtcbiAgfVxuICByZXR1cm4gZXh0Q2xhc3M7XG59O1xuXG5tdmVsby51dGlsLmV4dHJhY3RGaWxlTmFtZVdpdGhvdXRFeHQgPSBmdW5jdGlvbihmaWxlTmFtZSkge1xuICB2YXIgaW5kZXhPZkRvdCA9IGZpbGVOYW1lLmxhc3RJbmRleE9mKCcuJyk7XG4gIGlmIChpbmRleE9mRG90ID4gMCkgeyAvLyBjYXNlOiByZWd1bGFyXG4gICAgcmV0dXJuIGZpbGVOYW1lLnN1YnN0cmluZygwLCBpbmRleE9mRG90KTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmlsZU5hbWU7XG4gIH1cbn07XG5cbm12ZWxvLnV0aWwuZXh0cmFjdEZpbGVFeHRlbnNpb24gPSBmdW5jdGlvbihmaWxlTmFtZSkge1xuICB2YXIgbGFzdGluZGV4RG90ID0gZmlsZU5hbWUubGFzdEluZGV4T2YoJy4nKTtcbiAgaWYgKGxhc3RpbmRleERvdCA8PSAwKSB7IC8vIG5vIGV4dGVuc2lvblxuICAgIHJldHVybiAnJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmlsZU5hbWUuc3Vic3RyaW5nKGxhc3RpbmRleERvdCArIDEsIGZpbGVOYW1lLmxlbmd0aCkudG9Mb3dlckNhc2UoKS50cmltKCk7XG4gIH1cbn07XG5cbi8vIEF0dHJpYnV0aW9uOiBodHRwOi8vd3d3LjJhbGl0eS5jb20vMjAxMi8wOC91bmRlcnNjb3JlLWV4dGVuZC5odG1sXG5tdmVsby51dGlsLmV4dGVuZCA9IGZ1bmN0aW9uKHRhcmdldCkge1xuICB2YXIgc291cmNlcyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgc291cmNlcy5mb3JFYWNoKGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHNvdXJjZSkuZm9yRWFjaChmdW5jdGlvbihwcm9wTmFtZSkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgcHJvcE5hbWUsXG4gICAgICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihzb3VyY2UsIHByb3BOYW1lKSk7XG4gICAgfSk7XG4gIH0pO1xuICByZXR1cm4gdGFyZ2V0O1xufTtcblxubXZlbG8udXRpbC5hZGRMb2FkaW5nQW5pbWF0aW9uID0gZnVuY3Rpb24oJHBhcmVudCkge1xuICAkcGFyZW50ID0gJHBhcmVudCB8fCAkKCdib2R5JylbMF07XG4gIHZhciBzcGlubmVyID0gJCgnPGRpdiBjbGFzcz1cIm0tc3Bpbm5lclwiPjxkaXYgY2xhc3M9XCJib3VuY2UxXCI+PC9kaXY+PGRpdiBjbGFzcz1cImJvdW5jZTJcIj48L2Rpdj48ZGl2IGNsYXNzPVwiYm91bmNlM1wiPjwvZGl2PjwvZGl2PicpO1xuICBzcGlubmVyLmFwcGVuZFRvKCRwYXJlbnQpO1xufTtcblxubXZlbG8udXRpbC5zaG93TG9hZGluZ0FuaW1hdGlvbiA9IGZ1bmN0aW9uKCRwYXJlbnQpIHtcbiAgJHBhcmVudCA9ICRwYXJlbnQgfHwgJCgnYm9keScpWzBdO1xuICAkKCcubS1zcGlubmVyJywgJHBhcmVudCkuc2hvdygpO1xufTtcblxubXZlbG8udXRpbC5oaWRlTG9hZGluZ0FuaW1hdGlvbiA9IGZ1bmN0aW9uKCRwYXJlbnQpIHtcbiAgJHBhcmVudCA9ICRwYXJlbnQgfHwgJCgnYm9keScpWzBdO1xuICAkKCcubS1zcGlubmVyJywgJHBhcmVudCkuaGlkZSgpO1xufTtcblxubXZlbG8udXRpbC5nZW5lcmF0ZVNlY3VyaXR5QmFja2dyb3VuZCA9IGZ1bmN0aW9uKGFuZ2xlLCBzY2FsaW5nLCBjb2xvcmluZykge1xuICB2YXIgc2VjdXJpdHkgPSBtdmVsby51dGlsLnNlY0JnbmQsXG4gICAgaWNvbldpZHRoID0gc2VjdXJpdHkud2lkdGggKiBzZWN1cml0eS5zY2FsaW5nLFxuICAgIGljb25IZWlnaHQgPSBzZWN1cml0eS5oZWlnaHQgKiBzZWN1cml0eS5zY2FsaW5nLFxuICAgIGljb25BbmdsZSA9IHNlY3VyaXR5LmFuZ2xlLFxuICAgIGljb25Db2xvciA9IG12ZWxvLlNFQ1VSRV9DT0xPUlNbc2VjdXJpdHkuY29sb3JJZF07XG5cbiAgaWYgKGFuZ2xlIHx8IGFuZ2xlID09PSAwKSB7XG4gICAgaWNvbkFuZ2xlID0gYW5nbGU7XG4gIH1cbiAgaWYgKHNjYWxpbmcpIHtcbiAgICBpY29uV2lkdGggPSBzZWN1cml0eS53aWR0aCAqIHNjYWxpbmc7XG4gICAgaWNvbkhlaWdodCA9IHNlY3VyaXR5LmhlaWdodCAqIHNjYWxpbmc7XG4gIH1cbiAgaWYgKGNvbG9yaW5nKSB7XG4gICAgaWNvbkNvbG9yID0gbXZlbG8uU0VDVVJFX0NPTE9SU1tjb2xvcmluZ107XG4gIH1cblxuICByZXR1cm4gJzw/eG1sIHZlcnNpb249XCIxLjBcIiBlbmNvZGluZz1cIlVURi04XCIgc3RhbmRhbG9uZT1cIm5vXCI/PjxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIGlkPVwic2VjQmduZFwiIHZlcnNpb249XCIxLjFcIiB3aWR0aD1cIicgKyBpY29uV2lkdGggKyAncHhcIiBoZWlnaHQ9XCInICsgaWNvbkhlaWdodCArICdweFwiIHZpZXdCb3g9XCIwIDAgMjcgMjdcIj48cGF0aCB0cmFuc2Zvcm09XCJyb3RhdGUoJyArIGljb25BbmdsZSArICcgMTQgMTQpXCIgc3R5bGU9XCJmaWxsOiAnICsgaWNvbkNvbG9yICsgJztcIiBkPVwibSAxMy45NjM2NDksMjUuOTAxNzU0IGMgLTQuNjkwMDAwNSwwIC04LjUwMDAwMDUsLTMuNzggLTguNTAwMDAwNSwtOC40NCAwLC0xLjY0IDAuNDcsLTMuMTcgMS4yOSwtNC40NyBWIDkuMDQxNzU0NiBjIDAsLTMuOTM5OTk5MiAzLjIzLC03LjE0OTk5OTIgNy4yMDAwMDA1LC03LjE0OTk5OTIgMy45NywwIDcuMiwzLjIxIDcuMiw3LjE0OTk5OTIgdiAzLjk0OTk5OTQgYyAwLjgyLDEuMyAxLjMsMi44MyAxLjMsNC40OCAwLDQuNjUgLTMuOCw4LjQzIC04LjQ5LDguNDMgeiBtIC0xLjM1LC03Ljk5IHYgMy4zMyBoIDAgYyAwLDAuMDIgMCwwLjAzIDAsMC4wNSAwLDAuNzQgMC42MSwxLjM0IDEuMzUsMS4zNCAwLjc1LDAgMS4zNSwtMC42IDEuMzUsLTEuMzQgMCwtMC4wMiAwLC0wLjAzIDAsLTAuMDUgaCAwIHYgLTMuMzMgYyAwLjYzLC0wLjQzIDEuMDQsLTEuMTUgMS4wNCwtMS45NyAwLC0xLjMyIC0xLjA3LC0yLjM4IC0yLjQsLTIuMzggLTEuMzIsMCAtMi40LDEuMDcgLTIuNCwyLjM4IDAuMDEsMC44MiAwLjQzLDEuNTQgMS4wNiwxLjk3IHogbSA2LjI5LC04Ljg2OTk5OTQgYyAwLC0yLjcwOTk5OTIgLTIuMjIsLTQuOTA5OTk5MiAtNC45NSwtNC45MDk5OTkyIC0yLjczLDAgLTQuOTUwMDAwNSwyLjIgLTQuOTUwMDAwNSw0LjkwOTk5OTIgViAxMC42MTE3NTQgQyAxMC4zOTM2NDksOS42MjE3NTQ0IDEyLjEwMzY0OSw5LjAzMTc1NDYgMTMuOTUzNjQ5LDkuMDMxNzU0NiBjIDEuODUsMCAzLjU1LDAuNTg5OTk5OCA0Ljk0LDEuNTc5OTk5NCBsIDAuMDEsLTEuNTY5OTk5NCB6XCIgLz48L3N2Zz4nO1xufTtcblxubXZlbG8udXRpbC5zaG93U2VjdXJpdHlCYWNrZ3JvdW5kID0gZnVuY3Rpb24oaXNFbWJlZGRlZCkge1xuICBpZiAoaXNFbWJlZGRlZCkge1xuICAgICQoJy5zZWN1cmVCZ25kU2V0dGluZ3NCdG4nKS5vbignbW91c2VlbnRlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgJCgnLnNlY3VyZUJnbmRTZXR0aW5nc0J0bicpLnJlbW92ZUNsYXNzKCdidG4tbGluaycpLmFkZENsYXNzKCdidG4tZGVmYXVsdCcpO1xuICAgIH0pO1xuXG4gICAgJCgnLnNlY3VyZUJnbmRTZXR0aW5nc0J0bicpLm9uKCdtb3VzZWxlYXZlJywgZnVuY3Rpb24oKSB7XG4gICAgICAkKCcuc2VjdXJlQmduZFNldHRpbmdzQnRuJykucmVtb3ZlQ2xhc3MoJ2J0bi1kZWZhdWx0JykuYWRkQ2xhc3MoJ2J0bi1saW5rJyk7XG4gICAgfSk7XG4gIH1cblxuICBtdmVsby5leHRlbnNpb24uc2VuZE1lc3NhZ2Uoe2V2ZW50OiBcImdldC1zZWN1cml0eS1iYWNrZ3JvdW5kXCJ9LCBmdW5jdGlvbihiYWNrZ3JvdW5kKSB7XG4gICAgbXZlbG8udXRpbC5zZWNCZ25kID0gYmFja2dyb3VuZDtcblxuICAgIHZhciBzZWNCZ25kSWNvbiA9IG12ZWxvLnV0aWwuZ2VuZXJhdGVTZWN1cml0eUJhY2tncm91bmQoKSxcbiAgICAgIHNlY3VyZVN0eWxlID0gJy5zZWN1cmVCYWNrZ3JvdW5kIHsnICtcbiAgICAgICAgJ2JhY2tncm91bmQtY29sb3I6ICcgKyBtdmVsby51dGlsLnNlY0JnbmQuY29sb3IgKyAnOycgK1xuICAgICAgICAnYmFja2dyb3VuZC1wb3NpdGlvbjogLTIwcHggLTIwcHg7JyArXG4gICAgICAgICdiYWNrZ3JvdW5kLWltYWdlOiB1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCwnICsgYnRvYShzZWNCZ25kSWNvbikgKyAnKTsnICtcbiAgICAgICAgJ30nO1xuXG4gICAgdmFyIGxvY2tJY29uID0gbXZlbG8udXRpbC5nZW5lcmF0ZVNlY3VyaXR5QmFja2dyb3VuZCgwLCBudWxsLCAyKSxcbiAgICAgIGxvY2tCdXR0b24gPSAnLmxvY2tCdG5JY29uLCAubG9ja0J0bkljb246YWN0aXZlIHsnICtcbiAgICAgICAgJ21hcmdpbjogMHB4OycgK1xuICAgICAgICAnd2lkdGg6IDI4cHg7IGhlaWdodDogMjhweDsnICtcbiAgICAgICAgJ2JhY2tncm91bmQtc2l6ZTogMTAwJSAxMDAlOycgK1xuICAgICAgICAnYmFja2dyb3VuZC1yZXBlYXQ6IG5vLXJlcGVhdDsnICtcbiAgICAgICAgJ2JhY2tncm91bmQtaW1hZ2U6IHVybChkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LCcgKyBidG9hKGxvY2tJY29uKSArICcpOycgK1xuICAgICAgICAnfSc7XG5cbiAgICB2YXIgc2VjQmduZFN0eWxlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlY0JnbmRDc3MnKTtcbiAgICBpZiAoc2VjQmduZFN0eWxlKSB7XG4gICAgICBzZWNCZ25kU3R5bGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzZWNCZ25kU3R5bGUpO1xuICAgIH1cbiAgICAkKCdoZWFkJykuYXBwZW5kKCQoJzxzdHlsZT4nKS5hdHRyKCdpZCcsICdzZWNCZ25kQ3NzJykudGV4dChzZWN1cmVTdHlsZSArIGxvY2tCdXR0b24pKTtcbiAgfSk7XG59O1xuXG5tdmVsby51dGlsLm1hdGNoUGF0dGVybjJSZWdFeCA9IGZ1bmN0aW9uKG1hdGNoUGF0dGVybikge1xuICByZXR1cm4gbmV3IFJlZ0V4cChcbiAgICAnXicgKyBtYXRjaFBhdHRlcm4ucmVwbGFjZSgvXFwuL2csICdcXFxcLicpXG4gICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcKlxcXFxcXC4vLCAnKFxcXFx3KygtXFxcXHcrKSpcXFxcLikqJykgKyAnJCdcbiAgKTtcbn07XG5cbm12ZWxvLnV0aWwubWFwRXJyb3IgPSBmdW5jdGlvbihlcnJvcikge1xuICByZXR1cm4geyBtZXNzYWdlOiBlcnJvci5tZXNzYWdlLCBjb2RlOiBlcnJvci5jb2RlICB8fCAnSU5URVJOQUxfRVJST1InIH07XG59O1xuXG5tdmVsby51dGlsLnRocm93RXJyb3IgPSBmdW5jdGlvbihtZXNzYWdlLCBjb2RlKSB7XG4gIHZhciBlcnJvciA9IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgZXJyb3IuY29kZSA9IGNvZGU7XG4gIHRocm93IGVycm9yO1xufTtcblxubXZlbG8udXRpbC5Qcm9taXNlUXVldWUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5xdWV1ZSA9IFtdO1xufTtcblxubXZlbG8udXRpbC5Qcm9taXNlUXVldWUucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbih0aGlzQXJnLCBtZXRob2QsIGFyZ3MpIHtcbiAgdmFyIHRoYXQgPSB0aGlzO1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdGhhdC5xdWV1ZS5wdXNoKHtyZXNvbHZlOiByZXNvbHZlLCByZWplY3Q6IHJlamVjdCwgdGhpc0FyZzogdGhpc0FyZywgbWV0aG9kOiBtZXRob2QsIGFyZ3M6IGFyZ3N9KTtcbiAgICBpZiAodGhhdC5xdWV1ZS5sZW5ndGggPT09IDEpIHtcbiAgICAgIHRoYXQuX25leHQoKTtcbiAgICB9XG4gIH0pO1xufTtcblxubXZlbG8udXRpbC5Qcm9taXNlUXVldWUucHJvdG90eXBlLl9uZXh0ID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLnF1ZXVlLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgdGhhdCA9IHRoaXM7XG4gIHZhciBuZXh0RW50cnkgPSB0aGlzLnF1ZXVlWzBdO1xuICBtdmVsby51dGlsLnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgbmV4dEVudHJ5LnRoaXNBcmdbbmV4dEVudHJ5Lm1ldGhvZF0uYXBwbHkobmV4dEVudHJ5LnRoaXNBcmcsIG5leHRFbnRyeS5hcmdzKVxuICAgIC50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgbmV4dEVudHJ5LnJlc29sdmUocmVzdWx0KTtcbiAgICB9KVxuICAgIC5jYXRjaChmdW5jdGlvbihlcnJvcikge1xuICAgICAgbmV4dEVudHJ5LnJlamVjdChlcnJvcik7XG4gICAgfSlcbiAgICAudGhlbihmdW5jdGlvbigpIHtcbiAgICAgIHRoYXQucXVldWUuc2hpZnQoKTtcbiAgICAgIHRoYXQuX25leHQoKTtcbiAgICB9KTtcbiAgfSwgMCk7XG59O1xuXG4vKipcbiAqIFdhdGVyZmFsbCBvZiBhc3luYyBwcm9jZXNzZXNcbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBwcm9jZXNzIC0gaGFzIHRvIHJldHVybiBQcm9taXNlLCByZXN1bHQgYXMgYXJyYXlcbiAqIEBwYXJhbSAge0FycmF5fSBsaXN0IC0gZWFjaCBpdGVtIGlzIHByb2Nlc3NlZFxuICogQHJldHVybiB7UHJvbWlzZX0gLSByZXNvbHZlZCB3aGVuIGFsbCBwcm9jZXNzZXMgZmluaXNoZWQgd2l0aCBlbmQgcmVzdWx0IGFzIGFycmF5XG4gKi9cbm12ZWxvLnV0aWwuc2VxdWVudGlhbCA9IChwcm9jZXNzLCBsaXN0KSA9PiB7XG4gIHJldHVybiBsaXN0LnJlZHVjZSgoYWNjLCBpdGVtKSA9PiB7XG4gICAgcmV0dXJuIGFjYy50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgIHJldHVybiBwcm9jZXNzKGl0ZW0pLnRoZW4oKHByb2Nlc3NSZXN1bHQpID0+IHtcbiAgICAgICAgcmVzdWx0LnB1c2goLi4ucHJvY2Vzc1Jlc3VsdCk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9KVxuICAgIH0pO1xuICB9LCBQcm9taXNlLnJlc29sdmUoW10pKTtcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSBhbiBlbWFpbCBhZGRyZXNzLlxuICogQHBhcmFtICB7U3RyaW5nfSBhZGRyZXNzICAgVGhlIGVtYWlsIGFkZHJlc3MgdG8gdmFsaWRhdGVcbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgIFRydWUgaWYgdmFsaWQsIGZhbHNlIGlmIG5vdFxuICovXG5tdmVsby51dGlsLmNoZWNrRW1haWwgPSBmdW5jdGlvbihhZGRyZXNzKSB7XG4gIHZhciBwYXR0ZXJuID0gL15bK2EtekEtWjAtOV8uISMkJSYnKlxcLz0/XmB7fH1+LV0rQChbYS16QS1aMC05LV0rXFwuKStbYS16QS1aMC05XXsyLDYzfSQvO1xuICByZXR1cm4gcGF0dGVybi50ZXN0KGFkZHJlc3MpO1xufTtcblxuLyoqXG4gKiBJbmhlcml0IGZyb20gbXZlbG8uRXZlbnRIYW5kbGVyLnByb3RvdHlwZSB0byB1c2UgdGhlIG5ldyBldmVudCBoYW5kbGluZ1xuICogYXBpcyAnb24nIGFuZCAnZW1pdCcuXG4gKi9cbm12ZWxvLkV2ZW50SGFuZGxlciA9IGZ1bmN0aW9uKCkge307XG5cbi8qKlxuICogR2VuZXJpYyBwb3J0IG1lc3NhZ2UgaGFuZGxlciB0aGF0IGNhbiBiZSBhdHRhY2hlZCB2aWEgcG9ydC5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKS5cbiAqIE9uY2Ugc2V0IHVwLCBldmVudHMgY2FuIGJlIGhhbmRsZWQgd2l0aCBvbignZXZlbnQnLCBmdW5jdGlvbihvcHRpb25zKSB7fSlcbiAqIEBwYXJhbSAge1N0cmluZ30gb3B0aW9ucy5ldmVudCAgIFRoZSBldmVudCBkZXNjcmlwdG9yXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgICAgICAgICBDb250YWlucyBtZXNzYWdlIGF0dHJpYnV0ZXMgYW5kIGRhdGFcbiAqL1xubXZlbG8uRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5oYW5kbGVQb3J0TWVzc2FnZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIGlmICh0aGlzLl9oYW5kbGVycyAmJiB0aGlzLl9oYW5kbGVycy5oYXMob3B0aW9ucy5ldmVudCkpIHtcbiAgICB0aGlzLl9oYW5kbGVycy5nZXQob3B0aW9ucy5ldmVudCkuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmxvZygnVW5rbm93biBldmVudCcsIG9wdGlvbnMpO1xuICB9XG59O1xuXG4vKipcbiAqIFRoZSBuZXcgZXZlbnQgaGFuZGxpbmcgc3R5bGUgdG8gYXNpZ24gYSBmdW5jdGlvbiB0byBhbiBldmVudC5cbiAqIEBwYXJhbSAge1N0cmluZ30gZXZlbnQgICAgICAgVGhlIGV2ZW50IGRlc2NyaXB0b3JcbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBoYW5kbGVyICAgVGhlIGV2ZW50IGhhbmRsZXJcbiAqL1xubXZlbG8uRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKGV2ZW50LCBoYW5kbGVyKSB7XG4gIGlmICghZXZlbnQgfHwgdHlwZW9mIGV2ZW50ICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgaGFuZGxlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBldmVudCBoYW5kbGVyIScpO1xuICB9XG4gIGlmICghdGhpcy5faGFuZGxlcnMpIHtcbiAgICB0aGlzLl9oYW5kbGVycyA9IG5ldyBNYXAoKTtcbiAgfVxuICB0aGlzLl9oYW5kbGVycy5zZXQoZXZlbnQsIGhhbmRsZXIpO1xufTtcblxuLyoqXG4gKiBIZWxwZXIgdG8gZW1pdCBldmVudHMgdmlhIHBvc3RNZXNzYWdlIHVzaW5nIGEgcG9ydC5cbiAqIEBwYXJhbSAge1N0cmluZ30gZXZlbnQgICAgIFRoZSBldmVudCBkZXNjcmlwdG9yXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgICAob3B0aW9uYWwpIERhdGEgdG8gYmUgc2VudCBpbiB0aGUgZXZlbnRcbiAqIEBwYXJhbSAge09iamVjdH0gcG9ydCAgICAgIChvcHRpb25hbCkgVGhlIHBvcnQgdG8gYmUgdXNlZC4gSWZcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdCBzcGVjaWZpZWQsIHRoZSBtYWluIHBvcnQgaXMgdXNlZC5cbiAqL1xubXZlbG8uRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24oZXZlbnQsIG9wdGlvbnMsIHBvcnQpIHtcbiAgaWYgKCFldmVudCB8fCB0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGV2ZW50IScpO1xuICB9XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBvcHRpb25zLmV2ZW50ID0gZXZlbnQ7XG4gIG9wdGlvbnMuc2VuZGVyID0gb3B0aW9ucy5zZW5kZXIgfHwgdGhpcy5fc2VuZGVySWQ7XG4gIChwb3J0IHx8IHRoaXMuX3BvcnQgfHwgdGhpcy5wb3J0c1t0aGlzLm1haW5UeXBlXSkucG9zdE1lc3NhZ2Uob3B0aW9ucyk7XG59O1xuXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gbXZlbG87XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvbXZlbG8uanMiLCIvKipcbiAqIENvcHlyaWdodCAoQykgMjAxNiBNYWlsdmVsb3BlIEdtYkhcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBHTlUgQWZmZXJvIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdmVyc2lvbiAzXG4gKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCAqIGFzIGwxMG4gZnJvbSAnLi4vLi4vLi4vbGliL2wxMG4nO1xuXG4ndXNlIHN0cmljdCc7XG5cbmwxMG4ucmVnaXN0ZXIoW1xuICAndXBsb2FkX2F0dGFjaG1lbnQnLFxuICAnZWRpdG9yX3NpZ25fY2FwdGlvbl9zaG9ydCcsXG4gICdlZGl0b3Jfc2lnbl9jYXB0aW9uX2xvbmcnLFxuICAnZWRpdG9yX25vX3ByaW1hcnlfa2V5X2NhcHRpb25fc2hvcnQnLFxuICAnZWRpdG9yX25vX3ByaW1hcnlfa2V5X2NhcHRpb25fbG9uZycsXG4gICdlZGl0b3JfbGlua19maWxlX2VuY3J5cHRpb24nXG5dKTtcblxuY2xhc3MgRWRpdG9yRm9vdGVyIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcyk7XG4gICAgdGhpcy5oYW5kbGVDbGlja1VwbG9hZCA9IHRoaXMuaGFuZGxlQ2xpY2tVcGxvYWQuYmluZCh0aGlzKTtcbiAgfVxuXG4gIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgIHRoaXMuaW5pdFRvb2x0aXAoKTtcbiAgfVxuXG4gIGNvbXBvbmVudERpZFVwZGF0ZSgpIHtcbiAgICB0aGlzLmluaXRUb29sdGlwKCk7XG4gIH1cblxuICBpbml0VG9vbHRpcCgpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5zaWduTXNnKSB7XG4gICAgICAkKHRoaXMuc2lnbkNhcHRpb24pLnRvb2x0aXAoKTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVDbGlja1VwbG9hZCgpIHtcbiAgICAkKCcjYWRkRmlsZUlucHV0JykuY2xpY2soKTtcbiAgICB0aGlzLnByb3BzLm9uQ2xpY2tVcGxvYWQoKTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICBjb25zdCBzaWduX2NhcHRpb25fc2hvcnQgPSB0aGlzLnByb3BzLnByaW1hcnlLZXkgPyBsMTBuLm1hcC5lZGl0b3Jfc2lnbl9jYXB0aW9uX3Nob3J0IDogbDEwbi5tYXAuZWRpdG9yX25vX3ByaW1hcnlfa2V5X2NhcHRpb25fc2hvcnQ7XG4gICAgY29uc3Qgc2lnbl9jYXB0aW9uX2xvbmcgPSB0aGlzLnByb3BzLnByaW1hcnlLZXkgPyBsMTBuLm1hcC5lZGl0b3Jfc2lnbl9jYXB0aW9uX2xvbmcgOiBsMTBuLm1hcC5lZGl0b3Jfbm9fcHJpbWFyeV9rZXlfY2FwdGlvbl9sb25nO1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvcm0tZ3JvdXAgcHVsbC1sZWZ0XCI+XG4gICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXt0aGlzLmhhbmRsZUNsaWNrVXBsb2FkfSBjbGFzc05hbWU9e2BidG4gYnRuLWRlZmF1bHQgYnRuLXVwbG9hZC1lbWJlZGRlZCAke3RoaXMucHJvcHMuZW1iZWRkZWQgPyAnc2hvdycgOiAnaGlkZSd9YH0+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJnbHlwaGljb24gZ2x5cGhpY29uLXBhcGVyY2xpcFwiPjwvc3Bhbj4mbmJzcDtcbiAgICAgICAgICAgIDxzcGFuPntsMTBuLm1hcC51cGxvYWRfYXR0YWNobWVudH08L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGlucHV0IHR5cGU9XCJmaWxlXCIgaWQ9XCJhZGRGaWxlSW5wdXRcIiBtdWx0aXBsZT1cIm11bHRpcGxlXCIgb25DaGFuZ2U9e3RoaXMucHJvcHMub25DaGFuZ2VGaWxlSW5wdXR9Lz5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm5hdi1saW5rLWZpbGUtZW5jcnlwdGlvblwiPlxuICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBjbGFzc05hbWU9eyF0aGlzLnByb3BzLmVtYmVkZGVkID8gJ3Nob3cnIDogJ2hpZGUnfSBvbkNsaWNrPXtlID0+IHsgZS5wcmV2ZW50RGVmYXVsdCgpOyB0aGlzLnByb3BzLm9uQ2xpY2tGaWxlRW5jcnlwdGlvbigpOyB9fT57bDEwbi5tYXAuZWRpdG9yX2xpbmtfZmlsZV9lbmNyeXB0aW9ufTwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHVsbC1yaWdodFwiPlxuICAgICAgICAgIDxzcGFuIHJlZj17bm9kZSA9PiB0aGlzLnNpZ25DYXB0aW9uID0gbm9kZX0gY2xhc3NOYW1lPXtgdHh0LWRpZ2l0YWwtc2lnbmF0dXJlICR7dGhpcy5wcm9wcy5zaWduTXNnID8gJ3Nob3cnIDogJ2hpZGUnfWB9XG4gICAgICAgICAgICAgICAgZGF0YS10b2dnbGU9XCJ0b29sdGlwXCIgZGF0YS1wbGFjZW1lbnQ9XCJsZWZ0XCIgdGl0bGU9e3NpZ25fY2FwdGlvbl9sb25nfT5cbiAgICAgICAgICAgIHtzaWduX2NhcHRpb25fc2hvcnR9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH1cbn1cblxuRWRpdG9yRm9vdGVyLnByb3BUeXBlcyA9IHtcbiAgZW1iZWRkZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLCAvLyBjb21wb25lbnQgaXMgdXNlZCBpbnNpZGUgQVBJIGNvbnRhaW5lciB2aWV3XG4gIHNpZ25Nc2c6IFJlYWN0LlByb3BUeXBlcy5ib29sLCAvLyBtZXNzYWdlIHdpbGwgYmUgc2lnbmVkXG4gIHByaW1hcnlLZXk6IFJlYWN0LlByb3BUeXBlcy5ib29sLCAvLyBwcmltYXJ5IGtleSB0byBzaWduIG1lc3NhZ2UgZXhpc3RzXG4gIG9uQ2xpY2tVcGxvYWQ6IFJlYWN0LlByb3BUeXBlcy5mdW5jLCAvLyBjbGljayBvbiB1cGxvYWQgYnV0dG9uXG4gIG9uQ2hhbmdlRmlsZUlucHV0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYywgLy8gZmlsZSBpbnB1dCBjaGFuZ2UgZXZlbnQgdHJpZ2dlcmVkXG4gIG9uQ2xpY2tGaWxlRW5jcnlwdGlvbjogUmVhY3QuUHJvcFR5cGVzLmZ1bmMgLy8gY2xpY2sgb24gbmF2aWdhdGlvbiBsaW5rXG59XG5cbmV4cG9ydCBkZWZhdWx0IEVkaXRvckZvb3RlcjtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9jb21wb25lbnRzL2VkaXRvci9jb21wb25lbnRzL0VkaXRvckZvb3Rlci5qcyIsIlxuaW1wb3J0IG12ZWxvIGZyb20gJy4uL212ZWxvJztcblxudmFyIG1hcCA9IHt9O1xuXG5mdW5jdGlvbiByZWdpc3RlcihpZHMpIHtcbiAgaWRzLmZvckVhY2goZnVuY3Rpb24oaWQpIHtcbiAgICBtYXBbaWRdID0gdHJ1ZTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG1hcFRvTG9jYWwoKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlKSB7XG4gICAgbXZlbG8ubDEwbi5nZXRNZXNzYWdlcyhPYmplY3Qua2V5cyhtYXApLCAobG9jYWxpemVkKSA9PiB7XG4gICAgICBtYXAgPSBsb2NhbGl6ZWQ7XG4gICAgICByZXNvbHZlKCk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5leHBvcnQgeyBtYXAsIHJlZ2lzdGVyLCBtYXBUb0xvY2FsIH07XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvbGliL2wxMG4uanMiLCIvKipcbiAqIENvcHlyaWdodCAoQykgMjAxNiBNYWlsdmVsb3BlIEdtYkhcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBHTlUgQWZmZXJvIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdmVyc2lvbiAzXG4gKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCAqIGFzIGwxMG4gZnJvbSAnLi4vLi4vLi4vbGliL2wxMG4nO1xuXG4ndXNlIHN0cmljdCc7XG5cbmwxMG4ucmVnaXN0ZXIoW1xuICAnZm9ybV9jYW5jZWwnLFxuICAnZWRpdG9yX3NpZ25fYnV0dG9uJyxcbiAgJ2VkaXRvcl9lbmNyeXB0X2J1dHRvbicsXG4gICdvcHRpb25zX2hvbWUnLFxuICAnc2lnbl9kaWFsb2dfaGVhZGVyJyxcbiAgJ2dlbmVyYWxfcHJpbWFyeV9rZXlfYXV0b19zaWduJ1xuXSk7XG5cbmNsYXNzIEVkaXRvck1vZGFsRm9vdGVyIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcyk7XG4gIH1cblxuICBzaWduU2VsZWN0aW9uKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBjbGFzc05hbWU9XCJzaWduLW1zZy1vcHRpb24gd2VsbFwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvcm0tZ3JvdXBcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNoZWNrYm94XCI+XG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiY2hlY2tib3hcIiBodG1sRm9yPVwic2lnbk1zZ1wiPlxuICAgICAgICAgICAgICA8aW5wdXQgY2hlY2tlZD17dGhpcy5wcm9wcy5zaWduTXNnfSBvbkNoYW5nZT17ZXZlbnQgPT4gdGhpcy5wcm9wcy5vbkNoYW5nZVNpZ25Nc2coZXZlbnQudGFyZ2V0LmNoZWNrZWQpfSB0eXBlPVwiY2hlY2tib3hcIiBpZD1cInNpZ25Nc2dPcHRpb25cIiAvPlxuICAgICAgICAgICAgICA8c3Bhbj57bDEwbi5tYXAuc2lnbl9kaWFsb2dfaGVhZGVyfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvcm0tZ3JvdXBcIj5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT1cImZvcm0tY29udHJvbFwiIHZhbHVlPXt0aGlzLnByb3BzLnNpZ25LZXl9IG9uQ2hhbmdlPXtldmVudCA9PiB0aGlzLnByb3BzLm9uQ2hhbmdlU2lnbktleShldmVudC50YXJnZXQudmFsdWUpfT5cbiAgICAgICAgICAgIHt0aGlzLnByb3BzLnByaXZLZXlzLm1hcChrZXkgPT4gPG9wdGlvbiB2YWx1ZT17a2V5LmlkfSBrZXk9e2tleS5pZH0+e2tleS51c2VySWQgKyAnIC0gJyArIGtleS5pZH08L29wdGlvbj4pfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmb3JtLW5hdi1saW5rIHB1bGwtcmlnaHRcIj5cbiAgICAgICAgICA8YSBocmVmPVwiI1wiIG9uQ2xpY2s9e2UgPT4geyBlLnByZXZlbnREZWZhdWx0KCk7IHRoaXMucHJvcHMub25DbGlja1NpZ25TZXR0aW5nKCk7IH19PntsMTBuLm1hcC5nZW5lcmFsX3ByaW1hcnlfa2V5X2F1dG9fc2lnbn08L2E+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9mb3JtPlxuICAgICk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+XG4gICAgICAgIHt0aGlzLnByb3BzLmV4cGFuZGVkICYmIHRoaXMuc2lnblNlbGVjdGlvbigpfVxuICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3RoaXMucHJvcHMuZXhwYW5kZWQgPyB0aGlzLnByb3BzLm9uQ29sbGFwc2UgOiB0aGlzLnByb3BzLm9uRXhwYW5kfSBjbGFzc05hbWU9XCJidG4gYnRuLWRlZmF1bHQgYnRuLXNtIHB1bGwtbGVmdFwiPlxuICAgICAgICAgIDxzcGFuPntsMTBuLm1hcC5vcHRpb25zX2hvbWV9PC9zcGFuPiZuYnNwOyZuYnNwO1xuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YGdseXBoaWNvbiBnbHlwaGljb24tY29sbGFwc2UtJHt0aGlzLnByb3BzLmV4cGFuZGVkID8gJ2Rvd24nIDogJ3VwJ31gfSBhcmlhLWhpZGRlbj1cInRydWVcIj48L3NwYW4+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3RoaXMucHJvcHMub25TaWduT25seX0gY2xhc3NOYW1lPVwiYnRuIGJ0bi1kZWZhdWx0IGJ0bi1zbSBidG4tc2lnbi1vbmx5XCIgZGlzYWJsZWQ9eyEodGhpcy5wcm9wcy5zaWduTXNnICYmIHRoaXMucHJvcHMucHJpdktleXMubGVuZ3RoKX0+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1wZW5jaWxcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L3NwYW4+Jm5ic3A7XG4gICAgICAgICAgPHNwYW4+e2wxMG4ubWFwLmVkaXRvcl9zaWduX2J1dHRvbn08L3NwYW4+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3RoaXMucHJvcHMub25DYW5jZWx9IGNsYXNzTmFtZT1cImJ0biBidG4tZGVmYXVsdFwiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImdseXBoaWNvbiBnbHlwaGljb24tcmVtb3ZlXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9zcGFuPiZuYnNwO1xuICAgICAgICAgIDxzcGFuPntsMTBuLm1hcC5mb3JtX2NhbmNlbH08L3NwYW4+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3RoaXMucHJvcHMub25FbmNyeXB0fSBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnlcIiBkaXNhYmxlZD17dGhpcy5wcm9wcy5lbmNyeXB0RGlzYWJsZWR9PlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImdseXBoaWNvbiBnbHlwaGljb24tbG9ja1wiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvc3Bhbj4mbmJzcDtcbiAgICAgICAgICA8c3Bhbj57bDEwbi5tYXAuZWRpdG9yX2VuY3J5cHRfYnV0dG9ufTwvc3Bhbj5cbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG59XG5cbkVkaXRvck1vZGFsRm9vdGVyLnByb3BUeXBlcyA9IHtcbiAgb25DYW5jZWw6IFJlYWN0LlByb3BUeXBlcy5mdW5jLCAvLyBjbGljayBvbiBjYW5jZWwgYnV0dG9uXG4gIG9uU2lnbk9ubHk6IFJlYWN0LlByb3BUeXBlcy5mdW5jLCAvLyBjbGljayBvbiBzaWduIG9ubHkgYnV0dG9uXG4gIG9uRW5jcnlwdDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsIC8vIGNsaWNrIG9uIGVuY3J5cHQgYnV0dG9uXG4gIGVuY3J5cHREaXNhYmxlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsIC8vIGVuY3J5cHQgYWN0aW9uIGRpc2FibGVkXG4gIG9uRXhwYW5kOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYywgLy8gY2xpY2sgb24gb3B0aW9ucyBidXR0b24gaW4gY29sbGFwc2VkIHN0YXRlXG4gIG9uQ29sbGFwc2U6IFJlYWN0LlByb3BUeXBlcy5mdW5jLCAvLyBjbGljayBvbiBvcHRpb25zIGJ1dHRvbiBpbiBleHBhbmRlZCBzdGF0ZVxuICBleHBhbmRlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsIC8vIGV4cGFuZGVkIHN0YXRlXG4gIHNpZ25Nc2c6IFJlYWN0LlByb3BUeXBlcy5ib29sLCAvLyBzaWduIG1lc3NhZ2UgaW5kaWNhdG9yXG4gIG9uQ2hhbmdlU2lnbk1zZzogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsIC8vIHJlY2VpdmVzIGJvb2wgdmFsdWUgZm9yIGN1cnJlbnQgc2lnbk1zZyBzdGF0ZVxuICBzaWduS2V5OiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLCAvLyBzaWduIGtleSBpZFxuICBwcml2S2V5czogUmVhY3QuUHJvcFR5cGVzLmFycmF5LCAvLyBsaXN0IG9mIHByaXZhdGUga2V5cyBmb3Igc2lnbmluZ1xuICBvbkNoYW5nZVNpZ25LZXk6IFJlYWN0LlByb3BUeXBlcy5mdW5jLCAvLyB1c2VyIHNlbGVjdHMgbmV3IGtleVxuICBvbkNsaWNrU2lnblNldHRpbmc6IFJlYWN0LlByb3BUeXBlcy5mdW5jIC8vIGNsaWNrIG9uIG5hdmlnYXRpb24gbGlua1xufVxuXG5leHBvcnQgZGVmYXVsdCBFZGl0b3JNb2RhbEZvb3RlcjtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9jb21wb25lbnRzL2VkaXRvci9jb21wb25lbnRzL0VkaXRvck1vZGFsRm9vdGVyLmpzIiwiLyoqXG4gKiBDb3B5cmlnaHQgKEMpIDIwMTYgTWFpbHZlbG9wZSBHbWJIXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgR05VIEFmZmVybyBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIHZlcnNpb24gM1xuICovXG5cbmltcG9ydCBtdmVsbyBmcm9tICcuLi9tdmVsbyc7XG5pbXBvcnQgKiBhcyBsMTBuIGZyb20gJy4vbDEwbic7XG5cbid1c2Ugc3RyaWN0JztcblxuXG5sMTBuLnJlZ2lzdGVyKFtcbiAgJ2VkaXRvcl9yZW1vdmVfdXBsb2FkJyxcbiAgJ2VuY3J5cHRfZG93bmxvYWRfZmlsZV9idXR0b24nXG5dKTtcblxuLyoqXG4gKiBAcGFyYW0ge0ZpbGV9IGZpbGVcbiAqIEBwYXJhbSB7TnVtYmVyfSBmaWxlLnNpemVcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNPdmVyc2l6ZShmaWxlKSB7XG4gIHJldHVybiBmaWxlLnNpemUgPj0gbXZlbG8uTUFYRklMRVVQTE9BRFNJWkU7XG59XG5cbi8qKlxuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEZpbGVTaXplKCRmaWxlTGlzdCkge1xuICB2YXIgY3VycmVudEF0dGFjaG1lbnRzU2l6ZSA9IDA7XG4gICRmaWxlTGlzdC5maW5kKCcuYXR0YWNobWVudEJ1dHRvbicpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgY3VycmVudEF0dGFjaG1lbnRzU2l6ZSArPSAkKHRoaXMpLmRhdGEoJ2ZpbGUnKS5zaXplO1xuICB9KTtcbiAgcmV0dXJuIGN1cnJlbnRBdHRhY2htZW50c1NpemU7XG59XG5cbi8qKlxuICogQHBhcmFtIHtGaWxlfSBmaWxlXG4gKiBAcGFyYW0ge051bWJlcn0gZmlsZS5sYXN0TW9kaWZpZWRcbiAqIEBwYXJhbSB7RGF0ZX0gZmlsZS5sYXN0TW9kaWZpZWREYXRlXG4gKiBAcGFyYW0ge1N0cmluZ30gZmlsZS5uYW1lXG4gKiBAcGFyYW0ge051bWJlcn0gZmlsZS5zaXplXG4gKiBAcGFyYW0ge1N0cmluZ30gZmlsZS50eXBlXG4gKiBAcGFyYW0ge1N0cmluZ30gZmlsZS53ZWJraXRSZWxhdGl2ZVBhdGhcbiAqIEBwYXJhbSB7RnVudGlvbn0gb25Mb2FkRW5kXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxPYmplY3QsIEVycm9yPn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRVcGxvYWRGaWxlKGZpbGUsIG9uTG9hZEVuZCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdmFyIGZpbGVSZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgIGZpbGVSZWFkZXIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXNvbHZlKHtcbiAgICAgICAgY29udGVudDogdGhpcy5yZXN1bHQsXG4gICAgICAgIGlkOiBtdmVsby51dGlsLmdldEhhc2goKSxcbiAgICAgICAgbmFtZTogZmlsZS5uYW1lLFxuICAgICAgICBzaXplOiBmaWxlLnNpemUsXG4gICAgICAgIHR5cGU6IGZpbGUudHlwZVxuICAgICAgfSk7XG4gICAgfTtcbiAgICBmaWxlUmVhZGVyLm9ubG9hZGVuZCA9IG9uTG9hZEVuZDtcbiAgICBmaWxlUmVhZGVyLm9uYWJvcnQgPSBmdW5jdGlvbihldnQpIHtcbiAgICAgIHJlamVjdChldnQpO1xuICAgIH07XG4gICAgZmlsZVJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZpbGVFbGVtZW50KGZpbGUsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHZhciAkYnV0dG9uID0gJCgnPGRpdi8+Jywge1xuICAgIFwidGl0bGVcIjogZmlsZS5uYW1lLFxuICAgIFwiY2xhc3NcIjogJ2F0dGFjaG1lbnRCdXR0b24nXG4gIH0pO1xuICAkYnV0dG9uLmRhdGEoJ2ZpbGUnLCBmaWxlKTtcbiAgJGJ1dHRvbi5hcHBlbmQoZ2V0RXh0ZW5zaW9uSWNvbihmaWxlKSk7XG4gICRidXR0b24uYXBwZW5kKGdldEZpbGVOYW1lKGZpbGUpKTtcbiAgaWYgKG9wdGlvbnMuc2VjdXJlSWNvbikge1xuICAgICRidXR0b24uYXBwZW5kKGdldFNlY3VyZUljb24oKSk7XG4gIH1cbiAgaWYgKG9wdGlvbnMucmVtb3ZlQnV0dG9uKSB7XG4gICAgJGJ1dHRvbi5hcHBlbmQoZ2V0UmVtb3ZlQnV0dG9uKG9wdGlvbnMub25SZW1vdmUpKTtcbiAgfVxuICByZXR1cm4gJGJ1dHRvbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZpbGVEb3dubG9hZEVsZW1lbnQoZmlsZSwgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgdmFyICRidXR0b24gPSAkKCc8YS8+Jywge1xuICAgIFwidGl0bGVcIjogZmlsZS5uYW1lLFxuICAgIFwiZG93bmxvYWRcIjogZmlsZS5uYW1lLFxuICAgIFwiY2xhc3NcIjogJ2F0dGFjaG1lbnRCdXR0b24nLFxuICAgIFwiaHJlZlwiOiBkb3dubG9hZEF0dGFjaG1lbnQoZmlsZSlcbiAgfSk7XG4gICRidXR0b24uYXBwZW5kKGdldEV4dGVuc2lvbkljb24oZmlsZSkpO1xuICAkYnV0dG9uLmFwcGVuZChnZXRGaWxlTmFtZShmaWxlKSk7XG4gIGlmIChvcHRpb25zLnNlY3VyZUljb24pIHtcbiAgICAkYnV0dG9uLmFwcGVuZChnZXRTZWN1cmVJY29uKCkpO1xuICB9XG4gICRidXR0b24uYXBwZW5kKGdldERvd25sb2FkQnV0dG9uKCkpO1xuICByZXR1cm4gJGJ1dHRvbjtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0ZpbGV9IGZpbGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaWxlLm5hbWVcbiAqIEByZXR1cm5zIHsqfGpRdWVyeX1cbiAqL1xuZnVuY3Rpb24gZ2V0RmlsZU5hbWUoZmlsZSkge1xuICB2YXIgZmlsZU5hbWVOb0V4dCA9IG12ZWxvLnV0aWwuZXh0cmFjdEZpbGVOYW1lV2l0aG91dEV4dChmaWxlLm5hbWUpO1xuXG4gIHJldHVybiAkKCc8c3Bhbi8+Jywge1xuICAgIFwiY2xhc3NcIjogJ2F0dGFjaG1lbnRGaWxlbmFtZSdcbiAgfSkudGV4dChmaWxlTmFtZU5vRXh0KTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0ZpbGV9IGZpbGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaWxlLmlkXG4gKiBAcmV0dXJucyB7KnxqUXVlcnl9XG4gKi9cbmZ1bmN0aW9uIGdldERvd25sb2FkQnV0dG9uKCkge1xuICByZXR1cm4gJCgnPHNwYW4vPicsIHtcbiAgICBcInRpdGxlXCI6IGwxMG4ubWFwLmVuY3J5cHRfZG93bmxvYWRfZmlsZV9idXR0b24sXG4gICAgXCJjbGFzc1wiOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1zYXZlIHNhdmVBdHRhY2htZW50J1xuICB9KTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBvblJlbW92ZVxuICogQHJldHVybnMgeyp8alF1ZXJ5fVxuICovXG5mdW5jdGlvbiBnZXRSZW1vdmVCdXR0b24ob25SZW1vdmUpIHtcbiAgcmV0dXJuICQoJzxzcGFuLz4nLCB7XG4gICAgXCJ0aXRsZVwiOiBsMTBuLm1hcC5lZGl0b3JfcmVtb3ZlX3VwbG9hZCxcbiAgICBcImNsYXNzXCI6ICdnbHlwaGljb24gZ2x5cGhpY29uLXJlbW92ZSByZW1vdmVBdHRhY2htZW50J1xuICB9KS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgaWYgKG9uUmVtb3ZlKSB7XG4gICAgICBvblJlbW92ZSgpO1xuICAgIH1cbiAgICAkKHRoaXMpLnBhcmVudCgpLnJlbW92ZSgpO1xuICB9KTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0ZpbGV9IGZpbGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaWxlLm5hbWVcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaWxlLmlkXG4gKiBAcmV0dXJucyB7KnxqUXVlcnl9XG4gKi9cbmZ1bmN0aW9uIGdldEV4dGVuc2lvbkljb24oZmlsZSkge1xuICB2YXIgZmlsZUV4dCA9IG12ZWxvLnV0aWwuZXh0cmFjdEZpbGVFeHRlbnNpb24oZmlsZS5uYW1lKTtcbiAgaWYgKCFmaWxlRXh0KSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG4gIHZhciBleHRDbGFzcyA9IG12ZWxvLnV0aWwuZ2V0RXh0ZW5zaW9uQ2xhc3MoZmlsZUV4dCk7XG5cbiAgcmV0dXJuICQoJzxzcGFuLz4nLCB7XG4gICAgXCJjbGFzc1wiOiAnYXR0YWNobWVudEV4dGVuc2lvbiAnICsgZXh0Q2xhc3NcbiAgfSkudGV4dChmaWxlRXh0KTtcbn1cblxuLyoqXG4gKiBAcmV0dXJucyB7KnxqUXVlcnl8SFRNTEVsZW1lbnR9XG4gKi9cbmZ1bmN0aW9uIGdldFNlY3VyZUljb24oKSB7XG4gIHJldHVybiAkKCc8c3Bhbi8+Jywge1xuICAgICdjbGFzcyc6ICdnbHlwaGljb24gZ2x5cGhpY29uLWxvY2sgc2VjdXJlLWljb24nXG4gIH0pO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7RmlsZX0gZmlsZVxuICogQHBhcmFtIHtTdHJpbmd9IGZpbGUuY29udGVudFxuICogQHBhcmFtIHtTdHJpbmd9IGZpbGUudHlwZVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZG93bmxvYWRBdHRhY2htZW50KGZpbGUpIHtcbiAgdmFyIGNvbnRlbnQgPSBtdmVsby51dGlsLnN0cjJhYihmaWxlLmNvbnRlbnQpO1xuICB2YXIgYmxvYiA9IG5ldyBCbG9iKFtjb250ZW50XSwgeyB0eXBlOiBmaWxlLnR5cGUgfSk7XG5cbiAgcmV0dXJuIHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xufVxuXG4vKipcbiAqIEByZXR1cm5zIHtPYmplY3R9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRGaWxlcygkZmlsZUxpc3QpIHtcbiAgdmFyIGZpbGVzID0gW107XG4gICRmaWxlTGlzdC5maW5kKCcuYXR0YWNobWVudEJ1dHRvbicpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgZmlsZXMucHVzaCgkKHRoaXMpLmRhdGEoJ2ZpbGUnKSk7XG4gIH0pO1xuICByZXR1cm4gZmlsZXM7XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvbGliL2ZpbGUuanMiXSwic291cmNlUm9vdCI6IiJ9