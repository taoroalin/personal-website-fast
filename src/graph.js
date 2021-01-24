const graphJsStartTime = performance.now();
let lastFrameStartTime = 0;

// Mutable state
let nodes = [];
let edges = [];
let quadTree = [];

let canvas, ctx;

let mousePosition = { x: 0, y: 0, prevX: 0, prevY: 0 };
let updating = false;

let canvasOffsetX = 0;
let canvasOffsetY = 0;

let userInputHappenedThisFrame = false;

// Constants
let attraction = 0.004;
let friction = 0.9;
let repulsion = 0.0000004;
let centering = 0.004;
const slowdown = 0.8;

let maxSizeRatioToApproximate = 0.5;
const zoomRatioPerMouseWheelTick = 0.15;
const simulationStepsBeforeRender = 200;

const epsilon = 0.0000001;
const twoPI = 2 * Math.PI;

// visuals
const labelPaddingX = 0.003;
const labelPaddingY = 0.003;
let showQuadTree = false;

const labelExtraWidth = 2 * labelPaddingX;
const labelHeight = 2 * labelPaddingY + 0.006;
const labelTextYOffset = labelPaddingY + 0.006;

const newNode = (title) => ({
  x: Math.random(),
  y: Math.random(),
  dx: 0,
  dy: 0,
  title: title,
  numConnections: 0,
  textWidth: ctx.measureText(title).width,
});

