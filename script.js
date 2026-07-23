/* ==================================================================
   DATE INVITATION - script.js
   Every section below is a self-contained feature. Read top to
   bottom; each function has a comment explaining WHAT it does and
   WHY, so this file works as a mini tutorial too.
================================================================== */

/* ------------------------------------------------------------
   0) SMALL HELPER: shorthand for document.querySelector
   Saves us from typing "document.querySelector" everywhere.
------------------------------------------------------------ */
const qs = (selector) => document.querySelector(selector);

/* ------------------------------------------------------------
   1) GRAB THE ELEMENTS WE'LL NEED
   Doing this once at the top means we don't repeatedly search
   the page every time we need an element.
------------------------------------------------------------ */
const loadingScreen = qs('#loadingScreen');
const app = qs('#app');

const screens = {
  1: qs('#screen1'),
  2: qs('#screen2'),
  3: qs('#screen3'),
  4: qs('#screen4'),
  5: qs('#screen5'),
};

const yesBtn = qs('#yesBtn');
const noBtn = qs('#noBtn');
const buttonArena = qs('#buttonArena');

const okBtn = qs('#okBtn');

const dateInput = qs('#dateInput');
const timeInput = qs('#timeInput');
const dateTimeWarning = qs('#dateTimeWarning');
const setDateBtn = qs('#setDateBtn');

const foodInput = qs('#foodInput');
const foodWarning = qs('#foodWarning');
const continueBtn = qs('#continueBtn');
const chipContainer = qs('#chipContainer');
const emailStatus = qs('#emailStatus');
const emailErrorActions = qs('#emailErrorActions');
const retryEmailBtn = qs('#retryEmailBtn');
const skipEmailBtn = qs('#skipEmailBtn');

const finalDate = qs('#finalDate');
const finalTime = qs('#finalTime');
const finalFood = qs('#finalFood');
const cantWaitBtn = qs('#cantWaitBtn');
const seeYouSoon = qs('#seeYouSoon');

const confettiLayer = qs('#confettiLayer');

/* ==================================================================
   2) SCREEN NAVIGATION
   Only one .screen has the "active" class at a time. To move to a
   new screen we remove "active" from the current one and add it
   to the target one; the CSS animation handles the smooth fade.
================================================================== */
function goToScreen(screenNumber) {
  Object.values(screens).forEach((screen) => screen.classList.remove('active'));
  screens[screenNumber].classList.add('active');
}

/* ==================================================================
   3) LOADING SCREEN (2 second intro)
   We wait 2 seconds, fade the loading screen out, then reveal the
   real app underneath it.
================================================================== */
window.addEventListener('load', () => {
  setTimeout(() => {
    loadingScreen.classList.add('fade-out');
    app.classList.remove('hidden');
  }, 2000);
});

/* ==================================================================
   4) TINY CLICK SOUND (optional, no external audio file needed)
   We use the browser's built-in Web Audio API to generate a very
   short, soft "blip" instead of loading an mp3 file.
================================================================== */
let audioContext = null;

function playClickSound() {
  try {
    // Reuse one AudioContext instead of creating a new one every click.
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const oscillator = audioContext.createOscillator(); // makes the tone
    const gainNode = audioContext.createGain();          // controls volume

    oscillator.type = 'sine';
    oscillator.frequency.value = 660; // pitch of the click, in Hz
    gainNode.gain.value = 0.05;       // keep it quiet/subtle

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    // Fade out quickly and stop, so it sounds like a soft "tick"
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.12);
    oscillator.stop(audioContext.currentTime + 0.13);
  } catch (err) {
    // If the browser blocks audio (e.g. autoplay policies), fail silently.
  }
}

// Attach the click sound to every button on the page.
document.querySelectorAll('button').forEach((button) => {
  button.addEventListener('click', playClickSound);
});

/* ==================================================================
   5) SCREEN 1: THE RUNAWAY "NO" BUTTON GAME
================================================================== */

