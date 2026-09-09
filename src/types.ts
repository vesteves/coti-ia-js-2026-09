export type Guest = {
  id: string
  name: string
  email: string
  phone: string
  city: string
  preferences: string[]
}

export type Bedroom = {
  id: string
  name: string
  description: string
  capacity: number
  price: number
  amenities: string[]
}

export type Reservation = {
  id: string
  guestId: string
  bedroomId: string
  checkinAt: string
  checkoutAt: string
  guests: number
  price: number
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled'
  specialRequests: string[]
}

export type PopulatedReservation = Omit<Reservation, 'guestId' | 'bedroomId'> & {
  guest: Guest
  bedroom: Bedroom
}
