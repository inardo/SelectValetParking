const { useState, useEffect } = React;

function ValetParkingApp() {
    const [lotD, setLotD] = useState(() => window.migrateData(localStorage.getItem('lotD')));
    const [lotX, setLotX] = useState(() => window.migrateData(localStorage.getItem('lotX')));
    const [lotY, setLotY] = useState(() => window.migrateData(localStorage.getItem('lotY')));
    const [overflowX, setOverflowX] = useState(() => {
        const saved = localStorage.getItem('overflowX');
        return saved ? JSON.parse(saved) : {};
    });
    const [overflowY, setOverflowY] = useState(() => {
        const saved = localStorage.getItem('overflowY');
        return saved ? JSON.parse(saved) : {};
    });
    
    useEffect(() => { localStorage.setItem('lotD', JSON.stringify(lotD)); }, [lotD]);
    useEffect(() => { localStorage.setItem('lotX', JSON.stringify(lotX)); }, [lotX]);
    useEffect(() => { localStorage.setItem('lotY', JSON.stringify(lotY)); }, [lotY]);
    useEffect(() => { localStorage.setItem('overflowX', JSON.stringify(overflowX)); }, [overflowX]);
    useEffect(() => { localStorage.setItem('overflowY', JSON.stringify(overflowY)); }, [overflowY]);
    
    const [activeTab, setActiveTab] = useState('X');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingStall, setEditingStall] = useState(null);
    const [editingOverflow, setEditingOverflow] = useState(null);
    const [searchResult, setSearchResult] = useState(null);
    const [showClearAllConfirm, setShowClearAllConfirm] = useState(null);
    const [moveMode, setMoveMode] = useState(null);

    const [debugInfo, setDebugInfo] = useState('');

    const handleSearch = () => {
        if (!searchTerm) {
            setSearchResult(null);
            return;
        }
        const searchTicket = searchTerm.trim();
        if (searchTicket.length !== 6) {
            setSearchResult({ error: 'Please enter a 6-digit ticket number' });
            return;
        }
        if (!/^\d+$/.test(searchTicket)) {
            setSearchResult({ error: 'Ticket number must contain only numbers' });
            return;
        }
        
        for (const [stall, ticketData] of Object.entries(lotD)) {
            const ticket = window.getTicketValue(ticketData);
            if (ticket === searchTicket) {
                const blockingInfo = window.getAllBlockingInfo('D', stall, lotD, lotX, lotY, overflowX, overflowY);
                const notes = window.getNotesValue(ticketData);
                setSearchResult({ lot: 'D', stall, blockingInfo, notes });
                setActiveTab('D');
                return;
            }
        }
        for (const [stall, ticketData] of Object.entries(lotX)) {
            const ticket = window.getTicketValue(ticketData);
            if (ticket === searchTicket) {
                const blockingInfo = window.getAllBlockingInfo('X', stall, lotD, lotX, lotY, overflowX, overflowY);
                const notes = window.getNotesValue(ticketData);
                setSearchResult({ lot: 'X', stall, blockingInfo, notes });
                setActiveTab('X');
                return;
            }
        }
        for (const [stall, ticketData] of Object.entries(lotY)) {
            const ticket = window.getTicketValue(ticketData);
            if (ticket === searchTicket) {
                const blockingInfo = window.getAllBlockingInfo('Y', stall, lotD, lotX, lotY, overflowX, overflowY);
                const notes = window.getNotesValue(ticketData);
                setSearchResult({ lot: 'Y', stall, blockingInfo, notes });
                setActiveTab('Y');
                return;
            }
        }
        for (const [ofId, data] of Object.entries(overflowX)) {
            if (data.ticket === searchTicket) {
                setSearchResult({ lot: 'X', overflow: ofId, blocks: data.blocks, notes: data.notes || '' });
                setActiveTab('X');
                return;
            }
        }
        for (const [ofId, data] of Object.entries(overflowY)) {
            if (data.ticket === searchTicket) {
                setSearchResult({ lot: 'Y', overflow: ofId, blocks: data.blocks, notes: data.notes || '' });
                setActiveTab('Y');
                return;
            }
        }
        setSearchResult({ notFound: true });
    };

    const handleClearAll = (lot) => {
        if (lot === 'X') {
            setLotX({});
            setOverflowX({});
        } else if (lot === 'Y') {
            setLotY({});
            setOverflowY({});
        } else if (lot === 'D') {
            setLotD({});
        }
        setShowClearAllConfirm(null);
    };


