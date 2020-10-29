// Spin
// --------------------------------------------------

var Display = function() {
    this.player;
    this.obstacles = [];
    this.light;
    this.spotlight;

    this.init = function() {
        // Resize page
        $("#page").width(server.settings.screen.width);

        server.scene = new THREE.Scene();

        server.camera = new THREE.PerspectiveCamera(
            server.settings.screen.fov,
            server.settings.screen.aspect,
            server.settings.screen.near,
            server.settings.screen.far,
        );
        server.camera.up = new THREE.Vector3(0, 1, 0);
        server.camera.position.set(
            server.settings.player.initialX,
            server.settings.player.initialY,
            server.settings.camera.initialZ,
        );
        server.camera.lookAt(
            server.settings.player.initialX,
            server.settings.player.initialY,
            0,
        );
        server.camera.flux = 0.02;

        server.renderer = new THREE.WebGLRenderer({ antialias: true });
        server.renderer.setSize(server.settings.screen.width, server.settings.screen.height);
        server.renderer.setClearColor(new THREE.Color(0x000000));
        server.renderer.shadowMap.enabled = true;
        server.renderer.shadowMap.soft = true;

        $("#container").append(server.renderer.domElement);
        setTimeout(function() {
            $("#container img#intro").fadeOut(2500);

            $("#game-stats").fadeIn(2500, function() {
                // Start timer going
                server.interval = setInterval(server.tick, 1000);
            });
        }, 1);

        server.canvas = $("#container canvas")[0];
        server.c = server.canvas.getContext("2d");

        this.initFloor();
        this.initLights();
        this.initPlayer();
    };

    this.initFloor = function() {
        const numSquares = 64;
        const planeGeom = new THREE.PlaneGeometry(200, 200, numSquares, numSquares);
        let materials = []; 

        materials.push(new THREE.MeshBasicMaterial({ color: 0x0a2602, side: THREE.DoubleSide }));
        materials.push(new THREE.MeshBasicMaterial({ color: 0x0a2002, side: THREE.DoubleSide }));

        const l = planeGeom.faces.length / 2;

        for (let i=0; i<l; i++) {
            j = i * 2;
            planeGeom.faces[j].materialIndex = ((i + Math.floor(i/numSquares)) % 2);
            planeGeom.faces[j+1].materialIndex = ((i + Math.floor(i/numSquares)) % 2);
        }

        floor = new THREE.Mesh(planeGeom, materials);
        server.scene.add(floor);
        floor.position.z = -40;
    };

    // Set up player
    this.initPlayer = function() {
        let t = this;

        // Convert 45 degrees to radians, 19 steps per move
        server.player.rotStep = 45 * Math.PI / 180 / (19/2);

        // Create player object
        const playerSize = 0.8;
        const playerMat = new THREE.MeshPhysicalMaterial({
            color: 0x994444,
            reflectivity: 0.9,
            roughness: 0.8,
        });
        const playerGeom = new THREE.BoxBufferGeometry(playerSize, playerSize, playerSize);
        t.player = new THREE.Mesh(playerGeom, playerMat);
        t.player.position.set(server.player.x, server.player.y, server.player.z);

        server.scene.add(t.player);
        server.player.obj = t.player;

        // Player shadow
        const planeSize = 1.6;
        const shadowTex = new THREE.TextureLoader().load('art/shadow.png');
        const shadowGeo = new THREE.PlaneBufferGeometry(planeSize, planeSize);
        const shadowMat = new THREE.MeshBasicMaterial({
            map: shadowTex,
            transparent: true,
            opacity: 0.79,
            depthWrite: false,
        });
        t.playerShadow = new THREE.Mesh(shadowGeo, shadowMat);
        t.playerShadow.position.set(server.player.x, server.player.y, 0.52);
        server.scene.add(t.playerShadow);
    };

    // Set up lights
    this.initLights = function() {
        this.hemiLight = new THREE.HemisphereLight(0x000033, 0xffeecc, 0.4);
        server.scene.add(this.hemiLight);

        this.ambLight = new THREE.AmbientLight(0xeeeeff, 0.2);
        server.scene.add(this.ambLight);

        this.dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
        this.dirLight.position.set(-5, -5, 5);
        server.scene.add(this.dirLight);
    };

    this.render = function() {
        if (!server.paused) {
            const x = server.player.x;
            const y = server.player.y;
            const z = server.player.z;

            // Update player avatar location
            if (this.player) {
                this.player.position.x = x;
                this.player.position.y = y;
                this.player.position.z = z;

                if (server.player.moving) {
                    switch (server.player.dir) {
                        case server.player.UP:
                            this.player.rotation.x -= server.player.rotStep;
                            break;
                        case server.player.RIGHT:
                            this.player.rotation.y += server.player.rotStep;
                            break;
                        case server.player.DOWN:
                            this.player.rotation.x += server.player.rotStep;
                            break;
                        case server.player.LEFT:
                            this.player.rotation.y -= server.player.rotStep;
                            break;
                    }
                }
            }

            // And the player's shadow
            if (this.playerShadow) {
                this.playerShadow.position.x = x;
                this.playerShadow.position.y = y - 0.1;
                this.playerShadow.position.z = z - 0.55;
            }

            // Move the camera to follow the player
            server.camera.position.x = x;
            server.camera.position.y = y - 4;
            server.camera.position.z = z + 6;
            lookAtX = x;
            lookAtY = y;
            server.camera.lookAt(new THREE.Vector3(lookAtX, lookAtY, 1));
            server.camera.up = new THREE.Vector3(0, 0, 1);

            // Bubble breathing
            let s = server.bubbles[0].obj.scale.x;
            let newScale = s + server.bubbleDir;
            for (var i in server.bubbles) {
                let bubble = server.bubbles[i];

                bubble.obj.scale.set(newScale, newScale, newScale);
                bubble.light.distance = newScale * 0.3 + 0.7;
            }

            if (newScale < 0.8 || newScale > 1.5) {
                server.bubbleDir *= -1;
            }

            // Got a bubble
            for (let i in server.player.bubbles) {
                let index = server.player.bubbles[i];
                let bubble = server.bubbles[index];

                bubble.obj.position.z *= 1.05;
                bubble.light.position.z *= 1.05;

                // Hide the bubble
                if (bubble.obj.position.z > 20) {
                    bubble.obj.visible = false;

                    // Player no longer has a bubble
                    server.player.doneWithBubble(i);
                }
            }

            // Broken tile movement
            for (let i in server.brokenTiles) {
                let tile = server.brokenTiles[i];
                if (tile.falling) {
                    tile.position.z -= 0.2;
                    if (tile.position.z < -41) {
                        tile.visible = false;
                        tile.falling = false;
                    }
                }
            }

            // Render the scene
            server.renderer.render(server.scene, server.camera);
        }
    };

    this.gameOver = function() {
        $("body").prepend("<h1 id='gamescreen'>GAME OVER</h1><div id='gameoverscreen' class='gamescreen'></div>");
    };

    this.win = function() {
        $("body").prepend("<h1 id='gamescreen'>YOU WON!</h1><div id='winscreen' class='gamescreen'></div>");
    };
};
