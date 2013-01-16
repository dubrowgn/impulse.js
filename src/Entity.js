Impulse.Entity = (function() {

	// imports
	var EventDelegate = Impulse.Util.EventDelegate;
	var Matrix = Impulse.Shape2D.Matrix;
	var Vector = Impulse.Shape2D.Vector;

	var Entity = function(model, position, collidable) {
		this._collidable = collidable;

		this.setModel(model);
		this._matrix = new Matrix(1, 0, 0, 1, position.x, position.y);
		this.moved = new EventDelegate();
        this.rotated = new EventDelegate();
	}; // class Entity

	Entity.prototype.flags = 0;
	Entity.prototype._animation = undefined;
	Entity.prototype._animationPaused = undefined;
	Entity.prototype._animationTime = undefined;
	Entity.prototype._collidable = undefined;
	Entity.prototype._model = undefined;
	Entity.prototype.moved = undefined;
	Entity.prototype._matrix = undefined;
    Entity.prototype.rotated = undefined;
	Entity.prototype._scale = 1; // FIXME???

    // void face(Entity);
    // void face(Vector);
	Entity.prototype.face = function(vec) {
        if (vec instanceof Entity)
            vec = vec.getPosition();

        this._matrix.preRotate(this.getPosition().angleTo(_pnt) - this._matrix.getRotation());
	}; // face( )

    // Shape getCollidable();
    Entity.prototype.getCollidable = function() {
        // FIXME ??? this assumes the collidable should be transformed
        return this._collidable.clone().applyTransform(this._matrix);
    }; // getCollidable( )

	// Rect getFrameRect(Number);
	Entity.prototype.getFrameRect = function(timeDeltaMs) {
        // make sure we have an animation assigned
		if (this._animation === undefined)
			return undefined;

        // only advance animation time if the animation isn't paused
        if (!this._animationPaused)
            this._animationTime += timeDeltaMs;

        // finally, calculate the new frame rectangle
        return this._animation.getFrameRect(this._animationTime);
	}; // getFrameRect( )

	// Image GetModelImage();
	Entity.prototype.getModelImage = function() {
		return this._model.image;
	}; // GetRenderMatrix( )

	// Vector GetPosition();
	Entity.prototype.getPosition = function() {
		return new Vector(this._matrix.e, this._matrix.f);
	}; // getPosition( )

	// Matrix getRenderMatrix();
	Entity.prototype.getRenderMatrix = function() {
        // make sure we have an animation assigned
		if (this._animation == undefined)
			return undefined;

        // return combined animation matrix and entity matrix
		return this._animation.matrix.clone().combine(this._matrix);
	}; // getRenderMatrix( )

	// Number getRotation();
	Entity.prototype.getRotation = function() {
		return this._matrix.getRotation();
	}; // getRotation( )

	// bool isAnimationPaused();
	Entity.prototype.isAnimationPaused = function() {
		return this._animationPaused;
	}; // isAnimationPaused( )

	// void MoveForward(number);
	Entity.prototype.MoveForward = function(_distance) {
		this._matrix.e += (this._matrix.d / this._scale) * _distance;
		this._matrix.f += (this._matrix.b / this._scale) * _distance;
	}; // MoveForward( )

    Entity.prototype._onMove = function(oldPosition, newPosition) {
        var e = {
            dx: newPosition.x - oldPosition.x,
            dy: newPosition.y - oldPosition.y
        };
        this.moved.dispatch(this, e);
    }; // _onMove( )

    Entity.prototype._onRotate = function(oldRotation, newRotation) {
        var e = {
            rotationDelta: newRotation - oldRotation
        };
        this.rotated.dispatch(this, e);
    }; // _onRotate( )

	// void pauseAnimation();
	Entity.prototype.pauseAnimation = function() {
		this._animationPaused = true;
	}; // pauseAnimation( )

	// void resumeAnimation();
	Entity.prototype.resumeAnimation = function() {
		this._animationPaused = false;
	}; // resumeAnimation( )

	// void rotate(number);
	Entity.prototype.rotate = function(_rads) {
		this._matrix.preRotate(_rads);
	}; // rotate( )

	// void setAnimation(AnimationType);
	Entity.prototype.setAnimation = function(_animType) {
		this._animation = this._model.animations[_animType];
		this._animationTime = 0;
	}; // setAnimation( )

	// void setModel(Model);
	Entity.prototype.setModel = function(_model) {
		this._model = _model;
        this._animation = undefined;
	}; // setModel( )

    // void setPosition(Entity)
    // void setPosition(Vector)
    // void setPosition(Number, Number)
    Entity.prototype.setPosition = function(x, y) {
        if (x instanceof Entity)
            x = x.getPosition();

        if (x instanceof Vector) {
            this._matrix.e = x.x;
            this._matrix.f = x.y;
        } else {
            this._matrix.e = x;
            this._matrix.f = y;
        } // if / else
	}; // setPosition( )

	// void setRotation(number);
	Entity.prototype.setRotation = function(rads) {
        this._matrix.preRotate(rads - this._matrix.getRotation());
	}; // setRotation( )

	// void SetScale(number);
	Entity.prototype.SetScale = function(_scale) {
		this._matrix.preScale(_scale / this._scale);
		this._scale = _scale;
	}; // SetScale( )

	// void StrafeRight(number);
	Entity.prototype.StrafeRight = function(_distance) {
		this._matrix.e -= (this._matrix.b / this._scale) * _distance;
		this._matrix.f += (this._matrix.d / this._scale) * _distance;
	}; // StrafeRight( )

	Entity.prototype.translate = function(dx, dy) {
		if (dx instanceof Vector) {
			this._matrix.e += dx.x;
			this._matrix.f += dx.y;
		} else {
			this._matrix.e += dx;
			this._matrix.f += dy;
		} // if / else
	}; // translate( )

	Entity.prototype.translateLocal = function(dx, dy) {
		var b = this._matrix.b / this._scale;
		var d = this._matrix.d / this._scale;

		if (dx instanceof Vector) {
			this._matrix.e += (d * dx.y) - (b * dx.x);
			this._matrix.f += (b * dx.y) + (d * dx.x);
		} else {
			this._matrix.e += (d * dy) - (b * dx);
			this._matrix.f += (b * dy) + (d * dx);
		} // if / else
	}; // translateLocal( )

	return Entity;
});