// Moves the "No" button to a random spot inside its arena, while
// keeping it fully inside the visible box (never clipped/off-screen)
// and trying not to land directly on top of the "Yes" button.
function moveNoButtonRandomly() {
  const arenaRect = buttonArena.getBoundingClientRect();
  const noBtnRect = noBtn.getBoundingClientRect();
  const yesBtnRect = yesBtn.getBoundingClientRect();

  const maxLeft = arenaRect.width - noBtnRect.width;
  const maxTop = arenaRect.height - noBtnRect.height;

  // Yes button's box, expressed relative to the arena (not the
  // whole page), with a little padding so No lands clearly beside
  // it rather than right at its edge.
  const PADDING = 12;
  const yesLeft = yesBtnRect.left - arenaRect.left - PADDING;
  const yesRight = yesBtnRect.right - arenaRect.left + PADDING;
  const yesTop = yesBtnRect.top - arenaRect.top - PADDING;
  const yesBottom = yesBtnRect.bottom - arenaRect.top + PADDING;

  // Try a handful of random spots and keep the first one that
  // doesn't overlap Yes's box; if we're unlucky every time, fall
  // back to the last attempt anyway (arena is small, so this loop
  // is just a nicety, not a correctness requirement — the button's
  // z-index already guarantees Yes stays clickable either way).
  let newLeft = 0;
  let newTop = 0;
  const MAX_ATTEMPTS = 8;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    newLeft = Math.max(0, Math.random() * maxLeft);
    newTop = Math.max(0, Math.random() * maxTop);

    const overlapsYes =
      newLeft < yesRight && newLeft + noBtnRect.width > yesLeft &&
      newTop < yesBottom && newTop + noBtnRect.height > yesTop;

    if (!overlapsYes) break;
  }

  noBtn.style.left = `${newLeft}px`;
  noBtn.style.top = `${newTop}px`;
  // We're setting an absolute pixel position now, so cancel the
  // original CSS "transform: translateX(...)" centering trick.
  noBtn.style.transform = 'translateX(0)';
}

// Small vibration "bonus feature" for phones that support it - fires
// each time the No button escapes, for a fun tactile confirmation.
function vibrateIfSupported() {
  if (navigator.vibrate) {
    navigator.vibrate(15);
  }
}

// Distance (in pixels) between the mouse and the button's center.
function distanceToButton(mouseX, mouseY, button) {
  const rect = button.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  return Math.hypot(mouseX - centerX, mouseY - centerY);
}

// The main "chase" logic: whenever the mouse moves anywhere on
// screen 1, check how close it is to the No button. If it's close,
// the button teleports away and the Yes button pulses/grows.
const ESCAPE_DISTANCE = 90; // pixels - how close is "too close"

document.addEventListener('mousemove', (event) => {
  if (!screens[1].classList.contains('active')) return; // only on screen 1

  const distance = distanceToButton(event.clientX, event.clientY, noBtn);

  if (distance < ESCAPE_DISTANCE) {
    moveNoButtonRandomly();
    vibrateIfSupported();
    yesBtn.classList.add('grow');
  }
});

// Also handle touch devices: a finger tap near the button should
// make it run away too, since there's no "hover" on mobile.
document.addEventListener('touchstart', (event) => {
  if (!screens[1].classList.contains('active')) return;
  const touch = event.touches[0];
  const distance = distanceToButton(touch.clientX, touch.clientY, noBtn);
  if (distance < ESCAPE_DISTANCE) {
    moveNoButtonRandomly();
    vibrateIfSupported();
  }
});

// Clicking Yes takes the user to screen 2.
yesBtn.addEventListener('click', () => {
  goToScreen(2);
});

/* ==================================================================
   6) SCREEN 2: "Okay" continues to screen 3
================================================================== */
okBtn.addEventListener('click', () => {
  goToScreen(3);
});

/* ==================================================================
   7) SCREEN 3: DATE + TIME PICKER WITH VALIDATION
================================================================== */

