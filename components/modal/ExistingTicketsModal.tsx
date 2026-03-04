import React, { useState } from 'react';
import type { BulkTicketItem } from '../../services/tickets.service';

interface ExistingTicketsModalProps {
  isOpen: boolean;
  existingTickets: Array<{
    ticketId: string;
    ticket: BulkTicketItem;
  }>;
  onUpdate: () => void;
  onSkip: () => void;
  isUpdating?: boolean;
}

const ExistingTicketsModal: React.FC<ExistingTicketsModalProps> = ({
  isOpen,
  existingTickets,
  onUpdate,
  onSkip,
  isUpdating = false,
}) => {
  if (!isOpen || existingTickets.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-500 text-[24px]">warning</span>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900">Existing Tickets Found</h3>
            <p className="text-sm text-slate-600 mt-0.5">
              {existingTickets.length} ticket{existingTickets.length > 1 ? 's' : ''} already exist in the system
            </p>
          </div>
        </div>

        {/* Body - Scrollable List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-sm text-slate-700 mb-4">
            The following tickets already exist. Would you like to update them with the new data?
          </p>

          <div className="space-y-3">
            {existingTickets.map((item, index) => {
              const ticket = item.ticket;
              return (
                <div
                  key={index}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {ticket.ticketId}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-full font-semibold">
                          {ticket.ticketTypeName}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full font-semibold">
                          {ticket.ticketStatusName}
                        </span>
                      </div>

                      <div className="text-sm text-slate-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">folder</span>
                          <span>{ticket.projectName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">badge</span>
                          <span>{ticket.roleNames.join(', ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                          <span>
                            Week {ticket.week} · Month {ticket.month}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500">
                      <div>Created: {new Date(ticket.createdAt).toLocaleDateString()}</div>
                      <div>Updated: {new Date(ticket.updatedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer - Actions */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onSkip}
            disabled={isUpdating}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip
          </button>
          <button
            onClick={onUpdate}
            disabled={isUpdating}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUpdating ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Updating...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">update</span>
                Update Tickets
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExistingTicketsModal;
