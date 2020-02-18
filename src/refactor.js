import * as PIXI from 'pixi.js';

Number.prototype.mod = function(n) {
  return ((this%n)+n)%n;
};

class Boids {
  constructor(boidCount=1000, boidScale=0.5, visualRadius=30, gridSize=100, velocity=3) {
    this.app = new PIXI.Application();

    this.boidCount = boidCount;
    this.boidScale = boidScale;
    this.visualRadius = visualRadius**2;
    this.visRadius = visualRadius;
    this.gridSize = gridSize;
    this.velocity = velocity;

    this.app.renderer.view.style.position = "absolute";
    this.app.renderer.view.style.display = "block";
    this.app.renderer.autoResize = true;
    this.app.renderer.resize(window.innerWidth, window.innerHeight);

    this.positionalGrid = this.createPositionalGrid();

    this.boidTexture = this.createTriangleTexture();
    this.boids = [...new Array(boidCount)].map(() => this.createBoid());
    this.boids[0].tint = 0xff0000;

    this.app.ticker.add(() => this.tick());
  }

  createTriangleTexture() {
    const texture = new PIXI.Graphics();

    texture.beginFill(0xffffff);
    texture.drawPolygon([0,0,10,30,20,0,10,5]);
    texture.endFill();

    return this.app.renderer.generateTexture(texture);
  }

  createBoid() {
    const boid = new PIXI.Sprite(this.boidTexture);

    boid.x = Math.random() * window.innerWidth;
    boid.y = Math.random() * window.innerHeight;
    boid.anchor.set(0.5);
    boid.rotation = Math.random() * 2;
    boid.scale.set(this.boidScale);

    boid.positionalGrid = this.getPositionalGrid(boid.x, boid.y);
    boid.positionalGrid.add(boid);

    this.app.stage.addChild(boid);

    return boid;
  }

  createPositionalGrid() {
    const width = Math.ceil(window.innerWidth / this.gridSize);
    const height = Math.ceil(window.innerHeight / this.gridSize);

    return [...new Array(width)].map(() => [...new Array(height)].map(() => new Set()));
  }

  getPositionalGrid(x, y) {
    const gridX = Math.floor(x / this.gridSize);
    const gridY = Math.floor(y / this.gridSize);

    return this.positionalGrid[gridX][gridY];
  }

  updateBoidPositionalGrid(boid) {
    const newPositionalGrid = this.getPositionalGrid(boid.x, boid.y);

    if (newPositionalGrid != boid.positionalGrid) {
      boid.positionalGrid.delete(boid);
      newPositionalGrid.add(boid);
      boid.positionalGrid = newPositionalGrid;
    }
  }

  getSearchGrids(boid) {
    const width = Math.ceil(window.innerWidth / this.gridSize);
    const height = Math.ceil(window.innerHeight / this.gridSize);

    const minX = Math.floor((boid.x - this.visRadius)/this.gridSize);
    const minY = Math.floor((boid.y - this.visRadius)/this.gridSize);
    const maxX = Math.floor((boid.x + this.visRadius)/this.gridSize);
    const maxY = Math.floor((boid.y + this.visRadius)/this.gridSize);

    const grids = [];
    let x, y;

    for (x=minX; x <= maxX; x++) {
      for (y=minY; y <= maxY; y++) {
        grids.push(this.positionalGrid[x.mod(width)][y.mod(height)]);
      }
    }

    return grids;
  }

  distance(boidA, boidB) {
    const dx = Math.abs(boidA.x - boidB.x);
    const dy = Math.abs(boidA.y - boidB.y);

    return Math.min(dx, window.innerWidth - dx)**2 + Math.min(dy, window.innerHeight - dy)**2;
  }

  tick() {
    this.boids.forEach((boid, i) => {
      boid.x = (boid.x - Math.sin(boid.rotation) * this.velocity).mod(window.innerWidth);
      boid.y = (boid.y + Math.cos(boid.rotation) * this.velocity).mod(window.innerHeight);

      this.updateBoidPositionalGrid(boid);

      const boidsInRange = this.getSearchGrids(boid).reduce((prev, cur) => {
        return prev.concat([...cur].filter((target) => (this.distance(boid, target) < this.visualRadius && target != boid)));
      }, []);

      const align = boidsInRange.reduce((prev, cur) => {
        return prev += cur.rotation 
      }, boid.rotation) / (boidsInRange.length + 1);

      if(align > boid.rotation) {
        boid.rotation += 0.01;
      } else if (align < boid.rotation) {
        boid.rotation -= 0.01;
      }
    });
  }
}


export default Boids;
