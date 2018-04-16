function Cell(i, j) {
    this.i = i;
    this.j = j;
    this.x = i * cSize;
    this.y = j * cSize;
    this.flag = false;
    this.topW = true;
    this.bottomW = true;
    this.rightW = true;
    this.leftW = true;
    this.c = color(100);
}
Cell.prototype.show = function () {
    fill(this.c);
    noStroke();
    rect(this.x, this.y, cSize, cSize);
    stroke(255);
    if (this.topW) {
        line(this.x, this.y, this.x + cSize, this.y);
    }
    if (this.bottomW) {
        line(this.x, this.y + cSize, this.x + cSize, this.y + cSize);
    }
    if (this.rightW) {
        line(this.x + cSize, this.y, this.x + cSize, this.y + cSize);
    }
    if (this.leftW) {
        line(this.x, this.y, this.x, this.y + cSize);
    }
}