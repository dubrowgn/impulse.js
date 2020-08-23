import { ModelState } from "Model2D";
import { Matrix, Vector } from "Shape2D";
import { EventDelegate, EventedCollection } from "Util";

export const Entity = (function() {
	var Entity = function(model, position, collidable, parent, flags) {
		this.children = new EventedCollection();
		this._collidable = collidable;
		this.flags = flags === undefined ? 0 : flags;

		this._matrix = new Matrix(1, 0, 0, 1, position.x, position.y);
		this.modelState = new ModelState(model);
		this.moved = new EventDelegate();
		this.parent = parent;
        this.rotated = new EventDelegate();
	}; // class Entity

	Entity.prototype.children = undefined;
	Entity.prototype.flags = 0;
	Entity.prototype._animation = undefined;
	Entity.prototype._animationPaused = undefined;
	Entity.prototype._animationTime = undefined;
	Entity.prototype._collidable = undefined;
	Entity.prototype.modelState = undefined;
	Entity.prototype.moved = undefined; // event(Entity2D, {dx, dy})
	Entity.prototype._matrix = undefined;
	Entity.prototype.parent = undefined;
    Entity.prototype.rotated = undefined; // event(Entity2D, dRads)
	Entity.prototype._scale = 1; // FIXME???

    // void face(Entity);
    // void face(Vector);
	Entity.prototype.face = function(vec) {
        if (vec instanceof Entity)
            vec = vec.getPosition();

		var dRads = this.getPosition().angleTo(vec) - this._matrix.getRotation();
        this._matrix.preRotate(dRads);
		this.rotated.dispatch(this, dRads);
	}; // face( )

    // Shape getCollidable();
    Entity.prototype.getCollidable = function() {
        return this._collidable.clone().transform(this._matrix);
    }; // getCollidable( )

	// getAnimationState(number currentTimeMs)
	Entity.prototype.getAnimationState = function(currentTimeMs) {
		var animState = this.modelState.getAnimationState(currentTimeMs);
		animState.matrix.combine(this.getMatrix());
		return animState;
	};

	// Matrix getMatrix();
	Entity.prototype.getMatrix = function() {
		if (this.parent !== undefined)
			return this.parent.getMatrix().clone().combine(this._matrix);
		return this._matrix;
	};

	// Vector GetPosition();
	Entity.prototype.getPosition = function() {
		return new Vector(this._matrix.e, this._matrix.f);
	}; // getPosition( )

	// Number getRotation();
	Entity.prototype.getRotation = function() {
		return this._matrix.getRotation();
	}; // getRotation( )

	// void MoveForward(number);
	Entity.prototype.MoveForward = function(distance) {
		var e = {
			dx: (this._matrix.d / this._scale) * distance,
			dy: (this._matrix.b / this._scale) * distance
		};

		this._matrix.e += e.dx;
		this._matrix.f += e.dy;

		this.moved.dispatch(this, e);
	}; // MoveForward( )

	// void rotate(number);
	Entity.prototype.rotate = function(rads) {
		this._matrix.preRotate(rads);
		this.rotated.dispatch(this, rads)
	}; // rotate( )

    // void setPosition(Entity)
    // void setPosition(Vector)
    // void setPosition(Number, Number)
    Entity.prototype.setPosition = function(x, y) {
		// FIXME ???
		// seems highly suspicious that we don't take into account for scale
        if (x instanceof Entity)
            x = x.getPosition();

		var e;
        if (x instanceof Vector)
			e = { dx: x.x - this._matrix.e, dy: x.y - this._matrix.f };
		else
			e = { dx: x - this._matrix.e, dy: y - this._matrix.f };

		this._matrix.e += e.dx;
		this._matrix.f += e.dy;

		this.moved.dispatch(this, e);
	}; // setPosition( )

	// void setRotation(number);
	Entity.prototype.setRotation = function(rads) {
		var dRads = rads - this._matrix.getRotation();
        this._matrix.preRotate(dRads);
		this.rotated.dispatch(this, dRads);
	}; // setRotation( )

	// void SetScale(number);
	Entity.prototype.SetScale = function(_scale) {
		// FIXME ???
		// should probably be an event delegate for scaled...
		this._matrix.preScale(_scale / this._scale);
		this._scale = _scale;
	}; // SetScale( )

	// void StrafeRight(number);
	Entity.prototype.StrafeRight = function(_distance) {
		var e = {
			dx: (this._matrix.b / this._scale) * _distance,
			dy: (this._matrix.d / this._scale) * _distance
		};

		this._matrix.e -= e.dx;
		this._matrix.f += e.dy;

		this.moved.dispatch(this, e);
	}; // StrafeRight( )

	Entity.prototype.translate = function(dx, dy) {
		if (dx instanceof Vector) {
			this._matrix.e += dx.x;
			this._matrix.f += dx.y;
			this.moved.dispatch(this, { dx: dx.x, dy: dx.y });
		} else {
			this._matrix.e += dx;
			this._matrix.f += dy;
			this.moved.dispatch(this, { dx: dx, dy: dy });
		} // if / else
	}; // translate( )

	Entity.prototype.translateLocal = function(dx, dy) {
		var b = this._matrix.b / this._scale;
		var d = this._matrix.d / this._scale;

		var e;
		if (dx instanceof Vector)
			e = {
				dx: (d * dx.y) - (b * dx.x),
				dy: (b * dx.y) + (d * dx.x)
			};
		else
			e = {
				dx: (d * dy) - (b * dx),
				dy: (b * dy) + (d * dx)
			};

		this._matrix.e += e.dx;
		this._matrix.f += e.dy;

		this.moved.dispatch(this, e);
	}; // translateLocal( )

	return Entity;
})();
