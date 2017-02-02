var REJECTED_TAB_URLS = ["chrome:", "about:"];
var BASE_URL = "https://www.browserstack.com"
var DEVICES_URL = BASE_URL + "/list-of-browsers-and-platforms.json?product=live";

function getDeviceData() {
  return JSON.parse(localStorage.getItem("bstack-extension-devices"));
}

function getOSList() {
  var osList = {};

  $.each(window._DeviceData, function(formFactor, osData) {
    $.each(osData, function(index, device) {
      var d = { os: device.os, os_version: device.os_version, os_display_name: device.os_display_name };

      if(osList[device.os]) {
        osList[device.os]["versions"].push(d);
      } else {
        osList[device.os] = { "form_factor": formFactor, versions: [d] };
      }
    });
  });

  return osList;
}

function getBrowsers() {
  var formFactor = $("#form-factor").val();
  var osName = $("#os-select").val();
  var osVersion = $("#os-version-select").val();

  var osData = $.grep(window._DeviceData[formFactor], function(os) {
    return (os.os === osName && os.os_version === osVersion);
  })[0];

  var browsers = {};
  $.each(osData.browsers, function(_, browser) {
    var b = {
      browser: browser.browser,
      browser_version: browser.browser_version,
      display_name: browser.display_name
    };

    if(browsers[b.browser]) {
      browsers[b.browser]["versions"].push(b);
    } else {
      browsers[b.browser] = {
        "form_factor": formFactor,
        "os": osName,
        "os_version": osVersion,
        "browser": b.browser,
        versions: [b]
      };
    }
  });

  return browsers;
}

function fetchDeviceDataFromUrl() {
  $.get(DEVICES_URL, function(data) {
    window._DeviceData = data;
    localStorage.setItem("bstack-extension-devices", JSON.stringify(window._DeviceData));

    buildUIForm();
  });
}

function addOsAndOsVersion() {
  $("#os-select").empty();
  var $osSelectElement = $("#os-select");

  var osList = getOSList();
  var formFactor = "";
  var osVersions = [];

  var index = 0;
  $.each(osList, function(osName, osData) {
    if(index === 0) {
      selectedOS = osName;
      formFactor = osData.form_factor;
      osVersions = osData["versions"];

      $("#form-factor").val(formFactor);
      $osSelectElement.append("<option value='"+ osName + "' selected='selected' data-form-factor=" + osData.form_factor + ">" + osName + "</option>")
    }
    else {
      $osSelectElement.append("<option value='" + osName + "' data-form-factor=" + osData.form_factor + ">" + osName + "</option>")
    }
    index++;
  });

  if(formFactor === "desktop") {
    addOptionsForOSVersion(osVersions);
  } else {
    addOptionsForDeviceVersion(osVersions[0]["devices"]);
  }
}

function addOptionsForOSVersion(osVersions) {
  $("#device-select").attr("disabled", true).parent('.form-group').addClass("hide");
  $("#os-version-select").attr("disabled", false).parent('.form-group').removeClass("hide");
  $("#browser-select").attr("disabled", false).parent('.form-group').removeClass("hide");
  $("#browser-version-select").attr("disabled", false).parent('.form-group').removeClass("hide");

  var $osVersionSelectElement = $("#os-version-select");
  $osVersionSelectElement.empty();
  var formFactor = $("#form-factor").val();

  $.each(osVersions, function(index, os) {
    if(index === 0) {
      $osVersionSelectElement.append("<option value='" + os.os_version + "' selected='selected'>" + os.os_display_name + "</option>")
    } else {
      $osVersionSelectElement.append("<option value='" + os.os_version + "'>" + os.os_display_name + "</option>")
    }
  });

  addOptionsForBrowser();
}

function addOptionsForDeviceVersion(osVersions) {
  $("#os-version-select").attr("disabled", true).parent('.form-group').addClass("hide");
  $("#browser-select").attr("disabled", true).parent('.form-group').addClass("hide");
  $("#browser-version-select").attr("disabled", true).parent('.form-group').addClass("hide");

  var $deviceSelectElement = $("#device-select");
  $deviceSelectElement.attr("disabled", false).parent('.form-group').removeClass("hide");
  $deviceSelectElement.empty();

  var formFactor = $("#form-factor").val();

  $.each(osVersions, function(index, device) {
    if(index === 0) {
      $deviceSelectElement.append("<option value='" + device.device + "' selected='selected'>" + device.display_name + "</option>")
    } else {
      $deviceSelectElement.append("<option value='" + device.device + "'>" + device.display_name + "</option>")
    }
  });
}