// Enables the "Set the Date" button only once BOTH fields have a value.
function updateSetDateButtonState() {
  const bothFilled = dateInput.value !== '' && timeInput.value !== '';
  setDateBtn.disabled = !bothFilled;
}

dateInput.addEventListener('change', updateSetDateButtonState);
timeInput.addEventListener('change', updateSetDateButtonState);

setDateBtn.addEventListener('click', () => {
  const bothFilled = dateInput.value !== '' && timeInput.value !== '';

  if (!bothFilled) {
    // Show the animated warning message instead of moving on.
    dateTimeWarning.classList.remove('hidden');
    return;
  }

  dateTimeWarning.classList.add('hidden');
  goToScreen(4);
});

/* ==================================================================
   8) SCREEN 4: FOOD / VIBE CHOICE + SUGGESTION CHIPS
================================================================== */

// Clicking any suggestion chip fills the text box with that food.
chipContainer.addEventListener('click', (event) => {
  const chip = event.target.closest('.chip');
  if (!chip) return; // ignore clicks that aren't on a chip

  foodInput.value = chip.dataset.food;
  foodWarning.classList.add('hidden');
});

continueBtn.addEventListener('click', () => {
  const foodValue = foodInput.value.trim();

  if (foodValue === '') {
    foodWarning.classList.remove('hidden');
    return;
  }

  foodWarning.classList.add('hidden');
  sendDateEmailAndProceed();
});

/* ==================================================================
   8.5) EMAILJS — SEND THE ANSWER BY EMAIL
   Sends the chosen date, time, and food to binsone001@gmail.com
   using EmailJS (no backend server required). The three secret
   values it needs (PUBLIC_KEY, SERVICE_ID, TEMPLATE_ID) come from
   config.js, never hardcoded here — see config.js for setup steps.
================================================================== */

// One-time setup: tells the EmailJS SDK which account to send from.
// Guarded with checks so a missing SDK/config never crashes the page.
function initEmailJs() {
  if (typeof emailjs === 'undefined') {
    console.warn('EmailJS SDK did not load (check your internet connection or the <script> tag in index.html).');
    return false;
  }
  if (typeof EMAILJS_CONFIG === 'undefined') {
    console.warn('config.js is missing. Copy config.js next to script.js and fill in your EmailJS values.');
    return false;
  }
  //emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
  return true;
}

// True only once real values have replaced the placeholder text in
// config.js. Prevents us from even attempting a doomed API call.
function isEmailJsConfigured() {
  if (typeof EMAILJS_CONFIG === 'undefined') return false;
  const { PUBLIC_KEY, SERVICE_ID, TEMPLATE_ID } = EMAILJS_CONFIG;
  return (
    PUBLIC_KEY && !PUBLIC_KEY.includes('YOUR_') &&
    SERVICE_ID && !SERVICE_ID.includes('YOUR_') &&
    TEMPLATE_ID && !TEMPLATE_ID.includes('YOUR_')
  );
}

// Switches the shared status <p> between loading / success / error
// look-and-feel by swapping its CSS "state-*" class and text.
function setEmailStatus(state, message) {
  emailStatus.classList.remove('hidden', 'state-loading', 'state-success', 'state-error');
  emailStatus.classList.add(`state-${state}`);
  emailStatus.textContent = message;
}

// The actual network call to EmailJS. Returns a Promise so callers
// can await it and react to success/failure.
function sendDateEmail(rawDate, rawTime, food) {

    console.log("Date:", rawDate);
    console.log("Time:", rawTime);
    console.log("Food:", food);

    const templateParams = {
        selected_date: formatDateForDisplay(rawDate),
        selected_time: formatTimeForDisplay(rawTime),
        food_choice: food,
        submitted: new Date().toLocaleString()
    };

    console.log(templateParams);

    return emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams,
        EMAILJS_CONFIG.PUBLIC_KEY
    );
}

