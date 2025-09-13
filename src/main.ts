function draw() {
  var canvas = document.getElementById("canvas");
  if (canvas instanceof HTMLCanvasElement) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var xc = canvas.width / 2;
    var yc = canvas.height / 2;

    ctx.beginPath();
    ctx.arc(xc, yc, 50, 0, Math.PI * 2, true);
    ctx.stroke();
    ctx.fill();
  }
}

draw();
