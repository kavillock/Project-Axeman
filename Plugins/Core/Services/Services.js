﻿/******************************************************************************
 * Services.js
 * 
 * Author:
 * 		Aleksandar Toplek (AleksandarDev)
 *
 * Created on:
 * 		28.06.2012.
 *
 * Notes:
 *
 *****************************************************************************/

// Google analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-33221456-3']);
_gaq.push(['_trackEvent', 'Plugin', 'Core/Services']);

(function () {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = 'https://ssl.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();


// <summary>
// Plugin that takes care of all built-in models (fill and update), refreshes page and changes views randomly.
// </summary>
function Services() {

	// <summary>
	// Registers plugin 
	// </summary>
	this.Register = function () {
		Log("Services: Initializing...");

		// Call service methods
		ProcessIsLogedIn();
		ProcessProfiles();
		CrawlPage();
		UpdateProfile();
		// TODO Request refresh
	};

	var CrawlPage = function () {
		// <summary>
		// This function will crawl current page and get all available
		// data from it and save it to current profile
		// </summary>

		// Nothing to crawl is user is loged off
		if (!IsLogedIn) return;

		if (!MatchPages(
			Enums.TravianPages.Home,
			Enums.TravianPages.Login,
			Enums.TravianPages.Logout)) {

			Log("Crawling page...", "Services");

			CrawlVillageList();
			CrawlStorage();
			CrawlProduction();
			CrawlLoyalty();
			CrawlMessages();
			CrawlReports();		
		}
		if (MatchPages(
			Enums.TravianPages.Player)){

			Log("Crawling Player page...", "Services");

			CrawlPopulation();
			CrawlVillagesDetails();
		}
		if (MatchPages(
			Enums.TravianPages.VillageOut)){

			Log("Crawling Village Out page...", "Services");

			CrawlVillageType();
		}
		// TODO Fields
		// TODO Tasks
		// TODO Military Units
		// TODO Movements
	};

	var CrawlStorage = function () {
		// <summary>
		// Crawls for active village storages and crop production/consumption
		// </summary>

		Log("Crawling village storage...", "Services");

		var activeVillage = GetActiveVillage();

		$("#res > li > p > span").each(function (index, obj) {
			var resText = $(obj).text();
			var seperatorIndex = resText.indexOf("/");
			var resInStorage = parseInt(resText.substr(0, seperatorIndex), 10);
			var storageMax = parseInt(resText.substr(seperatorIndex + 1, resText.length - seperatorIndex + 1), 10);

			// If storage, else it's crop production/consumtion
			if (index < 4) {
				// Set Storage max value
				activeVillage.Resources.Storage[index] = storageMax;

				// Set current stored value
				activeVillage.Resources.Stored[index] = resInStorage;
			}
			else {
				activeVillage.Resources.TotalCropProduction = storageMax;
				activeVillage.Resources.Consumption = resInStorage;
			}
		});

		DLog("Stored in Village [" + activeVillage.VID + "] is [" + activeVillage.Resources.Stored + "] and crop [" + activeVillage.Resources.Consumption + " of " + activeVillage.Resources.TotalCropProduction + "]", "Services");
		DLog("Storage of Village [" + activeVillage.VID + "] is [" + activeVillage.Resources.Storage + "]", "Services");

		UpdateActiveVillage(activeVillage);
	};

	var CrawlProduction = function () {
		// <summary>
		// Crawls for active village production from production table (not from script)
		// </summary>

		Log("Crawling village production...", "Services");

		var activeVillage = GetActiveVillage();

		// Go through all script values and parse production values to village resource production array
		var scriptContent = $("script:contains('resources.production')").html();

		// Regular expression string from
		// http://txt2re.com/index-javascript.php3?s=resources.production%20=%20{%20%27l1%27:%20500,%27l2%27:%20556,%27l3%27:%20500,%27l4%27:%20367};&16&12&14&13&11
		var regexString = ".*?\\d+.*?(\\d+).*?\\d+.*?(\\d+).*?\\d+.*?(\\d+).*?\\d+.*?([-+]?\\d+)";
		var p = new RegExp(regexString, ["i"]);
		var m = p.exec(scriptContent);
		if (m != null) {
			for (var index = 1; index < 5; index++) {
				activeVillage.Resources.Production[index - 1] = m[index];
			};

			DLog("Production of Village [" + activeVillage.VID + "] is [" + activeVillage.Resources.Production + "]", "Services");
		}
		else Warn("Can't parse production script!", "Services");

		UpdateActiveVillage(activeVillage);
	};
	
	// <summary>
	// Crawls for user population
	// </summary>
	var CrawlPopulation = function () {
		if (!MatchPages(Enums.TravianPages.Player)) return;
		
		var pop = parseInt($("td.inhabitants").text(), 10) || 0;
		ActiveProfile.Population = pop;
			
		DLog("Services: Population of active village is [" + ActiveProfile.Population + "]");
	};

	// <summary>
	// Crawls for active village loyalty
	// </summary>
	var CrawlLoyalty = function () {
		Log("Services: Crawling village loyalty...");

		// Get loyalty span text
		var loyaltyText = $("#villageName .loyalty").text();

		// Get index of loyalty word end
		var index = loyaltyText.indexOf(":");

		// Remove loyalty word and percentage sign then parse to int
		var loyalty = parseInt(loyaltyText.substr(index + 1, loyaltyText.length - index + 1).replace("%", ""), 10) || 0;

		// Set crawled data to active village
		var activeVillage = GetActiveVillage();
		activeVillage.Loyalty = loyalty;
		UpdateActiveVillage(activeVillage);

		DLog("Services: Set Village [" + activeVillage.VID + "] loyalty to [" + activeVillage.Loyalty + "]");
	};

	// <summary>
	// Crawls Village list data
	// </summary>
	var CrawlVillageList = function () {
		Log("Services: Crawling Villages list...");

		// Go through all available entryes in village list
		$("#villageList .entry").each(function (index, obj) {
			// Gets basic village values
			var villageName = $(" > a", this).text();
			var villageID = parseInt($(" > a", this).attr("href").replace("?newdid=", ""), 10) || 0;
			var isVillageActive = $(this).is(".active");

			DLog("Services: Found village \"" + villageName + "\" [" + villageID + "]");

			// Try to update village data
			var wasUpdated = false;
			for (var index = 0, cache = ActiveProfile.Villages.length; index < cache; index++) {
				var obj = ActiveProfile.Villages[index];

				// Check if this is matched village
				if (obj.VID == villageID) {
					wasUpdated = true;

					obj.IsActive = isVillageActive;
					obj.Name = villageName;
					obj.VID = villageID;

					// Check if this is active village
					if (obj.IsActive) {
						ActiveVillageIndex = index;
						DLog("Services: Set ActiveVilageIndex to [" + ActiveVillageIndex + "]");
					}

					DLog("Services: Village [" + villageID + "] updated...");
					break;
				}
			}

			// Create new village if didnt match any village
			if (!wasUpdated) {
				var newVillage = new Models.Village();
				newVillage.Name = villageName;
				newVillage.VID = villageID;
				newVillage.IsActive = isVillageActive;

				// Check if this is active village
				if (newVillage.IsActive) {
					ActiveVillageIndex = ActiveProfile.Villages.length;
					DLog("Service: Set ActiveVilageIndex to [" + ActiveVillageIndex + "]");
				}

				ActiveProfile.Villages[ActiveProfile.Villages.length] = newVillage;

				DLog("Services: New Village [" + villageID + "] registered!");
			}
		});
	};

	// <summary>
	// Crawls for new user reports
	// </summary>
	var CrawlMessages = function () {
		var currentReportsCount = parseInt($(".messages .bubble-content").text(), 10) || 0;

		// Check if on Messages page
		if (MatchPages(Enums.TravianPages.Messages)) {
			// TODO Implement
		}
		else {
			ActiveProfile.Messages.UnreadCount = currentReportsCount;
		}

		DLog("Services: CrawlReports found [" + currentReportsCount + "] new messages");
	};

	// <summary>
	// Crawls for new user reports
	// </summary>
	var CrawlReports = function () {
		var currentReportsCount = parseInt($(".reports .bubble-content").text(), 10) || 0;

		// Check if on Reports page
		if (MatchPages(Enums.TravianPages.Reports)) {
			// TODO Implement
		}
		else {
			ActiveProfile.Reports.UnreadCount = currentReportsCount;
		}

		DLog("Services: CrawlReports found [" + currentReportsCount + "] new reports");
	};
	
	// <summary>
	// Crawls user population
	// </summary>
	var CrawlPopulation = function () {
		// Check if we are looking at current user profile
		var detailsUID = ActivePageQuery.replace("?uid=", "");
		if (ActiveProfile.UID != detailsUID) {
			DLog("Not in current user profile details", "Services");
			return;
		}

		var pop =  parseInt($("#details tbody tr").eq(4).children().last().text(), 10) || 0;
		ActiveProfile.Population = pop;

		DLog("Services: Population of active profile is [" + ActiveProfile.Population + "]");
	};
	
	// <summary>
	// Crawls for villages details
	// </summary>
	var CrawlVillagesDetails = function () {
		$.each(ActiveProfile.Villages, function (index, obj) {
			// Get village detailc table
			var village = $("#villages tbody tr").find("td:contains('"+obj.Name+"')").parent();
		
			// Crawl IsMainCity
			var checkMainCity = ($(".name", village).has(".mainVillage").length ? true : false);
			ActiveProfile.Villages[index].IsMainCity = checkMainCity
			DLog("Services: "+obj.Name+" "+(checkMainCity ? "is" : "isn't")+" main city");
			
			// Crawl village population
			var villagePop =  parseInt($(".inhabitants", village).text(), 10) || 0;
			ActiveProfile.Villages[index].Population = villagePop;
			DLog("Services: Population of "+obj.Name+" is ["+villagePop+"]");
			
			// Crawl village position X Coordinate
			var PositionX = $(".coordinateX", village).text();
			PositionX = parseInt(PositionX.replace("(",""), 10) || 0;
			ActiveProfile.Villages[index].Position.x = PositionX;
			
			// Crawl village position Y coordinate
			var PositionY = $(".coordinateY", village).text();
			PositionY = parseInt(PositionY.replace(")",""), 10) || 0;
			ActiveProfile.Villages[index].Position.y = PositionY;
			
			DLog("Services: Coordinates for "+obj.Name+" are [("+PositionX+"|"+PositionY+")]");
		});
	};
	
	// <summary>
	// Crawls village type
	// </summary>
	var CrawlVillageType = function () {
		var currentVillageType = $("#village_map").attr("class") || "f3";
	
		var activeVillage = GetActiveVillage();
		activeVillage.VillageOut.Type = currentVillageType;
		UpdateActiveVillage(activeVillage);

		DLog("Services: CrawlVillageType is [" + currentVillageType + "]");
	};

	// <summary>
	// Sets variable to true if user is loged in
	// </summary>
	var ProcessIsLogedIn = function () {
		IsLogedIn = !IsNullOrEmpty($(".signLink"));

		if (IsLogedIn) Log("Services: User is loged in...");
		else Warn("Services: User isn't loged in!");
	};

	// <summary>
	// Sets profile object to AvailableProfiles
	// </summary>
	var ProcessProfiles = function () {
		// Can't get active user if user isn't loged in
		if (!IsLogedIn) return;

		// Gets active profile UID
		var profileLinkElement = $(".signLink").attr("href");
		var profileUIDString = profileLinkElement.replace("spieler.php?uid=", "");
		var activeProfileUID = parseInt(profileUIDString, 10);

		DLog("Services: Active profile UID is [" + activeProfileUID + "]");

		// Search for matching profile
		for (var index = 0, cache = AvailableProfiles.length; index < cache; index++) {
			var obj = AvailableProfiles[index];

			// Match using User ID and Server Address
			if (obj.ServerAddress == ActiveServerAddress &&
				obj.UID == activeProfileUID) {
				// Set Active Profile
				Log("Services: Active profile is found!");
				ActiveProfile = obj;

				break;
			}
		}

		// Creates new profile if matching profile doesn't exist
		if (IsNullOrEmpty(ActiveProfile)) {
			Warn("Services: No profiles available that match this user!");
			Log("Services: Creating new profile...");

			var tribeElementClass = $(".sideInfoPlayer img").attr("class");
			var tribeID = tribeElementClass.replace("nationBig nationBig", "");

			ActiveProfile = new Models.Profile();
			ActiveProfile.ServerAddress = ActiveServerAddress;
			ActiveProfile.Name = $(".sideInfoPlayer span").text();
			ActiveProfile.UID = activeProfileUID;
			ActiveProfile.Tribe = Enums.Tribes[tribeID];

			DLog("Services: New profile created \"" + ActiveProfile.Name + "\" [" + ActiveProfile.UID + "] on server [" + ActiveProfile.ServerAddress + "]");
		}
	};

	// <summary>
	// Updates AvailableProfiles list with new profile data
	// </summary>
	// <param name="newProfile">Profile data for update</param>
	var UpdateProfile = function (newProfile) {
		if (!IsLogedIn) return;

		Log("Services: Saving profile...");

		// Search for profile to update
		var wasUpdated = false;
		for (var index = 0, cache = AvailableProfiles.length; index < cache; index++) {
			var obj = AvailableProfiles[index];

			// Check if current profile matched active profile
			if (obj.ServerAddress == ActiveProfile.ServerAddress &&
				obj.UID == ActiveProfile.UID) {
				// Replace old data with new data
				AvailableProfiles[index] = ActiveProfile;

				wasUpdated = true;

				DLog("Services: Profile saved [" + obj.UID + "]");

				break;
			}
		}

		// If no profile was updated, create new profile
		// Adds new profile to the end of list
		if (!wasUpdated) {
			AvailableProfiles[AvailableProfiles.length] = ActiveProfile;
		}

		// Sends request to save profiles list so that other plugins can use it
		var updateProfilesRequest = new Request("Background", "Data", "Profiles", { Type: "set", Value: AvailableProfiles });
		updateProfilesRequest.Send();
	};

	// <summary>
	// Gets currently active village
	// </summary>
	// <returns>Models.Village object representing currently active village</returns>
	var GetActiveVillage = function () {
		return ActiveProfile.Villages[ActiveVillageIndex];
	};

	// <summary>
	// Updates active village
	// </summary>
	// <param name="updatedVillage">Update village</param>
	var UpdateActiveVillage = function (updatedVillage) {
		ActiveProfile.Villages[ActiveVillageIndex] = updatedVillage;
	};
}

// Metadata for this plugin (Services)
var ServicesMetadata = {
	Name: "Services",
	Alias: "Services",
	Category: "Core",
	Version: "0.0.1.9",
	Description: "Takes care of all data retrieving and is requeired for all plugins",
	Author: "JustBuild Development",
	Site: "https://github.com/JustBuild/Project-Axeman/wiki",

	Settings: {
		Changeable: false
	},

	Flags: {
		Alpha: true
	},

	Class: Services
};

// Adds this plugin to global list of available plugins
GlobalPluginsList[GlobalPluginsList.length] = $.extend(true, {}, Models.PluginMetadata, ServicesMetadata);
