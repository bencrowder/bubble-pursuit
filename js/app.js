// Bubble Pursuit
// --------------------------------------------------

var server;

$(document).ready(function() {
	server = new Server();	

    // Initialization
	server.player = new Player();
	server.world = new World();
	server.display = new Display();

	// Setup
	server.display.init();
	server.world.generate();
	server.player.init();

    // Watch statistics (fps counter)
    server.stats = new Stats();
    server.stats.showPanel(0);
    document.body.appendChild(server.stats.dom);

	// Keyboard stuff
	$(document).keydown(function(e) {
		server.keys[e.which] = true;

        // Override browser scrolling
        if (e.which == key_UP || e.which == key_DOWN) {
            return false;
        }
	});

	$(document).keyup(function(e) {
        server.player.keyUp(e);
	});

	// Start the game
	server.animate();
});
