import geomerative.*;
import ddf.minim.*;
 
RFont f;
PImage img;
RShape grp, grp2;
RPoint[] points, points2;
Minim minim;
AudioPlayer song;
boolean ismousepressed=false;
int gridX = 200;                       // number of horizontal grid points
int gridY = 75;                        // number of vertical grid points
float waveHeight = 100;                 // maximum height of each wave (vertex)
float baseHeight = 10;                  // default base weight of each wave (vertex)
color BACKGROUND_COLOR = color(255);   // background color of the sketch
color PGRAPHICS_COLOR = color(0);
PGraphics pg;

void setup() {
  size(1200, 856, P2D);
  smooth(8); // higher smooth setting = higher quality rendering
  
  // Set colorMode for the sketch to Hue-Saturation-Brightness (HSB)
  colorMode(HSB, 360, 100, 100);
  
  // create the offscreen PGraphics with the text 
  pg = createGraphics(width, height, JAVA2D);
  pg.beginDraw();
  pg.textSize(400);
  pg.textAlign(CENTER, CENTER);
  pg.fill(PGRAPHICS_COLOR);
  pg.text("WAVE", pg.width/2, pg.height/2); 
  pg.endDraw();
  
  minim = new Minim(this);
  song = minim.loadFile("wave.mp3");
  
  String url = "http://vivax-metrotechaus.com/wp-content/themes/seba2012/images/bg-water.jpg";
  String url2 = "http://professionalwaterservices.com/wp-content/uploads/2015/02/Sunbeam-on-Deep-Water-HD.jpg";
  
  img = loadImage(url2, "jpg"); 
  RG.init(this);
  fill(255);
  stroke(0);
  grp = RG.getText("WAVE", "arialbd.ttf", 380, CENTER);
}

void draw() {
  background(255);

  //Draw Image
  pushMatrix();
  image(img, 0, 0);
  translate(width/2 + 5, height/2 + 180);
  fill(BACKGROUND_COLOR);
  //grp.draw();
  popMatrix();

  
  float w = float(width) / gridX;
  float h = float(height) / gridY;
  translate(w/2, h/2);
  float fc = frameCount * 0.01;
  stroke(255, 0, 255);
  for (int y=0; y<gridY; y++) {
    boolean continuous = false;
    // go over all the 'columns'
    for (int x=0; x<gridX; x++) {
      // for each point, determine it's position in the grid
      float vx = x * w;
      float vy = y * h;
      float r = random(100, 200);
      // determine of this point is inside the text
      color c = pg.get(int(vx), int(vy));
      boolean inText = (c == PGRAPHICS_COLOR);
      if (inText) {
        if (!continuous) {
          // when entering the text
          continuous = true;
          fill(200, (vx + 2 * vy + frameCount) % 360, 150);
          beginShape();
          vertex(vx, vy);
        }
        // add a curveVertex point which is moved upwards using noise()
        float n = noise(vx + fc, vy, fc);
        vy -= n * n * waveHeight + baseHeight;
        curveVertex(vx, vy);
      } else {
        if (continuous) {
          // when exiting the text
          continuous = false;
          vertex(vx, vy);
          endShape(CLOSE);
        }
      }
    }
  }
}

void mousePressed() {
  song.rewind();
  song.play(); 
  ismousepressed=true;
}


void mouseReleased() {
  song.pause(); 
  ismousepressed=false;
}