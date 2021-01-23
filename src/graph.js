// Mutable state
let subGraphs;
let nodes = [];
let edges = [];
let quadTree = [];

let canvas, ctx;

let mousePosition = { x: 0, y: 0, prevX: 0, prevY: 0 };
let updating = true;
let showQuadTree = false;

let canvasOffsetX = 0;
let canvasOffsetY = 0;

// Constants
const attraction = 0.001;
const friction = 0.8;
const epsilon = 0.0000001;
const repulsion = 0.0000001;
const centering = 0.001;
const maxAngularSizeToTreatAsPoint = 0.8;

const zoomRatioPerMouseWheelTick = 0.15;

const twoPI = 2 * Math.PI;

const newNode = (title) => ({
  x: Math.random(),
  y: Math.random(),
  dx: 0,
  dy: 0,
  title: title,
  numConnections: 0,
});

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
      const pageRefRegexes = [
        /\#([a-zA-Z]+)/g,
        /\[\[([^\]]+)\]\]/g,
        /^([a-zA-Z ]+)::/g,
      ];
      pageRefRegexes.forEach((regex) => {
        const matches = block.string.matchAll(regex);
        for (let match of matches) {
          const targetPageId = pageTitleMap[match[1]];
          if (targetPageId !== undefined) {
            const edgeHash = pageId + targetPageId * 1000000; // bit concat id numbers
            // this only supports a million nodes, which is far above other bottlenecks
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
      page.children.forEach((block) =>
        processBlock(pageTitleMap[page.title], block)
      );
    }
  });
};

const quadTreeNode = (x0, x1, y0, y1, kids = []) => ({
  x0,
  x1,
  y0,
  y1,
  kids,
  tree: [],
  x: 0,
  y: 0,
});

