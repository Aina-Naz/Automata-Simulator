const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

// Canvas Size Setup
canvas.width = canvas.parentElement.clientWidth;
canvas.height = canvas.parentElement.clientHeight;

// Data Structures
let states = [];
let transitions = [];
let history = []; 

let currentMode = "addState"; 
let sourceState = null;
let pendingTransitionSrc = null;
let pendingTransitionDest = null;

// --- RESET & MODES ---
function setMode(mode) {
    currentMode = mode;
    sourceState = null;
    // Reset all animation flags
    states.forEach(s => { s.isActive = false; s.isRejected = false; s.isAccepted = false; });
    transitions.forEach(t => { t.isActive = false; });
    drawAll();
}

function undo() {
    if (history.length === 0) { alert("Nothing to Undo!"); return; }
    let lastAction = history.pop();
    if (lastAction === 'state') states.pop();
    else if (lastAction === 'transition') transitions.pop();
    drawAll(); 
}

// --- MODALS (Transition Input) ---
function openModal(src, dest) {
    pendingTransitionSrc = src;
    pendingTransitionDest = dest;
    document.getElementById("customModal").style.display = "flex";
    document.getElementById("modalInput").value = "";
    document.getElementById("modalInput").focus();
}

function closeModal() {
    document.getElementById("customModal").style.display = "none";
}

function confirmTransition() {
    const symbol = document.getElementById("modalInput").value;
    if (symbol && pendingTransitionSrc && pendingTransitionDest) {
        let existing = transitions.find(t => t.from === pendingTransitionSrc.id && t.to === pendingTransitionDest.id);
        if (existing) {
            existing.symbol += ", " + symbol; 
        } else {
            transitions.push({ from: pendingTransitionSrc.id, to: pendingTransitionDest.id, symbol: symbol, isActive: false });
            if (typeof history !== 'undefined') history.push('transition');
        }
        drawAll();
    }
    closeModal();
    sourceState = null;
}

// --- DRAWING ENGINE (CLEAN & PROFESSIONAL) ---
function drawAll() {
    // 1. Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 2. Draw Transitions (Arrows) first
    transitions.forEach(t => {
        const from = states.find(s => s.id === t.from);
        const to = states.find(s => s.id === t.to);
        if (from && to) drawArrow(from.x, from.y, to.x, to.y, t.symbol, t.isActive);
    });

    // 3. Draw States
    states.forEach(s => {
        // --- Start Arrow (Green) ---
        if (s.isInitial) {
            ctx.beginPath();
            ctx.moveTo(s.x - 70, s.y); ctx.lineTo(s.x - 35, s.y);
            ctx.lineTo(s.x - 45, s.y - 8); ctx.moveTo(s.x - 35, s.y); ctx.lineTo(s.x - 45, s.y + 8);
            ctx.strokeStyle = "#00e676"; ctx.lineWidth = 4; ctx.stroke(); // Bright Green
            ctx.fillStyle = "#00e676"; ctx.font = "bold 14px Poppins"; ctx.fillText("Start", s.x - 75, s.y - 10);
        }

        // --- Circle Body ---
        ctx.beginPath(); 
        ctx.arc(s.x, s.y, 30, 0, Math.PI * 2);
        
        // Colors Logic (High Contrast)
        if (s.isRejected) { 
            ctx.fillStyle = "#ff1744"; // Bright RED (Fail)
            ctx.shadowBlur = 25; ctx.shadowColor = "#ff1744";
        } 
        else if (s.isAccepted) { 
            ctx.fillStyle = "#00e676"; // Bright GREEN (Success)
            ctx.shadowBlur = 25; ctx.shadowColor = "#00e676";
        } 
        else if (s.isActive) { 
            ctx.fillStyle = "#2979ff"; // Bright BLUE (Visiting)
            ctx.shadowBlur = 25; ctx.shadowColor = "#2979ff";
        } 
        else if (s.isTrap) { 
            ctx.fillStyle = "#424242"; // Dark Grey (Reject State)
            ctx.shadowBlur = 0;
        } 
        else { 
            ctx.fillStyle = "#1e1e2e"; // Normal Dark Blue/Black
            ctx.shadowBlur = 0; 
        }
        
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow
        
        // Border Logic
        ctx.strokeStyle = (sourceState === s) ? "#ffca28" : "#ffffff"; // Yellow if selected, White normal
        ctx.lineWidth = 2; ctx.stroke();

        // --- Final State (Double Ring) ---
        if (s.isFinal) {
            ctx.beginPath(); ctx.arc(s.x, s.y, 24, 0, Math.PI * 2);
            ctx.strokeStyle = "#ff5252"; ctx.lineWidth = 2; ctx.stroke(); // Red Ring
        }

        // --- State Name (Text) ---
        ctx.fillStyle = "white"; 
        ctx.font = s.isTrap ? "12px Poppins" : "bold 16px Poppins";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(s.isTrap ? "Reject" : s.id, s.x, s.y);
    });
}

