import AuditLog from '../models/AuditLog.js';
import Board from '../models/Board.js';
import Alert from '../models/Alert.js';

/**
 * Creates a new audit log record.
 * @param {string} action - The action type (e.g. 'Alert Created')
 * @param {object} params - Log details
 * @param {string} params.user - The user email or actor (e.g. 'admin@smartreach.com')
 * @param {string} [params.boardId] - Board DB id
 * @param {string} [params.alertId] - Alert DB id
 * @param {object} [params.details] - Extra JSON metadata
 */
export const logEvent = async (action, { user, boardId, alertId, details = {} } = {}) => {
  try {
    let boardName = null;
    let alertTitle = null;

    if (boardId) {
      const board = await Board.findById(boardId);
      if (board) {
        boardName = board.boardName;
      }
    }

    if (alertId) {
      const alertItem = await Alert.findById(alertId);
      if (alertItem) {
        alertTitle = alertItem.title;
      }
    }

    const logEntry = await AuditLog.create({
      timestamp: new Date(),
      user: user || 'System',
      boardId: boardId || null,
      boardName,
      alertId: alertId || null,
      alertTitle,
      action,
      details
    });

    console.log(`[AUDIT LOG] ${action} - User: ${user || 'System'} | Board: ${boardName || 'N/A'} | Alert: ${alertTitle || 'N/A'}`);
    return logEntry;
  } catch (error) {
    console.error(`Failed to write Audit Log for action ${action}:`, error);
  }
};
