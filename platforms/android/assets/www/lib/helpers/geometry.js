module.exports = {
  radToDeg: function(rad) {
    return rad * (180 / Math.PI);
  },
  degToRad: function(deg) {
    return deg * (Math.PI / 180);
  },
  degToVector: function(deg, force) {
    var rad, vector;

    if (force == null) {
      force = 1;
    }
    rad = this.degToRad(deg);
    vector = {
      x: force * Math.cos(rad),
      y: force * Math.sin(rad)
    };
    return vector;
  },
  getDistance: function(a, b) {
    var xs, ys;

    xs = b.x - a.x;
    xs = xs * xs;
    ys = b.y - a.y;
    ys = ys * ys;
    return Math.abs(Math.sqrt(xs + ys));
  },
  sumVectors: function(vectors) {
    var angleDeg, anglesSumX, anglesSumY, deg, force, forceSum, vector, _i, _len;

    anglesSumX = 0;
    anglesSumY = 0;
    forceSum = 0;
    for (_i = 0, _len = vectors.length; _i < _len; _i++) {
      vector = vectors[_i];
      deg = Math.atan2(vector.y, vector.x);
      anglesSumX += Math.cos(deg);
      anglesSumY += Math.sin(deg);
      forceSum += Math.abs(vector.x) + Math.abs(vector.y);
    }
    angleDeg = Math.floor(this.radToDeg(Math.atan2(anglesSumY, anglesSumX)));
    force = forceSum;
    return this.degToVector(angleDeg, force);
  },
  rectanglesIntersect: function(a, b) {
    return !(b.x > a.x + a.width || b.x + b.x + b.width < a.x || b.y > a.y + a.height || b.y + b.height < a.y);
  }
};
