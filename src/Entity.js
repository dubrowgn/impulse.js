Impulse.Entity = (function() {
	// imports
	var Circle = Impulse.Shape2D.Circle;
	var Matrix = Impulse.Shape2D.Matrix;
	var Vector = Impulse.Shape2D.Vector;

	var Entity = function(_model, _position, _radius) {
		this.radius = _radius;

		this.SetModel(_model);
		this.m_matrix = new Matrix();
		this.m_matrix.preTranslate(_position);
	}; // class Entity

	// -----------------------------------------------------------------------------
	//	class members
	// -----------------------------------------------------------------------------

	Entity.prototype.flags = 0;
	Entity.prototype.m_animation;
	Entity.prototype.m_animationPaused;
	Entity.prototype.m_animationStart;
	Entity.prototype.m_animationTime;
	Entity.prototype.m_model;
	Entity.prototype.m_matrix;
	Entity.prototype.m_scale = 1;
	Entity.prototype.radius;

	// -----------------------------------------------------------------------------
	//	class functions
	// -----------------------------------------------------------------------------

	// void FacePosition(Vector2D);
	Entity.prototype.FacePosition = function(_pnt) {
		this.SetRotation(this.GetPosition().angleTo(_pnt));
	}; // FacePosition( )

	// --------------------------------------

	// Circle GetBoundingCircle(number);
	Entity.prototype.GetBoundingCircle = function() {
		return new Circle(this.m_matrix.e, this.m_matrix.f, this.radius);
	}; // GetBoundingCircle( )

	// --------------------------------------

	// Rect GetFrameRect(number);
	Entity.prototype.GetFrameRect = function(_timeMs) {
		if (this.m_animation == undefined)
			return undefined;

		if (this.m_animationPaused == true)
			return this.m_animation.getFrameRect(this.m_animationTime);
		return this.m_animation.getFrameRect(_timeMs - this.m_animationStart);
	}; // GetFrameRect( )

	// --------------------------------------

	// Image GetModelImage();
	Entity.prototype.getModelImage = function() {
		return this.model.image;
	}; // GetRenderMatrix( )

	// --------------------------------------

	// Vector2D GetPosition();
	Entity.prototype.GetPosition = function() {
		return new Vector(this.m_matrix.e, this.m_matrix.f);
	}; // GetPosition( )

	// --------------------------------------

	// Matrix2D GetRenderMatrix();
	Entity.prototype.GetRenderMatrix = function() {
		if (this.m_animation == undefined)
			return undefined
		return this.m_animation.matrix.clone().combine(this.m_matrix);
	}; // GetRenderMatrix( )

	// --------------------------------------

	// bool IsPaused();
	Entity.prototype.IsAnimationPaused = function() {
		return this.m_animationPaused;
	}; // IsPaused( )

	// --------------------------------------

	// void MoveForward(number);
	Entity.prototype.MoveForward = function(_distance) {
		this.m_matrix.e += (this.m_matrix.d / this.m_scale) * _distance;
		this.m_matrix.f += (this.m_matrix.b / this.m_scale) * _distance;
	}; // MoveForward( )

	// --------------------------------------

	// void PauseAnimation();
	Entity.prototype.PauseAnimation = function() {
		this.m_animationTime = (new Date() | 0) - this.m_animationStart;
		this.m_animationPaused = true;
	}; // PauseAnimation( )

	// --------------------------------------

	// void ResumeAnimation();
	Entity.prototype.ResumeAnimation = function() {
		this.m_animationStart = (new Date() | 0) - this.m_animationTime;
		this.m_animationPaused = false;
	}; // ResumeAnimation( )

	// --------------------------------------

	// void Rotate(number);
	Entity.prototype.Rotate = function(_rads) {
		this.m_matrix.preRotate(_rads);
	}; // Rotate( )

	// --------------------------------------

	// void SetAnimation(AnimationType);
	Entity.prototype.SetAnimation = function(_animType) {
		this.m_animation = this.model.animations[_animType];
		this.m_animationStart = new Date() | 0;
	}; // SetAnimation( )

	// --------------------------------------

	// void SetModel(Model);
	Entity.prototype.SetModel = function(_model) {
		this.model = _model;
	}; // setModel( )

	// --------------------------------------

	// void SetPosition(Vector2D);
	Entity.prototype.SetPosition = function(_pnt) {
		this.m_matrix.e = _pnt.x;
		this.m_matrix.f = _pnt.y;
	}; // SetPosition( );

	// --------------------------------------

	// void SetPositionXY(number, number);
	Entity.prototype.SetPositionXY = function(_x, _y) {
		this.m_matrix.e = _x;
		this.m_matrix.f = _y;
	}; // SetPositionXY( );

	// --------------------------------------

	// void SetRotation(number);
	Entity.prototype.SetRotation = function(_rads) {
		var cos = Math.cos(_rads);
		var sin = Math.sin(_rads);

		this.m_matrix.a = cos * this.m_scale;
		this.m_matrix.b = sin * this.m_scale;
		this.m_matrix.c = -sin * this.m_scale;
		this.m_matrix.d = cos * this.m_scale;
	}; // SetRotation( )

	// --------------------------------------

	// void SetScale(number);
	Entity.prototype.SetScale = function(_scale) {
		this.m_matrix.preScale(_scale / this.m_scale);
		this.m_scale = _scale;
	}; // SetScale( )

	// --------------------------------------

	// void StrafeRight(number);
	Entity.prototype.StrafeRight = function(_distance) {
		this.m_matrix.e -= (this.m_matrix.b / this.m_scale) * _distance;
		this.m_matrix.f += (this.m_matrix.d / this.m_scale) * _distance;
	}; // StrafeRight( )

	return Entity;
});