const handleStallClick = (type, lot, id) => {
        // If in move mode, complete the move
        if (moveMode) {
            handleMove(type, lot, id);
            return;
        }
        
        // Otherwise open the editor
        if (type === 'stall') {
            setEditingStall({ stall: id, lot });
        } else {
            setEditingOverflow({ lot, ofId: id });
        }
    };
    
    const handleStartMove = (type, lot, id, data) => {
        setDebugInfo(`Move mode started for ${id}`);
        setMoveMode({ type, lot, id, data });
    };

    const handleMove = (targetType, targetLot, targetId) => {
        const sourceType = moveMode.type;
        const sourceLot = moveMode.lot;
        const sourceId = moveMode.id;
        const sourceData = moveMode.data;

        if (sourceType === targetType && sourceLot === targetLot && sourceId === targetId) {
            setMoveMode(null);
            return;
        }

        let targetData = null;
        if (targetType === 'stall') {
            targetData = targetLot === 'D' ? lotD[targetId] : targetLot === 'X' ? lotX[targetId] : lotY[targetId];
        } else if (targetType === 'overflow') {
            const targetOverflow = targetLot === 'X' ? overflowX : overflowY;
            targetData = targetOverflow[targetId];
        }

        if (targetType === 'stall') {
            const blockInfo = window.getBlockingInfo(targetLot, targetId, lotD, lotX, lotY, overflowX, overflowY);
            if (blockInfo && targetLot !== 'D') {
                alert('Cannot move to a blocked stall!');
                setMoveMode(null);
                return;
            }
        }

        if (sourceType === 'stall' && targetType === 'stall') {
            if (sourceLot === 'D') {
                const newLotD = { ...lotD };
                if (targetData) {
                    newLotD[sourceId] = targetData;
                } else {
                    delete newLotD[sourceId];
                }
                if (targetLot === 'D') {
                    newLotD[targetId] = sourceData;
                    setLotD(newLotD);
                } else if (targetLot === 'X') {
                    const newLotX = { ...lotX };
                    newLotX[targetId] = sourceData;
                    setLotD(newLotD);
                    setLotX(newLotX);
                } else {
                    const newLotY = { ...lotY };
                    newLotY[targetId] = sourceData;
                    setLotD(newLotD);
                    setLotY(newLotY);
                }
            } else if (sourceLot === 'X') {
                const newLotX = { ...lotX };
                if (targetData) {
                    newLotX[sourceId] = targetData;
                } else {
                    delete newLotX[sourceId];
                }
                if (targetLot === 'X') {
                    newLotX[targetId] = sourceData;
                    setLotX(newLotX);
                } else if (targetLot === 'D') {
                    const newLotD = { ...lotD };
                    newLotD[targetId] = sourceData;
                    setLotX(newLotX);
                    setLotD(newLotD);
                } else {
                    const newLotY = { ...lotY };
                    newLotY[targetId] = sourceData;
                    setLotX(newLotX);
                    setLotY(newLotY);
                }
            } else {
                const newLotY = { ...lotY };
                if (targetData) {
                    newLotY[sourceId] = targetData;
                } else {
                    delete newLotY[sourceId];
                }
                if (targetLot === 'Y') {
                    newLotY[targetId] = sourceData;
                    setLotY(newLotY);
                } else if (targetLot === 'D') {
                    const newLotD = { ...lotD };
                    newLotD[targetId] = sourceData;
                    setLotY(newLotY);
                    setLotD(newLotD);
                } else {
                    const newLotX = { ...lotX };
                    newLotX[targetId] = sourceData;
                    setLotY(newLotY);
                    setLotX(newLotX);
                }
            }
        } else if (sourceType === 'stall' && targetType === 'overflow') {
            if (sourceLot === 'D') {
                const newLotD = { ...lotD };
                delete newLotD[sourceId];
                setLotD(newLotD);
            } else if (sourceLot === 'X') {
                const newLotX = { ...lotX };
                delete newLotX[sourceId];
                setLotX(newLotX);
            } else {
                const newLotY = { ...lotY };
                delete newLotY[sourceId];
                setLotY(newLotY);
            }
            
            if (targetLot === 'X') {
                const newOverflowX = { ...overflowX };
                newOverflowX[targetId] = {
                    ticket: window.getTicketValue(sourceData),
                    notes: window.getNotesValue(sourceData),
                    blocks: targetData?.blocks || [],
                    isTransient: sourceData?.isTransient || false
                };
                setOverflowX(newOverflowX);
            } else {
                const newOverflowY = { ...overflowY };
                newOverflowY[targetId] = {
                    ticket: window.getTicketValue(sourceData),
                    notes: window.getNotesValue(sourceData),
                    blocks: targetData?.blocks || [],
                    isTransient: sourceData?.isTransient || false
                };
                setOverflowY(newOverflowY);
            }
        } else if (sourceType === 'overflow' && targetType === 'stall') {
            if (sourceLot === 'X') {
                const newOverflowX = { ...overflowX };
                delete newOverflowX[sourceId];
                setOverflowX(newOverflowX);
            } else {
                const newOverflowY = { ...overflowY };
                delete newOverflowY[sourceId];
                setOverflowY(newOverflowY);
            }
            
            const newStallData = {
                ticket: sourceData.ticket,
                notes: sourceData.notes || '',
                isTransient: sourceData.isTransient || false
            };
            
            if (targetLot === 'D') {
                const newLotD = { ...lotD };
                newLotD[targetId] = newStallData;
                setLotD(newLotD);
            } else if (targetLot === 'X') {
                const newLotX = { ...lotX };
                newLotX[targetId] = newStallData;
                setLotX(newLotX);
            } else {
                const newLotY = { ...lotY };
                newLotY[targetId] = newStallData;
                setLotY(newLotY);
            }
        } else if (sourceType === 'overflow' && targetType === 'overflow') {
            if (sourceLot === targetLot) {
                if (sourceLot === 'X') {
                    const newOverflowX = { ...overflowX };
                    if (targetData) {
                        newOverflowX[sourceId] = targetData;
                        newOverflowX[targetId] = sourceData;
                    } else {
                        delete newOverflowX[sourceId];
                        newOverflowX[targetId] = sourceData;
                    }
                    setOverflowX(newOverflowX);
                } else {
                    const newOverflowY = { ...overflowY };
                    if (targetData) {
                        newOverflowY[sourceId] = targetData;
                        newOverflowY[targetId] = sourceData;
                    } else {
                        delete newOverflowY[sourceId];
                        newOverflowY[targetId] = sourceData;
                    }
                    setOverflowY(newOverflowY);
                }
            }
        }

        setMoveMode(null);
    };

    const Stall = ({ id, lot, data }) => {
        const ticketValue = window.getTicketValue(data);
        const notesValue = window.getNotesValue(data);
        const isTransient = data?.isTransient || false;
        const isOccupied = !!ticketValue || isTransient;
        const blockingInfo = window.getBlockingInfo(lot, id, lotD, lotX, lotY, overflowX, overflowY);
        const isHighlighted = searchResult && searchResult.lot === lot && searchResult.stall === id && !searchResult.overflow;
        const isInMoveMode = moveMode && moveMode.type === 'stall' && moveMode.lot === lot && moveMode.id === id;

        let bgColor, borderColor, ringColor;
        
        if (isInMoveMode) {
            bgColor = 'bg-blue-200';
            borderColor = 'border-blue-600';
            ringColor = 'ring-4 ring-blue-400 animate-pulse';
        } else if (blockingInfo) {
            bgColor = 'bg-red-100';
            borderColor = 'border-red-400';
            ringColor = '';
        } else if (isHighlighted) {
            bgColor = 'bg-yellow-100';
            borderColor = 'border-yellow-400';
            ringColor = 'ring-4 ring-yellow-300';
        } else if (isOccupied) {
            bgColor = isTransient ? 'bg-purple-100' : 'bg-green-100';
            borderColor = isTransient ? 'border-purple-600' : 'border-green-600';
            ringColor = '';
        } else {
            bgColor = 'bg-white';
            borderColor = 'border-gray-400';
            ringColor = 'hover:bg-gray-50';
        }

        return (
            <div
                onClick={() => handleStallClick('stall', lot, id)}
                className={`min-h-20 p-2 rounded text-xs font-medium border-2 transition-all w-full ${bgColor} ${borderColor} ${ringColor} cursor-pointer relative`}
            >
                <div className="font-bold text-sm">{id}</div>
                {isTransient && !ticketValue && <div className="text-[10px] mt-1 italic text-purple-700">Transient</div>}
                {ticketValue && <div className="text-[10px] mt-1 truncate">{ticketValue}</div>}
                {isTransient && ticketValue && <div className="text-[9px] mt-0.5 italic text-purple-700">Transient</div>}
                {notesValue && <div className="text-[9px] text-gray-600 mt-0.5 italic truncate">{notesValue}</div>}
                {blockingInfo && lot === 'D' && (
                    <div className="text-[9px] text-red-700 mt-1 font-semibold">
                        {blockingInfo.multiple ? (
                            <div>Blocked by: {blockingInfo.blocking.map(b => b.stall).join(', ')}</div>
                        ) : (
                            <div>Blocked by {blockingInfo.stall}</div>
                        )}
                    </div>
                )}
                {blockingInfo && lot !== 'D' && (
                    <div className="text-[9px] text-red-700 mt-1 font-semibold">
                        Blocked by {blockingInfo.ofId}
                    </div>
                )}
                {isOccupied && !moveMode && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleStartMove('stall', lot, id, data);
                        }}
                        className="absolute bottom-1 right-1 bg-blue-500 text-white text-[9px] px-2 py-0.5 rounded hover:bg-blue-600"
                    >
                        Move
                    </button>
                )}
            </div>
        );
    };

    const OverflowSpot = ({ id, lot }) => {
        const overflowData = lot === 'X' ? overflowX : overflowY;
        const data = overflowData[id];
        const isTransient = data?.isTransient || false;
        const isOccupied = !!data;
        const isHighlighted = searchResult && searchResult.overflow === id && searchResult.lot === lot;
        const isInMoveMode = moveMode && moveMode.type === 'overflow' && moveMode.lot === lot && moveMode.id === id;

        let borderColor, bgColor, ringColor;
        
        if (isInMoveMode) {
            bgColor = 'bg-blue-200';
            borderColor = 'border-blue-600';
            ringColor = 'ring-4 ring-blue-400 animate-pulse';
        } else if (isHighlighted) {
            borderColor = 'border-yellow-400';
            bgColor = 'bg-yellow-100';
            ringColor = 'ring-4 ring-yellow-300';
        } else if (isOccupied) {
            borderColor = isTransient ? 'border-purple-500' : 'border-orange-500';
            bgColor = isTransient ? 'bg-purple-100' : 'bg-orange-100';
            ringColor = '';
        } else {
            borderColor = 'border-gray-400';
            bgColor = 'bg-gray-50';
            ringColor = '';
        }

        return (
            <div
                onClick={() => handleStallClick('overflow', lot, id)}
                className={`min-h-16 p-2 rounded text-xs font-medium border-2 transition-all ${bgColor} ${borderColor} ${ringColor} cursor-pointer relative`}
            >
                <div className="font-bold">{id}</div>
                {data && (
                    <div className="mt-1">
                        {isTransient && !data.ticket && <div className="text-[10px] italic text-purple-700">Transient</div>}
                        {data.ticket && <div className="text-[10px] truncate">{data.ticket}</div>}
                        {isTransient && data.ticket && <div className="text-[9px] italic text-purple-700">Transient</div>}
                        {data.notes && <div className="text-[9px] text-gray-600 mt-0.5 italic truncate">{data.notes}</div>}
                        {data.blocks && data.blocks.length > 0 && (
                            <div className="text-[9px] text-orange-700 mt-1">
                                Blocks: {data.blocks.join(', ')}
                            </div>
                        )}
                    </div>
                )}
                {!data && <div className="text-[9px] text-gray-500 mt-1">Empty</div>}
                {isOccupied && !moveMode && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleStartMove('overflow', lot, id, data);
                        }}
                        className="absolute bottom-1 right-1 bg-blue-500 text-white text-[9px] px-2 py-0.5 rounded hover:bg-blue-600"
                    >
                        Move
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-7xl mx-auto">
                <div className="header-container">
                    <div className="logo-container">
                        <h1 className="header-title">Valet Parking Management</h1>
                    </div>
                    <div className="text-white text-xs text-center mt-2 opacity-75">
                        v1.0.9 - move button
                    </div>
                </div>
                
                {/* DEBUG PANEL */}
                <div className="bg-gray-800 text-white p-2 rounded mb-4 text-xs font-mono">
                    Debug: {debugInfo || 'Waiting...'}
                </div>
                
                {moveMode && (
                    <div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg mb-4 text-center font-semibold">
                        <div className="text-lg">Move Mode Active</div>
                        <div className="text-sm mt-1">
                            Moving: {moveMode.type === 'stall' ? 'Stall' : 'Overflow'} {moveMode.id} from Lot {moveMode.lot}
                        </div>
                        <div className="text-sm mt-1">Tap destination or tap same stall to cancel</div>
                    </div>
                )}
                
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Enter 6-digit ticket number"
                            maxLength="6"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="flex-1 px-4 py-2 border rounded"
                        />
                        <button
                            onClick={handleSearch}
                            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Search size={20} />
                            Search
                        </button>
                        {searchResult && (
                            <button
                                onClick={() => { setSearchResult(null); setSearchTerm(''); }}
                                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    
                    {searchResult && (
                        <div className="mt-3 p-3 rounded bg-blue-50 border border-blue-200">
                            {searchResult.error && (
                                <p className="text-red-600 font-medium flex items-center gap-1">
                                    <AlertCircle size={16} />
                                    {searchResult.error}
                                </p>
                            )}
                            
                            {searchResult.notFound && (
                                <p className="text-red-600 font-medium">Ticket not found</p>
                            )}
                            
                            {searchResult.overflow && !searchResult.error && !searchResult.notFound && (
                                <div>
                                    <p className="font-medium">
                                        Found in Lot {searchResult.lot} - {searchResult.overflow}
                                        {searchResult.blocks && searchResult.blocks.length > 0 && (
                                            <span> (blocks: {searchResult.blocks.join(', ')})</span>
                                        )}
                                    </p>
                                    {searchResult.notes && (
                                        <p className="text-sm text-gray-700 mt-1 italic">
                                            Note: {searchResult.notes}
                                        </p>
                                    )}
                                </div>
                            )}
                            
                            {!searchResult.overflow && !searchResult.error && !searchResult.notFound && searchResult.stall && (
                                <div>
                                    <p className="font-medium">
                                        Found in Lot {searchResult.lot} - Stall {searchResult.stall}
                                    </p>
                                    {searchResult.notes && (
                                        <p className="text-sm text-gray-700 mt-1 italic">
                                            Note: {searchResult.notes}
                                        </p>
                                    )}
                                    {searchResult.blockingInfo && searchResult.blockingInfo.length > 0 && (
                                        <div className="mt-2 p-2 bg-orange-100 border border-orange-300 rounded">
                                            <p className="font-semibold text-orange-800 flex items-center gap-1">
                                                <AlertCircle size={16} />
                                                Warning: This car is blocked!
                                            </p>
                                            <div className="text-sm text-orange-700 mt-1">
                                                <p className="font-semibold">Blocked by:</p>
                                                {searchResult.blockingInfo.map((blocker, i) => (
                                                    <p key={i}>
                                                        • {blocker.overflow || blocker.stall}: {blocker.ticket}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex gap-2 mb-4">
                    {['X', 'Y', 'D'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                                activeTab === tab 
                                    ? 'bg-blue-600 text-white shadow-lg' 
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            Lot {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'X' && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Lot X</h2>
                            <button
                                onClick={() => setShowClearAllConfirm('X')}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold text-sm"
                            >
                                Clear All
                            </button>
                        </div>
                        <div className="grid grid-cols-5 gap-3 mb-4">
                            {['X1', 'X2', 'X3', 'X4'].map(stall => (
                                <Stall key={stall} id={stall} lot="X" data={lotX[stall]} />
                            ))}
                            <div className="flex items-center justify-center text-sm text-gray-600 font-semibold">RAMP →</div>
                        </div>
                        <div className="grid grid-cols-6 gap-3 mb-4">
                            {['OF1', 'OF2', 'OF3', 'OF4', 'OF5'].map(of => (
                                <OverflowSpot key={of} id={of} lot="X" />
                            ))}
                            <div></div>
                        </div>
                        <div className="grid grid-cols-6 gap-3">
                            {['OF6', 'OF7', 'OF8', 'OF9'].map(of => (
                                <OverflowSpot key={of} id={of} lot="X" />
                            ))}
                            <div></div>
                            <div></div>
                        </div>
                        <div className="grid grid-cols-5 gap-3 mt-4">
                            <div></div>
                            <Stall id="X5" lot="X" data={lotX['X5']} />
                            <Stall id="X6" lot="X" data={lotX['X6']} />
                            <div></div>
                            <div></div>
                        </div>
                    </div>
                )}

                {activeTab === 'Y' && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Lot Y</h2>
                            <button
                                onClick={() => setShowClearAllConfirm('Y')}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold text-sm"
                            >
                                Clear All
                            </button>
                        </div>
                        <div className="grid grid-cols-6 gap-3 mb-4">
                            <Stall id="YE" lot="Y" data={lotY['YE']} />
                            {['Y1', 'Y2', 'Y3', 'Y4', 'Y5'].map(stall => (
                                <Stall key={stall} id={stall} lot="Y" data={lotY[stall]} />
                            ))}
                        </div>
                        <div className="grid grid-cols-6 gap-3 mb-4">
                            <div></div>
                            {['OF1', 'OF2', 'OF3', 'OF4'].map(of => (
                                <OverflowSpot key={of} id={of} lot="Y" />
                            ))}
                            <div></div>
                        </div>
                        <div className="grid grid-cols-7 gap-3 mb-4">
                            {['OF5', 'OF6', 'OF7', 'OF8'].map(of => (
                                <OverflowSpot key={of} id={of} lot="Y" />
                            ))}
                            <OverflowSpot id="OF9" lot="Y" />
                            <OverflowSpot id="OF10" lot="Y" />
                            <div className="flex items-center justify-center text-sm text-gray-600 font-semibold">RAMP →</div>
                        </div>
                        <div className="grid grid-cols-6 gap-3">
                            {['Y6', 'Y7', 'Y8', 'Y9', 'Y10', 'Y11'].map(stall => (
                                <Stall key={stall} id={stall} lot="Y" data={lotY[stall]} />
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'D' && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">Lot D (36 Stalls)</h2>
                            <button
                                onClick={() => setShowClearAllConfirm('D')}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold text-sm"
                            >
                                Clear All
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Front row (D1T-D12T) leaves first, then middle (D1D-D12D), then back (D1-D12).
                        </p>
                        <div className="mb-6">
                            <h3 className="font-semibold mb-3 text-gray-700">Back Row (D1-D12) - Leaves Last</h3>
                            <div className="grid gap-3" style={{gridTemplateColumns: 'auto repeat(12, 1fr)'}}>
                                <Stall id="D" lot="D" data={lotD['D']} />
                                {window.LOT_D_STALLS.slice(0, 12).map(stall => (
                                    <Stall key={stall} id={stall} lot="D" data={lotD[stall]} />
                                ))}
                            </div>
                        </div>
                        <div className="mb-6">
                            <h3 className="font-semibold mb-3 text-gray-700">Middle Row (D1D-D12D) - Leaves Second</h3>
                            <div className="grid gap-3" style={{gridTemplateColumns: 'auto repeat(12, 1fr)'}}>
                                <Stall id="DD" lot="D" data={lotD['DD']} />
                                {window.LOT_D_STALLS.slice(12, 24).map(stall => (
                                    <Stall key={stall} id={stall} lot="D" data={lotD[stall]} />
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-3 text-gray-700">Front Row (D1T-D12T) - Leaves First</h3>
                            <div className="grid gap-3" style={{gridTemplateColumns: 'auto repeat(12, 1fr)'}}>
                                <Stall id="DT" lot="D" data={lotD['DT']} />
                                {window.LOT_D_STALLS.slice(24, 36).map(stall => (
                                    <Stall key={stall} id={stall} lot="D" data={lotD[stall]} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow p-4 mt-6">
                    <h3 className="font-semibold mb-3">Legend:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white border-2 border-gray-400 rounded"></div>
                            <span>Empty Stall</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-100 border-2 border-green-600 rounded"></div>
                            <span>Occupied Stall</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-red-100 border-2 border-red-400 rounded"></div>
                            <span>Blocked Stall</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-50 border-2 border-gray-400 rounded"></div>
                            <span>Empty Overflow</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-100 border-2 border-orange-500 rounded"></div>
                            <span>Occupied Overflow</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-100 border-2 border-purple-600 rounded"></div>
                            <span>Transient Vehicle</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-yellow-100 border-2 border-yellow-400 rounded"></div>
                            <span>Search Result</span>
                        </div>
                    </div>
                </div>
            </div>

            {editingStall && (
                <window.StallEditor
                    stall={editingStall.stall}
                    lot={editingStall.lot}
                    onClose={() => setEditingStall(null)}
                    lotD={lotD}
                    lotX={lotX}
                    lotY={lotY}
                    setLotD={setLotD}
                    setLotX={setLotX}
                    setLotY={setLotY}
                    overflowX={overflowX}
                    overflowY={overflowY}
                />
            )}

            {editingOverflow && (
                <window.OverflowEditor
                    lot={editingOverflow.lot}
                    ofId={editingOverflow.ofId}
                    onClose={() => setEditingOverflow(null)}
                    lotX={lotX}
                    lotY={lotY}
                    overflowX={overflowX}
                    overflowY={overflowY}
                    setOverflowX={setOverflowX}
                    setOverflowY={setOverflowY}
                    lotD={lotD}
                />
            )}

            {showClearAllConfirm && (
                <window.ClearAllConfirmation
                    lot={showClearAllConfirm}
                    onConfirm={() => handleClearAll(showClearAllConfirm)}
                    onCancel={() => setShowClearAllConfirm(null)}
                    lotX={lotX}
                    lotY={lotY}
                    lotD={lotD}
                    overflowX={overflowX}
                    overflowY={overflowY}
                />
            )}
        </div>
    );
}

if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
    console.error('React or ReactDOM not loaded!');
    document.getElementById('root').innerHTML = '<div style="padding: 20px; color: red;">Error: React libraries failed to load. Please check your internet connection and refresh.</div>';
} else {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<ValetParkingApp />);
}