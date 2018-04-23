var MYLIB = {};
(function () {
	
	/*
	**VARIABLES
	*/
	
	var canvas;
	var context;
	
	var lastTime;
	var deltaTime;
	
	var startFunctions = [];
	var updateFunctions = [];
	
	//remember booleans are values not references
	var runSpontaneously = true;
	
	//var functions = [];
	
	var objects = [];
	
	var paused = false;
	var running = false;
	
	//only run setup once stuff is finished 
	if (document.readyState === 'complete') {
		if (MYLIB.runSpontaneously === true) {
			run();
		}
	} else {
		//window.addEventListener('load', thisStart);
		document.addEventListener('DOMContentLoaded', function() {
			if (MYLIB.runSpontaneously === true) {
				run();
			}
		});
	}
	
	function setup(scene) {
		//createCanvas();
		
		//parse all scripts
		if (scene !== undefined) {
			for (var i=0;i<scene.scripts.length;i++) {
				parseScript(scene.scripts[i], scene);
			}
			
			var sceneChildren = scene.getAllDescendents();
			for (var i=0;i<sceneChildren.length;i++) {
				for (var j=0;j<sceneChildren[i].scripts.length;j++) {
					console.log(i, j);
					parseScript(sceneChildren[i].scripts[j], sceneChildren[i]);
				}
			}
		//run through all objects
		} else {
			
			for (var i=0;i<objects.length;i++) {
				for (var j=0;j<objects[i].scripts.length;j++) {
					parseScript(objects[i].scripts[j], objects[i]);
				}
			}
		}
		
		for(var i=0;i<startFunctions.length;i++) {
			startFunctions[i]();
		}
		animate();
	}

	function run(scene) {
		running = true;
		if (paused === true) {
			paused = false;
			animate();
		} else {
			setup(scene);
		}
	}
	
	function pause() {
		paused = true;
		running = false;
	}
	
	function stop() {
		paused = false;
		running = false;
		startFunctions = [];
		updateFunctions = [];
	}
	
	function createCanvas(width=window.innerWidth, height=window.innerHeight) {
		canvas = document.createElement("CANVAS");	
		context = canvas.getContext("2d");
		
		MYLIB.canvas = canvas;
		MYLIB.context = context;
		
		canvas.width = width;
		canvas.height = height;
		
		//removes scroll bar from fullscreen canvas
		canvas.style.display = "block";
		document.body.style.margin = 0;
		
		document.body.appendChild(canvas);
	}
	
	function setCanvas(userCanvas) {
		canvas = userCanvas;
		context = canvas.getContext("2d");
		
		MYLIB.canvas = canvas;
		MYLIB.context = context;
	}
	
	function parseScript(script, object) {
		//run through code and add functions
		console.log(script);
		var functions = (new Function("var start, update;" + script.code + ';return {start: start, update: update};//# sourceURL=' + script.name))();
		if (functions.start !== undefined) {
			startFunctions.push(functions.start.bind(object));
		}
		if (functions.update !== undefined) {
			updateFunctions.push(functions.update.bind(object));
		}
	}
	
	function animate() {
		for (var i=0;i<updateFunctions.length;i++) {
			updateFunctions[i]();
		}
		if (paused === false && running === true) {
			requestAnimationFrame(animate);
		}
	}
	
	
	
	/*
	**CLASSES
	*/

	class BaseObject {
		constructor(x, y) {
			this.x = x;
			this.y = y;
			this.rotation = 0;
			
			this.name = this.constructor.name;
			
			this.isBaseObject = true;
			
			this.parent = null;
			this.children = [];
			this.scripts = [];
			objects.push(this);
		}
		
		rotate(amount) {
			this.rotation += amount;
		}
		
		add(...objects) {
			for (var i=0;i<objects.length;i++) {
				if (objects[i].parent !== undefined && objects[i].parent !== null) {
					objects[i].parent.remove(objects[i]);
				}
				objects[i].parent = this;
				this.children.push(objects[i]);
				
			}
		}
		
		remove(...objects) {
			for (var i=0;i<objects.length;i++) {
				for (var j=0;j<this.children.length;j++) {
					if (objects[i]===this.children[j]) {
						this.children.splice(j, 1);
						objects[i].parent = null;
					}
				}
			}
		}
		
		clone() {
			var copy;

			copy = new this.constructor();
			
			copy.name = this.name;
			copy.parent = this.parent;
			copy.rotation = this.rotation;
			copy.scripts = this.scripts;
			copy.x = this.x;
			copy.y = this.y;
			if (this.isRectangle === true) {
				copy.width = this.width;
				copy.height = this.height;
			}
			if (this.isCircle === true) {
				copy.radius = this.radius;
			}
			
			if (this.isShape === true) {
				copy.visible = this.visible;
				copy.fill = this.fill;
				copy.fillColour = this.fillColour;
				copy.stroke = this.stroke;
				copy.strokeColour = this.strokeColour;
				copy.strokeSize = this.strokeSize;
				copy.opacity = this.opacity;
			}

			for (var i=0;i<this.children.length;i++) {
				copy.add(this.children[i].clone());
			}

			
			//return Object.assign({}, this);
			return copy;
		}
		
		getAllDescendents() {
			var array = [];
			
			for (var i=0;i<this.children.length;i++) {
				getDirectDescendents(this.children[i]);
			}
			
			function getDirectDescendents(obj) {
				array.push(obj);
				
				for (var i=0;i<obj.children.length;i++) {
					getDirectDescendents(obj.children[i]);
				}
				
			}
			
			return array;
		}
		
		addParentProperties() {
			//add x, y, and rotation to child objects
			var self = this;
			
			var drawX = startProp("x");
			var drawY = startProp("y");
			var drawRot = startProp("rotation");
			
			function startProp(prop) {
				var finalProp = 0;
				
				if (self.parent !== undefined && self.parent !== null) {
					addProp(self);
				}
				
				function addProp(obj) {
					
					finalProp += obj.parent[prop];
					if (obj.parent.parent !== undefined && obj.parent.parent !== null) {
						addProp(obj.parent);
					}
				}
				return finalProp;
			}
			
			
			return {x: drawX, y: drawY, rotation: drawRot};
		}
		
		addScript(code="", name) {
			//run through code here
			//this.scripts.push(code);
			//parseScript(this.scripts[this.scripts.length-1], this);
			if (name !== undefined) {
				new Script(code, this, name);
			} else {
				new Script(code, this);
			}
		}
		
		updateScript(index=0, code) {
			if (code !== undefined) {
				this.scripts[index].code = code;
			}
			//run through code here
			//parseScript(this.scripts[index], this);
		}
	}

	class Shape extends BaseObject {
		constructor(x, y) {
			super(x, y);
			this.visible = true;
			this.fill = false;
			this.fillColour = "#FFFFFF";//white
			this.stroke = true;
			this.strokeColour = "#000000";//black
			this.strokeSize = 1;
			this.opacity = 1;
			
			this.isShape = true;
		}
	}

	class Rectangle extends Shape {
		constructor(x=0, y=0, width=20, height=20) {
			super(x, y);
			this.width = width;
			this.height = height;
			
			this.isRectangle = true;
		}
		draw() {
			//rotateContext(this.rotation);
			if (this.visible === true) {
				var parentProperties = this.addParentProperties();
				
				var drawX = this.x + parentProperties.x;
				var drawY = this.y + parentProperties.y;
				var drawRot = this.rotation + parentProperties.rotation;
				
				if (Number.isInteger(drawX)) {
					drawX += 0.5;
				}
				if (Number.isInteger(drawY)) {
					drawY += 0.5;
				}
				context.save();
				context.translate(drawX + this.width/2, drawY + this.height/2);
				context.rotate(drawRot);
				
				context.globalAlpha = this.opacity;
				
				context.beginPath();
				context.rect(-this.width/2, -this.height/2, this.width, this.height);
				context.closePath();
				if (this.stroke === true) {
					context.strokeStyle = this.strokeColour;
					context.lineWidth = this.strokeSize;
					context.stroke();
				}
				
				if (this.fill === true) {
					context.fillStyle = this.fillColour;
					context.fill();
				}
				
				context.restore();
				
				//reset opacity
				context.globalAlpha = 1;
			}
		}
		
	}
	
	class Circle extends Shape {
		constructor(x=0, y=0, radius=20) {
			super(x, y);
			this.radius = radius;
			
			this.isCircle = true;
		}
		draw() {
			if (this.visible === true) {
				
				var parentProperties = this.addParentProperties();
				
				var drawX = this.x + parentProperties.x;
				var drawY = this.y + parentProperties.y;
				var drawRot = this.rotation + parentProperties.rotation;
				//rotate circle????
				
				context.beginPath();
				context.arc(drawX, drawY, this.radius, 0, 2*Math.PI);
				
				if (this.stroke === true) {
					context.strokeStyle = this.strokeColour;
					context.lineWidth = this.strokeSize;
					context.stroke();
				}
				
				if (this.fill === true) {
					context.fillStyle = this.fillColour;
					context.fill();
				}
				
				//close path
				context.closePath();
			}
		}
	}
	
	//works but loads of cleanup to do around fixing not having parameters when called
	//images will always draw but may draw out of order if not loaded
	class _Image extends BaseObject {
		constructor(url, x, y, width, height) {
			super(x, y);
			var img = new Image(x, y);
			if (width !== undefined) {
				img.width = width;
				this.width = width;
			}
			if (height !== undefined) {
				img.height = height;
				this.height = height;
			}
			img.src = url;
			
			this.image = img;
			this.loaded = false;
			
			var self = this;
			this.image.addEventListener('load', function() {
				self.loaded = true;
			});
			
			this.isImage = true;
		}
		
		draw() {
			if (this.loaded === true) {
				if(this.rotation !== 0) {
					context.save();
					context.translate(this.x + this.width/2, this.y+this.height/2);
					context.rotate(this.rotation);
				
					context.drawImage(this.image, -this.width/2, -this.height/2, this.width, this.height);
					
					context.restore();
				} else {
					context.drawImage(this.image, this.x, this.y, this.width, this.height);
				}
			} else {
				imageLoad(this.image, this.x, this.y);
			}
		}
		
	}
	
	class Script {
		constructor(code, object, name="script" + (parseInt(object.scripts.length) + 1)) {
			this.code = code;
			this.name = name;
			this.index = parseInt(object.scripts.length);
			object.scripts.push(this);
			
			this.isScript = true;
		}
		
	}
	
	//draws image when it's loaded
	async function imageLoad(img, x, y, width, height) {
		var result = await waitForImage(img);
		context.drawImage(img, x, y, width, height);
	}
	
	function waitForImage(img) {
		return new Promise(resolve => {
			img.addEventListener('load', () => {
				resolve('loaded1');
			});
		});
	}
	
	class Scene extends BaseObject {
		constructor(x=0, y=0) {
			super(x, y);
			
			this.isScene = true;
		}
		
		draw() {
			var descendents = this.getAllDescendents();
			
			for (var i=0;i<descendents.length;i++) {
				descendents[i].draw();
			}
		}
		
		
	}
	
	/*
	**FUNCTIONS
	*/
	
	function clear() {

		// Store the current transformation matrix
		context.save();

		// Use the identity matrix while clearing the canvas
		context.setTransform(1, 0, 0, 1, 0, 0);
		context.clearRect(0, 0, canvas.width, canvas.height);

		// Restore the transform
		context.restore();
		
		context.beginPath();
		context.closePath();
	}
	
	MYLIB.runSpontaneously = runSpontaneously;
	MYLIB.BaseObject = BaseObject;
	MYLIB.Shape = Shape;
	MYLIB.Rectangle = Rectangle;
	MYLIB.Circle = Circle;
	MYLIB.Scene = Scene;
	MYLIB.Image = _Image;
	MYLIB.createCanvas = createCanvas;
	MYLIB.setCanvas = setCanvas;
	MYLIB.clear = clear;
	MYLIB.run = run;
	MYLIB.pause = pause;
	MYLIB.stop = stop;
}).call();