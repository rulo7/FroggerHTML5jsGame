game = function() { 

	var Q = Quintus({development: true, audioSupported: [ 'ogg' ] })
	.include("Audio,Sprites,TMX,Anim,UI,Input,Touch,Scenes,2D")
	.setup({width: 320, height: 480})
	.controls()
	.enableSound()
	.touch();

	Q.animations("marioR",{
		run_right: {frames: [0,1,2,0], rate: 1/10, loop: false}
	});

	Q.animations("marioL",{
		run_left: {frames: [0,1,2,0], rate: 1/10, loop: false}
	});

	Q.component("fireBallsSpawner",{
		

		added: function(){
			
			this.entity.on("step",this,"step");
			Q.input.on("fire",this.entity,"fire");

			this.readyFire = true;
			this.reloadFire = 0.25;
			this.timeCurrent = 0.25;
		},

		extend: {
			fire: function(){
				if(this.fireBallsSpawner.readyFire){
					this.stage.insert(new Q.FireBall({direction: this.p.direction, x: this.p.x, y: this.p.y}));
					this.fireBallsSpawner.readyFire = false;
				}
			}
		},

		step: function(dt) {
			if(this.timeCurrent <= 0){
				this.readyFire = true;
				this.timeCurrent = this.reloadFire;
			}else{
				this.timeCurrent -= dt;
			}
		}
	});

	Q.Sprite.extend("FireBall",{
		init: function(p) {		
			this._super(p, {
				asset: "fireball.gif",
				vy: 250,
				sensor: true,
				fuel: 400
			});
			this.add("2d, tween");
			this.on("hit",this,"kill");

			if(this.p.direction == "left"){
				this.p.x -= 25;
				this.p.vx = -250;
			}else{
				this.p.x += 25;
				this.p.vx = 250;
			}

			this.rotate();
		},
		step: function(dt){
			if(this.p.vy == 0){
				this.p.vy = -250
			}			
			if(this.p.fuel <= 0){
				this.destroy();
			}else{
				this.p.fuel -= Math.abs(this.p.vx * dt);
			}
		},
		rotate: function(){
			this.animate({angle:this.p.angle + 180}, 0.25, Q.Easing.Linear, {callback: this.rotate});
		},
		kill: function(collision){
			if(collision.obj.p.type == Q.SPRITE_ENEMY){
				collision.obj.die();
				this.destroy();
			}else if(this.p.vx == 0){
				this.destroy();
			}
		}
	});
	
	Q.Sprite.extend("Mario",{
		init: function(p) {
		
			this._super(p, {
				sheet: "marioR",
				frame: 0,
				x: 150,
				y: 380,
				jumpSpeed: -600,
			});

			this.add("2d, platformerControls, animation, fireBallsSpawner");
			this.on("bump.bottom",this,"stomp");
			this.on("die", this, "die");
		},

		step: function(dt) {
			if(this.p.y >Q.height + Q.height /2){
				this.die();
			}else if (this.p.vy != 0) {
				if(this.p.direction == "right"){
					this.p.sheet = "marioJumpR";
				}else{
					this.p.sheet = "marioJumpL";
				}
			}else if(this.p.vx > 0){			
					this.p.sheet = "marioR",
					this.p.sprite = "marioR";
					this.play("run_right");			
			}else if(this.p.vx < 0){				
					this.p.sheet = "marioL",
					this.p.sprite = "marioL";
					this.play("run_left");
			}else{
				if(this.p.direction == "right"){
					this.p.sheet = "marioR";
				}else{
					this.p.sheet = "marioL";
				}
			}
		},

		stomp: function(collision){
			if(collision.obj.p.type == Q.SPRITE_ENEMY){
				collision.obj.die();
				this.p.vy = -500;
			}
		},

		die: function(){
			this.step = null;
			this.del("platformerControls");
			Q.input.off("fire");
			this.p.sheet = "marioDie";
			this.p.gravity = 0;
			this.p.vy = -100;

			Q.audio.stop("music_main.ogg");
			Q.audio.play("music_die.ogg");
			

			if(Q.state.get("lives") == 1){
				Q.state.dec("lives",1);
				Q.stageScene("endGame", 2, {label: "Game over"});		
			}else{
				Q.state.dec("lives",1);
				Q.stageScene("endGame", 2, {label: "You die"});	
			}
		}
	});

	

	Q.component("defaultEnemy",{
		added: function(){
			this.entity.on("destroy", this.entity, function(){this.destroy();});
			this.entity.p.type = Q.SPRITE_ENEMY;
		},
		extend: {
			kill: function(collision){
				if(collision.obj.isA("Mario")){
					collision.obj.die();
				}
			},
			die: function(){
				Q.audio.play("kill_enemy.ogg");
				this.p.sheet= this.p.dieSheet,
				this.p.sprite = this.p.dieSprite;
				this.play(this.p.dieAnimation,1);
			}
		}

	});


	Q.animations("goomba",{
		goomba_move: {frames: [0,1], rate: 1/5}
	});

	Q.animations("goombaDie",{
		goomba_die: {frames: [0], rate: 1/2, loop: false, trigger: "destroy"}
	});

	Q.Sprite.extend("Goomba",{
		init: function(p) {
		
			this._super(p, {
				sprite: "goomba",
				sheet: "goomba",
				dieSheet: "goombaDie",
				dieSprite: "goombaDie",
				dieAnimation: "goomba_die",
				frame: 0,
				x: 320,
				y: 380,
				vx: 100
			});

			this.add("2d, aiBounce, animation, defaultEnemy");
			this.on("bump.bottom,bump.left,bump.right",this,"kill");

			this.play("goomba_move");
		}

	});

	Q.animations("bloopa",{
		bloopa_move: {frames: [0,1], rate: 1/2}
	});

	Q.animations("bloopaDie",{
		bloopa_die: {frames: [0], rate: 1/2, loop: false, trigger: "destroy"}
	});

	Q.Sprite.extend("Bloopa",{
		init: function(p) {
		
			this._super(p, {
				sprite: "bloopa",
				sheet: "bloopa",
				dieSheet: "bloopaDie",
				dieSprite: "bloopaDie",
				dieAnimation: "bloopa_die",
				frame: 0,
				x: 520,
				y: 380,
				vy: 200,
				gravityY: 200
			});

			this.add("2d, animation, defaultEnemy");
			this.on("bump.bottom,bump.left,bump.right",this,"kill");

			this.play("bloopa_move");
		},

		step: function(dt){
			if(this.p.vy == 0){
				this.p.vy = -200;
			}

		}

	});

	Q.component("fireSpawner",{

		added: function(){
			this.entity.on("fire",this.entity,"fire");
		},

		extend: {
			fire: function(){
				this.stage.insert(new Q.Fire({direction: this.p.direction, x: this.p.x, y: this.p.y}));
			}
		}
	});

	Q.Sprite.extend("Fire",{
		init: function(p) {		
			this._super(p, {
				asset: "bowser_fireball.gif",
				sensor: true,
				gravityY : 0,
				fuel: 300
			});
			this.add("2d");
			this.on("hit",this,"kill");

			this.p.y -= 10;
			if(this.p.direction == "left"){
				this.p.x -= 50;
				this.p.vx = -250;
			}else{
				this.p.x += 50;
				this.p.vx = 250;
			}
		},
		
		step: function(dt){
			if(this.p.fuel <= 0){
				this.destroy();
			}else{
				this.p.fuel -= Math.abs(this.p.vx * dt);
			}
		},
		
		kill: function(collision){
			if(collision.obj.isA("Mario")){
				collision.obj.die();
				this.destroy();
			}else if(this.p.vx == 0){
				this.destroy();
			}
		}
	});

	Q.animations("bowser",{
		bowser_fire: {frames: [0,1,2,3], rate: 1/2, loop:false, trigger: "shoot"},
	});

	Q.animations("bowserDie",{
		bowser_die: {frames: [0], rate: 1/2, loop: false, trigger: "destroy"}
	});

	Q.Sprite.extend("Bowser",{
		init: function(p) {
		
			this._super(p, {
				sprite: "bowser",
				sheet: "bowserL",
				direction: "left",
				dieSheet: "bowserL",
				dieSprite: "bowserDie",
				dieAnimation: "bowser_die",
				frame: 0,
				x: 720,
				y: 380,
			});

			this.add("2d, animation, defaultEnemy, fireSpawner");
			this.on("bump.bottom,bump.left,bump.right",this,"kill");
			this.on("shoot", this, "shoot");
			this.play("bowser_fire");
		},

		shoot: function(){
			this.fire();
			this.play("bowser_fire");
		}

	});

	Q.Sprite.extend("Princess",{
		init: function(p) {
		
			this._super(p, {
				asset: "princess.png",
				x: 1040,
				y: 380,
				type: Q.SPRITE_FRIENDLY
			});

			this.add("2d");
			this.on("hit",this,"win");
		},

		win: function(collision){
			if(collision.obj.isA("Mario")){
				Q.audio.stop("music_main.ogg");
				Q.audio.play("music_level_complete.ogg");
				Q.stage().pause();
				Q.state.set("lives",0);
				Q.stageScene("endGame", 1, {label: "You win"});
			}
		}

	});

	Q.animations("coin",{
		coin_transition: {frames: [0,1,2], rate: 1/3}
	});

	Q.Sprite.extend("Coin",{
		init: function(p){
			this._super(p, {
				sprite: "coin",
				sheet: "coin",
				frame: 2,
				gravityY: 0,
				sensor: true
			});

			this.add("tween, animation");
			this.on("hit",this,"getCoin");

			this.play("coin_transition");
		},

		getCoin: function(collision){
			if(collision.obj.isA("Mario")){
				Q.audio.play("coin.ogg");
				this.off("hit");
				this.animate({x: this.p.x, y: this.p.y - 50, angle:360}, 0.5, Q.Easing.Quadratic.Out, {callback: function(){this.destroy();}});
			
				Q.state.inc("coins",1);
			}
		}

	});

	Q.scene("level1", function(stage) {

		Q.loadTMX("level.tmx",function(){
			Q.stageTMX("level.tmx",stage);

			Q.state.set("coins", 0);

			Q.stageScene("HUD",1);

			var player = stage.insert(new Q.Mario());		
			stage.insert(new Q.Goomba());	
			stage.insert(new Q.Bloopa());	
			stage.insert(new Q.Goomba({x:1300,y:400}));	
			stage.insert(new Q.Bowser({x:1770,y:400}));	
			stage.insert(new Q.Princess({x:2000,y:400}));	
			stage.insert(new Q.Coin({x:750,y:420}));	
			stage.insert(new Q.Coin({x:800,y:420}));	
			stage.insert(new Q.Coin({x:850,y:420}));	
			stage.insert(new Q.Coin({x:900,y:420}));	
			stage.insert(new Q.Coin({x:950,y:420}));	
			stage.insert(new Q.Coin({x:750,y:380}));	
			stage.insert(new Q.Coin({x:800,y:380}));	
			stage.insert(new Q.Coin({x:850,y:380}));	
			stage.insert(new Q.Coin({x:900,y:380}));	
			stage.insert(new Q.Coin({x:950,y:380}));	

			stage.add("viewport");
			stage.centerOn(160,340);
			stage.follow(player, {x: true, y : false});
			stage.viewport.offsetX = -100;
		});

	});

	Q.UI.Text.extend("CoinsPanel",{
		init: function(p){
			
			this._super({
				x: Q.width - 50, 
				y: 10, 
				label: Q.state.get("coins").toString()
			});

			Q.state.on("change.coins",this,"setCoins");
		},

		setCoins: function(coins){
			this.p.label = coins.toString();
		}
	
	});

	Q.UI.Text.extend("LivesPanel",{
		init: function(p){
			
			this._super({
				x: 50, 
				y: 10, 
				label: "lives: " + Q.state.get("lives").toString()
			});

			Q.state.on("change.lives",this,"setLives");
		},

		setLives: function(lives){
			this.p.label = "lives: " + lives.toString();
		}
	
	});

	Q.scene("HUD", function(stage) {

		stage.insert(new Q.CoinsPanel());
		stage.insert(new Q.Sprite({x:Q.width - 78, y:20, sheet:"coin", frame: 2}));
		stage.insert(new Q.LivesPanel());

	});

	Q.scene("endGame", function(stage) {

		var container = stage.insert(new Q.UI.Container({x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"}));
		var button = container.insert(new Q.UI.Button({x: 0, y: 0, fill:  "#CCCCCC", label: "Play again", keyActionName: "confirm"}));
		container.insert(new Q.UI.Text({x: 10, y: -10 - button.p.h, label: stage.options.label}));

		button.on("click", function(){
			Q.clearStages();
			Q.audio.stop();
			Q.audio.play("music_main.ogg",{ loop: true });
			if(Q.state.get("lives") == 0){
				Q.stageScene("mainMenu");
			}else{
				Q.stageScene("level1");
			}
		});


		container.fit(20);

	});

	Q.scene("mainMenu", function(stage) {
		var container = stage.insert(new Q.UI.Container({x: 0, y: 0}));
		var button = container.insert(new Q.UI.Button({x: Q.width/2, y: Q.height/2, asset: "mainTitle.png", keyActionName: "confirm"}));
		button.on("click", function(){
			Q.state.reset({coins:0, lives:3});
			Q.clearStages();
			Q.stageScene("level1");
		});
	});

	Q.load("kill_enemy.ogg,music_level_complete.ogg, music_die.ogg, music_main.ogg, coin.ogg, bowser_fireball.gif, bowser.png, bowser.json,fireball.gif, mainTitle.png, princess.png, mario_small.png, mario_small.json, goomba.png, goomba.json, bloopa.png, bloopa.json, coin.png, coin.json",function() {
		Q.compileSheets("mario_small.png", "mario_small.json");
		Q.compileSheets("goomba.png", "goomba.json");
		Q.compileSheets("bloopa.png", "bloopa.json");
		Q.compileSheets("bowser.png", "bowser.json");
		Q.compileSheets("coin.png", "coin.json");
		Q.audio.play("music_main.ogg",{ loop: true });
        Q.stageScene("mainMenu");
    });

};
