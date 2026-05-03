import kaboom from "kaboom";

// Start Button Logic
const startBtn = document.getElementById("start-btn");
const startScreen = document.getElementById("start-screen");

startBtn.addEventListener("click", () => {
    startScreen.classList.add("hidden");
    initGame();
});

function initGame() {
    // Initialize Kaboom
    kaboom({
        canvas: document.getElementById("game-canvas"),
        background: [141, 183, 255], // Sky blue
    });

    // Fix AudioContext autoplay policy (redundant but safe)
    const resumeAudio = () => {
        if (getAudioContext().state === "suspended") {
            getAudioContext().resume();
        }
    };

    onKeyPress(resumeAudio);
    onMousePress(resumeAudio);

    // Standard relative path loading for Kaboom
    // This works in Vite dev, Vite build, and raw GitHub Pages hosting
    loadRoot("./");

    // Load Local Assets (Animated Mario Sprite Sheet - 26 Frames)
    loadSprite("bean", "assets/sprites/Mario.png", {
        sliceX: 26,
        sliceY: 1,
        anims: {
            // Small Mario (0-7)
            "idle": { from: 0, to: 0 },
            "walk": { from: 1, to: 3, speed: 12, loop: true },
            "jump": { from: 5, to: 5 },
            "crouch": { from: 6, to: 6 },

            // Big Mario (8-16) 
            "big-idle": { from: 8, to: 8 },
            "big-walk": { from: 9, to: 11, speed: 12, loop: true },
            "big-jump": { from: 13, to: 13 },
            "big-crouch": { from: 14, to: 14 }
        }
    });

    // Load Kaboom Official Assets (Now Local)
    loadSprite("ghosty", "assets/sprites/ghosty.png");
    loadSprite("spike", "assets/sprites/spike.png");
    loadSprite("grass", "assets/sprites/grass.png");
    loadSprite("steel", "assets/sprites/note.png");
    loadSprite("brick", "assets/sprites/grass.png");
    loadSprite("jumpy", "assets/sprites/jumpy.png");
    loadSprite("unboxed", "assets/sprites/mark.png");
    loadSprite("apple", "assets/sprites/apple.png");
    loadSprite("portal", "assets/sprites/portal.png");
    loadSprite("coin", "assets/sprites/coin.png");
    loadSprite("cloud", "assets/sprites/cloud.png");
    loadSprite("sun", "assets/sprites/sun.png");
    loadSprite("butterfly", "assets/sprites/btfly.png");

    // Load Sounds (Now Local)
    loadSound("jump", "assets/sounds/powerup.mp3");
    loadSound("coin", "assets/sounds/score.mp3");
    loadSound("powerup", "assets/sounds/spring.mp3");
    loadSound("blip", "assets/sounds/blip.mp3");
    loadSound("hit", "assets/sounds/hit.mp3");
    loadSound("portal", "assets/sounds/portal.mp3");
    loadSound("bgm", "assets/sounds/OtherworldlyFoe.mp3");
    loadSound("off", "assets/sounds/off.mp3");

    // Data for the Information Poles
    const poleData = {
        "1": {
            title: "WORLD 1-1: The Origin Story",
            body: "Equipped with a B.Tech from DA-IICT (CPI: 8.83), I spawned into Sprinklr as an Intern. My first quest? Build a Node.js real-time alert mechanism. It squished system downtime by 80%—like a Goomba!"
        },
        "2": {
            title: "WORLD 1-2: The Optimization Zone",
            body: "Leveling up to Product Engineer! I went on an optimization run: slashed cloud storage costs by 50%, shrank the Redis memory footprint in half, and stomped out 90% of high-severity MongoDB alerts."
        },
        "3": {
            title: "WORLD 1-3: The Architecture Upgrade",
            body: "Promoted to Senior Product Engineer! I built a Kafka bridge over the lava of systemic outages, decoupling critical dependencies. I also swapped old SIP clients for WebSocket streaming, speeding up partner onboarding by 2 hours per integration."
        },
        "4": {
            title: "WORLD 1-4: The AI Boss Fight",
            body: "Now a Lead Product Engineer! I faced the massive 8-second VoiceBot Latency Boss. By wielding Agentic AI pipelines, RAG, and streaming ASR/TTS, I defeated it—bringing latency down to a lightning-fast 1.5 seconds. 99.9% uptime secured!"
        }
    };

    // UI Elements
    const infoModal = document.getElementById("info-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");
    const modalContinueBtn = document.getElementById("modal-continue-btn");

    const resumeModal = document.getElementById("resume-modal");
    const resumeRestartBtn = document.getElementById("resume-restart-btn");
    const pointsValue = document.getElementById("points-value");

    // UI state
    let isGamePaused = false;
    let bgmMusic = null;

    // Continue Button Logic
    modalContinueBtn.addEventListener("click", () => {
        infoModal.classList.add("hidden");
        infoModal.style.display = "";
        setTimeout(() => {
            isGamePaused = false;
            debug.paused = false;
        }, 100);
    });

    // Restart Button Logic
    resumeRestartBtn.addEventListener("click", () => {
        resumeModal.classList.add("hidden");
        resumeModal.style.display = "";
        isGamePaused = false;
        debug.paused = false;
        go("game"); // Restart the scene
    });

    // Custom component for handling "Super" state
    function big() {
        let isBig = false;
        let isInvincible = false;

        return {
            id: "big",
            require: ["scale", "color"],
            isBig() { return isBig; },
            biggify() {
                isBig = true;
                this.scale = vec2(3.0);
                this.play("big-idle");
            },
            smallify() {
                isBig = false;
                this.scale = vec2(3.0);
                this.play("idle");
            },
            invincify(time) {
                isInvincible = true;
                this.color = rgb(255, 100, 100);
                wait(time, () => {
                    isInvincible = false;
                    this.color = rgb(255, 255, 255);
                });
            },
            isInvincible() {
                return isInvincible;
            }
        };
    }

    scene("lose", (finalScore) => {
        if (bgmMusic) {
            bgmMusic.paused = true;
        }
        play("off");

        const gameOverModal = document.getElementById("game-over-modal");
        const finalScoreValue = document.getElementById("final-score-value");
        const retryBtn = document.getElementById("retry-btn");

        if (gameOverModal && finalScoreValue) {
            finalScoreValue.innerText = `x ${finalScore}`;
            gameOverModal.classList.remove("hidden");
            gameOverModal.style.display = "flex";
        }

        const restartGame = () => {
            if (gameOverModal) {
                gameOverModal.classList.add("hidden");
                gameOverModal.style.display = "none";
            }
            go("game");
        };

        retryBtn.addEventListener("click", restartGame, { once: true });

        onKeyPress("space", restartGame);
    });



    scene("game", () => {
        setGravity(2400);

        // Spawn Clouds Procedurally
        onUpdate(() => {
            if (chance(0.01)) {
                const startX = camPos().x + width() / 2 + 100;
                const startY = rand(50, 300);
                add([
                    sprite("cloud"),
                    pos(startX, startY),
                    z(0),
                    opacity(rand(0.5, 0.9)),
                    scale(rand(1, 2)),
                    move(LEFT, rand(20, 50)),
                    "cloud"
                ]);
            }
        });

        let score = 0;



        // Score logic (Updates HTML element)
        if (pointsValue) pointsValue.innerText = "000000";

        // Add Sun (Top-Right)
        add([
            sprite("sun"),
            color(255, 255, 0),
            pos(width() - 80, 80),
            anchor("center"),
            fixed(),
            scale(3),
            z(100)
        ]);

        // Spawn Butterflies Procedurally
        onUpdate(() => {
            if (chance(0.02)) {
                const startX = camPos().x + width() / 2 + 100;
                const startY = rand(100, height() - 200);
                add([
                    sprite("butterfly"),
                    pos(startX, startY),
                    z(20),
                    scale(0.5),
                    "butterfly"
                ]);
            }
        });

        onUpdate("butterfly", (b) => {
            if (!isGamePaused) {
                b.move(-100, Math.sin(time() * 10) * 50);
            }
        });

        function addScore(amount) {
            score += amount;
            if (pointsValue) pointsValue.innerText = score.toString().padStart(6, '0');
        }

        const levelMap = [
            "                                                                                                                        @",
            "                                                                                                                        @",
            "                                                                                                                        @",
            "                                                                                                                        @",
            "                                                                                                                        @",
            "                                                                                                                        @",
            "                            *                                *                                                          @",
            "                                    E                                                                                   @",
            "         1     B        B B B B B          2             |               3              ======            4             @",
            "                 E                                       |       E                      ======                          @",
            "             B*BB                          E             |       ===                    ======                          @",
            "                                       =======           ===     ===      E             ======            B * B         @",
            "^                              E^^            ^^                               |                E|                      @",
            "==================  =============  ==================  =======================  ==================  ====================@",
            "==================  =============  ==================  =======================  ==================  ====================@",
            "==================  =============  ==================  =======================  ==================  ====================@",
        ];

        const levelConfig = {
            tileWidth: 64,
            tileHeight: 64,
            tiles: {
                "=": () => [sprite("grass"), area({ scale: 1.0 }), body({ isStatic: true }), "ground"],
                "B": () => [sprite("brick"), area({ scale: 1.0 }), body({ isStatic: true }), "brick"],
                "*": () => [sprite("jumpy"), area(), body({ isStatic: true }), "question_block"],
                "|": () => [sprite("steel"), color(54, 69, 79), outline(4, rgb(0, 0, 0)), area(), body({ isStatic: true }), "pipe"],
                "1": () => [sprite("steel"), outline(4, rgb(0, 0, 0)), area({ scale: 1.0 }), body({ isStatic: true }), "info_block", { poleId: "1", bumped: false }],
                "2": () => [sprite("steel"), outline(4, rgb(0, 0, 0)), area({ scale: 1.0 }), body({ isStatic: true }), "info_block", { poleId: "2", bumped: false }],
                "3": () => [sprite("steel"), outline(4, rgb(0, 0, 0)), area({ scale: 1.0 }), body({ isStatic: true }), "info_block", { poleId: "3", bumped: false }],
                "4": () => [sprite("steel"), outline(4, rgb(0, 0, 0)), area({ scale: 1.0 }), body({ isStatic: true }), "info_block", { poleId: "4", bumped: false }],
                "@": () => [sprite("portal"), area(), body({ isStatic: true }), "portal"],
                "E": () => [sprite("ghosty"), area(), body(), "enemy", { dir: -1 }],
                "^": () => [sprite("spike"), area(), body({ isStatic: true }), "hazard"],
            }
        };

        onUpdate("info_block", (block) => {
            if (!block.bumped) {
                let wave = (Math.sin(time() * 6) + 1) / 2;

                let white = rgb(255, 255, 255);
                let lightYellow = rgb(255, 230, 100);
                block.color = white.lerp(lightYellow, wave);
            } else {
                block.color = rgb(150, 150, 150);
            }
        });

        addLevel(levelMap, levelConfig);

        // Add Player
        const player = add([
            sprite("bean"),
            pos(100, 300), // Adjusted start position for bottom anchor
            area({ scale: vec2(0.4, 1.0) }), // Full height to prevent sinking, narrow width for gaps
            body(),
            anchor("bot"), // Pivot from the feet
            scale(3.0),
            color(255, 255, 255),
            big(),
            "player",
            z(50)
        ]);

        // Setup BGM
        if (!bgmMusic) {
            bgmMusic = play("bgm", { loop: true, volume: 0.5 });
        }
        bgmMusic.paused = false;

        // Physics & Movement Constants
        const SPEED = 400;
        const JUMP_FORCE = 1300;
        const ENEMY_SPEED = 100;

        // Camera & Animation State Management
        player.onUpdate(() => {
            camPos(player.pos.x + 200, height() / 2);

            // Bottomless Pit Hazard
            if (player.pos.y > height() + 200) {
                go("lose", score);
            }
        });

        // Movement Controls
        onKeyDown("left", () => {
            if (!isGamePaused) {
                player.move(-SPEED, 0);
                player.flipX = true;
                // Only walk if not crouching
                if (!isKeyDown("down") && !isKeyDown("s")) {
                    const anim = player.isBig() ? "big-walk" : "walk";
                    if (player.isGrounded() && player.curAnim() !== anim) {
                        player.play(anim);
                    }
                }
            }
        });
        onKeyDown("a", () => {
            if (!isGamePaused) {
                player.move(-SPEED, 0);
                player.flipX = true;
                if (!isKeyDown("down") && !isKeyDown("s")) {
                    const anim = player.isBig() ? "big-walk" : "walk";
                    if (player.isGrounded() && player.curAnim() !== anim) {
                        player.play(anim);
                    }
                }
            }
        });

        onKeyDown("right", () => {
            if (!isGamePaused) {
                player.move(SPEED, 0);
                player.flipX = false;
                if (!isKeyDown("down") && !isKeyDown("s")) {
                    const anim = player.isBig() ? "big-walk" : "walk";
                    if (player.isGrounded() && player.curAnim() !== anim) {
                        player.play(anim);
                    }
                }
            }
        });
        onKeyDown("d", () => {
            if (!isGamePaused) {
                player.move(SPEED, 0);
                player.flipX = false;
                if (!isKeyDown("down") && !isKeyDown("s")) {
                    const anim = player.isBig() ? "big-walk" : "walk";
                    if (player.isGrounded() && player.curAnim() !== anim) {
                        player.play(anim);
                    }
                }
            }
        });

        // Crouch / Sit
        onKeyDown("s", () => {
            if (!isGamePaused && player.isGrounded()) {
                const anim = player.isBig() ? "big-crouch" : "crouch";
                if (player.curAnim() !== anim) {
                    player.play(anim);
                }
            }
        });
        onKeyDown("down", () => {
            if (!isGamePaused && player.isGrounded()) {
                const anim = player.isBig() ? "big-crouch" : "crouch";
                if (player.curAnim() !== anim) {
                    player.play(anim);
                }
            }
        });

        // Reset to idle when keys are released
        onKeyRelease(["left", "right", "a", "d", "w", "s", "down"], () => {
            if (player.isGrounded() && !isKeyDown("left") && !isKeyDown("right") && !isKeyDown("a") && !isKeyDown("d") && !isKeyDown("s") && !isKeyDown("down")) {
                player.play(player.isBig() ? "big-idle" : "idle");
            }
        });

        // Variable Jump
        onKeyPress("space", () => {
            if (!isGamePaused && player.isGrounded()) {
                player.jump(JUMP_FORCE);
                player.play(player.isBig() ? "big-jump" : "jump");
                play("jump", { volume: 0.8 });
            }
        });
        onKeyPress("w", () => {
            if (!isGamePaused && player.isGrounded()) {
                player.jump(JUMP_FORCE);
                player.play(player.isBig() ? "big-jump" : "jump");
                play("jump", { volume: 0.8 });
            }
        });
        onKeyPress("up", () => {
            if (!isGamePaused && player.isGrounded()) {
                player.jump(JUMP_FORCE);
                player.play(player.isBig() ? "big-jump" : "jump");
                play("jump", { volume: 0.8 });
            }
        });

        // Velocity cut on release (Variable jump height)
        onKeyRelease(["space", "w", "up"], () => {
            if (player.vel && player.vel.y < 0) {
                player.vel.y *= 0.5;
            }
        });

        // Handle landing back on ground
        player.onGround(() => {
            player.play(player.isBig() ? "big-idle" : "idle");
        });

        // Modal Input Handling
        onKeyPress((key) => {
            if (isGamePaused && (key === "space" || key === "enter")) {
                if (!infoModal.classList.contains("hidden")) {
                    infoModal.classList.add("hidden");
                    setTimeout(() => {
                        isGamePaused = false;
                        debug.paused = false;
                    }, 100);
                } else if (!resumeModal.classList.contains("hidden")) {
                    resumeModal.classList.add("hidden");
                    isGamePaused = false;
                    debug.paused = false;
                    go("game");
                }
            }
        });

        function showResumeModal(poleId) {
            if (isGamePaused) return;

            const data = poleData[poleId];
            if (!data) return;

            modalTitle.textContent = data.title;
            modalBody.textContent = data.body;

            infoModal.classList.remove("hidden");
            infoModal.style.display = "flex";

            isGamePaused = true;
            debug.paused = true;
        }

        // Interactions & Collisions

        // Enemy AI & Patrol
        onUpdate("enemy", (e) => {
            if (!isGamePaused) {
                e.move(ENEMY_SPEED * e.dir, 0);
            }
        });
        onCollide("enemy", "ground", (e, g, col) => {
            if (col && (col.isLeft() || col.isRight())) e.dir = -e.dir;
        });
        onCollide("enemy", "pipe", (e, g, col) => {
            if (col && (col.isLeft() || col.isRight())) e.dir = -e.dir;
        });
        onCollide("enemy", "brick", (e, g, col) => {
            if (col && (col.isLeft() || col.isRight())) e.dir = -e.dir;
        });

        // Player vs Enemy
        player.onCollide("enemy", (e, col) => {
            if (isGamePaused) return;

            if (col && col.isBottom()) {
                // Player lands on enemy (Squish)
                destroy(e);
                play("hit", { volume: 0.8 });
                player.jump(400); // Small bounce off the enemy
                addScore(200);
            } else {
                // Player hit from side or top
                if (player.isInvincible()) return;

                if (player.isBig()) {
                    play("blip");
                    player.smallify();
                    player.invincify(1); // 1 second of invincibility
                } else {
                    go("lose", score);
                }
            }
        });

        // Brick Block Interaction
        player.onCollide("brick", (b, col) => {
            if (isGamePaused) return;
            if (col && col.isTop()) { // Player's top hits the block's bottom
                if (player.isBig()) {
                    destroy(b);
                    play("hit"); // Shatter sound
                    addScore(50);
                } else {
                    play("blip");
                    // Bump animation
                    const startY = b.pos.y;
                    b.moveBy(0, -10);
                    setTimeout(() => b.pos.y = startY, 100);
                }
            }
        });

        // Question Block Interaction
        player.onCollide("question_block", (b, col) => {
            if (isGamePaused) return;
            if (col && col.isTop() && b.sprite !== "unboxed") {
                b.use(sprite("unboxed"));
                play("blip");

                // Spawn Mushroom/Apple
                add([
                    sprite("apple"),
                    pos(b.pos.x, b.pos.y - 64),
                    area(),
                    body(),
                    "mushroom",
                    { dir: 1 },
                    z(50)
                ]);
            }
        });

        // Mushroom logic
        onUpdate("mushroom", (m) => {
            if (!isGamePaused) m.move(150 * m.dir, 0);
        });
        onCollide("mushroom", "ground", (m, g, col) => {
            if (col && (col.isLeft() || col.isRight())) m.dir = -m.dir;
        });
        onCollide("mushroom", "pipe", (m, g, col) => {
            if (col && (col.isLeft() || col.isRight())) m.dir = -m.dir;
        });
        onCollide("mushroom", "brick", (m, g, col) => {
            if (col && (col.isLeft() || col.isRight())) m.dir = -m.dir;
        });

        player.onCollide("mushroom", (m) => {
            destroy(m);
            play("powerup");
            player.biggify();
            addScore(1000);
        });

        // InfoBlock (Resume popup) Interaction
        player.onCollide("info_block", (b, col) => {
            if (isGamePaused) return;

            if (col && col.isTop()) { // Player hit from below
                if (!b.bumped) {
                    b.bumped = true;
                    play("hit", { volume: 0.8 });

                    // Bump animation
                    const startY = b.pos.y;
                    b.moveBy(0, -10);
                    setTimeout(() => {
                        b.pos.y = startY;
                        showResumeModal(b.poleId);
                    }, 100);
                } else {
                    play("hit", { volume: 0.8 });
                    showResumeModal(b.poleId);
                }
            }
        });

        // Hazards
        player.onCollide("hazard", () => {
            if (isGamePaused) return;
            go("lose", score);
        });

        // Win condition (Portal)
        player.onCollide("portal", () => {
            if (isGamePaused) return;

            play("portal");
            resumeModal.classList.remove("hidden");
            resumeModal.style.display = "flex";
            isGamePaused = true;
            debug.paused = true;
        });

    });

    // Start the game
    go("game");
}