function addOptionsForBrowser() {
  var $browserSelectElement = $("#browser-select");
  $browserSelectElement.attr("disabled", false).parent('.form-group').removeClass("hide");
  $browserSelectElement.empty();

  var browserList = Object.keys(getBrowsers());
  $.each(browserList, function(index, browser) {
    if(index === 0) {
      $browserSelectElement.append("<option value='" + browser + "' selected='selected'>" + browser + "</option>")
    } else {
      $browserSelectElement.append("<option value='" + browser + "'>" + browser + "</option>")
    }
  });

  addOptionsForBrowserVersion();
}

function addOptionsForBrowserVersion() {
  $("#browser-version-select").attr("disabled", false).parent('.form-group').removeClass("hide");

  var $browserVersionSelectElement = $("#browser-version-select");
  $browserVersionSelectElement.empty();
  var formFactor = $("#form-factor").val();

  var browsers = getBrowsers();
  var browserName = $("#browser-select").val();

  $.each(browsers[browserName].versions, function(index, browser) {
    if(index === 0) {
      $browserVersionSelectElement.append("<option value='" + browser.browser_version + "' selected='selected'>" + browser.display_name + "</option>")
    } else {
      $browserVersionSelectElement.append("<option value='" + browser.browser_version + "'>" + browser.display_name + "</option>")
    }
  });
}

function buildUIForm() {
  $("#bs-form .form-group select option").empty();
  $("#bs-form").append(addOsAndOsVersion());
}

$(document).ready(function() {
  window._DeviceData = getDeviceData();

  chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
    var activeTabURL = arrayOfTabs[0].url;
    var rejectionMatch = $.grep(REJECTED_TAB_URLS, function(url) {
      return (activeTabURL.substring(0, url.length) === url);
    });

    if(rejectionMatch.length === 0) {
      $("#url").val(activeTabURL);
    }
  })

  if(window._DeviceData) {
    buildUIForm();
  } else {
    if(!navigator.onLine) { return; }
    fetchDeviceDataFromUrl();
  }

  $("#refresh-browser-list").click(function() {
    fetchDeviceDataFromUrl();
  });

  $("#bs-form").on("change", "#url", function() {
    if($.trim($(this).val()).length === 0) {
      $("#url").parent('.form-group').addClass('has-error');
    } else {
      $("#url").parent('.form-group').removeClass('has-error');
    }
  });

  $("#bs-form").on("change", "#os-select", function() {
    var osName = $(this).val();
    var formFactor = $(this).children('option:selected').data("form-factor");
    $("#form-factor").val(formFactor);

    var osVersions = $.map(window._DeviceData[formFactor], function(os) {
      if(os.os === osName) { return os; }
    });

    if(formFactor === "desktop") {
      addOptionsForOSVersion(osVersions);
    } else {
      addOptionsForDeviceVersion(osVersions[0]["devices"]);
    }
  });

  $("#bs-form").on("change", "#os-version-select", function() {
    var formFactor = $("#form-factor").val();
    if(formFactor !== "desktop") { return; }

    addOptionsForBrowser();
  });

  $("#bs-form").on("change", "#browser-select", function() {
    var formFactor = $("#form-factor").val();
    if(formFactor !== "desktop") { return; }

    addOptionsForBrowserVersion();
  });

  $("#bs-form").submit(function(event) {
    event.preventDefault();

    var url = $("#url").val();
    var formFactor = $("#form-factor").val();
    var osName = $("#os-select").val();
    var osVersion = $("#os-version-select").val();
    var browserName = $("#browser-select").val();
    var browserVersion = $("#browser-version-select").val();
    var deviceName = $("#device-select").val();

    if(!formFactor || !url) {
      $("#url").parent('.form-group').addClass('has-error');
      return
    } else if(formFactor === "desktop" && (!osName || !osVersion || !browserName || !browserVersion)) {
      return;
    } else if(formFactor === "mobile" && !deviceName) {
      return
    }

    var newURL = BASE_URL + "/start" + "#" + $(this).serialize();
    chrome.tabs.create({ url: newURL });
  });

  $("#bs-form").on("click", "#sign-in", function() {
    var newURL = BASE_URL + "/users/sign_in" + "#" + $("#bs-form").serialize();
    chrome.tabs.create({ url: newURL });
  });
});

