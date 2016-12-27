'use strict';

function create_hexagon(x, y, size){
    // Only create a hexagon if one doesn't already exist at this x,y.
    for(var hexagon in hexagons){
        if(hexagons[hexagon]['x'] === x
          && hexagons[hexagon]['y'] === y){
            return;
        }
    }

    hexagons.push({
      'color': settings_settings['default-color'],
      'size': size,
      'x': x,
      'y': y,
    });
}

function create_player(properties){
    properties = properties || {};
    properties = {
      'ai': properties['ai'] || false,
      'color': properties['color'] || random_hex(),
      'hexagons': 1,
    };

    var hexagon = random_integer(hexagons.length);
    while(hexagons[hexagon]['color'] !== settings_settings['default-color']){
        hexagon = random_integer(hexagons.length);
    }
    hexagons[hexagon]['color'] = properties['color'];

    player_ids.push(player_ids.length);
    players[player_ids.length - 1] = properties;
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

    // Draw selection.
    draw_hexagon(
      camera['x'],
      camera['y'],
      30,
      players[player_ids[turn]]['color']
    );

    // Draw hexagons.
    for(var hexagon in hexagons){
        draw_hexagon(
          hexagons[hexagon]['x'],
          hexagons[hexagon]['y'],
          hexagons[hexagon]['size'],
          hexagons[hexagon]['color']
        );
    }

    var x = 25;
    for(var player in players){
        canvas_buffer.fillStyle = players[player]['color'];
        canvas_buffer.fillText(
          (players[player]['ai']
            ? 'AI'
            : ' P')
            + player + ': '
            + players[player]['hexagons']
            + (player == player_ids[turn]
              ? ', TURN'
              : ''),
          0,
          x
        );
        x += 25;
    }

    if(player_ids.length === 1){
        canvas_buffer.fillStyle = '#fff';
        canvas_buffer.fillText(
          'Player ' + player_ids[0] + ' wins!',
          0,
          50
        );
    }
}

function end_turn(){
    if(turn >= player_ids.length - 1){
        turn = 0;

    }else{
        turn += 1;
    }
}

function handle_ai(){
    for(var player in players){
        if(!players[player]['ai']){
            continue;
        }

        for(var hexagon in hexagons){
            if(hexagons[hexagon]['color'] !== players[player]['color']){
                continue;
            }
        }
    }
}

function logic(){
    if(canvas_menu){
        return;
    }

    //handle_ai();
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
    hexagons = [];
    player_ids = [];
    players = {};
    turn = 0;

    // Main menu mode.
    if(canvas_mode === 0){
        document.body.innerHTML = '<div><div><a onclick=canvas_setmode(1,true)>New Game</a></div></div>'
          + '<div class=right><div><input disabled value=ESC>Menu<br>'
          + '<input id=end-turn-key>End Turn</div><hr>'
          + '<div><input id=ai>AI<br>'
          + '<input id=default-color>Default Color<br>'
          + '<input id=height>Height<br>'
          + '<input id=hexagons>Hexagons<br>'
          + '<input id=players>Players<br>'
          + '<div><input id=width>Width<br>'
          + '<a onclick=settings_reset()>Reset Settings</a></div></div>';
        settings_update();

    // New game mode.
    }else if(newgame){
        settings_save();
    }
}

var camera = {};
var hexagons = [];
var player_ids = [];
var players = {};
var turn = 0;

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

    if(key === settings_settings['end-turn-key']){
        end_turn();

    }else if(key === 'Q'){
        canvas_menu_quit();
    }
};

window.onmousedown = function(e){
    if(canvas_mode <= 0){
        return;
    }

    var position = select_hexagon(
      camera['x'],
      camera['y']
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
    var next = false;
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
        if(camera['y'] % 80){
            next_positions[next_position][0] += 46;
        }

        var new_next_position = select_hexagon(
          select_y_mod(
            hexagons[target]['x'] + next_positions[next_position][0],
            hexagons[target]['y'] + next_positions[next_position][1]
          ),
          hexagons[target]['y'] + next_positions[next_position][1]
        );
        for(hexagon in hexagons){
            if(hexagons[hexagon]['x'] === new_next_position['x']
              && hexagons[hexagon]['y'] === new_next_position['y']
              && hexagons[hexagon]['color'] === players[player_ids[turn]]['color']){
                next = true;
                break next_position_loop;
            }
        }
    }
    if(next === false){
        return;
    }

    // Attempt to conquer the hexagon.
    if(hexagons[target]['color'] !== players[player_ids[turn]]['color']){
        if(hexagons[target]['color'] === settings_settings['default-color']
          || random_boolean()){
            var old_color = hexagons[target]['color'];
            hexagons[target]['color'] = players[player_ids[turn]]['color'];
            players[player_ids[turn]]['hexagons'] += 1;
            for(var player in players){
                if(old_color === players[player]['color']){
                    players[player]['hexagons'] -= 1;
                    if(players[player]['hexagons'] <= 0){
                        for(var id in player_ids){
                            if(player_ids[id] == player){
                                player_ids.splice(
                                  id,
                                  1
                                );
                                break;
                            }
                        }
                        delete players[player];
                    }
                    break;
                }
            }
        }

        end_turn();
    }
};

window.onmousemove = function(e){
    var mouse_x = e.pageX - canvas_x;
    var mouse_y = e.pageY - canvas_y;
    camera = select_hexagon(
      select_y_mod(
        mouse_x,
        mouse_y
      ),
      mouse_y
    );
};

window.onload = function(){
    settings_init(
      'Hexagons-2D.htm-',
      {
        'ai': 4,
        'default-color': '#fff',
        'end-turn-key': 'H',
        'height': 500,
        'hexagons': 100,
        'players': 1,
        'width': 500,
      }
    );
    canvas_init();
};