const pushQuadTree = (branch, depth) => {
  if (depth >= 20) {
    return branch;
  }
  const midX = branch.x0 + (branch.x1 - branch.x0) * 0.5;
  const midY = branch.y0 + (branch.y1 - branch.y0) * 0.5;
  branch.tree = [
    quadTreeNode(branch.x0, midX, branch.y0, midY),
    quadTreeNode(midX, branch.x1, branch.y0, midY),
    quadTreeNode(branch.x0, midX, midY, branch.y1),
    quadTreeNode(midX, branch.x1, midY, branch.y1),
  ];
  let sumY = 0,
    sumX = 0;
  for (let node of branch.kids) {
    branch.tree[(node.x > midX) + 2 * (node.y > midY)].kids.push(node);
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
  quadTree = quadTreeNode(-1, 2, -1, 2, nodes);
  pushQuadTree(quadTree, 0);
};

const repelNode = (node, node2) => {
  const distSquared =
    Math.abs((node.x - node2.x) * (node.x - node2.x) * (node.x - node2.x)) +
    Math.abs((node.y - node2.y) * (node.y - node2.y) * (node.y - node2.y)) +
    epsilon;
  const factor = node2.kids ? node2.kids.length : 1;
  node.dx += ((node.x - node2.x) / distSquared) * factor * repulsion;
  node.dy += ((node.y - node2.y) / distSquared) * factor * repulsion;
};

const repelNodeByQuadTree = (node, quadTree) => {
  if (quadTree === undefined) {
  } else if (quadTree.numConnections !== undefined) {
    // if quadtree is actually leaf node
    repelNode(node, quadTree);
  } else {
    // use manhattan distance to save time
    const ratio =
      (quadTree.x1 - quadTree.x0) /
      Math.sqrt(
        (node.x - quadTree.x) * (node.x - quadTree.x) +
          (node.y - quadTree.y) * (node.y - quadTree.y)
      );
    if (ratio < maxAngularSizeToTreatAsPoint) {
      repelNode(node, quadTree);
    } else {
      quadTree.tree.forEach((tree) => repelNodeByQuadTree(node, tree));
    }
  }
};

var move = () => {
  edges.forEach(([a, b]) => {
    const distSquared = Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + epsilon;
    const accX = ((a.x - b.x) * attraction) / distSquared;
    const accY = ((a.y - b.y) * attraction) / distSquared;
    a.dx -= accX;
    b.dx += accX;
    a.dy -= accY;
    b.dy += accY;
  });

  // Barnes-hut repulsion
  nodes.forEach((node) => {
    repelNodeByQuadTree(node, quadTree);
  });

  nodes.forEach((a) => {
    a.x -= (a.x - 0.5) * centering;
    a.y -= (a.y - 0.5) * centering;
    a.x += a.dx;
    a.y += a.dy;
    a.dx *= friction;
    a.dy *= friction;
  });
};

var applyViewChanges = () => {
  /**
   * Pan by the difference between mouse x and mouse x last frame
   * not last mouseMove event
   */
  if (mousePosition.prevX !== 0) {
    canvasOffsetY += mousePosition.y - mousePosition.prevY;
    canvasOffsetX += mousePosition.x - mousePosition.prevX;
    mousePosition.prevX = mousePosition.x;
    mousePosition.prevY = mousePosition.y;
  }
  ctx.setTransform(
    canvasInnerWidth,
    0, // slant x
    0, // slant y
    canvasInnerHeight,
    canvasOffsetX,
    canvasOffsetY
  );
};

var renderQuadTree = (quadTree) => {
  if (quadTree && quadTree.tree) {
    ctx.strokeRect(
      quadTree.x0,
      quadTree.y0,
      quadTree.x1 - quadTree.x0,
      quadTree.y1 - quadTree.y0
    );
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
  edges.forEach(([node, endNode]) => {
    ctx.beginPath();
    ctx.moveTo(node.x, node.y);
    ctx.lineTo(endNode.x, endNode.y);
    ctx.stroke();
  });

  // // draw nodes
  // ctx.fillStyle = "#555555";
  // nodes.forEach((node) => {
  //   ctx.beginPath();
  //   const radius = 0.007 + node.numConnections * 0.0001;
  //   ctx.arc(node.x, node.y, radius, 0, twoPI, false);
  //   ctx.fill();
  // });

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

  if (showQuadTree) {
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 0.0005;
    renderQuadTree(quadTree);
  }
};

var update = () => {
  if (updating) {
    makeQuadTree();
    move();
    move();
    move();
    move();
  }
  applyViewChanges();
  render();
  requestAnimationFrame(update);
};

profileNewTopLevelFunctions();

canvas = document.getElementById("graph-canvas");
ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let canvasInnerWidth = canvas.width;
let canvasInnerHeight = canvas.height;
ctx.scale(canvas.width, canvas.height);

canvas.addEventListener("mousemove", (event) => {
  mousePosition.x = event.offsetX;
  mousePosition.y = event.offsetY;
});

// whether currently dragging is controlled by whether prev position is nonzero
// need to record where mouse was when started dragging
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
  const scaling = (event.deltaY / 100) * zoomRatioPerMouseWheelTick;
  // scaling factor from new scale to old scale
  const inverseScaling = 1 / (1 + scaling) - 1;
  const fracX = mousePosition.x / canvas.width;
  const fracY = mousePosition.y / canvas.height;
  const newCanvasInnerHeight = canvasInnerHeight * (1 + inverseScaling);
  const newCanvasInnerWidth = canvasInnerWidth * (1 + inverseScaling);
  canvasOffsetX +=
    canvas.width - canvasInnerWidth * (mousePosition.x / canvas.width);
  canvasOffsetY += canvasInnerHeight * (mousePosition.y / canvas.height);
  canvasInnerWidth = newCanvasInnerWidth;
  canvasInnerHeight = newCanvasInnerHeight;
});

loadRoamJSONGraph(roamJSON);

// subGraphs = undirectedConnectedSubGraphs(nodes, edges);
// console.log(subGraphs);
// nodes = subGraphs[0].nodes;
// edges = subGraphs[0].edges;

requestAnimationFrame(update);
