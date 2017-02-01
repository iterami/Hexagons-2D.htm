'use strict';

function check_neighbor_match(position){
    var match = false;
    var next_positions = [
      [-x_scaled_half, -y_scaled,],
      [-x_scaled, 0,],
      [-x_scaled_half, y_scaled,],
      [x_scaled_half, -y_scaled,],
      [x_scaled, 0,],
      [x_scaled_half, y_scaled,],
    ];
    next_position_loop:
    for(var next_position in next_positions){
        if(position['y'] % y_scaled_double){
            next_positions[next_position][0] += x_scaled;
        }

        var new_next_position = select_hexagon(
          select_y_mod(
            position['x'] + next_positions[next_position][0],
            position['y'] + next_positions[next_position][1]
          ),
          position['y'] + next_positions[next_position][1]
        );
        for(var hexagon in hexagons){
            if(hexagons[hexagon]['x'] === new_next_position['x']
              && hexagons[hexagon]['y'] === new_next_position['y']
              && hexagons[hexagon]['color'] === players[player_ids[turn]]['color']){
                match = true;
                break next_position_loop;
            }
        }
    }

    return match;
}

function conquer_hexagon(hexagon, playerid){
    playerid = playerid || player_ids[turn];

    if(hexagons[hexagon]['color'] !== players[playerid]['color']){
        if(hexagons[hexagon]['color'] === storage_data['default-color']){
            hexagons[hexagon]['color'] = players[playerid]['color'];
            players[playerid]['hexagons'] += 1;
            unclaimed -= 1;

        }else if(random_boolean()){
            var old_color = hexagons[hexagon]['color'];
            hexagons[hexagon]['color'] = players[playerid]['color'];
            players[playerid]['hexagons'] += 1;
            for(var player in players){
                if(old_color === players[player]['color']){
                    lose_hexagon(player);
                    break;
                }
            }
        }
    }
}

function create_hexagon(position, size){
    // Only create a hexagon if one doesn't already exist at this x,y.
    for(var hexagon in hexagons){
        if(hexagons[hexagon]['x'] === position['x']
          && hexagons[hexagon]['y'] === position['y']){
            return;
        }
    }

    hexagons.push({
      'color': storage_data['default-color'],
      'size': size,
      'x': position['x'],
      'y': position['y'],
    });
    unclaimed = hexagons.length;
}

function create_player(properties){
    if(player_count > hexagons.length - 1){
        return;
    }

    properties = properties || {};
    properties = {
      'ai': properties['ai'] || false,
      'color': properties['color'] || random_hex(),
      'done': false,
      'hexagons': 0,
      'name': '',
    };
    properties['name'] = (properties['ai']
      ? 'AI'
      : 'P')
      + properties['color'];

    players[player_count] = properties;
    player_ids.push(player_count);

    var hexagon = random_integer({
      'max': hexagons.length,
    });
    while(hexagons[hexagon]['color'] !== storage_data['default-color']){
        hexagon = random_integer({
          'max': hexagons.length,
        });
    }
    conquer_hexagon(
      hexagon,
      player_count
    );

    player_count += 1;
}

function draw_hexagon(x, y, size, color){
    if(y % Math.floor(storage_data['hexagon-size'] * 3.2)){
        x += x_scaled_half;
    }

    var vertices = [];
    for(var i = 0; i < 6; i++){
        var angle = math_degrees_to_radians({
          'degrees': 30 + i * 60,
        });
        vertices.push({
          'type': i === 0
            ? 'moveTo'
            : 'lineTo',
          'x': x + Math.cos(angle) * size + canvas_x,
          'y': y + Math.sin(angle) * size + canvas_y,
        });
    }
    canvas_draw_path({
      'properties': {
        'fillStyle': color,
      },
      'vertices': vertices,
    });
}

function draw_logic(){
    // Save the current buffer state.
    canvas_buffer.save();

    // Translate to camera position.
    canvas_buffer.translate(
      camera['x'],
      camera['y']
    );

    // Draw selection if not AI turn.
    if(players[player_ids[turn]]
      && players[player_ids[turn]]['ai'] === false){
        draw_hexagon(
          mouse_x,
          mouse_y,
          storage_data['hexagon-size'] + 5,
          players[player_ids[turn]]['color']
        );
    }

    // Draw hexagons.
    for(var hexagon in hexagons){
        draw_hexagon(
          hexagons[hexagon]['x'],
          hexagons[hexagon]['y'],
          hexagons[hexagon]['size'],
          hexagons[hexagon]['color']
        );
    }

    // Restore the buffer state.
    canvas_buffer.restore();

    var x = 25;

    // Draw turn info.
    if(players[player_ids[turn]]){
        canvas_buffer.fillStyle = '#fff';
        canvas_buffer.fillText(
          'Turn #' + turns + '/' + storage_data['turn-limit'] + ' ' + players[player_ids[turn]]['name'],
          0,
          x
        );
        x += 25;
    }

    if(unclaimed > 0){
        // Draw unclaimed hexagons.
        canvas_buffer.fillStyle = storage_data['default-color'],
        canvas_buffer.fillText(
          'Unclaimed:' + unclaimed,
          0,
          x
        );
        x += 25;
    }

    // Draw scoreboard.
    for(var player in scoreboard){
        if(!players[scoreboard[player]['id']]){
            continue;
        }

        canvas_buffer.fillStyle = players[scoreboard[player]['id']]['color'];
        canvas_buffer.fillText(
          players[scoreboard[player]['id']]['name']
            + (players[scoreboard[player]['id']]['done']
              ? '='
              : ':')
            + scoreboard[player]['hexagons'],
          0,
          x
        );
        x += 25;
    }

    // Draw winner.
    if(game_over){
        canvas_buffer.fillStyle = players[scoreboard[0]['id']]['color'];
        canvas_buffer.fillText(
          players[scoreboard[0]['id']]['name'] + ' wins!',
          0,
          x
        );
    }
}

