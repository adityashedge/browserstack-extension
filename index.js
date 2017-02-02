var REJECTED_TAB_URLS = ["chrome:", "about:"];
var BASE_URL = "https://www.browserstack.com"
var DEVICES_URL = BASE_URL + "/list-of-browsers-and-platforms.json?product=live";

function SavedSettings() {
  this.data = {};

  this.load = function () {
    this.data = JSON.parse(localStorage.getItem("bstack-extension-saved-settings"));
    return;
  };

  this.persist = function() {
    localStorage.setItem("bstack-extension-saved-settings", JSON.stringify(this.data));
    return;
  }
}

function getDeviceData() {
  return JSON.parse(localStorage.getItem("bstack-extension-devices"));
}

function getOSList() {
  var osList = {};

  $.each(window._DeviceData, function(formFactor, osData) {
    $.each(osData, function(index, device) {
      var d = {
        os: device.os,
        os_version: device.os_version,
        os_display_name: device.os_display_name
      };

      if(osList[device.os]) {
        osList[device.os]["versions"].push(d);
      } else {
        osList[device.os] = { "form_factor": formFactor, versions: [d] };
      }
    });
  });

  return osList;
}

function getSelectedOSData(formFactor, selectedOS) {
  return (
    $.map(window._DeviceData[formFactor], function(os) {
      if(os.os === selectedOS) { return os; }
    })
  )
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

function addOSVersions(formFactor, selectedOS) {
  $("#form-factor").val(formFactor);
  $("#os-select").children("option[value='"+ selectedOS + "']").prop('selected', true);

  var osVersions = getSelectedOSData(formFactor, selectedOS);
  if(formFactor === "desktop") {
    addOptionsForOSVersion(osVersions);
  } else {
    addOptionsForDeviceVersion(osVersions[0]["devices"]);
  }
}

function addOsAndOsVersion() {
  $("#os-select").empty();
  var $osSelectElement = $("#os-select");

  var userData = window._UserSettings.data;
  var osList = getOSList();
  var formFactor = "";
  var osVersions = [];

  var index = 0;
  $.each(osList, function(osName, osData) {
    if(index === 0) {
      formFactor = osData.form_factor;
      selectedOS = osName;
    }

    $osSelectElement.append("<option value='" + osName + "' data-form-factor=" + osData.form_factor + ">" + osName + "</option>")
    index++;
  });

  if(userData && userData["form_factor"] && userData["os"]) {
    formFactor = userData["form_factor"];
    selectedOS = userData["os"];
  }

  addOSVersions(formFactor, selectedOS);
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

  var userData = window._UserSettings.data;
  if(userData && userData["form_factor"] && userData["os"] && userData["os_version"]) {
    $osVersionSelectElement.children("option[value='"+ userData["os_version"] + "']").prop('selected', true);
  }

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

  var userData = window._UserSettings.data;
  if(userData && userData["form_factor"] && userData["os"] && userData["device"]) {
    $deviceSelectElement.children("option[value='"+ userData["device"] + "']").prop('selected', true);
  }
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

  var userData = window._UserSettings.data;
  if(userData && userData["form_factor"] && userData["os"] && userData["os_version"] && userData["browser"]) {
    $browserSelectElement.children("option[value='"+ userData["browser"] + "']").prop('selected', true);
  }

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

  var userData = window._UserSettings.data;
  if(userData && userData["form_factor"] && userData["os"] && userData["os_version"] && userData["browser"] && userData["browser_version"]) {
    $browserVersionSelectElement.children("option[value='"+ userData["browser_version"] + "']").prop('selected', true);
  }
}

function buildUIForm() {
  $("#bs-form .form-group select option").empty();
  $("#bs-form").append(addOsAndOsVersion());
}

$(document).ready(function() {
  window._DeviceData = getDeviceData();
  window._UserSettings = new SavedSettings();
  _UserSettings.load();

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
    var selectedOS = $(this).val();
    var formFactor = $(this).children('option:selected').data("form-factor");

    window._UserSettings.data = {
      url: $("#url").val(),
      form_factor: formFactor,
      os: selectedOS,
    };
    window._UserSettings.persist();

    addOSVersions(formFactor, selectedOS);
  });

  $("#bs-form").on("change", "#os-version-select", function() {
    var formFactor = $("#form-factor").val();

    window._UserSettings.data = {
      url: $("#url").val(),
      form_factor: formFactor,
      os: $("#os-select").val(),
      os_version: $(this).val(),
    };

    window._UserSettings.persist();

    if(formFactor !== "desktop") { return; }

    addOptionsForBrowser();
  });

  $("#bs-form").on("change", "#browser-select", function() {
    var formFactor = $("#form-factor").val();

    window._UserSettings.data = {
      url: $("#url").val(),
      form_factor: formFactor,
      os: $("#os-select").val(),
      os_version: $("#os-version-select").val(),
      browser: $(this).val(),
    };
    window._UserSettings.persist();

    if(formFactor !== "desktop") { return; }

    addOptionsForBrowserVersion();
  });

  $("#bs-form").on("change", "#browser-version-select", function() {
    window._UserSettings.data = {
      url: $("#url").val(),
      form_factor: $("#form-factor").val(),
      os: $("#os-select").val(),
      os_version: $("#os-version-select").val(),
      browser: $("#browser-select").val(),
      browser_version: $(this).val(),
    };
    window._UserSettings.persist();
  });

  $("#bs-form").on("change", "#device-select", function() {
    window._UserSettings.data = {
      url: $("#url").val(),
      form_factor: $("#form-factor").val(),
      os: $("#os-select").val(),
      device: $(this).val()
    };
    window._UserSettings.persist();
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

