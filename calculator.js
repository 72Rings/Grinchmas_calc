// Get all input elements
const basePointsInput = document.getElementById('basePoints');
const presentBonusInput = document.getElementById('presentBonus');
const ornamentBonusInput = document.getElementById('ornamentBonus');
const stockingBonusInput = document.getElementById('stockingBonus');
const candyCaneBonusInput = document.getElementById('candyCaneBonus');
const grinchBonusInput = document.getElementById('grinchBonus');
const whovilleBonusInput = document.getElementById('whovilleBonus');
const multiplierSelect = document.getElementById('multiplier');
const totalScoreDisplay = document.getElementById('totalScore');
const resetButton = document.getElementById('resetButton');

// Calculate total score
function calculateTotal() {
    const basePoints = parseFloat(basePointsInput.value) || 0;
    const presentBonus = parseFloat(presentBonusInput.value) || 0;
    const ornamentBonus = parseFloat(ornamentBonusInput.value) || 0;
    const stockingBonus = parseFloat(stockingBonusInput.value) || 0;
    const candyCaneBonus = parseFloat(candyCaneBonusInput.value) || 0;
    const grinchBonus = parseFloat(grinchBonusInput.value) || 0;
    const whovilleBonus = parseFloat(whovilleBonusInput.value) || 0;
    const multiplier = parseFloat(multiplierSelect.value) || 1;

    // Calculate subtotal (base + all bonuses)
    const subtotal = basePoints + presentBonus + ornamentBonus + 
                     stockingBonus + candyCaneBonus + grinchBonus + 
                     whovilleBonus;

    // Apply multiplier
    const total = subtotal * multiplier;

    // Update display with formatted number
    totalScoreDisplay.textContent = Math.round(total).toLocaleString();
}

// Reset all values
function resetAll() {
    basePointsInput.value = 0;
    presentBonusInput.value = 0;
    ornamentBonusInput.value = 0;
    stockingBonusInput.value = 0;
    candyCaneBonusInput.value = 0;
    grinchBonusInput.value = 0;
    whovilleBonusInput.value = 0;
    multiplierSelect.value = 1;
    calculateTotal();
}

// Add event listeners for live updates
basePointsInput.addEventListener('input', calculateTotal);
presentBonusInput.addEventListener('input', calculateTotal);
ornamentBonusInput.addEventListener('input', calculateTotal);
stockingBonusInput.addEventListener('input', calculateTotal);
candyCaneBonusInput.addEventListener('input', calculateTotal);
grinchBonusInput.addEventListener('input', calculateTotal);
whovilleBonusInput.addEventListener('input', calculateTotal);
multiplierSelect.addEventListener('change', calculateTotal);
resetButton.addEventListener('click', resetAll);

// Initialize display
calculateTotal();
