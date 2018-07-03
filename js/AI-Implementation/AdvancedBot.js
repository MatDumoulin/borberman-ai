AdvancedBot = Bot.extend({

    bombsMax: 1, // To change when the ai is improved.
    targetHeuristique: new TargetHeuristique(), // The heuristique used to evaluate which is the best target.

    update: function() {
         if (!this.alive) {
            this.fade();
            return;
        }

        this.wait = false;

        if (!this.started && this.startTimer < this.startTimerMax) {
            this.startTimer++;
            if (this.startTimer >= this.startTimerMax) {
                this.started = true;
            }
            this.animate('idle');
            this.wait = true;
        }

        if (this.targetBitmapPosition.x == this.bmp.x && this.targetBitmapPosition.y == this.bmp.y) {

            // If we bumped into the wood, burn it!
            // If we are near player, kill it!
            if (this.getNearWood() || this.wantKillPlayer()) {
                this.plantBomb();
            }

            // When in safety, wait until explosion
            if (this.bombs.length) {
                if (this.isSafe(this.position)) {
                    this.wait = true;
                }
            }

            if (!this.wait) {
                this.findTargetPosition();
            }
        }

        if (!this.wait) {
            this.moveToTargetPosition();
        }
        this.handleBonusCollision();

        if (this.detectFireCollision()) {
            // Bot has to die
            this.die();
        }

    },

    /**
     * Finds the next tile position where we should move.
     */
    findTargetPosition: function() {
        var target = { x: this.position.x, y: this.position.y };
        target.x += this.dirX;
        target.y += this.dirY;

        var targets = this.getPossibleTargets();
        // Do not go the same way if possible
        if (targets.length > 1) {
            var previousPosition = this.getPreviousPosition();
            for (var i = 0; i < targets.length; i++) {
                var item = targets[i];
                if (item.x == previousPosition.x && item.y == previousPosition.y) {
                    targets.splice(i, 1);
                }
            }
        }
        this.targetPosition = this.getBestTarget(targets);
        if (this.targetPosition && this.targetPosition.x) {
            this.loadTargetPosition(this.targetPosition);
            this.targetBitmapPosition = Utils.convertToBitmapPosition(this.targetPosition);
        }
    },

    /**
     * Moves a step forward to target position.
     */
    moveToTargetPosition: function() {
        this.animate(this.direction);

        var velocity = this.velocity;
        var distanceX = Math.abs(this.targetBitmapPosition.x - this.bmp.x);
        var distanceY = Math.abs(this.targetBitmapPosition.y - this.bmp.y);
        if (distanceX > 0 && distanceX < this.velocity) {
            velocity = distanceX;
        } else if (distanceY > 0 && distanceY < this.velocity) {
            velocity = distanceY;
        }

        var targetPosition = { x: this.bmp.x + this.dirX * velocity, y: this.bmp.y + this.dirY * velocity };
        if (!this.detectWallCollision(targetPosition)) {
            this.bmp.x = targetPosition.x;
            this.bmp.y = targetPosition.y;
        }

        this.updatePosition();
    },

    /**
     * Returns near grass tiles.
     */
    getPossibleTargets: function() {
        var targets = [];
        for (var i = 0; i < 4; i++) {
            var dirX;
            var dirY;
            if (i == 0) { dirX = 1; dirY = 0; }
            else if (i == 1) { dirX = -1; dirY = 0; }
            else if (i == 2) { dirX = 0; dirY = 1; }
            else if (i == 3) { dirX = 0; dirY = -1; }

            var position = { x: this.position.x + dirX, y: this.position.y + dirY };
            if (gGameEngine.getTileMaterial(position) == 'grass' && !this.hasBomb(position)) {
                targets.push(position);
            }
        }

        var safeTargets = [];
        for (var i = 0; i < targets.length; i++) {
            var target = targets[i];
            if (this.isSafe(target)) {
                safeTargets.push(target);
            }
        }

        var isLucky = Math.random() > 0.3;
        return safeTargets.length > 0 && isLucky ? safeTargets : targets;
    },

    /**
     * Returns random item from array.
     */
    getRandomTarget: function(targets) {
        return targets[Math.floor(Math.random() * targets.length)];
    },

    getBestTarget: function(targets) {
        const targetScores = [];
        let currentScore;
        let bestScore = Number.MIN_SAFE_INTEGER;
        let bestTarget = null;

        for( const target of targets) {
            currentScore = this.targetHeuristique.evaluateTarget(gGameEngine, target);
            targetScores.push(currentScore);

            if(currentScore > bestScore) {
                bestScore = currentScore;
                bestTarget = target;
            }
        }

        return bestTarget;
    },

    /**
     * Checks whether player is near. If yes and we are angry, return true.
     */
    wantKillPlayer: function() {
        var isNear = false;

        for (var i = 0; i < 4; i++) {
            var dirX;
            var dirY;
            if (i == 0) { dirX = 1; dirY = 0; }
            else if (i == 1) { dirX = -1; dirY = 0; }
            else if (i == 2) { dirX = 0; dirY = 1; }
            else if (i == 3) { dirX = 0; dirY = -1; }

            var position = { x: this.position.x + dirX, y: this.position.y + dirY };
            for (var j = 0; j < gGameEngine.players.length; j++) {
                var player = gGameEngine.players[j];
                if (player.alive && Utils.comparePositions(player.position, position)) {
                    isNear = true;
                    break;
                }
            }
        }

        var isAngry = Math.random() > 0.5;
        if (isNear && isAngry) {
            return true;
        }
    },

    /**
     * Places the bomb in current position
     */
    plantBomb: function() {
        // Do not place a bomb if there is already a bomb in the current position.
        for (var i = 0; i < gGameEngine.bombs.length; i++) {
            var bomb = gGameEngine.bombs[i];
            if (Utils.comparePositions(bomb.position, this.position)) {
                return;
            }
        }
        // Plant a bomb if I can
        if (this.bombs.length < this.bombsMax) {
            var bomb = new Bomb(this.position, this.bombStrength);
            gGameEngine.stage.addChild(bomb.bmp);
            this.bombs.push(bomb);
            gGameEngine.bombs.push(bomb);

            bomb.setExplodeListener(() =>{
                Utils.removeFromArray(this.bombs, bomb);
                this.wait = false;
            });
        }
    },

    /**
     * Checks whether position is safe and possible explosion cannot kill us.
     */
    isSafe: function(position) {
        for (var i = 0; i < gGameEngine.bombs.length; i++) {
            var bomb = gGameEngine.bombs[i];
            var fires = bomb.getDangerPositions();
            for (var j = 0; j < fires.length; j++) {
                var fire = fires[j];
                if (Utils.comparePositions(fire, position)) {
                    return false;
                }
            }
        }
        return true;
    },
});