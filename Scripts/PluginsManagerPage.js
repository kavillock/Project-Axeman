﻿// Initialize GA
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-33221456-3']);
_gaq.push(['_trackPageview']);

(function () {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = 'https://ssl.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

$(document).ready(function () {
	$.each(
		GlobalPluginsList,
		function (index, obj) {
			if (obj.Flags.Internal && !IsDevelopmentMode) {
				console.warn("PluginsManagerPage: Internal plugin [" + obj.Name + "] ");
				return true;
			}

			drawTable(obj);
			actionTable(obj);
		}
	);
	//$( ".Container" ).tabs({ fx: {opacity: 'toggle', duration: 300} });
});

function drawTable(obj) {
	if ($("." + obj.Category).length == 0) 
		$("#PluginsTable").append("<div class='PluginCat " + obj.Category + "'><h1>" + obj.Category + "</h1></div>");

	//if ($("." + obj.Category).length == 0) {
		//$(".Container ul").append('<li><a href="#'+obj.Category+'">'+obj.Category+'</a></li>');
		//$(".Container").append("<div id='"+obj.Category+"' class='PluginCat "+obj.Category+"'></div>");
	//}

	// Build plugin object
	var pluginItem = "\
		<div class='PluginItem" + (obj.Flags.Alpha ? " AlphaFlag" : "") + (obj.Flags.Beta ? " BetaFlag" : "") + "'>\
			<div style='float:left;' class='PluginOptions'>\
				<div>\
					<img id='PluginImage" + obj.Name + "' src='" + GetPluginImage(obj) + "' alt='&lt;" + obj.Alias + "&gt;' />\
				</div>\
				<div>\
					<input id='PluginActive" + obj.Name + "' type='checkbox' class='ui-helper-hidden-accessible'" + (obj.Settings.Changeable ? "" : "disabled")+"/>\
					<label id='PluginActiveLabel" + obj.Name + "' for='PluginActive" + obj.Name + "' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only' role='button' aria-disabled='false' />\
				</div>\
			</div>\
			<div style='float:right;' class='PluginInfo'>\
				<div>\
					<div style='float:left;'>" + obj.Alias + "</div>\
					<div style='float:right;' class='PluginVersion'>(" + obj.Version + ")</div>\
					<br style='clear:both;'>\
				</div>\
				<div class='PluginDescription'>\
					<p>" + obj.Description + "</p>\
				</div>\
				<div class='PluginAuthor'>\
					<div style='float:left;'>" + obj.Author + "</div>\
					<div style='float:right;'><a target='_blank' href='" + obj.Site + "'>More info...</a></div>\
					<br style='clear:both;'>\
				</div>\
			</div>\
			<br style='clear:both;'>\
		</div>";

	// Insert plugin to correct category
	$("." + obj.Category).append(pluginItem);
}

function actionTable(obj) {
	// Sets flags
	// NOTE Not yet supported
	//if (obj.Flags.Internal == true) $("#PluginItem").addClass("InternalFlag");
	//if (obj.Flags.Featured == true) $("#PluginItem").addClass("FeaturedFlag");

	// Gets active state
	var activeState = getActiveState(obj);
	
	// Assigns that state to control
	if (activeState == "On") $("#PluginActive" + obj.Name).attr("checked", true);
	else $("#PluginActive" + obj.Name).attr("checked", false);

	// On click event
	$("#PluginActive" + obj.Name).button().click(function () {
		var nextState = $("#PluginActiveLabel" + obj.Name + " span").text() == "On" ? "Off" : "On";
		$("#PluginActiveLabel" + obj.Name + " span").text(nextState == "On" ? "On" : "Off");
		$("#PluginImage" + obj.Name).attr("class", (nextState == "On" ? " " : "Disabled"));
		localStorage.setItem("IsPluginActive" + obj.Name, JSON.stringify({ State: nextState }));
	});
	
	// Is plugin Changeable
	if(!obj.Settings.Changeable) localStorage.setItem("IsPluginActive" + obj.Name, JSON.stringify({ State: obj.Default.State }));

	// Activate initial control state
	$("#PluginActiveLabel" + obj.Name + " span").text(activeState == "On" ? "On" : "Off");
	$("#PluginImage" + obj.Name).attr("class", (activeState == "On" ? " " : "Disabled"));
}

function getActiveState(obj) {
	var activeState = null;

	var stateObject = JSON.parse(localStorage.getItem("IsPluginActive" + obj.Name));
	if (stateObject === null) {
		activeState = obj.Default.State;
		localStorage.setItem("IsPluginActive" + obj.Name, JSON.stringify({ State: activeState }));
	}
	else activeState = stateObject.State;
	
	return activeState;
}