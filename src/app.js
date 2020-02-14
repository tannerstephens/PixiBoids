import * as PIXI from 'pixi.js';

Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
};

Set.prototype.union = function(setB) {
    for (let elem of setB) {
        this.add(elem);
    }
};

const app = new PIXI.Application();

const vel = 3;
const numTris = 100;
const scale = 0.5;
const gridSize = 100;
const awareRadius = 200;
const gridWidth = Math.ceil(window.innerWidth/gridSize);
const gridHeight = Math.ceil(window.innerHeight/gridSize);

app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoResize = true;
app.renderer.resize(window.innerWidth, window.innerHeight);

const main = () => {
    const createTriangle = () => {
        const tri = new PIXI.Graphics();

        tri.beginFill(0xffffff);
        tri.lineStyle(0, 0xffffff);
        tri.drawPolygon([0,0,10,30,20,0,10,5]);
        tri.endFill();

        return new PIXI.Sprite(app.renderer.generateTexture(tri));
    }

    const getGridCoords = (tri) => {
        return {
            x: Math.floor(tri.x/gridSize),
            y: Math.floor(tri.y/gridSize)
        };
    };

    const getGrid = (coords) => {
        return grid[coords.x][coords.y];
    };

    const awareGrids = (tri) => {
        const delta = [-awareRadius, 0, awareRadius];

        let result = new Set();

        const seen = [];

        delta.forEach((dx) => {
            delta.forEach((dy) => {
                const coords = getGridCoords({
                    x: Math.floor((tri.x + dx)).mod(window.innerWidth),
                    y: Math.floor((tri.y + dy)).mod(window.innerHeight)
                });

                if(!seen.includes(coords)) {
                    seen.push(coords);
                    result.union(getGrid(coords));
                }
            });
        });

        return Array.from(result);        
    }

    const grid = Array(gridWidth).fill(null).map(() => Array(gridHeight).fill(null).map(() => new Set()));

    const tris = Array(numTris).fill(null).map(() => createTriangle());


    tris.forEach((tri, i) => {
        if (i == 0) {
            tri.tint += 0xff0000
        }
        tri.x = Math.random() * window.innerWidth;
        tri.y = Math.random() * window.innerHeight;
        tri.anchor.set(0.5);
        tri.rotation = Math.random() * 2;
        tri.scale.set(scale);
        app.stage.addChild(tri);

        const coords = getGridCoords(tri);

        grid[coords.x][coords.y].add(tri);
    });

    const dist = (t1, t2) => {
        const dx = Math.min(Math.abs(t2.x - t1.x), Math.abs(window.innerWidth - t2.x - t1.x));
        const dy = Math.min(Math.abs(t2.y - t1.y), Math.abs(window.innerHeight - t2.y - t1.y));

        return dx**2 + dy**2;
    };

    app.ticker.add(() => {
        tris.forEach((tri, i) => {
            const oldCoords = getGridCoords(tri);

            const nearBoids = awareGrids(tri).filter((t2) => dist(tri, t2) < awareRadius);


            const align = nearBoids.reduce((prev, cur) => {
                return prev += cur.rotation 
            }, 0) / nearBoids.length;

            if(align > tri.rotation) {
                tri.rotation += 0.03;
            } else if (align < tri.rotation) {
                tri.rotation -= 0.03;
            }

            const center = 0;

            const newX = tri.x - vel*Math.sin(tri.rotation);
            const newY = tri.y += vel*Math.cos(tri.rotation);

            tri.x = newX;
            tri.y = newY;

            if (tri.x < 0) {
                tri.x = window.innerWidth - Math.abs(tri.x).mod(window.innerWidth);
            } else if (tri.x > window.innerWidth) {
                tri.x = tri.x.mod(window.innerWidth);
            }

            if (tri.y < 0) {
                tri.y = window.innerHeight - Math.abs(tri.y).mod(window.innerHeight);
            } else if (tri.y > window.innerHeight) {
                tri.y = tri.y.mod(window.innerHeight);
            }

            const coords = getGridCoords(tri);

            if (oldCoords != coords) {
                getGrid(oldCoords).delete(tri);
                getGrid(coords).add(tri);
            }
        });
    });
};

export {
    app,
    main
};
