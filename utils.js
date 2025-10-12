// Utility Functions
window.getTicketValue = (data) => {
    return typeof data === 'string' ? data : data?.ticket || '';
};

window.getNotesValue = (data) => {
    return typeof data === 'object' ? data?.notes || '' : '';
};

window.migrateData = (saved) => {
    if (!saved) return {};
    try {
        const parsed = JSON.parse(saved);
        const migrated = {};
        for (const [stall, value] of Object.entries(parsed)) {
            if (typeof value === 'string') {
                migrated[stall] = { ticket: value, notes: '' };
            } else if (value && typeof value === 'object') {
                if (value.ticket) {
                    migrated[stall] = value;
                } else if (value.front) {
                    migrated[stall] = { ticket: value.front, notes: value.notes || '' };
                }
            }
        }
        return migrated;
    } catch {
        return {};
    }
};

window.getBlockingInfo = (lot, stallId, lotD, lotX, lotY, overflowX, overflowY) => {
    if (lot === 'D') {
        if (stallId === 'D') {
            const ddTicket = window.getTicketValue(lotD['DD']);
            const dtTicket = window.getTicketValue(lotD['DT']);
            if (ddTicket || dtTicket) {
                const blockingStalls = [];
                if (ddTicket) blockingStalls.push({ stall: 'DD', ticket: ddTicket });
                if (dtTicket) blockingStalls.push({ stall: 'DT', ticket: dtTicket });
                return { multiple: true, blocking: blockingStalls };
            }
            return null;
        }
        if (stallId === 'DD') {
            const dtTicket = window.getTicketValue(lotD['DT']);
            if (dtTicket) return { stall: 'DT', ticket: dtTicket };
            return null;
        }
        if (stallId === 'DT') return null;
        
        const baseNumber = stallId.replace(/[DT]/g, '');
        
        if (stallId.endsWith('T')) return null;
        else if (stallId.endsWith('D')) {
            const frontStall = `D${baseNumber}T`;
            const frontTicket = window.getTicketValue(lotD[frontStall]);
            if (frontTicket) return { stall: frontStall, ticket: frontTicket };
            return null;
        } else {
            const middleStall = `D${baseNumber}D`;
            const frontStall = `D${baseNumber}T`;
            const middleTicket = window.getTicketValue(lotD[middleStall]);
            const frontTicket = window.getTicketValue(lotD[frontStall]);
            
            if (middleTicket || frontTicket) {
                const blockingStalls = [];
                if (middleTicket) blockingStalls.push({ stall: middleStall, ticket: middleTicket });
                if (frontTicket) blockingStalls.push({ stall: frontStall, ticket: frontTicket });
                return { multiple: true, blocking: blockingStalls };
            }
            return null;
        }
    }
    
    const overflowData = lot === 'X' ? overflowX : lot === 'Y' ? overflowY : null;
    if (!overflowData) return null;
    for (const [ofId, data] of Object.entries(overflowData)) {
        if (data.blocks && data.blocks.includes(stallId)) {
            return { ofId, ticket: data.ticket };
        }
    }
    return null;
};

