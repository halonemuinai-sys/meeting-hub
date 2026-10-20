/**
 * RFC 5545 iCalendar (.ics) Generator
 * Generates standards-compliant calendar invitations for Outlook, Apple Calendar, and Google Calendar.
 */

function formatIcsDate(dateInput) {
  const d = new Date(dateInput);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeIcsText(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate .ics calendar content
 * @param {object} booking
 * @param {object} room
 * @param {object} company
 * @param {string[]} attendeeEmails
 * @returns {string} ics content
 */
function generateIcs(booking, room, company, attendeeEmails = []) {
  const uid = booking.calendarUid || `mra-booking-${booking.id}@mra.co.id`;
  const dtStamp = formatIcsDate(new Date());
  const dtStart = formatIcsDate(booking.startTime);
  const dtEnd = formatIcsDate(booking.endTime);
  const companyName = company?.name || room?.company?.name || 'MRA Group';
  const roomFloor = room?.floor ? ` (${room.floor})` : '';
  const location = escapeIcsText(`${room?.name || 'Meeting Room'}${roomFloor} - ${companyName}`);
  const summary = escapeIcsText(booking.title || 'Meeting');
  
  const descriptionBody = [
    `Agenda / Description: ${booking.description || 'Internal MRA Corporate Meeting'}`,
    `Room: ${room?.name || 'Meeting Room'} (${companyName})`,
    `Host / Organizer: ${booking.organizerName || 'Organizer'} (${booking.organizerEmail || 'meeting@mra.co.id'})`,
    `Department: ${booking.department || '-'}`,
    `Attendees Count: ${booking.attendeesCount || 1} pax`,
    booking.specialRequests ? `Special Requests: ${booking.specialRequests}` : '',
    '',
    'Booked via MRA Group Meeting Room Booking Portal'
  ].filter(Boolean).join('\n');

  const escapedDescription = escapeIcsText(descriptionBody);

  const lines = [
    'BEGIN:VCALENDAR',
    'PRODID:-//MRA Group//Meeting Room Booking//EN',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${escapedDescription}`,
    `LOCATION:${location}`,
    `ORGANIZER;CN="${booking.organizerName || 'Organizer'}":mailto:${booking.organizerEmail || 'meeting@mra.co.id'}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'TRANSP:OPAQUE'
  ];

  attendeeEmails.forEach((email) => {
    const trimmed = String(email).trim();
    if (trimmed && trimmed.includes('@')) {
      lines.push(`ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${trimmed}`);
    }
  });

  lines.push(
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: ' + summary,
    'TRIGGER:-PT15M',
    'END:VALARM'
  );

  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

module.exports = { generateIcs, formatIcsDate };
