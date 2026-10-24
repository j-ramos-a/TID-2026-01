/**
 * Traductor de errores del contrato y MetaMask a mensajes amigables en español.
 */

const CONTRACT_ERRORS = {
  InvalidVote: 'Tipo de voto no válido.',
  AlreadyVoted: 'Ya has votado de esta manera en esta respuesta.',
  CannotVoteOwnAnswer: 'No puedes votar tu propia respuesta.',
  AnswerNotFound: 'La respuesta no existe.',
  EmptyTitle: 'El título no puede estar vacío.',
  EmptyContent: 'El contenido no puede estar vacío.',
  QuestionNotFound: 'La pregunta no existe.',
  OwnableUnauthorizedAccount: 'No tienes permisos para esta acción.',
};

const METAMASK_ERRORS = {
  ACTION_REJECTED: 'Transacción rechazada por el usuario.',
  INSUFFICIENT_FUNDS: 'Fondos insuficientes para pagar el gas.',
  NETWORK_ERROR: 'Error de conexión con la red. Intenta de nuevo.',
  CALL_EXCEPTION: 'Error al ejecutar la función del contrato.',
  NONCE_EXPIRED: 'El nonce de la transacción ha expirado. Intenta de nuevo.',
  REPLACEMENT_UNDERPRICED: 'Gas insuficiente para reemplazar la transacción pendiente.',
  UNPREDICTABLE_GAS_LIMIT: 'No se pudo estimar el gas. La transacción podría fallar.',
};

export function parseContractError(error) {
  // 1. Check for user rejection (ethers v6)
  if (error?.code === 'ACTION_REJECTED' || error?.code === 4001) {
    return METAMASK_ERRORS.ACTION_REJECTED;
  }

  // 2. Check ethers error codes
  if (error?.code && METAMASK_ERRORS[error.code]) {
    return METAMASK_ERRORS[error.code];
  }

  // 3. Check for custom contract errors (revert reasons)
  const errorString = error?.message || error?.reason || String(error);

  for (const [key, message] of Object.entries(CONTRACT_ERRORS)) {
    if (errorString.includes(key)) {
      return message;
    }
  }

  // 4. Check for revert data
  if (error?.data?.message) {
    return error.data.message;
  }

  // 5. Check reason field
  if (error?.reason) {
    return error.reason;
  }

  // 6. Fallback
  if (errorString.includes('insufficient funds')) {
    return METAMASK_ERRORS.INSUFFICIENT_FUNDS;
  }
  if (errorString.includes('user rejected') || errorString.includes('User denied')) {
    return METAMASK_ERRORS.ACTION_REJECTED;
  }

  return 'Ha ocurrido un error inesperado. Consulta la consola para más detalles.';
}