window.getAllBlockingInfo = (lot, stallId, lotD, lotX, lotY, overflowX, overflowY) => {
    const allBlockers = [];
    const visited = new Set();
    const blockerKeys = new Set();
    
    const findBlockers = (currentLot, currentStallId) => {
        if (visited.has(`${currentLot}-${currentStallId}`)) return;
        visited.add(`${currentLot}-${currentStallId}`);
        
        if (currentLot === 'D') {
            if (currentStallId === 'D') {
                const ddTicket = window.getTicketValue(lotD['DD']);
                const dtTicket = window.getTicketValue(lotD['DT']);
                if (ddTicket) {
                    const key = `D-DD-${ddTicket}`;
                    if (!blockerKeys.has(key)) {
                        blockerKeys.add(key);
                        allBlockers.push({ lot: 'D', stall: 'DD', ticket: ddTicket });
                    }
                    findBlockers('D', 'DD');
                }
                if (dtTicket) {
                    const key = `D-DT-${dtTicket}`;
                    if (!blockerKeys.has(key)) {
                        blockerKeys.add(key);
                        allBlockers.push({ lot: 'D', stall: 'DT', ticket: dtTicket });
                    }
                }
                return;
            }
            if (currentStallId === 'DD') {
                const dtTicket = window.getTicketValue(lotD['DT']);
                if (dtTicket) {
                    const key = `D-DT-${dtTicket}`;
                    if (!blockerKeys.has(key)) {
                        blockerKeys.add(key);
                        allBlockers.push({ lot: 'D', stall: 'DT', ticket: dtTicket });
                    }
                }
                return;
            }
            if (currentStallId === 'DT') return;
            
            const baseNumber = currentStallId.replace(/[DT]/g, '');
            
            if (currentStallId.endsWith('T')) return;
            else if (currentStallId.endsWith('D')) {
                const frontStall = `D${baseNumber}T`;
                const frontTicket = window.getTicketValue(lotD[frontStall]);
                if (frontTicket) {
                    const key = `D-${frontStall}-${frontTicket}`;
                    if (!blockerKeys.has(key)) {
                        blockerKeys.add(key);
                        allBlockers.push({ lot: 'D', stall: frontStall, ticket: frontTicket });
                    }
                }
                return;
            } else {
                const middleStall = `D${baseNumber}D`;
                const frontStall = `D${baseNumber}T`;
                const middleTicket = window.getTicketValue(lotD[middleStall]);
                const frontTicket = window.getTicketValue(lotD[frontStall]);
                
                if (middleTicket) {
                    const key = `D-${middleStall}-${middleTicket}`;
                    if (!blockerKeys.has(key)) {
                        blockerKeys.add(key);
                        allBlockers.push({ lot: 'D', stall: middleStall, ticket: middleTicket });
                    }
                    findBlockers('D', middleStall);
                }
                if (frontTicket) {
                    const key = `D-${frontStall}-${frontTicket}`;
                    if (!blockerKeys.has(key)) {
                        blockerKeys.add(key);
                        allBlockers.push({ lot: 'D', stall: frontStall, ticket: frontTicket });
                    }
                }
                return;
            }
        }
        
        const overflowData = currentLot === 'X' ? overflowX : currentLot === 'Y' ? overflowY : null;
        if (!overflowData) return;
        
        for (const [ofId, data] of Object.entries(overflowData)) {
            if (data.blocks && data.blocks.includes(currentStallId)) {
                const key = `${currentLot}-${ofId}-${data.ticket}`;
                if (!blockerKeys.has(key)) {
                    blockerKeys.add(key);
                    allBlockers.push({ lot: currentLot, overflow: ofId, ticket: data.ticket });
                }
                findBlockers(currentLot, ofId);
            }
        }
    };
    
    findBlockers(lot, stallId);
    return allBlockers.length > 0 ? allBlockers : null;
};

window.checkDuplicateTicket = (ticketNum, currentLot, currentStall, isOverflow, lotD, lotX, lotY, overflowX, overflowY) => {
    if (!ticketNum) return null;
    
    for (const [stallId, ticketVal] of Object.entries(lotD)) {
        const ticket = window.getTicketValue(ticketVal);
        if (ticket === ticketNum && !(currentLot === 'D' && currentStall === stallId && !isOverflow)) {
            return { lot: 'D', stall: stallId };
        }
    }
    for (const [stallId, ticketVal] of Object.entries(lotX)) {
        const ticket = window.getTicketValue(ticketVal);
        if (ticket === ticketNum && !(currentLot === 'X' && currentStall === stallId && !isOverflow)) {
            return { lot: 'X', stall: stallId };
        }
    }
    for (const [stallId, ticketVal] of Object.entries(lotY)) {
        const ticket = window.getTicketValue(ticketVal);
        if (ticket === ticketNum && !(currentLot === 'Y' && currentStall === stallId && !isOverflow)) {
            return { lot: 'Y', stall: stallId };
        }
    }
    for (const [ofId, data] of Object.entries(overflowX)) {
        if (data.ticket === ticketNum && !(currentLot === 'X' && currentStall === ofId && isOverflow)) {
            return { lot: 'X', overflow: ofId };
        }
    }
    for (const [ofId, data] of Object.entries(overflowY)) {
        if (data.ticket === ticketNum && !(currentLot === 'Y' && currentStall === ofId && isOverflow)) {
            return { lot: 'Y', overflow: ofId };
        }
    }
    return null;
};