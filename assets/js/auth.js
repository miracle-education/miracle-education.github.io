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

// const sleep = ms => new Promise(r => setTimeout(r, ms));

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

// function sleep(timeout) {
//   return new Promise(r => setTimeout(r, timeout));
// }
  

/* ========================================================================================== */



// import { getDaysAndHours } from './lookUpDaysHours.js';

class Calendar {
  event = [];
  constructor(events=[]) {
    this.colorsTaken = 0;
    this.allColors = this._getAllColors();
    this.currentDate = new Date();
    this._scrollListener();
    this._addHeaderButtonEventListeners();
    this.renderAllDayRow();
    this.renderCalendarBody();
    this.renderCalendarHours();
    this.reset_events(events);
  }

  reset_events(events) {
    this.colorsTaken = 0;
    this._validateEvents(events);
    this.events = this._parseEvents(events);
    this.render();
  }

  setDate(date) {
    this.currentDate.setDate(date);
  }

  getDate() {
    return this.currentDate;
  }

  getMonth() {
    return this.currentDate.getMonth();
  }

  getTitle() {
    return document.getElementById('calendar-title');
  }

  setTitle() {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];
    const titleMonth = document.createElement('span');
    titleMonth.classList.add('calendar-title-month');
    titleMonth.classList.add('calendar-app');
    titleMonth.innerText = monthNames[this.getMonth()];
    const titleYear = document.createElement('span');
    titleYear.classList.add('calendar-title-year');
    titleYear.classList.add('calendar-app');
    titleYear.innerText = this.getDate().getFullYear();
    this.getTitle().innerHTML = '';
    this.getTitle().appendChild(titleMonth);
    this.getTitle().appendChild(titleYear);
  }

  render() {
    this.setTitle();
    this.renderDays();
    this.renderEvents();
  }

  renderEvents() {
    this._resetAllColumns();
    const thisWeekEvents = this.events.filter(event => {
      return this._isExistInThisWeek(event.dateFrom, event.dateTo);
    });
    thisWeekEvents.forEach(event => {
      this._renderEvent(event);
    });
  }

  renderDays() {
    const days = document.getElementById('calendar-days');
    days.innerHTML = '';
    const timelineColumn = document.createElement('div');
    timelineColumn.classList.add('calendar-timeline-column');
    timelineColumn.classList.add('calendar-app');
    days.appendChild(timelineColumn);

    let monday = this._getMonday(this.getDate());
    for (let i = 0; i < 7; i++) {
      const day = document.createElement('div');
      day.classList.add('calendar-day');
      day.classList.add('calendar-app');

      const dayName = document.createElement('span');
      dayName.classList.add('calendar-day-name');
      dayName.classList.add('calendar-app');
      dayName.innerText = this._getDayName(monday);
      day.appendChild(dayName);

      const dayNumber = document.createElement('span');
      dayNumber.classList.add('calendar-day-number');
      dayNumber.classList.add('calendar-app');
      // Check if monday is today
      if (this._isToday(monday)) {
        dayNumber.classList.add('calendar-day-number-today');
        dayNumber.classList.add('calendar-app');
      } else {
        dayNumber.classList.remove('calendar-day-number-today');
      }
      dayNumber.innerText = monday.getDate();
      day.appendChild(dayNumber);

      days.appendChild(day);
      monday.setDate(monday.getDate() + 1);
    }

  }

  renderAllDayRow() {
    const calendarBody = document.getElementById('calendar-body');
    const allDayRow = document.createElement('div');
    allDayRow.classList.add('calendar-all-day-row');
    allDayRow.classList.add('calendar-app');
    this._createCalendarTimelineColumn(allDayRow);
    this._createCalendarBodyColumns(allDayRow);
    allDayRow.querySelector('.calendar-timeline-column').innerText = 'all-day';
    calendarBody.appendChild(allDayRow);
  }

  renderCalendarHours() {
    const calendarRows = document.getElementsByClassName('calendar-body-row');
    for (let i = 0; i < calendarRows.length; i++) {
      const calendarRow = calendarRows[i];
      const hourDiv = calendarRow.querySelector('.calendar-timeline-column');
      const hour = `${(parseInt(calendarRow.dataset.hour)) % 24}`.padStart(2, '0') + ':00';
      if (i === calendarRows.length - 1) {
        const lastHour = document.createElement('div');
        lastHour.classList.add('calendar-timeline-last-hour');
        lastHour.classList.add('calendar-app');
        const lastHourText = document.createElement('span');
        lastHourText.classList.add('calendar-app');
        lastHourText.innerText = '00:00';
        const hourText = document.createElement('span');
        hourText.classList.add('calendar-app');
        hourText.innerText = hour;
        lastHour.appendChild(hourText);
        lastHour.appendChild(lastHourText);
        hourDiv.appendChild(lastHour);
      } else {
        hourDiv.innerText = hour;
      }
    }
  }

  renderCalendarBody() {
    const calendarBody = document.getElementById('calendar-body');
    const calendarBodyRows = this._createCalendarBodyRows();
    calendarBody.appendChild(calendarBodyRows);
    calendarBody.scrollTop = 320;
  }

  _renderEvent(event) {
    const timeSlots = this._getDaysAndHours(event.dateFrom, event.dateTo);
    timeSlots.forEach((slot, index) => {
      const cell = this._getCell(slot.day, slot.hour);
      if (!cell.querySelector(`[data-event-id="${event.id}"]`)) {
        const eventDiv = document.createElement('div');
        eventDiv.classList.add('calendar-event');
        eventDiv.classList.add('calendar-app');
        eventDiv.dataset.eventId = event.id;
        eventDiv.style.backgroundColor = event.bgColor;
        eventDiv.style.color = event.textColor;
        this._addClicklistenerToEvent(eventDiv);
        eventDiv.innerText = this._getEventName(event, timeSlots, index);
        cell && cell.appendChild(eventDiv);
      }
    });
    this._setEventStartEndSize(event);
  }

  _addClicklistenerToEvent(eventDiv) {
    eventDiv.addEventListener('click', () => {
      const eventId = eventDiv.dataset.eventId;
      document.querySelector('#calendar-event-tooltip')?.remove();
      const position = eventDiv.getBoundingClientRect();
      const tooltip = document.createElement('div');
      tooltip.classList.add('calendar-event-tooltip');
      tooltip.classList.add('calendar-app');
      tooltip.id = 'calendar-event-tooltip';
      tooltip.style.top = `${position.top + window.scrollY}px`;
      tooltip.style.left = `${position.left + window.scrollX + this._getCellHeightAsNumber()}px`;

      const event = this.events.find(event => event.id === parseInt(eventId));

      const eventBody = document.createElement('div');
      eventBody.classList.add('calendar-event-tooltip-body');
      eventBody.classList.add('calendar-app');

      const closeIcon = document.createElement('span');
      closeIcon.classList.add('calendar-event-tooltip-close');
      closeIcon.classList.add('calendar-app');
      closeIcon.innerHTML = '&#9747;';
      closeIcon.addEventListener('click', () => {
        tooltip.remove();
      });

      const eventHeader = document.createElement('h1');
      eventHeader.classList.add('calendar-event-tooltip-header');
      eventHeader.classList.add('calendar-app');
      eventHeader.innerText = event.eventName;

      const eventTime = document.createElement('div');
      eventTime.classList.add('calendar-event-tooltip-time');
      eventTime.classList.add('calendar-app');
      eventTime.innerText = this._generateDateFromDateToString(event.dateFrom, event.dateTo);

      eventBody.appendChild(closeIcon);
      eventBody.appendChild(eventHeader);
      eventBody.appendChild(eventTime);
      tooltip.appendChild(eventBody);
      document.querySelector('body').appendChild(tooltip);
    });
  }

  _generateDateFromDateToString(dateFrom, dateTo) {
    const dateFromHour = dateFrom.getHours().toString().padStart(2, '0');
    const dateFromMinute = dateFrom.getMinutes().toString().padStart(2, '0');
    const dateToHour = dateTo.getHours().toString().padStart(2, '0');
    const dateToMinute = dateTo.getMinutes().toString().padStart(2, '0');
    return `${dateFrom.toTimeString().substr(0, 5)} - ${dateTo.toTimeString().substr(0, 5)}`;
    // return `${dateFrom.toLocaleDateString()} ${dateFromHour}:${dateFromMinute} - ${dateTo.toLocaleDateString()} ${dateToHour}:${dateToMinute}`;
  }
  _setEventStartEndSize(event) {
    // Check if event start is within this week
    if (this._isThisWeek(event.dateFrom)) {
      const startDay = event.dateFrom.getDay();
      const startHour = event.dateFrom.getHours();
      const startMinute = event.dateFrom.getMinutes();
      const cell = this._getCell(startDay, startHour);
      const eventDiv = cell.querySelector(`[data-event-id="${event.id}"]`);
      if (eventDiv) {
        const marginTop = startMinute ? (this._getCellHeightAsNumber() / 60) * startMinute : 0;
        eventDiv.style.height = `${this._getCellHeightAsNumber() - marginTop}px`;
        eventDiv.style.marginTop = `${marginTop}px`;
      }
    }

    // Check if event end is within this week
    if (this._isThisWeek(event.dateTo)) {
      const endDay = event.dateTo.getDay();
      const endHour = event.dateTo.getHours();
      const endMinute = event.dateTo.getMinutes();
      const cell = this._getCell(endDay, endHour);
      const eventDiv = cell.querySelector(`[data-event-id="${event.id}"]`);
      if (eventDiv) {
        const marginBottom = endMinute ? ((this._getCellHeightAsNumber() / 60) * (60 - endMinute)) : 0;
        if (eventDiv.style.height) {
          eventDiv.style.height = `calc(${eventDiv.style.height} - ${marginBottom}px)`;
        } else {
          // eventDiv.style.height = `${this._getCellHeightAsNumber() - marginBottom}px`;
          eventDiv.style.height = `${marginBottom}px`;
        }
      }
    }
  }

  _getCell(day, hour) {
    const row = document.querySelector(`#calendar-body-row-${hour}`);
    return row.querySelector(`[data-day="${day}"]`);
  }

  _getCellHeightAsNumber() {
    return parseFloat(getComputedStyle(document.documentElement)
      .getPropertyValue('--calendar-cell-height').replace('px', ''));
  }

  _getEventName(event, timeSlots, index) {
    const currentDay = timeSlots[index].day;
    const previousSlotDay = timeSlots[index - 1] ? timeSlots[index - 1].day : null;

    if (timeSlots.length === 1) {
      return event.eventName;
    } else if (index === 0) {
      return event.eventName;
    } else if (currentDay !== previousSlotDay) {
      return event.eventName;
    } else {
      return '';
    }
  }

  _getDaysAndHours(dateFrom, dateTo) {
    return this._getHours(dateFrom, dateTo);
  }

  _getDays(dateFrom, dateTo) {
    const days = [];
    let currentDate = new Date(dateFrom);
    while (currentDate <= dateTo) {
      days.push(currentDate);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  }

  _getHours(dateFrom, dateTo) {
    dateFrom = new Date(dateFrom);
    dateTo = new Date(dateTo);
    const hours = [];
    let currentDateFrom = dateFrom.getTime() <= this._getMonday(this.getDate()).getTime() ? this._getMonday(this.getDate()) : dateFrom;
    let currentDateTo = dateTo.getTime() >= this._getSunday(this.getDate()).getTime() ? this._getSunday(this.getDate()) : dateTo;
    return getDaysAndHours(currentDateFrom, currentDateTo);
  }

  _resetAllColumns() {
    const calendarColumns = document.querySelectorAll('.calendar-body-column');
    for (let i = 0; i < calendarColumns.length; i++) {
      if (!calendarColumns[i].classList.contains('calendar-timeline-column')) {
        calendarColumns[i].innerHTML = '';
      }
    }
  }

  _createCalendarBodyRows() {
    const calendarBodyRows = document.createElement('div');
    calendarBodyRows.classList.add('calendar-body-rows');
    calendarBodyRows.classList.add('calendar-app');
    for (let i = 0; i < 24; i++) {
      const row = this._createCalendarBodyRow();
      row.setAttribute('id', `calendar-body-row-${i}`);
      row.dataset.hour = i;
      calendarBodyRows.appendChild(row);
    }
    return calendarBodyRows;
  }

  _createCalendarBodyRow() {
    const calendarBodyRow = document.createElement('div');
    calendarBodyRow.classList.add('calendar-body-row');
    calendarBodyRow.classList.add('calendar-app');
    this._createCalendarTimelineColumn(calendarBodyRow);
    this._createCalendarBodyColumns(calendarBodyRow);
    // for (let i = 0; i < 4; i++) {
    //   const quarter = this._createCalendarQuarterRow();
    //   quarter.setAttribute('id', `calendar_quarter-row-${i}`);
    //   quarter.dataset.quarter = i;
    //   calendarBodyRow.appendChild(quarter);
    // } 
    return calendarBodyRow;
  }
  
  /* further divide each hour to 4 parts */
  _createCalendarQuarterRow() {
    const calendarQuarterRow = document.createElement('div');
    calendarQuarterRow.classList.add('calendar-quarter-row');
    calendarQuarterRow.classList.add('calendar-app');    
    this._createCalendarBodyColumns(calendarQuarterRow);
    return calendarQuarterRow;
  }

  _createCalendarTimelineColumn(row) {
    const timelineColumn = document.createElement('div');
    timelineColumn.classList.add('calendar-body-column');
    timelineColumn.classList.add('calendar-timeline-column');
    timelineColumn.classList.add('calendar-app');
    row.appendChild(timelineColumn);

  }

  _createCalendarBodyColumns(row) {
    // const timelineColumn = document.createElement('div');
    // timelineColumn.classList.add('calendar-body-column');
    // timelineColumn.classList.add('calendar-timeline-column');
    // timelineColumn.classList.add('calendar-app');
    // row.appendChild(timelineColumn);
    for (let i = 0; i < 7; i++) {
      const column = document.createElement('div');
      column.dataset.day = (i + 1) % 7;
      column.classList.add('calendar-body-column');
      column.classList.add('calendar-app');
      row.appendChild(column);
    }
  }

  _addHeaderButtonEventListeners() {
    const prevWeekButton = document.getElementById('calendar-action-button-prev');
    const nextWeekButton = document.getElementById('calendar-action-button-next');
    const todayButton = document.getElementById('calendar-action-button-today');

    prevWeekButton.addEventListener('click', () => {
      this.setDate(this.currentDate.getDate() - 7);
      this.render();
    });

    nextWeekButton.addEventListener('click', () => {
      this.setDate(this.currentDate.getDate() + 7);
      this.render();
    });

    todayButton.addEventListener('click', () => {
      this.currentDate = new Date();
      this.render();
    });
  }

  _scrollListener() {
    const calendarBody = document.getElementById('calendar-body');
    calendarBody.addEventListener('scroll', () => {
      const scrollTop = calendarBody.scrollTop;
      const allDayRow = document.querySelector('.calendar-all-day-row');
      const rows = allDayRow.getElementsByClassName('calendar-body-column');
      if (scrollTop < 7) {
        rows[rows.length - 1].style.paddingTop = '40px';
        rows[rows.length - 2].style.paddingTop = '40px';
      } else {
        rows[rows.length - 1].style.paddingTop = '0';
        rows[rows.length - 2].style.paddingTop = '0';
      }

    });
  }

  _validateEvents(events) {
    if (!Array.isArray(events)) {
      throw new Error('Events must be an array');
    }
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (!event.dateFrom || !event.dateTo) {
        throw new Error('Events must have start and end properties');
      }
      if (event.dateFrom > event.dateTo) {
        throw new Error('Events must have start date before end date');
      }
      if (!event.eventName) {
        throw new Error('Events must have a name');
      }

      if (event.id === undefined || event.id === null) {
        event.id = this._getRandomId();
      }
    }
  }

  _parseEvents(events) {
    const parsedEvents = [];
    for (let i = 0; i < events.length; i++) {
      var colors = null;
      for (let j = 0; j < i; j++) {
        if (parsedEvents[j].eventName == events[i].eventName) {
          colors = {bgColor: parsedEvents[j].bgColor, textColor: parsedEvents[j].textColor};
          break;
        }
      }
      if (!colors) {
        // colors = this._getRandomBgColorAndTextColor();
        if (this.colorsTaken >= this.allColors.length) this.colorsTaken = 0;
        colors = this.allColors[this.colorsTaken];
        this.colorsTaken++;
      }
      const event = {
        ...events[i],
        // bgColor: colors.bgColor,
        // textColor: colors.textColor,
        ...colors,
        dateFrom: new Date(events[i].dateFrom),
        dateTo: new Date(events[i].dateTo)
      }
      parsedEvents.push(event);
    }
    return parsedEvents;
  }

  _getDayName(date) {
    const dayNames = [
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat'
    ];
    return dayNames[date.getDay()];
  }

  _getMonday(date) {
    date = new Date(date);
    var day = date.getDay(),
      diff = date.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    return new Date((new Date(date.setDate(diff))).setHours(0, 0, 0, 0));
  }

  _getSunday(date) {
    date = new Date(date);
    var day = date.getDay(),
      diff = date.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    return new Date((new Date(date.setDate(diff + 6))).setHours(23, 59, 59, 999));
  }

  _isToday(date) {
    const today = new Date()
    return date.getDate() == today.getDate() &&
      date.getMonth() == today.getMonth() &&
      date.getFullYear() == today.getFullYear()
  }

  _isThisWeek(date) {
    const monday = this._getMonday(this.getDate()).getTime();
    const sunday = this._getSunday(this.getDate()).getTime();
    return date.getTime() >= monday && date.getTime() <= sunday;
  }


  _isExistInThisWeek(dateFrom, dateTo) {
    this.counter += 1;
    return this._getMonday(this.getDate()).getTime() >= this._getMonday(dateFrom).getTime() &&
      this._getSunday(this.getDate()).getTime() <= this._getSunday(dateTo).getTime()
  }

  _getAllColors() {
    const bgColors = [
      '#ffeb3b',  // 0 light yellow
      '#00cc99',  // 1 light green
      '#99ccff',  // 2 light blue
      '#cc99ff',  // 3 light purple
      '#ffc107',  // 4 medium orange
      '#8bc34a',  // 5 medium-light green
      '#00bcd4',  // 6 medium greenblue
      '#9966ff',  // 7 medium purple
      '#4caf50',  // 8 medium green
      '#cc7a00',  // 9 dark orange
      '#00bcd4',  //10 medium bluegreen
      '#673ab7',  //11 dark purple
      '#6699ff',  //12 medium blue
      '#6699ff',  //13 medium-light steel
      '#795548',  //14 dark brown
      '#2196f3',  //15 medium-dark blue
      '#3f51b5',  //16 dark blue
      '#607d8b',  //17 dark steel
      '#009688',  //18 medium greenblue
      '#6699ff'   //19 light greyyellow
    ];
    const textColors = bgColors.map((col) => {
      const rgb = parseInt(col.substring(1), 16);
      const b = rgb % 256;
      const g = Math.floor(rgb / 256) % 256;
      const r = Math.floor(rgb / 256 / 256) % 256;
      return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? "#000000" : "#ffffff";
    });
    // const randomState = Math.floor(Math.random() * bgColors.length);
    // return {
    //   bgColor: bgColors[randomState],
    //   textColor: textColors[randomState]
    // };
    const colors = [];
    Array.from({length: bgColors.length}).map((_, i) => i).forEach(i => colors.push({
      bgColor: bgColors[i],
      textColor: textColors[i]
    }));
    return colors;
  }
}

function getDaysAndHours(startDate, endDate) {
  const startHour = 24 * (startDate.getDay() || 7) + startDate.getHours() + startDate.getMinutes() / 60;
  const endHour = startHour + (endDate - startDate) / 3600e3;
  const daysHours = [];
  for (var i = Math.floor(startHour); i < Math.ceil(endHour); i++) {
    daysHours.push({day: Math.floor(i / 24) % 7, hour: i % 24});
  }
  return daysHours;
}



// initiate Calendar

const calendar = new Calendar();

function putEvents(events) {
  calendar.reset_events(events);
}
