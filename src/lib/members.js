// Member directory helpers (browser side).
//
// The directory is a normal Telegraph Cloud collection (`members`), one
// document per person. These helpers only derive *options and lookups* from
// data that already exists — they never invent people, classes or divisions.

const ROLE_FALLBACKS = [
  "Pembina PMR",
  "Ketua",
  "Wakil Ketua",
  "Sekretaris 1",
  "Sekretaris 2",
  "Bendahara 1",
  "Bendahara 2",
  "Anggota",
];

export const WEEKDAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "id"));
}

/** Normalised key used to match a roster officer with a directory member. */
export function memberKey(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** Every class name that already appears in the directory or the roster. */
export function classOptions(members = [], roster = null) {
  const classes = members.map((member) => member.class_name);
  const shifts = [...(roster?.uks_schedule || []), ...(roster?.field_schedule || [])];
  shifts.forEach((shift) => (shift.officers || []).forEach((officer) => classes.push(officer.class_name)));
  return uniqueSorted(classes).map((value) => ({ value, label: value }));
}

/** Divisions come from the organisation document first, then from members. */
export function divisionOptions(members = [], org = null) {
  const names = [
    ...(org?.divisions || []).map((division) => division.name),
    ...members.map((member) => member.division),
  ];
  return uniqueSorted(names).map((value) => ({ value, label: value }));
}

/** Job titles that really exist in this organisation, plus the usual board. */
export function roleOptions(members = [], org = null) {
  const roles = [
    ...(org?.leaders || []).map((person) => person.role),
    ...(org?.advisory || []).map((person) => person.role),
    ...members.map((member) => member.role),
    ...ROLE_FALLBACKS,
  ];
  return uniqueSorted(roles).map((value) => ({ value, label: value }));
}

/** Members that should be offered when filling a duty shift. */
export function activeMembers(members = []) {
  return members.filter((member) => member.active !== false);
}

/**
 * Roster officers may be plain strings (legacy) or objects that point at a
 * directory member. This resolves both into one displayable person, including
 * the portrait when the directory has one.
 */
export function resolveOfficer(officer, members = []) {
  const source = typeof officer === "string" ? { name: officer } : officer || {};
  const byId = source.id ? members.find((member) => String(member.id) === String(source.id)) : null;
  const byName = members.find((member) => memberKey(member.name) === memberKey(source.name));
  const member = byId || byName || null;
  const name = member?.name || source.name || "";
  const class_name = source.class_name || member?.class_name || "";
  return { id: member?.id || source.id || "", name, class_name, photo: source.photo || member?.photo || "", division: member?.division || "" };
}

/** Group the directory by division, keeping the organisation's own order. */
export function groupByDivision(members = [], org = null, { fallbackLabel = "Tanpa divisi" } = {}) {
  const order = (org?.divisions || []).map((division) => division.name);
  const groups = new Map();
  order.forEach((name) => groups.set(name, []));
  members.forEach((member) => {
    const key = member.division || fallbackLabel;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(member);
  });
  return [...groups.entries()]
    .filter(([, list]) => list.length)
    .map(([name, list]) => ({ name, members: list }));
}

/**
 * Builds the shifts of one month (weekday names + Indonesian date labels).
 * Pure date maths — no organisation data is invented.
 */
export function buildMonthShifts({ month, year, days = ["Senin", "Rabu"], count = 4 } = {}) {
  const monthIndex = MONTHS.indexOf(month);
  if (monthIndex < 0) return [];
  const shifts = [];
  const date = new Date(Date.UTC(Number(year), monthIndex, 1));
  const weekOccurrence = new Map();
  while (date.getUTCMonth() === monthIndex) {
    const weekday = WEEKDAYS[(date.getUTCDay() + 6) % 7];
    if (days.includes(weekday)) {
      const seen = (weekOccurrence.get(weekday) || 0) + 1;
      weekOccurrence.set(weekday, seen);
      if (seen <= count) {
        shifts.push({
          date: `${weekday}, ${date.getUTCDate()} ${month} ${year}`,
          day: weekday,
          officers: [],
        });
      }
    }
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return shifts;
}

export default activeMembers;