function end_turn(){
    var over = true;
    for(var player in players){
        if(!players[player]['done']){
            over = false;
            break;
        }
    }
    if(over
      || turns >= storage_data['turn-limit']){
        game_over = true;
    }

    if(turn >= player_ids.length - 1){
        turn = 0;

    }else{
        turn += 1;
    }

    if(!players[player_ids[turn]]){
        end_turn();

    }else{
        turns += 1;
    }
}

function handle_ai_turn(){
    if(!players[player_ids[turn]]
      || !players[player_ids[turn]]['ai']
      || game_over){
        return;
    }

    var options = [];
    var options_used = true;
    for(var hexagon in hexagons){
        if(hexagons[hexagon]['color'] === players[player_ids[turn]]['color']){
            continue;
        }

        if(check_neighbor_match({
          'x': hexagons[hexagon]['x'],
          'y': hexagons[hexagon]['y'],
        })){
            if(hexagons[hexagon]['color'] === storage_data['default-color']){
                conquer_hexagon(hexagon);
                options_used = false;
                break;

            }else{
                options.push(hexagon);
            }
        }
    }
    if(options_used){
        if(options.length > 0){
            sort_random({
              'array': options,
            });
            scoreboard_loop:
            for(var i = scoreboard.length; i--;){
                if(!players[scoreboard[i]['id']]){
                    continue;
                }

                for(var option in options){
                    if(hexagons[options[option]]['color'] === players[scoreboard[i]['id']]['color']){
                        conquer_hexagon(options[option]);
                        break scoreboard_loop;
                    }
                }
            }

        }else{
            players[player_ids[turn]]['done'] = true;
        }
    }

    end_turn();
}

function logic(){
    // Move camera down.
    if(key_down
      && camera['y'] > -height_half){
        camera['y'] -= storage_data['scroll-speed'];
    }

    // Move camera left.
    if(key_left
      && camera['x'] < width_half){
        camera['x'] += storage_data['scroll-speed'];
    }

    // Move camera right.
    if(key_right
      && camera['x'] > -width_half){
        camera['x'] -= storage_data['scroll-speed'];
    }

    // Move camera up.
    if(key_up
      && camera['y'] < height_half){
        camera['y'] += storage_data['scroll-speed'];
    }

    if(canvas_menu){
        return;
    }

    handle_ai_turn();
    update_scoreboard();
}

function lose_hexagon(player){
    players[player]['hexagons'] -= 1;
    if(players[player]['hexagons'] <= 0){
        delete players[player];
        player_count -= 1;
    }
}

function select_hexagon(x, y){
    return {
      'x': Math.ceil((x - x_scaled_half) / x_scaled) * x_scaled,
      'y': Math.ceil((y - y_scaled_half) / y_scaled) * y_scaled,
    };
}

function select_y_mod(x, y, move){
    move = move || -(x_scaled_half);

    var y_mod = Math.abs(y % y_scaled_double);
    if(y_mod > y_scaled_half
      && y_mod < y_scaled * 1.5){
        x += move;
    }

    return x;
}

function setmode_logic(newgame){
    camera = {
      'x': 0,
      'y': 0,
    };
    game_over = false;
    hexagons = [];
    player_count = 0;
    player_ids = [];
    players = {};
    scoreboard = [];
    turn = 0;
    turns = 0;
    unclaimed = 0;

    // Main menu mode.
    if(canvas_mode === 0){
        document.body.innerHTML = '<div><div><a onclick=canvas_setmode({mode:1,newgame:true})>New Game</a></div></div>'
          + '<div class=right><div><input id=camera-keys maxlength=4>Camera ↑←↓→<br>'
          + '<input id=delete-player>Delete Player<br>'
          + '<input id=end-turn-key>End Turn<br>'
          + '<input disabled value=ESC>Menu</div><hr>'
          + '<div><input id=ai>AI<br>'
          + '<input id=default-color type=color>Default Color<br>'
          + '<input id=height>Height<br>'
          + '<input id=hexagons>Hexagons<br>'
          + '<input id=hexagon-size>Hexagon Size<br>'
          + '<input id=ms-per-frame>ms/Frame<br>'
          + '<input id=players>Players<br>'
          + '<input id=scroll-speed>Scroll Speed<br>'
          + '<input id=turn-limit>Turn Limit<br>'
          + '<input id=width>Width<br>'
          + '<a onclick=storage_reset()>Reset Settings</a></div></div>';
        storage_update();

    // New game mode.
    }else if(newgame){
        storage_save();
        canvas_interval_ms = storage_data['ms-per-frame'];

        key_down = false;
        key_left = false;
        key_right = false;
        key_up = false;

        x_scaled = storage_data['hexagon-size'] * 1.84;
        x_scaled_half = x_scaled / 2;
        y_scaled = storage_data['hexagon-size'] * 1.6;
        y_scaled_double = y_scaled * 2;
        y_scaled_half = y_scaled / 2;

        height_half = storage_data['height'] / 2;
        width_half = storage_data['width'] / 2;
    }
}

