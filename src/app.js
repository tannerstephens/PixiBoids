import * as PIXI from 'pixi.js';
import * as Victor from 'victor';

Number.prototype.mod = function(n) {
  return ((this%n)+n)%n;
};

function hslToRgb(h, s, l){
  var r, g, b;

  if(s == 0){
      r = g = b = l; // achromatic
  }else{
      var hue2rgb = function hue2rgb(p, q, t){
          if(t < 0) t += 1;
          if(t > 1) t -= 1;
          if(t < 1/6) return p + (q - p) * 6 * t;
          if(t < 1/2) return q;
          if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
      }

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

class Boids {
  constructor({
    boidCount=500,
    boidScale=0.4,
    visualRadius=30,
    gridSize=30,
    velocity=2,
    alignmentPower=1/10,
    avoidancePower=1/32,
    attractionPower=1/50,
    randomPower=1/100
  } = {}) {
    this.app = new PIXI.Application();

    this.boidCount = boidCount;
    this.boidScale = boidScale;
    this.visualRadius = visualRadius**2;
    this.visRadius = visualRadius;
    this.gridSize = gridSize;
    this.velocity = velocity;
    this.alignmentPower = new Victor(alignmentPower, alignmentPower);
    this.avoidancePower = new Victor(avoidancePower, avoidancePower);
    this.attractionPower = new Victor(attractionPower, attractionPower);
    this.randomPower = new Victor(randomPower, randomPower);

    this.app.renderer.view.style.position = "absolute";
    this.app.renderer.view.style.display = "block";
    this.app.renderer.autoResize = true;
    this.app.renderer.resize(window.innerWidth, window.innerHeight);

    this.positionalGrid = this.createPositionalGrid();

    this.boidTexture = this.createTriangleTexture();
    this.boids = [...new Array(boidCount)].map(() => this.createBoid());

    this.app.ticker.add(() => this.tick());
  }

  createTriangleTexture() {
    const texture = new PIXI.Graphics();

    texture.beginFill(0xffffff);
    texture.drawPolygon([0,0,30,10,0,20,5,10]);
    texture.endFill();

    return this.app.renderer.generateTexture(texture);
  }

  createBoid() {
    const boid = new PIXI.Sprite(this.boidTexture);

    boid.x = Math.random() * window.innerWidth;
    boid.y = Math.random() * window.innerHeight;

    boid.velocity = new Victor(Math.random()*2 - 1, Math.random()*2 - 1);

    boid.anchor.set(0.5);
    boid.scale.set(this.boidScale);

    boid.positionalGrid = this.getPositionalGrid(boid.x, boid.y);
    boid.positionalGrid.add(boid);

    const color = hslToRgb(Math.random(), 1, 0.8);

    boid.tint = (color[0] << 16) + (color[1] << 8) + color[2];

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

  updateBoid(boid) {
    boid.rotation = boid.velocity.angle();
    boid.x = (boid.x + boid.velocity.x*this.velocity).mod(innerWidth);
    boid.y = (boid.y + boid.velocity.y*this.velocity).mod(innerHeight);
  }

  displacementVector(a, b) {
    const dx = [b.x - innerWidth, b.x, b.x + innerWidth].reduce((prev, cur) => {
      if (Math.abs(cur - a.x) < Math.abs(prev))
        return cur - a.x;
      else
        return prev;
    }, Infinity);

    const dy = [b.y - innerHeight, b.y, b.y + innerHeight].reduce((prev, cur) => {
      if (Math.abs(cur - a.y) < Math.abs(prev))
        return cur - a.y;
      else
        return prev;
    }, Infinity);

    return Victor(dx, dy);
  }

  adjustedPos(a, b) {
    const x = [b.x - innerWidth, b.x, b.x + innerWidth].reduce((prev, cur) => {
      if (Math.abs(cur - a.x) < Math.abs(prev))
        return cur;
      else
        return prev;
    }, Infinity);

    const y = [b.y - innerHeight, b.y, b.y + innerHeight].reduce((prev, cur) => {
      if (Math.abs(cur - a.y) < Math.abs(prev))
        return cur;
      else
        return prev;
    }, Infinity);

    return Victor(x, y);
  }

  tick() {
    this.boids.forEach((boid, i) => {
      this.updateBoid(boid);

      this.updateBoidPositionalGrid(boid);

      const boidsInRange = this.getSearchGrids(boid).reduce((prev, cur) => {
        return prev.concat([...cur].filter((target) => (this.distance(boid, target) < this.visualRadius && target != boid)));
      }, []);


      if (boidsInRange.length) {

        const velocityVector = boidsInRange.reduce((prev, cur) => prev.add(cur.velocity), Victor(0, 0)).norm().subtract(boid.velocity).multiply(this.alignmentPower);
        const avoidanceVector = boidsInRange.reduce((prev, cur) => prev.subtract(this.displacementVector(boid, cur)), Victor(0,0)).norm().multiply(this.avoidancePower);
        const attractionVector = boidsInRange.reduce((prev, cur) => prev.add(this.adjustedPos(boid, cur)), Victor(0,0)).divide(Victor(boidsInRange.length, boidsInRange.length)).subtract(Victor.fromObject(boid)).norm().multiply(this.attractionPower);
        const randomVector = Victor(Math.random()*2 - 1, Math.random()*2 -1).norm().multiply(this.randomPower);

        boid.velocity.add(velocityVector);
        boid.velocity.add(avoidanceVector);
        boid.velocity.add(attractionVector);
        boid.velocity.add(randomVector);
      }
    });
  }
}

export default Boids;