// --- ARROW FUNCTION (CLEAN TEXT) ---
function drawArrow(fromX, fromY, toX, toY, text, isActive) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    // Animation Colors: Active = Yellow, Normal = Cyan
    const color = isActive ? "#ffd600" : "#00d2ff"; 
    const textColor = isActive ? "#ffd600" : "#ff9100"; // Text: Orange (Normal), Yellow (Active)
    const lineWidth = isActive ? 4 : 2;

    // --- SELF LOOP (Gol Ghoommna) ---
    if (fromX === toX && fromY === toY) {
        ctx.beginPath();
        // Thoda upar banaya taake text saaf dikhay
        ctx.arc(fromX, fromY - 32, 22, -Math.PI / 3, Math.PI + Math.PI / 3, true);
        ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.stroke();

        // Arrow Head
        const arrowX = fromX + 18; const arrowY = fromY - 38;
        drawArrowHead(ctx, arrowX, arrowY, Math.PI / 4, color);

        // Text with Background (Safayi ke liye)
        drawTextWithBackground(text, fromX, fromY - 65, textColor);
        return;
    }

    // --- NORMAL ARROW (Seedha) ---
    const radius = 30;
    const startX = fromX + radius * Math.cos(angle); 
    const startY = fromY + radius * Math.sin(angle);
    const endX = toX - radius * Math.cos(angle); 
    const endY = toY - radius * Math.sin(angle);

    ctx.beginPath(); 
    ctx.moveTo(startX, startY); 
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.stroke();
    
    // Arrow Head
    drawArrowHead(ctx, endX, endY, angle, color);
    
    // Text Position (Center)
    const midX = (startX + endX) / 2; 
    const midY = (startY + endY) / 2;
    drawTextWithBackground(text, midX, midY - 15, textColor);
}

// Helper: Arrow Head
function drawArrowHead(ctx, x, y, angle, color) {
    const headLength = 12;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - headLength * Math.cos(angle - Math.PI / 6), y - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x - headLength * Math.cos(angle + Math.PI / 6), y - headLength * Math.sin(angle + Math.PI / 6));
    ctx.lineTo(x, y);
    ctx.fillStyle = color; ctx.fill();
}

// Helper: Text Background (Safayi)
function drawTextWithBackground(text, x, y, color) {
    ctx.font = "bold 16px Poppins";
    const width = ctx.measureText(text).width;
    
    // Black Box behind text
    ctx.fillStyle = "#15151e"; // Canvas background color
    ctx.fillRect(x - width/2 - 4, y - 10, width + 8, 20);

    // Text on top
    ctx.fillStyle = color;
    ctx.textAlign = "center"; 
    ctx.fillText(text, x, y);
}

// --- INTERACTION ---
canvas.addEventListener("click", function(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left; const y = event.clientY - rect.top;
    let clickedState = states.find(s => Math.hypot(s.x - x, s.y - y) < 35);

    if (currentMode === "addState" && !clickedState) {
        states.push({ id: "q" + states.length, x: x, y: y, isFinal: false, isInitial: false, isTrap: false, isActive: false, isRejected: false, isAccepted: false });
        if (typeof history !== 'undefined') history.push('state');
    } else if (currentMode === "setStart" && clickedState) {
        states.forEach(s => s.isInitial = false); clickedState.isInitial = true;
    } else if (currentMode === "setFinal" && clickedState) {
        clickedState.isFinal = !clickedState.isFinal;
    } else if (currentMode === "setTrap" && clickedState) {
        clickedState.isTrap = !clickedState.isTrap; if(clickedState.isTrap) clickedState.isFinal = false; 
    } else if (currentMode === "addTransition" && clickedState) {
        if (!sourceState) sourceState = clickedState; else openModal(sourceState, clickedState);
    }
    drawAll();
});

function clearCanvas() { states = []; transitions = []; history = []; drawAll(); }

