import { Circle } from "./circle";
import { IShape, ShapeId } from "./shape";
import { Vector } from "./vector";

export const Polygon = (function() {
	// Polygon(Polygon);
	// Polygon(Array<Vector>);
	var Polygon = function(polygon) {
		if (polygon instanceof Polygon) {
			if (polygon._center !== undefined)
				this._center = polygon._center.clone();
			this._r = polygon._r;
			polygon = polygon._vertices;
		} // if

		// make sure there are at least 3 vertices
		if (polygon.length < 3)
			throw "Cannot construct polygon with fewer than 3 vertices!";

		// deep copy vertex array
		this._vertices = [];
		for (var i = 0; i < polygon.length; i++) {
			this._vertices.push(new Shape2D.Vector(polygon[i]));
		} // for( i )
	}; // class Polygon

	Polygon.prototype = new IShape();
	Polygon.prototype._center = undefined;
	Polygon.prototype._r = -1;
	Polygon.prototype._vertices = undefined;

	// Polygon applyTransform();
	Polygon.prototype.applyTransform = function(matrix) {
		for (var i = 0; i < this._vertices.length; i++) {
			this._vertices[i].applyTransform(matrix);
		} // for( i )

		// invalidate caches
		this._center = undefined;
		this._r = -1;

		return this;
	}; // applyTransform

	Polygon.prototype.clone = function() {
		return new Polygon(this);
	}; // clone( )

	Polygon.prototype.equals = function(polygon) {
		if (!(polygon instanceof Polygon) || this._vertices.length != polygon._vertices.length)
			return false;

		for (var i = 0; i < this._vertices.length; i++) {
			if (!this._vertices[i].equals(polygon._vertices[i]))
				return false;
		} // for( i )

		return true;
	}; // equals( )

	Polygon.prototype.getBoundingCircle = function() {
		return new Shape2D.Circle(this.getCenter(), this._getRadius());
	};

	Polygon.prototype.getCenter = function() {
		if (this._center === undefined) {
			var x = 0;
			var y = 0;

			for (var i = 0; i < this._vertices.length; i ++) {
				x += this._vertices[i].x;
				y += this._vertices[i].y;
			} // for( i )

			this._center = new Shape2D.Vector(x / this._vertices.length, y / this._vertices.length);
		} // if

		return this._center.clone();
	}; // getCenter( )

	// Number _getRadius();
	Polygon.prototype._getRadius = function() {
		if (this._r === -1) {
			var c = this.getCenter();
			var r = 0;
			var tmp;
			var v;
			for (var i = 0; i < this._vertices.length; i++) {
				v = this._vertices[i];
				tmp = (v.x - c.x) * (v.x - c.x) + (v.y - c.y) * (v.y - c.y);
				if (tmp > r)
					r = tmp;
			} // for( i )

			// update cached radius
			this._r = Math.sqrt(r);
		} // if

		return this._r;
	}; // _getRadius( )

	// Number getShapeID();
	Polygon.prototype.getShapeID = function() {
		return ShapeId.Polygon;
	}; // getShapeID( )

	// Array<Vector> getVertices();
	Polygon.prototype.getVertices = function() {
		return this._vertices.slice();
	}; // getVertices( )

	// Polygon setCenter(Number, Number);
	// Polygon setCenter(Vector);
	Polygon.prototype.setCenter = function(x, y) {
		// calculate offset from old center
		var offset = this.getCenter();
		if (x instanceof Shape2D.Vector) {
			offset.x = x.x - offset.x;
			offset.y = x.y - offset.y;
			
			// update cached center point
			this._center = x;
		} else {
			offset.x = x - offset.x;
			offset.y = y - offset.y;
			
			// update cached center point
			this._center = new Shape2D.Vector(x, y);
		} // else

		// update polygon vertices with new offset
		for (var i = 0; i < this._vertices.length; i++) {
			this._vertices[i].x += offset.x;
			this._vertices[i].y += offset.y;
		} // for( i )

		return this;
	}; // setCenter( )

	Polygon.prototype.toString = function() {
		var s = "Polygon(";

		for (var i = 0; i < this._vertices.length; i++) {
			s += "<" + this._vertices[i].x + "," + this._vertices[i].y + ">,"
		} // for( i )

		return s.replace(/,$/, "") + ")";
	}; // toString( )

	return Polygon;
})();
