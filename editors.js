const { useState } = React;

window.ClearAllConfirmation = ({ lot, onConfirm, onCancel, lotX, lotY, lotD, overflowX, overflowY }) => {
    const getCount = () => {
        if (lot === 'X') {
            return Object.keys(lotX).length + Object.keys(overflowX).length;
        } else if (lot === 'Y') {
            return Object.keys(lotY).length + Object.keys(overflowY).length;
        } else {
            return Object.keys(lotD).length;
        }
    };

    const count = getCount();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
                    <div>
                        <h3 className="text-xl font-bold text-red-600">Clear All Data?</h3>
                        <p className="text-gray-700 mt-2">
                            Are you sure you want to clear ALL data from Lot {lot}?
                        </p>
                        <p className="text-gray-700 mt-2 font-semibold">
                            This will remove {count} vehicle{count !== 1 ? 's' : ''} and cannot be undone.
                        </p>
                    </div>
                </div>
                
                <div className="flex gap-2 mt-6">
                    <button
                        onClick={onConfirm}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold"
                    >
                        Yes, Clear All
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

window.StallEditor = ({ stall, lot, onClose, lotD, lotX, lotY, setLotD, setLotX, setLotY, overflowX, overflowY }) => {
    const currentData = lot === 'D' ? lotD[stall] : lot === 'X' ? lotX[stall] : lotY[stall];
    const ticketValue = window.getTicketValue(currentData);
    const notesValue = window.getNotesValue(currentData);
    
    const [ticket, setTicket] = useState(ticketValue);
    const [notes, setNotes] = useState(notesValue);
    const [isTransient, setIsTransient] = useState(currentData?.isTransient || false);
    const [error, setError] = useState('');
    const blockingInfo = window.getBlockingInfo(lot, stall, lotD, lotX, lotY, overflowX, overflowY);

    const handleTicketChange = (value) => {
        const numericValue = value.replace(/[^0-9]/g, '');
        setTicket(numericValue);
        setError('');
    };

    const handleSave = () => {
        if (!isTransient) {
            if (ticket && ticket.length !== 6) {
                setError('Ticket number must be exactly 6 digits');
                return;
            }
            if (!ticket) {
                setError('Ticket number is required (or check Transient)');
                return;
            }
        }
        
        if (ticket) {
            const duplicate = window.checkDuplicateTicket(ticket, lot, stall, false, lotD, lotX, lotY, overflowX, overflowY);
            if (duplicate) {
                if (duplicate.overflow) {
                    setError(`Ticket already exists in Lot ${duplicate.lot} - ${duplicate.overflow}`);
                } else {
                    setError(`Ticket already exists in Lot ${duplicate.lot} - Stall ${duplicate.stall}`);
                }
                return;
            }
        }
        
        const newData = (ticket || isTransient) ? { ticket: ticket || '', notes, isTransient } : null;
        if (lot === 'D') {
            if (!newData) {
                const newLotD = { ...lotD };
                delete newLotD[stall];
                setLotD(newLotD);
            } else {
                setLotD({ ...lotD, [stall]: newData });
            }
        } else if (lot === 'X') {
            if (!newData) {
                const newLotX = { ...lotX };
                delete newLotX[stall];
                setLotX(newLotX);
            } else {
                setLotX({ ...lotX, [stall]: newData });
            }
        } else {
            if (!newData) {
                const newLotY = { ...lotY };
                delete newLotY[stall];
                setLotY(newLotY);
            } else {
                setLotY({ ...lotY, [stall]: newData });
            }
        }
        onClose();
    };

    const handleClear = () => {
        if (lot === 'D') {
            const newLotD = { ...lotD };
            delete newLotD[stall];
            setLotD(newLotD);
        } else if (lot === 'X') {
            const newLotX = { ...lotX };
            delete newLotX[stall];
            setLotX(newLotX);
        } else {
            const newLotY = { ...lotY };
            delete newLotY[stall];
            setLotY(newLotY);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Edit {stall}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>
                {blockingInfo && (
                    <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded flex items-start gap-2">
                        <AlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={20} />
                        <div className="text-sm">
                            {lot === 'D' && blockingInfo.multiple ? (
                                <div>
                                    <p className="font-semibold text-orange-800">Blocked by:</p>
                                    {blockingInfo.blocking.map((b, i) => (
                                        <p key={i} className="text-orange-700">{b.stall}: {b.ticket}</p>
                                    ))}
                                </div>
                            ) : lot === 'D' ? (
                                <div>
                                    <p className="font-semibold text-orange-800">Blocked by {blockingInfo.stall}</p>
                                    <p className="text-orange-700">Ticket: {blockingInfo.ticket}</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="font-semibold text-orange-800">Blocked by {blockingInfo.ofId}</p>
                                    <p className="text-orange-700">Ticket: {blockingInfo.ticket}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <input
                            type="checkbox"
                            id="transient-check"
                            checked={isTransient}
                            onChange={(e) => {
                                setIsTransient(e.target.checked);
                                setError('');
                            }}
                            className="w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor="transient-check" className="text-sm font-medium cursor-pointer">
                            Transient (No ticket number required)
                        </label>
                    </div>
                    <label className="block text-sm font-medium mb-1">Ticket Number</label>
                    <input
                        type="text"
                        value={ticket}
                        onChange={(e) => handleTicketChange(e.target.value)}
                        placeholder={isTransient ? "Optional" : "6-digit ticket"}
                        maxLength="6"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className={`w-full px-3 py-2 border rounded ${error ? 'border-red-500' : ''} ${isTransient ? 'bg-gray-100' : ''}`}
                        disabled={lot !== 'D' && !!blockingInfo}
                    />
                    {error && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} />
                            {error}
                        </p>
                    )}
                    {!error && blockingInfo && lot === 'D' && (
                        <p className="text-xs text-orange-600 mt-1">
                            Warning: This car is blocked by car(s) behind it.
                        </p>
                    )}
                    {!error && blockingInfo && lot !== 'D' && (
                        <p className="text-xs text-red-600 mt-1">
                            Cannot edit - car is blocked by overflow.
                        </p>
                    )}
                    {!error && !isTransient && ticket && ticket.length < 6 && (
                        <p className="text-xs text-gray-500 mt-1">
                            {6 - ticket.length} more digit{6 - ticket.length !== 1 ? 's' : ''} needed
                        </p>
                    )}
                </div>
                <div className="mt-3">
                    <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g., White Tesla, keys at desk"
                        rows="2"
                        className="w-full px-3 py-2 border rounded resize-none"
                    />
                </div>
                <div className="flex gap-2 mt-6">
                    <button
                        onClick={handleSave}
                        disabled={lot !== 'D' && !!blockingInfo}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        Save
                    </button>
                    {ticketValue && (
                        <button
                            onClick={handleClear}
                            className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                        >
                            Clear
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

window.OverflowEditor = ({ lot, ofId, onClose, lotX, lotY, overflowX, overflowY, setOverflowX, setOverflowY, lotD }) => {
    const overflowData = lot === 'X' ? overflowX : overflowY;
    const isNew = !overflowData[ofId];
    const [ticket, setTicket] = useState(overflowData[ofId]?.ticket || '');
    const [notes, setNotes] = useState(overflowData[ofId]?.notes || '');
    const [isTransient, setIsTransient] = useState(overflowData[ofId]?.isTransient || false);
    const [selectedStalls, setSelectedStalls] = useState(overflowData[ofId]?.blocks || []);
    const [error, setError] = useState('');
    const availableStalls = lot === 'X' ? window.LOT_X_STALLS : window.LOT_Y_STALLS;
    const availableOverflowSpots = lot === 'X' ? window.LOT_X_OVERFLOW_SPOTS : window.LOT_Y_OVERFLOW_SPOTS;

    const handleTicketChange = (value) => {
        const numericValue = value.replace(/[^0-9]/g, '');
        setTicket(numericValue);
        setError('');
    };

    const toggleStall = (stall) => {
        setSelectedStalls(prev => 
            prev.includes(stall) ? prev.filter(s => s !== stall) : [...prev, stall]
        );
    };

    const handleSave = () => {
        if (!isTransient) {
            if (!ticket) {
                setError('Ticket number is required (or check Transient)');
                return;
            }
            if (ticket.length !== 6) {
                setError('Ticket number must be exactly 6 digits');
                return;
            }
        }
        
        if (ticket) {
            const duplicate = window.checkDuplicateTicket(ticket, lot, ofId, true, lotD, lotX, lotY, overflowX, overflowY);
            if (duplicate) {
                if (duplicate.overflow) {
                    setError(`Ticket already exists in Lot ${duplicate.lot} - ${duplicate.overflow}`);
                } else {
                    setError(`Ticket already exists in Lot ${duplicate.lot} - Stall ${duplicate.stall}`);
                }
                return;
            }
        }
        
        const newData = { ticket: ticket || '', notes, blocks: selectedStalls, isTransient };
        if (lot === 'X') {
            setOverflowX({ ...overflowX, [ofId]: newData });
        } else {
            setOverflowY({ ...overflowY, [ofId]: newData });
        }
        onClose();
    };

    const handleDelete = () => {
        if (lot === 'X') {
            const newOverflowX = { ...overflowX };
            delete newOverflowX[ofId];
            setOverflowX(newOverflowX);
        } else {
            const newOverflowY = { ...overflowY };
            delete newOverflowY[ofId];
            setOverflowY(newOverflowY);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{isNew ? 'Add' : 'Edit'} {ofId}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <input
                                type="checkbox"
                                id="transient-overflow-check"
                                checked={isTransient}
                                onChange={(e) => {
                                    setIsTransient(e.target.checked);
                                    setError('');
                                }}
                                className="w-4 h-4 cursor-pointer"
                            />
                            <label htmlFor="transient-overflow-check" className="text-sm font-medium cursor-pointer">
                                Transient (No ticket number required)
                            </label>
                        </div>
                        <label className="block text-sm font-medium mb-1">Ticket Number</label>
                        <input
                            type="text"
                            value={ticket}
                            onChange={(e) => handleTicketChange(e.target.value)}
                            placeholder={isTransient ? "Optional" : "6-digit ticket"}
                            maxLength="6"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className={`w-full px-3 py-2 border rounded ${error ? 'border-red-500' : ''} ${isTransient ? 'bg-gray-100' : ''}`}
                        />
                        {error && (
                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <AlertCircle size={12} />
                                {error}
                            </p>
                        )}
                        {!error && !isTransient && ticket && ticket.length < 6 && (
                            <p className="text-xs text-gray-500 mt-1">
                                {6 - ticket.length} more digit{6 - ticket.length !== 1 ? 's' : ''} needed
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g., Black SUV, valet kept keys"
                            rows="2"
                            className="w-full px-3 py-2 border rounded resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Blocks Stalls (optional):</label>
                        
                        <div className="mb-3">
                            <p className="text-xs text-gray-600 mb-2 font-medium">Regular Stalls:</p>
                            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
                                {availableStalls.map(stall => {
                                    const stallData = lot === 'X' ? lotX[stall] : lotY[stall];
                                    return (
                                        <button
                                            key={stall}
                                            type="button"
                                            onClick={() => toggleStall(stall)}
                                            className={`px-2 py-2 rounded border text-xs ${
                                                selectedStalls.includes(stall)
                                                    ? 'bg-red-500 text-white border-red-600'
                                                    : 'bg-white border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="font-bold">{stall}</div>
                                            {stallData && (
                                                <div className="text-[10px] mt-0.5 truncate">
                                                    {window.getTicketValue(stallData)}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-gray-600 mb-2 font-medium">Overflow Stalls:</p>
                            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border rounded bg-gray-50">
                                {availableOverflowSpots.map(overflow => {
                                    if (overflow === ofId) return null;
                                    
                                    const overflowStallData = overflowData[overflow];
                                    return (
                                        <button
                                            key={overflow}
                                            type="button"
                                            onClick={() => toggleStall(overflow)}
                                            className={`px-2 py-2 rounded border text-xs ${
                                                selectedStalls.includes(overflow)
                                                    ? 'bg-red-500 text-white border-red-600'
                                                    : 'bg-white border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="font-bold">{overflow}</div>
                                            {overflowStallData && (
                                                <div className="text-[10px] mt-0.5 truncate">
                                                    {overflowStallData.ticket}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 mt-6">
                    <button
                        type="button"
                        onClick={handleSave}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Save
                    </button>
                    {!isNew && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                        >
                            Delete
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};