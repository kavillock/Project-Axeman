/******************************************************************************
 *
 * Helpers.js
 * 
 * Author:
 * 		Aleksandar Toplek,
 *
 * Created on:
 * 		25.02.2012.
 *
 *****************************************************************************/


function GetImageURL(category, filename) {
	/// <summary>
	/// Gets chrome extension URL of given image filename and category
	/// </summary>
	/// <param name="category">Category of image</param>
	/// <param name="filename">Filename of image (must include extension)</param>
	/// <returns>String URL of image with given filename in given category</returns>

	return GetURL("Images/" + category + "/" + filename);
};

function GetURL(path) {
	/// <summary>
	/// Gets chrome extension URL of given path
	/// </summary>
	/// <param name="path">Path of URL</param>
	/// <returns>String URL to given path</returns>

	return chrome.extension.getURL(path);
};

function GetPluginImage(metadata) {
	/// <summary>
	/// Gets specified plugin image URL
	/// </summary>
	/// <param name="metadata">Metadata of plugin</param>
	/// <returns>String URL of image for specified plugin</returns>

	return GetURL("Plugins/" + metadata.Category + "/" + metadata.Name + "/Image.png");
};

function MatchPages() {
	/// <summary>
	/// Matches current active page with given pages
	/// </summary>
	/// <returns>True if there was current active page passed as argument</returns>

	for (var index = 0; index < arguments.length; index++) {
		if (arguments[index] == Enums.TravianPages[ActivePage]) {
			return true;
		}
	}

	return false;
};

function Error(message) {
	/// <summary>
	/// Writes console error message
	/// This only works if development mode is set to true
	/// </summary>
	/// <param name="message">Message to write</param>

	if (IsDevelopmentMode) {
		var category = arguments[1] !== undefined ? arguments[1] + ": " : "";
		console.error(category + message);
		
		(new Request("ConsoleOutput", "Error", null, { Message: message, Category: arguments[1] })).Send();
	}
};

function Warn(message) {
	/// <summary>
	/// Writes console warning message
	/// This only works if development mode is set to true
	/// </summary>
	/// <param name="message">Message to write</param>

	if (IsDevelopmentMode) {
		var category = arguments[1] !== undefined ? arguments[1] + ": " : "";
		console.warn(category + message);
		
		(new Request("ConsoleOutput", "Warning", null, { Message: message, Category: arguments[1] })).Send();
	}
};

function Log(message) {
	/// <summary>
	/// Writes console message
	/// This only works if development mode is set to true
	/// </summary>
	/// <param name="message">Message to write</param>

	if (IsDevelopmentMode) {
		var category = arguments[1] !== undefined ? arguments[1] + ": " : "";
		console.log(category + message);
		
		(new Request("ConsoleOutput", "Log", null, { Message: message, Category: arguments[1] })).Send();
	}
};

function DLog(message) {
	/// <summary>
	/// Writes console Debug message
	/// This only works if debug and development modes are set to true
	/// </summary>
	/// <param name="message">Message to write</param>

	if (IsDebugMode == true && IsDevelopmentMode == true) {
		var category = arguments[1] !== undefined ? arguments[1] + ": " : "";
		console.log(category + message);
		
		(new Request("ConsoleOutput", "Debug", null, { Message: message, Category: arguments[1] })).Send();
	}
};

function DebugObj(obj) {
	/// <summary>
	/// Writes and warning containing a copy of given object
	/// </summary>
	/// <param name="obj">Object to debug</param>

	Warn(JSON.parse(JSON.stringify(obj)));
};


function GetKeyByValue(obj, value) {
	/// <summary>
	/// Gets key by searching for given value in array/object
	/// </summary>
	/// <param name="obj">Objetct or Array to get keys and values from</param>
	/// <param name="value">First value for which to find key</param>
	/// <returns>Object representing key of given value</returns>

	for (var prop in obj) {
		if (obj.hasOwnProperty(prop)) {
			if (obj[prop] === value)
				return prop;
		}
	}
};

function ArrayAdd(array, obj) {
	/// <summary>
	/// Adds object to end of array
	/// </summary>
	/// <param name="array">Array to which to add object to</param>
	/// <param name="obj">Object to add</param>

	if (!array) return;

	array[array.length] = obj;
};

function IsNullOrEmpty(obj) {
	/// <summary>
	/// Checks if object is null or empty
	/// </summary>
	/// <param name="obj">Object to check</param>
	/// <returns>True of object eveluetes as null or empty (obj.length == 0)</returns>

	return obj == null || !obj || obj.length == 0;
};

function ConvertTimeToHours(time) {
	/**
	 * Transforms given time string into hours number
	 *
	 * @author Aleksandar Toplek
	 *
	 * @param {String} time     Time as string
	 *
	 * @return {Number} Hours as number
	 *                  For input [02:19:59] output would be [2.333055555555556]
	 */

	var split = time.split(":");

	var hours = parseInt(split[0], 10) + (parseInt(split[1], 10) / 60) + (parseInt(split[2], 10) / 3600);

	return hours;
};

function ConvertSecondsToTime(seconds) {
	// TODO Comment

	var hours = Math.floor(seconds / 3600);
	var minutes = Math.floor((seconds - hours * 3600) / 60);
	var seconds = Math.floor(seconds - minutes * 60 - hours * 3600);

	return hours.PadLeft(2) + ":" +
			minutes.PadLeft(2) + ":" +
			seconds.PadLeft(2);
};

Number.prototype.PadLeft = function (length, digit) {
	// TODO Comment

	var str = '' + this;

	while (str.length < length) {
		str = (digit || '0') + str;
	}

	return str;
};

function EnsureParams(object, required) {
	// TODO implement
	for (var index = 0; index < args.length; index++) {
		console.warn(args[index]);
	}
};