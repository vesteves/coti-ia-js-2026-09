import { DatabaseSync } from 'node:sqlite'
import {
  bedrooms,
  guests,
  reservations
} from '../data/index.js'

const database = new DatabaseSync(':memory:')

database.exec(`
  CREATE TABLE guests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL
  );

  CREATE TABLE bedrooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE reservations (
    id TEXT PRIMARY KEY,
    guest_id TEXT NOT NULL,
    bedroom_id TEXT NOT NULL,
    checkin_at TEXT NOT NULL,
    checkout_at TEXT NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY (guest_id) REFERENCES guests(id),
    FOREIGN KEY (bedroom_id) REFERENCES bedrooms(id)
  );
`)

const insertGuest = database.prepare(`
  INSERT INTO guests (id, name, email)
  VALUES (?, ?, ?)
`)

const insertBedroom = database.prepare(`
  INSERT INTO bedrooms (id, name)
  VALUES (?, ?)
`)

const insertReservation = database.prepare(`
  INSERT INTO reservations (
    id,
    guest_id,
    bedroom_id,
    checkin_at,
    checkout_at,
    status
  )
  VALUES (?, ?, ?, ?, ?, ?)
`)

for (const guest of guests) {
  insertGuest.run(
    guest.id,
    guest.name,
    guest.email
  )
}

for (const bedroom of bedrooms) {
  insertBedroom.run(
    bedroom.id,
    bedroom.name
  )
}

for (const reservation of reservations) {
  insertReservation.run(
    reservation.id,
    reservation.guestId,
    reservation.bedroomId,
    reservation.checkinAt,
    reservation.checkoutAt,
    reservation.status
  )
}

function findGuestReservationsInDatabase(
  name: string
) {
  console.log(
    'TOOL findGuestReservationsInDatabase EXECUTADA'
  )

  const statement = database.prepare(`
    SELECT
      guests.name AS guest,
      guests.email,
      reservations.id AS reservation,
      bedrooms.name AS bedroom,
      reservations.checkin_at AS checkinAt,
      reservations.checkout_at AS checkoutAt,
      reservations.status
    FROM guests
    LEFT JOIN reservations
      ON reservations.guest_id = guests.id
    LEFT JOIN bedrooms
      ON bedrooms.id = reservations.bedroom_id
    WHERE LOWER(guests.name) LIKE LOWER(?)
    ORDER BY reservations.checkin_at
  `)

  return statement.all(`%${name}%`)
}

try {
  const result =
    findGuestReservationsInDatabase('João')

  console.table(result)
} finally {
  database.close()
}