// Puts the UI into "sending" mode, attempts the email, and moves to
// the final screen on success. On failure it shows a clear error
// plus a retry button and a "skip" button so nobody gets stuck.
function sendDateEmailAndProceed() {
  const rawDate = dateInput.value;
  const rawTime = timeInput.value;
  const food = foodInput.value.trim();

  // Always save the answer locally first, regardless of email
  // success — losing the saved date/time just because the email
  // failed would be a worse bug than the email itself failing.
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ rawDate, rawTime, food }));

  continueBtn.disabled = true;
  continueBtn.textContent = 'Sending... 💌';
  emailErrorActions.classList.add('hidden');
  setEmailStatus('loading', 'Sending your answer... 💌');

  const emailJsReady = initEmailJs() && isEmailJsConfigured();

  if (!emailJsReady) {
    handleEmailFailure(
      'Email isn\'t set up yet — add your keys to config.js. Your answer is still saved!',
      rawDate, rawTime, food
    );
    return;
  }

  sendDateEmail(rawDate, rawTime, food)
    .then(() => {
      setEmailStatus('success', 'Sent! 💌 Taking you to your confirmation...');
      setTimeout(() => {
        emailStatus.classList.add('hidden');
        resetContinueButton();
        renderFinalScreen(rawDate, rawTime, food);
        goToScreen(5);
        launchConfetti();
      }, 1200);
    })
    .catch((error) => {
      console.error('EmailJS send failed:', error);
      handleEmailFailure(
        'Could not send the email right now. Your answer is still saved!',
        rawDate, rawTime, food
      );
    });
}

// Shared cleanup for the error path: shows the error message and
// reveals the retry/skip buttons, remembering the answer so either
// button can act on it without re-reading the (still-filled) inputs.
function handleEmailFailure(message, rawDate, rawTime, food) {
  setEmailStatus('error', message);
  emailErrorActions.classList.remove('hidden');
  resetContinueButton();
  continueBtn.classList.add('hidden'); // avoid two competing "continue" buttons

  retryEmailBtn.onclick = () => {
    continueBtn.classList.remove('hidden');
    sendDateEmailAndProceed();
  };

  skipEmailBtn.onclick = () => {
    continueBtn.classList.remove('hidden');
    emailStatus.classList.add('hidden');
    emailErrorActions.classList.add('hidden');
    renderFinalScreen(rawDate, rawTime, food);
    goToScreen(5);
    launchConfetti();
  };
}

function resetContinueButton() {
  continueBtn.disabled = false;
  continueBtn.textContent = 'Continue ❤️';
}

/* ==================================================================
   9) FINAL SCREEN + LOCALSTORAGE PERSISTENCE
   We save the chosen date/time/food so that if the page is
   reloaded, we can skip straight back to the confirmation screen
   instead of making the user redo the whole flow.
================================================================== */

const STORAGE_KEY = 'dateInvitationAnswer';

// Turns the raw <input type="date"> value (e.g. "2026-08-01") into
// something friendlier to read, like "August 1, 2026".
function formatDateForDisplay(rawDate) {
  const [year, month, day] = rawDate.split('-').map(Number);
  const dateObject = new Date(year, month - 1, day);
  return dateObject.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Turns "14:30" into "2:30 PM".
function formatTimeForDisplay(rawTime) {
  const [hour, minute] = rawTime.split(':').map(Number);
  const dateObject = new Date();
  dateObject.setHours(hour, minute);
  return dateObject.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Fills in the final screen's text with the saved answer, and
// resets the "Can't Wait" button/message to their default state.
function renderFinalScreen(rawDate, rawTime, food) {
  finalDate.textContent = formatDateForDisplay(rawDate);
  finalTime.textContent = formatTimeForDisplay(rawTime);
  finalFood.textContent = food;

  cantWaitBtn.classList.remove('hidden');
  seeYouSoon.classList.add('hidden');
}

cantWaitBtn.addEventListener('click', () => {
  cantWaitBtn.classList.add('hidden');
  seeYouSoon.classList.remove('hidden');
});

// On page load, check localStorage: if a previous answer exists,
// skip straight to the final confirmation screen.
function restoreSavedAnswerIfAny() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const { rawDate, rawTime, food } = JSON.parse(saved);
    renderFinalScreen(rawDate, rawTime, food);
    goToScreen(5);
  } catch (err) {
    // If the saved data is corrupted for any reason, just ignore it
    // and let the user go through the normal flow instead.
    localStorage.removeItem(STORAGE_KEY);
  }
}
//restoreSavedAnswerIfAny();

