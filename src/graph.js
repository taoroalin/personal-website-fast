const graphJsStartTime = performance.now(); // measure when graph.js starts executing
let lastFrameStartTime = 0; // for counting framerate
const useRoamJSON = false;

// I'm using a script to automatically track performance on all functions I define using `var`
// for development. Will switch these to const and use a more systematic performance tracker later

let canvas, ctx;

let mousePosition = { x: 0, y: 0, prevX: 0, prevY: 0 };
let updating = true;

let somethingChangedThisFrame = false;

// ----------- Constants --------------------

// Physics constants
let attraction = 0.004;
let friction = 0.9;
let repulsion = 0.0000004;
let centering = 0.004;
const slowdown = 0.65;

let maxSizeRatioToApproximate = 0.5;
const simulationStepsBeforeRender = 200;

// Math constants
const epsilon = 0.0000001;
const twoPI = 2 * Math.PI; // get a few percent performance by precomputing 2*pi once instead of in loop

// UI constants
const zoomRatioPerMouseWheelTick = 0.15;
const labelPaddingX = 0.003;
const labelPaddingY = 0.003;
let showQuadTree = false;

// precomputing often-used UI values
const labelExtraWidth = 2 * labelPaddingX;
const labelHeight = 2 * labelPaddingY + 0.006;
const labelTextYOffset = labelPaddingY + 0.006;

// create graph node
const newNode = (title) => ({
  x: Math.random(),
  y: Math.random(),
  dx: 0,
  dy: 0,
  title: title,
  numConnections: 0,
  // measure text width up front, not in loop. This requires ctx font to be already set.
  textWidth: ctx.measureText(title).width,
  mass: 1,
});

// This is the start of the Barnes-Hut n-body force approximation.
// It works by partitiioning space into a tree structure and
// applying forces to tree roots instead of nodes / leaves
// The quadTree nodes have nothing to do conceptually with the graph - they're just for optimization
// https://en.wikipedia.org/wiki/Barnes%E2%80%93Hut_simulation
const quadTreeNode = (x, y, r, kids = []) => ({
  x,
  y,
  r,
  kids,
  tree: [],
  mass: 0,
});

// move all kids in quadtree to child quadtrees, recursively
const pushQuadTree = (branch, recursionDepth = 0) => {
  if (recursionDepth >= 20) {
    // Abort recursion if we've gone too deep
    return;
  }
  const newR = branch.r * 0.5;
  branch.tree = [
    quadTreeNode(branch.x - newR, branch.y - newR, newR), // top left
    quadTreeNode(branch.x + newR, branch.y - newR, newR), // top right
    quadTreeNode(branch.x - newR, branch.y + newR, newR), // bottom left
    quadTreeNode(branch.x + newR, branch.y + newR, newR), // bottom right
  ];
  let sumY = 0,
    sumX = 0;
  for (let node of branch.kids) {
    // casting boolean to 0/1 to index array
    branch.tree[(node.x > branch.x) + 2 * (node.y > branch.y)].kids.push(node);
    sumY += node.y;
    sumX += node.x;
    branch.mass += node.mass;
  }
  branch.x = sumX / branch.kids.length;
  branch.y = sumY / branch.kids.length;
  for (let i = 0; i < 4; i++) {
    const len = branch.tree[i].kids.length;
    if (len > 1) {
      // if there are multiple nodes in child tree, then push that child tree
      pushQuadTree(branch.tree[i], recursionDepth + 1);
    } else if (len === 0) {
      branch.tree[i] = undefined;
    } else {
      // if child tree has one node, replace the tree with the node
      branch.tree[i] = branch.tree[i].kids[0];
    }
  }
};

const repelNodeByQuadTree = (node, quadTree) => {
  if (quadTree === undefined) {
    return;
  }
  const dx = node.x - quadTree.x;
  const dy = node.y - quadTree.y;
  if (
    // if quadtree has children but it's far away and should be approximated
    (quadTree.tree !== undefined && quadTree.r / Math.sqrt(dx * dx + dy * dy) < maxSizeRatioToApproximate) ||
    // if node is leaf
    quadTree.numConnections !== undefined
  ) {
    // Use 'approximation' to square root that's faster than Math.sqrt
    const distanceMangledForPerformance = Math.abs(dx * dx * dx) + Math.abs(dy * dy * dy) + epsilon;
    const factor = (quadTree.mass * repulsion) / distanceMangledForPerformance;
    node.dx += dx * factor;
    node.dy += dy * factor;
  } else {
    quadTree.tree.forEach((tree) => repelNodeByQuadTree(node, tree));
  }
};

