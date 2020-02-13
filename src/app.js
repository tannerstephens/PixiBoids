import * as PIXI from 'pixi.js';
import * as Heap from 'heap';

const app = new PIXI.Application();

const vel = 10;
const numTris = 5000;
const scale = 0.25;

window.onresize = () => {
    app.renderer.view.style.position = "absolute";
    app.renderer.view.style.display = "block";
    app.renderer.autoResize = true;
    app.renderer.resize(window.innerWidth, window.innerHeight);
}

window.onresize();

const createTriangle = () => {
    const tri = new PIXI.Graphics();

    tri.beginFill(0xffffff);
    tri.lineStyle(0, 0xffffff);
    tri.drawPolygon([0,0,10,30,20,0,10,5]);
    tri.endFill();

    return new PIXI.Sprite(app.renderer.generateTexture(tri));
}

const tris = Array(numTris).fill(null).map(() => createTriangle());

tris.forEach((tri) => {
    tri.x = Math.random() * window.innerWidth;
    tri.y = Math.random() * window.innerHeight;
    tri.anchor.set(0.5);
    tri.rotation = Math.random() * 2;
    tri.scale.set(scale);
    app.stage.addChild(tri);
});

const dist = (t1, t2) => {
    const dx = Math.min(Math.abs(t2.x - t1.x), Math.abs(window.innerWidth - t2.x - t1.x));
    const dy = Math.min(Math.abs(t2.y - t1.y), Math.abs(window.innerHeight - t2.y - t1.y));

    return Math.sqrt(dx**2 + dy**2);
}

app.ticker.add(() => {
    tris.forEach((tri) => {
        // const nearest = Heap.nsmallest(tris, 3, (a, b) => {return dist(a, tri) < dist(b,tri)});
        // const near = nearest.filter(tri2 => dist(tri2, tri) < 5 && tri2 != tri);

        tri.x -= vel*Math.sin(tri.rotation);
        tri.y += vel*Math.cos(tri.rotation);

        tri.rotation += (Math.random() - 0.5) * 0.1;

        if (tri.x < 0) {
            tri.x = window.innerWidth - Math.abs(tri.x)%window.innerWidth;
        } else if (tri.x > window.innerWidth) {
            tri.x = tri.x%window.innerWidth;
        }

        if (tri.y < 0) {
            tri.y = window.innerHeight - Math.abs(tri.y)%window.innerHeight;
        } else if (tri.y > window.innerHeight) {
            tri.y = tri.y%window.innerHeight;
        }
    });
});

export default app;
