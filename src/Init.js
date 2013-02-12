// Init Impulse in the correct order
Impulse.Networking = Impulse.Networking();
Impulse.Util = Impulse.Util();
Impulse.Shape2D = Impulse.Shape2D();
Impulse.Input = Impulse.Input(); // depends Shape2D
Impulse.Model2D = Impulse.Model2D(); // depends Shape2D, Util
Impulse.Entity = Impulse.Entity(); // depends Model2D
Impulse.Scene2D = Impulse.Scene2D(); // depends Entity, Input, Shape2D
