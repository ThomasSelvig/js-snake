/*
// TODO: replace food gen algo (don't spawn on player, also spawn multiple)

// If the snake has 4 pieces total, it can't go in a circle...
	is the snake game supposed to be like this?
*/

class FilledTile {
	constructor(x, y, color) {
		this.x = x;
		this.y = y;
		this.color = color;
	}
}

class Snake {
	constructor(x, y, board) {
		this.board = board;
		this.score = 0;
		this.pieces = [new FilledTile(x, y, "red")];
		// direction enum:  dir -> move_condition_lambda, condition success func
		this.DIRS = {
			"UP": {
				"condition": (head => {return head.y - 1 >= 0}),
				"eval": function(head) {head.y -= 1; return head;}
			},
			"DOWN": {
				"condition": (head => {return head.y + 1 < board.res.h}),
				"eval": function(head) {head.y += 1; return head;}
			},
			"LEFT": {
				"condition": (head => {return head.x - 1 >= 0}),
				"eval": function(head) {head.x -= 1; return head;}
			},
			"RIGHT": {
				"condition": (head => {return head.x + 1 < board.res.w}),
				"eval": function(head) {head.x += 1; return head;}
			}
		};
		this.dir = this.DIRS.UP;

		// to update walking dir
		var key_dir_map = {
			"w": this.DIRS.UP,
			"s": this.DIRS.DOWN,
			"a": this.DIRS.LEFT,
			"d": this.DIRS.RIGHT
		};
		document.addEventListener("keydown", (e => {
			if (e.key in key_dir_map) {
				this.dir = key_dir_map[e.key];
			}
		}));
	}

	move() {
		if (this.dir.condition(this.pieces[0])) {
			this.pieces[0] = this.dir.eval(this.pieces[0]);
			return true;
		}
		return false;
	}

	tail_collision() {
		var head = this.pieces[0];
		for (var piece of this.pieces.slice(1)) {
			if (piece.x == head.x && piece.y == head.y) {
				return true;
			}
		}
		return false;
	}
}

class Board {
	place_food() {
		function randint(range_max_excl) {
			return Math.floor(Math.random() * Math.floor(range_max_excl))
		}
		this.food_tiles.push(
			new FilledTile(
				randint(this.res.w),
				randint(this.res.h),
				"yellow"
			)
		);
		console.log(this.food_tiles);
	}

	constructor(width, height, canvas) {
		this.ctx = canvas.getContext("2d");

		this.res = {"w": width, "h": height}
		this.dims = {"w": canvas.width, "h": canvas.height}
		this.cell_dims = {
			"w": canvas.width / width,
			"h": canvas.height / height
		};

		// start with a single random food item

		this.food_tiles = [];
		this.player = new Snake(Math.floor(width / 2), Math.floor(height / 2), this);

		this.place_food()
	}

	render() {
		// render background
		this.ctx.fillStyle = "black";
		this.ctx.fillRect(0, 0, this.dims.w, this.dims.h);

		// render (food + player) pieces
		this.food_tiles.concat(this.player.pieces).forEach((piece, i) => {
			this.ctx.fillStyle = piece.color;
			this.ctx.fillRect(
				this.cell_dims.w * piece.x,  // x
				this.cell_dims.h * piece.y,  // y
				this.cell_dims.w,  // w
				this.cell_dims.h // h
			);
		});

		// overlay calming white tint
		this.ctx.globalAlpha = .2;
		this.ctx.fillStyle = "white";
		this.ctx.fillRect(0, 0, this.dims.w, this.dims.h)
		this.ctx.globalAlpha = 1;
	}

	game_over_effect() {
		this.ctx.globalAlpha = .75;
		this.ctx.fillStyle = "black";
		this.ctx.fillRect(0, 0, this.dims.w, this.dims.h)
		this.ctx.globalAlpha = 1;
	}

	async update_loop(body_color = "orange") {
		while (true) {
			// game logic

			// store a cloned version of the pre-moved snake's pieces
			var old_snake_pieces = JSON.parse(JSON.stringify(this.player.pieces));

			if (this.player.move() && !this.player.tail_collision()) {
				// move the body (Snake.move() has already moved the head (which is also part of Snake.pieces btw))
				this.player.pieces.slice(1).forEach((piece, i) => {
					let new_piece = old_snake_pieces[i]
					new_piece.color = body_color;
					this.player.pieces[i + 1] = new_piece;
				});

				// detect eating
				var head = this.player.pieces[0];
				this.food_tiles.forEach((piece, i) => {
					if (piece.x == head.x && piece.y == head.y) {
						// CONSUME (del food piece)
						this.food_tiles.splice(i, 1);

						// add food to body (at position of old snake's last piece, but with a different color)
						let new_piece = old_snake_pieces[old_snake_pieces.length - 1]
						new_piece.color = body_color;
						this.player.pieces.push(new_piece);

						// regen food
						this.place_food()
						// update score
						this.player.score += 1;
						document.getElementById("score").innerHTML = this.player.score;
					}
				});

			}
			else {
				// if it can't move, it's dead
				console.log("game over");
				this.game_over_effect();
				break;
			}

			// render
			this.render();

			// sleep 1 sec
			await new Promise(r => setTimeout(r, 1000));
		}
	}
}

var board = new Board(
	10,
	10,
	document.getElementById("canvas")
);
board.update_loop()
