import Boids from './app';

document.addEventListener("DOMContentLoaded", () => {
    const boids = new Boids();

    document.body.appendChild(boids.app.view);
    document.body.style.margin = 0;
});
