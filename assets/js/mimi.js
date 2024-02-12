export function mimi(mimi) {
  return [...mimi]
    .map((s) => String.fromCharCode(1 + s.charCodeAt()))
    .reduce((s, a) => s + a);
}

export function getThisMonday() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when today is Sunday
  const monday = new Date(today.setDate(diff));

  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, "0");
  const day = String(monday.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getNextMonday() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 1 ? 7 : 8 - dayOfWeek); // Adjust when today is Monday or after
  const monday = new Date(today.setDate(diff));

  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, "0");
  const day = String(monday.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function calcTimeDiff() {
    const now = new Date();
    return new Date(now.toLocaleString()) - new Date(now.toLocaleString('en-US', {timeZone: 'America/Vancouver'}));
}

export function formatEvent(row, id) {
    const diff = calcTimeDiff();
    const start = new Date(
        row[0].substr(0, 4),
        row[0].substr(4, 2),
        row[0].substr(6, 2),
        row[1].split(':')[0],
        row[1].split(':')[1]).valueOf() + diff;
    const end = new Date(
        row[0].substr(0, 4),
        row[0].substr(4, 2),
        row[0].substr(6, 2),
        row[2].split(':')[0],
        row[2].split(':')[1]).valueOf() + diff;
    var eventName = `${row[4]}\n${row[6]}`;
    return {id: id, eventName: eventName, dateFrom: start, dateTo: end};
}
