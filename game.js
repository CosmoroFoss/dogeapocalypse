        // Terrain class
        class Terrain {
            constructor(canvas) {
                this.canvas = canvas;
                this.obstacles = [];
                this.minObstacles = 4;
                this.maxObstacles = 8;
                this.minSize = 20;
                this.maxSize = 200;
                this.padding = 50; // Minimum space between obstacles
                this.initializeObstacles();
            }

            initializeObstacles() {
                this.obstacles = [];
                const numObstacles = Math.floor(Math.random() * (this.maxObstacles - this.minObstacles + 1)) + this.minObstacles;
                
                let attempts = 0;
                const maxAttempts = 100; // Prevent infinite loops

                while (this.obstacles.length < numObstacles && attempts < maxAttempts) {
                    const width = Math.random() * (this.maxSize - this.minSize) + this.minSize;
                    const height = Math.random() * (this.maxSize - this.minSize) + this.minSize;
                    const x = Math.random() * (this.canvas.width - width);
                    const y = Math.random() * (this.canvas.height - height);

                    const newObstacle = { x, y, width, height };

                    // Check if the new obstacle overlaps with existing ones or is too close
                    if (!this.isOverlapping(newObstacle) && !this.isBlockingCenter(newObstacle)) {
                        this.obstacles.push(newObstacle);
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
                    const nextX = enemy.x + enemy.dx;
                    const nextY = enemy.y + enemy.dy;

                    if (nextX < obstacle.x + obstacle.width &&
                        nextX + enemySize > obstacle.x &&
                        nextY < obstacle.y + obstacle.height &&
                        nextY + enemySize > obstacle.y) {

                        const left = nextX + enemySize - obstacle.x;
                        const right = obstacle.x + obstacle.width - nextX;
                        const top = nextY + enemySize - obstacle.y;
                        const bottom = obstacle.y + obstacle.height - nextY;
                        const min = Math.min(left, right, top, bottom);

                        if (min === left || min === right) {
                            enemy.dx *= -1;
                        }
                        if (min === top || min === bottom) {
                            enemy.dy *= -1;
                        }
                    }
                });
            }

            getValidSpawnPosition(objectSize) {
                let x, y;
                let validPosition = false;

                while (!validPosition) {
                    x = Math.random() * (this.canvas.width - objectSize);
                    y = Math.random() * (this.canvas.height - objectSize);
                    validPosition = !this.checkCollision(x, y, objectSize, objectSize);
                }

                return { x, y };
            }
        }

		// Add these new variables near the top with other game properties
		const DIFFICULTY_INCREASE_INTERVAL = 5; // Every 5 points
		const ENEMY_SPEED_INCREASE = 0.5; // Speed increase per difficulty level
		const ENEMY_COUNT_INCREASE = 1; // How many enemies to add per difficulty level
		const MAX_ENEMIES = 15; // Maximum number of enemies allowed
		const BASE_ENEMY_SPEED = 1; // Starting speed
		const BASE_ENEMY_COUNT = 3; // Starting number of enemies

		// Modify these variables to be calculated based on difficulty
		let currentEnemySpeed = BASE_ENEMY_SPEED;
		let currentEnemyCount = BASE_ENEMY_COUNT;
		let lastDifficultyIncrease = 0;

        // Game code
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        // Player properties
        const playerSize = 30;
        let playerX = canvas.width / 2 - playerSize / 2;
        let playerY = canvas.height / 2 - playerSize / 2;
        const playerSpeed = 2;

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

		// Add this function to calculate difficulty based on score
		function updateDifficulty() {
			const difficultyLevel = Math.floor(score / DIFFICULTY_INCREASE_INTERVAL);
			if (difficultyLevel > lastDifficultyIncrease) {
				lastDifficultyIncrease = difficultyLevel;
				increaseDifficulty();
			}
		}

		// Add this function to handle difficulty increases
		function increaseDifficulty() {
			currentEnemySpeed = BASE_ENEMY_SPEED + (ENEMY_SPEED_INCREASE * lastDifficultyIncrease);
			
			// Calculate new enemy count, but don't exceed maximum
			const newEnemyCount = BASE_ENEMY_COUNT + (ENEMY_COUNT_INCREASE * lastDifficultyIncrease);
			currentEnemyCount = Math.min(newEnemyCount, MAX_ENEMIES);
			
			// Reinitialize enemies with new speed and count
			initializeEnemies();
			
			// Optional: Show difficulty increase message
			showDifficultyMessage();
		}

		// Add this function to show a temporary message when difficulty increases
		function showDifficultyMessage() {
			const message = `Level ${lastDifficultyIncrease + 1}!`;
			ctx.fillStyle = 'red';
			ctx.font = 'bold 40px Arial';
			ctx.fillText(message, canvas.width/2 - 50, canvas.height/2);
			
			// Remove the message after 1 second
			setTimeout(() => {
				clearCanvas();
			}, 1000);
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

		// Modify resetGame to reset difficulty
		function resetGame() {
			const playerSpawn = terrain.getValidSpawnPosition(playerSize);
			playerX = playerSpawn.x;
			playerY = playerSpawn.y;
			
			const pointSpawn = terrain.getValidSpawnPosition(pointSize);
			pointX = pointSpawn.x;
			pointY = pointSpawn.y;
			
			score = 0;
			lastDifficultyIncrease = 0;
			currentEnemySpeed = BASE_ENEMY_SPEED;
			currentEnemyCount = BASE_ENEMY_COUNT;
			initializeEnemies();
}

        document.addEventListener('keydown', (e) => {
            if (keys.hasOwnProperty(e.key)) {
                keys[e.key] = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (keys.hasOwnProperty(e.key)) {
                keys[e.key] = false;
            }
        });

        function updatePlayerPosition() {
            let newX = playerX;
            let newY = playerY;

            if (keys.ArrowUp && playerY > 0) newY -= playerSpeed;
            if (keys.ArrowDown && playerY < canvas.height - playerSize) newY += playerSpeed;
            if (keys.ArrowLeft && playerX > 0) newX -= playerSpeed;
            if (keys.ArrowRight && playerX < canvas.width - playerSize) newX += playerSpeed;

            if (!terrain.checkCollision(newX, newY, playerSize, playerSize)) {
                playerX = newX;
                playerY = newY;
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
				score++;
				updateDifficulty(); // Add this line
				const pointSpawn = terrain.getValidSpawnPosition(pointSize);
				pointX = pointSpawn.x;
				pointY = pointSpawn.y;
			}

			enemies.forEach(enemy => {
				if (playerX < enemy.x + enemySize &&
					playerX + playerSize > enemy.x &&
					playerY < enemy.y + enemySize &&
					playerY + playerSize > enemy.y) {
					resetGame();
				}
			});
		}

        function drawPlayer() {
            ctx.fillStyle = 'blue';
            ctx.fillRect(playerX, playerY, playerSize, playerSize);
        }

        function drawEnemies() {
            ctx.fillStyle = 'green';
            enemies.forEach(enemy => {
                ctx.fillRect(enemy.x, enemy.y, enemySize, enemySize);
            });
        }

        function drawPoint() {
            ctx.fillStyle = 'red';
            ctx.fillRect(pointX, pointY, pointSize, pointSize);
        }

		// Modify drawScore to show current level
		function drawScore() {
			ctx.fillStyle = 'black';
			ctx.font = '20px Arial';
			ctx.fillText(`Score: ${score}`, 10, 30);
			ctx.fillText(`Level: ${lastDifficultyIncrease + 1}`, 10, 90);
			ctx.fillText(`Enemies: ${currentEnemyCount}`, 10, 120);
		}

        function drawFPS() {
            ctx.fillStyle = 'black';
            ctx.font = '20px Arial';
            ctx.fillText(`FPS: ${fps}`, 10, 60);
        }

        function clearCanvas() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        function gameLoop() {
            const currentTime = performance.now();
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            fps = Math.round(1000 / deltaTime);

            clearCanvas();
            terrain.draw(ctx);
            updatePlayerPosition();
            updateEnemies();
            checkCollision();
            drawPlayer();
            drawEnemies();
            drawPoint();
            drawScore();
            drawFPS();

            requestAnimationFrame(gameLoop);
        }

        // Start the game
        initializeEnemies();
        gameLoop();