class Node {
  constructor(title) {
    this.x = Math.random();
    this.y = Math.random();
    this.dx = 0;
    this.dy = 0;
    this.title = title;
    this.numConnections = 0;
  }
}

// Mutable state
let subGraphs;
let nodes = [];
let edges = [];

let canvas, ctx;

let mousePosition = null; //{ x: 0, y: 0, prevX: 0, prevY: 0 }
let updating = true;

// this is set to a listener when mouse clicks, removed when mouse is released
var mouseMoveListener = (event) => {
  mousePosition.x = event.offsetX;
  mousePosition.y = event.offsetY;
  // mousemove event isn't very fast. Could extrapolate future position to make it feel more responsive
};

var roamToPageGraph = (roam) => {
  const pageTitleMap = {};
  roam.forEach((page, i) => (pageTitleMap[page.title] = i));
  nodes = roam.map((page) => new Node(page.title));

  edges = [];
  const processBlock = (pageId, block) => {
    if (block.string !== undefined) {
      const pageRefs = Array.from(block.string.matchAll(/\[\[([^\]]+)\]\]/g));
      pageRefs.forEach((match) => {
        const targetPageId = pageTitleMap[match[1]];
        if (targetPageId !== undefined) {
          nodes[pageId].numConnections += 1;
          nodes[targetPageId].numConnections += 1;
          edges.push([nodes[pageId], nodes[targetPageId]]);
        }
      });
    }
    if (block.children !== undefined) {
      block.children.forEach((block) => processBlock(pageId, block));
    }
  };
  roam.forEach((page) => {
    if (page.children !== undefined) {
      page.children.forEach((block) =>
        processBlock(pageTitleMap[page.title], block)
      );
    }
  });
};

var initGraph = async () => {
  canvas = document.getElementById("graph-canvas");
  ctx = canvas.getContext("2d");
  ctx.scale(canvas.width, canvas.height);

  roamJSON = await fetch("graphminer.json").then((r) => r.json());
  roamToPageGraph(roamJSON);

  // subGraphs = undirectedConnectedSubGraphs(nodes, edges);
  // console.log(subGraphs);
  // nodes = subGraphs[0].nodes;
  // edges = subGraphs[0].edges;

  canvas.addEventListener("mousedown", (event) => {
    mousePosition = {
      x: event.offsetX,
      y: event.offsetY,
      prevX: event.offsetX,
      prevY: event.offsetY,
    };
    canvas.addEventListener("mousemove", mouseMoveListener);
  });

  const stopDrag = (event) => {
    mousePosition = null;
    canvas.removeEventListener("mousemove", mouseMoveListener);
  };
  canvas.addEventListener("mouseup", stopDrag);
  canvas.addEventListener("mouseleave", stopDrag);
  canvas.addEventListener("keypress", (event) => {
    if (event.code == "Space") {
      updating = !updating;
      event.stopPropagation();
    }
  });

  canvas.addEventListener("wheel", (event) => {
    ctx.scale(1 + event.deltaY * 0.001, 1 + event.deltaY * 0.001);
  });
};

const twoPI = 2 * Math.PI;
const attraction = 0.007;
const friction = 0.8;
const epsilon = 0.0001;
const repulsion = 0.0000001;

var move = () => {
  edges.forEach(([a, b]) => {
    //const distSquared = (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y) + epsilon;
    const accX = (a.x - b.x) * attraction;
    const accY = (a.y - b.y) * attraction;
    a.dx -= accX;
    b.dx += accX;
    a.dy -= accY;
    b.dy += accY;
  });
  nodes.forEach((a) =>
    nodes.forEach((b) => {
      const distSquared =
        Math.abs((a.x - b.x) * (a.x - b.x) * (a.x - b.x)) +
        Math.abs((a.y - b.y) * (a.y - b.y) * (a.y - b.y)) +
        epsilon;
      const accX = ((a.x - b.x) / distSquared) * repulsion;
      const accY = ((a.y - b.y) / distSquared) * repulsion;
      a.dx += accX;
      b.dx -= accX;
      a.dy += accY;
      b.dy -= accY;
    })
  );
  nodes.forEach((a) => {
    a.x += a.dx;
    a.y += a.dy;
    a.dx *= friction;
    a.dy *= friction;
  });
};

var render = () => {
  // clear canvas in positive and negative directions
  ctx.save();
  ctx.translate(-5000, -5000);
  ctx.clearRect(0, 0, 10000, 10000);
  ctx.restore();

  // Mouse dragging whole canvas
  if (mousePosition) {
    ctx.translate(
      (mousePosition.x - mousePosition.prevX) / 936,
      (mousePosition.y - mousePosition.prevY) / 969
    );
    mousePosition.prevX = mousePosition.x;
    mousePosition.prevY = mousePosition.y;
  }

  // draw lines first so they go underneath nodes
  //ctx.strokeStyle = "#bbbbbb";
  ctx.lineWidth = 0.002;
  edges.forEach(([node, endNode]) => {
    ctx.beginPath();
    ctx.moveTo(node.x, node.y);
    ctx.lineTo(endNode.x, endNode.y);
    ctx.stroke();
  });

  // draw nodes
  ctx.fillStyle = "#555555";
  nodes.forEach((node) => {
    ctx.beginPath();
    ctx.arc(
      node.x,
      node.y,
      0.007 + node.numConnections * 0.0001,
      0,
      twoPI,
      false
    );
    ctx.fill();
  });
};

var update = (timestamp) => {
  if (updating) {
    move();
  }
  render();
  requestAnimationFrame(update);
};

profileNewTopLevelFunctions();

initGraph();

window.requestAnimationFrame(update);
