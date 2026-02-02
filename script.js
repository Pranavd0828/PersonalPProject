document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const CONFIG = {
        repulsionRadius: 150, // Pixels around button where repulsion kicks in
        repulsionForce: 15,   // Multiplier for speed
        friction: 0.9,        // Deceleration
        tiltIntensity: 10,    // Max rotation in degrees
    };

    // --- DOM Elements ---
    const yesBtn = document.getElementById('yesBtn');
    const noBtn = document.getElementById('noBtn');
    const card = document.getElementById('mainContainer'); // The glass card
    const celebrationContent = document.getElementById('celebrationContent');
    const retryModal = document.getElementById('retryModal');
    const closeModal = document.getElementById('closeModal');
    const backgroundLayer = document.querySelector('.bg-layer');

    // --- State ---
    let noBtnState = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        isFloating: false // If true, it's detached from the card
    };
    let mouse = { x: -1000, y: -1000 };
    let attempts = 0;
    let isCelebrating = false;

    // --- Initialization ---
    function init() {
        // Initial button position check not needed until interaction
        // Start the animation loop
        requestAnimationFrame(animate);
    }

    // --- Event Listeners ---
    document.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;

        handleTilt(e.clientX, e.clientY);
    });

    // Touch support
    document.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        mouse.x = touch.clientX;
        mouse.y = touch.clientY;
        handleTilt(touch.clientX, touch.clientY);
    }, { passive: true });

    yesBtn.addEventListener('click', celebrate);

    // Attempt tracking
    noBtn.addEventListener('mouseover', registerAttempt);
    noBtn.addEventListener('touchstart', registerAttempt, { passive: true });

    function registerAttempt() {
        if (isCelebrating) return;
        attempts++;
        if (attempts >= 5 && retryModal.classList.contains('hidden')) {
            retryModal.classList.remove('hidden');
        }
    }

    closeModal.addEventListener('click', () => {
        retryModal.classList.add('hidden');
    });

    // --- Physics Engine (The "50 Engineers" Touch) ---
    function animate() {
        if (isCelebrating) return;

        if (noBtnState.isFloating) {
            updateButtonPhysics();
        } else {
            checkButtonTrigger();
        }

        requestAnimationFrame(animate);
    }

    function checkButtonTrigger() {
        // If mouse gets close to the static button, detach it
        const rect = noBtn.getBoundingClientRect();
        const btnCenterX = rect.left + rect.width / 2;
        const btnCenterY = rect.top + rect.height / 2;

        const dx = mouse.x - btnCenterX;
        const dy = mouse.y - btnCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONFIG.repulsionRadius) {
            detachButton(rect);
        }
    }

    function detachButton(rect) {
        noBtnState.isFloating = true;
        noBtnState.x = rect.left;
        noBtnState.y = rect.top;

        // Move to body for free movement
        noBtn.style.position = 'fixed';
        noBtn.style.left = '0px';
        noBtn.style.top = '0px';
        noBtn.style.transform = `translate(${noBtnState.x}px, ${noBtnState.y}px)`;
        noBtn.style.zIndex = 1000;
        document.body.appendChild(noBtn);
    }

    function updateButtonPhysics() {
        // Calculate vector from mouse to button
        const btnRect = noBtn.getBoundingClientRect();
        const btnCenterX = noBtnState.x + btnRect.width / 2;
        const btnCenterY = noBtnState.y + btnRect.height / 2;

        const dx = btnCenterX - mouse.x;
        const dy = btnCenterY - mouse.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        // Avoid division by zero
        if (dist < 1) dist = 1;

        // Force only applies if mouse is close
        if (dist < CONFIG.repulsionRadius) {
            // Normalized vector * strength * (1 / distance_factor)
            // The closer the mouse, the stronger the push
            const force = (CONFIG.repulsionRadius - dist) / CONFIG.repulsionRadius;
            const angle = Math.atan2(dy, dx);

            const pushX = Math.cos(angle) * force * CONFIG.repulsionForce;
            const pushY = Math.sin(angle) * force * CONFIG.repulsionForce;

            noBtnState.vx += pushX;
            noBtnState.vy += pushY;
        }

        // Apply Friction
        noBtnState.vx *= CONFIG.friction;
        noBtnState.vy *= CONFIG.friction;

        // Update Position
        noBtnState.x += noBtnState.vx;
        noBtnState.y += noBtnState.vy;

        // Boundary Constraints (Bounce off walls)
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const btnW = btnRect.width;
        const btnH = btnRect.height;
        const padding = 20;

        if (noBtnState.x < padding) { noBtnState.x = padding; noBtnState.vx *= -0.8; }
        if (noBtnState.x > screenW - btnW - padding) { noBtnState.x = screenW - btnW - padding; noBtnState.vx *= -0.8; }
        if (noBtnState.y < padding) { noBtnState.y = padding; noBtnState.vy *= -0.8; }
        if (noBtnState.y > screenH - btnH - padding) { noBtnState.y = screenH - btnH - padding; noBtnState.vy *= -0.8; }

        // Apply transform
        noBtn.style.transform = `translate(${noBtnState.x}px, ${noBtnState.y}px)`;
    }

    // --- 3D Parallax Tilt ---
    function handleTilt(x, y) {
        if (isCelebrating) return;

        const w = window.innerWidth;
        const h = window.innerHeight;

        // Normalize coordinates -1 to 1
        const cx = (x - w / 2) / (w / 2);
        const cy = (y - h / 2) / (h / 2);

        // Apply rotation
        const rotX = -cy * CONFIG.tiltIntensity;
        const rotY = cx * CONFIG.tiltIntensity;

        card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
    }

    // --- Celebration ---
    function celebrate() {
        isCelebrating = true;

        // Remove 'No' button
        noBtn.style.opacity = '0';
        setTimeout(() => noBtn.remove(), 500);

        // Reset Card
        card.style.transition = 'all 1s ease';
        card.style.transform = 'scale(0.8) translateY(50px)';
        card.style.opacity = '0';

        // Clear Background filters
        backgroundLayer.style.filter = 'blur(0px) brightness(1.1)';
        document.body.classList.add('celebrating');

        setTimeout(() => {
            celebrationContent.classList.remove('hidden');
            card.classList.add('hidden');

            // Continuous Confetti
            const end = Date.now() + 5000;
            const colors = ['#ff4d6d', '#ffb3c1', '#ffffff'];

            (function frame() {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: colors
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: colors
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());
        }, 800);
    }

    init();
});
