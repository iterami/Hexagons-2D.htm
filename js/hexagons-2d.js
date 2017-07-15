'use strict';

function check_done(id){
    var options = [];

    for(var hexagon in hexagons){
        if(hexagons[hexagon]['color'] === players[id]['color']){
            continue;
        }

        if(check_neighbor_match({
          'x': hexagons[hexagon]['x'],
          'y': hexagons[hexagon]['y'],
        })){
            if(hexagons[hexagon]['color'] === core_storage_data['default-color']){
                return hexagon;

            }else{
                options.push(hexagon);
            }
        }
    }

    if(options.length > 0){
        sort_random({
          'array': options,
        });
        for(var i = scoreboard.length; i--;){
            if(!players[scoreboard[i]['id']]){
                continue;
            }

            for(var option in options){
                if(hexagons[options[option]]['color'] === players[scoreboard[i]['id']]['color']){
                    return options[option];
                }
            }
        }

    }else{
        players[id]['done'] = true;
    }

    return false;
}

function check_neighbor_match(position){
    var next_positions = [
      [-x_scaled_half, -y_scaled,],
      [-x_scaled, 0,],
      [-x_scaled_half, y_scaled,],
      [x_scaled_half, -y_scaled,],
      [x_scaled, 0,],
      [x_scaled_half, y_scaled,],
    ];
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
                return true;
            }
        }
    }

    return false;
}

function conquer_hexagon(hexagon, playerid){
    playerid = playerid || player_ids[turn];

    if(hexagons[hexagon]['color'] !== players[playerid]['color']){
        if(hexagons[hexagon]['color'] === core_storage_data['default-color']){
            hexagons[hexagon]['color'] = players[playerid]['color'];
            players[playerid]['hexagons'] += 1;
            unclaimed -= 1;

        }else if(core_random_boolean()){
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
      'color': core_storage_data['default-color'],
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
      'color': properties['color'] || '#' + core_random_hex(),
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

    var hexagon = core_random_integer({
      'max': hexagons.length,
    });
    while(hexagons[hexagon]['color'] !== core_storage_data['default-color']){
        hexagon = core_random_integer({
          'max': hexagons.length,
        });
    }
    conquer_hexagon(
      hexagon,
      player_count
    );

    check_done(player_count);
    player_count += 1;
}

function draw_hexagon(x, y, size, color){
    if(y % hexagon_size){
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
      && players[player_ids[turn]]['ai'] === false
      && !players[player_ids[turn]]['done']){
        draw_hexagon(
          core_mouse['x'],
          core_mouse['y'],
          core_storage_data['hexagon-size'] + 5,
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

    var x = 75;

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
      || turns >= core_storage_data['turn-limit']){
        game_over = true;
        return;
    }

    if(turn >= player_ids.length - 1){
        turn = 0;

    }else{
        turn += 1;
    }

    if(!players[player_ids[turn]]){
        end_turn();

    }else{
        input_required = !players[player_ids[turn]]['ai'];
        turns += 1;
    }
}

function handle_turn(){
    if(!players[player_ids[turn]]
      || (input_required && !players[player_ids[turn]]['done'])
      || game_over){
        return;
    }

    if(!players[player_ids[turn]]['done']){
        var target = check_done(player_ids[turn]);
        if(players[player_ids[turn]]['ai']
          && target !== false){
            conquer_hexagon(target);
        }
    }

    end_turn();
}

function logic(){
    // Move camera left.
    if(core_keys[65]['state']
      && camera['x'] < width_half){
        camera['x'] += core_storage_data['scroll-speed'];
    }

    // Move camera right.
    if(core_keys[68]['state']
      && camera['x'] > -width_half){
        camera['x'] -= core_storage_data['scroll-speed'];
    }

    // Move camera down.
    if(core_keys[83]['state']
      && camera['y'] > -height_half){
        camera['y'] -= core_storage_data['scroll-speed'];
    }

    // Move camera up.
    if(core_keys[87]['state']
      && camera['y'] < height_half){
        camera['y'] += core_storage_data['scroll-speed'];
    }

    handle_turn();
    update_scoreboard();

    core_ui_update({
      'ids': {
        'turn': turns + turn_limit_string + ' ' + players[player_ids[turn]]['name'],
        'unclaimed': unclaimed,
      },
    });
}

function lose_hexagon(player){
    players[player]['hexagons'] -= 1;
    if(players[player]['hexagons'] <= 0){
        delete players[player];
        player_count -= 1;
    }
}

function repo_init(){
    core_repo_init({
      'info': '<input onclick=canvas_setmode({newgame:true}) type=button value="Start New Game">',
      'keybinds': {
        65: {},
        68: {},
        72: {
          'todo': function(){
              if(players[player_ids[turn]]
                && !players[player_ids[turn]]['ai']){
                  input_required = false;
                  end_turn();
              }
          },
        },
        80: {
          'todo': function(){
              if(!game_over
                && players[player_ids[turn]]
                && !players[player_ids[turn]]['ai']){
                  for(var hexagon in hexagons){
                      if(!players[player_ids[turn]]){
                          break;
                        }
                      if(hexagons[hexagon]['color'] === players[player_ids[turn]]['color']){
                          hexagons[hexagon]['color'] = core_storage_data['default-color'];
                          lose_hexagon(player_ids[turn]);
                          unclaimed += 1;
                      }
                  }
                  for(var player in players){
                      players[player]['done'] = false;
                  }
                  input_required = false;
                  end_turn();
              }
          },
        },
        83: {},
        87: {},
      },
      'menu': true,
      'mousebinds': {
        'mousedown': {
          'todo': function(event){
              if(!players[player_ids[turn]]
                || players[player_ids[turn]]['ai']){
                  return;
              }

              var position = select_hexagon(
                core_mouse['x'],
                core_mouse['y']
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

              input_required = false;
          },
        },
        'mousemove': {
          'todo': function(){
              var x = core_mouse['x'] - canvas_x - camera['x'];
              var y = core_mouse['y'] - canvas_y - camera['y'];
              var position = select_hexagon(
                select_y_mod(
                  x,
                  y
                ),
                y
              );
              core_mouse['x'] = position['x'];
              core_mouse['y'] = position['y'];
          },
        },
      },
      'storage': {
        'ai': 4,
        'default-color': '#ffffff',
        'height': 500,
        'hexagon-size': 25,
        'hexagons': 150,
        'players': 1,
        'scroll-speed': 5,
        'turn-limit': Infinity,
        'width': 500,
      },
      'storage-menu': '<table><tr><td><input id=ai><td>AI<tr><td><input id=default-color type=color><td>Default Color<tr><td><input id=height><td>Height<tr><td><input id=hexagons><td>Hexagons<tr><td><input id=hexagon-size><td>Hexagon Size<tr><td><input id=players><td>Players<tr><td><input id=scroll-speed><td>Scroll Speed<tr><td><input id=turn-limit><td>Turn Limit<tr><td><input id=width><td>Width</table>',
      'title': 'Hexagons-2D.htm',
      'ui': 'Turn: <span id=ui-turn></span><br>Unclaimed: <span id=ui-unclaimed></span>',
    });
    canvas_init();
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
var hexagon_size = 0;
var hexagons = [];
var input_required = false;
var player_count = 0;
var player_ids = [];
var players = {};
var scoreboard = [];
var turn = 0;
var turn_limit_string = '';
var turns = 0;
var unclaimed = 0;
var width_half = 0;
var x_scaled = 0;
var x_scaled_half = 0;
var y_scaled = 0;
var y_scaled_double = 0;
var y_scaled_half = 0;
