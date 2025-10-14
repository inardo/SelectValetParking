// Icon Components
const Search = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
    </svg>
);

const X = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const AlertCircle = ({ size = 24, className = "" }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
);

// Constants
window.LOT_X_OVERFLOW_SPOTS = ['OF1', 'OF2', 'OF3', 'OF4', 'OF5', 'OF6', 'OF7', 'OF8', 'OF9', 'OF10'];
window.LOT_Y_OVERFLOW_SPOTS = ['OF1', 'OF2', 'OF3', 'OF4', 'OF5', 'OF6', 'OF7', 'OF8', 'OF9', 'OF10'];
window.LOT_X_STALLS = ['X1', 'X2', 'X3', 'X4', 'X5', 'X6'];
window.LOT_Y_STALLS = ['YE', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6', 'Y7', 'Y8', 'Y9', 'Y10', 'Y11'];
window.LOT_D_STALLS = (() => {
    const stalls = [];
    for (let i = 1; i <= 12; i++) stalls.push(`D${i}`);
    for (let i = 1; i <= 12; i++) stalls.push(`D${i}D`);
    for (let i = 1; i <= 12; i++) stalls.push(`D${i}T`);
    stalls.push('D', 'DD', 'DT');
    return stalls;
})();