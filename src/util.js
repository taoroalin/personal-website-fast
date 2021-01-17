const unionFindByEdges = (edges, numNodes) => {
  const result = [...Array(numNodes).keys()];
  const find = (x) => {
    if (result[x] === undefined) {
      result[x] = x;
    }
    if (x !== result[x]) {
      result[x] = find(result[x]);
    }
    return result[x];
  };
  const union = (a, b) => {
    result[find(a)] = find(b);
  };
  edges.forEach(([a, b]) => union(a, b));
  return result;
};
console.log(
  unionFindByEdges([
    [1, 2],
    [3, 4],
  ])
);
