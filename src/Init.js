// Init Impulse in the correct order
Impulse.Input = Impulse.Input();
Impulse.EventDelegate = Impulse.EventDelegate();
Impulse.Shape2D = Impulse.Shape2D();
Impulse.Model2D = Impulse.Model2D(); // depends Shape2D
Impulse.Entity = Impulse.Entity(); // depends Model2D
Impulse.Scene2D = Impulse.Scene2D(); // depends Entity, Shape2D