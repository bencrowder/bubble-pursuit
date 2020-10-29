// Bubble Pursuit
// --------------------------------------------------

var World = function() {
    // Load Tiled map
    this.generate = function() {
        this.map = TileMaps['level1'];
        this.createMap();

        $("#game-stats .total-bubbles").html(server.bubbles.length);
    };

    this.getTile = function(x, y) {
        return this.map.layers[0].data[y * this.map.width + x];
    };

    this.getTileObj = function(x, y) {
        let key = x + ',' + y;
        return this.tileObjects[key];
    }

    this.setTile = function(x, y, tile) {
        this.map.layers[0].data[y * this.map.width + x] = tile;
    };

    this.collides = function(x, y) {
        let tile = this.getTile(x, y);

        // 3 = wall
        if (tile == 3) {
            return true;
        }

        return false;
    };

    this.createMap = function() {
        const map = this.map;

        server.settings.map.width = map.width;
        server.settings.map.height = map.height;
        server.bubbles = [];
        server.bubbleDir = 0.01;

        // Used to get floor tile objects for broken tiles
        this.tileObjects = {};

        // Textures
        const bumpmap = new THREE.TextureLoader().load('art/bumpmap.png');
        const floorTex = new THREE.TextureLoader().load('art/floor.png');
        const floorTex2 = new THREE.TextureLoader().load('art/floor2.png');
        const floorBrokenBumpmap = new THREE.TextureLoader().load('art/floor-bumpmap.png');
        const wallTex = new THREE.TextureLoader().load('art/wall.png');
        const shadowTex = new THREE.TextureLoader().load('art/shadow.png');

        // Geometry
        const floorGeom = new THREE.BoxBufferGeometry(1, 1, 1);
        const wallGeom = new THREE.BoxBufferGeometry(1, 1, 1);
        const bubbleGeom = new THREE.SphereGeometry(0.2, 32, 32);

        // Materials
        const floorMat = new THREE.MeshPhysicalMaterial({
            map: floorTex,
            bumpMap: bumpmap,
            bumpScale: 0.002,
            reflectivity: 0,
            roughness: 0.5,
        });

        const floorMat2 = new THREE.MeshPhysicalMaterial({
            map: floorTex2,
            bumpMap: bumpmap,
            bumpScale: 0.0025,
            reflectivity: 0,
            roughness: 0.5,
        });

        const floorBrokenMat = new THREE.MeshPhysicalMaterial({
            map: floorTex,
            bumpMap: floorBrokenBumpmap,
            bumpScale: 0.02,
            reflectivity: 0,
            roughness: 0.5,
        });

        const wallMat = new THREE.MeshPhongMaterial({
            map: wallTex,
            bumpMap: bumpmap,
            bumpScale: 0.01,
        });

        const bubbleMat = new THREE.MeshPhysicalMaterial({
            color: 0x777777,
            emissive: 0x226699,
        });

        const planeSize = 0.6;
        const shadowGeo = new THREE.PlaneBufferGeometry(planeSize, planeSize);
        const shadowMat = new THREE.MeshBasicMaterial({
            map: shadowTex,
            transparent: true,
            depthWrite: false,
        });

        let floorI = 0;
        let wallI = 0;
        let bubbleI = 0;
        let obj;

        let floorList = [];

        for (let i=0; i<map.width; i++) {
            for (let j=0; j<map.height; j++) {
                let tile = this.getTile(i, j);

                // Floor = 1
                // Hole = 2
                // Wall = 3
                // Arch = 4 (deprecated)
                // Bubble = 5
                // Broken floor = 6

                if (tile == 1 || tile == 6) {
                    // Make sure we're not on the player's location
                    if (i != server.settings.player.initialX || j != server.settings.player.initialY) {
                        floorList.push([i, j]);
                    }
                }

                // Floors (by default), 2 = hole
                if (tile != 2) {
                    let mat = floorMat;
                    if (Math.random() < 0.5) {
                        mat = floorMat2;
                    }
                    if (tile == 6) {
                        // Broken floor
                        mat = floorBrokenMat;
                    }
                    obj = new THREE.Mesh(floorGeom, mat, floorI);
                    floorI += 1;
                    obj.position.x = i;
                    obj.position.y = j;
                    server.scene.add(obj);

                    let key = i + ',' + j;
                    this.tileObjects[key] = obj;
                }

                // Wall
                if (tile == 3) {
                    obj = new THREE.Mesh(wallGeom, wallMat, wallI);
                    wallI += 1;
                    obj.position.x = i;
                    obj.position.y = j;
                    obj.position.z = 1;
                    server.scene.add(obj);
                }
            }
        }

        // Add bubbles to map
        for (let i=0; i<20; i++) {
            // Find a random tile to put the bubble on
            index = Math.getRandomInt(0, floorList.length-1);
            let loc = floorList[index];
            let x = loc[0];
            let y = loc[1];
            let tile = this.getTile(x, y);

            // Remove from index so we don't duplicate
            floorList.splice(index, 1);
            if (floorList.length == 0) {
                // If we don't have any floor tiles left, bail
                break;
            }

            // Change it to a bubble
            if (tile == 1) {
                this.setTile(x, y, 5);
            } else if (tile == 6) {
                // 7 = bubble on broken tile
                this.setTile(x, y, 7);
            }

            obj = new THREE.Mesh(bubbleGeom, bubbleMat, bubbleI);
            obj.position.x = x;
            obj.position.y = y;
            obj.position.z = 1.3;
            server.scene.add(obj);

            var light = new THREE.PointLight(0x0099ff, 1, 1.2);
            light.position.set(x, y, 1.3);
            server.scene.add(light);

            server.bubbles.push({
                obj: obj,
                light: light,
                x: x,
                y: y,
                active: true,
            });
        }
    };
};

Math.getRandomInt = function(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
