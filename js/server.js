// Bubble Pursuit
// --------------------------------------------------

// Global variables

var Server = function() {
    this.seconds = 1;            // timer
    this.debug = false;
    this.paused = false;
    this.gameOver = false;
    this.win = false;

    this.canvas;                // HTML canvas
    this.c;                        // Context

    this.renderer;                // THREE.js
    this.camera;
    this.scene;

    this.player;
    this.obstacles;
    this.world;
    this.utils;

    this.brokenTiles = [];

    this.settings = {
        'player': {
            'initialX': 20,
            'initialY': 20,
            'initialZ': 1.1,
            'rotStep': 0.01,
        },
        'screen': {
            'width': 900,
            'height': 600,
            'fov': 50,
            'aspect': 900 / 600,
            'near': 0.1,
            'far': 150,
        },
        'camera': {
            'initialZ': 11,
        },
        'map': {
            'width': 50,
            'height': 50,
        },
    };

    this.keys = {};

    this.animate = function() {
        server.stats.begin();

        if (!server.paused && !server.gameOver && !server.win) {
            // Draw
            server.display.render();

            // Process keys
            server.player.keypressed();

            // Move player
            server.player.move();
        }

        // Game over
        if (server.gameOver) {
            server.display.gameOver();
            clearInterval(server.interval);
        }

        // Win
        if (server.win) {
            server.display.win();
            clearInterval(server.interval);
        }

        server.stats.end();

        if (!server.gameOver && !server.win) {
            requestAnimationFrame(server.animate);
        }
    };

    this.tick = function() {
        server.seconds += 1;
        $(".timer").html(server.seconds + " seconds");
    };
};
