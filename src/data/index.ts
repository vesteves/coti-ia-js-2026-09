import guestsData from './guests.json' with { type: 'json' }
import bedroomsData from './bedrooms.json' with { type: 'json' }
import reservationsData from './reservations.json' with { type: 'json' }
import type { Bedroom, Guest, PopulatedReservation, Reservation } from '../types.js'

export const guests = guestsData as Guest[]
export const bedrooms = bedroomsData as Bedroom[]
export const reservations = reservationsData as Reservation[]

export function getPopulatedReservations(): PopulatedReservation[] {
  return reservations.map(({ guestId, bedroomId, ...reservation }) => {
    const guest = guests.find(({ id }) => id === guestId)
    const bedroom = bedrooms.find(({ id }) => id === bedroomId)

    if (!guest || !bedroom) {
      throw new Error(`Reserva ${reservation.id} possui relacionamentos inválidos`)
    }

    return {
      ...reservation,
      guest,
      bedroom
    }
  })
}
