// import Calendar from "./calendar.js";

/* exported gapiLoaded */
/* exported gisLoaded */
/* exported handleAuthClick */
/* exported handleSignoutClick */

// TODO(developer): Set to client ID and API key from the Developer Console
const CLIENT_ID = "243664293704-2q4qntiougio4ab4uepolb8r8eqe7134.apps.googleusercontent.com";
const API_KEY = "@Hy`RxAxiBQ3Qq3PclGu3YyOPJLnT4ndTaqbVXH";

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = "https://sheets.googleapis.com/$discovery/rest?version=v4";

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

const TRACK_SHEET_ID = "1ItkejqpyXTY5HfmVbgGTvGog5yztnerCdIamcNiNmq0";
const PRIVATE_SHEET_ID = "13P-UU_pA5v0XuKXRtWUhm65nYFLThJo9OQM7CTmiP18";

// const events = [];
let tokenClient;
let gapiInited = false;
let gisInited = false;

document.getElementById("authorize_button").style.visibility = "hidden";
document.getElementById("signout_button").style.visibility = "hidden";
// import { mimi, getNextMonday, getThisMonday, formatEvent } from "./mimi.js";
/**
 * Callback after api.js is loaded.
 */
function gapiLoaded() {
  gapi.load("client", initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: mimi(API_KEY),
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
  maybeEnableButtons();
}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: "", // defined later
  });
  gisInited = true;
  maybeEnableButtons();
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    document.getElementById("authorize_button").style.visibility = "visible";
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw resp;
    }
    document.getElementById("signout_button").style.visibility = "visible";
    document.getElementById("authorize_button").innerText = "Refresh";
    // await loadEvents();
  };

  if (gapi.client.getToken() === null) {
    // Prompt the user to select a Google Account and ask for consent to share their data
    // when establishing a new session.
    tokenClient.requestAccessToken({ prompt: "consent" });
  } else {
    // Skip display of account chooser and consent dialog for an existing session.
    tokenClient.requestAccessToken({ prompt: "" });
  }
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken("");
    // document.getElementById("content").innerText = "";
    document.getElementById("authorize_button").innerText = "Authorize";
    document.getElementById("signout_button").style.visibility = "hidden";
  }
}

/**
 * Print the names and majors of students in a sample spreadsheet:
 * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 */
async function loadEvents() {
  // events.length = 0;
  const events = [];
  let response;
  let privateMode = true;

  try {
    response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: PRIVATE_SHEET_ID,
      range: "A2",
    });
  } catch (err) {
    privateMode = false;
  }

  try {
    response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: TRACK_SHEET_ID,
      range: "A:B",
    });
  } catch (err) {
    console.log(err.message);
    return;
  }
  const range = response.result;
  if (!range || !range.values || range.values.length == 0) {
    document.getElementById("content").innerText = "No values found.";
    return;
  }
  var thisWeekSheetId = '';
  var nextWeekSheetId = '';
  const thisMonday = getThisMonday();
  const nextMondey = getNextMonday();
  for (var i=range.values.length - 1; i > Math.max(range.values.length - 6, 0); i--) {
    if (range.values[i][0] == thisMonday) {
        thisWeekSheetId = range.values[i][1];
        console.log(thisWeekSheetId);
    }
    else if (range.values[i][0] == nextMondey) {
        nextWeekSheetId = range.values[i][1];
        console.log(nextWeekSheetId);
    }
  }

  try {
    response = await gapi.client.sheets.spreadsheets.values.get({
        // spreadsheetId: thisWeekSheetId,
        spreadsheetId: thisWeekSheetId,
        range: "A2:H",
    });
  } catch (err) {
    console.log(err.message);
    // return;
  }
  const thisWeekRange = response.result;
  if (!thisWeekRange || !thisWeekRange.values || thisWeekRange.length == 0) {
  } else {
    thisWeekRange.values.forEach((row, i) => events.push(formatEvent(row, i, privateMode)));
  }
  try {
    response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: nextWeekSheetId,
        range: "A2:H",
    });
  } catch (err) {
    console.log(err.message);
    return;
  }
  const nextWeekRange = response.result;
  if (!nextWeekRange || !nextWeekRange.values || nextWeekRange.length == 0) {
  } else {
    const numberEventsThisWeek = events.length;
    nextWeekRange.values.forEach((row, i) => events.push(formatEvent(row, i + numberEventsThisWeek)));
  }
  // console.log(events);
  return events;

//   new Calendar(events);

//   // Flatten to string to display
//   const output = range.values.reduce(
//     (str, row) => `${str}${row[0]}, ${row[4]}\n`,
//     "Name, Major:\n"
//   );
//   document.getElementById("content").innerText = output;
}

function mimi(mimi) {
  return [...mimi]
    .map((s) => String.fromCharCode(1 + s.charCodeAt()))
    .reduce((s, a) => s + a);
}

function getThisMonday() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when today is Sunday
  const monday = new Date(today.setDate(diff));

  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, "0");
  const day = String(monday.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getNextMonday() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? 1 : 8); // Adjust when today is Sunday
  const monday = new Date(today.setDate(diff));

  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, "0");
  const day = String(monday.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function calcTimeDiff() {
  const now = new Date();
  return (
    new Date(now.toLocaleString()) -
    new Date(now.toLocaleString("en-US", { timeZone: "America/Vancouver" }))
  );
}

function formatEvent(row, id, privateMode) {
  const diff = calcTimeDiff();
  const start =
    new Date(
      row[0].substr(0, 4),
      parseInt(row[0].substr(4, 2)) - 1,
      row[0].substr(6, 2),
      row[1].split(":")[0],
      row[1].split(":")[1]
    ).valueOf() + diff;
  const end =
    new Date(
      row[0].substr(0, 4),
      parseInt(row[0].substr(4, 2)) - 1,
      row[0].substr(6, 2),
      row[2].split(":")[0],
      row[2].split(":")[1]
    ).valueOf() + diff;
  var eventName = privateMode ? `${row[4]}` : "Occupied";
  return { id: id, eventName: eventName, dateFrom: start, dateTo: end };
}
  
