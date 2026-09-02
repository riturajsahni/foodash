import { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';

/**
 * useOrderAssignmentStatus
 *
 * Single source of truth for the "Searching → Assigned/Failed" UI state
 * shown on BOTH the customer's order tracking page and the restaurant's
 * order card. Both consume this same hook so the phase logic is written
 * once, not duplicated per-dashboard.
 *
 * Listens for the assignment:* events emitted by assignmentService on
 * the backend and filters them to the specific orderId this instance
 * cares about (the server broadcasts to room-scoped audiences, but a
 * customer/restaurant room can have more than one active order, so we
 * still filter by orderId client-side to be safe).
 *
 * @param {String} orderId
 * @param {Object} initial - optional initial state, e.g. from a REST
 *                            fetch of the order (assignmentStatus,
 *                            deliveryPartner) so the UI isn't blank
 *                            before any socket event has fired yet.
 */
export function useOrderAssignmentStatus(orderId, initial = {}) {
  const socketRef = useSocket();

  const [state, setState] = useState(() => ({
    phase:   mapInitialPhase(initial.assignmentStatus),
    partner: initial.deliveryPartner || null,
    message: '',
    attempt: 0,
  }));

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !orderId) return;

    const matches = (payload) => String(payload.orderId) === String(orderId);

    const onSearching = (p) => {
      if (!matches(p)) return;
      setState(s => ({ ...s, phase: 'searching', message: p.message }));
    };
    const onOffering = (p) => {
      if (!matches(p)) return;
      setState(s => ({ ...s, phase: 'searching', attempt: p.attempt }));
    };
    const onAssigned = (p) => {
      if (!matches(p)) return;
      setState({ phase: 'assigned', partner: p.partner, message: '', attempt: 0 });
    };
    const onFailed = (p) => {
      if (!matches(p)) return;
      setState(s => ({ ...s, phase: 'failed', message: p.message }));
    };

    socket.on('assignment:searching',        onSearching);
    socket.on('assignment:offering',         onOffering);
    socket.on('assignment:partner_assigned', onAssigned);
    socket.on('assignment:failed',           onFailed);

    return () => {
      socket.off('assignment:searching',        onSearching);
      socket.off('assignment:offering',         onOffering);
      socket.off('assignment:partner_assigned', onAssigned);
      socket.off('assignment:failed',           onFailed);
    };
  }, [socketRef, orderId]);

  return state;
}

function mapInitialPhase(assignmentStatus) {
  switch (assignmentStatus) {
    case 'assigned': return 'assigned';
    case 'searching': return 'searching';
    case 'failed':    return 'failed';
    default:          return 'idle';
  }
}