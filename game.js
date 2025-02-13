        // Terrain class
        class Terrain {
            constructor(canvas) {
                this.canvas = canvas;
                this.obstacles = [];
                this.minObstacles = 4;
                this.maxObstacles = 8;
                this.wallThickness = 10; // Thickness of walls
                this.minLength = 100;
                this.maxLength = 250;
                this.padding = 50;
                this.initializeObstacles();
            }

            initializeObstacles() {
                this.obstacles = [];
                const numObstacles = Math.floor(Math.random() * (this.maxObstacles - this.minObstacles + 1)) + this.minObstacles;
                
                let attempts = 0;
                const maxAttempts = 100;

                while (this.obstacles.length < numObstacles && attempts < maxAttempts) {
                    // Generate an L-shaped or straight wall
                    const isLShaped = Math.random() < 0.6; // 60% chance of L-shaped walls
                    
                    if (isLShaped) {
                        const mainLength = Math.random() * (this.maxLength - this.minLength) + this.minLength;
                        const secondaryLength = Math.random() * (this.maxLength - this.minLength) + this.minLength;
                        const isHorizontalFirst = Math.random() < 0.5;
                        
                        const x = Math.random() * (this.canvas.width - (isHorizontalFirst ? mainLength : this.wallThickness));
                        const y = Math.random() * (this.canvas.height - (isHorizontalFirst ? this.wallThickness : mainLength));
                        
                        // Create two rectangles that form an L shape
                        const rect1 = {
                            x: x,
                            y: y,
                            width: isHorizontalFirst ? mainLength : this.wallThickness,
                            height: isHorizontalFirst ? this.wallThickness : mainLength
                        };
                        
                        const rect2 = {
                            x: isHorizontalFirst ? x + mainLength - this.wallThickness : x,
                            y: isHorizontalFirst ? y : y + mainLength - this.wallThickness,
                            width: isHorizontalFirst ? this.wallThickness : secondaryLength,
                            height: isHorizontalFirst ? secondaryLength : this.wallThickness
                        };

                        if (!this.isOverlapping(rect1) && !this.isOverlapping(rect2) && 
                            !this.isBlockingCenter(rect1) && !this.isBlockingCenter(rect2)) {
                            this.obstacles.push(rect1, rect2);
                        }
                    } else {
                        // Generate a straight wall
                        const isHorizontal = Math.random() < 0.5;
                        const length = Math.random() * (this.maxLength - this.minLength) + this.minLength;
                        
                        const x = Math.random() * (this.canvas.width - (isHorizontal ? length : this.wallThickness));
                        const y = Math.random() * (this.canvas.height - (isHorizontal ? this.wallThickness : length));
                        
                        const newObstacle = {
                            x: x,
                            y: y,
                            width: isHorizontal ? length : this.wallThickness,
                            height: isHorizontal ? this.wallThickness : length
                        };

                        if (!this.isOverlapping(newObstacle) && !this.isBlockingCenter(newObstacle)) {
                            this.obstacles.push(newObstacle);
                        }
                    }
                    attempts++;
                }
            }

            isOverlapping(newObstacle) {
                return this.obstacles.some(obstacle => {
                    const xOverlap = (newObstacle.x < obstacle.x + obstacle.width + this.padding) &&
                                   (newObstacle.x + newObstacle.width + this.padding > obstacle.x);
                    const yOverlap = (newObstacle.y < obstacle.y + obstacle.height + this.padding) &&
                                   (newObstacle.y + newObstacle.height + this.padding > obstacle.y);
                    return xOverlap && yOverlap;
                });
            }

            isBlockingCenter(obstacle) {
                // Create a safe zone in the center of the canvas for the player
                const centerSafeZone = {
                    x: this.canvas.width / 2 - playerSize * 2,
                    y: this.canvas.height / 2 - playerSize * 2,
                    width: playerSize * 4,
                    height: playerSize * 4
                };

                const xOverlap = (obstacle.x < centerSafeZone.x + centerSafeZone.width + this.padding) &&
                               (obstacle.x + obstacle.width + this.padding > centerSafeZone.x);
                const yOverlap = (obstacle.y < centerSafeZone.y + centerSafeZone.height + this.padding) &&
                               (obstacle.y + obstacle.height + this.padding > centerSafeZone.y);
                
                return xOverlap && yOverlap;
            }

            draw(ctx) {
                ctx.fillStyle = '#666666';
                this.obstacles.forEach(obstacle => {
                    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                });
            }

            checkCollision(x, y, width, height) {
                return this.obstacles.some(obstacle => 
                    x < obstacle.x + obstacle.width &&
                    x + width > obstacle.x &&
                    y < obstacle.y + obstacle.height &&
                    y + height > obstacle.y
                );
            }

            handleEnemyCollision(enemy) {
                this.obstacles.forEach(obstacle => {
                    const enemyCenterX = enemy.x + enemySize / 2;
                    const enemyCenterY = enemy.y + enemySize / 2;
                    const enemyRadius = enemySize / 2;
                    
                    // Calculate closest point on rectangle to circle center
                    const closestX = Math.max(obstacle.x, Math.min(enemyCenterX, obstacle.x + obstacle.width));
                    const closestY = Math.max(obstacle.y, Math.min(enemyCenterY, obstacle.y + obstacle.height));
                    
                    const dx = enemyCenterX - closestX;
                    const dy = enemyCenterY - closestY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < enemyRadius) {
                        // Collision detected, determine bounce direction
                        if (Math.abs(dx) > Math.abs(dy)) {
                            enemy.dx *= -1;
                        } else {
                            enemy.dy *= -1;
                        }
                    }
                });
            }

            getValidSpawnPosition(objectSize) {
                let x, y;
                let validPosition = false;
                let attempts = 0;
                const maxAttempts = 100;

                while (!validPosition && attempts < maxAttempts) {
                    x = Math.random() * (this.canvas.width - objectSize);
                    y = Math.random() * (this.canvas.height - objectSize);
                    
                    // Check if position overlaps with terrain
                    validPosition = !this.checkCollision(x, y, objectSize, objectSize);
                    
                    // Add padding around terrain for dots
                    if (validPosition) {
                        const padding = 5; // 5 pixels padding
                        validPosition = !this.obstacles.some(obstacle => {
                            return (x - padding < obstacle.x + obstacle.width &&
                                    x + objectSize + padding > obstacle.x &&
                                    y - padding < obstacle.y + obstacle.height &&
                                    y + objectSize + padding > obstacle.y);
                        });
                    }
                    
                    attempts++;
                }

                // If we couldn't find a valid position after max attempts, try again with no padding
                if (!validPosition) {
                    return this.getValidSpawnPosition(objectSize);
                }

                return { x, y };
            }
        }

		// Add these new variables near the top with other game properties
		const DIFFICULTY_INCREASE_INTERVAL = 5; // Every 5 points
		const ENEMY_SPEED_INCREASE = 0.5; // Speed increase per difficulty level
		const ENEMY_COUNT_INCREASE = 1; // How many enemies to add per difficulty level
		const MAX_ENEMIES = 15; // Maximum number of enemies allowed
		const BASE_ENEMY_SPEED = 3; // Starting speed
		const BASE_ENEMY_COUNT = 3; // Starting number of enemies

		// Modify these variables to be calculated based on difficulty
		let currentEnemySpeed = BASE_ENEMY_SPEED;
		let currentEnemyCount = BASE_ENEMY_COUNT;
		let lastDifficultyIncrease = 0;

        // Game code
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        // Modify canvas size (add near the top after getting canvas element)
        canvas.width = canvas.width * 1.25;
        canvas.height = canvas.height * 1.25;

        // Player properties
        const INITIAL_PLAYER_SIZE = 30;
        let playerSize = INITIAL_PLAYER_SIZE;
        let playerX = canvas.width / 2 - playerSize / 2;
        let playerY = canvas.height / 2 - playerSize / 2;
        const playerSpeed = 9; // Increased from 3 (300%)

        // Point properties
        const pointSize = 10;
        let pointX = Math.random() * (canvas.width - pointSize);
        let pointY = Math.random() * (canvas.height - pointSize);
        let score = 0;

        // Enemy properties
        const enemySize = 20;
        const enemySpeed = 1;
        const numberOfEnemies = 3;
        let enemies = [];

        // Create terrain instance
        const terrain = new Terrain(canvas);

        // Keyboard input
        const keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false
        };

        // FPS counter
        let fps = 0;
        let lastTime = performance.now();

		// Add these variables near the top with other game properties
		let levelMessageTimer = 0;
		let showingLevelMessage = false;

		// Add these variables near the top with other game properties
		let dotsCollected = 0;
		let DOTS_PER_LEVEL = 5;
		let lastTimeScoreUpdate = performance.now();
		const POINTS_PER_SECOND = 15;
		const POINTS_PER_DOT = 50;

		// Add near the top with other game properties
		const PLAYER_GROWTH_RATE = 0.5; // Grow by 0.5 pixels per dot
		const TARGET_FPS = 60;
		const FRAME_TIME = 1000 / TARGET_FPS;
		let lastFrameTime = 0;

		// Add near the top with other game properties
		const MAX_HEALTH = 3;
		let playerHealth = MAX_HEALTH;

		// Add these near the top with other player properties
		const PLAYER_ACCELERATION = 0.8;
		const PLAYER_DECELERATION = 0.8;
		const MAX_PLAYER_SPEED = 9;
		let playerVelocityX = 0;
		let playerVelocityY = 0;

		// Modify the updateDifficulty function
		function updateDifficulty() {
			if (dotsCollected >= DOTS_PER_LEVEL) {
				lastDifficultyIncrease++;
				// Add bonus points for completing the level
				score += lastDifficultyIncrease * 120;
				dotsCollected = 0; // Reset dot counter
				increaseDifficulty();
			}
		}

		// Modify the increaseDifficulty function
		function increaseDifficulty() {
			currentEnemySpeed = BASE_ENEMY_SPEED + (ENEMY_SPEED_INCREASE * lastDifficultyIncrease);
			
			// Calculate how many new enemies to add
			const newEnemyCount = BASE_ENEMY_COUNT + (ENEMY_COUNT_INCREASE * lastDifficultyIncrease);
			const targetEnemyCount = Math.min(newEnemyCount, MAX_ENEMIES);
			const enemiesToAdd = targetEnemyCount - enemies.length;
			
			// Add new enemies if needed
			for (let i = 0; i < enemiesToAdd; i++) {
				spawnNewEnemyAwayFromPlayer();
			}
			
			// Update existing enemies speed
			enemies.forEach(enemy => {
				const speed = Math.sqrt(enemy.dx * enemy.dx + enemy.dy * enemy.dy);
				const normalizedDx = enemy.dx / speed;
				const normalizedDy = enemy.dy / speed;
				enemy.dx = normalizedDx * currentEnemySpeed;
				enemy.dy = normalizedDy * currentEnemySpeed;
			});
			
			// Show level message
			showingLevelMessage = true;
			levelMessageTimer = 1500; // 1.5 seconds
		}

		// Add this new function to spawn enemies away from player
		function spawnNewEnemyAwayFromPlayer() {
			const minDistanceFromPlayer = 200; // Minimum distance from player
			let spawnPos;
			let attempts = 0;
			const maxAttempts = 100;

			do {
				spawnPos = terrain.getValidSpawnPosition(enemySize);
				const distanceToPlayer = Math.sqrt(
					Math.pow(spawnPos.x - playerX, 2) + 
					Math.pow(spawnPos.y - playerY, 2)
				);
				if (distanceToPlayer >= minDistanceFromPlayer) {
					break;
				}
				attempts++;
			} while (attempts < maxAttempts);

			enemies.push({
				x: spawnPos.x,
				y: spawnPos.y,
				dx: (Math.random() < 0.5 ? -1 : 1) * currentEnemySpeed,
				dy: (Math.random() < 0.5 ? -1 : 1) * currentEnemySpeed
			});
		}

		// Modify initializeEnemies to use current difficulty settings
		function initializeEnemies() {
			enemies = [];
			for (let i = 0; i < currentEnemyCount; i++) {
				const spawnPos = terrain.getValidSpawnPosition(enemySize);
				enemies.push({
					x: spawnPos.x,
					y: spawnPos.y,
					dx: (Math.random() < 0.5 ? -1 : 1) * currentEnemySpeed,
					dy: (Math.random() < 0.5 ? -1 : 1) * currentEnemySpeed
				});
			}
		}

		// Modify resetGame to reset difficulty and dots collected
		function resetGame() {
			// Regenerate terrain
			terrain.initializeObstacles();
			
			// Reset player position and properties
			playerSize = INITIAL_PLAYER_SIZE; // Reset player size
			playerHealth = MAX_HEALTH; // Reset health
			const playerSpawn = terrain.getValidSpawnPosition(playerSize);
			playerX = playerSpawn.x;
			playerY = playerSpawn.y;
			
			// Reset point position
			const pointSpawn = terrain.getValidSpawnPosition(pointSize);
			pointX = pointSpawn.x;
			pointY = pointSpawn.y;
			
			// Reset game state
			score = 0;
			dotsCollected = 0;
			lastTimeScoreUpdate = performance.now();
			lastDifficultyIncrease = 0;
			currentEnemySpeed = BASE_ENEMY_SPEED;
			currentEnemyCount = BASE_ENEMY_COUNT;
			isPaused = false;
			initializeEnemies();
			resetPlayerVelocity();
		}

        document.addEventListener('keydown', (e) => {
            if (keys.hasOwnProperty(e.key)) {
                keys[e.key] = true;
            }
            if (e.key === 'p' || e.key === 'P') {
                isPaused = !isPaused;
            }
            if (e.key === 'r' || e.key === 'R') {
                resetGame();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (keys.hasOwnProperty(e.key)) {
                keys[e.key] = false;
            }
        });

        function updatePlayerPosition() {
            // Calculate desired direction
            let targetDx = 0;
            let targetDy = 0;

            if (keys.ArrowUp) targetDy -= 1;
            if (keys.ArrowDown) targetDy += 1;
            if (keys.ArrowLeft) targetDx -= 1;
            if (keys.ArrowRight) targetDx += 1;

            // Normalize diagonal input
            if (targetDx !== 0 && targetDy !== 0) {
                const normalizer = 1 / Math.sqrt(2);
                targetDx *= normalizer;
                targetDy *= normalizer;
            }

            // Apply acceleration
            if (targetDx !== 0) {
                playerVelocityX += targetDx * PLAYER_ACCELERATION;
            } else {
                // Apply deceleration when no input
                playerVelocityX *= PLAYER_DECELERATION;
            }

            if (targetDy !== 0) {
                playerVelocityY += targetDy * PLAYER_ACCELERATION;
            } else {
                // Apply deceleration when no input
                playerVelocityY *= PLAYER_DECELERATION;
            }

            // Clamp velocities to max speed
            const currentSpeed = Math.sqrt(playerVelocityX * playerVelocityX + playerVelocityY * playerVelocityY);
            if (currentSpeed > MAX_PLAYER_SPEED) {
                const scale = MAX_PLAYER_SPEED / currentSpeed;
                playerVelocityX *= scale;
                playerVelocityY *= scale;
            }

            // Stop completely if moving very slowly
            if (Math.abs(playerVelocityX) < 0.01) playerVelocityX = 0;
            if (Math.abs(playerVelocityY) < 0.01) playerVelocityY = 0;

            // Try moving on each axis separately
            let newX = playerX + playerVelocityX;
            let newY = playerY + playerVelocityY;

            // Clamp to canvas boundaries
            newX = Math.max(0, Math.min(canvas.width - playerSize, newX));
            newY = Math.max(0, Math.min(canvas.height - playerSize, newY));

            // Check X movement and stop velocity if collision
            if (!terrain.checkCollision(newX, playerY, playerSize, playerSize)) {
                playerX = newX;
            } else {
                playerVelocityX = 0;
            }

            // Check Y movement and stop velocity if collision
            if (!terrain.checkCollision(playerX, newY, playerSize, playerSize)) {
                playerY = newY;
            } else {
                playerVelocityY = 0;
            }
        }

        function updateEnemies() {
            enemies.forEach(enemy => {
                enemy.x += enemy.dx;
                enemy.y += enemy.dy;

                if (enemy.x <= 0 || enemy.x >= canvas.width - enemySize) {
                    enemy.dx *= -1;
                }
                if (enemy.y <= 0 || enemy.y >= canvas.height - enemySize) {
                    enemy.dy *= -1;
                }

                terrain.handleEnemyCollision(enemy);
            });
        }

		// Modify checkCollision to include difficulty update
		function checkCollision() {
			if (playerX < pointX + pointSize &&
				playerX + playerSize > pointX &&
				playerY < pointY + pointSize &&
				playerY + playerSize > pointY) {
				
				// Add points for collecting dot
				score += POINTS_PER_DOT;
				dotsCollected++;
				
				// Increase player size
				playerSize += PLAYER_GROWTH_RATE;
				
				updateDifficulty();
				const pointSpawn = terrain.getValidSpawnPosition(pointSize);
				pointX = pointSpawn.x;
				pointY = pointSpawn.y;
			}

			// Enemy collision check with health system
			enemies.forEach(enemy => {
				const playerCenterX = playerX + playerSize / 2;
				const playerCenterY = playerY + playerSize / 2;
				const enemyCenterX = enemy.x + enemySize / 2;
				const enemyCenterY = enemy.y + enemySize / 2;
				
				const dx = playerCenterX - enemyCenterX;
				const dy = playerCenterY - enemyCenterY;
				const distance = Math.sqrt(dx * dx + dy * dy);
				
				if (distance < (playerSize / 2 + enemySize / 2)) {
					playerHealth--;
					if (playerHealth <= 0) {
						resetGame();
					} else {
						// Respawn the enemy away from the player
						const newSpawn = terrain.getValidSpawnPosition(enemySize);
						enemy.x = newSpawn.x;
						enemy.y = newSpawn.y;
					}
				}
			});
		}

        function drawPlayer() {
            ctx.fillStyle = 'blue';
            ctx.fillRect(playerX, playerY, playerSize, playerSize);
        }

        function drawEnemies() {
            ctx.fillStyle = 'red';  // Changed from green
            enemies.forEach(enemy => {
                ctx.beginPath();
                ctx.arc(
                    enemy.x + enemySize / 2,
                    enemy.y + enemySize / 2,
                    enemySize / 2,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            });
        }

        function drawPoint() {
            ctx.fillStyle = 'green';  // Changed from red
            ctx.fillRect(pointX, pointY, pointSize, pointSize);
        }

		// Modify drawScore to show current level
		function drawScore() {
			ctx.fillStyle = 'black';
			ctx.font = '20px Arial';
			ctx.fillText(`Score: ${score}`, 10, 30);
			ctx.fillText(`Level: ${lastDifficultyIncrease + 1}`, 10, 90);
			ctx.fillText(`Dots: ${dotsCollected}/${DOTS_PER_LEVEL}`, 10, 120);
			ctx.fillText(`Enemies: ${enemies.length}`, 10, 150);
		}

        function drawFPS() {
            ctx.fillStyle = 'black';
            ctx.font = '20px Arial';
            ctx.fillText(`FPS: ${fps}`, 10, 60);
        }

        function drawHealth() {
            const heartSize = 20;
            const heartSpacing = 25;
            const startX = canvas.width - (MAX_HEALTH * heartSpacing);
            const startY = 20;

            ctx.fillStyle = 'red';
            for (let i = 0; i < playerHealth; i++) {
                // Draw a heart shape
                ctx.beginPath();
                const x = startX + (i * heartSpacing);
                const y = startY;
                
                // Draw heart using bezier curves
                ctx.moveTo(x + heartSize/2, y + heartSize/4);
                
                // Left curve
                ctx.bezierCurveTo(
                    x, y, 
                    x, y + heartSize/2, 
                    x + heartSize/2, y + heartSize
                );
                
                // Right curve
                ctx.bezierCurveTo(
                    x + heartSize, y + heartSize/2, 
                    x + heartSize, y, 
                    x + heartSize/2, y + heartSize/4
                );
                
                ctx.fill();
            }
        }

        function clearCanvas() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // Add this near the top with other game properties
        let isPaused = false;

        // Modify the gameLoop function to handle pausing
        function gameLoop(timestamp) {
            // Calculate time since last frame
            const deltaTime = timestamp - lastFrameTime;
            
            // Only update if enough time has passed
            if (deltaTime >= FRAME_TIME) {
                lastFrameTime = timestamp - (deltaTime % FRAME_TIME);
                
                const currentTime = performance.now();
                fps = Math.round(1000 / deltaTime);

                clearCanvas();
                terrain.draw(ctx);
                
                if (!isPaused) {
                    // Add time-based scoring
                    const timeSinceLastScore = currentTime - lastTimeScoreUpdate;
                    if (timeSinceLastScore >= 1000) {
                        score += POINTS_PER_SECOND;
                        lastTimeScoreUpdate = currentTime;
                    }

                    updatePlayerPosition();
                    updateEnemies();
                    checkCollision();
                    
                    if (showingLevelMessage) {
                        levelMessageTimer -= deltaTime;
                        if (levelMessageTimer <= 0) {
                            showingLevelMessage = false;
                        }
                    }
                } else {
                    lastTimeScoreUpdate = currentTime;
                }
                
                drawPlayer();
                drawEnemies();
                drawPoint();
                drawScore();
                drawFPS();
                drawHealth();

                // Draw level message if active
                if (showingLevelMessage) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 48px Arial';
                    const levelText = `Level ${lastDifficultyIncrease + 1}!`;
                    const textMetrics = ctx.measureText(levelText);
                    const textX = (canvas.width - textMetrics.width) / 2;
                    const textY = canvas.height / 2;
                    ctx.fillText(levelText, textX, textY);
                }

                // Draw pause message if game is paused
                if (isPaused) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 48px Arial';
                    const pauseText = 'PAUSED';
                    const textMetrics = ctx.measureText(pauseText);
                    const textX = (canvas.width - textMetrics.width) / 2;
                    const textY = canvas.height / 2;
                    ctx.fillText(pauseText, textX, textY);
                }
            }

            requestAnimationFrame(gameLoop);
        }

        // Start the game
        initializeEnemies();
        gameLoop();

        // Add this function to reset player velocity when game resets
        function resetPlayerVelocity() {
            playerVelocityX = 0;
            playerVelocityY = 0;
        }