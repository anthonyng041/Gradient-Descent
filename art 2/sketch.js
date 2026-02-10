let agents = [];
let numAgents = 30;
let noiseScale = 0.005; // Controls the "zoom" of the terrain
let learningRate = 15; // How big of a step the agents take
let terrainGraphics;

function setup() {
  createCanvas(800, 800);
  terrainGraphics = createGraphics(width, height);
  drawTerrain();
  
  // Initialize the "optimizers" randomly across the landscape
  for (let i = 0; i < numAgents; i++) {
    agents.push(new Agent(random(width), random(height)));
  }
  
  background(0);
  // Draw the terrain onto the main canvas
  image(terrainGraphics, 0, 0);
}

function draw() {
  // We do NOT clear the background. This allows trails to build up.
  // We just slightly darken the previous frame to create fading trails.
  noStroke();
  fill(0, 5);
  rect(0, 0, width, height);

  // Redraw terrain lightly over everything to keep context
  tint(255, 10); 
  image(terrainGraphics, 0, 0);
  noTint();

  for (let agent of agents) {
    agent.descend();
    agent.show();
  }
}

// --- Helper Function to get height (loss) at a specific point ---
function getLoss(x, y) {
  // Returns a value between 0.0 and 1.0
  let n = noise(x * noiseScale, y * noiseScale);
  n += 0.5 * noise(x * noiseScale * 2 + 100, y * noiseScale * 2 + 100);
  n += 0.25 * noise(x * noiseScale * 4 + 200, y * noiseScale * 4 + 200);
  // Normalize approx back to 0-1 range after adding octaves
  return n / 1.75; 
}

// --- One-time terrain drawing ---
function drawTerrain() {
  terrainGraphics.loadPixels();
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      // Brighter = higher loss (bad), Darker = lower loss (good)
      let lossValue = getLoss(x, y) * 255;
      // Create a topographic map aesthetic with subtle banding
      let bandedValue = floor(lossValue / 15) * 15;
      terrainGraphics.set(x, y, color(bandedValue, bandedValue, bandedValue + 30));
    }
  }
  terrainGraphics.updatePixels();
}

// --- The Optimizer Agent Class ---
class Agent {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.prevPos = this.pos.copy();
    // Give each agent a unique color based on its starting position
    this.color = color(map(x, 0, width, 100, 255), map(y, 0, height, 100, 255), 255);
    this.stuckCounter = 0;
  }

  descend() {
    this.prevPos = this.pos.copy();

    // 1. Calculate the Gradient
    // We "sample" the terrain slightly to the right and slightly down
    // to estimate the slope at the current position.
    let epsilon = 1; // A tiny distance away
    let currentLoss = getLoss(this.pos.x, this.pos.y);
    let lossRight = getLoss(this.pos.x + epsilon, this.pos.y);
    let lossDown = getLoss(this.pos.x, this.pos.y + epsilon);

    // The gradient is the difference in loss over that tiny distance
    let gradX = (lossRight - currentLoss) / epsilon;
    let gradY = (lossDown - currentLoss) / epsilon;

    // 2. Update Position (The Descent step)
    // Move in the opposite direction of the gradient
    this.pos.x -= gradX * learningRate;
    this.pos.y -= gradY * learningRate;
    
    // Keep them on screen
    this.pos.x = constrain(this.pos.x, 0, width-1);
    this.pos.y = constrain(this.pos.y, 0, height-1);
    
    // Check if Stuck (Converged in a local minimum)
    if (p5.Vector.dist(this.pos, this.prevPos) < 0.001) {
      this.stuckCounter++;
    } else {
       this.stuckCounter = 0;
    }
  }

  show() {
    // Draw the path
    strokeWeight(5);
    stroke(this.color);
    line(this.prevPos.x, this.prevPos.y, this.pos.x, this.pos.y);

    // Draw the head, unless it's stuck in a minimum
    if (this.stuckCounter < 20) {
      noStroke();
      fill(255, 200);
      circle(this.pos.x, this.pos.y, 6);
    } else {
      // It found a minimum
      fill(this.color);
      circle(this.pos.x, this.pos.y, 12);
    }
  }
}