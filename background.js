(function () {
    const canvas = document.getElementById('backgroundCanvas');
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const points = [];
    const colors = ['rgba(83, 184, 255, 0.22)', 'rgba(197, 212, 135, 0.14)'];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function random(min, max) {
        return min + Math.random() * (max - min);
    }

    function createPoints() {
        points.length = 0;
        const count = reducedMotion ? 18 : (window.innerWidth < 700 ? 24 : 38);

        for (let index = 0; index < count; index += 1) {
            points.push({
                x: random(0, canvas.width),
                y: random(0, canvas.height),
                vx: reducedMotion ? 0 : random(-0.12, 0.12),
                vy: reducedMotion ? 0 : random(-0.08, 0.08),
                radius: random(1.2, 2.8),
                color: colors[index % colors.length]
            });
        }
    }

    function drawLinks() {
        const maxDistance = window.innerWidth < 700 ? 110 : 150;

        for (let outer = 0; outer < points.length; outer += 1) {
            for (let inner = outer + 1; inner < points.length; inner += 1) {
                const a = points[outer];
                const b = points[inner];
                const distance = Math.hypot(a.x - b.x, a.y - b.y);

                if (distance > maxDistance) continue;

                const alpha = 1 - distance / maxDistance;
                context.strokeStyle = `rgba(120, 190, 245, ${alpha * 0.08})`;
                context.lineWidth = 1;
                context.beginPath();
                context.moveTo(a.x, a.y);
                context.lineTo(b.x, b.y);
                context.stroke();
            }
        }
    }

    function drawPoints() {
        points.forEach((point) => {
            context.beginPath();
            context.fillStyle = point.color;
            context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
            context.fill();
        });
    }

    function step() {
        context.clearRect(0, 0, canvas.width, canvas.height);

        if (!reducedMotion) {
            points.forEach((point) => {
                point.x += point.vx;
                point.y += point.vy;

                if (point.x < -30) point.x = canvas.width + 30;
                if (point.x > canvas.width + 30) point.x = -30;
                if (point.y < -30) point.y = canvas.height + 30;
                if (point.y > canvas.height + 30) point.y = -30;
            });
        }

        drawLinks();
        drawPoints();
        window.requestAnimationFrame(step);
    }

    window.addEventListener('resize', () => {
        resize();
        createPoints();
    });

    resize();
    createPoints();
    step();
}());
