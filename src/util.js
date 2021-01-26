/**
 * Union Find algorithm
 * https://www.hackerearth.com/practice/notes/disjoint-set-union-union-find/
 */
var undirectedConnectedSubGraphs = (nodes, edges) => {
  const z = performance.now();
  const uf = [...Array(nodes.length).keys()];
  const find = (x) => {
    if (x !== uf[x]) {
      uf[x] = find(uf[x]);
    }
    return uf[x];
  };
  const union = (a, b) => {
    uf[find(a)] = find(b);
  };
  edges.forEach(([a, b]) => union(a, b));
  console.log(`uf ${performance.now() - z}`);
  const graphsByComponent = {};
  for (let i = 0; i < nodes.length; i++) {
    const component = find(i);
    if (graphsByComponent[component] === undefined) {
      graphsByComponent[component] = { nodes: [], edges: [] };
    }
    graphsByComponent[component].nodes.push(nodes[i]);
  }
  edges.forEach((edge) => {
    const comp = graphsByComponent[find(edge[0])];
    comp.edges.push([nodes[edge[0]], nodes[edge[1]]]);
  });
  return Object.values(graphsByComponent).sort((a, b) => b.nodes.length - a.nodes.length);
};

function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}
// console.log(
//   undirectedConnectedSubGraphs(
//     [{}, {}, {}, {}, {}],
//     [
//       [1, 2],
//       [3, 4],
//     ],
//     5
//   )
// );
