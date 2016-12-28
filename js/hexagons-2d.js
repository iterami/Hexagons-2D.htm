'use strict';

function check_neighbor_match(position){
    var match = false;
    var next_positions = [
      [-23, -40,],
      [-46, 0,],
      [-23, 40,],
      [23, -40,],
      [46, 0,],
      [23, 40,],
    ];
    next_position_loop:
    for(var next_position in next_positions){
        if(position['y'] % 80){
            next_positions[next_position][0] += 46;
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

function conquer_hexagon(hexagon){
    if(hexagons[hexagon]['color'] !== players[player_ids[turn]]['color']){
        if(hexagons[hexagon]['color'] === settings_settings['default-color']
          || random_boolean()){
            var old_color = hexagons[hexagon]['color'];
            hexagons[hexagon]['color'] = players[player_ids[turn]]['color'];
            players[player_ids[turn]]['hexagons'] += 1;
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
      'color': settings_settings['default-color'],
      'size': size,
      'x': position['x'],
      'y': position['y'],
    });
}

function create_player(properties){
    properties = properties || {};
    properties = {
      'ai': properties['ai'] || false,
      'color': properties['color'] || random_hex(),
      'hexagons': 1,
      'name': '',
    };

    var hexagon = random_integer(hexagons.length);
    while(hexagons[hexagon]['color'] !== settings_settings['default-color']){
        hexagon = random_integer(hexagons.length);
    }
    hexagons[hexagon]['color'] = properties['color'];

    player_ids.push(player_count);
    properties['name'] = (properties['ai']
      ? 'AI'
      : 'P')
      + player_count;
    players[player_count] = properties;
    player_count += 1;
}

function draw_hexagon(x, y, size, color){
    if(y % 80){
        x += 23;
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
    canvas_draw_path(
      vertices,
      {
        'fillStyle': color,
      }
    );
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
    if(!players[player_ids[turn]]['ai']){
        draw_hexagon(
          mouse_x,
          mouse_y,
          30,
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

    // Draw turn.
    canvas_buffer.fillStyle = '#fff';
    canvas_buffer.fillText(
      'Turn: ' + players[player_ids[turn]]['name'],
      0,
      25
    );


    if(player_count === 1){
        canvas_buffer.fillText(
          players[player]['name'] + ' wins!',
          0,
          75
        );
    }

    var x = 50;
    for(var player in scoreboard){
        if(!players[scoreboard[player]['id']]){
            continue;
        }

        canvas_buffer.fillStyle = players[scoreboard[player]['id']]['color'];
        canvas_buffer.fillText(
          players[scoreboard[player]['id']]['name']  + ': ' + scoreboard[player]['hexagons'],
          0,
          x
        );
        x += 25;
    }
}

function end_turn(){
    if(turn >= player_ids.length - 1){
        turn = 0;

    }else{
        turn += 1;
    }

    if(!players[player_ids[turn]]){
        end_turn();
    }
}

function handle_ai_turn(){
    if(!players[player_ids[turn]]['ai']){
        return;
    }

    var options = [];
    for(var hexagon in hexagons){
        if(hexagons[hexagon]['color'] === players[player_ids[turn]]['color']){
            continue;
        }

        if(check_neighbor_match({
          'x': hexagons[hexagon]['x'],
          'y': hexagons[hexagon]['y'],
        })){
            if(hexagons[hexagon]['color'] === settings_settings['default-color']){
                conquer_hexagon(hexagon);
                break;

            }else{
                options.push(hexagon);
            }
        }
    }
    if(options.length > 0){
        var loop_counter = scoreboard.length - 1;
        scoreboard_loop:
        do{
            for(var option in options){
                if(hexagons[options[option]]['color'] === players[scoreboard[loop_counter]['id']]['color']){
                    conquer_hexagon(options[option]);
                    break scoreboard_loop;
                }
            }
        }while(loop_counter--);
    }

    end_turn();
}

function logic(){
    if(canvas_menu){
        return;
    }

    // Move camera down.
    if(key_down){
        camera['y'] -= settings_settings['scroll-speed'];
    }

    // Move camera left.
    if(key_left){
        camera['x'] += settings_settings['scroll-speed'];
    }

    // Move camera right.
    if(key_right){
        camera['x'] -= settings_settings['scroll-speed'];
    }

    // Move camera up.
    if(key_up){
        camera['y'] += settings_settings['scroll-speed'];
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
      'x': Math.ceil((x - 23) / 46) * 46,
      'y': Math.ceil((y - 20) / 40) * 40,
    };
}

function select_y_mod(x, y, move){
    move = move || -23;

    var y_mod = Math.abs(y % 80);
    if(y_mod > 20
      && y_mod < 60){
        x += move;
    }

    return x;
}

function setmode_logic(newgame){
    camera = {
      'x': 0,
      'y': 0,
    };
    hexagons = [];
    player_count = 0;
    player_ids = [];
    players = {};
    scoreboard = [];
    turn = 0;

    // Main menu mode.
    if(canvas_mode === 0){
        document.body.innerHTML = '<div><div><a onclick=canvas_setmode(1,true)>New Game</a></div></div>'
          + '<div class=right><div><input id=camera-keys maxlength=4>Camera ↑←↓→<br>'
          + '<input id=delete-player>Delete Player<br>'
          + '<input id=end-turn-key>End Turn<br>'
          + '<input disabled value=ESC>Menu</div><hr>'
          + '<div><input id=ai>AI<br>'
          + '<input id=default-color>Default Color<br>'
          + '<input id=height>Height<br>'
          + '<input id=hexagons>Hexagons<br>'
          + '<input id=players>Players<br>'
          + '<input id=scroll-speed>Scroll Speed<br>'
          + '<input id=width>Width<br>'
          + '<a onclick=settings_reset()>Reset Settings</a></div></div>';
        settings_update();

    // New game mode.
    }else if(newgame){
        settings_save();

        key_down = false;
        key_left = false;
        key_right = false;
        key_up = false;
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
    scoreboard.sort(function(a, b){
        if(a['hexagons'] > b['hexagons']){
            return -1;
        }
        if(a['hexagons'] < b['hexagons']){
            return 1;
        }
        return 0;
    });
}

var camera = {};
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

window.onload = function(){
    settings_init(
      'Hexagons-2D.htm-',
      {
        'ai': 4,
        'camera-keys': 'WASD',
        'default-color': '#fff',
        'delete-player': 'P',
        'end-turn-key': 'H',
        'height': 500,
        'hexagons': 100,
        'players': 1,
        'scroll-speed': 5,
        'width': 500,
      }
    );
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

        if(key === settings_settings['camera-keys'][1]){
            key_left = true;

        }else if(key === settings_settings['camera-keys'][3]){
            key_right = true;

        }else if(key === settings_settings['camera-keys'][2]){
            key_down = true;

        }else if(key === settings_settings['camera-keys'][0]){
            key_up = true;

        }else if(key === 'Q'){
            canvas_menu_quit();

        }else if(!players[player_ids[turn]]['ai']){
            if(key === settings_settings['end-turn-key']){
                end_turn();

            }else if(key === 'P'){
                if(player_count > 1){
                    for(var hexagon in hexagons){
                        if(!players[player_ids[turn]]){
                            break;
                        }
                        if(hexagons[hexagon]['color'] === players[player_ids[turn]]['color']){
                            hexagons[hexagon]['color'] = settings_settings['default-color'];
                            lose_hexagon(player_ids[turn]);
                        }
                    }
                    end_turn();
                }
            }
        }
    };

    window.onkeyup = function(e){
        var key = String.fromCharCode(e.keyCode || e.which);

        if(key === settings_settings['camera-keys'][1]){
            key_left = false;

        }else if(key === settings_settings['camera-keys'][3]){
            key_right = false;

        }else if(key === settings_settings['camera-keys'][2]){
            key_down = false;

        }else if(key === settings_settings['camera-keys'][0]){
            key_up = false;
        }
    };

    window.onmousedown = function(e){
        if(canvas_mode <= 0
          || players[player_ids[turn]]['ai']){
            return;
        }

        var position = select_hexagon(
          mouse_x,
          mouse_y
        );

        // Check if a hexagon exists at this location.
        var target = false;
        for(var hexagon in hexagons){
            if(hexagons[hexagon]['x'] === position['x']
              && hexagons[hexagon]['y'] === position['y']){
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