function update_scoreboard(){
    scoreboard = [];
    for(var player in players){
        scoreboard.push({
          'hexagons': players[player]['hexagons'],
          'id': player,
        });
    }
    sort_property({
      'array': scoreboard,
      'property': 'hexagons',
      'reverse': true,
    });
}

var camera = {};
var game_over = false;
var height_half = 0;
var hexagons = [];
var key_down = false;
var key_left = false;
var key_right = false;
var key_up = false;
var mouse_x = 0;
var mouse_y = 0;
var player_count = 0;
var player_ids = [];
var players = {};
var scoreboard = [];
var turn = 0;
var turns = 0;
var unclaimed = 0;
var width_half = 0;
var x_scaled = 0;
var x_scaled_half = 0;
var y_scaled = 0;
var y_scaled_double = 0;
var y_scaled_half = 0;

window.onload = function(){
    storage_init({
      'data': {
        'ai': 4,
        'camera-keys': 'WASD',
        'default-color': '#ffffff',
        'delete-player': 'P',
        'end-turn-key': 'H',
        'height': 500,
        'hexagon-size': 25,
        'hexagons': 150,
        'ms-per-frame': 1,
        'players': 1,
        'scroll-speed': 5,
        'turn-limit': Infinity,
        'width': 500,
      },
      'prefix': 'Hexagons-2D.htm-',
    });
    canvas_init();

    window.onkeydown = function(e){
        if(canvas_mode <= 0){
            return;
        }

        var key = e.keyCode || e.which;

        // ESC: return to main menu.
        if(key === 27){
            canvas_menu_toggle();
            return;
        }

        key = String.fromCharCode(key);

        if(key === storage_data['camera-keys'][1]){
            key_left = true;

        }else if(key === storage_data['camera-keys'][3]){
            key_right = true;

        }else if(key === storage_data['camera-keys'][2]){
            key_down = true;

        }else if(key === storage_data['camera-keys'][0]){
            key_up = true;

        }else if(key === 'Q'){
            canvas_menu_quit();

        }else if(players[player_ids[turn]]
          && !players[player_ids[turn]]['ai']){
            if(key === storage_data['end-turn-key']){
                end_turn();

            }else if(key === storage_data['delete-player']){
                if(!game_over){
                    for(var hexagon in hexagons){
                        if(!players[player_ids[turn]]){
                            break;
                        }
                        if(hexagons[hexagon]['color'] === players[player_ids[turn]]['color']){
                            hexagons[hexagon]['color'] = storage_data['default-color'];
                            lose_hexagon(player_ids[turn]);
                            unclaimed += 1;
                        }
                    }
                    end_turn();
                }
            }
        }
    };

    window.onkeyup = function(e){
        var key = String.fromCharCode(e.keyCode || e.which);

        if(key === storage_data['camera-keys'][1]){
            key_left = false;

        }else if(key === storage_data['camera-keys'][3]){
            key_right = false;

        }else if(key === storage_data['camera-keys'][2]){
            key_down = false;

        }else if(key === storage_data['camera-keys'][0]){
            key_up = false;
        }
    };

    window.onmousedown = function(e){
        if(canvas_mode <= 0
          || !players[player_ids[turn]]
          || players[player_ids[turn]]['ai']){
            return;
        }

        var position = select_hexagon(
          mouse_x,
          mouse_y
        );

        // Check if a hexagon exists at this location
        //   with a different color.
        var target = false;
        for(var hexagon in hexagons){
            if(hexagons[hexagon]['x'] === position['x']
              && hexagons[hexagon]['y'] === position['y']
              && hexagons[hexagon]['color'] !== players[player_ids[turn]]['color']){
                target = hexagon;
                break;
            }
        }
        if(target === false){
            return;
        }

        // Check if current player has a hexagon next to target hexagon.
        if(!check_neighbor_match({
          'x': hexagons[target]['x'],
          'y': hexagons[target]['y'],
        })){
            return;
        }

        // Attempt to conquer the hexagon.
        conquer_hexagon(hexagon);

        end_turn();
    };

    window.onmousemove = function(e){
        var x = e.pageX - canvas_x - camera['x'];
        var y = e.pageY - canvas_y - camera['y'];
        var position = select_hexagon(
          select_y_mod(
            x,
            y
          ),
          y
        );
        mouse_x = position['x'];
        mouse_y = position['y'];
    };
};
