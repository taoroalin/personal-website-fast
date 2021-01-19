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

let mousePosition = { x: 0, y: 0, prevX: 0, prevY: 0 };
let updating = true;

var roamToPageGraph = (roam) => {
  const pageTitleMap = {};
  roam.forEach((page, i) => (pageTitleMap[page.title] = i));
  nodes = roam.map((page) => new Node(page.title));

  edges = [];
  const edgeHashSet = {};
  const processBlock = (pageId, block) => {
    if (block.string !== undefined) {
      const pageRefs = Array.from(block.string.matchAll(/\[\[([^\]]+)\]\]/g));
      pageRefs.forEach((match) => {
        const targetPageId = pageTitleMap[match[1]];
        if (targetPageId !== undefined) {
          const edgeHash = pageId + targetPageId * 1000000;
          if (edgeHashSet[edgeHash] === undefined) {
            edgeHashSet[edgeHash] = true;
            nodes[pageId].numConnections += 1;
            nodes[targetPageId].numConnections += 1;
            edges.push([nodes[pageId], nodes[targetPageId]]);
          }
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

  canvas.addEventListener("mousemove", (event) => {
    mousePosition.x = event.offsetX;
    mousePosition.y = event.offsetY;
  });

  canvas.addEventListener("mousedown", (event) => {
    mousePosition.prevX = event.offsetX;
    mousePosition.prevY = event.offsetY;
  });

  const stopDrag = (event) => {
    mousePosition.prevX = 0;
    mousePosition.prevY = 0;
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
    console.log(event.deltaY);
    const scaling = (event.deltaY / 100) * scrollRatio;
    // scaling factor from new scale to old scale
    const inverseScaling = 1 / (1 + scaling) - 1;
    const newCanvasInnerHeight = canvasInnerHeight * (1 + inverseScaling);
    const newCanvasInnerWidth = canvasInnerWidth * (1 + inverseScaling);
    canvasOffsetX += canvasInnerWidth * (mousePosition.x / canvasWidth);
    canvasOffsetY += canvasInnerHeight * (mousePosition.y / canvasHeight);
    canvasInnerWidth = newCanvasInnerWidth;
    canvasInnerHeight = newCanvasInnerHeight;
  });
};

const scrollRatio = 0.15;
let canvasWidth = 936;
let canvasHeight = 969;
let canvasInnerWidth = 936;
let canvasInnerHeight = 969;
let canvasOffsetX = 0;
let canvasOffsetY = 0;

const twoPI = 2 * Math.PI;
const attraction = 0.007;
const friction = 0.8;
const epsilon = 0.0001;
const repulsion = 0.0000001;

// lots of wrapper functions
const calcAcc = (a, b, c, d) => calcAcc2(a, b, c, d);
const calcAcc2 = (a, b, c, d) => calcAcc3(a, b, c, d);
const calcAcc3 = (a, b, c, d) => calcAcc4(a, b, c, d);
const calcAcc4 = (a, b, c, d) => calcAcc5(a, b, c, d);
const calcAcc5 = (a, b, c, d) => ((a - b) / c) * d;
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
      const accX = calcAcc(a.x, b.x, distSquared, repulsion);
      const accY = calcAcc(a.y, b.y, distSquared, repulsion);
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

  if (mousePosition.prevX !== 0) {
    canvasOffsetY += mousePosition.y - mousePosition.prevY;
    canvasOffsetX += mousePosition.x - mousePosition.prevX;
    mousePosition.prevX = mousePosition.x;
    mousePosition.prevY = mousePosition.y;
  }
  ctx.setTransform(
    canvasInnerWidth,
    0,
    0,
    canvasInnerHeight,
    canvasOffsetX,
    canvasOffsetY
  );

  // draw edge lines first so they go underneath nodes
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
    const radius = 0.007 + node.numConnections * 0.0001;
    ctx.arc(node.x, node.y, radius, 0, twoPI, false);
    ctx.fill();
  });
  // draw node label backgrounds
  ctx.fillStyle = "#eeeeee";
  nodes.forEach((node) => {
    ctx.fillRect(node.x - 0.05, node.y, 0.1, 0.012);
  });
  // draw node labels
  ctx.font = `0.01px Verdana`;
  ctx.fillStyle = "#000000";
  nodes.forEach((node) => {
    ctx.fillText(node.title, node.x - 0.045, node.y + 0.01, 20);
  });
};

var update = () => {
  if (updating) {
    move();
  }
  render();
  requestAnimationFrame(update);
};

profileNewTopLevelFunctions();

initGraph();

requestAnimationFrame(update);
