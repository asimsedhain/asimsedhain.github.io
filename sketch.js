var cSize = 20;
var graph;
var current;
var row;
var column;
var stack;
function setup() {
  createCanvas(400, 400);
  graph = [];
  stack = [];
  frameRate(120);
  column = floor(height / cSize);
  row = floor(width / cSize);
  for (var j = 0; j < column; j++) {
    for (var i = 0; i < row; i++) {
      graph.push(new Cell(i, j));
    }
  }
  current = graph[0];

}

function draw() {
  
  //comment the next loop to disable the animation of calculation
  for (var i = 0; i < graph.length; i++) {
    graph[i].show();
  }
  if (current.flag == false) {
    current.c = (51);
    current.flag = true;
  }
  fill(200, 0, 0);
  noStroke();
  rect(current.x, current.y, cSize, cSize);
  var nextCurrent = next(current);
  if (nextCurrent != null) {
    stack.push(current);
    removeW(current, nextCurrent);
    current = nextCurrent;
  } else if (stack.length > 0) {
    current = stack.pop();
  } 
  //for faster processing by not drawing the calculation
  // else {
  //   for (var i = 0; i < graph.length; i++) {
  //     graph[i].show();
  //   }
  // }
}

function next(c) {
  var neighbors = [];
  if (graph[getIndex(c.i, c.j - 1)] != undefined) {
    if (graph[getIndex(c.i, c.j - 1)].flag == false) {
      neighbors.push(graph[getIndex(c.i, c.j - 1)]);
    }
  }
  if (graph[getIndex(c.i, c.j + 1)] != undefined) {
    if (graph[getIndex(c.i, c.j + 1)].flag == false) {
      neighbors.push(graph[getIndex(c.i, c.j + 1)]);
    }
  }
  if (graph[getIndex(c.i + 1, c.j)] != undefined) {
    if (graph[getIndex(c.i + 1, c.j)].flag == false) {
      neighbors.push(graph[getIndex(c.i + 1, c.j)]);
    }
  }
  if (graph[getIndex(c.i - 1, c.j)] != undefined) {
    if (graph[getIndex(c.i - 1, c.j)].flag == false) {
      neighbors.push(graph[getIndex(c.i - 1, c.j)]);
    }
  }
  if (neighbors.length > 0) {
    return neighbors[floor(random(neighbors.length))];
  } else {
    return null;
  }

}


function getIndex(i, j) {
  return (j * row) + i;
}

function removeW(c1, c2) {
  if (c1.i - c2.i == -1) {
    c1.rightW = false;
    c2.leftW = false;
  } else if (c1.i - c2.i == 1) {
    c1.leftW = false;
    c2.rightW = false;
  } else if (c1.j - c2.j == -1) {
    c1.bottomW = false;
    c2.topW = false;
  } else {
    c2.bottomW = false;
    c1.topW = false;

  }
}