/* ==================================================================
   10) CONFETTI ANIMATION
   Creates a burst of small colored rectangles that fall from the
   top of the screen and fade out, then removes them from the DOM.
================================================================== */
function launchConfetti() {
  const confettiColors = ['#ff4d6d', '#ff85a1', '#ffd9e3', '#ffffff', '#e63955'];
  const pieceCount = 60;

  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';

    // Randomize each piece's horizontal position, color, fall speed,
    // and fall delay so the burst looks natural, not mechanical.
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    piece.style.animationDuration = `${1.8 + Math.random() * 1.4}s`;
    piece.style.animationDelay = `${Math.random() * 0.4}s`;

    confettiLayer.appendChild(piece);

    // Clean up each piece once its fall animation finishes, so we
    // don't leave thousands of invisible <div>s in the page forever.
    piece.addEventListener('animationend', () => piece.remove());
  }
}

/* ==================================================================
   11) TYPEWRITER EFFECT FOR THE SCREEN 1 HEADING
   Reveals the heading text one character at a time on first load.
================================================================== */
function typewriterEffect(element) {
  const fullText = element.textContent;
  element.textContent = '';

  let charIndex = 0;
  function typeNextCharacter() {
    if (charIndex < fullText.length) {
      element.textContent += fullText.charAt(charIndex);
      charIndex++;
      setTimeout(typeNextCharacter, 35); // speed of typing, in ms per letter
    }
  }
  typeNextCharacter();
}

// Kick off the typewriter effect once the loading screen is gone.
setTimeout(() => {
  typewriterEffect(qs('#screen1Heading'));
}, 2100);

/* ==================================================================
   12) BACKGROUND FLOATING HEARTS (canvas particles)
   Draws small, semi-transparent hearts that drift upward slowly,
   purely as ambient decoration behind the cards.
================================================================== */
const canvas = qs('#heartsCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Each heart particle is a plain object describing its own position,
// size, speed, and opacity. We keep an array of these and update
// them every animation frame.
function createHeartParticle() {
  return {
    x: Math.random() * canvas.width,
    y: canvas.height + 20,
    size: 10 + Math.random() * 16,
    speed: 0.4 + Math.random() * 0.6,
    drift: (Math.random() - 0.5) * 0.5, // slight left/right sway
    opacity: 0.15 + Math.random() * 0.25,
  };
}

const HEART_COUNT = 22;
const heartParticles = Array.from({ length: HEART_COUNT }, createHeartParticle);

// Draws one heart shape at (x, y) using two circles + a triangle,
// which is the classic simple way to draw a heart with canvas.
function drawHeart(x, y, size, opacity) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = '#ff6b81';
  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(x, y + topCurveHeight);
  // Left bump
  ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
  ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 2, x, y + size);
  // Right bump
  ctx.bezierCurveTo(x, y + (size + topCurveHeight) / 2, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
  ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// The animation loop: clears the canvas, moves every heart up
// slightly, resets any that have floated off the top, and repeats.
function animateHearts() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  heartParticles.forEach((heart) => {
    heart.y -= heart.speed;
    heart.x += heart.drift;

    if (heart.y < -30) {
      Object.assign(heart, createHeartParticle());
    }

    drawHeart(heart.x, heart.y, heart.size, heart.opacity);
  });

  requestAnimationFrame(animateHearts);
}

// Respect users who've asked their OS/browser for reduced motion:
// skip the continuous canvas animation for them.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReducedMotion) {
  animateHearts();
}
