import { randomUUID } from 'node:crypto'
import { reservations } from './data/index.js'

type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'

export type CancellationApproval = {
  id: string
  reservationId: string
  requestedBy: string
  status: ApprovalStatus
  createdAt: string
  decidedBy: string | null
  decidedAt: string | null
}

const approvals = new Map<
  string,
  CancellationApproval
>()

export function requestReservationCancellation(
  reservationId: string,
  requestedBy: string
) {
  const reservation = reservations.find(
    item => item.id === reservationId
  )

  if (!reservation) {
    throw new Error('Reserva não encontrada')
  }

  if (
    reservation.status === 'completed' ||
    reservation.status === 'cancelled'
  ) {
    throw new Error(
      `A reserva com status ${reservation.status} não pode ser cancelada`
    )
  }

  const approval: CancellationApproval = {
    id: randomUUID(),
    reservationId,
    requestedBy,
    status: 'pending',
    createdAt: new Date().toISOString(),
    decidedBy: null,
    decidedAt: null
  }

  approvals.set(approval.id, approval)

  return approval
}

export function decideCancellation(
  approvalId: string,
  decision: 'approved' | 'rejected',
  decidedBy: string
) {
  const approval = approvals.get(approvalId)

  if (!approval) {
    throw new Error('Solicitação de aprovação não encontrada')
  }

  if (approval.status !== 'pending') {
    throw new Error('Esta solicitação já foi decidida')
  }

  const reservation = reservations.find(
    item => item.id === approval.reservationId
  )

  if (!reservation) {
    throw new Error('Reserva não encontrada')
  }

  approval.status = decision
  approval.decidedBy = decidedBy
  approval.decidedAt = new Date().toISOString()

  if (decision === 'approved') {
    reservation.status = 'cancelled'
  }

  return {
    approval,
    reservation
  }
}