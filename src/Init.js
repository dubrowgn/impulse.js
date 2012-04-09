// Init Impulse in the correct order
Impulse.EventDelegate = Impulse.EventDelegate();
Impulse.Input = Impulse.Input(); // depends EventDelegate
Impulse.Shape2D = Impulse.Shape2D();
Impulse.Model2D = Impulse.Model2D(); // depends Shape2D
Impulse.Entity = Impulse.Entity(); // depends Model2D
Impulse.Scene2D = Impulse.Scene2D(); // depends Entity, Input, Shape2D