// --- ANIMATION ENGINE (STEP-BY-STEP) ---
document.getElementById("runBtn").addEventListener("click", async () => {
    const input = document.getElementById("inputString").value;
    const resultBox = document.getElementById("resultMsg");
    
    // Reset Colors
    states.forEach(s => { s.isActive = false; s.isRejected = false; s.isAccepted = false; });
    transitions.forEach(t => { t.isActive = false; });
    drawAll();

    let curr = states.find(s => s.isInitial);
    if (!curr) { resultBox.innerText = "⚠ No Start State!"; return; }

    resultBox.innerHTML = "Processing..."; resultBox.style.color = "yellow";

    for (let char of input) {
        // 1. Highlight Current State (BLUE)
        curr.isActive = true;
        drawAll();
        await new Promise(r => setTimeout(r, 800)); // Wait

        // Find Transition
        let trans = transitions.find(t => t.from === curr.id && t.symbol.includes(char));
        
        if (trans) {
            // 2. Highlight ARROW (YELLOW)
            trans.isActive = true;
            drawAll();
            await new Promise(r => setTimeout(r, 800)); // Wait showing arrow flow
            
            // Cleanup Previous Step
            curr.isActive = false;
            trans.isActive = false;
            
            // Move to Next
            curr = states.find(s => s.id === trans.to);
        } else {
            // STUCK (REJECT)
            curr.isRejected = true;
            drawAll();
            resultBox.innerHTML = `<i class="fas fa-times-circle"></i> REJECTED (Stuck at ${curr.isTrap ? "Reject" : curr.id})`;
            resultBox.style.color = "#ff4757";
            return;
        }
    }

    // Final Check
    curr.isActive = true; 
    drawAll();
    await new Promise(r => setTimeout(r, 500));
    curr.isActive = false;

    if (curr.isFinal) {
        curr.isAccepted = true; // GREEN
        drawAll();
        resultBox.innerHTML = `<i class="fas fa-check-circle"></i> ACCEPTED`;
        resultBox.style.color = "#2ecc71";
    } else {
        curr.isRejected = true; // RED
        drawAll();
        resultBox.innerHTML = `<i class="fas fa-times-circle"></i> REJECTED`;
        resultBox.style.color = "#ff4757";
    }
});

// --- HELPER MODULES (Regex, PDA, TM) ---

// 1. Regex Module
function openRegexModal() { document.getElementById("regexModal").style.display="flex"; }
function closeRegexModal() { document.getElementById("regexModal").style.display="none"; }
function checkRegex() {
    let p = document.getElementById("reInput").value.trim().replace(/\s/g, "").replace(/\+/g, "|");
    let s = document.getElementById("reStringInput").value.trim();
    if(!p.startsWith("^")) p="^"+p; if(!p.endsWith("$")) p=p+"$";
    try {
        if(new RegExp(p).test(s)) { document.getElementById("reResult").innerHTML = "ACCEPTED"; document.getElementById("reResult").style.color = "green"; }
        else { document.getElementById("reResult").innerHTML = "REJECTED"; document.getElementById("reResult").style.color = "red"; }
    } catch(e) { alert("Invalid Regex"); }
}

// 2. Features Module (PDA, TM)
function showFeatureMsg(f) {
    if(f==='PDA') document.getElementById("pdaModal").style.display='flex';
    if(f==='Turing Machine') document.getElementById("tmModal").style.display='flex';
}
function closeFeatureModals() {
    document.getElementById("pdaModal").style.display='none';
    document.getElementById("tmModal").style.display='none';
}

// 3. PDA Logic
async function runPDA() {
    const input = document.getElementById("pdaInput").value;
    const stackDiv = document.getElementById("stackContainer");
    const res = document.getElementById("pdaResult");
    
    stackDiv.innerHTML = ""; // Clear
    let stack = [];
    let rejected = false;

    for(let i=0; i<input.length; i++) {
        let char = input[i];
        await new Promise(r => setTimeout(r, 600));

        if(char === 'a') {
            stack.push('a');
            let box = document.createElement("div");
            box.className = "stack-item"; box.innerText = "a";
            stackDiv.appendChild(box);
        } else if(char === 'b') {
            if(stack.length === 0) { rejected = true; break; }
            stack.pop();
            if(stackDiv.lastChild) stackDiv.removeChild(stackDiv.lastChild);
        } else { rejected = true; break; }
    }
    if(!rejected && stack.length === 0) { res.innerHTML = "Result: <span style='color:#2ecc71'>ACCEPTED</span>"; }
    else { res.innerHTML = "Result: <span style='color:#ff4757'>REJECTED</span>"; }
}