var physicsTick = () => {
  // Attract nodes on edges together
  edges.forEach(([a, b]) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    // Use 'approximation' to square root that's faster than Math.sqrt
    const distanceMangledForPerformance = Math.abs(dx) + Math.abs(dy) + epsilon;
    const factor = attraction / distanceMangledForPerformance;
    const accX = dx * factor;
    const accY = dy * factor;
    a.dx -= accX;
    b.dx += accX;
    a.dy -= accY;
    b.dy += accY;
  });

  // Repel all nodes apart using Barnes-Hut approximation
  const quadTree = quadTreeNode(0.5, 0.5, 2, nodes);
  pushQuadTree(quadTree);
  nodes.forEach((node) => repelNodeByQuadTree(node, quadTree));

  nodes.forEach((node) => {
    // Pull nodes towards center
    node.x -= (node.x - 0.5) * (node.x - 0.5) * (node.x - 0.5) * centering;
    node.y -= (node.y - 0.5) * (node.y - 0.5) * (node.y - 0.5) * centering;

    // 'tick' position forward by velocity
    node.x += node.dx;
    node.y += node.dy;

    // Slow down nodes by friction ratio
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

// Debug: show quadTree boxes
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
  ctx.strokeStyle = "#bbbbbb"; // Set canvas state outside of loop for performance
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

// This is called once per animation frame
var update = () => {
  if (updating) {
    physicsTick();
  }
  const frameStatTime = performance.now();
  if (updating || somethingChangedThisFrame) {
    fpsCounterElement.innerText = Math.round(1000 / (frameStatTime - lastFrameStartTime));
    applyViewChanges();
    render();
  }
  lastFrameStartTime = frameStatTime;
  somethingChangedThisFrame = false;
  requestAnimationFrame(update);
};

profileNewTopLevelFunctions();

// Setup canvas
canvas = document.getElementById("graph-canvas");
ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
// fit to whole window except for text at top
const fromTop = canvas.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop);
canvas.height = window.innerHeight - fromTop;
let canvasInnerWidth = canvas.width;
let canvasInnerHeight = canvas.height;
let canvasOffsetX = 0;
let canvasOffsetY = 0;

const fpsCounterElement = document.getElementById("fps");

applyViewChanges();
ctx.font = `0.01px Verdana`;

canvas.addEventListener("mousemove", (event) => {
  mousePosition.x = event.offsetX;
  mousePosition.y = event.offsetY;
  if (mousePosition.prevX) {
    somethingChangedThisFrame = true;
  }
});

// whether currently dragging is controlled by whether prev position is nonzero
// need to record where mouse was when started dragging
canvas.addEventListener("mousedown", (event) => {
  mousePosition.prevX = event.offsetX;
  mousePosition.prevY = event.offsetY;
  somethingChangedThisFrame = true;
});

const stopDrag = (event) => {
  mousePosition.prevX = 0;
  mousePosition.prevY = 0;
  somethingChangedThisFrame = true;
};

canvas.addEventListener("mouseup", stopDrag);

canvas.addEventListener("mouseleave", stopDrag);

canvas.addEventListener("keypress", (event) => {
  if (event.code === "Space") {
    updating = !updating;
    event.stopPropagation();
    event.preventDefault();
    somethingChangedThisFrame = true;
  }
});

canvas.addEventListener("wheel", (event) => {
  const scaling = event.deltaY * 0.01 * zoomRatioPerMouseWheelTick;
  const newCanvasInnerHeight = canvasInnerHeight * (1 - scaling);
  const newCanvasInnerWidth = canvasInnerWidth * (1 - scaling);
  canvasInnerWidth = newCanvasInnerWidth;
  canvasInnerHeight = newCanvasInnerHeight;
  somethingChangedThisFrame = true;
});

// Create graph from JSON exported by Roam.
// JSON is in a global constant called roamJSON from the file help-roam-json for performance
// (as opposed to fetching that here)
const loadRomaJSON = () => {
  const pageTitleMap = {};
  roamJSON.forEach((page, i) => (pageTitleMap[page.title] = i));
  nodes = roamJSON.map((page) => newNode(page.title));
  edges = [];
  edgeIdxs = [];

  // only count unique edges, keep track with "hash set"
  const edgeHashSet = {}; // hash is bit concat id numbers

  // Recursive function to find page links in a block
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
            const edgeHash = pageId + targetPageId * 1000000; // hash is bit concat id numbers
            if (edgeHashSet[edgeHash] === undefined) {
              edgeHashSet[edgeHash] = true;
              nodes[pageId].numConnections += 1;
              nodes[targetPageId].numConnections += 1;
              edges.push([nodes[pageId], nodes[targetPageId]]);
              edgeIdxs.push([pageId, targetPageId]);
            }
          }
        }
      });
    }

    if (block.children !== undefined) {
      block.children.forEach((block) => processBlock(pageId, block));
    }
  };

  // Add edges in all blocks in all pages
  roamJSON.forEach((page) => {
    if (page.children !== undefined) {
      page.children.forEach((block) => processBlock(pageTitleMap[page.title], block));
    }
  });
};

if (useRoamJSON) {
  loadRomaJSON();
  console.log(`let nodes = ${JSON.stringify(nodes)};
  let edgeIdxs = ${JSON.stringify(edgeIdxs)};`);
} else {
  // store edges as references instead of idx's for performance
  edges = edgeIdxs.map(([source, target]) => [nodes[source], nodes[target]]);
}

// simulate physics before render
for (let i = 0; i < simulationStepsBeforeRender; i++) {
  physicsTick();
}

// slow down simulation before rendering
attraction *= slowdown;
friction *= slowdown;
centering *= slowdown;
maxSizeRatioToApproximate *= slowdown;

applyViewChanges();
render();

requestAnimationFrame(update);

document.getElementById("startupTime").innerText = Math.round(performance.now() - graphJsStartTime) * 0.001;
document.getElementById("status").innerText = "Running";

setTimeout(() => (updating = false), 5000);
