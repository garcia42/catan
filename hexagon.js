function Hexagon(x, y, z, xp, yp, h, radius) {

	this.up = [radius+xp, yp];
	this.upRight = [radius/2+xp, radius*h+yp];
	this.upLeft = [-radius/2+xp, radius*h+yp];
	this.down = [-radius+xp, yp]
	this.downLeft = [-radius/2+xp, -radius*h+yp];
	this.downRight = [radius/2+xp, -radius*h+yp];

	this.x = x;
	this.y = y;
	this.z = z;

}