"use strict";
(() => {
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function inside(p, polygon) {
    let hit = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i],
        b = polygon[j];
      if (
        a[1] > p.y !== b[1] > p.y &&
        p.x < ((b[0] - a[0]) * (p.y - a[1])) / (b[1] - a[1]) + a[0]
      )
        hit = !hit;
    }
    return hit;
  }
  class Navigation {
    constructor(data) {
      this.data = data;
      this.dynamic = [];
      this.cell = 12;
      this.cols = 107;
      this.rows = 60;
      this.grid = new Uint8Array(this.cols * this.rows);
      for (let i = 0; i < this.grid.length; i++)
        this.grid[i] = Number(this.walkable(this.point(i)));
    }
    setDynamic(points) {
      this.dynamic = points;
      for (let i = 0; i < this.grid.length; i++)
        this.grid[i] = Number(this.walkable(this.point(i)));
    }
    point(id) {
      return {
        x: (id % this.cols) * this.cell + 6,
        y: Math.floor(id / this.cols) * this.cell + 6,
      };
    }
    floor(p) {
      return (
        inside(p, this.data.floor) &&
        !this.dynamic.some((o) => distance(p, o) < 16) &&
        !this.data.obstacles.some(
          (o) => ((p.x - o.x) / o.rx) ** 2 + ((p.y - o.y) / o.ry) ** 2 < 1,
        )
      );
    }
    walkable(p, r = 7) {
      if (!this.floor(p)) return false;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        if (!this.floor({ x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r }))
          return false;
      }
      return true;
    }
    visible(a, b) {
      const n = Math.ceil(distance(a, b) / 5);
      for (let i = 0; i <= n; i++) {
        const t = n ? i / n : 0;
        if (
          !this.walkable({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
        )
          return false;
      }
      return true;
    }
    closest(p) {
      let best = -1,
        d = Infinity;
      for (let i = 0; i < this.grid.length; i++) {
        if (!this.grid[i]) continue;
        const q = this.point(i),
          n = distance(q, p);
        if (n < d && (!this.walkable(p) || this.visible(p, q))) {
          d = n;
          best = i;
        }
      }
      return best;
    }
    route(from, to) {
      if (this.visible(from, to)) return [{ ...to }];
      const start = this.closest(from),
        end = this.closest(to);
      if (start < 0 || end < 0) return [];
      const open = new Set([start]),
        cost = new Map([[start, 0]]),
        score = new Map([
          [start, distance(this.point(start), this.point(end))],
        ]),
        prev = new Map();
      while (open.size) {
        let id = -1,
          min = Infinity;
        for (const i of open)
          if (score.get(i) < min) {
            min = score.get(i);
            id = i;
          }
        if (id === end) {
          const path = [this.point(end)];
          while (id !== start) {
            id = prev.get(id);
            path.unshift(this.point(id));
          }
          if (this.walkable(to) && this.visible(path.at(-1), to))
            path.push({ ...to });
          const smooth = [];
          let a = from,
            i = 0;
          while (i < path.length) {
            let j = i;
            while (j + 1 < path.length && this.visible(a, path[j + 1])) j++;
            smooth.push(path[j]);
            a = path[j];
            i = j + 1;
          }
          return smooth;
        }
        open.delete(id);
        const x = id % this.cols,
          y = Math.floor(id / this.cols);
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
          [-1, 1],
          [1, 1],
          [-1, -1],
          [1, -1],
        ]) {
          const xx = x + dx,
            yy = y + dy,
            n = yy * this.cols + xx;
          if (
            xx < 0 ||
            xx >= this.cols ||
            yy < 0 ||
            yy >= this.rows ||
            !this.grid[n] ||
            (dx &&
              dy &&
              (!this.grid[y * this.cols + xx] ||
                !this.grid[yy * this.cols + x]))
          )
            continue;
          const c = cost.get(id) + Math.hypot(dx, dy) * this.cell;
          if (c < (cost.get(n) ?? Infinity)) {
            cost.set(n, c);
            prev.set(n, id);
            score.set(n, c + distance(this.point(n), this.point(end)));
            open.add(n);
          }
        }
      }
      return [];
    }
    approach(from, target, range = 55) {
      const options = [];
      for (let i = 0; i < 24; i++) {
        const a = (i * Math.PI) / 12,
          p = {
            x: target.x + Math.cos(a) * range,
            y: target.y + Math.sin(a) * range,
          };
        if (this.walkable(p)) options.push(p);
      }
      options.sort((a, b) => distance(from, a) - distance(from, b));
      for (const p of options) {
        const route = this.route(from, p);
        if (route.length) return route;
      }
      return [];
    }
    swimming(p) {
      const b = this.data.bridge;
      return (
        !!this.data.water &&
        inside(p, this.data.water) &&
        !(b && p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h)
      );
    }
  }
  window.GuardiaoNavegacao = { Navigation, distance, inside };
})();
