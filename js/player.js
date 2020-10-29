// Bubble Pursuit
// --------------------------------------------------

const key_SPACE = 32;

const key_LEFT = 37;
const key_UP = 38;
const key_RIGHT = 39;
const key_DOWN = 40;

const key_W = 87;
const key_A = 65;
const key_S = 83;
const key_D = 68;

var Player = function() {
    this.init = function() {
        this.x = server.settings.player.initialX;
        this.y = server.settings.player.initialY;
        this.z = server.settings.player.initialZ;
        this.newX = this.x;
        this.newY = this.y;
        this.angle = server.settings.player.initialAngle;
        this.hoverStep = server.settings.player.hoverStep;
        this.step = server.settings.player.step;
        this.health = server.settings.player.maxHealth;
        this.speed = 0.05;
        this.maxSpeed = server.settings.player.maxSpeed;
        this.numBubbles = 0;
        this.bubbles = [];
        this.UP = 0;
        this.RIGHT = 1;
        this.DOWN = 2;
        this.LEFT = 3;
        this.directions = [];
        this.dir = this.UP;
        this.moving = false;
        this.falling = false;
        this.brokenTile = null;
    };

    this.checkTile = function(nx, ny) {
        tile = server.world.getTile(nx, ny);

        // If it's not a wall, move to it
        if (tile != 3 && !this.falling) {
            this.newX = nx;
            this.newY = ny;

            if (this.brokenTile) {
                // Set the most recent broken tile to fall
                server.brokenTiles[server.brokenTiles.length - 1].falling = true;

                this.brokenTile = null;
            }
        }

        // Hole
        if (tile == 2) {
            this.falling = true;
        }

        // Broken tile
        if (tile == 6 || tile == 7) {
            this.brokenTile = [nx, ny];
        }

        // Bubble 
        if (tile == 5 || tile == 7) {
            let index = this.getBubble(nx, ny);
            this.bubbles.push(index);

            let bubble = server.bubbles[index];
            bubble.active = false;

            // Change back to normal floor
            if (tile == 5) {
                server.world.setTile(bubble.x, bubble.y, 1);
            } else if (tile == 7) {
                server.world.setTile(bubble.x, bubble.y, 6);
            }

            this.numBubbles += 1;
            $("#game-stats .bubbles").html(this.numBubbles);
        }
    };

    this.getBubble = function(x, y) {
        // Gets the bubble index at x, y
        for (let i in server.bubbles) {
            let bubble = server.bubbles[i];

            if (bubble.x == x && bubble.y == y && bubble.active) {
                return i;
            }
        }

        return -1;
    };

    this.doneWithBubble = function(index) {
        // Player no longer has a bubble
        this.bubbles.splice(index, 1);

        // Check win condition
        if (this.numBubbles == server.bubbles.length) {
            server.win = true;
        }
    }

    this.moveInDir = function(direction) {
        if (!this.moving) {
            // Figure out target X/Y
            switch(direction) {
                case this.UP:
                    testY = this.y + 1;
                    this.checkTile(this.x, testY);
                    break;
                case this.RIGHT:
                    testX = this.x + 1;
                    this.checkTile(testX, this.y);
                    break;
                case this.DOWN:
                    testY = this.y - 1;
                    this.checkTile(this.x, testY);
                    break;
                case this.LEFT:
                    testX = this.x - 1;
                    this.checkTile(testX, this.y);
                    break;
            }

            this.moving = true;
            this.speed = 1/19; // 19 steps per cycle
            this.dir = direction;
        }

        if (!this.directions.includes(direction)) {
            this.directions.push(direction);
        }
    };

    this.checkBrokenTile = function() {
        if (this.brokenTile) {
            let x = this.brokenTile[0];
            let y = this.brokenTile[1];

            // Change to a hole (2)
            server.world.setTile(x, y, 2);

            // Add to array of broken tiles for moving
            let tile = server.world.getTileObj(x, y);
            server.brokenTiles.push(tile);
        }
    }

    this.move = function() {
        // Move the player
        if (this.moving) {
            // Actually move the player
            switch (this.dir) {
                case this.UP:
                    this.y += this.speed;
                    // Have we moved a full tile yet?
                    if (this.y >= this.newY) {
                        this.moving = false;
                        this.obj.rotation.set(0, 0, 0);
                        this.y = this.newY;

                        this.checkBrokenTile();
            tile.falling = true;
                    }
                    break;
                case this.DOWN:
                    this.y -= this.speed;
                    // Have we moved a full tile yet?
                    if (this.y <= this.newY) {
                        this.moving = false;
                        this.obj.rotation.set(0, 0, 0);
                        this.y = this.newY;

                        this.checkBrokenTile();
                    }
                    break;
                case this.LEFT:
                    this.x -= this.speed;
                    // Have we moved a full tile yet?
                    if (this.x <= this.newX) {
                        this.moving = false;
                        this.obj.rotation.set(0, 0, 0);
                        this.x = this.newX;

                        this.checkBrokenTile();
                    }
                    break;
                case this.RIGHT:
                    this.x += this.speed;
                    // Have we moved a full tile yet?
                    if (this.x >= this.newX) {
                        this.moving = false;
                        this.obj.rotation.set(0, 0, 0);
                        this.x = this.newX;

                        this.checkBrokenTile();
                    }
                    break;
            }
        }

        if (this.falling && !this.moving) {
            this.z -= 0.1;

            if (this.z < -20) {
                server.gameOver = true;
            }
        }
    };

    this.keypressed = function() {
        if (server.keys[key_LEFT] || server.keys[key_A]) {
            this.moveInDir(this.LEFT);
        }

        if (server.keys[key_RIGHT] || server.keys[key_D]) {
            this.moveInDir(this.RIGHT);
        }

        if (server.keys[key_UP] || server.keys[key_W]) {
            this.moveInDir(this.UP);
        }

        if (server.keys[key_DOWN] || server.keys[key_S]) {
            this.moveInDir(this.DOWN);
        }
    };

    this.keyUp = function(e) {
        delete server.keys[e.which];

        // Remove from directions if there
        mappedKey = this.mapKey(e.which);
        if (server.player.directions.includes(mappedKey)) {
            server.player.directions = server.player.directions.filter(e => e != mappedKey);
        }
    };

    this.mapKey = function(key) {
        switch (key) {
            case key_LEFT: return this.LEFT;
            case key_RIGHT: return this.RIGHT;
            case key_UP: return this.UP;
            case key_DOWN: return this.DOWN;
        }
    };

};