// I'm using a script to automatically track performance on all functions I define using `var`
// for development. Will switch to const for production
var loadRoamJSONGraph = (roam) => {
  const pageTitleMap = {};
  roam.forEach((page, i) => (pageTitleMap[page.title] = i));
  nodes = roam.map((page) => newNode(page.title));

  edges = [];
  // only count unique edges, keep track with "hash set"
  const edgeHashSet = {};
  const processBlock = (pageId, block) => {
    if (block.string !== undefined) {
      // there must be a better way to get page links from json???
      // this doesn't see page links inside other page links
      const pageRefRegexes = [/\#([a-zA-Z]+)/g, /\[\[([^\]]+)\]\]/g, /^([a-zA-Z ]+)::/g];
      pageRefRegexes.forEach((regex) => {
        const matches = block.string.matchAll(regex);
        for (let match of matches) {
          const targetPageId = pageTitleMap[match[1]];
          if (targetPageId !== undefined) {
            const edgeHash = pageId + targetPageId * 1000000; // bit concat id numbers
            if (edgeHashSet[edgeHash] === undefined) {
              edgeHashSet[edgeHash] = true;
              nodes[pageId].numConnections += 1;
              nodes[targetPageId].numConnections += 1;
              edges.push([nodes[pageId], nodes[targetPageId]]);
            }
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
      page.children.forEach((block) => processBlock(pageTitleMap[page.title], block));
    }
  });
};

// This is the start of the Barnes-Hut n-body force approximation.
// It works by partitiioning space into a tree structure and
// applying forces to tree roots instead of nodes / leaves
// https://en.wikipedia.org/wiki/Barnes%E2%80%93Hut_simulation
const quadTreeNode = (x, y, r, kids = []) => ({
  x,
  y,
  r,
  kids,
  tree: [],
});

const pushQuadTree = (branch, depth) => {
  if (depth >= 20) {
    return branch;
  }
  const newR = branch.r * 0.5;
  branch.tree = [
    quadTreeNode(branch.x - newR, branch.y - newR, newR),
    quadTreeNode(branch.x + newR, branch.y - newR, newR),
    quadTreeNode(branch.x - newR, branch.y + newR, newR),
    quadTreeNode(branch.x + newR, branch.y + newR, newR),
  ];
  let sumY = 0,
    sumX = 0;
  for (let node of branch.kids) {
    // casting comparison to 0/1 to index array
    branch.tree[(node.x > branch.x) + 2 * (node.y > branch.y)].kids.push(node);
    sumY += node.y;
    sumX += node.x;
  }
  branch.x = sumX / branch.kids.length;
  branch.y = sumY / branch.kids.length;
  for (let i = 0; i < 4; i++) {
    const len = branch.tree[i].kids.length;
    if (len == 0) {
      branch.tree[i] = undefined;
    } else if (len == 1) {
      branch.tree[i] = branch.tree[i].kids[0];
    } else {
      pushQuadTree(branch.tree[i], depth + 1);
    }
  }
};

var makeQuadTree = () => {
  quadTree = quadTreeNode(0.5, 0.5, 2, nodes);
  pushQuadTree(quadTree, 0);
};

const repelNode = (node, node2) => {
  const dx = node.x - node2.x;
  const dy = node.y - node2.y;
  const distanceMangledForPerformance = Math.abs(dx * dx * dx) + Math.abs(dy * dy * dy) + epsilon;
  const mass = node2.kids ? node2.kids.length : 1;
  const factor = (mass * repulsion) / distanceMangledForPerformance;
  node.dx += dx * factor;
  node.dy += dy * factor;
};

const repelNodeByQuadTree = (node, quadTree) => {
  if (quadTree === undefined) {
  } else if (quadTree.numConnections !== undefined) {
    // if quadtree is actually leaf node, not a quadtree
    repelNode(node, quadTree);
  } else {
    const quadTreeSizeOverDistanceFromPoint =
      quadTree.r /
      Math.sqrt((node.x - quadTree.x) * (node.x - quadTree.x) + (node.y - quadTree.y) * (node.y - quadTree.y));
    if (quadTreeSizeOverDistanceFromPoint < maxSizeRatioToApproximate) {
      repelNode(node, quadTree);
    } else {
      quadTree.tree.forEach((tree) => repelNodeByQuadTree(node, tree));
    }
  }
};

var physicsTick = () => {
  edges.forEach(([a, b]) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distSquared = Math.abs(dx) + Math.abs(dy) + epsilon;
    const factor = attraction / distSquared;
    const accX = dx * factor;
    const accY = dy * factor;
    a.dx -= accX;
    b.dx += accX;
    a.dy -= accY;
    b.dy += accY;
  });

  makeQuadTree();
  nodes.forEach((node) => {
    repelNodeByQuadTree(node, quadTree);
  });

  nodes.forEach((node) => {
    node.x -= (node.x - 0.5) * centering;
    node.y -= (node.y - 0.5) * centering;
    node.x += node.dx;
    node.y += node.dy;
    node.dx *= friction;
    node.dy *= friction;
  });
};

var applyViewChanges = () => {
  // Pan by the difference between mouse x and mouse x last frame
  // not last mouseMove event
  if (mousePosition.prevX !== 0) {
    canvasOffsetY += mousePosition.y - mousePosition.prevY;
    canvasOffsetX += mousePosition.x - mousePosition.prevX;
    mousePosition.prevX = mousePosition.x;
    mousePosition.prevY = mousePosition.y;
  }
  ctx.setTransform(
    canvasInnerHeight, // scale width, we set this scale the same as the height to avoid stretching
    0, // slant x
    0, // slant y
    canvasInnerHeight,
    canvasOffsetX,
    canvasOffsetY
  );
};

var renderQuadTree = (quadTree) => {
  if (quadTree && quadTree.tree) {
    ctx.strokeRect(quadTree.x - quadTree.r, quadTree.y - quadTree.r, quadTree.r * 2, quadTree.r * 2);
    quadTree.tree.forEach(renderQuadTree);
  }
};

var render = () => {
  // clear canvas in positive and negative directions
  ctx.save();
  ctx.translate(-5000, -5000);
  ctx.clearRect(0, 0, 10000, 10000);
  ctx.restore();

  // draw edge lines first so they go underneath nodes
  ctx.strokeStyle = "#bbbbbb";
  ctx.lineWidth = 0.002;
  edges.forEach(([startNode, endNode]) => {
    ctx.beginPath();
    ctx.moveTo(startNode.x, startNode.y);
    ctx.lineTo(endNode.x, endNode.y);
    ctx.stroke();
  });

  // draw node label backgrounds
  ctx.fillStyle = "#eeeeee";
  nodes.forEach((node) => {
    ctx.fillRect(node.x - node.textWidth * 0.5 - labelPaddingX, node.y, node.textWidth + labelExtraWidth, labelHeight);
  });

  // draw node labels
  ctx.fillStyle = "#000000";
  nodes.forEach((node) => {
    ctx.fillText(node.title, node.x - node.textWidth * 0.5, node.y + labelTextYOffset);
  });

  if (showQuadTree) {
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 0.0005;
    renderQuadTree(quadTree);
  }
};

var update = () => {
  const frameStatTime = performance.now();
  fpsCounterElement.innerText = Math.round(1000 / (frameStatTime - lastFrameStartTime));
  lastFrameStartTime = frameStatTime;
  if (updating) {
    applyViewChanges();
    render();
    physicsTick();
  } else if (userInputHappenedThisFrame) {
    applyViewChanges();
    render();
  }
  userInputHappenedThisFrame = false;
  requestAnimationFrame(update);
};

profileNewTopLevelFunctions();

canvas = document.getElementById("graph-canvas");
ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
// fit to whole window except for text at top
const fromTop = canvas.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop);
console.log(fromTop);
canvas.height = window.innerHeight - fromTop;
let canvasInnerWidth = canvas.width;
let canvasInnerHeight = canvas.height;

const fpsCounterElement = document.getElementById("fps");

applyViewChanges();
ctx.font = `0.01px Verdana`;

canvas.addEventListener("mousemove", (event) => {
  mousePosition.x = event.offsetX;
  mousePosition.y = event.offsetY;
  if (mousePosition.prevX) {
    userInputHappenedThisFrame = true;
  }
});

// whether currently dragging is controlled by whether prev position is nonzero
// need to record where mouse was when started dragging
canvas.addEventListener("mousedown", (event) => {
  mousePosition.prevX = event.offsetX;
  mousePosition.prevY = event.offsetY;
  userInputHappenedThisFrame = true;
});

const stopDrag = (event) => {
  mousePosition.prevX = 0;
  mousePosition.prevY = 0;
  userInputHappenedThisFrame = true;
};

canvas.addEventListener("mouseup", stopDrag);

canvas.addEventListener("mouseleave", stopDrag);

canvas.addEventListener("keypress", (event) => {
  if (event.code == "Space") {
    updating = !updating;
    event.stopPropagation();
    event.preventDefault();
    userInputHappenedThisFrame = true;
  }
});

canvas.addEventListener("wheel", (event) => {
  const scaling = event.deltaY * 0.01 * zoomRatioPerMouseWheelTick;
  // scaling factor from new scale to old scale
  const inverseScaling = 1 / (1 + scaling) - 1;
  const fracX = mousePosition.x / canvas.width;
  const fracY = mousePosition.y / canvas.height;
  const newCanvasInnerHeight = canvasInnerHeight * (1 + inverseScaling);
  const newCanvasInnerWidth = canvasInnerWidth * (1 + inverseScaling);
  canvasOffsetX += canvas.width - canvasInnerWidth * (mousePosition.x / canvas.width);
  canvasOffsetY += canvasInnerHeight * (mousePosition.y / canvas.height);
  canvasInnerWidth = newCanvasInnerWidth;
  canvasInnerHeight = newCanvasInnerHeight;
  userInputHappenedThisFrame = true;
});

loadRoamJSONGraph(roamJSON);

for (let i = 0; i < simulationStepsBeforeRender; i++) {
  physicsTick();
}
attraction *= slowdown * slowdown;
friction *= slowdown * slowdown;
centering *= slowdown * slowdown;
maxSizeRatioToApproximate *= slowdown * slowdown;

applyViewChanges();
render();

requestAnimationFrame(update);

document.getElementById("startupTime").innerText = Math.round(performance.now() - graphJsStartTime) * 0.001;
document.getElementById("status").innerText = "Running";