// 4. Turing Machine Logic
async function runTM() {
    const input = document.getElementById("tmInput").value;
    const tapeDiv = document.getElementById("tapeContainer");
    const res = document.getElementById("tmResult");
    
    let tape = input.split("");
    tapeDiv.innerHTML = "";
    tape.forEach(char => {
        let cell = document.createElement("div");
        cell.className = "tape-cell"; cell.innerText = char;
        tapeDiv.appendChild(cell);
    });

    res.innerText = "Status: Processing...";
    let cells = document.getElementsByClassName("tape-cell");

    for(let i=0; i<tape.length; i++) {
        await new Promise(r => setTimeout(r, 800));
        if(i > 0) cells[i-1].classList.remove("active");
        cells[i].classList.add("active");

        let val = tape[i];
        if(val === '0') { cells[i].innerText = '1'; cells[i].style.background = "#2ecc71"; } 
        else if (val === '1') { cells[i].innerText = '0'; cells[i].style.background = "#e74c3c"; }
        
        await new Promise(r => setTimeout(r, 200));
        cells[i].style.background = "#00d2ff";
    }
    res.innerHTML = "Status: <span style='color:#2ecc71'>HALTED</span>";
}
// --- EQUIVALENCE VERIFIER (FA vs RE) ---

function openVerifierModal() {
    document.getElementById("verifyModal").style.display = "flex";
    document.getElementById("verifyInput").value = "";
    document.getElementById("verifyResult").innerHTML = "Waiting for Input...";
    document.getElementById("verifyResult").style.color = "white";
}

function closeVerifierModal() {
    document.getElementById("verifyModal").style.display = "none";
}

// Helper: Drawing par String check karna (Chupke se)
function testStringOnFA(inputStr) {
    let curr = states.find(s => s.isInitial);
    if (!curr) return false; 

    for (let char of inputStr) {
        let trans = transitions.find(t => t.from === curr.id && t.symbol.includes(char));
        if (trans) {
            curr = states.find(s => s.id === trans.to);
        } else {
            // Agar rasta nahi mila
            if (curr.isTrap) return false; 
            return false; // Stuck
        }
    }
    return curr.isFinal;
}

// Main Function: Match Check karna
function runVerification() {
    let userPattern = document.getElementById("verifyInput").value.trim();
    const resultBox = document.getElementById("verifyResult");

    if (!userPattern) {
        resultBox.innerText = "⚠ Enter Regex First";
        resultBox.style.color = "orange";
        return;
    }

    try {
        // Regex Setup
        let cleanPattern = userPattern.replace(/\s/g, "").replace(/\+/g, "|");
        if (!cleanPattern.startsWith("^")) cleanPattern = "^" + cleanPattern;
        if (!cleanPattern.endsWith("$")) cleanPattern = cleanPattern + "$";
        const regex = new RegExp(cleanPattern);

        // --- SMART TESTING (20 Hidden Strings) ---
        let testStrings = [
            "", "a", "b", "aa", "ab", "ba", "bb", 
            "aaa", "aab", "aba", "abb", "baa", "bab", "bba", "bbb",
            "aaaa", "bbbb", "abab", "baba", "ababb"
        ];

        let mismatchFound = false;
        let failedAt = "";

        for (let str of testStrings) {
            let reResult = regex.test(str);      // Regex ka result
            let faResult = testStringOnFA(str);  // Drawing ka result

            if (reResult !== faResult) {
                mismatchFound = true;
                failedAt = str;
                break; // Pakra gaya!
            }
        }

        // Result Show Karo
        if (mismatchFound) {
            resultBox.innerHTML = `<i class="fas fa-exclamation-triangle"></i> NOT MATCHING!<br><span style="font-size:12px">Conflict at string: "${failedAt}"</span>`;
            resultBox.style.color = "#ff4757"; // Red
        } else {
            resultBox.innerHTML = `<i class="fas fa-check-double"></i> PERFECT MATCH!<br><span style="font-size:12px">Tested 20 scenarios successfully.</span>`;
            resultBox.style.color = "#2ecc71"; // Green
        }

    } catch (e) {
        resultBox.innerText = "⚠ Invalid Regex Syntax";
        resultBox.style.color = "orange";
    }
}